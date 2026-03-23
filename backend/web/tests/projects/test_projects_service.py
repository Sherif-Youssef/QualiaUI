import pytest
from fastapi import HTTPException

from src.auth.models import Role as UserRole
from src.projects.models import Role as ProjectRole
from src.projects.schemas import ProjectCreate, ProjectUpdate, UserProjectLinkCreate
from src.projects.service import create_project, delete_project, get_project, update_project


def _project_create_payload(
    name: str = "Alpha",
    description: str = "Initial",
    members: list[UserProjectLinkCreate] | None = None,
) -> ProjectCreate:
    return ProjectCreate(
        name=name,
        description=description,
        members=members or [],
    )


def test_create_project_requires_global_admin(session, user_factory):
    viewer = user_factory("viewer_u", "viewer@example.com", role=UserRole.VIEWER)

    with pytest.raises(HTTPException) as exc:
        create_project(session, viewer, _project_create_payload(name="Nope", description="blocked"))

    assert exc.value.status_code == 403


def test_create_project_with_members(session, user_factory):
    admin = user_factory("admin_u", "admin@example.com", role=UserRole.ADMIN)
    member = user_factory("member_u", "member@example.com", role=UserRole.VIEWER)

    created = create_project(
        session,
        admin,
        _project_create_payload(
            members=[UserProjectLinkCreate(user_id=member.id, role=ProjectRole.EDITOR)],
        ),
    )

    assert created.id is not None
    assert created.name == "Alpha"
    assert len(created.users_links) == 1
    assert created.users_links[0].user_id == member.id
    assert created.users_links[0].role == ProjectRole.EDITOR


def test_create_project_with_duplicate_members_raises_400(session, user_factory):
    admin = user_factory("admin_dup", "admin_dup@example.com", role=UserRole.ADMIN)
    member = user_factory("dup_member", "dup_member@example.com")

    with pytest.raises(HTTPException) as exc:
        create_project(
            session,
            admin,
            _project_create_payload(
                members=[
                    UserProjectLinkCreate(user_id=member.id, role=ProjectRole.VIEWER),
                    UserProjectLinkCreate(user_id=member.id, role=ProjectRole.EDITOR),
                ]
            ),
        )

    assert exc.value.status_code == 400
    assert exc.value.detail == "Duplicate members received."


def test_create_project_with_missing_member_raises_400(session, user_factory):
    admin = user_factory("admin_missing", "admin_missing@example.com", role=UserRole.ADMIN)

    with pytest.raises(HTTPException) as exc:
        create_project(
            session,
            admin,
            _project_create_payload(
                members=[UserProjectLinkCreate(user_id=999999, role=ProjectRole.VIEWER)]
            ),
        )

    assert exc.value.status_code == 400
    assert "Some users not found" in exc.value.detail


def test_update_project_requires_editor_or_admin(
    session,
    user_factory,
    project_factory,
    project_link_factory,
):
    actor = user_factory("actor_u", "actor@example.com", role=UserRole.VIEWER)
    project = project_factory("Gamma", "Before")
    project_link_factory(actor.id, project.id, ProjectRole.VIEWER)

    with pytest.raises(HTTPException) as exc:
        update_project(
            session,
            actor,
            project.id,
            ProjectUpdate(name="After"),
        )

    assert exc.value.status_code == 403


def test_update_project_as_editor(session, user_factory, project_factory, project_link_factory):
    editor = user_factory("editor_u", "editor@example.com", role=UserRole.EDITOR)
    project = project_factory("Delta", "Old")
    project_link_factory(editor.id, project.id, ProjectRole.EDITOR)

    updated = update_project(
        session,
        editor,
        project.id,
        ProjectUpdate(name="Delta Updated", description="New"),
    )

    assert updated.name == "Delta Updated"
    assert updated.description == "New"


def test_update_project_members_replaces_existing_members(
    session,
    user_factory,
    project_factory,
    project_link_factory,
):
    editor = user_factory("editor_members", "editor_members@example.com")
    old_member = user_factory("old_member", "old_member@example.com")
    new_member = user_factory("new_member", "new_member@example.com")
    project = project_factory("Members", "Before")

    project_link_factory(editor.id, project.id, ProjectRole.EDITOR)
    project_link_factory(old_member.id, project.id, ProjectRole.VIEWER)  

    updated = update_project(
        session,
        editor,
        project.id,
        ProjectUpdate(
            members=[UserProjectLinkCreate(user_id=new_member.id, role=ProjectRole.ADMIN)]
        ),
    )

    assert len(updated.users_links) == 1
    assert updated.users_links[0].user_id == new_member.id
    assert updated.users_links[0].role == ProjectRole.ADMIN


def test_update_project_not_found_raises_404(session, user_factory):
    admin = user_factory("admin_update_404", "admin_update_404@example.com", role=UserRole.ADMIN)

    with pytest.raises(HTTPException) as exc:
        update_project(session, admin, 999999, ProjectUpdate(name="Nope"))

    assert exc.value.status_code == 404


def test_get_project_requires_membership_or_global_admin(
    session,
    user_factory,
    project_factory,
    project_link_factory,
):
    outsider = user_factory("outsider", "outsider@example.com", role=UserRole.VIEWER)
    admin = user_factory("global_admin", "global_admin@example.com", role=UserRole.ADMIN)
    member = user_factory("member_get", "member_get@example.com")
    project = project_factory("Access", "Scope")
    project_link_factory(member.id, project.id, ProjectRole.VIEWER)  

    with pytest.raises(HTTPException) as outsider_exc:
        get_project(session, outsider, project.id)  

    assert outsider_exc.value.status_code == 403

    member_project = get_project(session, member, project.id)  
    assert member_project.id == project.id

    admin_project = get_project(session, admin, project.id)  
    assert admin_project.id == project.id


def test_delete_project_requires_project_admin(session, user_factory, project_factory, project_link_factory):
    viewer = user_factory("viewer_delete", "viewer_delete@example.com")
    project = project_factory("Delete", "Denied")
    project_link_factory(viewer.id, project.id, ProjectRole.VIEWER)  

    with pytest.raises(HTTPException) as exc:
        delete_project(session, viewer, project.id)  

    assert exc.value.status_code == 403


def test_delete_project_as_project_admin(session, user_factory, project_factory, project_link_factory):
    project_admin = user_factory("pa_u", "pa@example.com", role=UserRole.VIEWER)
    project = project_factory("Epsilon", "Delete me")
    project_link_factory(project_admin.id, project.id, ProjectRole.ADMIN)  

    delete_project(session, project_admin, project.id)  

    with pytest.raises(HTTPException) as exc:
        update_project(
            session,
            project_admin,
            project.id,  
            ProjectUpdate(name="Should fail"),
        )

    assert exc.value.status_code == 404
