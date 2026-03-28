import pytest
import asyncio

from automation_engine import (
    FillExec,
    ClickExec,
    WaitingExec,
)
from src.runs.active.run_manager import TestRunManager, TestCaseSpec


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


def _login_spec() -> TestCaseSpec:
    return TestCaseSpec(url=SAUCE_URL, executable_steps=list(_LOGIN_ACTIONS))


def _checkout_spec() -> TestCaseSpec:
    return TestCaseSpec(url=SAUCE_URL, executable_steps=list(_CHECKOUT_ACTIONS))


def _slow_spec() -> TestCaseSpec:
    return TestCaseSpec(url=SAUCE_URL, executable_steps=list(_SLOW_ACTIONS))


# validation

@pytest.mark.asyncio
async def test_empty_specs_raises(engine):
    with pytest.raises(ValueError, match="must not be empty"):
        TestRunManager(engine, [])


def test_both_instruction_and_steps_raises(engine):
    bad_spec = TestCaseSpec(
        url=SAUCE_URL,
        executable_steps=list(_LOGIN_ACTIONS),
        instruction="do something",
    )
    with pytest.raises(ValueError, match="Exactly one"):
        TestRunManager(engine, [bad_spec])


def test_neither_instruction_nor_steps_raises(engine):
    bad_spec = TestCaseSpec(url=SAUCE_URL)
    with pytest.raises(ValueError, match="Exactly one"):
        TestRunManager(engine, [bad_spec])


@pytest.mark.asyncio
async def test_start_twice_raises(engine):
    manager = TestRunManager(engine, [_login_spec()])
    manager.start()

    with pytest.raises(RuntimeError):
        manager.start()

    manager.abort()


@pytest.mark.asyncio
async def test_unknown_index_raises(engine):
    manager = TestRunManager(engine, [_login_spec()])
    manager.start()

    with pytest.raises(KeyError):
        manager.steps(999)

    with pytest.raises(KeyError):
        await manager.result(999)

    manager.abort()


@pytest.mark.asyncio
async def test_indices_match_specs(engine):
    specs = [_login_spec(), _checkout_spec()]
    manager = TestRunManager(engine, specs)
    assert manager.indices == [0, 1]


# single spec – login

@pytest.mark.asyncio
async def test_single_login_completes(engine):
    manager = TestRunManager(engine, [_login_spec()])
    manager.start()
    await manager.wait()

    assert manager.is_done
    assert not manager.is_running

    run = await manager.result(0)
    assert run is not None


@pytest.mark.asyncio
async def test_single_login_step_count(engine):
    manager = TestRunManager(engine, [_login_spec()])
    manager.start()
    await manager.wait()

    assert len(manager.steps(0)) == LOGIN_STEP_COUNT


@pytest.mark.asyncio
async def test_single_login_progress_yields_all(engine):
    manager = TestRunManager(engine, [_login_spec()])
    manager.start()

    collected = []
    async for step in manager.progress(0):
        collected.append(step)

    assert len(collected) == LOGIN_STEP_COUNT


# single spec – checkout

@pytest.mark.asyncio
async def test_single_checkout_completes(engine):
    manager = TestRunManager(engine, [_checkout_spec()])
    manager.start()
    await manager.wait()

    run = await manager.result(0)
    assert run is not None


@pytest.mark.asyncio
async def test_single_checkout_step_count(engine):
    manager = TestRunManager(engine, [_checkout_spec()])
    manager.start()
    await manager.wait()

    assert len(manager.steps(0)) == CHECKOUT_STEP_COUNT


@pytest.mark.asyncio
async def test_single_checkout_progress_yields_all(engine):
    manager = TestRunManager(engine, [_checkout_spec()])
    manager.start()

    collected = []
    async for step in manager.progress(0):
        collected.append(step)

    assert len(collected) == CHECKOUT_STEP_COUNT


# late subscriber replay

@pytest.mark.asyncio
async def test_late_subscriber_replays_all_steps(engine):
    manager = TestRunManager(engine, [_checkout_spec()])
    manager.start()
    await manager.wait()

    replayed = []
    async for step in manager.progress(0):
        replayed.append(step)

    assert len(replayed) == CHECKOUT_STEP_COUNT
    assert replayed == manager.steps(0)


# multiple concurrent subscribers

@pytest.mark.asyncio
async def test_multiple_concurrent_subscribers(engine):
    manager = TestRunManager(engine, [_checkout_spec()])
    manager.start()

    @pytest.mark.asyncio
    async def _collect():
        return [step async for step in manager.progress(0)]

    a, b = await asyncio.gather(_collect(), _collect())

    assert len(a) == CHECKOUT_STEP_COUNT
    assert len(b) == CHECKOUT_STEP_COUNT
    assert a == b


# multiple specs

@pytest.mark.asyncio
async def test_multiple_specs_complete(engine):
    specs = [_login_spec(), _checkout_spec()]
    manager = TestRunManager(engine, specs)
    manager.start()
    await manager.wait()

    results = await manager.all_results()
    assert len(results) == 2
    for run in results.values():
        assert run is not None


@pytest.mark.asyncio
async def test_multiple_specs_step_counts(engine):
    specs = [_login_spec(), _checkout_spec()]
    manager = TestRunManager(engine, specs)
    manager.start()
    await manager.wait()

    all_s = manager.all_steps()
    assert len(all_s) == 2

    counts = sorted(len(steps) for steps in all_s.values())
    assert counts == sorted([LOGIN_STEP_COUNT, CHECKOUT_STEP_COUNT])


@pytest.mark.asyncio
async def test_multiple_specs_per_index_results(engine):
    specs = [_login_spec(), _checkout_spec()]
    manager = TestRunManager(engine, specs)
    manager.start()
    await manager.wait()

    assert len(manager.steps(0)) == LOGIN_STEP_COUNT
    assert len(manager.steps(1)) == CHECKOUT_STEP_COUNT

    run_0 = await manager.result(0)
    run_1 = await manager.result(1)
    assert run_0 is not None
    assert run_1 is not None


@pytest.mark.asyncio
async def test_multiple_specs_progress_per_index(engine):
    specs = [_login_spec(), _checkout_spec()]
    manager = TestRunManager(engine, specs)
    manager.start()

    @pytest.mark.asyncio
    async def _collect(idx):
        return [step async for step in manager.progress(idx)]

    results = await asyncio.gather(_collect(0), _collect(1))

    assert len(results[0]) == LOGIN_STEP_COUNT
    assert len(results[1]) == CHECKOUT_STEP_COUNT


# steps grow incrementally

@pytest.mark.asyncio
async def test_steps_grow_during_execution(engine):
    manager = TestRunManager(engine, [_checkout_spec()])
    manager.start()

    seen_partial = False
    async for _ in manager.progress(0):
        if 0 < len(manager.steps(0)) < CHECKOUT_STEP_COUNT:
            seen_partial = True

    assert seen_partial, "Expected to observe a partial step list mid-run"


# abort all

@pytest.mark.asyncio
async def test_abort_all(engine):
    manager = TestRunManager(engine, [_slow_spec()])
    manager.start()

    await asyncio.sleep(3)
    manager.abort()

    async with asyncio.timeout(15):
        await manager.wait()

    assert manager.is_done
    assert len(manager.steps(0)) < SLOW_STEP_COUNT


@pytest.mark.asyncio
async def test_abort_all_multiple_specs(engine):
    specs = [_slow_spec(), _slow_spec()]
    manager = TestRunManager(engine, specs, concurrency=2)
    manager.start()

    await asyncio.sleep(3)
    manager.abort()

    async with asyncio.timeout(15):
        await manager.wait()

    assert manager.is_done
    for idx in manager.indices:
        assert len(manager.steps(idx)) < SLOW_STEP_COUNT


# abort single

@pytest.mark.asyncio
async def test_abort_single_spec(engine):
    specs = [_login_spec(), _slow_spec()]
    manager = TestRunManager(engine, specs, concurrency=2)
    manager.start()

    await asyncio.sleep(2)
    manager.abort_testcase(1)

    async with asyncio.timeout(30):
        await manager.wait()

    assert len(manager.steps(0)) == LOGIN_STEP_COUNT
    run_0 = await manager.result(0)
    assert run_0 is not None

    assert len(manager.steps(1)) < SLOW_STEP_COUNT


# concurrency

@pytest.mark.asyncio
async def test_concurrency_limit(engine):
    num_cases = 6
    concurrency = 2
    specs = [
        TestCaseSpec(
            url=SAUCE_URL,
            executable_steps=list(_LOGIN_ACTIONS) + [WaitingExec(timeout=1000)],
        )
        for _ in range(num_cases)
    ]

    manager = TestRunManager(engine, specs, concurrency=concurrency)
    manager.start()

    async with asyncio.timeout(60):
        await manager.wait()

    results = await manager.all_results()
    assert len(results) == num_cases
    for run in results.values():
        assert run is not None


# result blocks until done

@pytest.mark.asyncio
async def test_result_blocks_until_done(engine):
    manager = TestRunManager(engine, [_login_spec()])
    manager.start()

    async with asyncio.timeout(30):
        run = await manager.result(0)

    assert run is not None
