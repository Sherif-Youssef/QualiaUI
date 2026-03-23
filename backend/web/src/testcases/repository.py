# from sqlmodel import select
# from src.database import SessionDep
# from src.testsuites.dependencies import TestSuiteRepositoryDep
# from .models import TestCase, TestSuite

# class TestCaseRepository:
#     def __init__(self, session: SessionDep):
#         self.session = session
    
#     def get(self, testsuite_id: int, testcase_id: int) -> TestCase | None:
#         return self.session.exec(select(TestCase).where(
#             TestCase.id == testcase_id,
#             TestCase.testsuite_id == testsuite_id,
#         )).first()
    