from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from app.database import get_db
from app.models.entities import User, Profile, Mapping, Activity
from app.schemas.schemas import (
    ProfileCreate, ProfileResponse,
    MappingCreate, MappingResponse,
    ActivityCreate, ActivityResponse
)

router = APIRouter(prefix="/api/v1")

# Helper sederhana: pastikan akun default selalu ada untuk testing
def get_default_user_id(db: Session) -> int:
    user = db.query(User).filter(User.id == 1).first()
    if not user:
        user = User(id=1, email="test@govconnect.local", hashed_password="defaultpassword")
        db.add(user)
        db.commit()
        db.refresh(user)
    return user.id

# --- PROFILE ENDPOINTS ---
@router.get("/profile/me", response_model=ProfileResponse)
def get_my_profile(db: Session = Depends(get_db)):
    user_id = get_default_user_id(db)
    profile = db.query(Profile).filter(Profile.user_id == user_id).first()
    if not profile:
        profile = Profile(
            user_id=user_id,
            nik="3524000000000001",
            full_name="Fajrian Aprilio",
            address="Lamongan, Jawa Timur",
            phone_number="081234567890"
        )
        db.add(profile)
        db.commit()
        db.refresh(profile)
    return profile

@router.put("/profile/me", response_model=ProfileResponse)
def update_my_profile(payload: ProfileCreate, db: Session = Depends(get_db)):
    user_id = get_default_user_id(db)
    profile = db.query(Profile).filter(Profile.user_id == user_id).first()
    if not profile:
        profile = Profile(user_id=user_id, **payload.model_dump())
        db.add(profile)
    else:
        for key, value in payload.model_dump(exclude_unset=True).items():
            setattr(profile, key, value)
    db.commit()
    db.refresh(profile)
    return profile

# --- MAPPING ENDPOINTS ---
@router.get("/mappings", response_model=List[MappingResponse])
def get_mappings(domain: str, db: Session = Depends(get_db)):
    mappings = db.query(Mapping).filter(Mapping.domain == domain).all()
    return mappings

@router.post("/mappings", response_model=MappingResponse)
def create_mapping(payload: MappingCreate, db: Session = Depends(get_db)):
    new_mapping = Mapping(**payload.model_dump())
    db.add(new_mapping)
    db.commit()
    db.refresh(new_mapping)
    return new_mapping

# --- ACTIVITY ENDPOINTS ---
@router.post("/activities", response_model=ActivityResponse)
def log_activity(payload: ActivityCreate, db: Session = Depends(get_db)):
    user_id = get_default_user_id(db)
    activity = Activity(user_id=user_id, **payload.model_dump())
    db.add(activity)
    db.commit()
    db.refresh(activity)
    return activity

@router.get("/activities", response_model=List[ActivityResponse])
def get_activities(limit: int = 10, db: Session = Depends(get_db)):
    user_id = get_default_user_id(db)
    activities = (
        db.query(Activity)
        .filter(Activity.user_id == user_id)
        .order_by(Activity.created_at.desc())
        .limit(limit)
        .all()
    )
    return activities