from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status, Request
from sqlalchemy.orm import Session

from app.api.v1.routers.auth import get_current_user
from app.database import get_db
from app.models.entities import User, Profile, Activity
from app.core.security import limiter
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
    push_activity_to_queue,
)

router = APIRouter(prefix="/activities", tags=["Aktivitas & Analitik"])


@router.post("", status_code=status.HTTP_202_ACCEPTED)
@limiter.limit("30/minute")
async def log_activity(
    request: Request,
    payload: ActivityCreate,
    current_user: User = Depends(get_current_user)
):
    """
    Mencatat log riwayat pengisian formulir secara asinkron.
    Menggunakan buffer in-memory untuk bulk insert ke database (Non-blocking I/O).
    """
    domain = extract_domain(payload.target_url, payload.website_domain)

    norm_status = payload.status.lower()
    if norm_status not in ("success", "partial", "failed"):
        norm_status = "success"

    activity_data = {
        "user_id": current_user.id,
        "target_url": payload.target_url,
        "website_domain": domain,
        "action": payload.action or "autofill",
        "fields_detected": max(0, payload.fields_detected),
        "fields_filled": max(0, payload.fields_filled),
        "status": norm_status,
        "filled_fields_summary": payload.filled_fields_summary
    }
    
    await push_activity_to_queue(activity_data)
    
    return {"detail": "Log aktivitas diterima untuk diproses"}


@router.get("", response_model=List[ActivityResponse])
@limiter.limit("30/minute")
def get_activities(
    request: Request,
    limit: int = Query(50, ge=1, le=1000, description="Batas jumlah item per halaman"),
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
@limiter.limit("30/minute")
def get_activity_stats(
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Statistik agregasi cepat untuk KPI Card Web Dashboard."""
    activities = db.query(Activity).filter(Activity.user_id == current_user.id).all()
    profile = db.query(Profile).filter(Profile.user_id == current_user.id).first()
    profile_completion = calculate_profile_completion(profile)

    return compute_activity_stats(activities, profile_completion)


@router.get("/analytics", response_model=AnalyticsResponse)
@limiter.limit("30/minute")
def get_activity_analytics(
    request: Request,
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
@limiter.limit("30/minute")
def clear_all_activities(
    request: Request,
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
@limiter.limit("30/minute")
def get_activity_detail(
    request: Request,
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
@limiter.limit("30/minute")
def delete_activity_item(
    request: Request,
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
