"""
TerraTrace AI — Core Configuration
Reads environment variables (from .env) into a typed Pydantic settings model.
"""

from __future__ import annotations

from functools import lru_cache
from typing import List

from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    # ── Application ───────────────────────────────────────────
    app_name: str = "TerraTrace AI"
    version: str = "0.1.0"
    environment: str = "development"
    log_level: str = "INFO"

    # ── CORS ──────────────────────────────────────────────────
    allowed_origins: str = "http://localhost:5173,http://localhost:3000"

    @property
    def allowed_origins_list(self) -> List[str]:
        return [o.strip() for o in self.allowed_origins.split(",") if o.strip()]

    # ── Database ──────────────────────────────────────────────
    database_url: str = (
        "postgresql+asyncpg://terratrace:terratrace_dev_password@localhost:5432/terratrace"
    )
    postgres_host: str = "localhost"
    postgres_port: int = 5432
    postgres_db: str = "terratrace"
    postgres_user: str = "terratrace"
    postgres_password: str = "terratrace_dev_password"

    # ── External APIs (optional for Phase 1) ──────────────────
    copernicus_client_id: str = ""
    copernicus_client_secret: str = ""
    gemini_api_key: str = ""
    groq_api_key: str = ""
    hf_token: str = ""


@lru_cache
def get_settings() -> Settings:
    """Return a cached Settings instance (singleton per process)."""
    return Settings()
