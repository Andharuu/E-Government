from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker

DATABASE_URL = "mysql+pymysql://govuser:govpassword@localhost:3306/govconnect_db"

engine = create_engine(
    DATABASE_URL,
    echo=True, # Menampilkan query SQL mentah di terminal untuk debugging
    pool_pre_ping=True
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()