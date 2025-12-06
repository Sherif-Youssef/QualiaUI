from fastapi import FastAPI
from .auth.router import router as users_router
from dotenv import load_dotenv
from .database import create_all
load_dotenv()

create_all()

app = FastAPI()

app.include_router(users_router)
