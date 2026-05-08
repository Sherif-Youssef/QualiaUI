from pydantic_settings import BaseSettings, SettingsConfigDict
from pathlib import Path
from typing import Optional


ENV_FILE_PATH = Path(__file__).resolve().parents[2] / ".env" 

class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=str(ENV_FILE_PATH), extra="ignore")
    DATABASE_URL: str

    CELERY_BROKER: str = "redis://redis:6379/0"
    REDIS_STREAM: str = "redis://redis:6379/1"
    CELERY_BACKEND: str = "redis://redis:6379/2" 
    LOGFIRE_TOKEN: Optional[str] = None

    AWS_ACCESS_KEY_ID: str
    AWS_SECRET_ACCESS_KEY: str
    AWS_REGION: str
    S3_ENDPOINT_URL: str = "http://minio:9000"
    S3_SCREENSHOTS_BUCKET: str = "qualia-screenshots"
    S3_PROVIDER: str = 'minio'

settings = Settings() # pyright: ignore[reportCallIssue]