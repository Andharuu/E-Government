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
    enforce_rate_limit
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
@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
def register(request: Request, payload: UserCreate, db: Session = Depends(get_db)):
    """Mendaftarkan akun baru pengguna GovConnect."""
    enforce_rate_limit(request, max_requests=settings.RATE_LIMIT_LOGIN_PER_MINUTE)

    existing = db.query(User).filter(User.email == payload.email).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Alamat email sudah terdaftar"
        )

    user = User(
        email=payload.email,
        hashed_password=hash_password(payload.password)
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


@router.post("/login", response_model=TokenResponse)
def login(request: Request, form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    """Otentikasi pengguna menggunakan kredensial dan terbitkan JWT access token."""
    enforce_rate_limit(request, max_requests=settings.RATE_LIMIT_LOGIN_PER_MINUTE)

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
def get_me(current_user: User = Depends(get_current_user)):
    """Mengembalikan informasi akun pengguna yang sedang terotentikasi."""
    return current_user


@router.post("/change-password", response_model=MessageResponse)
def change_password(
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
