from pydantic import BaseModel
from typing import Optional
from datetime import datetime

# --- AUTH SCHEMAS ---
class UserCreate(BaseModel):
    email: str
    password: str

class UserResponse(BaseModel):
    id: int
    email: str
    created_at: datetime

    class Config:
        from_attributes = True

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"

# --- PROFILE SCHEMAS ---
class ProfileBase(BaseModel):
    # Identity
    nik: Optional[str] = None
    full_name: Optional[str] = None
    birth_place: Optional[str] = None
    birth_date: Optional[str] = None
    gender: Optional[str] = None
    religion: Optional[str] = None
    marital_status: Optional[str] = None
    blood_type: Optional[str] = None

    # Family & Emergency
    mother_name: Optional[str] = None
    father_name: Optional[str] = None
    emergency_contact_name: Optional[str] = None
    emergency_contact_phone: Optional[str] = None

    # Address
    address: Optional[str] = None
    province: Optional[str] = None
    city: Optional[str] = None
    district: Optional[str] = None
    village: Optional[str] = None
    postal_code: Optional[str] = None

    # Contact
    phone: Optional[str] = None
    email: Optional[str] = None

    # Education
    nisn: Optional[str] = None
    institution: Optional[str] = None
    education_level: Optional[str] = None
    student_id: Optional[str] = None

    # Additional & Employment
    occupation: Optional[str] = None
    organization: Optional[str] = None
    work_address: Optional[str] = None

    # Official Documents
    npwp: Optional[str] = None
    bpjs_number: Optional[str] = None

    # Custom User-Defined Fields (JSON string)
    custom_fields: Optional[str] = None

    # Document & Photo Files (JSON string with base64)
    document_photos: Optional[str] = None

class ProfileCreate(ProfileBase):
    pass

class ProfileResponse(ProfileBase):
    id: int
    user_id: int

    class Config:
        from_attributes = True

# --- MAPPING SCHEMAS ---
class MappingBase(BaseModel):
    website_domain: str
    website_field: str
    govconnect_field: str
    selector_query: str

class MappingCreate(MappingBase):
    pass

class MappingResponse(MappingBase):
    id: int
    user_id: int

    class Config:
        from_attributes = True

from typing import Optional, List

# --- ACTIVITY SCHEMAS ---
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

    class Config:
        from_attributes = True

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