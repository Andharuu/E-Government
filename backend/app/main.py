from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.database import engine, Base
import app.models.entities
from app.api.endpoints import router as api_router

# Eksekusi pembuatan tabel di MySQL berdasarkan model
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="GovConnect API Engine",
    description="Backend service for GovConnect autofill assistant",
    version="1.0.0"
)

# Izinkan komunikasi lintas origin (dibutuhkan oleh Chrome Extension & Dashboard)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Hubungkan modul endpoints API
app.include_router(api_router)

# Mount folder dashboard agar bisa diakses langsung via browser
app.mount("/dashboard", StaticFiles(directory="dashboard", html=True), name="dashboard")

@app.get("/")
def read_root():
    return {
        "service": "GovConnect API",
        "status": "online",
        "dashboard_url": "/dashboard",
        "database": "connected"
    }