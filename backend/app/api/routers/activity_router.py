from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.api.auth import get_current_user
from app.database import get_db
from app.models.entities import User, Profile, Activity
from app.schemas.schemas import (
    ActivityCreate,
    ActivityResponse,
    AnalyticsResponse,
    MessageResponse,
)
from app.services.profile_service import calculate_profile_completion
from app.services.activity_service import (
    extract_domain,
    compute_activity_stats,
    compute_activity_analytics,
)

router = APIRouter(prefix="/activities", tags=["Aktivitas & Analitik"])


@router.post("", response_model=ActivityResponse, status_code=status.HTTP_201_CREATED)
def log_activity(
    payload: ActivityCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Mencatat log riwayat pengisian formulir.
    Sesuai PRD §18 & §23: Nilai data pribadi tidak pernah dicatat.
    """
    domain = extract_domain(payload.target_url, payload.website_domain)

    # Normalisasi status: success, partial, failed
    norm_status = payload.status.lower()
    if norm_status not in ("success", "partial", "failed"):
        norm_status = "success"

    activity = Activity(
        user_id=current_user.id,
        target_url=payload.target_url,
        website_domain=domain,
        action=payload.action or "autofill",
        fields_detected=max(0, payload.fields_detected),
        fields_filled=max(0, payload.fields_filled),
        status=norm_status,
        filled_fields_summary=payload.filled_fields_summary
    )
    db.add(activity)
    db.commit()
    db.refresh(activity)
    return activity


@router.get("", response_model=List[ActivityResponse])
def get_activities(
    limit: int = Query(10, ge=1, le=100, description="Batas jumlah item per halaman"),
    offset: int = Query(0, ge=0, description="Offset untuk paginasi"),
    status: Optional[str] = Query(None, description="Filter status: success, partial, failed"),
    domain: Optional[str] = Query(None, description="Filter domain website"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Mengambil riwayat log aktivitas autofill dengan dukungan filter dan paginasi."""
    query = db.query(Activity).filter(Activity.user_id == current_user.id)

    if status:
        query = query.filter(Activity.status == status.strip().lower())
    if domain:
        query = query.filter(Activity.website_domain == domain.strip())

    return query.order_by(Activity.created_at.desc()).offset(offset).limit(limit).all()


@router.get("/stats")
def get_activity_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Statistik agregasi cepat untuk KPI Card Web Dashboard."""
    activities = db.query(Activity).filter(Activity.user_id == current_user.id).all()
    profile = db.query(Profile).filter(Profile.user_id == current_user.id).first()
    profile_completion = calculate_profile_completion(profile)

    return compute_activity_stats(activities, profile_completion)


@router.get("/analytics", response_model=AnalyticsResponse)
def get_activity_analytics(
    days: int = Query(7, ge=1, le=90, description="Rentang hari tren aktivitas"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Data visualisasi analitik komprehensif untuk Dashboard Grafis."""
    activities = (
        db.query(Activity)
        .filter(Activity.user_id == current_user.id)
        .order_by(Activity.created_at.desc())
        .all()
    )
    profile = db.query(Profile).filter(Profile.user_id == current_user.id).first()
    profile_completion = calculate_profile_completion(profile)

    return compute_activity_analytics(activities, days, profile_completion)


@router.delete("", response_model=MessageResponse)
def clear_all_activities(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Menghapus seluruh riwayat aktivitas milik pengguna.
    Memenuhi prinsip hak kendali privasi pengguna (PRD §23).
    """
    count = db.query(Activity).filter(Activity.user_id == current_user.id).delete(synchronize_session=False)
    db.commit()
    return {"detail": f"{count} catatan riwayat aktivitas berhasil dibersihkan"}


@router.get("/{activity_id}", response_model=ActivityResponse)
def get_activity_detail(
    activity_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Mengambil detail satu catatan riwayat autofill."""
    activity = db.query(Activity).filter(
        Activity.id == activity_id,
        Activity.user_id == current_user.id
    ).first()

    if not activity:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Catatan aktivitas tidak ditemukan"
        )
    return activity


@router.delete("/{activity_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_activity_item(
    activity_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Menghapus satu catatan log aktivitas spesifik."""
    activity = db.query(Activity).filter(
        Activity.id == activity_id,
        Activity.user_id == current_user.id
    ).first()

    if not activity:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Catatan aktivitas tidak ditemukan"
        )

    db.delete(activity)
    db.commit()
    return None
