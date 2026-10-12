"""Audit logging service for tracking admin actions."""

import logging
from typing import Optional, List
from fastapi import Request
from sqlalchemy.orm import Session

from app.models.entities import AuditLog
from app.core.config import settings

logger = logging.getLogger("govconnect.audit")

# Actions that expose PII - require extra scrutiny
PII_EXPOSING_ACTIONS = {
    'view_complaint_detail',
    'view_user_profile',
    'export_complaints',
    'view_user_data',
}


def get_client_ip(request: Optional[Request]) -> Optional[str]:
    """Ambil IP klien.

    T3: Header X-Forwarded-For hanya dipercaya bila koneksi LANGSUNG berasal dari
    proxy tepercaya (TRUSTED_PROXIES). Bila tidak, XFF diabaikan sepenuhnya agar
    penyerang tidak bisa memalsukan IP di jejak audit.
    """
    if not request:
        return None

    peer_ip = request.client.host if request.client else None

    if peer_ip and peer_ip in settings.trusted_proxies_list:
        forwarded = request.headers.get("X-Forwarded-For")
        if forwarded:
            # Paling kiri = klien asli, tetapi hanya tepercaya karena peer proxy.
            candidate = forwarded.split(",")[0].strip()
            if candidate:
                return candidate

    return peer_ip


def log_audit(
    db: Session,
    admin_id: int,
    action: str,
    resource_type: str,
    resource_id: Optional[int] = None,
    detail: Optional[str] = None,
    request: Optional[Request] = None,
    accessed_fields: Optional[List[str]] = None,
) -> Optional[AuditLog]:
    """Catat aksi admin ke jejak audit.

    T3 (fail-closed): bila pencatatan gagal DAN aksi termasuk yang mengekspos PII,
    operasi DIBATALKAN dengan exception — tidak boleh ada akses PII tanpa jejak.
    Untuk aksi non-PII, kegagalan dicatat sebagai error namun tidak memblokir.
    """
    is_pii = action in PII_EXPOSING_ACTIONS
    try:
        log_entry = AuditLog(
            admin_id=admin_id,
            action=action,
            resource_type=resource_type,
            resource_id=resource_id,
            detail=detail,
            ip_address=get_client_ip(request),
            user_agent=(request.headers.get("User-Agent", "")[:500]) if request else None,
            accessed_fields=accessed_fields,
            was_pii_exposed=is_pii,
        )
        db.add(log_entry)
        db.commit()
        db.refresh(log_entry)
        return log_entry
    except Exception as e:
        db.rollback()
        logger.error(f"Audit log failed: {e}")
        if is_pii:
            # Fail-closed untuk aksi yang mengekspos PII.
            raise RuntimeError(
                "Gagal mencatat audit untuk aksi yang mengekspos PII; operasi dibatalkan."
            ) from e
        return None


def get_audit_logs(
    db: Session,
    admin_id: Optional[int] = None,
    action: Optional[str] = None,
    resource_type: Optional[str] = None,
    limit: int = 50,
    offset: int = 0,
) -> List[AuditLog]:
    """Query audit logs with optional filters."""
    query = db.query(AuditLog)
    if admin_id:
        query = query.filter(AuditLog.admin_id == admin_id)
    if action:
        query = query.filter(AuditLog.action == action)
    if resource_type:
        query = query.filter(AuditLog.resource_type == resource_type)
    return query.order_by(AuditLog.created_at.desc()).limit(limit).offset(offset).all()