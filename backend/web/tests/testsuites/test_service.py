import pytest

from src.testsuites.schemas import TestSuiteCreate, TestSuiteUpdate
from src.testsuites.service import (
    create_testsuite,
    update_testsuite,
    delete_testsuite,
    list_testsuites,
    add_cookie_to_testsuite,
    update_testsuite_cookie,
    delete_testsuite_cookie,
)
from src.testsuites.queries import get_by_id
from src.base.schemas import PaginationParams, Cookie as CookieSchema
from src.base.models import Cookie as CookieModel

from tests.conftest import make_user, make_project, make_testsuite



class TestCreateTestSuite:
    def test_creates_with_name(self, session):
        project = make_project(session, name="P")
        ts = create_testsuite(session, project.id, TestSuiteCreate(name="Suite A"))
        assert ts.id is not None
        assert ts.name == "Suite A"
        assert ts.project_id == project.id

    def test_default_description_is_empty(self, session):
        project = make_project(session, name="P2")
        ts = create_testsuite(session, project.id, TestSuiteCreate(name="Suite B"))
        assert ts.description == ""



class TestUpdateTestSuite:
    def test_update_name(self, session):
        project = make_project(session, name="P")
        ts = make_testsuite(session, project, name="Old")
        updated = update_testsuite(session, ts, TestSuiteUpdate(name="New"))
        assert updated.name == "New"

    def test_update_description(self, session):
        project = make_project(session, name="P")
        ts = make_testsuite(session, project, name="S", description="old desc")
        updated = update_testsuite(session, ts, TestSuiteUpdate(description="new desc"))
        assert updated.description == "new desc"
        assert updated.name == "S"  # unchanged

    def test_none_fields_ignored(self, session):
        project = make_project(session, name="P")
        ts = make_testsuite(session, project, name="Keep", description="Keep")
        updated = update_testsuite(session, ts, TestSuiteUpdate())
        assert updated.name == "Keep"
        assert updated.description == "Keep"



class TestDeleteTestSuite:
    def test_delete(self, session):
        project = make_project(session, name="P")
        ts = make_testsuite(session, project, name="ToDelete")
        ts_id = ts.id
        delete_testsuite(session, ts)
        assert get_by_id(session, ts_id) is None



class TestListTestSuites:
    def test_lists_for_project(self, session):
        p1 = make_project(session, name="P1")
        p2 = make_project(session, name="P2")
        make_testsuite(session, p1, name="Suite A")
        make_testsuite(session, p1, name="Suite B")
        make_testsuite(session, p2, name="Suite C")  # different project

        page = list_testsuites(session, p1.id, PaginationParams(offset=0, limit=25))
        assert page.total_items == 2
        names = {item.name for item in page.items}
        assert names == {"Suite A", "Suite B"}

    def test_filter_by_name(self, session):
        project = make_project(session, name="P")
        make_testsuite(session, project, name="Login Suite")
        make_testsuite(session, project, name="Checkout Suite")

        page = list_testsuites(session, project.id, PaginationParams(offset=0, limit=25), name="login")
        assert page.total_items == 1
        assert page.items[0].name == "Login Suite"



class TestCookies:
    def _cookie_payload(self) -> CookieSchema:
        return CookieSchema(name="session", value="abc123", domain="example.com")

    def test_add_cookie(self, session):
        project = make_project(session, name="P")
        ts = make_testsuite(session, project)
        cookie = add_cookie_to_testsuite(session, ts, self._cookie_payload())
        assert cookie.id is not None
        assert cookie.name == "session"
        assert cookie.testsuite_id == ts.id

    def test_update_cookie(self, session):
        project = make_project(session, name="P")
        ts = make_testsuite(session, project)
        cookie = add_cookie_to_testsuite(session, ts, self._cookie_payload())
        updated = update_testsuite_cookie(
            session, cookie, CookieSchema(name="session", value="xyz789", domain="example.com")
        )
        assert updated.value == "xyz789"

    def test_delete_cookie(self, session):
        project = make_project(session, name="P")
        ts = make_testsuite(session, project)
        cookie = add_cookie_to_testsuite(session, ts, self._cookie_payload())
        cookie_id = cookie.id
        delete_testsuite_cookie(session, cookie)
        assert session.get(CookieModel, cookie_id) is None
