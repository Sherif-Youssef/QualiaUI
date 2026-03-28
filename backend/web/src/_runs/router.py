import asyncio
import base64
import uuid
import logging
from datetime import datetime

from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Query, Depends
from sqlmodel import Session

from src.auth.dependencies import UserDep
from src.database import SessionDep
from src.base.schemas import Page, PaginationParams
from src.testsuites.queries import get_by_id as get_testsuite_by_id
from src.testcases.queries import get_all as get_all_testcases

from automation_engine.testing.history import (
    TestStep as EngineTestStep,
    TestTermination,
)

from .models import TestRunMode
from .schemas import (
    TestRunRead, TestCaseRunRead, TestStepRunRead,
    ActiveRunInfo, ActiveRunDetail,
)
from .manager import TestCaseInput, ActiveRun
from .dependencies import RunManagerDep
from . import service


logger = logging.getLogger(__name__)

router = APIRouter(tags=["runs"])


# Helpers (WebSocket serialisation)

def _serialize_step(step: EngineTestStep) -> dict:
    return {
        "type": "step",
        "index": step.index,
        "status": step.status.value if step.status else None,
        "error_message": step.error_message,
        "started_at": step.started_at.isoformat() if step.started_at else None,
        "finished_at": step.finished_at.isoformat() if step.finished_at else None,
        "executable": step.executable.model_dump() if step.executable else None,
        "screenshot_before": (
            base64.b64encode(step.snapshot_before.screenshot).decode()
            if step.snapshot_before and step.snapshot_before.screenshot
            else None
        ),
        "screenshot_after": (
            base64.b64encode(step.snapshot_after.screenshot).decode()
            if step.snapshot_after and step.snapshot_after.screenshot
            else None
        ),
    }


def _serialize_termination(term: TestTermination) -> dict:
    return {
        "type": "termination",
        "signal": str(term.term_signal),
    }


def _build_case_inputs(
    session: Session,
    testsuite_id: int,
    mode: TestRunMode,
) -> tuple[str, list[TestCaseInput]]:
    cases = get_all_testcases(
        session, testsuite_id, PaginationParams(limit=10_000, offset=0),
    )
    if not cases:
        raise ValueError("Test suite has no test cases")

    base_url = cases[0].base_url
    inputs: list[TestCaseInput] = []

    for tc in cases:
        if mode == TestRunMode.NATURAL:
            inputs.append(TestCaseInput(
                name=tc.name,
                description=tc.description,
                instruction=tc.instruction,
            ))
        else:
            from automation_engine.compilation import ExecAction
            executables = [
                ExecAction(**step_dict)
                for step_dict in (tc.executable_steps or [])
            ]
            inputs.append(TestCaseInput(
                name=tc.name,
                description=tc.description,
                executables=executables,
            ))

    return base_url, inputs


# WebSocket — run execution

@router.websocket("/projects/{project_id}/testsuites/{testsuite_id}/run")
async def ws_run(
    websocket: WebSocket,
    project_id: int,
    testsuite_id: int,
    mode: TestRunMode = Query(...),
    session: SessionDep = None,          # type: ignore[assignment]
    # user: UserDep = None,                # type: ignore[assignment]
    run_manager: RunManagerDep = None,   # type: ignore[assignment]
):
    await websocket.accept()

    testsuite = get_testsuite_by_id(session, project_id, testsuite_id)
    if not testsuite:
        await websocket.send_json({"type": "error", "detail": "Test suite not found"})
        await websocket.close(code=4004)
        return

    try:
        base_url, case_inputs = _build_case_inputs(session, testsuite_id, mode)
    except ValueError as e:
        await websocket.send_json({"type": "error", "detail": str(e)})
        await websocket.close(code=4000)
        return

    run_id = uuid.uuid4().hex

    try:
        active = run_manager.start_run(
            run_id=run_id,
            project_id=project_id,
            mode=mode,
            base_url=base_url,
            cases=case_inputs,
            name=testsuite.name,
            description=testsuite.description,
        )
    except ValueError as e:
        await websocket.send_json({"type": "error", "detail": str(e)})
        await websocket.close(code=4000)
        return

    await websocket.send_json({"type": "run_started", "run_id": run_id})

    async def _stream_steps(active: ActiveRun, ws: WebSocket):
        while True:
            item = await active.step_queue.get()
            if item is None:
                break
            if isinstance(item, EngineTestStep):
                await ws.send_json(_serialize_step(item))
            elif isinstance(item, TestTermination):
                await ws.send_json(_serialize_termination(item))

    async def _listen_for_abort(active: ActiveRun, ws: WebSocket):
        try:
            while True:
                data = await ws.receive_json()
                if isinstance(data, dict) and data.get("action") == "abort":
                    logger.info(f"Client requested abort for run {active.run_id}")
                    await run_manager.abort_run(active.run_id)
                    break
        except WebSocketDisconnect:
            logger.info(f"Client disconnected from run {active.run_id}, aborting")
            await run_manager.abort_run(active.run_id)

    try:
        stream_task = asyncio.create_task(_stream_steps(active, websocket))
        listen_task = asyncio.create_task(_listen_for_abort(active, websocket))

        done, pending = await asyncio.wait(
            {stream_task, listen_task},
            return_when=asyncio.FIRST_COMPLETED,
        )
        for t in pending:
            t.cancel()
            try:
                await t
            except asyncio.CancelledError:
                pass
        for t in done:
            exc = t.exception()
            if exc and not isinstance(exc, WebSocketDisconnect):
                raise exc

    except WebSocketDisconnect:
        logger.info(f"WebSocket disconnected for run {run_id}")
        if run_manager.get_active_run(run_id):
            await run_manager.abort_run(run_id)
    except Exception:
        logger.exception(f"Error in WebSocket for run {run_id}")
        if run_manager.get_active_run(run_id):
            await run_manager.abort_run(run_id)
    finally:
        engine_run = active.engine_run
        status = engine_run.status.value if engine_run else "ABORTED"
        try:
            await websocket.send_json({
                "type": "run_finished",
                "run_id": run_id,
                "status": status,
                "finished_at": datetime.now().isoformat(),
            })
            await websocket.close()
        except Exception:
            pass


# REST — Active runs

@router.get("/projects/{project_id}/runs/active", response_model=list[ActiveRunInfo])
def list_active_runs(
    project_id: int,
    session: SessionDep,
    user: UserDep,
    run_manager: RunManagerDep,
):
    return service.list_active_runs_for_project(user, session, project_id, run_manager)


@router.get("/projects/{project_id}/runs/active/{run_id}", response_model=ActiveRunDetail)
def get_active_run(
    project_id: int,
    run_id: str,
    session: SessionDep,
    user: UserDep,
    run_manager: RunManagerDep,
):
    return service.get_active_run_detail(user, session, project_id, run_id, run_manager)


@router.post("/projects/{project_id}/runs/active/{run_id}/abort", status_code=204)
async def abort_active_run(
    project_id: int,
    run_id: str,
    session: SessionDep,
    user: UserDep,
    run_manager: RunManagerDep,
):
    await service.abort_active_run(user, session, project_id, run_id, run_manager)


# REST — Completed TestRuns

@router.get("/projects/{project_id}/runs", response_model=Page[TestRunRead])
def list_runs(
    project_id: int,
    session: SessionDep,
    user: UserDep,
    pagination_params: PaginationParams = Depends(),
):
    return service.list_testruns(session, user, project_id, pagination_params)



@router.get("/projects/{project_id}/runs/{run_id}", response_model=TestRunRead)
def get_run(
    project_id: int,
    run_id: int,
    session: SessionDep,
    user: UserDep,
):
    return service.get_testrun_detail(session, user, project_id, run_id)


@router.delete("/projects/{project_id}/runs/{run_id}", status_code=204)
def delete_run(
    project_id: int,
    run_id: int,
    session: SessionDep,
    user: UserDep,
):
    service.delete_testrun_service(session, user, project_id, run_id)


# REST — TestCaseRuns

@router.get(
    "/projects/{project_id}/runs/{run_id}/cases",
    response_model=Page[TestCaseRunRead],
)
def list_case_runs(
    project_id: int,
    run_id: int,
    session: SessionDep,
    user: UserDep,
    pagination_params: PaginationParams = Depends(),
):
    return service.list_testcaseruns(session, user, project_id, run_id, pagination_params)


@router.get(
    "/projects/{project_id}/runs/{run_id}/cases/{testcaserun_id}",
    response_model=TestCaseRunRead,
)
def get_case_run(
    project_id: int,
    run_id: int,
    testcaserun_id: int,
    session: SessionDep,
    user: UserDep,
):
    return service.get_testcaserun_detail(session, user, project_id, run_id, testcaserun_id)


# REST — TestStepRuns

@router.get(
    "/projects/{project_id}/runs/{run_id}/cases/{testcaserun_id}/steps",
    response_model=Page[TestStepRunRead],
)
def list_step_runs(
    project_id: int,
    run_id: int,
    testcaserun_id: int,
    session: SessionDep,
    user: UserDep,
    pagination_params: PaginationParams = Depends(),
):
    return service.list_teststepruns(
        session, user, project_id, run_id, testcaserun_id, pagination_params,
    )



@router.get(
    "/projects/{project_id}/runs/{run_id}/cases/{testcaserun_id}/steps/{teststeprun_id}",
    response_model=TestStepRunRead,
)
def get_step_run(
    project_id: int,
    run_id: int,
    testcaserun_id: int,
    teststeprun_id: int,
    session: SessionDep,
    user: UserDep,
):
    return service.get_teststeprun_detail(
        session, user, project_id, run_id, testcaserun_id, teststeprun_id,
    )