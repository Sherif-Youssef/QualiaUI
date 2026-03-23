from typing import Annotated

from fastapi import Depends, HTTPException, Path, status

from src.auth.dependencies import UserDep
from src.auth.models import Role as UserRole
from src.database import SessionDep

from .models import Project, Role

