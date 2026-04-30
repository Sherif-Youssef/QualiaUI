from types import SimpleNamespace
from src.runs import queries


class FakeResult:
    def __init__(self, row):
        self.row = row

    def first(self):
        return self.row


class FakeSession:
    def __init__(self, row=None):
        self.statement = None
        self.row = row

    def exec(self, statement):
        self.statement = statement
        return FakeResult(self.row)


def test_get_project_run_by_id_with_user_link_found():
    project_run = SimpleNamespace(id=1)
    link = SimpleNamespace(role="ADMIN")
    session = FakeSession(row=(project_run, link))

    result = queries.get_project_run_by_id_with_user_link(session, project_run_id=1, user_id=2)
    assert result == (project_run, link)
    assert session.statement is not None


def test_get_project_run_by_id_with_user_link_not_found():
    session = FakeSession(row=None)
    result = queries.get_project_run_by_id_with_user_link(session, project_run_id=1, user_id=2)
    assert result is None


def test_get_testsuite_run_by_id_with_user_link_found():
    suite_run = SimpleNamespace(id=1)
    link = SimpleNamespace(role="EDITOR")
    session = FakeSession(row=(suite_run, link))

    result = queries.get_testsuite_run_by_id_with_user_link(session, testsuite_run_id=1, user_id=2)
    assert result == (suite_run, link)
    assert session.statement is not None


def test_get_testsuite_run_by_id_with_user_link_not_found():
    session = FakeSession(row=None)
    result = queries.get_testsuite_run_by_id_with_user_link(session, testsuite_run_id=1, user_id=2)
    assert result is None


def test_get_testcase_run_by_id_with_user_link_found():
    case_run = SimpleNamespace(id=1)
    link = SimpleNamespace(role="VIEWER")
    session = FakeSession(row=(case_run, link))

    result = queries.get_testcase_run_by_id_with_user_link(session, testcase_run_id=1, user_id=2)
    assert result == (case_run, link)
    assert session.statement is not None


def test_get_testcase_run_by_id_with_user_link_not_found():
    session = FakeSession(row=None)
    result = queries.get_testcase_run_by_id_with_user_link(session, testcase_run_id=1, user_id=2)
    assert result is None
