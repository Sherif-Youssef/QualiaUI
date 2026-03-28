from pydantic_settings import BaseSettings, SettingsConfigDict
from pathlib import Path
import pytz

timezone = pytz.timezone("Europe/Zurich")

ENV_FILE_PATH = Path(__file__).resolve().parents[2] / ".env"

class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=str(ENV_FILE_PATH), extra="ignore")
    DATABASE_URL: str
    LLM_MODEL: str = "gpt-5.4-nano"
    OPENAI_API_KEY: str


settings = Settings()