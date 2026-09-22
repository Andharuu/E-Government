from datetime import datetime
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, ConfigDict, EmailStr, Field


# ============================================================
# AUTH SCHEMAS
# ============================================================
class UserCreate(BaseModel):
    email: EmailStr = Field(..., description="Alamat email valid")
    password: str = Field(..., min_length=6, description="Password minimal 6 karakter")


class PasswordChangeRequest(BaseModel):
    old_password: str = Field(..., description="Password saat ini")
    new_password: str = Field(..., min_length=6, description="Password baru minimal 6 karakter")


class UserResponse(BaseModel):
    id: int
    email: str
    is_active: bool = True
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"


# ============================================================
# PROFILE SCHEMAS
# ============================================================
class ProfileBase(BaseModel):
    # Identitas Pokok & Ekstensi (Internasional / RoboForm / DemoQA)
    nik: Optional[str] = None
    full_name: Optional[str] = None
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    birth_place: Optional[str] = None
    birth_date: Optional[str] = None
    gender: Optional[str] = None
    religion: Optional[str] = None
    marital_status: Optional[str] = None
    blood_type: Optional[str] = None

    # Keluarga & Kontak Darurat
    mother_name: Optional[str] = None
    father_name: Optional[str] = None
    emergency_contact_name: Optional[str] = None
    emergency_contact_phone: Optional[str] = None

    # Alamat Domisili
    address: Optional[str] = None
    province: Optional[str] = None
    city: Optional[str] = None
    district: Optional[str] = None
    village: Optional[str] = None
    postal_code: Optional[str] = None
    country: Optional[str] = None

    # Kontak Pribadi
    phone: Optional[str] = None
    email: Optional[str] = None
    website: Optional[str] = None

    # Pendidikan
    nisn: Optional[str] = None
    institution: Optional[str] = None
    education_level: Optional[str] = None
    student_id: Optional[str] = None

    # Pekerjaan & Dokumen Resmi
    occupation: Optional[str] = None
    organization: Optional[str] = None
    work_address: Optional[str] = None
    income: Optional[str] = None
    npwp: Optional[str] = None
    bpjs_number: Optional[str] = None
    driver_license: Optional[str] = None

    # Custom Data & Foto Dokumen (JSON strings)
    custom_fields: Optional[str] = None
    document_photos: Optional[str] = None


class ProfileCreate(ProfileBase):
    pass


class ProfileUpdate(ProfileBase):
    """Schema untuk pembaruan parsial (PATCH) profil."""
    pass


class ProfileResponse(ProfileBase):
    id: int
    user_id: int
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    profile_completion: Optional[float] = None

    model_config = ConfigDict(from_attributes=True)


# ============================================================
# MAPPING SCHEMAS
# ============================================================
class MappingBase(BaseModel):
    website_domain: str = Field(..., description="Domain website, contoh: sipongi.menlhk.go.id")
    website_field: str = Field(..., description="Nama/ID field di website")
    govconnect_field: str = Field(..., description="Nama field target di GovConnect")
    selector_query: str = Field(..., description="CSS Selector elemen HTML")


class MappingCreate(MappingBase):
    pass


class MappingUpdate(BaseModel):
    website_domain: Optional[str] = None
    website_field: Optional[str] = None
    govconnect_field: Optional[str] = None
    selector_query: Optional[str] = None


class MappingBulkItem(BaseModel):
    website_field: str
    govconnect_field: str
    selector_query: str


class MappingBulkCreate(BaseModel):
    website_domain: str
    mappings: List[MappingBulkItem]


class MappingResponse(MappingBase):
    id: int
    user_id: int
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)


# ============================================================
# ACTIVITY SCHEMAS
# ============================================================
class ActivityCreate(BaseModel):
    target_url: str
    website_domain: Optional[str] = None
    action: str = "autofill"
    fields_detected: int = 0
    fields_filled: int = 0
    status: str = "success"
    filled_fields_summary: Optional[str] = None


class ActivityResponse(BaseModel):
    id: int
    user_id: int
    target_url: str
    website_domain: Optional[str] = None
    action: str
    fields_detected: int
    fields_filled: int
    status: str
    filled_fields_summary: Optional[str] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class ActivityListResponse(BaseModel):
    total: int
    items: List[ActivityResponse]


class DailyActivityItem(BaseModel):
    date: str
    autofill: int


class WebsiteCountItem(BaseModel):
    name: str
    count: int


class FieldCountItem(BaseModel):
    name: str
    count: int


class AnalyticsResponse(BaseModel):
    total_autofill: int
    success_count: int
    partial_count: int
    failed_count: int
    success_rate: float
    estimated_time_saved_seconds: int
    profile_completion: float
    daily_trend: List[DailyActivityItem]
    by_website: List[WebsiteCountItem]
    most_used_fields: List[FieldCountItem]
    recent_activities: List[ActivityResponse]


class MessageResponse(BaseModel):
    detail: str