from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Request, status
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from jose import JWTError, jwt
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.security import (
    hash_password,
    verify_password,
    create_access_token,
    limiter
)
from app.database import get_db
from app.models.entities import User
from app.schemas.schemas import (
    UserCreate,
    UserResponse,
    TokenResponse,
    PasswordChangeRequest,
    MessageResponse
)

oauth2_scheme = OAuth2PasswordBearer(tokenUrl=f"{settings.API_V1_PREFIX}/auth/login")

router = APIRouter(prefix="/auth", tags=["Autentikasi"])


def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)) -> User:
    """Dependency otentikasi: mendecode token JWT dan mengambil user aktif dari basis data."""
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Token tidak valid atau telah kedaluwarsa",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        user_id: Optional[str] = payload.get("sub")
        if user_id is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception

    user = db.query(User).filter(User.id == int(user_id)).first()
    if user is None:
        raise credentials_exception
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Akun pengguna telah dinonaktifkan"
        )
    return user


# ============================================================
# Endpoints Otentikasi
# ============================================================
@router.post("/register", response_model=MessageResponse, status_code=status.HTTP_201_CREATED)
@limiter.limit("30/minute")
def register(request: Request, payload: UserCreate, db: Session = Depends(get_db)):
    """
    Mendaftarkan akun baru pengguna GovConnect.

    Catatan keamanan (anti email-enumeration): respons SELALU identik, baik ketika
    email baru berhasil dibuat maupun ketika email sudah terdaftar. Ini mencegah
    penyerang menebak email mana yang terdaftar pada sistem.

    Email dinormalisasi (lowercase + strip) agar konsisten dengan proses login.
    Akun yang sudah ada TIDAK pernah ditimpa (kata sandi lama tetap aman).
    """
    email = payload.email.strip().lower()

    existing = db.query(User).filter(User.email == email).first()
    if not existing:
        # Hanya buat jika benar-benar belum ada. Jika email sudah terdaftar kita
        # tidak melakukan apa pun (tidak mengganti password) — namun respons tetap sama.
        user = User(
            email=email,
            hashed_password=hash_password(payload.password),
        )
        db.add(user)
        db.commit()

    return {"detail": "Jika email belum terdaftar, akun Anda telah berhasil dibuat."}


@router.post("/login", response_model=TokenResponse)
@limiter.limit("30/minute")
def login(request: Request, form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    """Otentikasi pengguna menggunakan kredensial dan terbitkan JWT access token."""

    email = form_data.username.strip().lower()
    user = db.query(User).filter(User.email == email).first()

    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Email atau kata sandi tidak sesuai",
            headers={"WWW-Authenticate": "Bearer"},
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Akun pengguna telah dinonaktifkan"
        )

    token = create_access_token(data={"sub": str(user.id), "email": user.email})
    return {"access_token": token, "token_type": "bearer"}


@router.get("/me", response_model=UserResponse)
@limiter.limit("30/minute")
def get_me(request: Request, current_user: User = Depends(get_current_user)):
    """Mengembalikan informasi akun pengguna yang sedang terotentikasi."""
    return current_user


@router.post("/change-password", response_model=MessageResponse)
@limiter.limit("30/minute")
def change_password(
    request: Request,
    payload: PasswordChangeRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Mengubah kata sandi akun pengguna."""
    if not verify_password(payload.old_password, current_user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Kata sandi lama salah"
        )

    if payload.old_password == payload.new_password:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Kata sandi baru tidak boleh sama dengan kata sandi lama"
        )

    current_user.hashed_password = hash_password(payload.new_password)
    db.commit()
    return {"detail": "Kata sandi berhasil diperbarui"}
