from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.auth import get_current_user
from app.database import get_db
from app.models.entities import User, Mapping
from app.schemas.schemas import (
    MappingCreate,
    MappingUpdate,
    MappingBulkCreate,
    MappingResponse,
    MessageResponse,
)

router = APIRouter(prefix="/mappings", tags=["Field Mapping"])


@router.get("", response_model=List[MappingResponse])
def get_mappings(
    domain: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Mengambil daftar field mapping per-user.
    Jika parameter domain diberikan, filter khusus untuk website tersebut.
    """
    query = db.query(Mapping).filter(Mapping.user_id == current_user.id)
    if domain:
        query = query.filter(Mapping.website_domain == domain.strip())

    return query.order_by(Mapping.updated_at.desc()).all()


@router.post("", response_model=MappingResponse)
def create_or_upsert_mapping(
    payload: MappingCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Menambah atau memperbarui mapping field tunggal untuk pengguna saat ini."""
    domain = payload.website_domain.strip()
    w_field = payload.website_field.strip()

    existing = db.query(Mapping).filter(
        Mapping.user_id == current_user.id,
        Mapping.website_domain == domain,
        Mapping.website_field == w_field
    ).first()

    if existing:
        existing.govconnect_field = payload.govconnect_field.strip()
        existing.selector_query = payload.selector_query.strip()
        db.commit()
        db.refresh(existing)
        return existing

    new_mapping = Mapping(
        user_id=current_user.id,
        website_domain=domain,
        website_field=w_field,
        govconnect_field=payload.govconnect_field.strip(),
        selector_query=payload.selector_query.strip()
    )
    db.add(new_mapping)
    db.commit()
    db.refresh(new_mapping)
    return new_mapping


@router.post("/bulk", response_model=List[MappingResponse])
def create_bulk_mappings(
    payload: MappingBulkCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Sinkronisasi batch daftar field mapping dari Chrome Extension."""
    domain = payload.website_domain.strip()
    saved_items: List[Mapping] = []

    for item in payload.mappings:
        w_field = item.website_field.strip()
        existing = db.query(Mapping).filter(
            Mapping.user_id == current_user.id,
            Mapping.website_domain == domain,
            Mapping.website_field == w_field
        ).first()

        if existing:
            existing.govconnect_field = item.govconnect_field.strip()
            existing.selector_query = item.selector_query.strip()
            saved_items.append(existing)
        else:
            new_item = Mapping(
                user_id=current_user.id,
                website_domain=domain,
                website_field=w_field,
                govconnect_field=item.govconnect_field.strip(),
                selector_query=item.selector_query.strip()
            )
            db.add(new_item)
            saved_items.append(new_item)

    db.commit()
    for item in saved_items:
        db.refresh(item)
    return saved_items


@router.put("/{mapping_id}", response_model=MappingResponse)
def update_mapping(
    mapping_id: int,
    payload: MappingUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Memperbarui data mapping yang sudah tersimpan."""
    mapping = db.query(Mapping).filter(
        Mapping.id == mapping_id,
        Mapping.user_id == current_user.id
    ).first()

    if not mapping:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Mapping tidak ditemukan"
        )

    for k, v in payload.model_dump(exclude_unset=True).items():
        if v is not None:
            setattr(mapping, k, v.strip())

    db.commit()
    db.refresh(mapping)
    return mapping


@router.delete("/{mapping_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_mapping(
    mapping_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Menghapus mapping spesifik milik pengguna saat ini."""
    mapping = db.query(Mapping).filter(
        Mapping.id == mapping_id,
        Mapping.user_id == current_user.id
    ).first()

    if not mapping:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Mapping tidak ditemukan"
        )

    db.delete(mapping)
    db.commit()
    return None


@router.delete("", response_model=MessageResponse)
def clear_mappings(
    domain: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Menghapus semua mapping milik pengguna (atau khusus domain tertentu)."""
    query = db.query(Mapping).filter(Mapping.user_id == current_user.id)
    if domain:
        query = query.filter(Mapping.website_domain == domain.strip())

    count = query.delete(synchronize_session=False)
    db.commit()
    return {"detail": f"{count} mapping berhasil dihapus"}
