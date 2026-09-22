from datetime import datetime, timezone
from sqlalchemy import (
    Column, Integer, String, Text, DateTime, ForeignKey, Boolean,
    Index, UniqueConstraint
)
from sqlalchemy.orm import relationship
from app.database import Base


def utc_now():
    """Mengembalikan datetime UTC terkini tanpa tzinfo untuk kompatibilitas DB."""
    return datetime.now(timezone.utc).replace(tzinfo=None)


class User(Base):
    """Entitas pengguna utama sistem GovConnect."""
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, nullable=False, index=True)
    hashed_password = Column(String(255), nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime, default=utc_now, nullable=False)
    updated_at = Column(DateTime, default=utc_now, onupdate=utc_now, nullable=False)

    profile = relationship("Profile", back_populates="user", uselist=False, cascade="all, delete-orphan")
    activities = relationship("Activity", back_populates="user", cascade="all, delete-orphan")
    mappings = relationship("Mapping", back_populates="user", cascade="all, delete-orphan")


class Profile(Base):
    """Entitas profil kependudukan 29+ field kependudukan terpadu."""
    __tablename__ = "profiles"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False)

    # Identitas Pokok
    nik = Column(String(16), nullable=True)
    full_name = Column(String(255), nullable=True)
    first_name = Column(String(100), nullable=True)
    last_name = Column(String(100), nullable=True)
    birth_place = Column(String(100), nullable=True)
    birth_date = Column(String(50), nullable=True)
    gender = Column(String(20), nullable=True)
    religion = Column(String(50), nullable=True)
    marital_status = Column(String(50), nullable=True)
    blood_type = Column(String(10), nullable=True)

    # Keluarga & Kontak Darurat
    mother_name = Column(String(255), nullable=True)
    father_name = Column(String(255), nullable=True)
    emergency_contact_name = Column(String(255), nullable=True)
    emergency_contact_phone = Column(String(50), nullable=True)

    # Alamat Lengkap Domisili
    address = Column(Text, nullable=True)
    province = Column(String(100), nullable=True)
    city = Column(String(100), nullable=True)
    district = Column(String(100), nullable=True)
    village = Column(String(100), nullable=True)
    postal_code = Column(String(10), nullable=True)
    country = Column(String(100), nullable=True)

    # Kontak Pribadi
    phone = Column(String(30), nullable=True)
    email = Column(String(255), nullable=True)
    website = Column(String(255), nullable=True)

    # Pendidikan
    nisn = Column(String(20), nullable=True)
    institution = Column(String(255), nullable=True)
    education_level = Column(String(50), nullable=True)
    student_id = Column(String(50), nullable=True)

    # Pekerjaan & Dokumen Resmi
    occupation = Column(String(100), nullable=True)
    organization = Column(String(255), nullable=True)
    work_address = Column(Text, nullable=True)
    income = Column(String(100), nullable=True)
    npwp = Column(String(50), nullable=True)
    bpjs_number = Column(String(50), nullable=True)
    driver_license = Column(String(100), nullable=True)

    # Custom User-Defined Data (disimpan sebagai string JSON)
    custom_fields = Column(Text, nullable=True)

    # Foto Dokumen (disimpan sebagai string JSON metadata/base64)
    document_photos = Column(Text, nullable=True)

    created_at = Column(DateTime, default=utc_now, nullable=False)
    updated_at = Column(DateTime, default=utc_now, onupdate=utc_now, nullable=False)

    user = relationship("User", back_populates="profile")


class Mapping(Base):
    """Entitas field mapping spesifik domain website per-user."""
    __tablename__ = "mappings"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    website_domain = Column(String(255), index=True, nullable=False)
    website_field = Column(String(100), nullable=False)
    govconnect_field = Column(String(50), nullable=False)
    selector_query = Column(String(255), nullable=False)
    created_at = Column(DateTime, default=utc_now, nullable=False)
    updated_at = Column(DateTime, default=utc_now, onupdate=utc_now, nullable=False)

    user = relationship("User", back_populates="mappings")

    __table_args__ = (
        Index("ix_mappings_user_domain", "user_id", "website_domain"),
        UniqueConstraint("user_id", "website_domain", "website_field", name="uq_user_domain_field"),
    )


class Activity(Base):
    """Entitas log riwayat autofill (tanpa menyimpan data sensitif)."""
    __tablename__ = "activities"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)

    target_url = Column(String(500), nullable=False)
    website_domain = Column(String(255), nullable=True, index=True)

    action = Column(String(50), default="autofill", nullable=False)
    fields_detected = Column(Integer, default=0, nullable=False)
    fields_filled = Column(Integer, default=0, nullable=False)

    # Status: success / partial / failed
    status = Column(String(20), default="success", nullable=False, index=True)
    filled_fields_summary = Column(String(500), nullable=True)
    created_at = Column(DateTime, default=utc_now, nullable=False, index=True)

    user = relationship("User", back_populates="activities")

    __table_args__ = (
        Index("ix_activities_user_created", "user_id", "created_at"),
    )