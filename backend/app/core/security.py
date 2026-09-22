import logging
import time
from collections import defaultdict, deque
from datetime import datetime, timedelta, timezone
from typing import Optional, Dict
import bcrypt
from jose import jwt
from fastapi import HTTPException, Request, status

from app.core.config import settings

logger = logging.getLogger("govconnect.security")


# ============================================================
# Enkripsi Password & Penanganan Token JWT
# ============================================================
def hash_password(password: str) -> str:
    """Hash password teks biasa menggunakan bcrypt salt (maks 72 byte sesuai spek bcrypt)."""
    salt = bcrypt.gensalt()
    pw_bytes = password.encode("utf-8")[:72]
    return bcrypt.hashpw(pw_bytes, salt).decode("utf-8")


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verifikasi apakah plain password cocok dengan hashed password."""
    try:
        pw_bytes = plain_password.encode("utf-8")[:72]
        return bcrypt.checkpw(
            pw_bytes,
            hashed_password.encode("utf-8")
        )
    except Exception:
        return False


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    """Buat token JWT bertanda tangan digital dengan masa berlaku."""
    now = datetime.now(timezone.utc)
    to_encode = data.copy()
    expire = now + (
        expires_delta or timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    )
    to_encode.update({"exp": expire, "iat": now})
    return jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)


# ============================================================
# In-Memory Rate Limiter Sederhana (Token Bucket / Sliding Window)
# ============================================================
class InMemoryRateLimiter:
    """Rate limiter berbasis sliding window per IP client untuk mencegah brute force."""

    def __init__(self):
        self._records: Dict[str, deque] = defaultdict(deque)

    def check_rate_limit(self, key: str, max_requests: int, window_seconds: int = 60) -> bool:
        """
        Kembalikan True jika request diperbolehkan, False jika melebihi kuota.
        """
        now = time.time()
        queue = self._records[key]

        # Bersihkan timestamp yang berada di luar jendela waktu
        while queue and queue[0] <= now - window_seconds:
            queue.popleft()

        if len(queue) >= max_requests:
            return False

        queue.append(now)
        return True

    def reset(self):
        """Mereset seluruh rekaman antrian request (berguna untuk testing)."""
        self._records.clear()


rate_limiter = InMemoryRateLimiter()


def enforce_rate_limit(request: Request, max_requests: int = 60, window_seconds: int = 60):
    """Dependency / Helper untuk memverifikasi rate limit pada endpoint sensitif."""
    client_ip = request.client.host if request.client else "unknown"
    path = request.url.path
    key = f"{client_ip}:{path}"

    if not rate_limiter.check_rate_limit(key, max_requests=max_requests, window_seconds=window_seconds):
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail=f"Terlalu banyak permintaan. Silakan tunggu {window_seconds} detik sebelum mencoba kembali.",
            headers={"Retry-After": str(window_seconds)}
        )
