from functools import lru_cache

from pydantic import AnyHttpUrl, Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    app_name: str = "ModelWeave"
    app_env: str = "local"
    frontend_url: str = "http://localhost:3000"
    backend_url: str = "http://localhost:8000"
    cors_origins: str = "http://localhost:3000"

    llm_provider: str = "anthropic"
    anthropic_api_key: str = ""
    anthropic_model: str = "claude-sonnet-4-6"
    embedding_model: str = "BAAI/bge-small-en-v1.5"

    jwt_secret: str = ""
    api_key_encryption_secret: str = ""

    supabase_url: AnyHttpUrl
    supabase_anon_key: str
    supabase_service_role_key: str
    database_url: str

    qdrant_url: AnyHttpUrl
    qdrant_api_key: str
    qdrant_collection_documents: str = "modelweave_documents"
    qdrant_collection_memory: str = "modelweave_memory"

    redis_url: str = "redis://localhost:6379/0"

    model_config = SettingsConfigDict(env_file=(".env", "../.env"), env_file_encoding="utf-8", extra="ignore")

    @property
    def cors_origin_list(self) -> list[str]:
        return [origin.strip() for origin in self.cors_origins.split(",") if origin.strip()]


@lru_cache
def get_settings() -> Settings:
    return Settings()
