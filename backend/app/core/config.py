import os
import secrets
import logging
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

_logger = logging.getLogger("govconnect.config")

# Nilai default lama yang di-commit ke repo & HARUS dianggap tidak aman.
_INSECURE_SECRET_DEFAULTS = {
    "govconnect-super-secret-jwt-token-key-2026-production",
    "govconnect-super-secret-jwt-token-key-2026-development",
    "",
}

# File kunci lokal (di-gitignore) untuk dev/demo bila env tidak menyediakan kunci.
_SECRET_KEY_FILE = backend_dir / ".secret_key"
_PII_KEY_FILE = backend_dir / ".pii_key"


def _load_or_create_key_file(path: Path, prefix: str) -> str:
    """Muat kunci acak dari file lokal; buat bila belum ada (mode 0600).

    Hanya dipakai sebagai fallback dev/demo. Di produksi, set
    SECRET_KEY & PII_ENCRYPTION_KEY lewat environment/secret manager.
    """
    try:
        if path.exists():
            value = path.read_text(encoding="utf-8").strip()
            if value:
                return value
        value = f"{prefix}{secrets.token_urlsafe(48)}"
        path.write_text(value, encoding="utf-8")
        try:
            os.chmod(path, 0o600)
        except OSError:
            pass
        _logger.warning(
            "Kunci keamanan tidak diset via environment — dibuat otomatis di %s. "
            "Untuk produksi, set lewat environment/secret manager.", path.name
        )
        return value
    except Exception as exc:  # pragma: no cover - defensive
        _logger.error("Gagal memuat/membuat file kunci %s: %s", path.name, exc)
        # Fallback terakhir: kunci acak in-memory (akan berubah tiap restart).
        return f"{prefix}{secrets.token_urlsafe(48)}"


def _load_or_create_secret_key() -> str:
    return _load_or_create_key_file(_SECRET_KEY_FILE, "jwt_")


def _load_or_create_pii_key() -> str:
    return _load_or_create_key_file(_PII_KEY_FILE, "pii_")


class Settings:
    """Konfigurasi terpusat aplikasi backend GovConnect."""

    APP_NAME: str = os.getenv("APP_NAME", "GovConnect API Engine")
    APP_VERSION: str = os.getenv("APP_VERSION", "2.0.0")
    API_V1_PREFIX: str = os.getenv("API_V1_PREFIX", "/api/v1")
    ENVIRONMENT: str = os.getenv("ENVIRONMENT", "development")
    # B-H2: Auto-migration switch (default true for dev/test, can be disabled in prod)
    AUTO_MIGRATE: bool = os.getenv("AUTO_MIGRATE", "true").lower() in ("true", "1", "yes")

    # Basis Data (default non-kredensial: SQLite lokal; MySQL wajib via env)
    DATABASE_URL: str = os.getenv(
        "DATABASE_URL",
        "sqlite:///./govconnect.db"
    )
    SQL_ECHO: bool = os.getenv("SQL_ECHO", "false").lower() in ("true", "1", "yes")

    # Keamanan & JWT
    SECRET_KEY: str = os.getenv("SECRET_KEY", "") or _load_or_create_secret_key()
    ALGORITHM: str = os.getenv("ALGORITHM", "HS256")
    # Umur access token diperpendek (default 12 jam, dari sebelumnya 7 hari) untuk
    # memperkecil jendela penyalahgunaan bila token dicuri (Gelombang C).
    ACCESS_TOKEN_EXPIRE_MINUTES: int = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", str(60 * 12)))

    # Enkripsi PII (field-level) — KUNCI TERPISAH dari SECRET_KEY JWT.
    # Bila tidak diset, dibuat otomatis (acak) dan disimpan ke file lokal non-repo.
    PII_ENCRYPTION_KEY: str = os.getenv("PII_ENCRYPTION_KEY", "") or _load_or_create_pii_key()

    # Keamanan CORS
    ALLOWED_ORIGIN: str = os.getenv("ALLOWED_ORIGIN", "chrome-extension://<EXTENSION_ID>")
    CORS_ORIGINS: str = os.getenv("CORS_ORIGINS", "")
    CORS_ORIGIN_REGEX: str = os.getenv("CORS_ORIGIN_REGEX", r"^chrome-extension://[a-zA-Z0-9]+$")

    # Provisioning admin (auditable) — daftar email dipisah koma yang di-promote
    # menjadi admin saat startup. Kosong = tidak ada promosi otomatis.
    ADMIN_EMAILS: str = os.getenv("ADMIN_EMAILS", "")

    # Rate Limiting
    RATE_LIMIT_LOGIN_PER_MINUTE: int = int(os.getenv("RATE_LIMIT_LOGIN_PER_MINUTE", "15"))
    RATE_LIMIT_GENERAL_PER_MINUTE: int = int(os.getenv("RATE_LIMIT_GENERAL_PER_MINUTE", "120"))

    # Proxy tepercaya (T3). X-Forwarded-For hanya dipercaya bila koneksi LANGSUNG
    # berasal dari proxy ini. Kosong = jangan percaya header XFF sama sekali.
    TRUSTED_PROXIES: str = os.getenv("TRUSTED_PROXIES", "")

    @property
    def trusted_proxies_list(self) -> List[str]:
        return [p.strip() for p in self.TRUSTED_PROXIES.split(",") if p.strip()]

    @property
    def cors_origins_list(self) -> List[str]:
        origins = [self.ALLOWED_ORIGIN]
        if self.ENVIRONMENT.lower() != "production":
            origins.extend([
                "http://localhost:5173",
                "http://127.0.0.1:5173",
                "http://localhost:5174",
                "http://127.0.0.1:5174",
                "http://localhost:5175",
                "http://127.0.0.1:5175",
                "http://localhost:4173",
                "http://127.0.0.1:4173",
                "http://localhost:3000",
                "http://127.0.0.1:3000"
            ])
        if self.CORS_ORIGINS:
            for o in self.CORS_ORIGINS.split(","):
                o = o.strip()
                if o and o not in origins:
                    origins.append(o)
        return origins

    @property
    def is_sqlite(self) -> bool:
        return self.DATABASE_URL.startswith("sqlite")

    def validate_security(self) -> None:
        """Validasi keamanan konfigurasi kunci JWT, KUNCI PII, dan environment.

        Dijalankan di SEMUA environment (bukan hanya production) untuk mencegah
        kunci default yang di-commit ke repo dipakai di mana pun.
        """
        problems: List[str] = []

        if self.SECRET_KEY in _INSECURE_SECRET_DEFAULTS:
            problems.append(
                "SECRET_KEY masih memakai nilai default yang bocor di repo. "
                "Generate: python -c \"import secrets; print(secrets.token_urlsafe(48))\""
            )
        if len(self.SECRET_KEY) < 32:
            problems.append("SECRET_KEY kurang dari 32 karakter.")

        if not self.PII_ENCRYPTION_KEY:
            problems.append("PII_ENCRYPTION_KEY kosong — enkripsi PII tidak aman.")
        if self.PII_ENCRYPTION_KEY in _INSECURE_SECRET_DEFAULTS:
            problems.append("PII_ENCRYPTION_KEY memakai nilai default yang tidak aman.")
        if self.PII_ENCRYPTION_KEY == self.SECRET_KEY:
            problems.append(
                "PII_ENCRYPTION_KEY harus BERBEDA dari SECRET_KEY (jangan satukan kunci JWT & kunci PII)."
            )

        if problems:
            message = (
                "FATAL KEAMANAN: konfigurasi kunci tidak aman:\n  - "
                + "\n  - ".join(problems)
            )
            if self.ENVIRONMENT.lower() == "production":
                raise RuntimeError(message)
            # Non-production: fail-fast juga, karena kunci bocor tetap berbahaya.
            raise RuntimeError(message)


settings = Settings()
settings.validate_security()
