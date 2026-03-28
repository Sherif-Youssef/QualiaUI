from fastapi import APIRouter
from .active.router import router as active_router


router = APIRouter(prefix="/projects/{project_id}/runs", tags=["runs"])
router.include_router(active_router)
