import os
from typing import List, Optional
from pathlib import Path
from dotenv import load_dotenv

# Cari file .env di direktori backend
backend_dir = Path(__file__).resolve().parent.parent.parent
env_path = backend_dir / ".env"
if env_path.exists():
    load_dotenv(dotenv_path=env_path)
else:
    load_dotenv()


class Settings:
    """Konfigurasi terpusat aplikasi backend GovConnect."""

    APP_NAME: str = os.getenv("APP_NAME", "GovConnect API Engine")
    APP_VERSION: str = os.getenv("APP_VERSION", "2.0.0")
    API_V1_PREFIX: str = os.getenv("API_V1_PREFIX", "/api/v1")
    ENVIRONMENT: str = os.getenv("ENVIRONMENT", "development")

    # Basis Data
    DATABASE_URL: str = os.getenv(
        "DATABASE_URL",
        "mysql+pymysql://govuser:govpassword@localhost:3306/govconnect_db"
    )
    SQL_ECHO: bool = os.getenv("SQL_ECHO", "false").lower() in ("true", "1", "yes")

    # Keamanan & JWT
    SECRET_KEY: str = os.getenv(
        "SECRET_KEY",
        "govconnect-super-secret-jwt-token-key-2026-production"
    )
    ALGORITHM: str = os.getenv("ALGORITHM", "HS256")
    ACCESS_TOKEN_EXPIRE_MINUTES: int = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", str(60 * 24 * 7)))

    # Keamanan CORS
    _cors_raw: str = os.getenv(
        "CORS_ORIGINS",
        "http://localhost:5173,http://127.0.0.1:5173,http://localhost:3000,http://127.0.0.1:3000"
    )
    CORS_ORIGIN_REGEX: Optional[str] = os.getenv(
        "CORS_ORIGIN_REGEX",
        r"^chrome-extension://[a-zA-Z0-9]+$"
    )

    # Rate Limiting
    RATE_LIMIT_LOGIN_PER_MINUTE: int = int(os.getenv("RATE_LIMIT_LOGIN_PER_MINUTE", "15"))
    RATE_LIMIT_GENERAL_PER_MINUTE: int = int(os.getenv("RATE_LIMIT_GENERAL_PER_MINUTE", "120"))

    @property
    def cors_origins_list(self) -> List[str]:
        if not self._cors_raw:
            return []
        return [origin.strip() for origin in self._cors_raw.split(",") if origin.strip()]

    @property
    def is_sqlite(self) -> bool:
        return self.DATABASE_URL.startswith("sqlite")

    def validate_security(self) -> None:
        """Validasi keamanan konfigurasi kunci JWT dan environment."""
        insecure_default = "govconnect-super-secret-jwt-token-key-2026-production"
        if self.ENVIRONMENT.lower() == "production":
            if self.SECRET_KEY == insecure_default or len(self.SECRET_KEY) < 32:
                raise RuntimeError(
                    "FATAL KEAMANAN: SECRET_KEY default atau kurang dari 32 karakter terdeteksi di production! "
                    "Harap generate SECRET_KEY acak dengan: python -c 'import secrets; print(secrets.token_hex(32))'"
                )


settings = Settings()
settings.validate_security()
