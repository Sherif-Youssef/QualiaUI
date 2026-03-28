from fastapi import APIRouter, Depends, status

from src.auth.dependencies import UserDep
from src.base.schemas import Page, PaginationParams
from src.database import SessionDep

from .schemas import TestCaseRunRead, TestRunRead, TestStepRunRead
from .service import (
    get_testrun,
    list_testruns,
    remove_testrun,
    get_testcaserun,
    list_testcaseruns,
    get_teststeprun,
    list_teststepruns,
)


router = APIRouter(prefix="/history", tags=["history"])


# TestRun


@router.get("", response_model=Page[TestRunRead])
async def list_testruns_route(
    session: SessionDep,
    user: UserDep,
    project_id: int,
    pagination_params: PaginationParams = Depends(),
):
    return list_testruns(
        session=session,
        user=user,
        project_id=project_id,
        pagination_params=pagination_params,
    )


@router.get("/{run_uid}", response_model=TestRunRead)
async def get_testrun_route(
    session: SessionDep,
    user: UserDep,
    project_id: int,
    run_uid: str,
):
    return get_testrun(
        session=session,
        user=user,
        project_id=project_id,
        run_uid=run_uid,
    )


@router.delete("/{run_uid}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_testrun_route(
    session: SessionDep,
    user: UserDep,
    project_id: int,
    run_uid: str,
):
    remove_testrun(
        session=session,
        user=user,
        project_id=project_id,
        run_uid=run_uid,
    )


# TestCaseRun


@router.get("/{run_uid}/testcaseruns", response_model=Page[TestCaseRunRead])
async def list_testcaseruns_route(
    session: SessionDep,
    user: UserDep,
    project_id: int,
    run_uid: str,
    pagination_params: PaginationParams = Depends(),
):
    return list_testcaseruns(
        session=session,
        user=user,
        project_id=project_id,
        run_uid=run_uid,
        pagination_params=pagination_params,
    )


@router.get("/{run_uid}/testcaseruns/{testcaserun_id}", response_model=TestCaseRunRead)
async def get_testcaserun_route(
    session: SessionDep,
    user: UserDep,
    project_id: int,
    run_uid: str,
    testcaserun_id: int,
):
    return get_testcaserun(
        session=session,
        user=user,
        project_id=project_id,
        run_uid=run_uid,
        testcaserun_id=testcaserun_id,
    )


# TestStepRun


@router.get(
    "/{run_uid}/testcaseruns/{testcaserun_id}/teststepruns",
    response_model=Page[TestStepRunRead],
)
async def list_teststepruns_route(
    session: SessionDep,
    user: UserDep,
    project_id: int,
    run_uid: str,
    testcaserun_id: int,
    pagination_params: PaginationParams = Depends(),
):
    return list_teststepruns(
        session=session,
        user=user,
        project_id=project_id,
        run_uid=run_uid,
        testcaserun_id=testcaserun_id,
        pagination_params=pagination_params,
    )


@router.get(
    "/{run_uid}/testcaseruns/{testcaserun_id}/teststepruns/{teststeprun_id}",
    response_model=TestStepRunRead,
)
async def get_teststeprun_route(
    session: SessionDep,
    user: UserDep,
    project_id: int,
    run_uid: str,
    testcaserun_id: int,
    teststeprun_id: int,
):
    return get_teststeprun(
        session=session,
        user=user,
        project_id=project_id,
        run_uid=run_uid,
        testcaserun_id=testcaserun_id,
        teststeprun_id=teststeprun_id,
    )