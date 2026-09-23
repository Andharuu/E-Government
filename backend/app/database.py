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


def _sync_schema(target_engine):
    """Sinkronisasi kolom skema jika tabel sudah ada dari versi sebelumnya."""
    from sqlalchemy import inspect, text

    insp = inspect(target_engine)
    is_sqlite_db = target_engine.dialect.name == "sqlite"

    with target_engine.connect() as conn:
        # 1. users table
        if insp.has_table("users"):
            user_cols = {c["name"] for c in insp.get_columns("users")}
            if "is_active" not in user_cols:
                bool_type = "INTEGER NOT NULL DEFAULT 1" if is_sqlite_db else "TINYINT(1) NOT NULL DEFAULT 1"
                conn.execute(text(f"ALTER TABLE users ADD COLUMN is_active {bool_type}"))
                conn.commit()
            if "updated_at" not in user_cols:
                dt_type = "DATETIME DEFAULT CURRENT_TIMESTAMP" if is_sqlite_db else "DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP"
                conn.execute(text(f"ALTER TABLE users ADD COLUMN updated_at {dt_type}"))
                conn.commit()

        # 2. profiles table
        if insp.has_table("profiles"):
            profile_cols = {c["name"] for c in insp.get_columns("profiles")}
            new_profile_cols = [
                ("first_name", "VARCHAR(100) NULL"),
                ("last_name", "VARCHAR(100) NULL"),
                ("country", "VARCHAR(100) NULL"),
                ("website", "VARCHAR(255) NULL"),
                ("income", "VARCHAR(100) NULL"),
                ("driver_license", "VARCHAR(100) NULL"),
            ]
            for col_name, col_def in new_profile_cols:
                if col_name not in profile_cols:
                    conn.execute(text(f"ALTER TABLE profiles ADD COLUMN {col_name} {col_def}"))
                    conn.commit()

        # 3. mappings table
        if insp.has_table("mappings"):
            mapping_cols = {c["name"] for c in insp.get_columns("mappings")}
            if not is_sqlite_db:
                if "domain" in mapping_cols and "website_domain" not in mapping_cols:
                    conn.execute(text("ALTER TABLE mappings CHANGE COLUMN domain website_domain VARCHAR(255) NOT NULL"))
                    conn.commit()
                if "field_name" in mapping_cols and "website_field" not in mapping_cols:
                    conn.execute(text("ALTER TABLE mappings CHANGE COLUMN field_name website_field VARCHAR(100) NOT NULL"))
                    conn.commit()
                if "profile_attribute" in mapping_cols and "govconnect_field" not in mapping_cols:
                    conn.execute(text("ALTER TABLE mappings CHANGE COLUMN profile_attribute govconnect_field VARCHAR(50) NOT NULL"))
                    conn.commit()

            # Refresh columns
            mapping_cols = {c["name"] for c in insp.get_columns("mappings")}
            if "website_domain" not in mapping_cols:
                conn.execute(text("ALTER TABLE mappings ADD COLUMN website_domain VARCHAR(255) NOT NULL"))
                conn.commit()
            if "website_field" not in mapping_cols:
                conn.execute(text("ALTER TABLE mappings ADD COLUMN website_field VARCHAR(100) NOT NULL"))
                conn.commit()
            if "govconnect_field" not in mapping_cols:
                conn.execute(text("ALTER TABLE mappings ADD COLUMN govconnect_field VARCHAR(50) NOT NULL"))
                conn.commit()
            if "updated_at" not in mapping_cols:
                dt_type = "DATETIME DEFAULT CURRENT_TIMESTAMP" if is_sqlite_db else "DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP"
                conn.execute(text(f"ALTER TABLE mappings ADD COLUMN updated_at {dt_type}"))
                conn.commit()


def init_db():
    """Inisialisasi tabel basis data jika belum tersedia serta sinkronisasi skema."""
    try:
        Base.metadata.create_all(bind=engine)
        _sync_schema(engine)
        logger.info("Basis data berhasil diinisialisasi dan skema tersinkronisasi.")
    except Exception as exc:
        logger.warning(
            f"Koneksi basis data ({settings.DATABASE_URL.split('@')[-1]}) gagal saat inisialisasi: {exc}. "
            "Pastikan container MySQL aktif atau gunakan DATABASE_URL sqlite untuk development offline."
        )