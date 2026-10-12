"""Field-level encryption for sensitive PII data."""

import os
import base64
import logging
from pathlib import Path
from typing import Optional
from cryptography.fernet import Fernet
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC

from app.core.config import settings

logger = logging.getLogger("govconnect.encryption")

# Salt acak per-instalasi (persisten, di-gitignore). Tidak lagi hardcoded.
_backend_dir = Path(__file__).resolve().parent.parent.parent
_SALT_FILE = _backend_dir / ".pii_salt"

# Penanda ciphertext agar deteksi tidak lagi mengandalkan heuristik base64.
CIPHER_PREFIX = "enc:v1:"


def _load_or_create_salt() -> bytes:
    """Muat salt acak per-instalasi; buat bila belum ada (mode 0600)."""
    try:
        if _SALT_FILE.exists():
            data = _SALT_FILE.read_bytes()
            if data:
                return data
        data = os.urandom(32)
        _SALT_FILE.write_bytes(data)
        try:
            os.chmod(_SALT_FILE, 0o600)
        except OSError:
            pass
        logger.warning(
            "Salt enkripsi PII dibuat otomatis di %s. Jangan commit file ini; "
            "backup bersama DB atau PII tidak dapat didekripsi.", _SALT_FILE.name
        )
        return data
    except Exception as exc:  # pragma: no cover - defensive
        logger.error("Gagal memuat/membuat salt PII: %s", exc)
        return os.urandom(32)


# ============================================================
# Encryption Service for PII Fields
# ============================================================

class FieldEncryption:
    """Encrypt/decrypt sensitive PII fields at application layer."""

    def __init__(self):
        self._fernet: Optional[Fernet] = None
        self._initialized = False

    def _initialize(self):
        """Initialize Fernet cipher from the DEDICATED PII key (not the JWT secret)."""
        if self._initialized:
            return

        # Derive 32-byte key from PII_ENCRYPTION_KEY using PBKDF2 + random per-install salt.
        salt = _load_or_create_salt()
        kdf = PBKDF2HMAC(
            algorithm=hashes.SHA256(),
            length=32,
            salt=salt,
            iterations=200000,
        )
        key = base64.urlsafe_b64encode(kdf.derive(settings.PII_ENCRYPTION_KEY.encode()))
        self._fernet = Fernet(key)
        self._initialized = True

    def encrypt(self, plaintext: Optional[str]) -> Optional[str]:
        """Encrypt plaintext string. Returns prefixed, base64-encoded ciphertext."""
        if plaintext is None or plaintext == "":
            return plaintext
        # Jangan enkripsi ulang bila sudah terenkripsi (idempotent).
        if self.is_encrypted(plaintext):
            return plaintext
        self._initialize()
        try:
            ciphertext = self._fernet.encrypt(plaintext.encode("utf-8"))
            return CIPHER_PREFIX + base64.urlsafe_b64encode(ciphertext).decode("ascii")
        except Exception as e:
            logger.error(f"Encryption failed: {e}")
            raise

    def decrypt(self, ciphertext: Optional[str]) -> Optional[str]:
        """Decrypt ciphertext. Returns plaintext string; original value if not encrypted."""
        if ciphertext is None or ciphertext == "":
            return ciphertext
        if not self.is_encrypted(ciphertext):
            # Legacy plaintext (belum dimigrasi) — kembalikan apa adanya.
            return ciphertext
        self._initialize()
        try:
            raw = ciphertext[len(CIPHER_PREFIX):]
            decoded = base64.urlsafe_b64decode(raw.encode("ascii"))
            plaintext = self._fernet.decrypt(decoded)
            return plaintext.decode("utf-8")
        except Exception as e:
            logger.error(f"Decryption failed for an encrypted value: {e}")
            raise

    def is_encrypted(self, value: Optional[str]) -> bool:
        """Check if value is one of OUR ciphertexts (explicit prefix, no heuristics)."""
        if not value or not isinstance(value, str):
            return False
        if not value.startswith(CIPHER_PREFIX):
            return False
        try:
            base64.urlsafe_b64decode(value[len(CIPHER_PREFIX):].encode("ascii"))
            return True
        except Exception:
            return False


# Global encryption instance
field_encryption = FieldEncryption()
