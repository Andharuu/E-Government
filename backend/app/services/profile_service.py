"""Profile service with field-level PII encryption."""

import logging
from typing import Optional, Dict, Any
from sqlalchemy.orm import Session

from app.models.entities import Profile
from app.core.encryption import field_encryption

logger = logging.getLogger("govconnect.profile_service")

# Fields that must be encrypted (PII)
PII_FIELDS = [
    # Identity
    'nik', 'full_name', 'first_name', 'last_name',
    'birth_place', 'birth_date', 'gender', 'religion', 'marital_status', 'blood_type',
    # Family & emergency
    'mother_name', 'father_name', 'emergency_contact_name', 'emergency_contact_phone',
    # Address
    'address', 'province', 'city', 'district', 'village', 'postal_code', 'country',
    # Contact
    'phone', 'email', 'website',
    # Education
    'nisn', 'institution', 'education_level', 'student_id',
    # Employment & documents
    'occupation', 'organization', 'work_address', 'income', 'npwp', 'bpjs_number', 'driver_license',
    # Extensible
    'custom_fields', 'document_photos',
]


def encrypt_profile_data(data: Dict[str, Any]) -> Dict[str, Any]:
    """Encrypt PII fields before saving to database."""
    result = data.copy()
    for field in PII_FIELDS:
        if field in result and result[field] is not None and result[field] != "":
            str_val = str(result[field]) if result[field] is not None else ""
            if not field_encryption.is_encrypted(str_val):
                result[field] = field_encryption.encrypt(str_val)
    return result


def decrypt_profile_data(data: Dict[str, Any]) -> Dict[str, Any]:
    """Decrypt PII fields after reading from database."""
    result = data.copy()
    for field in PII_FIELDS:
        if field in result and result[field] is not None and result[field] != "":
            str_val = str(result[field]) if result[field] is not None else ""
            if field_encryption.is_encrypted(str_val):
                result[field] = field_encryption.decrypt(str_val)
    return result


def get_profile_or_create(db: Session, user_id: int, user_email: str) -> Profile:
    """Get existing profile or create new one."""
    profile = db.query(Profile).filter(Profile.user_id == user_id).first()
    if not profile:
        profile = Profile(user_id=user_id, email=user_email)
        db.add(profile)
        db.commit()
        db.refresh(profile)
    return profile


def update_profile(db: Session, profile: Profile, data: Dict[str, Any]) -> Profile:
    """Update profile with encrypted PII fields."""
    encrypted_data = encrypt_profile_data(data)
    for key, value in encrypted_data.items():
        if hasattr(profile, key):
            setattr(profile, key, value)
    db.commit()
    db.refresh(profile)
    return profile


def profile_to_dict(profile: Profile) -> Dict[str, Any]:
    """Convert profile ORM object to dict with decrypted PII.

    Mengembalikan dict kosong bila profil None (pengguna belum memiliki profil).
    """
    if profile is None:
        return {}
    data = {}
    for column in profile.__table__.columns:
        val = getattr(profile, column.name)
        data[column.name] = val
    return decrypt_profile_data(data)


def get_profile_completion(profile: Profile) -> float:
    """Calculate how complete the profile is (0-100)."""
    filled = 0
    total = len(PII_FIELDS)
    data = profile_to_dict(profile)
    for field in PII_FIELDS:
        val = data.get(field)
        if val and str(val).strip() not in ('', 'None', 'null'):
            filled += 1
    return round((filled / total) * 100, 1) if total > 0 else 0


def calculate_profile_completion(profile: Profile) -> float:
    return get_profile_completion(profile)


# Core fields used for completion badge / required profile info
CORE_PROFILE_FIELDS = [
    'nik',
    'full_name',
    'birth_place',
    'birth_date',
    'gender',
    'address',
    'phone',
    'email',
]