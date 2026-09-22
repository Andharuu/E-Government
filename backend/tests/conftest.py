import sys
from pathlib import Path
import pytest
from fastapi.testclient import TestClient

# Pastikan path backend masuk ke sys.path
backend_root = Path(__file__).resolve().parent.parent
if str(backend_root) not in sys.path:
    sys.path.insert(0, str(backend_root))
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.database import Base, get_db
from app.main import app
from app.core.security import rate_limiter

# Database SQLite in-memory terisolasi khusus untuk testing
SQLALCHEMY_DATABASE_URL = "sqlite:///:memory:"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


@pytest.fixture(scope="function")
def db_session():
    """Membuat tabel baru untuk setiap fungsi test dan membersihkannya setelah selesai."""
    Base.metadata.create_all(bind=engine)
    session = TestingSessionLocal()
    try:
        yield session
    finally:
        session.close()
        Base.metadata.drop_all(bind=engine)


@pytest.fixture(scope="function")
def client(db_session):
    """TestClient dengan dependency database yang diarahkan ke test database."""
    rate_limiter.reset()
    def override_get_db():
        try:
            yield db_session
        finally:
            pass

    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()


@pytest.fixture(scope="function")
def auth_headers(client):
    """Fixture yang mendaftarkan user dan mengembalikan header Authorization Bearer."""
    email = "testcitizen@govconnect.id"
    password = "SecurePassword123!"

    # Registrasi
    client.post("/api/v1/auth/register", json={"email": email, "password": password})

    # Login
    login_res = client.post(
        "/api/v1/auth/login",
        data={"username": email, "password": password},
        headers={"Content-Type": "application/x-www-form-urlencoded"}
    )
    token = login_res.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}
