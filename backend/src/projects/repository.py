from sqlmodel import select
from src.database import SessionDep
from .models import Project, UserProjectLink

class ProjectRepository:
    def __init__(self, session: SessionDep):
        self.session = session
    
    def get(self, project_id: int) -> Project | None:
        return self.session.get(Project, project_id)
    
    def get_link(self, project_id: int, user_id: int) -> UserProjectLink | None:
        return self.session.exec(select(UserProjectLink).where(
            UserProjectLink.user_id == user_id,
            UserProjectLink.project_id == project_id
        )).first()
    
    def save(self, project: Project) -> Project:
        self.session.add(project)
        self.session.commit()
        self.session.refresh(project)
        return project

    def delete(self, project: Project) -> None:
        self.session.delete(project)
        self.session.commit()
