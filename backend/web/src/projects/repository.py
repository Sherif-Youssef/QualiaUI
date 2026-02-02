from sqlmodel import select
from src.database import SessionDep
from src.base.repository import BaseRepository
from .models import Project, UserProjectLink

class ProjectRepository(BaseRepository):
    
    def get(self, project_id: int) -> Project | None:
        return self.session.get(Project, project_id)
    
    def get_link(self, project_id: int, user_id: int) -> UserProjectLink | None:
        return self.session.exec(select(UserProjectLink).where(
            UserProjectLink.user_id == user_id,
            UserProjectLink.project_id == project_id
        )).first()
