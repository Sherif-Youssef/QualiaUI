from fastapi import APIRouter
from .active.router import router as active_router
from .history.router import router as history_router


router = APIRouter(prefix="/projects/{project_id}/runs", tags=["runs"])
router.include_router(active_router)
router.include_router(history_router)
