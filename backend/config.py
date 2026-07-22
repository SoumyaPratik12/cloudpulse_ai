"""Application configuration settings."""
import logging
from typing import List, ClassVar
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Application settings from environment variables."""

    # Server
    app_name: str = "CloudPulse AI"
    app_version: str = "0.1.0"
    debug: bool = False
    environment: str = "production"
    log_level: str = "INFO"

    # Database
    database_url: str = "postgresql://user:password@localhost:5432/cloudpulse"
    database_echo: bool = False

    # Redis
    redis_url: str = "redis://localhost:6379/0"

    # JWT
    secret_key: str = "your-secret-key-change-in-production"
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 30
    refresh_token_expire_days: int = 7

    # AWS
    aws_region: str = "ap-south-1"
    aws_access_key_id: str = ""
    aws_secret_access_key: str = ""

    # LLM
    openai_api_key: str = ""
    openai_model: str = "gpt-4"
    anthropic_api_key: str = ""

    # CORS
    frontend_url: str = "http://localhost:3000"
    cors_origins: List[str] = ["http://localhost:3000", "http://localhost:5173"]

    # Email
    smtp_host: str = "smtp.gmail.com"
    smtp_port: int = 587
    smtp_user: str = ""
    smtp_password: str = ""

    class Config:
        env_file = ".env"
        case_sensitive = False


settings = Settings()

# Configure logging
logging.basicConfig(
    level=settings.log_level,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger(__name__)
