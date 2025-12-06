from pydantic_settings import BaseSettings, SettingsConfigDict

class AuthSettings(BaseSettings):
    JWT_SECRET_KEY: str
    JWT_ALGORITHM: str
    JWT_ACCESS_TOKEN_EXPIRATION_MINUTES: int
    JWT_REFRESH_TOKEN_EXPIRATION_MINUTES: int
    
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

auth_settings = AuthSettings()
