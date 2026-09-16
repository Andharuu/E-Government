from datetime import datetime
from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from app.database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, nullable=False, index=True)
    hashed_password = Column(String(255), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    profile = relationship("Profile", back_populates="user", uselist=False)
    activities = relationship("Activity", back_populates="user")

class Profile(Base):
    __tablename__ = "profiles"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), unique=True, nullable=False)

    # Identity
    nik = Column(String(16), nullable=True)
    full_name = Column(String(255), nullable=True)
    birth_place = Column(String(100), nullable=True)
    birth_date = Column(String(50), nullable=True)
    gender = Column(String(20), nullable=True)
    religion = Column(String(50), nullable=True)
    marital_status = Column(String(50), nullable=True)
    blood_type = Column(String(10), nullable=True)

    # Family & Emergency
    mother_name = Column(String(255), nullable=True)
    father_name = Column(String(255), nullable=True)
    emergency_contact_name = Column(String(255), nullable=True)
    emergency_contact_phone = Column(String(50), nullable=True)

    # Address
    address = Column(Text, nullable=True)
    province = Column(String(100), nullable=True)
    city = Column(String(100), nullable=True)
    district = Column(String(100), nullable=True)
    village = Column(String(100), nullable=True)
    postal_code = Column(String(10), nullable=True)

    # Contact
    phone = Column(String(30), nullable=True)
    email = Column(String(255), nullable=True)

    # Education
    nisn = Column(String(20), nullable=True)
    institution = Column(String(255), nullable=True)
    education_level = Column(String(50), nullable=True)
    student_id = Column(String(50), nullable=True)

    # Employment & Documents
    occupation = Column(String(100), nullable=True)
    organization = Column(String(255), nullable=True)
    work_address = Column(Text, nullable=True)
    npwp = Column(String(50), nullable=True)
    bpjs_number = Column(String(50), nullable=True)

    # Custom User-Defined Data (stored as JSON string)
    custom_fields = Column(Text, nullable=True)

    # Document & Photo Files (stored as JSON with base64/metadata)
    document_photos = Column(Text, nullable=True)

    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    user = relationship("User", back_populates="profile")

class Mapping(Base):
    __tablename__ = "mappings"

    id = Column(Integer, primary_key=True, index=True)
    # Per-user mapping sesuai PRD §14
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    website_domain = Column(String(255), index=True, nullable=False)
    website_field = Column(String(100), nullable=False)
    govconnect_field = Column(String(50), nullable=False)
    selector_query = Column(String(255), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    user = relationship("User")

class Activity(Base):
    __tablename__ = "activities"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)

    # URL & domain terpisah sesuai PRD §18 & §21
    target_url = Column(String(500), nullable=False)
    website_domain = Column(String(255), nullable=True)

    action = Column(String(50), default="autofill", nullable=False)
    fields_detected = Column(Integer, default=0)
    fields_filled = Column(Integer, default=0)

    # Status: success / partial / failed — sesuai PRD §19
    status = Column(String(20), default="success")
    filled_fields_summary = Column(String(500), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="activities")