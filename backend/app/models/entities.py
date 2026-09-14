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
    nik = Column(String(16), nullable=True)
    full_name = Column(String(255), nullable=True)
    birth_date = Column(String(50), nullable=True)
    gender = Column(String(20), nullable=True)
    address = Column(Text, nullable=True)
    phone_number = Column(String(30), nullable=True)
    education_status = Column(String(100), nullable=True)
    occupation = Column(String(100), nullable=True)

    user = relationship("User", back_populates="profile")

class Mapping(Base):
    __tablename__ = "mappings"

    id = Column(Integer, primary_key=True, index=True)
    domain = Column(String(255), index=True, nullable=False)
    field_name = Column(String(100), nullable=False)
    selector_query = Column(String(255), nullable=False)
    profile_attribute = Column(String(50), nullable=False)

class Activity(Base):
    __tablename__ = "activities"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    target_url = Column(String(500), nullable=False)
    fields_filled_count = Column(Integer, default=0)
    status = Column(String(20), default="success")
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="activities")