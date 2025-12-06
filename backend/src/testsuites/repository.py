from sqlmodel import select
from src.database import SessionDep
from .models import TestSuite

class TestSuiteRepository:
    def __init__(self, session: SessionDep):
        self.session = session
    
    def get(self, project_id: int, testsuite_id: int) -> TestSuite | None:
        return self.session.exec(select(TestSuite).where(
            TestSuite.id == testsuite_id,
            TestSuite.project_id == project_id
        )).first()
    
    def save(self, testsuite: TestSuite) -> TestSuite:
        self.session.add(testsuite)
        self.session.commit()
        self.session.refresh(testsuite)
        return testsuite

    def delete(self, testsuite: TestSuite) -> None:
        self.session.delete(testsuite)
        self.session.commit()
