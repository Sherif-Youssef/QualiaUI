from sqlmodel import select
from src.database import SessionDep
from src.base.repository import BaseRepository
from .models import TestSuite

class TestSuiteRepository(BaseRepository):
    
    def get(self, project_id: int, testsuite_id: int) -> TestSuite | None:
        return self.session.exec(select(TestSuite).where(
            TestSuite.id == testsuite_id,
            TestSuite.project_id == project_id
        )).first()