from pydantic_settings import BaseSettings, SettingsConfigDict
from functools import lru_cache


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8")

    groq_api_key: str = "test-key"
    github_token: str = ""
    database_url: str = ""
    supabase_jwt_secret: str = ""
    groq_model: str = "llama-3.1-70b-versatile"
    max_turns: int = 12
    wrap_up_turn: int = 10


@lru_cache()
def get_settings() -> Settings:
    return Settings()
