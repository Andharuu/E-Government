from pydantic import BaseModel
from typing import Optional
from datetime import datetime

# --- PROFILE SCHEMAS ---
class ProfileBase(BaseModel):
    nik: Optional[str] = None
    full_name: Optional[str] = None
    birth_date: Optional[str] = None
    gender: Optional[str] = None
    address: Optional[str] = None
    phone_number: Optional[str] = None
    education_status: Optional[str] = None
    occupation: Optional[str] = None

class ProfileCreate(ProfileBase):
    pass

class ProfileResponse(ProfileBase):
    id: int
    user_id: int

    class Config:
        from_attributes = True

# --- MAPPING SCHEMAS ---
class MappingBase(BaseModel):
    domain: str
    field_name: str
    selector_query: str
    profile_attribute: str

class MappingCreate(MappingBase):
    pass

class MappingResponse(MappingBase):
    id: int

    class Config:
        from_attributes = True

# --- ACTIVITY SCHEMAS ---
class ActivityCreate(BaseModel):
    target_url: str
    fields_filled_count: int
    status: str = "success"

class ActivityResponse(BaseModel):
    id: int
    user_id: int
    target_url: str
    fields_filled_count: int
    status: str
    created_at: datetime

    class Config:
        from_attributes = True