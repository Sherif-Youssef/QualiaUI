from pydantic_settings import BaseSettings, SettingsConfigDict
import pytz

timezone = pytz.timezone("Europe/Zurich")

class Settings(BaseSettings):
    DATABASE_URL: str = "sqlite:///database.db"

settings = Settings()