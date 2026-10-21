"""Database entities"""

from datetime import datetime
from typing import Optional
from sqlalchemy import Boolean, Column, DateTime, Integer, String, Text, ForeignKey, JSON
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    is_active = Column(Boolean, default=True)
    is_admin = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    profile = relationship("Profile", uselist=False, back_populates="user", cascade="all, delete-orphan")
    mappings = relationship("Mapping", back_populates="user", cascade="all, delete-orphan")
    complaints = relationship("Complaint", back_populates="user", foreign_keys="Complaint.user_id", cascade="all, delete-orphan")
    activities = relationship("Activity", back_populates="user", cascade="all, delete-orphan")
    notifications = relationship("Notification", back_populates="user", cascade="all, delete-orphan")


class Profile(Base):
    __tablename__ = "profiles"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False)
    
    # Core identity - HIGHLY SENSITIVE (Dienkripsi field-level PII sehingga membutuhkan Text)
    nik = Column(Text, nullable=True)
    full_name = Column(Text, nullable=True)
    first_name = Column(Text, nullable=True)
    last_name = Column(Text, nullable=True)
    birth_place = Column(Text, nullable=True)
    birth_date = Column(Text, nullable=True)
    age = Column(Text, nullable=True)
    gender = Column(Text, nullable=True)
    religion = Column(Text, nullable=True)
    marital_status = Column(Text, nullable=True)
    blood_type = Column(Text, nullable=True)
    
    # Family & emergency contact - SENSITIVE
    mother_name = Column(Text, nullable=True)
    father_name = Column(Text, nullable=True)
    emergency_contact_name = Column(Text, nullable=True)
    emergency_contact_phone = Column(Text, nullable=True)
    
    # Address - SENSITIVE
    address = Column(Text, nullable=True)
    province = Column(Text, nullable=True)
    city = Column(Text, nullable=True)
    district = Column(Text, nullable=True)
    village = Column(Text, nullable=True)
    postal_code = Column(Text, nullable=True)
    country = Column(Text, nullable=True, default="Indonesia")
    
    # Contact - SENSITIVE
    phone = Column(Text, nullable=True)
    home_phone = Column(Text, nullable=True)
    work_telephone = Column(Text, nullable=True)
    fax = Column(Text, nullable=True)
    email = Column(Text, nullable=True)
    website = Column(Text, nullable=True)
    
    # Education - SENSITIVE
    nisn = Column(Text, nullable=True)
    institution = Column(Text, nullable=True)
    education_level = Column(Text, nullable=True)
    student_id = Column(Text, nullable=True)
    
    # Employment & official documents - SENSITIVE
    occupation = Column(Text, nullable=True)
    organization = Column(Text, nullable=True)
    work_address = Column(Text, nullable=True)
    income = Column(Text, nullable=True)
    npwp = Column(Text, nullable=True)
    bpjs_number = Column(Text, nullable=True)
    driver_license = Column(Text, nullable=True)
    
    # Extensible fields
    custom_fields = Column(Text, nullable=True)  # JSON string
    document_photos = Column(Text, nullable=True)  # JSON metadata/base64
    
    # Metadata
    completion_percentage = Column(Integer, default=0)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    user = relationship("User", back_populates="profile")


class Mapping(Base):
    """Field mapping between external websites and GovConnect fields."""
    __tablename__ = "mappings"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    website_domain = Column(String(255), nullable=False)
    website_field = Column(String(255), nullable=False)
    govconnect_field = Column(String(255), nullable=False)
    selector_query = Column(String(500), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    user = relationship("User", back_populates="mappings")


class Complaint(Base):
    __tablename__ = "complaints"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    
    # Content
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=False)
    category = Column(String(100), nullable=False)  # pelayanan, teknis, administrasi, lainnya
    priority = Column(String(20), nullable=False, default="sedang")  # rendah, sedang, tinggi

    # Report type: "layanan" (public service complaint) | "keamanan" (security/privacy/bug report)
    report_type = Column(String(20), nullable=False, default="layanan")

    # Security/bug report extras (only used when report_type == "keamanan")
    security_kind = Column(String(40), nullable=True)   # kebocoran_data, bug, privasi, akses_tidak_sah, lainnya
    security_source = Column(String(20), nullable=True)  # ekstensi, web
    affected_url = Column(String(500), nullable=True)    # halaman/URL terkait (diisi pelapor)
    severity = Column(String(20), nullable=True)         # rendah, sedang, tinggi, kritis

    # Status
    status = Column(String(50), nullable=False, default="diterima")  # diterima, diproses, selesai, ditolak
    assigned_admin_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    resolution = Column(Text, nullable=True)
    resolved_at = Column(DateTime(timezone=True), nullable=True)
    
    # Metadata
    attachments = Column(JSON, nullable=True)  # JSON array of {filename, url, size}
    reference_number = Column(String(50), nullable=True, unique=True)  # Nomor pengaduan
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    user = relationship("User", back_populates="complaints", foreign_keys=[user_id])
    admin = relationship("User", foreign_keys=[assigned_admin_id])


class Activity(Base):
    __tablename__ = "activities"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    category = Column(String(100), nullable=False)
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    source = Column(String(100), nullable=True)  # web, mobile, api
    # Detail autofill (dipakai activity_service untuk analitik & riwayat)
    target_url = Column(String(500), nullable=True)
    website_domain = Column(String(255), nullable=True)
    action = Column(String(50), nullable=True)  # autofill, detect, dsb.
    status = Column(String(20), nullable=True)  # success, partial, failed
    fields_detected = Column(Integer, nullable=True)
    fields_filled = Column(Integer, nullable=True)
    filled_fields_summary = Column(Text, nullable=True)  # CSV nama field yang diisi
    activity_metadata = Column(JSON, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    user = relationship("User", back_populates="activities")


class Notification(Base):
    __tablename__ = "notifications"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    type = Column(String(50), nullable=False)  # info, warning, success, error
    source = Column(String(100), nullable=True)  # system, activity, complaint
    ref_id = Column(Integer, nullable=True)
    read = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    user = relationship("User", back_populates="notifications")

    @property
    def desc(self) -> Optional[str]:
        """Alias for `description` so API/schema can expose `desc`."""
        return self.description


class AuditLog(Base):
    """Audit trail for admin actions and sensitive data access."""
    __tablename__ = "audit_logs"

    id = Column(Integer, primary_key=True, index=True)
    
    # Who performed the action
    admin_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    
    # What action
    action = Column(String(100), nullable=False)  # view_complaint, update_status, view_user, export_data
    resource_type = Column(String(100), nullable=False)  # complaint, user, profile, export
    resource_id = Column(Integer, nullable=True)
    
    # Details
    detail = Column(Text, nullable=True)
    ip_address = Column(String(45), nullable=True)  # IPv6 max length
    user_agent = Column(String(500), nullable=True)
    
    # What was accessed (for compliance - encrypted summary)
    accessed_fields = Column(JSON, nullable=True)  # List of field names accessed
    was_pii_exposed = Column(Boolean, default=False)  # Did this action expose PII?
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    admin = relationship("User", foreign_keys=[admin_id])