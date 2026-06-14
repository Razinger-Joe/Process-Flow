"""
ProcessFlow Studio — Application Settings

Reads environment variables via pydantic-settings.
All configuration is centralized here and accessed
throughout the app as `from app.config import settings`.
"""

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Application settings loaded from .env file."""

    # ---- Database ----
    DATABASE_URL: str = "postgresql+asyncpg://user:password@localhost:5432/processflow"

    # ---- Redis ----
    REDIS_URL: str = "redis://localhost:6379/0"

    # ---- JWT Auth ----
    SECRET_KEY: str = "your-jwt-secret-key-here-change-in-production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440  # 24 hours

    # ---- SMTP ----
    SMTP_HOST: str = "smtp.gmail.com"
    SMTP_PORT: int = 587
    SMTP_USER: str = ""
    SMTP_PASSWORD: str = ""

    # ---- CORS ----
    FRONTEND_URL: str = "http://localhost:3000"

    # ---- App ----
    ENVIRONMENT: str = "development"
    APP_VERSION: str = "1.0.0"

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True,
    )

    @property
    def is_development(self) -> bool:
        """Check if running in development mode."""
        return self.ENVIRONMENT == "development"

    @property
    def cors_origins(self) -> list[str]:
        """Allowed CORS origins based on environment."""
        origins = [self.FRONTEND_URL]
        if self.is_development:
            origins.extend([
                "http://localhost:3000",
                "http://localhost:3001",
                "http://127.0.0.1:3000",
            ])
        return list(set(origins))


settings = Settings()
