import pytest

from src.testcases.schemas import TestCaseCreate, TestCaseUpdate
from src.testcases.service import (
    create_testcase,
    update_testcase,
    delete_testcase,
    list_testcases,
    add_cookie_to_testcase,
    update_testcase_cookie,
    delete_testcase_cookie,
)
from src.testcases.queries import get_by_id
from src.base.schemas import PaginationParams, Cookie as CookieSchema
from src.base.models import Cookie as CookieModel

from tests.conftest import make_project, make_testsuite, make_testcase



class TestCreateTestCase:
    def test_creates_with_required_fields(self, session):
        project = make_project(session, name="P")
        ts = make_testsuite(session, project, name="TS")
        
        data = TestCaseCreate(
            name="My Test Case",
            base_url="https://example.com",
            instruction="Click login",
        )
        tc = create_testcase(session, ts.id, data)
        assert tc.id is not None
        assert tc.name == "My Test Case"
        assert tc.testsuite_id == ts.id
        assert tc.base_url == "https://example.com"

    def test_default_fields_are_empty(self, session):
        project = make_project(session, name="P")
        ts = make_testsuite(session, project, name="TS")
        
        data = TestCaseCreate(
            name="My Test Case",
            base_url="https://example.com",
            instruction="Click login",
        )
        tc = create_testcase(session, ts.id, data)
        assert tc.description == ""
        assert tc.preconditions == ""
        assert tc.objectives == ""


class TestUpdateTestCase:
    def test_update_name_and_url(self, session):
        project = make_project(session, name="P")
        ts = make_testsuite(session, project, name="TS")
        tc = make_testcase(session, ts, name="Old", base_url="http://old.com")
        
        updated = update_testcase(
            session, tc, TestCaseUpdate(name="New", base_url="http://new.com")
        )
        assert updated.name == "New"
        assert updated.base_url == "http://new.com"
        assert updated.instruction == tc.instruction  # Unchanged

    def test_none_fields_ignored(self, session):
        project = make_project(session, name="P")
        ts = make_testsuite(session, project, name="TS")
        tc = make_testcase(session, ts, name="Keep", description="Keep")
        
        updated = update_testcase(session, tc, TestCaseUpdate())
        assert updated.name == "Keep"
        assert updated.description == "Keep"



class TestDeleteTestCase:
    def test_delete(self, session):
        project = make_project(session, name="P")
        ts = make_testsuite(session, project, name="TS")
        tc = make_testcase(session, ts, name="ToDelete")
        tc_id = tc.id
        
        delete_testcase(session, tc)
        assert get_by_id(session, ts.id, tc_id) is None



class TestListTestCases:
    def test_lists_for_testsuite(self, session):
        project = make_project(session, name="P")
        ts1 = make_testsuite(session, project, name="TS1")
        ts2 = make_testsuite(session, project, name="TS2")
        
        make_testcase(session, ts1, name="TC1")
        make_testcase(session, ts1, name="TC2")
        make_testcase(session, ts2, name="TC3")  # Different suite

        page = list_testcases(session, ts1.id, PaginationParams(offset=0, limit=25))
        assert page.total_items == 2
        names = {item.name for item in page.items}
        assert names == {"TC1", "TC2"}

    def test_filter_by_name(self, session):
        project = make_project(session, name="P")
        ts = make_testsuite(session, project, name="TS")
        
        make_testcase(session, ts, name="Login Test")
        make_testcase(session, ts, name="Checkout Test")

        page = list_testcases(session, ts.id, PaginationParams(offset=0, limit=25), name="login")
        assert page.total_items == 1
        assert page.items[0].name == "Login Test"



class TestCookies:
    def _cookie_payload(self) -> CookieSchema:
        return CookieSchema(name="auth", value="xyz123", domain="api.example.com")

    def test_add_cookie(self, session):
        project = make_project(session, name="P")
        ts = make_testsuite(session, project)
        tc = make_testcase(session, ts)
        
        cookie = add_cookie_to_testcase(session, tc, self._cookie_payload())
        assert cookie.id is not None
        assert cookie.name == "auth"
        assert cookie.testcase_id == tc.id

    def test_update_cookie(self, session):
        project = make_project(session, name="P")
        ts = make_testsuite(session, project)
        tc = make_testcase(session, ts)
        
        cookie = add_cookie_to_testcase(session, tc, self._cookie_payload())
        updated = update_testcase_cookie(
            session, cookie, CookieSchema(name="auth", value="newval", domain="api.example.com")
        )
        assert updated.value == "newval"

    def test_delete_cookie(self, session):
        project = make_project(session, name="P")
        ts = make_testsuite(session, project)
        tc = make_testcase(session, ts)
        
        cookie = add_cookie_to_testcase(session, tc, self._cookie_payload())
        cookie_id = cookie.id
        
        delete_testcase_cookie(session, cookie)
        assert session.get(CookieModel, cookie_id) is None
