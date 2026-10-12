"""Admin-only router: dashboard stats, complaint list (no PII), audit logs, user management."""

from typing import List, Optional
from datetime import datetime, timedelta

from fastapi import APIRouter, Depends, HTTPException, Query, Request, status
from sqlalchemy import func, desc, case
from sqlalchemy.orm import Session

from fastapi.responses import StreamingResponse
import csv
import io

from app.api.v1.routers.auth import get_current_user
from app.database import get_db
from app.models.entities import User, Profile, Complaint, Notification, AuditLog
from app.services.audit_service import log_audit, get_audit_logs
from app.services.profile_service import PII_FIELDS
from app.schemas.schemas import MessageResponse
from pydantic import BaseModel, ConfigDict, field_validator

router = APIRouter(prefix="/admin", tags=["Admin"])


# ============================================================
# Dependencies
# ============================================================
def get_current_admin(
    current_user: User = Depends(get_current_user),
) -> User:
    """Dependency: require authenticated user with admin role."""
    if not getattr(current_user, "is_admin", False):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Akses ditolak: hanya untuk admin",
        )
    return current_user


# ============================================================
# Schemas
# ============================================================
class AdminDashboardStats(BaseModel):
    total_users: int
    active_users: int
    new_users_7d: int
    total_complaints: int
    open_complaints: int
    in_progress_complaints: int
    resolved_complaints: int
    rejected_complaints: int
    sla_breached: int
    avg_response_hours: float
    unread_notifications: int
    pii_views_today: int
    audit_logs_today: int
    encryption_coverage: float  # % PII fields encrypted
    # Security/bug report KPIs
    security_reports_total: int = 0
    security_reports_open: int = 0
    security_reports_open_high: int = 0  # open & severity in (tinggi, kritis)
    complaints_by_type: dict = {}
    complaints_by_status: dict
    complaints_by_category: dict
    complaints_by_priority: dict
    complaints_trend: List[dict]  # [{date, count}] last 14 days
    admin_workload: List[dict]  # [{admin_email, handled_count}]
    recent_activities: List[dict]


class AdminComplaintItem(BaseModel):
    """Complaint for admin view - exposes only user email, no PII (phone/KTP/etc)."""
    id: int
    reference_number: Optional[str]
    title: str
    description: str
    category: str
    priority: str
    report_type: str = "layanan"          # layanan | keamanan
    security_kind: Optional[str] = None
    security_source: Optional[str] = None
    affected_url: Optional[str] = None
    severity: Optional[str] = None
    status: str
    user_email: str  # Only email - NOT PII like phone/NIK/address
    assigned_admin_email: Optional[str] = None  # Handler identity (internal)
    age_days: int = 0
    resolution: Optional[str]
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=False)


class AdminComplaintListResponse(BaseModel):
    total: int
    items: List[AdminComplaintItem]
    page: int
    page_size: int


class AdminUserItem(BaseModel):
    """User for admin view - email only, no profile PII."""
    id: int
    email: str
    is_active: bool
    is_admin: bool
    created_at: datetime
    complaint_count: int
    profile_completion: float

    model_config = ConfigDict(from_attributes=False)


class AdminAuditLogItem(BaseModel):
    id: int
    admin_id: int
    admin_email: str
    action: str
    resource_type: str
    resource_id: Optional[int]
    detail: Optional[str]
    ip_address: Optional[str]
    was_pii_exposed: bool
    created_at: datetime

    model_config = ConfigDict(from_attributes=False)


class AdminStatusUpdate(BaseModel):
    status: str  # diterima, diproses, selesai, ditolak
    resolution: Optional[str] = None

    @field_validator("status")
    @classmethod
    def _validate_status(cls, v: str) -> str:
        allowed = {"diterima", "diproses", "selesai", "ditolak"}
        v = (v or "").strip().lower()
        if v not in allowed:
            raise ValueError(
                f"Status tidak valid. Pilihan: {', '.join(sorted(allowed))}."
            )
        return v


class AdminAnnouncement(BaseModel):
    title: str
    desc: Optional[str] = None
    type: str = "info"  # info, success, warning, system

    @field_validator("type")
    @classmethod
    def _validate_type(cls, v: str) -> str:
        allowed = {"info", "success", "warning", "system"}
        v = (v or "").strip().lower()
        if v not in allowed:
            raise ValueError(f"Tipe notifikasi tidak valid. Pilihan: {', '.join(sorted(allowed))}.")
        return v


class AdminComplaintListRich(BaseModel):
    total: int
    items: List[AdminComplaintItem]
    page: int
    page_size: int
    counts_by_status: dict
    counts_by_type: dict = {}


# ============================================================
# Dashboard Stats
# ============================================================
@router.get("/stats", response_model=AdminDashboardStats)
def get_dashboard_stats(
    request: Request,
    admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    """Aggregate statistics for admin dashboard."""
    total_users = db.query(func.count(User.id)).scalar() or 0
    active_users = db.query(func.count(User.id)).filter(User.is_active == True).scalar() or 0
    week_ago_users = datetime.utcnow() - timedelta(days=7)
    new_users_7d = db.query(func.count(User.id)).filter(
        User.created_at >= week_ago_users
    ).scalar() or 0

    total_complaints = db.query(func.count(Complaint.id)).scalar() or 0
    open_complaints = db.query(func.count(Complaint.id)).filter(
        Complaint.status.in_(["diterima", "diproses"])
    ).scalar() or 0
    in_progress_complaints = db.query(func.count(Complaint.id)).filter(
        Complaint.status == "diproses"
    ).scalar() or 0
    resolved_complaints = db.query(func.count(Complaint.id)).filter(
        Complaint.status == "selesai"
    ).scalar() or 0
    rejected_complaints = db.query(func.count(Complaint.id)).filter(
        Complaint.status == "ditolak"
    ).scalar() or 0

    unread_notifications = db.query(func.count(Notification.id)).filter(
        Notification.read == False
    ).scalar() or 0

    # Complaints by status
    status_rows = (
        db.query(Complaint.status, func.count(Complaint.id))
        .group_by(Complaint.status)
        .all()
    )
    complaints_by_status = {s: c for s, c in status_rows}

    # Complaints by category
    category_rows = (
        db.query(Complaint.category, func.count(Complaint.id))
        .group_by(Complaint.category)
        .all()
    )
    complaints_by_category = {c: n for c, n in category_rows}

    # Complaints by priority
    priority_rows = (
        db.query(Complaint.priority, func.count(Complaint.id))
        .group_by(Complaint.priority)
        .all()
    )
    complaints_by_priority = {p: n for p, n in priority_rows}

    # Complaints by report type (layanan vs keamanan)
    type_rows = (
        db.query(Complaint.report_type, func.count(Complaint.id))
        .group_by(Complaint.report_type)
        .all()
    )
    complaints_by_type = {t or "layanan": n for t, n in type_rows}

    # Security/bug report KPIs (reports only — no PII involved)
    security_reports_total = db.query(func.count(Complaint.id)).filter(
        Complaint.report_type == "keamanan"
    ).scalar() or 0
    security_reports_open = db.query(func.count(Complaint.id)).filter(
        Complaint.report_type == "keamanan",
        Complaint.status.in_(["diterima", "diproses"]),
    ).scalar() or 0
    security_reports_open_high = db.query(func.count(Complaint.id)).filter(
        Complaint.report_type == "keamanan",
        Complaint.status.in_(["diterima", "diproses"]),
        Complaint.severity.in_(["tinggi", "kritis"]),
    ).scalar() or 0

    # SLA breaches: open complaints older than 3 days
    sla_cutoff = datetime.utcnow() - timedelta(days=3)
    sla_breached = db.query(func.count(Complaint.id)).filter(
        Complaint.status.in_(["diterima", "diproses"]),
        Complaint.created_at < sla_cutoff,
    ).scalar() or 0

    # Average response time (hours) for resolved complaints
    resolved_rows = db.query(Complaint.created_at, Complaint.resolved_at).filter(
        Complaint.resolved_at.isnot(None)
    ).all()
    durations = []
    for created, resolved in resolved_rows:
        if created and resolved:
            delta = resolved - created
            durations.append(delta.total_seconds() / 3600.0)
    avg_response_hours = round(sum(durations) / len(durations), 2) if durations else 0.0

    # 14-day complaint trend (aggregate counts only)
    complaints_trend = []
    for i in range(13, -1, -1):
        day_start = (datetime.utcnow() - timedelta(days=i)).replace(
            hour=0, minute=0, second=0, microsecond=0
        )
        day_end = day_start + timedelta(days=1)
        count = db.query(func.count(Complaint.id)).filter(
            Complaint.created_at >= day_start, Complaint.created_at < day_end
        ).scalar() or 0
        complaints_trend.append({"date": day_start.strftime("%Y-%m-%d"), "count": count})

    # Admin workload (cases handled per admin) - internal, no citizen PII
    workload_rows = (
        db.query(Complaint.assigned_admin_id, func.count(Complaint.id))
        .filter(Complaint.assigned_admin_id.isnot(None))
        .group_by(Complaint.assigned_admin_id)
        .all()
    )
    admin_workload = []
    for admin_id, count in workload_rows:
        a = db.query(User).filter(User.id == admin_id).first()
        admin_workload.append({
            "admin_email": a.email if a else "unknown",
            "handled_count": count,
        })
    admin_workload.sort(key=lambda x: x["handled_count"], reverse=True)

    # PII views today (from audit log)
    today_start = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
    pii_views_today = (
        db.query(func.count(AuditLog.id))
        .filter(AuditLog.was_pii_exposed == True, AuditLog.created_at >= today_start)
        .scalar() or 0
    )
    audit_logs_today = (
        db.query(func.count(AuditLog.id))
        .filter(AuditLog.created_at >= today_start)
        .scalar() or 0
    )

    # Encryption coverage: % of PII fields filled (are encrypted at rest)
    profile_count = db.query(func.count(Profile.id)).scalar() or 0
    filled_pii = 0
    total_pii_slots = max(profile_count, 1) * len(PII_FIELDS)
    if profile_count:
        for f in PII_FIELDS:
            col = getattr(Profile, f, None)
            if col is None:
                continue
            filled_pii += db.query(func.count(Profile.id)).filter(
                col.isnot(None), col != "", col != "None"
            ).scalar() or 0
    encryption_coverage = round((filled_pii / total_pii_slots) * 100, 1) if profile_count else 0.0

    # Recent activities (last 7 days, anonymized)
    week_ago = datetime.utcnow() - timedelta(days=7)
    recent = (
        db.query(Notification)
        .filter(Notification.created_at >= week_ago)
        .order_by(desc(Notification.created_at))
        .limit(10)
        .all()
    )
    recent_activities = [
        {
            "id": n.id,
            "title": n.title,
            "type": n.type,
            "created_at": n.created_at.isoformat() if n.created_at else None,
        }
        for n in recent
    ]

    # Log dashboard access (non-PII)
    log_audit(
        db=db,
        admin_id=admin.id,
        action="view_dashboard",
        resource_type="dashboard",
        detail="Viewed admin dashboard",
        request=request,
    )

    return AdminDashboardStats(
        total_users=total_users,
        active_users=active_users,
        new_users_7d=new_users_7d,
        total_complaints=total_complaints,
        open_complaints=open_complaints,
        in_progress_complaints=in_progress_complaints,
        resolved_complaints=resolved_complaints,
        rejected_complaints=rejected_complaints,
        sla_breached=sla_breached,
        avg_response_hours=avg_response_hours,
        unread_notifications=unread_notifications,
        pii_views_today=pii_views_today,
        audit_logs_today=audit_logs_today,
        encryption_coverage=encryption_coverage,
        security_reports_total=security_reports_total,
        security_reports_open=security_reports_open,
        security_reports_open_high=security_reports_open_high,
        complaints_by_type=complaints_by_type,
        complaints_by_status=complaints_by_status,
        complaints_by_category=complaints_by_category,
        complaints_by_priority=complaints_by_priority,
        complaints_trend=complaints_trend,
        admin_workload=admin_workload,
        recent_activities=recent_activities,
    )


# ============================================================
# Complaints (NO PII - email only)
# ============================================================
def _build_complaint_item(db: Session, c: Complaint) -> AdminComplaintItem:
    """Map a Complaint ORM object to the admin view item (email only, no PII)."""
    user = db.query(User).filter(User.id == c.user_id).first() if c.user_id else None
    handler = (
        db.query(User).filter(User.id == c.assigned_admin_id).first()
        if c.assigned_admin_id
        else None
    )
    age_days = 0
    if c.created_at:
        age_days = max(0, (datetime.utcnow() - c.created_at).days)
    return AdminComplaintItem(
        id=c.id,
        reference_number=c.reference_number,
        title=c.title,
        description=c.description,
        category=c.category,
        priority=c.priority,
        report_type=getattr(c, "report_type", "layanan") or "layanan",
        security_kind=getattr(c, "security_kind", None),
        security_source=getattr(c, "security_source", None),
        affected_url=getattr(c, "affected_url", None),
        severity=getattr(c, "severity", None),
        status=c.status,
        user_email=user.email if user else "unknown",
        assigned_admin_email=handler.email if handler else None,
        age_days=age_days,
        resolution=c.resolution,
        created_at=c.created_at,
        updated_at=c.updated_at,
    )


@router.get("/complaints", response_model=AdminComplaintListRich)
def list_complaints(
    request: Request,
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    status: Optional[str] = Query(None),
    category: Optional[str] = Query(None),
    priority: Optional[str] = Query(None),
    report_type: Optional[str] = Query(None),  # layanan | keamanan
    search: Optional[str] = Query(None),
    sort: Optional[str] = Query("newest"),  # newest, oldest, priority, age
    admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    """List complaints for admin. Shows ONLY user email, no other PII."""
    query = db.query(Complaint)
    if status:
        query = query.filter(Complaint.status == status)
    if category:
        query = query.filter(Complaint.category == category)
    if priority:
        query = query.filter(Complaint.priority == priority)
    if report_type:
        query = query.filter(Complaint.report_type == report_type)
    if search:
        like = f"%{search}%"
        query = query.filter(
            (Complaint.reference_number.ilike(like))
            | (Complaint.title.ilike(like))
            | (Complaint.description.ilike(like))
        )

    total = query.count()

    # counts per status (for filter chips) — scoped to the report_type filter if any
    counts_query = db.query(Complaint.status, func.count(Complaint.id))
    if report_type:
        counts_query = counts_query.filter(Complaint.report_type == report_type)
    counts_rows = counts_query.group_by(Complaint.status).all()
    counts_by_status = {s: c for s, c in counts_rows}

    all_q = db.query(func.count(Complaint.id))
    if report_type:
        all_q = all_q.filter(Complaint.report_type == report_type)
    counts_by_status["_all"] = all_q.scalar() or 0

    # counts per report type (for type tabs)
    type_rows = (
        db.query(Complaint.report_type, func.count(Complaint.id))
        .group_by(Complaint.report_type)
        .all()
    )
    counts_by_type = {t or "layanan": c for t, c in type_rows}

    if sort == "oldest":
        query = query.order_by(Complaint.created_at.asc())
    elif sort == "age":
        query = query.order_by(Complaint.created_at.asc())
    elif sort == "priority":
        # tinggi > sedang > rendah (urutan prioritas)
        order_map = case(
            (Complaint.priority == "tinggi", 1),
            (Complaint.priority == "sedang", 2),
            else_=3,
        )
        query = query.order_by(order_map.asc(), desc(Complaint.created_at))
    else:
        query = query.order_by(desc(Complaint.created_at))

    complaints = (
        query.offset((page - 1) * page_size).limit(page_size).all()
    )

    items = [_build_complaint_item(db, c) for c in complaints]

    return AdminComplaintListRich(
        total=total,
        items=items,
        page=page,
        page_size=page_size,
        counts_by_status=counts_by_status,
        counts_by_type=counts_by_type,
    )


@router.get("/complaints/{complaint_id}", response_model=AdminComplaintItem)
def get_complaint_detail(
    complaint_id: int,
    request: Request,
    admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    """View complaint detail. Audit-logged (exposes user email only)."""
    complaint = db.query(Complaint).filter(Complaint.id == complaint_id).first()
    if not complaint:
        raise HTTPException(status_code=404, detail="Pengaduan tidak ditemukan")

    # Audit: PII exposure tracking (email is contact info, not sensitive PII)
    log_audit(
        db=db,
        admin_id=admin.id,
        action="view_complaint_detail",
        resource_type="complaint",
        resource_id=complaint_id,
        detail=f"Viewed complaint: {complaint.title}",
        request=request,
        accessed_fields=["user_email"],
    )

    return _build_complaint_item(db, complaint)


@router.put("/complaints/{complaint_id}/status", response_model=AdminComplaintItem)
def update_complaint_status(
    complaint_id: int,
    payload: AdminStatusUpdate,
    request: Request,
    admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    """Update complaint status/resolution."""
    complaint = db.query(Complaint).filter(Complaint.id == complaint_id).first()
    if not complaint:
        raise HTTPException(status_code=404, detail="Pengaduan tidak ditemukan")

    complaint.status = payload.status
    # Hanya perbarui resolution bila field disertakan (hindari menghapus resolusi lama
    # saat admin hanya mengganti status).
    if payload.resolution is not None:
        complaint.resolution = payload.resolution
    complaint.assigned_admin_id = admin.id
    if payload.status in ("selesai", "ditolak"):
        complaint.resolved_at = datetime.utcnow()
    else:
        # Status kembali ke non-final → hapus waktu penyelesaian agar konsisten.
        complaint.resolved_at = None
    db.commit()
    db.refresh(complaint)

    log_audit(
        db=db,
        admin_id=admin.id,
        action="update_complaint_status",
        resource_type="complaint",
        resource_id=complaint_id,
        detail=f"Status -> {payload.status}",
        request=request,
    )

    return _build_complaint_item(db, complaint)


# ============================================================
# Users (email + completion only, NO profile PII)
# ============================================================
@router.get("/users", response_model=List[AdminUserItem])
def list_users(
    request: Request,
    admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    """List users. Shows email and profile completion % only, NO PII."""
    users = db.query(User).order_by(desc(User.created_at)).all()

    items = []
    for u in users:
        complaint_count = db.query(func.count(Complaint.id)).filter(
            Complaint.user_id == u.id
        ).scalar() or 0
        profile = db.query(Profile).filter(Profile.user_id == u.id).first()

        # Calculate completion WITHOUT decrypting (count filled encrypted fields)
        completion = 0.0
        if profile:
            filled = 0
            for f in PII_FIELDS:
                val = getattr(profile, f, None)
                if val and str(val).strip() not in ("", "None"):
                    filled += 1
            completion = round((filled / len(PII_FIELDS)) * 100, 1)

        items.append(
            AdminUserItem(
                id=u.id,
                email=u.email,
                is_active=u.is_active,
                is_admin=getattr(u, "is_admin", False),
                created_at=u.created_at,
                complaint_count=complaint_count,
                profile_completion=completion,
            )
        )

    return items


@router.post("/users/{user_id}/toggle-active", response_model=MessageResponse)
def toggle_user_active(
    user_id: int,
    request: Request,
    admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    """Enable/disable a user account."""
    user = db.get(User, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User tidak ditemukan")
    if user.id == admin.id:
        raise HTTPException(status_code=400, detail="Tidak bisa menonaktifkan akun sendiri")

    user.is_active = not user.is_active
    db.commit()

    log_audit(
        db=db,
        admin_id=admin.id,
        action="toggle_user_active",
        resource_type="user",
        resource_id=user_id,
        detail=f"Set is_active={user.is_active}",
        request=request,
    )

    return {"detail": f"Akun {'diaktifkan' if user.is_active else 'dinonaktifkan'}"}


# ============================================================
# Audit Logs
# ============================================================
@router.get("/audit-logs", response_model=List[AdminAuditLogItem])
def list_audit_logs(
    request: Request,
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0),
    action: Optional[str] = Query(None),
    admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    """View audit trail of admin actions (admin only)."""
    logs = get_audit_logs(db, action=action, limit=limit, offset=offset)

    items = []
    for log in logs:
        admin_user = db.query(User).filter(User.id == log.admin_id).first()
        items.append(
            AdminAuditLogItem(
                id=log.id,
                admin_id=log.admin_id,
                admin_email=admin_user.email if admin_user else "unknown",
                action=log.action,
                resource_type=log.resource_type,
                resource_id=log.resource_id,
                detail=log.detail,
                ip_address=log.ip_address,
                was_pii_exposed=log.was_pii_exposed,
                created_at=log.created_at,
            )
        )

    # Audit the audit-log view itself
    log_audit(
        db=db,
        admin_id=admin.id,
        action="view_audit_logs",
        resource_type="audit_log",
        detail=f"Viewed {len(items)} audit logs",
        request=request,
    )

    return items


# ============================================================
# Export (NON-PII columns only, audit-logged)
# ============================================================
@router.get("/export/complaints.csv")
def export_complaints_csv(
    request: Request,
    status: Optional[str] = Query(None),
    category: Optional[str] = Query(None),
    report_type: Optional[str] = Query(None),
    admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    """Export complaints as CSV. Contains ONLY non-PII columns (no phone/NIK/address)."""
    query = db.query(Complaint)
    if status:
        query = query.filter(Complaint.status == status)
    if category:
        query = query.filter(Complaint.category == category)
    if report_type:
        query = query.filter(Complaint.report_type == report_type)
    complaints = query.order_by(desc(Complaint.created_at)).all()

    buffer = io.StringIO()
    writer = csv.writer(buffer)

    def _csv_safe(value):
        """Cegah CSV/formula injection: prefix sel yang diawali =,+,-,@ dengan apostrof."""
        if value is None:
            return ""
        s = str(value)
        if s and s[0] in ("=", "+", "-", "@", "\t", "\r"):
            return "'" + s
        return s

    # Only non-PII columns (no reporter email, no phone/NIK/address).
    writer.writerow([
        "reference_number", "report_type", "title", "category", "priority",
        "severity", "status", "age_days", "created_at", "updated_at",
    ])
    for c in complaints:
        age = max(0, (datetime.utcnow() - c.created_at).days) if c.created_at else 0
        writer.writerow([
            _csv_safe(c.reference_number), _csv_safe(getattr(c, "report_type", "layanan") or "layanan"),
            _csv_safe(c.title), _csv_safe(c.category), _csv_safe(c.priority),
            _csv_safe(getattr(c, "severity", None)),
            _csv_safe(c.status), age,
            c.created_at.isoformat() if c.created_at else "",
            c.updated_at.isoformat() if c.updated_at else "",
        ])
    buffer.seek(0)

    log_audit(
        db=db,
        admin_id=admin.id,
        action="export_complaints",
        resource_type="export",
        detail=f"Exported {len(complaints)} complaints (non-PII CSV)",
        request=request,
    )

    return StreamingResponse(
        iter([buffer.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=complaints_export.csv"},
    )


# ============================================================
# Announcements (broadcast to all active users)
# ============================================================
@router.post("/announcements", response_model=MessageResponse)
def broadcast_announcement(
    payload: AdminAnnouncement,
    request: Request,
    admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    """Send a system announcement to all active users."""
    users = db.query(User).filter(User.is_active == True).all()
    created = 0
    for u in users:
        db.add(Notification(
            user_id=u.id,
            title=payload.title,
            description=payload.desc,
            type=payload.type,
            source="announcement",
            read=False,
        ))
        created += 1
    db.commit()

    log_audit(
        db=db,
        admin_id=admin.id,
        action="broadcast_announcement",
        resource_type="announcement",
        detail=f"Broadcast to {created} users: {payload.title}",
        request=request,
    )

    return {"detail": f"Pengumuman terkirim ke {created} pengguna"}