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
    generation_fallback_models: str = ""
    cors_origins: str = "http://localhost:5173,http://localhost:5174"
    wiki_user_agent: str = "PlaymakerAI/0.1 (learning project)"

    @property
    def generation_models(self) -> list[str]:
        """Primary model first, then the fallbacks in order."""
        names = [self.generation_model, *self.generation_fallback_models.split(",")]
        return [n.strip() for n in names if n.strip()]

    @property
    def cors_origin_list(self) -> list[str]:
        """Browser origins allowed to call the API."""
        return [o.strip() for o in self.cors_origins.split(",") if o.strip()]


settings = Settings()