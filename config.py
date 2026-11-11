"""
AgentGuard Configuration Module.
Loads environment variables and provides centralized application settings.
"""

import os
from decimal import Decimal
from typing import List
from pathlib import Path
from dotenv import load_dotenv

# Load .env from current directory or backend directory
env_path = Path(__file__).resolve().parent / ".env"
if env_path.exists():
    load_dotenv(dotenv_path=env_path)
else:
    load_dotenv()


class Settings:
    # Server settings
    HOST: str = os.getenv("HOST", "0.0.0.0")
    PORT: int = int(os.getenv("PORT", "8000"))
    ENVIRONMENT: str = os.getenv("ENVIRONMENT", "development")
    DEBUG: bool = os.getenv("DEBUG", "false").lower() in ("true", "1", "yes")

    # CORS
    _cors_origins_raw = os.getenv("CORS_ORIGINS", "*")
    CORS_ORIGINS: List[str] = (
        ["*"] if _cors_origins_raw.strip() == "*"
        else [origin.strip() for origin in _cors_origins_raw.split(",") if origin.strip()]
    )

    # Database
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./agentguard.db")
    # Fix for SQLAlchemy if postgres:// is used on Render
    if DATABASE_URL.startswith("postgres://"):
        DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)

    # Default Security Policies
    DEFAULT_DAILY_LIMIT: Decimal = Decimal(os.getenv("DEFAULT_DAILY_LIMIT", "200.00"))
    DEFAULT_MAX_TRANSACTION: Decimal = Decimal(os.getenv("DEFAULT_MAX_TRANSACTION", "100.00"))
    DEFAULT_AUTO_APPROVAL_LIMIT: Decimal = Decimal(os.getenv("DEFAULT_AUTO_APPROVAL_LIMIT", "50.00"))
    DEFAULT_ALLOWED_MERCHANTS: List[str] = [
        m.strip()
        for m in os.getenv(
            "DEFAULT_ALLOWED_MERCHANTS", "TrustedStore,TechStore,VerifiedShop,OfficeSuppliesCo"
        ).split(",")
        if m.strip()
    ]
    DEFAULT_CURRENCY: str = os.getenv("DEFAULT_CURRENCY", "USD")

    # PayPal Configuration
    PAYPAL_CLIENT_ID: str = os.getenv("PAYPAL_CLIENT_ID", "")
    PAYPAL_CLIENT_SECRET: str = os.getenv("PAYPAL_CLIENT_SECRET", "")
    PAYPAL_BASE_URL: str = os.getenv("PAYPAL_BASE_URL", "https://api-m.sandbox.paypal.com").rstrip("/")
    PAYPAL_WEBHOOK_ID: str = os.getenv("PAYPAL_WEBHOOK_ID", "")

    # Channel3 Configuration
    CHANNEL3_API_KEY: str = os.getenv("CHANNEL3_API_KEY", "")
    CHANNEL3_BASE_URL: str = os.getenv("CHANNEL3_BASE_URL", "https://api.channel3.ai").rstrip("/")

    # AI Configuration
    GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY", "")
    OPENAI_API_KEY: str = os.getenv("OPENAI_API_KEY", "")
    DEFAULT_AI_PROVIDER: str = os.getenv("DEFAULT_AI_PROVIDER", "gemini")

    @property
    def is_paypal_configured(self) -> bool:
        return bool(
            self.PAYPAL_CLIENT_ID
            and self.PAYPAL_CLIENT_SECRET
            and not self.PAYPAL_CLIENT_ID.startswith("your_")
        )

    @property
    def is_channel3_configured(self) -> bool:
        return bool(
            self.CHANNEL3_API_KEY
            and not self.CHANNEL3_API_KEY.startswith("your_")
        )

    @property
    def is_gemini_configured(self) -> bool:
        return bool(
            self.GEMINI_API_KEY
            and not self.GEMINI_API_KEY.startswith("your_")
        )

    @property
    def is_openai_configured(self) -> bool:
        return bool(
            self.OPENAI_API_KEY
            and not self.OPENAI_API_KEY.startswith("your_")
        )


settings = Settings()
