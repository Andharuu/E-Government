from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.database import engine, Base
import app.models.entities
from app.api.endpoints import router as api_router
from app.api.auth import router as auth_router

# Buat semua tabel di MySQL berdasarkan model SQLAlchemy
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="GovConnect API Engine",
    description="Backend service for GovConnect autofill assistant",
    version="2.0.0"
)

# Izinkan komunikasi lintas origin (Chrome Extension & Dashboard)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Daftarkan router autentikasi (/api/v1/auth/...)
app.include_router(auth_router)

# Daftarkan router endpoint utama (/api/v1/...)
app.include_router(api_router)

# Mount folder dashboard sebagai static files di /dashboard
app.mount("/dashboard", StaticFiles(directory="dashboard", html=True), name="dashboard")

@app.get("/")
def read_root():
    return {
        "service": "GovConnect API",
        "version": "2.0.0",
        "status": "online",
        "dashboard_url": "/dashboard",
        "docs_url": "/docs",
        "database": "connected"
    }