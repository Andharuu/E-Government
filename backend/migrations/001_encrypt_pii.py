"""Migrate existing Profile data to encrypted format.

Usage: python -m migrations.001_encrypt_pii
Run AFTER starting the backend server to ensure DB connection is valid.
"""

import sys
sys.path.insert(0, '.')

from app.core.encryption import field_encryption
from app.database import engine, SessionLocal
from sqlalchemy import text
import json


def migrate():
    """Encrypt all PII fields in existing Profile records."""
    
    PII_FIELDS = [
        'nik', 'full_name', 'first_name', 'last_name',
        'birth_place', 'gender', 'religion', 'marital_status', 'blood_type',
        'mother_name', 'father_name', 'emergency_contact_name', 'emergency_contact_phone',
        'address', 'province', 'city', 'district', 'village', 'postal_code', 'country',
        'phone', 'email', 'website',
        'nisn', 'institution', 'education_level', 'student_id',
        'occupation', 'organization', 'work_address', 'income', 'npwp', 'bpjs_number', 'driver_license',
    ]
    
    conn = engine.connect()
    
    # Get all profiles
    result = conn.execute(text("SELECT id FROM profiles"))
    profile_ids = [row[0] for row in result.fetchall()]
    
    encrypted_count = 0
    skipped_count = 0
    
    for pid in profile_ids:
        profile_data = conn.execute(text(f"SELECT * FROM profiles WHERE id = {pid}")).fetchone()
        if not profile_data:
            continue
            
        # Build dict from result
        columns = result.keys()
        data = dict(zip(columns, profile_data))
        
        # Check if already encrypted (has a value that looks encrypted)
        sample_val = data.get('phone') or data.get('nik') or ''
        if field_encryption.is_encrypted(sample_val):
            # Check if ALL PII fields look encrypted
            all_encrypted = all(
                not data.get(f) or field_encryption.is_encrypted(str(data.get(f, '')))
                for f in PII_FIELDS if data.get(f)
            )
            if all_encrypted:
                skipped_count += 1
                continue
        
        # Encrypt each PII field
        updates = []
        for field in PII_FIELDS:
            val = data.get(field)
            if val and not field_encryption.is_encrypted(str(val)):
                encrypted = field_encryption.encrypt(str(val))
                updates.append(f"{field} = :{field}")
        
        if updates:
            # Build parameterized update
            update_sql = text(f"""
                UPDATE profiles SET {', '.join(updates)} WHERE id = :pid
            """)
            params = {f: field_encryption.encrypt(str(data.get(f, ''))) for f in PII_FIELDS if data.get(f)}
            params['pid'] = pid
            conn.execute(update_sql, params)
            encrypted_count += 1
    
    conn.commit()
    conn.close()
    
    print(f"Migration complete: {encrypted_count} profiles encrypted, {skipped_count} already encrypted")


if __name__ == "__main__":
    migrate()
