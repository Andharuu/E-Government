import logging
import time
from collections import defaultdict, deque
from datetime import datetime, timedelta, timezone
from typing import Optional, Dict
import bcrypt
from jose import jwt
from fastapi import HTTPException, Request, status
from slowapi import Limiter
from slowapi.util import get_remote_address

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
# Rate Limiter (SlowAPI)
# ============================================================
def get_ip_or_token(request: Request) -> str:
    """Menggunakan user_id terverifikasi dari token otentikasi (jika valid) atau IP sebagai kunci rate limit.

    Token palsu atau tidak bertanda-tangan sah diabaikan agar penyerang tidak bisa
    memalsukan header Authorization Bearer acak untuk mem-bypass rate limiter IP.
    IP diambil dengan kebijakan trusted-proxy yang sama seperti jejak audit
    (T3) agar X-Forwarded-For tidak bisa dipakai memalsukan kunci rate limit.
    """
    from app.services.audit_service import get_client_ip
    client_ip = get_client_ip(request) or get_remote_address(request)

    auth_header = request.headers.get("Authorization")
    if auth_header and auth_header.startswith("Bearer "):
        parts = auth_header.split(" ", 1)
        if len(parts) == 2:
            raw_token = parts[1].strip()
            if raw_token:
                try:
                    payload = jwt.decode(
                        raw_token,
                        settings.SECRET_KEY,
                        algorithms=[settings.ALGORITHM]
                    )
                    sub = payload.get("sub")
                    if sub:
                        return f"user:{sub}"
                except Exception:
                    # Token tidak valid, expired, atau dipalsukan -> batasi berdasarkan IP!
                    pass

    return f"ip:{client_ip}"

limiter = Limiter(key_func=get_ip_or_token)
