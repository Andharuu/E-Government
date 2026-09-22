from collections import Counter
from datetime import datetime, timedelta, timezone
from typing import List, Optional, Dict, Any
from urllib.parse import urlparse

from app.models.entities import Activity

FIELD_LABELS: Dict[str, str] = {
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
    "npwp": "NPWP",
    "bpjs_number": "Nomor BPJS",
    "mother_name": "Nama Ibu",
    "father_name": "Nama Ayah",
}


def extract_domain(target_url: str, provided_domain: Optional[str] = None) -> str:
    """Ekstraksi nama domain bersih dari URL target."""
    if provided_domain and provided_domain.strip():
        return provided_domain.strip()

    if not target_url:
        return "Layanan Publik"

    try:
        parsed = urlparse(target_url)
        if parsed.scheme == "file":
            return "Local File (HTML)"
        return parsed.netloc or "Layanan Publik"
    except Exception:
        return "Layanan Publik"


def compute_activity_stats(activities: List[Activity], profile_completion: float) -> Dict[str, Any]:
    """Menghitung ringkasan KPI aktivitas autofill."""
    total = len(activities)
    success_count = sum(1 for a in activities if a.status == "success")
    partial_count = sum(1 for a in activities if a.status == "partial")
    failed_count = sum(1 for a in activities if a.status == "failed")
    total_fields_filled = sum(a.fields_filled for a in activities)

    success_rate = round((success_count / total * 100), 1) if total > 0 else 0.0
    estimated_time_saved_seconds = total_fields_filled * 30

    return {
        "total_autofill": total,
        "success_count": success_count,
        "partial_count": partial_count,
        "failed_count": failed_count,
        "success_rate": success_rate,
        "estimated_time_saved_seconds": estimated_time_saved_seconds,
        "profile_completion": profile_completion,
    }


def compute_activity_analytics(
    activities: List[Activity],
    days: int,
    profile_completion: float
) -> Dict[str, Any]:
    """Menghitung analitik tren harian, distribusi domain, dan field terpopuler."""
    stats = compute_activity_stats(activities, profile_completion)

    # 1. Tren Harian (Daily Trend)
    today = datetime.now(timezone.utc).date()
    day_range = [today - timedelta(days=i) for i in range(days - 1, -1, -1)]
    date_counts = {d: 0 for d in day_range}

    for a in activities:
        if a.created_at:
            a_date = a.created_at.date()
            if a_date in date_counts:
                date_counts[a_date] += 1

    daily_trend = [
        {"date": d.strftime("%d %b"), "autofill": date_counts[d]}
        for d in day_range
    ]

    # 2. Distribusi per Website
    website_counter = Counter()
    for a in activities:
        site = extract_domain(a.target_url, a.website_domain)
        website_counter[site] += 1

    by_website = [
        {"name": domain, "count": count}
        for domain, count in website_counter.most_common(5)
    ]

    # 3. Field Paling Sering Diisi
    field_counter = Counter()
    for a in activities:
        if a.filled_fields_summary:
            keys = [k.strip() for k in a.filled_fields_summary.split(",") if k.strip()]
            for k in keys:
                label = FIELD_LABELS.get(k, k.replace("_", " ").title())
                field_counter[label] += 1

    most_used_fields = [
        {"name": label, "count": count}
        for label, count in field_counter.most_common(5)
    ]

    # 4. Aktivitas Terbaru (Maksimal 5)
    recent_activities = activities[:5]

    return {
        **stats,
        "daily_trend": daily_trend,
        "by_website": by_website,
        "most_used_fields": most_used_fields,
        "recent_activities": recent_activities,
    }
