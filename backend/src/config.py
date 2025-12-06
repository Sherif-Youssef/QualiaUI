from pydantic_settings import BaseSettings, SettingsConfigDict
import pytz

timezone = pytz.timezone("Europe/Zurich")

class Settings(BaseSettings):
    DATABASE_URL: str = "sqlite:///database.db"
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

settings = Settings()