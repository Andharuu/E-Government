import json
import logging
from typing import Optional

from app.models.entities import Profile

logger = logging.getLogger("govconnect.services.profile")

CORE_PROFILE_FIELDS = [
    "nik", "full_name", "birth_place", "birth_date", "gender", "religion", "marital_status",
    "blood_type", "address", "province", "city", "district", "village", "postal_code",
    "phone", "email", "education_level", "institution", "student_id", "nisn",
    "occupation", "organization", "work_address", "mother_name", "father_name",
    "emergency_contact_name", "emergency_contact_phone", "npwp", "bpjs_number"
]


def calculate_profile_completion(profile: Optional[Profile]) -> float:
    """
    Menghitung persentase kelengkapan profil (0.0 - 100.0%) secara presisi.
    Normalisasi parsing JSON untuk custom_fields (list / dict) & document_photos.
    """
    if not profile:
        return 0.0

    filled_fields = 0

    # 1. Hitung 29 atribut profil inti
    for field_name in CORE_PROFILE_FIELDS:
        val = getattr(profile, field_name, None)
        if val is not None and str(val).strip():
            filled_fields += 1

    custom_field_total = 0
    custom_field_filled = 0

    # 2. Parsing custom_fields JSON secara aman dan presisi
    if profile.custom_fields and str(profile.custom_fields).strip():
        try:
            raw_cf = json.loads(profile.custom_fields)
            if isinstance(raw_cf, dict) and "fields" in raw_cf and isinstance(raw_cf["fields"], list):
                # Format dari frontend Profile.tsx: { categories: [...], fields: [...] }
                for item in raw_cf["fields"]:
                    if isinstance(item, dict):
                        custom_field_total += 1
                        val = item.get("value") if "value" in item else item.get("val")
                        if val is not None and str(val).strip():
                            custom_field_filled += 1
                    elif item:
                        custom_field_total += 1
                        custom_field_filled += 1
            elif isinstance(raw_cf, list):
                for item in raw_cf:
                    if isinstance(item, dict):
                        custom_field_total += 1
                        val = item.get("value") if "value" in item else item.get("val")
                        if val is not None and str(val).strip():
                            custom_field_filled += 1
                    elif item:
                        custom_field_total += 1
                        custom_field_filled += 1
            elif isinstance(raw_cf, dict):
                for key, item in raw_cf.items():
                    custom_field_total += 1
                    if isinstance(item, dict):
                        val = item.get("value") if "value" in item else item.get("val")
                        if val is not None and str(val).strip():
                            custom_field_filled += 1
                    elif item is not None and str(item).strip():
                        custom_field_filled += 1
        except Exception as exc:
            logger.debug(f"Gagal mem-parsing custom_fields JSON: {exc}")

    # 3. Parsing document_photos jika ada
    doc_photo_filled = 0
    if profile.document_photos and str(profile.document_photos).strip():
        try:
            raw_docs = json.loads(profile.document_photos)
            if isinstance(raw_docs, dict):
                for k, v in raw_docs.items():
                    if v and str(v).strip():
                        doc_photo_filled += 1
            elif isinstance(raw_docs, list):
                for item in raw_docs:
                    if item:
                        doc_photo_filled += 1
        except Exception:
            pass

    total_expected = len(CORE_PROFILE_FIELDS) + custom_field_total
    total_filled = filled_fields + custom_field_filled + (1 if doc_photo_filled > 0 else 0)

    # Tambahkan bobot dokumen jika ada
    if doc_photo_filled > 0 and total_expected == len(CORE_PROFILE_FIELDS):
        total_expected += 1

    if total_expected <= 0:
        return 0.0

    percentage = (total_filled / total_expected) * 100.0
    return min(100.0, round(percentage, 1))
