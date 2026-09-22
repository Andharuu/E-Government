from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.api.auth import get_current_user
from app.database import get_db
from app.models.entities import User, Profile
from app.schemas.schemas import (
    ProfileCreate,
    ProfileUpdate,
    ProfileResponse,
)
from app.services.profile_service import calculate_profile_completion

router = APIRouter(prefix="/profile", tags=["Profil"])


@router.get("/me", response_model=ProfileResponse)
def get_my_profile(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Mengambil profil lengkap 29+ atribut pengguna terotentikasi."""
    profile = db.query(Profile).filter(Profile.user_id == current_user.id).first()
    if not profile:
        profile = Profile(user_id=current_user.id, email=current_user.email)
        db.add(profile)
        db.commit()
        db.refresh(profile)

    response = ProfileResponse.model_validate(profile)
    response.profile_completion = calculate_profile_completion(profile)
    return response


@router.put("/me", response_model=ProfileResponse)
def update_my_profile(
    payload: ProfileCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Pembaruan keseluruhan atribut profil pengguna (PUT)."""
    profile = db.query(Profile).filter(Profile.user_id == current_user.id).first()
    update_data = payload.model_dump(exclude_unset=True)

    if not profile:
        profile = Profile(user_id=current_user.id, **update_data)
        db.add(profile)
    else:
        for key, value in update_data.items():
            if hasattr(profile, key):
                setattr(profile, key, value)

    db.commit()
    db.refresh(profile)

    response = ProfileResponse.model_validate(profile)
    response.profile_completion = calculate_profile_completion(profile)
    return response


@router.patch("/me", response_model=ProfileResponse)
def patch_my_profile(
    payload: ProfileUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Pembaruan parsial atribut profil pengguna (PATCH)."""
    profile = db.query(Profile).filter(Profile.user_id == current_user.id).first()
    if not profile:
        profile = Profile(user_id=current_user.id)
        db.add(profile)

    update_dict = payload.model_dump(exclude_unset=True)
    for key, value in update_dict.items():
        if hasattr(profile, key):
            setattr(profile, key, value)

    db.commit()
    db.refresh(profile)

    response = ProfileResponse.model_validate(profile)
    response.profile_completion = calculate_profile_completion(profile)
    return response
