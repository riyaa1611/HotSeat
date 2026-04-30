from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    groq_api_key: str
    github_token: str = ""
    groq_model: str = "llama-3.1-70b-versatile"
    max_turns: int = 12
    wrap_up_turn: int = 10

    class Config:
        env_file = ".env"


@lru_cache()
def get_settings() -> Settings:
    return Settings()
