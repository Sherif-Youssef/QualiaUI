import pytest
import asyncio

from automation_engine import (
    FillExec,
    ClickExec,
    WaitingExec,
)
from src.runs.active.test_job import TestJob


SAUCE_URL = "https://www.saucedemo.com/"

_LOGIN_ACTIONS = [
    FillExec(target_selector="input#user-name", value="standard_user", clear_first=True),
    FillExec(target_selector="input#password", value="secret_sauce", clear_first=True),
    ClickExec(target_selector="input#login-button", button="left", click_count=1, modifiers=None),
]

_CHECKOUT_ACTIONS = [
    FillExec(target_selector="input#user-name", value="standard_user", clear_first=True),
    FillExec(target_selector="input#password", value="secret_sauce", clear_first=True),
    ClickExec(target_selector="input#login-button", button="left", click_count=1, modifiers=None),
    WaitingExec(timeout=1000),
    ClickExec(target_selector="button#add-to-cart-sauce-labs-bike-light", button="left", click_count=1, modifiers=None),
    ClickExec(target_selector="div#shopping_cart_container > a:nth-of-type(1)", button="left", click_count=1, modifiers=None),
    ClickExec(target_selector="button#checkout", button="left", click_count=1, modifiers=None),
    FillExec(target_selector="input#first-name", value="Jamie", clear_first=True),
    FillExec(target_selector="input#last-name", value="Morrison", clear_first=True),
    FillExec(target_selector="input#postal-code", value="94107", clear_first=True),
    ClickExec(target_selector="input#continue", button="left", click_count=1, modifiers=None),
    ClickExec(target_selector="button#finish", button="left", click_count=1, modifiers=None),
]

_SLOW_ACTIONS = [
    FillExec(target_selector="input#user-name", value="standard_user", clear_first=True),
    FillExec(target_selector="input#password", value="secret_sauce", clear_first=True),
    ClickExec(target_selector="input#login-button", button="left", click_count=1, modifiers=None),
    WaitingExec(timeout=10000),
    WaitingExec(timeout=10000),
    WaitingExec(timeout=10000),
]

LOGIN_STEP_COUNT = len(_LOGIN_ACTIONS)
CHECKOUT_STEP_COUNT = len(_CHECKOUT_ACTIONS)
SLOW_STEP_COUNT = len(_SLOW_ACTIONS)


#  Lifecycle

@pytest.mark.asyncio
async def test_start_executable_twice_raises(engine):
    job = TestJob(engine, SAUCE_URL)
    job.start_executable(_LOGIN_ACTIONS)

    with pytest.raises(RuntimeError):
        job.start_executable(_LOGIN_ACTIONS)

    job.abort()


@pytest.mark.asyncio
async def test_start_natural_then_executable_raises(engine):
    job = TestJob(engine, SAUCE_URL)
    job.start_natural("Do something")

    with pytest.raises(RuntimeError):
        job.start_executable(_LOGIN_ACTIONS)

    job.abort()


#  Executable run – login flow

@pytest.mark.asyncio
async def test_executable_login_completes(engine):
    job = TestJob(engine, SAUCE_URL)
    job.start_executable(_LOGIN_ACTIONS)

    run = await job.result()
    assert run is not None


@pytest.mark.asyncio
async def test_executable_login_step_count(engine):
    job = TestJob(engine, SAUCE_URL)
    job.start_executable(_LOGIN_ACTIONS)

    await job.result()
    assert len(job.steps) == LOGIN_STEP_COUNT


@pytest.mark.asyncio
async def test_executable_login_progress_yields_all(engine):
    job = TestJob(engine, SAUCE_URL)
    job.start_executable(_LOGIN_ACTIONS)

    collected = []
    async for step in job.progress():
        collected.append(step)

    assert len(collected) == LOGIN_STEP_COUNT


@pytest.mark.asyncio
async def test_executable_login_steps_match_progress(engine):
    """steps property and progress() should yield the same objects."""
    job = TestJob(engine, SAUCE_URL)
    job.start_executable(_LOGIN_ACTIONS)

    collected = []
    async for step in job.progress():
        collected.append(step)

    assert collected == job.steps


#  Executable run – full checkout flow

@pytest.mark.asyncio
async def test_executable_checkout_completes(engine):
    job = TestJob(engine, SAUCE_URL)
    job.start_executable(_CHECKOUT_ACTIONS)

    run = await job.result()
    assert run is not None


@pytest.mark.asyncio
async def test_executable_checkout_step_count(engine):
    job = TestJob(engine, SAUCE_URL)
    job.start_executable(_CHECKOUT_ACTIONS)

    await job.result()
    assert len(job.steps) == CHECKOUT_STEP_COUNT


@pytest.mark.asyncio
async def test_executable_checkout_progress_yields_all(engine):
    job = TestJob(engine, SAUCE_URL)
    job.start_executable(_CHECKOUT_ACTIONS)

    collected = []
    async for step in job.progress():
        collected.append(step)

    assert len(collected) == CHECKOUT_STEP_COUNT


#  result() before start

@pytest.mark.asyncio
async def test_result_blocks_until_done(engine):
    """result() should resolve once the job finishes, not hang forever."""
    job = TestJob(engine, SAUCE_URL)
    job.start_executable(_LOGIN_ACTIONS)

    # wrap in a timeout so the test doesn't hang if broken
    run = await asyncio.wait_for(job.result(), timeout=30)
    assert run is not None


#  Steps accumulate incrementally

@pytest.mark.asyncio
async def test_steps_grow_during_execution(engine):
    job = TestJob(engine, SAUCE_URL)
    job.start_executable(_CHECKOUT_ACTIONS)

    seen_partial = False
    async for _ in job.progress():
        if 0 < len(job.steps) < CHECKOUT_STEP_COUNT:
            seen_partial = True

    assert seen_partial, "Expected to observe a partial step list during execution"


#  Abort

@pytest.mark.asyncio
async def test_abort_stops_execution_early(engine):
    job = TestJob(engine, SAUCE_URL)
    job.start_executable(_SLOW_ACTIONS)

    # let the fast login steps run, then cancel during the waits
    await asyncio.sleep(3)
    job.abort()

    # progress should terminate (not hang)
    collected = []
    async for step in job.progress():
        collected.append(step)

    assert len(collected) < SLOW_STEP_COUNT


@pytest.mark.asyncio
async def test_abort_before_any_step(engine):
    job = TestJob(engine, SAUCE_URL)
    job.start_executable(_SLOW_ACTIONS)

    # yield control so the task actually starts and enters its try/finally
    await asyncio.sleep(0)

    job.abort()

    # use a timeout so the test fails fast instead of hanging
    collected = []
    async with asyncio.timeout(10):
        async for step in job.progress():
            collected.append(step)

    assert len(collected) < SLOW_STEP_COUNT


@pytest.mark.asyncio
async def test_abort_idempotent(engine):
    """Calling abort() multiple times should not raise."""
    job = TestJob(engine, SAUCE_URL)
    job.start_executable(_LOGIN_ACTIONS)

    await asyncio.sleep(0)

    job.abort()
    job.abort()
    job.abort()

    collected = []
    async with asyncio.timeout(10):
        async for step in job.progress():
            collected.append(step)

#  Abort on a job that never started

@pytest.mark.asyncio
async def test_abort_without_start_does_not_raise(engine):
    job = TestJob(engine, SAUCE_URL)
    job.abort()  # should be a no-op


#  progress() after completion

@pytest.mark.asyncio
async def test_progress_after_done_terminates_immediately(engine):
    job = TestJob(engine, SAUCE_URL)
    job.start_executable(_LOGIN_ACTIONS)

    # drain fully
    async for _ in job.progress():
        pass

    # second iteration should return nothing (queue already consumed)
    second = []
    async for step in job.progress():
        second.append(step)

    assert second == []
