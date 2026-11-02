from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import List


class Settings(BaseSettings):
    APP_NAME: str = "GovResolve"
    ENV: str = "development"
    DEBUG: bool = True
    HOST: str = "0.0.0.0"
    PORT: int = 8000
    SECRET_KEY: str = ""
    DEMO_STAFF_ACCESS_CODE: str = ""
    DEMO_MODE: bool = False
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
    OMNIROUTE_API_KEY: str = ""
    OMNIROUTE_MODELS: str = "ddgw/mistral-small-2603,ddgw/gpt-5.4-mini,ddgw/gpt-5.4-nano,uq/turboderp/Qwen3.8-27B-exl3,ddgw/tinfoil/gemma4-31b"

    # OpenAI is the production default; OmniRoute remains available for experiments.
    AI_PROVIDER: str = "openai"
    OPENAI_API_KEY: str = ""
    OPENAI_BASE_URL: str = "https://api.openai.com/v1"
    OPENAI_MODEL: str = "gpt-6-luna"

    # Google Gemini Direct (Fallback)
    GEMINI_API_KEY: str = ""
    GEMINI_MODEL: str = "gemini-2.5-flash"

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
