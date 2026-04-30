import asyncio
from typing import AsyncGenerator, Callable, Any, Awaitable
import json
from functools import lru_cache

import redis.asyncio as aredis
import redis

from src.config import settings
from src.runs.models import Scope

# async for fastapi
@lru_cache
def get_aredis_client() -> aredis.Redis:
    return aredis.Redis.from_url(
        settings.REDIS_STREAM,
    )

# sync for celery
@lru_cache
def get_redis_client() -> redis.Redis:
    return redis.Redis.from_url(
        settings.REDIS_STREAM,
    )

def _get_abort_key(abort_id: str | int):
    return f"aborted:{str(abort_id)}"

def get_stream_key(scope: Scope, run_id: int) -> str:
    return f"runs:{scope.value.lower()}:{run_id}"

async def abort_async(abort_id: str | int, ttl_seconds: int = 3600) -> None:
    abort_key = _get_abort_key(abort_id)
    await get_aredis_client().set(abort_key, 1, ex=ttl_seconds)

def abort(abort_id: str | int, ttl_seconds: int = 3600) -> None:
    abort_key = _get_abort_key(abort_id)
    get_redis_client().set(abort_key, 1, ex=ttl_seconds)

def is_aborted(abort_id: str | int) -> bool:
    abort_key = _get_abort_key(abort_id)
    return bool(get_redis_client().exists(abort_key))

async def is_aborted_async(abort_id: str | int) -> bool:
    abort_key = _get_abort_key(abort_id)
    return bool( await get_aredis_client().exists(abort_key) )

def stream_event(key: str, *, event: str, event_type: str, **kwargs):
    get_redis_client().xadd(key, 
        {
            'event': event, 
            'type': event_type, 
            **{k: str(v) for k, v in kwargs.items()}
        }
    )

async def stream_event_async(key: str, *, event: str, event_type: str, **kwargs):
    await get_aredis_client().xadd(key, 
        {
            'event': event, 
            'type': event_type, 
            **{k: str(v) for k, v in kwargs.items()}
        }
    )

def cleanup_stream(key: str) -> None:
    get_redis_client().delete(key)


def decode_message(bmsg_id, bfields):
    data = {}

    for k, v in bfields.items():
        key = k.decode()
        val = v.decode() if isinstance(v, bytes) else v
        if isinstance(val, str):
            try:
                val = json.loads(val)
            except (json.JSONDecodeError, ValueError):
                pass
        data[key] = val

    return bmsg_id.decode(), data


async def sse_read_stream(
    stream_key: str,
    last_event_id: str,
    is_disconnected: Callable[[], Awaitable[bool]],
    stop_predicate: Callable[[dict[str, Any]], bool],
    idle_timeout_ms: int = 60_000,
    block_ms: int = 60_000,
    heartbeat_ms: int = 15_000,
    messages_per_read: int = 30
) -> AsyncGenerator[str, None]:
    """Yields SSE-formatted strings consumed from a Redis Stream."""

    loop = asyncio.get_running_loop()
    idle_deadline = loop.time() + idle_timeout_ms / 1000
    next_heartbeat_time = loop.time() + heartbeat_ms / 1000

    redis_client = get_aredis_client()

    while True:
        now = loop.time()

        # client disconnected
        if await is_disconnected():
            return

        # timeout
        if now >= idle_deadline:
            yield "event: timeout\ndata: {}\n\n"
            return

        # heartbeat
        if now >= next_heartbeat_time:
            yield ": keep-alive\n\n" # SSE comment; ignored by clients
            next_heartbeat_time = now + heartbeat_ms / 1000

        # read stream
        ms_to_heartbeat = int((next_heartbeat_time - now) * 1000)
        ms_to_timeout = int((idle_deadline - now) * 1000)
        effective_block = min(block_ms, max(ms_to_heartbeat, 1), max(ms_to_timeout, 1))

        try:
            results: list = await redis_client.xread(
                {stream_key: last_event_id},
                count=messages_per_read,
                block=effective_block,
            )
        except redis.RedisError as exc:
            yield "event: error\ndata: {}\n\n"
            return

        if not results:
            # XREAD timed out — loop back and re-check idle / heartbeat
            continue

        # results shape: [(stream_key_bytes, [(id, {field: value}), ...]), ...]
        for _, messages in results:
            for bmsg_id, bfields in messages:
                print(bfields)
                idle_deadline = loop.time() + idle_timeout_ms / 1000
                msg_id, payload = decode_message(bmsg_id, bfields)
                last_event_id = msg_id
                

                yield f"id: {msg_id}\nevent: message\ndata: {json.dumps(payload)}\n\n"

                if stop_predicate(payload):
                    yield "event: done\ndata: {}\n\n"
                    return