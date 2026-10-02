from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import List


class Settings(BaseSettings):
    APP_NAME: str = "GovResolve"
    ENV: str = "development"
    DEBUG: bool = True
    HOST: str = "0.0.0.0"
    PORT: int = 8000
    SECRET_KEY: str = "default_insecure_secret_key"
    CORS_ORIGINS: str = "http://localhost:5173,http://127.0.0.1:5173,http://192.168.0.115:5173"

    DATABASE_URL: str = "sqlite+aiosqlite:///./data/govresolve.db"
    AGENT_MEMORY_DIR: str = "./data/agent_memory"

    # Gov.br Auth
    GOVBR_CLIENT_ID: str = ""
    GOVBR_CLIENT_SECRET: str = ""
    GOVBR_REDIRECT_URI: str = ""
    GOVBR_AUTH_URL: str = ""
    GOVBR_TOKEN_URL: str = ""

    # OmniRoute LLM Router & Fallback Models (5 modelos em cascata)
    OMNIROUTE_BASE_URL: str = "http://localhost:20128/v1"
    OMNIROUTE_API_KEY: str = "sk-8597d4431551d726-821dde-1366319e"
    OMNIROUTE_MODELS: str = "auto/best-chat,auto/fast,uq/turboderp/Qwen3.8-27B-exl3,auto/smart,dva/gemini-3-7-flash-high"

    # Google Gemini Direct (Fallback)
    GEMINI_API_KEY: str = ""
    GEMINI_MODEL: str = "gemini-2.5-flash"

    # SMTP / Notificações
    SMTP_HOST: str = "localhost"
    SMTP_PORT: int = 1025
    SMTP_USER: str = ""
    SMTP_PASSWORD: str = ""
    SMTP_FROM_EMAIL: str = "notificacoes@govresolve.com.br"
    SMTP_USE_TLS: bool = False

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore"
    )

    @property
    def cors_origins_list(self) -> List[str]:
        return [origin.strip() for origin in self.CORS_ORIGINS.split(",") if origin.strip()]

    @property
    def omniroute_model_list(self) -> List[str]:
        return [m.strip() for m in self.OMNIROUTE_MODELS.split(",") if m.strip()]


settings = Settings()
