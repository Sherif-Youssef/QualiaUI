from fastapi import APIRouter, Query, Header, Request
from fastapi.responses import StreamingResponse

from src.auth.dependencies import UserDep
from src.database import SessionDep


from src.runs.dependencies import (
	EditorTestCaseRunDep,
	EditorTestSuiteRunDep,
	ViewerTestCaseRunDep,
	ViewerTestSuiteRunDep,
)
from src.runs.schemas import (
	StartRunResponse,
	TestCaseRunWithStepsRead,
	TestsuiteStartRunRequest,
	TestSuiteRunWithCasesRead,
	TestcaseStartRunRequest
)
from src.runs.service import (
    abort_testcase_run,
    abort_testsuite_run,
    launch_testcase_run,
    launch_testsuite_run,
    stop_predicate_factory,
)
from src.runs.stream import get_stream_key, sse_read_stream
from src.base.schemas import Scope
from src.projects.dependencies import get_editor_project
from src.testcases.dependencies import get_editor_testcase
from src.testsuites.dependencies import get_editor_testsuite

router = APIRouter(tags=["runs"])


@router.post(
	"/runs/testcases", 
	response_model=StartRunResponse
)
async def start_testcase_run_route(
	session: SessionDep,
	user: UserDep,
    payload: TestcaseStartRunRequest,
):
	
	testcase = get_editor_testcase(
		session=session,
		user=user,
		testcase_id=payload.testcase_id
	)

	return launch_testcase_run(
		session=session,
		testcase=testcase,
		mode=payload.mode,
		llm_model_id=payload.llm_model_id,
	)

@router.post(
	"/runs/testsuites", 
	response_model=StartRunResponse
)
async def start_testsuite_run_route(
	session: SessionDep,
	user: UserDep,
    payload: TestsuiteStartRunRequest,
):
	testsuite = get_editor_testsuite(
		session=session,
		user=user,
		testsuite_id=payload.testsuite_id
	)

	return launch_testsuite_run(
		session=session,
		testsuite=testsuite,
		mode=payload.mode,
		llm_model_id=payload.llm_model_id,
	)


@router.get(
	"/runs/testcases/{testcase_run_id}",
	response_model=TestCaseRunWithStepsRead,
)
def get_testcase_run_route(
	testcase_run: ViewerTestCaseRunDep,
):
	_ = testcase_run.teststep_runs
	return TestCaseRunWithStepsRead.model_validate(testcase_run, from_attributes=True)


@router.get(
	"/runs/testsuites/{testsuite_run_id}",
	response_model=TestSuiteRunWithCasesRead,
)
def get_testsuite_run_route(
	testsuite_run: ViewerTestSuiteRunDep,
):
	_ = testsuite_run.testcase_runs
	return TestSuiteRunWithCasesRead.model_validate(testsuite_run, from_attributes=True)


@router.get(
	"/runs/testcases/{testcase_run_id}/stream", 
)
def stream_testcase_run_events(
	request: Request,
	testcase_run: ViewerTestCaseRunDep,
    last_event_id: str = Header(default="0-0"),
):

    event_generator = lambda : sse_read_stream(
		stream_key=get_stream_key(testcase_run.scope, testcase_run.id), # type: ignore[arg-type]
		last_event_id=last_event_id,
		is_disconnected=request.is_disconnected,
		stop_predicate=stop_predicate_factory(Scope.TESTCASE)
	)

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no",
            "Connection": "keep-alive",
        },
    )

@router.get(
	"/runs/testsuites/{testsuite_run_id}/stream", 
)
def stream_testsuite_run_events(
	request: Request,
	testsuite_run: ViewerTestSuiteRunDep,
    last_event_id: str = Header(default="0-0"),
):
	
	event_generator = lambda : sse_read_stream(
		stream_key=get_stream_key(testsuite_run.scope, testsuite_run.id), # type: ignore[arg-type]
		last_event_id=last_event_id,
		is_disconnected=request.is_disconnected,
		stop_predicate=stop_predicate_factory(Scope.TESTSUITE)
	)

	return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no",
            "Connection": "keep-alive",
        },
    )


@router.post(
	"/runs/testcases/{testcase_run_id}/abort", 
)
async def abort_testcase_run_route(
	testcase_run: EditorTestCaseRunDep,
):
	await abort_testcase_run(
		testcase_run=testcase_run
	)


@router.post(
	"/runs/testsuites/{testsuite_run_id}/abort", 
)
async def abort_testsuite_run_route(
	testsuite_run: EditorTestSuiteRunDep,
):
	await abort_testsuite_run(
		testsuite_run=testsuite_run
	)
