"""User-facing complaints router."""

from typing import List, Optional
from datetime import datetime, timezone
import secrets

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import desc

from app.api.v1.routers.auth import get_current_user
from app.database import get_db
from app.models.entities import User, Complaint
from pydantic import BaseModel, ConfigDict, Field, field_validator

router = APIRouter(prefix="/complaints", tags=["Pengaduan"])


class ComplaintCreate(BaseModel):
    title: str = Field(..., min_length=3, max_length=200)
    description: str = Field(..., min_length=10, max_length=2000)
    category: str  # pelayanan, teknis, administrasi, lainnya
    priority: Optional[str] = "sedang"
    # Report type: "layanan" (default) | "keamanan" (security/privacy/bug report)
    report_type: Optional[str] = "layanan"

    @field_validator("report_type")
    @classmethod
    def _validate_report_type(cls, v: Optional[str]) -> str:
        allowed = {"layanan", "keamanan"}
        v = (v or "layanan").strip().lower()
        if v not in allowed:
            raise ValueError(f"Jenis laporan tidak valid. Pilihan: {', '.join(sorted(allowed))}.")
        return v

    # Security-report extras (only meaningful when report_type == "keamanan")
    security_kind: Optional[str] = None      # kebocoran_data, bug, privasi, akses_tidak_sah, lainnya
    security_source: Optional[str] = None    # ekstensi, web
    affected_url: Optional[str] = None
    severity: Optional[str] = None           # rendah, sedang, tinggi, kritis

    @field_validator("category")
    @classmethod
    def _validate_category(cls, v: str) -> str:
        allowed = {"pelayanan", "teknis", "administrasi", "lainnya"}
        v = (v or "").strip().lower()
        if v not in allowed:
            raise ValueError(f"Kategori tidak valid. Pilihan: {', '.join(sorted(allowed))}.")
        return v

    @field_validator("title")
    @classmethod
    def _validate_title(cls, v: str) -> str:
        v = (v or "").strip()
        if not v:
            raise ValueError("Judul tidak boleh kosong.")
        if len(v) > 200:
            raise ValueError("Judul maksimal 200 karakter.")
        return v

    @field_validator("description")
    @classmethod
    def _validate_description(cls, v: str) -> str:
        v = (v or "").strip()
        if not v:
            raise ValueError("Deskripsi tidak boleh kosong.")
        return v

    @field_validator("priority")
    @classmethod
    def _validate_priority(cls, v: Optional[str]) -> str:
        allowed = {"rendah", "sedang", "tinggi"}
        v = (v or "sedang").strip().lower()
        if v not in allowed:
            raise ValueError(f"Prioritas tidak valid. Pilihan: {', '.join(sorted(allowed))}.")
        return v

    @field_validator("severity")
    @classmethod
    def _validate_severity(cls, v: Optional[str]) -> Optional[str]:
        if v is None or not str(v).strip():
            return None
        allowed = {"rendah", "sedang", "tinggi", "kritis"}
        v = v.strip().lower()
        if v not in allowed:
            raise ValueError(f"Tingkat keparahan tidak valid. Pilihan: {', '.join(sorted(allowed))}.")
        return v

    @field_validator("security_kind")
    @classmethod
    def _validate_security_kind(cls, v: Optional[str]) -> Optional[str]:
        if v is None or not str(v).strip():
            return None
        allowed = {"kebocoran_data", "bug", "privasi", "akses_tidak_sah", "lainnya"}
        v = v.strip().lower()
        if v not in allowed:
            raise ValueError(f"Jenis laporan keamanan tidak valid. Pilihan: {', '.join(sorted(allowed))}.")
        return v

    @field_validator("security_source")
    @classmethod
    def _validate_security_source(cls, v: Optional[str]) -> Optional[str]:
        if v is None or not str(v).strip():
            return None
        allowed = {"ekstensi", "web"}
        v = v.strip().lower()
        if v not in allowed:
            raise ValueError(f"Sumber laporan keamanan tidak valid. Pilihan: {', '.join(sorted(allowed))}.")
        return v

    @field_validator("affected_url")
    @classmethod
    def _validate_affected_url(cls, v: Optional[str]) -> Optional[str]:
        """Batasi affected_url ke http/https saja (cegah javascript:/data: stored XSS)."""
        if v is None:
            return v
        v = v.strip()
        if not v:
            return None
        from urllib.parse import urlparse
        scheme = urlparse(v).scheme.lower()
        if scheme not in ("http", "https"):
            raise ValueError("URL terkait hanya boleh menggunakan skema http atau https.")
        if len(v) > 500:
            raise ValueError("URL terkait terlalu panjang (maks 500 karakter).")
        return v


class PublicHelpCreate(BaseModel):
    name: str = Field(..., min_length=2, max_length=150)
    email: str = Field(..., min_length=5, max_length=255)
    category: str = Field(default="teknis")
    subject: str = Field(..., min_length=3, max_length=255)
    message: str = Field(..., min_length=5, max_length=5000)

class ComplaintResponse(BaseModel):
    id: int
    reference_number: Optional[str]
    title: str
    description: str
    category: str
    priority: str
    report_type: str = "layanan"
    security_kind: Optional[str] = None
    security_source: Optional[str] = None
    affected_url: Optional[str] = None
    severity: Optional[str] = None
    status: str
    resolution: Optional[str]
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


def generate_reference_number(prefix: str = "PGD") -> str:
    """Generate unique complaint reference number.

    Service complaints use PGD-..., security/bug reports use SEC-...
    """
    now = datetime.now(timezone.utc)
    rand_hex = secrets.token_hex(3).upper()
    return f"{prefix}-{now.year}{now.month:02d}{now.day:02d}-{now.strftime('%H%M%S')}-{rand_hex}"


@router.post("", response_model=ComplaintResponse, status_code=status.HTTP_201_CREATED)
def create_complaint(
    payload: ComplaintCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Submit a new complaint/pengaduan (public service or security/bug report)."""
    report_type = (payload.report_type or "layanan").lower()
    if report_type not in ("layanan", "keamanan"):
        report_type = "layanan"

    # Security reports get a distinct SEC- reference prefix.
    ref_prefix = "SEC" if report_type == "keamanan" else "PGD"

    complaint = Complaint(
        user_id=current_user.id,
        title=payload.title,
        description=payload.description,
        category=payload.category,
        priority=payload.priority or "sedang",
        status="diterima",
        report_type=report_type,
        security_kind=(payload.security_kind if report_type == "keamanan" else None),
        security_source=(payload.security_source if report_type == "keamanan" else None),
        affected_url=(payload.affected_url if report_type == "keamanan" else None),
        severity=(payload.severity if report_type == "keamanan" else None),
        reference_number=generate_reference_number(ref_prefix),
    )
    db.add(complaint)
    db.commit()
    db.refresh(complaint)
    return complaint


@router.get("", response_model=List[ComplaintResponse])
def list_my_complaints(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """List complaints submitted by current user."""
    complaints = (
        db.query(Complaint)
        .filter(Complaint.user_id == current_user.id)
        .order_by(desc(Complaint.created_at))
        .all()
    )
    return complaints


@router.get("/{complaint_id}", response_model=ComplaintResponse)
def get_my_complaint(
    complaint_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Get a specific complaint (own only)."""
    complaint = (
        db.query(Complaint)
        .filter(Complaint.id == complaint_id, Complaint.user_id == current_user.id)
        .first()
    )
    if not complaint:
        raise HTTPException(status_code=404, detail="Pengaduan tidak ditemukan")
    return complaint


@router.post("/public-help", response_model=ComplaintResponse, status_code=status.HTTP_201_CREATED)
def submit_public_help(
    payload: PublicHelpCreate,
    db: Session = Depends(get_db),
):
    """Submit a public help/support ticket from unauthenticated visitors (Login/Register).
    Stores directly into the complaints database so admins can review and resolve it.
    """
    # Check if a user with this email already exists
    user = db.query(User).filter(User.email == payload.email.strip().lower()).first()
    if user:
        target_user_id = user.id
    else:
        # Fallback to the first existing user (e.g. admin or system user)
        first_user = db.query(User).order_by(User.id.asc()).first()
        target_user_id = first_user.id if first_user else 1

    clean_name = payload.name.strip()
    clean_email = payload.email.strip().lower()
    clean_subject = payload.subject.strip()
    clean_message = payload.message.strip()

    category_map = {
        "login": "teknis",
        "teknis": "teknis",
        "ekstensi": "teknis",
        "pelayanan": "pelayanan",
        "administrasi": "administrasi",
        "keamanan": "keamanan",
    }
    assigned_category = category_map.get(payload.category.lower(), "teknis")

    complaint = Complaint(
        user_id=target_user_id,
        title=f"[Bantuan Publik] {clean_subject} ({clean_name})",
        description=f"Pengirim: {clean_name}\nEmail: {clean_email}\n\nDetail Kendala:\n{clean_message}",
        category=assigned_category,
        priority="sedang",
        status="diterima",
        report_type="layanan",
        reference_number=generate_reference_number("HLP"),
    )
    db.add(complaint)
    db.commit()
    db.refresh(complaint)
    return complaint

