import logging
from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker

from app.core.config import settings

logger = logging.getLogger("govconnect.database")

# Konfigurasi engine sesuai driver basis data
connect_args = {}
engine_kwargs = {
    "echo": settings.SQL_ECHO,
    "pool_pre_ping": True,
}

if settings.is_sqlite:
    connect_args["check_same_thread"] = False
    engine_kwargs.pop("pool_pre_ping", None)
else:
    # Optimasi pool koneksi MySQL
    engine_kwargs["pool_recycle"] = 3600
    engine_kwargs["pool_size"] = 10
    engine_kwargs["max_overflow"] = 20

engine = create_engine(
    settings.DATABASE_URL,
    connect_args=connect_args,
    **engine_kwargs
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


def get_db():
    """Dependency injection session SQLAlchemy untuk FastAPI router."""
    db = SessionLocal()
    try:
        yield db
    except Exception:
        db.rollback()
        raise
    finally:
        db.close()


def _ensure_complaint_report_columns():
    """Lightweight auto-migration: add security/bug report columns to `complaints`
    if they don't exist yet (works for both SQLite and MySQL without Alembic)."""
    from sqlalchemy import text, inspect

    inspector = inspect(engine)
    if "complaints" not in inspector.get_table_names():
        return
    existing = {col["name"] for col in inspector.get_columns("complaints")}
    # Explicit, hard-coded DDL per column (no string interpolation of identifiers
    # beyond a fixed allow-list) → no SQL-injection surface.
    DDL = {
        "report_type": "ALTER TABLE complaints ADD COLUMN report_type VARCHAR(20) DEFAULT 'layanan' NOT NULL",
        "security_kind": "ALTER TABLE complaints ADD COLUMN security_kind VARCHAR(40)",
        "security_source": "ALTER TABLE complaints ADD COLUMN security_source VARCHAR(20)",
        "affected_url": "ALTER TABLE complaints ADD COLUMN affected_url VARCHAR(500)",
        "severity": "ALTER TABLE complaints ADD COLUMN severity VARCHAR(20)",
    }
    with engine.begin() as conn:
        for name, statement in DDL.items():
            if name in existing:
                continue
            try:
                conn.execute(text(statement))
                logger.info(f"Migrasi: kolom complaints.{name} ditambahkan.")
            except Exception as exc:  # pragma: no cover - defensive
                logger.warning(f"Gagal menambah kolom complaints.{name}: {exc}")


def _ensure_activity_columns():
    """Auto-migration: add autofill-detail columns to `activities` bila belum ada."""
    from sqlalchemy import text, inspect

    inspector = inspect(engine)
    if "activities" not in inspector.get_table_names():
        return
    existing = {col["name"] for col in inspector.get_columns("activities")}
    DDL = {
        "target_url": "ALTER TABLE activities ADD COLUMN target_url VARCHAR(500)",
        "website_domain": "ALTER TABLE activities ADD COLUMN website_domain VARCHAR(255)",
        "action": "ALTER TABLE activities ADD COLUMN action VARCHAR(50)",
        "status": "ALTER TABLE activities ADD COLUMN status VARCHAR(20)",
        "fields_detected": "ALTER TABLE activities ADD COLUMN fields_detected INTEGER",
        "fields_filled": "ALTER TABLE activities ADD COLUMN fields_filled INTEGER",
        "filled_fields_summary": "ALTER TABLE activities ADD COLUMN filled_fields_summary TEXT",
    }
    with engine.begin() as conn:
        for name, statement in DDL.items():
            if name in existing:
                continue
            try:
                conn.execute(text(statement))
                logger.info(f"Migrasi: kolom activities.{name} ditambahkan.")
            except Exception as exc:  # pragma: no cover - defensive
                logger.warning(f"Gagal menambah kolom activities.{name}: {exc}")


def _bootstrap_admins():
    """Promote users listed in ADMIN_EMAILS to admin (auditable provisioning).

    Tidak ada kredensial hardcoded: admin dibuat/di-promote hanya jika emailnya
    tercantum di environment ADMIN_EMAILS. Setiap promosi dicatat ke log & audit.
    """
    from app.models.entities import User

    raw = settings.ADMIN_EMAILS or ""
    emails = [e.strip().lower() for e in raw.split(",") if e.strip()]
    if not emails:
        return
    db = SessionLocal()
    try:
        for email in emails:
            user = db.query(User).filter(User.email == email).first()
            if user is None:
                logger.warning(
                    f"ADMIN_EMAILS: email '{email}' belum terdaftar. "
                    "Daftarkan dulu lalu restart, atau promosikan via CLI."
                )
                continue
            if not user.is_admin:
                user.is_admin = True
                db.commit()
                logger.warning(f"Bootstrap admin: '{email}' dipromosikan menjadi admin.")
    finally:
        db.close()


def init_db():
    """Inisialisasi tabel basis data jika belum tersedia."""
    try:
        Base.metadata.create_all(bind=engine)
        _ensure_complaint_report_columns()
        _ensure_activity_columns()
        _bootstrap_admins()
        logger.info("Basis data berhasil diinisialisasi.")
    except Exception as exc:
        logger.warning(
            f"Koneksi basis data ({settings.DATABASE_URL.split('@')[-1]}) gagal saat inisialisasi: {exc}. "
            "Pastikan container MySQL aktif atau gunakan DATABASE_URL sqlite untuk development offline."
        )