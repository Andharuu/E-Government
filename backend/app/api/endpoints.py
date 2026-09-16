from datetime import datetime, timedelta
from collections import Counter
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from urllib.parse import urlparse

from app.database import get_db
from app.models.entities import User, Profile, Mapping, Activity
from app.schemas.schemas import (
    ProfileCreate, ProfileResponse,
    MappingCreate, MappingResponse,
    ActivityCreate, ActivityResponse,
    AnalyticsResponse
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
        Mapping.website_domain == domain
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
            parsed = urlparse(payload.target_url)
            if parsed.scheme == "file":
                domain = "Local File (HTML)"
            else:
                domain = parsed.netloc or "Layanan Publik"
        except Exception:
            domain = "Layanan Publik"

    activity = Activity(
        user_id=current_user.id,
        target_url=payload.target_url,
        website_domain=domain,
        action=payload.action,
        fields_detected=payload.fields_detected,
        fields_filled=payload.fields_filled,
        status=payload.status,
        filled_fields_summary=payload.filled_fields_summary
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
    activities = db.query(Activity).filter(Activity.user_id == current_user.id).all()

    total = len(activities)
    success_count = sum(1 for a in activities if a.status == "success")
    partial_count = sum(1 for a in activities if a.status == "partial")
    failed_count = sum(1 for a in activities if a.status == "failed")
    total_fields_filled = sum(a.fields_filled for a in activities)

    success_rate = round((success_count / total * 100), 1) if total > 0 else 0
    estimated_time_saved_seconds = total_fields_filled * 30

    # Profil completion
    profile = db.query(Profile).filter(Profile.user_id == current_user.id).first()
    profile_fields = [
        "nik", "full_name", "birth_place", "birth_date", "gender", "religion", "marital_status",
        "blood_type", "address", "province", "city", "district", "village", "postal_code",
        "phone", "email", "education_level", "institution", "student_id", "nisn",
        "occupation", "organization", "work_address", "mother_name", "father_name",
        "emergency_contact_name", "emergency_contact_phone", "npwp", "bpjs_number"
    ]
    filled_fields = 0
    custom_count = 0
    if profile:
        for f in profile_fields:
            v = getattr(profile, f, None)
            if v and str(v).strip():
                filled_fields += 1
        if profile.custom_fields:
            try:
                import json
                cf_data = json.loads(profile.custom_fields)
                if isinstance(cf_data, list):
                    for item in cf_data:
                        custom_count += 1
                        if isinstance(item, dict) and item.get("value"):
                            filled_fields += 1
                elif isinstance(cf_data, dict):
                    for k, item in cf_data.items():
                        custom_count += 1
                        if isinstance(item, dict) and item.get("value"):
                            filled_fields += 1
                        elif item:
                            filled_fields += 1
            except Exception:
                pass
    total_expected = len(profile_fields) + custom_count
    profile_completion = round((filled_fields / total_expected * 100), 1) if total_expected > 0 else 0.0

    return {
        "total_autofill": total,
        "success_count": success_count,
        "partial_count": partial_count,
        "failed_count": failed_count,
        "success_rate": success_rate,
        "estimated_time_saved_seconds": estimated_time_saved_seconds,
        "profile_completion": profile_completion,
    }


@router.get("/activities/analytics", response_model=AnalyticsResponse)
def get_activity_analytics(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Kembalikan data analitik lengkap untuk Dashboard (tren, domain, field, aktivitas terbaru)."""
    activities = (
        db.query(Activity)
        .filter(Activity.user_id == current_user.id)
        .order_by(Activity.created_at.desc())
        .all()
    )

    total = len(activities)
    success_count = sum(1 for a in activities if a.status == "success")
    partial_count = sum(1 for a in activities if a.status == "partial")
    failed_count = sum(1 for a in activities if a.status == "failed")
    total_fields_filled = sum(a.fields_filled for a in activities)

    success_rate = round((success_count / total * 100), 1) if total > 0 else 0.0
    estimated_time_saved_seconds = total_fields_filled * 30

    # Profile completion
    profile = db.query(Profile).filter(Profile.user_id == current_user.id).first()
    profile_fields = [
        "nik", "full_name", "birth_place", "birth_date", "gender", "religion", "marital_status",
        "blood_type", "address", "province", "city", "district", "village", "postal_code",
        "phone", "email", "education_level", "institution", "student_id", "nisn",
        "occupation", "organization", "work_address", "mother_name", "father_name",
        "emergency_contact_name", "emergency_contact_phone", "npwp", "bpjs_number"
    ]
    filled_fields = 0
    custom_count = 0
    if profile:
        for f in profile_fields:
            val = getattr(profile, f, None)
            if val and str(val).strip():
                filled_fields += 1
        if profile.custom_fields:
            try:
                import json
                cf_data = json.loads(profile.custom_fields)
                if isinstance(cf_data, list):
                    for item in cf_data:
                        custom_count += 1
                        if isinstance(item, dict) and item.get("value"):
                            filled_fields += 1
                elif isinstance(cf_data, dict):
                    for k, item in cf_data.items():
                        custom_count += 1
                        if isinstance(item, dict) and item.get("value"):
                            filled_fields += 1
                        elif item:
                            filled_fields += 1
            except Exception:
                pass
    total_expected = len(profile_fields) + custom_count
    profile_completion = round((filled_fields / total_expected * 100), 1) if total_expected > 0 else 0.0

    # 1. Daily Trend (7 hari terakhir)
    today = datetime.utcnow().date()
    days = [today - timedelta(days=i) for i in range(6, -1, -1)]
    date_counts = {d: 0 for d in days}
    for a in activities:
        if a.created_at:
            a_date = a.created_at.date()
            if a_date in date_counts:
                date_counts[a_date] += 1

    daily_trend = [
        {"date": d.strftime("%d %b"), "autofill": date_counts[d]}
        for d in days
    ]

    # 2. By Website
    website_counter = Counter()
    for a in activities:
        site = a.website_domain
        if not site and a.target_url:
            try:
                parsed = urlparse(a.target_url)
                if parsed.scheme == "file":
                    site = "Local File (HTML)"
                else:
                    site = parsed.netloc or "Lainnya"
            except Exception:
                site = "Lainnya"
        website_counter[site or "Lainnya"] += 1

    by_website = [
        {"name": domain, "count": count}
        for domain, count in website_counter.most_common(5)
    ]

    # 3. Most Used Fields
    field_labels = {
        "nik": "NIK",
        "full_name": "Nama Lengkap",
        "birth_date": "Tanggal Lahir",
        "birth_place": "Tempat Lahir",
        "gender": "Jenis Kelamin",
        "address": "Alamat",
        "province": "Provinsi",
        "city": "Kota/Kabupaten",
        "phone": "Telepon",
        "email": "Email",
        "nisn": "NISN",
        "institution": "Institusi",
        "student_id": "NIM/NIP",
        "occupation": "Pekerjaan",
    }
    field_counter = Counter()
    for a in activities:
        if a.filled_fields_summary:
            keys = [k.strip() for k in a.filled_fields_summary.split(",") if k.strip()]
            for k in keys:
                label = field_labels.get(k, k.replace("_", " ").title())
                field_counter[label] += 1

    most_used_fields = [
        {"name": label, "count": count}
        for label, count in field_counter.most_common(5)
    ]

    # 4. Recent activities (top 5)
    recent_activities = activities[:5]

    return {
        "total_autofill": total,
        "success_count": success_count,
        "partial_count": partial_count,
        "failed_count": failed_count,
        "success_rate": success_rate,
        "estimated_time_saved_seconds": estimated_time_saved_seconds,
        "profile_completion": profile_completion,
        "daily_trend": daily_trend,
        "by_website": by_website,
        "most_used_fields": most_used_fields,
        "recent_activities": recent_activities,
    }