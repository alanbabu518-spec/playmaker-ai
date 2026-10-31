from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict

ROOT_ENV = Path(__file__).resolve().parents[3] / ".env"


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=ROOT_ENV, extra="ignore")

    database_url: str
    gemini_api_key: str
    embedding_model: str
    embedding_dim: int = 768
    generation_model: str
    wiki_user_agent: str = "PlaymakerAI/0.1 (learning project)"


settings = Settings()