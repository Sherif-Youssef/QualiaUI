from fastapi import FastAPI, APIRouter
from src.auth.router import router as users_router
from src.projects.router import router as projects_router
from src.testsuites.router import router as testsuites_router
from src.testcases.router import router as testcases_router
from src.runs.router import router as runs_router
from src.llms.router import router as llms_router

app = FastAPI()

api_router = APIRouter(prefix="/api/v1")
api_router.include_router(users_router)
api_router.include_router(projects_router)
api_router.include_router(testsuites_router)
api_router.include_router(testcases_router)
api_router.include_router(runs_router)
api_router.include_router(llms_router)

app.include_router(api_router)