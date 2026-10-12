from typing import Dict, Any
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.api.v1.routers.auth import get_current_user
from app.database import get_db
from app.models.entities import User, Profile
from app.schemas.schemas import (
    ProfileCreate,
    ProfileUpdate,
    ProfileResponse,
)
from app.services.profile_service import (
    calculate_profile_completion,
    profile_to_dict,
    update_profile,
    get_profile_or_create,
    encrypt_profile_data,
    decrypt_profile_data,
    CORE_PROFILE_FIELDS,
)

router = APIRouter(prefix="/profile", tags=["Profil"])


@router.get("/me", response_model=ProfileResponse)
def get_my_profile(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Mengambil profil lengkap 29+ atribut pengguna terotentikasi (PII didekripsi transparan)."""
    profile = get_profile_or_create(db, current_user.id, current_user.email)

    # Convert to dict and decrypt PII fields
    profile_dict = profile_to_dict(profile)
    profile_dict["profile_completion"] = calculate_profile_completion(profile)

    return ProfileResponse(**profile_dict)


@router.put("/me", response_model=ProfileResponse)
def update_my_profile(
    payload: ProfileCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Pembaruan keseluruhan atribut profil pengguna (PUT) — PII dienkripsi."""
    profile = get_profile_or_create(db, current_user.id, current_user.email)

    update_data = payload.model_dump(exclude_unset=True)
    update_profile(db, profile, update_data)

    profile_dict = profile_to_dict(profile)
    profile_dict["profile_completion"] = calculate_profile_completion(profile)

    return ProfileResponse(**profile_dict)


@router.patch("/me", response_model=ProfileResponse)
def patch_my_profile(
    payload: ProfileUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Pembaruan parsial atribut profil pengguna (PATCH) — PII dienkripsi."""
    profile = get_profile_or_create(db, current_user.id, current_user.email)

    update_dict = payload.model_dump(exclude_unset=True)
    update_profile(db, profile, update_dict)

    profile_dict = profile_to_dict(profile)
    profile_dict["profile_completion"] = calculate_profile_completion(profile)

    return ProfileResponse(**profile_dict)
