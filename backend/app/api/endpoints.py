from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from urllib.parse import urlparse

from app.database import get_db
from app.models.entities import User, Profile, Mapping, Activity
from app.schemas.schemas import (
    ProfileCreate, ProfileResponse,
    MappingCreate, MappingResponse,
    ActivityCreate, ActivityResponse
)
from app.api.auth import get_current_user

router = APIRouter(prefix="/api/v1")


# --- PROFILE ENDPOINTS ---
@router.get("/profile/me", response_model=ProfileResponse)
def get_my_profile(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Ambil profil pengguna yang sedang login."""
    profile = db.query(Profile).filter(Profile.user_id == current_user.id).first()
    if not profile:
        # Buat profil kosong jika belum ada
        profile = Profile(user_id=current_user.id)
        db.add(profile)
        db.commit()
        db.refresh(profile)
    return profile


@router.put("/profile/me", response_model=ProfileResponse)
def update_my_profile(
    payload: ProfileCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Perbarui profil pengguna yang sedang login."""
    profile = db.query(Profile).filter(Profile.user_id == current_user.id).first()
    if not profile:
        profile = Profile(user_id=current_user.id, **payload.model_dump())
        db.add(profile)
    else:
        for key, value in payload.model_dump(exclude_unset=True).items():
            # Handle field name differences
            if key == "phone_number":
                setattr(profile, "phone", value)
            else:
                setattr(profile, key, value)
    db.commit()
    db.refresh(profile)
    return profile


# --- MAPPING ENDPOINTS ---
@router.get("/mappings", response_model=List[MappingResponse])
def get_mappings(
    domain: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Ambil mapping per domain untuk user yang sedang login."""
    mappings = db.query(Mapping).filter(
        Mapping.user_id == current_user.id,
        Mapping.domain == domain
    ).all()
    return mappings


@router.post("/mappings", response_model=MappingResponse)
def create_mapping(
    payload: MappingCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Tambah field mapping baru untuk user yang sedang login."""
    new_mapping = Mapping(user_id=current_user.id, **payload.model_dump())
    db.add(new_mapping)
    db.commit()
    db.refresh(new_mapping)
    return new_mapping


@router.delete("/mappings/{mapping_id}", status_code=204)
def delete_mapping(
    mapping_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Hapus field mapping milik user yang sedang login."""
    mapping = db.query(Mapping).filter(
        Mapping.id == mapping_id,
        Mapping.user_id == current_user.id
    ).first()
    if not mapping:
        raise HTTPException(status_code=404, detail="Mapping tidak ditemukan")
    db.delete(mapping)
    db.commit()


# --- ACTIVITY ENDPOINTS ---
@router.post("/activities", response_model=ActivityResponse)
def log_activity(
    payload: ActivityCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Catat aktivitas autofill. Tidak menyimpan nilai data pribadi."""
    # Ekstrak domain dari URL jika tidak disediakan
    domain = payload.website_domain
    if not domain and payload.target_url:
        try:
            domain = urlparse(payload.target_url).netloc
        except Exception:
            domain = None

    activity = Activity(
        user_id=current_user.id,
        target_url=payload.target_url,
        website_domain=domain,
        action=payload.action,
        fields_detected=payload.fields_detected,
        fields_filled=payload.fields_filled,
        status=payload.status
    )
    db.add(activity)
    db.commit()
    db.refresh(activity)
    return activity


@router.get("/activities", response_model=List[ActivityResponse])
def get_activities(
    limit: int = 10,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Ambil riwayat aktivitas autofill untuk user yang sedang login."""
    activities = (
        db.query(Activity)
        .filter(Activity.user_id == current_user.id)
        .order_by(Activity.created_at.desc())
        .limit(limit)
        .all()
    )
    return activities


@router.get("/activities/stats")
def get_activity_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Kembalikan statistik autofill untuk KPI Dashboard."""
    from sqlalchemy import func
    activities = db.query(Activity).filter(Activity.user_id == current_user.id).all()

    total = len(activities)
    success_count = sum(1 for a in activities if a.status == "success")
    partial_count = sum(1 for a in activities if a.status == "partial")
    failed_count = sum(1 for a in activities if a.status == "failed")
    total_fields_filled = sum(a.fields_filled for a in activities)

    success_rate = round((success_count / total * 100), 1) if total > 0 else 0
    # Estimasi: setiap field ~30 detik dihemat dibanding input manual
    estimated_time_saved_seconds = total_fields_filled * 30

    # Profil completion
    profile = db.query(Profile).filter(Profile.user_id == current_user.id).first()
    profile_fields = [
        "nik", "full_name", "birth_date", "gender",
        "address", "province", "city",
        "phone_number"
    ]
    filled_fields = 0
    if profile:
        for f in profile_fields:
            if getattr(profile, f, None):
                filled_fields += 1
    profile_completion = round((filled_fields / len(profile_fields) * 100), 1)

    return {
        "total_autofill": total,
        "success_count": success_count,
        "partial_count": partial_count,
        "failed_count": failed_count,
        "success_rate": success_rate,
        "estimated_time_saved_seconds": estimated_time_saved_seconds,
        "profile_completion": profile_completion,
    }