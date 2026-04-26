from __future__ import annotations

import hashlib
import json
import logging
from collections import deque

from automation_engine.pipeline.context import (
    CompiledAction,
    IterationContext,
    IterationStatus,
)

logger = logging.getLogger(__name__)


class StuckDetectionStep:
    """
    Detects if the agent is stuck by fingerprinting each individual
    (page state + compiled action) pair and checking for sequential
    repetition or cyclic patterns in the flat action stream.
    """

    name = "stuck_detection"

    def __init__(
        self,
        max_sequential_repeats: int = 3,
        max_cycle_length: int = 4,
        cycle_repeats: int = 2,
    ) -> None:
        self._max_sequential_repeats = max_sequential_repeats
        self._max_cycle_length = max_cycle_length
        self._cycle_repeats = cycle_repeats

        buffer_size = max(max_sequential_repeats, max_cycle_length * cycle_repeats)
        self._history: deque[str] = deque(maxlen=buffer_size)

    async def run(self, ctx: IterationContext) -> IterationContext:
        if ctx.status != IterationStatus.CONTINUE:
            return ctx

        page_hash = self._hash_page(ctx)
        fingerprints: list[str] = []

        for compiled in ctx.compiled_actions:
            fp = self._compute_fingerprint(page_hash, compiled)
            fingerprints.append(fp)

            # Check after adding each action
            reason = self._detect(fingerprints)
            if reason:
                logger.warning(f"Agent stuck: {reason}")
                ctx.status = IterationStatus.ERROR
                ctx.error_message = f"Agent stuck: {reason}"
                return ctx

        self._history.extend(fingerprints)
        return ctx

    @staticmethod
    def _hash_page(ctx: IterationContext) -> bytes:
        if ctx.model_state and ctx.model_state.page:
            return ctx.model_state.page.encode()
        return b""

    @staticmethod
    def _compute_fingerprint(page_bytes: bytes, compiled: CompiledAction) -> str:
        hasher = hashlib.sha256()
        hasher.update(page_bytes)

        action_dict = compiled.raw_executable.model_dump()
        action_bytes = json.dumps(action_dict, sort_keys=True).encode()
        hasher.update(action_bytes)

        return hasher.hexdigest()

    def _detect(self, pending: list[str]) -> str | None:
        sequence = list(self._history) + pending

        reason = self._detect_sequential(sequence)
        if reason:
            return reason

        return self._detect_cycle(sequence)

    def _detect_sequential(self, sequence: list[str]) -> str | None:
        """Same fingerprint N times in a row."""
        n = self._max_sequential_repeats
        if len(sequence) < n:
            return None

        tail = sequence[-n:]
        if len(set(tail)) == 1:
            return (
                f"Same action repeated {n} times "
                f"on the same page state"
            )

        return None

    def _detect_cycle(self, sequence: list[str]) -> str | None:
        """A sequence of K fingerprints repeated `cycle_repeats` times."""
        for k in range(2, self._max_cycle_length + 1):
            window = k * self._cycle_repeats
            if len(sequence) < window:
                continue

            tail = sequence[-window:]
            chunk = tail[:k]

            if all(
                tail[i * k : (i + 1) * k] == chunk
                for i in range(1, self._cycle_repeats)
            ):
                return (
                    f"Cycle of length {k} repeated {self._cycle_repeats} times: "
                    f"agent is looping"
                )

        return None

    def reset(self) -> None:
        """Clear history between groups / instructions."""
        self._history.clear()
