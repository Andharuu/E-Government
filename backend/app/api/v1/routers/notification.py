import asyncio
import json
from datetime import datetime, timedelta
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, Request, status
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session

from app.api.v1.routers.auth import get_current_user
from app.database import SessionLocal, get_db
from app.models.entities import Notification, User
from app.core.security import limiter
from app.schemas.schemas import (
    MessageResponse,
    NotificationCreate,
    NotificationResponse,
    NotificationUnreadCount,
)

router = APIRouter(prefix="/notifications", tags=["Notifikasi Realtime"])


def create_notification(
    db: Session,
    user_id: int,
    title: str,
    desc: Optional[str] = None,
    type: str = "info",
    source: str = "system",
    ref_id: Optional[int] = None,
) -> Notification:
    """Helper pembuatan notifikasi (dipakai internal oleh service lain)."""
    notif = Notification(
        user_id=user_id,
        title=title,
        description=desc,
        type=type if type in ("success", "info", "warning", "system") else "info",
        source=source,
        ref_id=ref_id,
    )
    db.add(notif)
    db.commit()
    db.refresh(notif)
    return notif


@router.get("", response_model=List[NotificationResponse])
@limiter.limit("120/minute")
def list_notifications(
    request: Request,
    limit: int = Query(30, ge=1, le=100, description="Batas jumlah notifikasi"),
    unread_only: bool = Query(False, description="Hanya tampilkan yang belum dibaca"),
    since_id: Optional[int] = Query(
        None, ge=0, description="Ambil notifikasi dengan id lebih besar dari nilai ini (untuk polling realtime)"
    ),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Mengambil daftar notifikasi pengguna, diurutkan dari yang terbaru.
    Mendukung parameter `since_id` untuk polling realtime secara efisien.
    """
    query = db.query(Notification).filter(Notification.user_id == current_user.id)

    if unread_only:
        query = query.filter(Notification.read.is_(False))
    if since_id is not None:
        query = query.filter(Notification.id > since_id)

    return query.order_by(Notification.created_at.desc()).limit(limit).all()


@router.get("/unread-count", response_model=NotificationUnreadCount)
@limiter.limit("240/minute")
def get_unread_count(
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Jumlah notifikasi belum dibaca — endpoint ringan untuk badge navbar."""
    count = (
        db.query(Notification)
        .filter(Notification.user_id == current_user.id, Notification.read.is_(False))
        .count()
    )
    return {"count": count}


@router.post("", response_model=NotificationResponse, status_code=status.HTTP_201_CREATED)
@limiter.limit("60/minute")
def create_user_notification(
    request: Request,
    payload: NotificationCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Membuat notifikasi baru untuk pengguna (dipakai ekstensi/web view)."""
    return create_notification(
        db,
        user_id=current_user.id,
        title=payload.title,
        desc=payload.desc,
        type=payload.type,
        source=payload.source or "system",
        ref_id=payload.ref_id,
    )


@router.post("/read-all", response_model=MessageResponse)
@limiter.limit("60/minute")
def mark_all_read(
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Tandai seluruh notifikasi pengguna sebagai sudah dibaca."""
    updated = (
        db.query(Notification)
        .filter(Notification.user_id == current_user.id, Notification.read.is_(False))
        .update({Notification.read: True}, synchronize_session=False)
    )
    db.commit()
    return {"detail": f"{updated} notifikasi ditandai sudah dibaca"}


@router.post("/{notification_id}/read", response_model=NotificationResponse)
@limiter.limit("120/minute")
def mark_one_read(
    request: Request,
    notification_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Tandai satu notifikasi sebagai sudah dibaca."""
    notif = (
        db.query(Notification)
        .filter(Notification.id == notification_id, Notification.user_id == current_user.id)
        .first()
    )
    if not notif:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Notifikasi tidak ditemukan")

    notif.read = True
    db.commit()
    db.refresh(notif)
    return notif


@router.delete("/{notification_id}", status_code=status.HTTP_204_NO_CONTENT)
@limiter.limit("60/minute")
def delete_notification(
    request: Request,
    notification_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Menghapus satu notifikasi milik pengguna."""
    notif = (
        db.query(Notification)
        .filter(Notification.id == notification_id, Notification.user_id == current_user.id)
        .first()
    )
    if not notif:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Notifikasi tidak ditemukan")

    db.delete(notif)
    db.commit()
    return None


@router.delete("", response_model=MessageResponse)
@limiter.limit("30/minute")
def clear_notifications(
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Menghapus seluruh notifikasi pengguna."""
    count = (
        db.query(Notification)
        .filter(Notification.user_id == current_user.id)
        .delete(synchronize_session=False)
    )
    db.commit()
    return {"detail": f"{count} notifikasi berhasil dibersihkan"}


@router.post("/stream-token", response_model=dict)
@limiter.limit("30/minute")
def issue_stream_token(
    request: Request,
    current_user: User = Depends(get_current_user),
):
    """Terbitkan token JWT berumur pendek KHUSUS untuk SSE stream.

    Token penuh tidak boleh muncul di URL (bocor ke log/riwayat/Referer).
    Token ini expire 2 menit dan hanya berlaku untuk endpoint /stream.
    """
    from app.core.security import create_access_token

    token = create_access_token(
        {"sub": str(current_user.id), "scope": "sse"},
        expires_delta=timedelta(minutes=2),
    )
    return {"stream_token": token, "expires_in": 120}


@router.get("/stream")
@limiter.limit("30/minute")
def stream_notifications(
    request: Request,
    token: str = Query(..., description="Token SSE berumur pendek dari /stream-token"),
):
    """
    Server-Sent Events (SSE) untuk notifikasi realtime.

    Token divalidasi ulang terhadap database: user harus ada, AKTIF, dan token
    harus ber-scope 'sse'. Nonaktifkan akun -> stream langsung ditolak.
    """
    from jose import JWTError, jwt
    from app.core.config import settings

    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        sub = payload.get("sub")
        scope = payload.get("scope")
        if sub is None:
            raise ValueError("missing sub")
        user_id = int(sub)
        # Hanya token khusus stream yang diterima (bukan access token umum).
        if scope != "sse":
            raise ValueError("invalid scope")
    except (JWTError, TypeError, ValueError):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token tidak valid")

    # Verifikasi ulang ke DB: user masih ada & aktif (mencabut sesi saat dinonaktifkan).
    check_db = SessionLocal()
    try:
        stream_user = check_db.query(User).filter(User.id == user_id).first()
        if stream_user is None or not stream_user.is_active:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Akun tidak aktif atau tidak ditemukan",
            )
    finally:
        check_db.close()

    async def event_generator():
        last_id = 0
        with SessionLocal() as db:
            latest = (
                db.query(Notification)
                .filter(Notification.user_id == user_id)
                .order_by(Notification.id.desc())
                .first()
            )
            last_id = latest.id if latest else 0
        yield f"event: ready\ndata: {json.dumps({'last_id': last_id})}\n\n"

        idle = 0
        while True:
            if await request.is_disconnected():
                break

            with SessionLocal() as db:
                rows = (
                    db.query(Notification)
                    .filter(Notification.user_id == user_id, Notification.id > last_id)
                    .order_by(Notification.id.asc())
                    .all()
                )
                serialized = [
                    (row.id, NotificationResponse.model_validate(row).model_dump(mode="json"))
                    for row in rows
                ]

            if serialized:
                idle = 0
                for row_id, data in serialized:
                    last_id = row_id
                    yield f"event: notification\ndata: {json.dumps(data)}\n\n"
            else:
                idle += 1
                # Heartbeat tiap ~15 detik agar koneksi tidak timeout
                if idle % 15 == 0:
                    yield ": ping\n\n"

            await asyncio.sleep(2)

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        },
    )
