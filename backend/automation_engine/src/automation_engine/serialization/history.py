from __future__ import annotations


class HistoryRenderer:
    """Renders past test actions into a compact LLM-friendly summary."""

    def __init__(self, include_status: bool = False, include_error: bool = True, max_actions: int | None = None) -> None:
        self._include_status = include_status
        self._include_error = include_error
        self._max_actions = max_actions

    def render_history(self, run) -> str:
        steps = run.current_group.steps if run.current_group else []
        if not steps:
            return "No actions taken yet."

        if self._max_actions is not None:
            steps = steps[-self._max_actions:]

        header = f"Previous {len(steps)} action(s) (oldest → newest):"
        body = "\n".join(self._render_step(s) for s in steps)
        return f"{header}\n{body}"

    def _render_step(self, step) -> str:
        parts: list[str] = [f"  {step.index}."]

        if self._include_status and step.status:
            parts.append(f"[{step.status.upper()}]")

        parts.append(step.action.action_type)
        parts.append("—")
        parts.append(step.action.recreation_prompt)

        if self._include_error and step.error_message:
            parts.append(f"⚠ {step.error_message}")

        return " ".join(parts)
