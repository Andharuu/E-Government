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
    'birth_place', 'birth_date', 'age', 'gender', 'religion', 'marital_status', 'blood_type',
    # Family & emergency
    'mother_name', 'father_name', 'emergency_contact_name', 'emergency_contact_phone',
    # Address
    'address', 'province', 'city', 'district', 'village', 'postal_code', 'country',
    # Contact
    'phone', 'home_phone', 'work_telephone', 'fax', 'email', 'website',
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


def extract_date_components(date_str: Optional[str]) -> Dict[str, str]:
    """Ekstraksi otomatis komponen tanggal lahir (hari, bulan, tahun, dan umur) dari birth_date."""
    if not date_str:
        return {}
    import re
    from datetime import date
    s = str(date_str).strip()
    year, month, day = "", "", ""
    # 1. YYYY-MM-DD atau YYYY/MM/DD
    m1 = re.match(r"^(\d{4})[-\/.](\d{1,2})[-\/.](\d{1,2})", s)
    if m1:
        year, month, day = m1.group(1), m1.group(2).zfill(2), m1.group(3).zfill(2)
    else:
        # 2. DD-MM-YYYY atau DD/MM/YYYY
        m2 = re.match(r"^(\d{1,2})[-\/.](\d{1,2})[-\/.](\d{4})", s)
        if m2:
            day, month, year = m2.group(1).zfill(2), m2.group(2).zfill(2), m2.group(3)

    if not year:
        return {}

    result = {
        "birth_day": day,
        "birth_month": month,
        "birth_year": year,
    }

    # Kalkulasi umur otomatis bila belum ada
    try:
        by, bm, bd = int(year), int(month or 1), int(day or 1)
        today = date.today()
        calc_age = today.year - by - ((today.month, today.day) < (bm, bd))
        if calc_age >= 0:
            result["age"] = str(calc_age)
    except Exception:
        pass

    return result


def profile_to_dict(profile: Profile) -> Dict[str, Any]:
    """Convert profile ORM object to dict with decrypted PII and auto-derived date components.

    Mengembalikan dict kosong bila profil None (pengguna belum memiliki profil).
    """
    if profile is None:
        return {}
    data = {}
    for column in profile.__table__.columns:
        val = getattr(profile, column.name)
        data[column.name] = val
    decrypted = decrypt_profile_data(data)

    # Auto-derive birth_day, birth_month, birth_year, dan age dari birth_date
    if decrypted.get("birth_date"):
        date_parts = extract_date_components(decrypted["birth_date"])
        if not decrypted.get("birth_day") and date_parts.get("birth_day"):
            decrypted["birth_day"] = date_parts["birth_day"]
        if not decrypted.get("birth_month") and date_parts.get("birth_month"):
            decrypted["birth_month"] = date_parts["birth_month"]
        if not decrypted.get("birth_year") and date_parts.get("birth_year"):
            decrypted["birth_year"] = date_parts["birth_year"]
        if not decrypted.get("age") and date_parts.get("age"):
            decrypted["age"] = date_parts["age"]

    return decrypted


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