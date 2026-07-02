import pytest
from fastapi import HTTPException

from src.auth.models import Role as AuthRole
from src.projects.models import Role as ProjectRole
from src.projects.schemas import ProjectCreate, ProjectUpdate, UserProjectLinkCreate
from src.projects.service import (
    create_project,
    update_project,
    delete_project,
    list_projects,
)
from src.base.schemas import PaginationParams
from src.projects.queries import get_by_id

from tests.conftest import make_user, make_project


class TestCreateProject:
    def test_create_without_members(self, session):
        data = ProjectCreate(name="My Project", description="desc")
        project = create_project(session, data)
        assert project.id is not None
        assert project.name == "My Project"
        assert project.users_links == []

    def test_create_with_members(self, session):
        user = make_user(session, username="member1", email="m1@x.com")
        data = ProjectCreate(
            name="Team Project",
            members=[UserProjectLinkCreate(user_id=user.id, role=ProjectRole.EDITOR)],
        )
        project = create_project(session, data)
        assert len(project.users_links) == 1
        assert project.users_links[0].user_id == user.id
        assert project.users_links[0].role == ProjectRole.EDITOR

    def test_create_with_nonexistent_member(self, session):
        data = ProjectCreate(
            name="Bad Project",
            members=[UserProjectLinkCreate(user_id=9999, role=ProjectRole.VIEWER)],
        )
        with pytest.raises(HTTPException) as exc_info:
            create_project(session, data)
        assert exc_info.value.status_code == 400
        assert "not found" in exc_info.value.detail

    def test_create_with_duplicate_members(self, session):
        user = make_user(session, username="dupe_m", email="dupe_m@x.com")
        data = ProjectCreate(
            name="Dupe Project",
            members=[
                UserProjectLinkCreate(user_id=user.id, role=ProjectRole.VIEWER),
                UserProjectLinkCreate(user_id=user.id, role=ProjectRole.EDITOR),
            ],
        )
        with pytest.raises(HTTPException) as exc_info:
            create_project(session, data)
        assert exc_info.value.status_code == 400
        assert "Duplicate" in exc_info.value.detail



class TestUpdateProject:
    def test_update_name(self, session):
        project = make_project(session, name="Old Name")
        updated = update_project(session, project, ProjectUpdate(name="New Name"))
        assert updated.name == "New Name"

    def test_update_description(self, session):
        project = make_project(session, name="Proj", description="old")
        updated = update_project(session, project, ProjectUpdate(description="new"))
        assert updated.description == "new"
        assert updated.name == "Proj"  # unchanged

    def test_update_members(self, session):
        user1 = make_user(session, username="u1", email="u1@x.com")
        user2 = make_user(session, username="u2", email="u2@x.com")
        project = make_project(session, name="Proj", members=[(user1, ProjectRole.VIEWER)])

        updated = update_project(
            session, project,
            ProjectUpdate(members=[
                UserProjectLinkCreate(user_id=user2.id, role=ProjectRole.ADMIN),
            ]),
        )
        assert len(updated.users_links) == 1
        assert updated.users_links[0].user_id == user2.id

    def test_update_none_fields_ignored(self, session):
        project = make_project(session, name="Keep", description="Keep")
        updated = update_project(session, project, ProjectUpdate())
        assert updated.name == "Keep"
        assert updated.description == "Keep"



class TestDeleteProject:
    def test_delete(self, session):
        project = make_project(session, name="ToDelete")
        project_id = project.id
        delete_project(session, project)
        assert get_by_id(session, project_id) is None



class TestListProjects:
    def test_list_with_user_role(self, session):
        user = make_user(session, username="lister", email="lister@x.com")
        make_project(session, name="P1", members=[(user, ProjectRole.EDITOR)])
        make_project(session, name="P2")  # user is not a member

        pagination = PaginationParams(offset=0, limit=25)
        page = list_projects(session, user, pagination)
        assert page.total_items == 2
        # P1 should show user_role=EDITOR, P2 should show user_role=None
        roles = {item.name: item.user_role for item in page.items}
        assert roles["P1"] == ProjectRole.EDITOR
        assert roles["P2"] is None

    def test_list_filter_by_name(self, session):
        user = make_user(session, username="filterer", email="filterer@x.com")
        make_project(session, name="Alpha")
        make_project(session, name="Beta")

        page = list_projects(session, user, PaginationParams(offset=0, limit=25), name="alpha")
        assert page.total_items == 1
        assert page.items[0].name == "Alpha"
