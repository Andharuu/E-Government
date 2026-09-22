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


def init_db():
    """Inisialisasi tabel basis data jika belum tersedia."""
    try:
        Base.metadata.create_all(bind=engine)
        logger.info("Basis data berhasil diinisialisasi.")
    except Exception as exc:
        logger.warning(
            f"Koneksi basis data ({settings.DATABASE_URL.split('@')[-1]}) gagal saat inisialisasi: {exc}. "
            "Pastikan container MySQL aktif atau gunakan DATABASE_URL sqlite untuk development offline."
        )