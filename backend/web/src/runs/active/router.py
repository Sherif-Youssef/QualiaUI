from fastapi import APIRouter, Query, WebSocket, WebSocketDisconnect, HTTPException

from src.auth.dependencies import UserDep
from src.database import SessionDep

from ..models import TestRunMode
from .dependencies import TestingEngineDep
from .schemas import ActiveTestRun, ActiveTestCaseRun, ActiveTestStepRun
from . import service


router = APIRouter(prefix="/active", tags=["active"])


# trigger a run

@router.post("/new", response_model=ActiveTestRun)
async def start_run_route(
    session: SessionDep,
    user: UserDep,
    engine: TestingEngineDep,
    project_id: int,
    testsuite_id: int = Query(),
    mode: TestRunMode = Query(),
):
    return await service.start_run(
        session, user, engine, project_id, testsuite_id, mode,
    )


# run status

@router.get("/{run_id}/status", response_model=ActiveTestRun)
def get_run_status_route(
    session: SessionDep,
    user: UserDep,
    project_id: int,
    run_id: str,
):
    return service.get_run_status(session, user, project_id, run_id)


# testcase status

@router.get("/{run_id}/testcases/{index}/status", response_model=ActiveTestCaseRun)
def get_testcase_status_route(
    session: SessionDep,
    user: UserDep,
    project_id: int,
    run_id: str,
    index: int,
):
    return service.get_testcase_status(session, user, project_id, run_id, index)


# steps snapshot

@router.get("/{run_id}/testcases/{index}/steps", response_model=list[ActiveTestStepRun])
def get_steps_route(
    session: SessionDep,
    user: UserDep,
    project_id: int,
    run_id: str,
    index: int,
):
    return service.get_testcase_steps(session, user, project_id, run_id, index)


# websocket progress for one testcase

@router.websocket("/{run_id}/testcases/{index}/progress")
async def ws_testcase_progress(
    ws: WebSocket,
    run_id: str,
    index: int,
):
    await ws.accept()

    try:
        ctx = service._get_context(run_id)

        async for step in service.stream_testcase_progress_raw(ctx, index):
            await ws.send_text(step.model_dump_json())

        await ws.send_json({"event": "done"})

    except WebSocketDisconnect:
        pass
    except HTTPException as e:
        await ws.send_json({"event": "error", "detail": e.detail})
    except Exception as e:
        await ws.send_json({"event": "error", "detail": str(e)})
    finally:
        try:
            await ws.close()
        except RuntimeError:
            pass


@router.websocket("/{run_id}/progress")
async def ws_all_progress(
    ws: WebSocket,
    run_id: str,
):
    await ws.accept()

    try:
        ctx = service._get_context(run_id)

        async for step in service.stream_all_progress_raw(ctx):
            await ws.send_text(step.model_dump_json())

        await ws.send_json({"event": "done"})

    except WebSocketDisconnect:
        pass
    except HTTPException as e:
        await ws.send_json({"event": "error", "detail": e.detail})
    except Exception as e:
        await ws.send_json({"event": "error", "detail": str(e)})
    finally:
        try:
            await ws.close()
        except RuntimeError:
            pass

# abort entire run

@router.delete("/{run_id}")
def abort_run_route(
    session: SessionDep,
    user: UserDep,
    project_id: int,
    run_id: str,
):
    service.abort_run(session, user, project_id, run_id)
