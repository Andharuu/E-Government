import time
import logging
from contextlib import asynccontextmanager
from datetime import datetime, timezone

from fastapi import FastAPI, Request, status
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from starlette.exceptions import HTTPException as StarletteHTTPException

from app.core.config import settings
from app.database import init_db
import app.models.entities # Memastikan seluruh model teregistrasi
from app.api.auth import router as auth_router
from app.api.endpoints import router as api_router

# ============================================================
# Konfigurasi Logging Terstruktur
# ============================================================
logging.basicConfig(
    level=logging.INFO if not settings.SQL_ECHO else logging.DEBUG,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)
logger = logging.getLogger("govconnect.main")


# ============================================================
# Application Lifespan Handler
# ============================================================
@asynccontextmanager
async def lifespan(app: FastAPI):
    """Lifecycle handler untuk startup dan shutdown aplikasi."""
    logger.info(f"Memulai {settings.APP_NAME} v{settings.APP_VERSION} (Env: {settings.ENVIRONMENT})")
    init_db()
    if settings.ENVIRONMENT.lower() == "production" and not settings.is_sqlite:
        logger.warning(
            "InMemoryRateLimiter aktif pada production! "
            "Untuk multi-worker cluster, pertimbangkan Redis sebagai storage rate limiting."
        )
    yield
    logger.info(f"Menghentikan {settings.APP_NAME}")


app = FastAPI(
    title=settings.APP_NAME,
    description="Layanan Backend RESTful API GovConnect untuk manajemen profil, mapping, dan aktivitas autofill",
    version=settings.APP_VERSION,
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan
)


# ============================================================
# Request Timing & Logging Middleware
# ============================================================
@app.middleware("http")
async def request_logger_middleware(request: Request, call_next):
    start_time = time.time()
    response = await call_next(request)
    duration_ms = round((time.time() - start_time) * 1000, 2)

    logger.info(
        f"{request.method} {request.url.path} -> {response.status_code} ({duration_ms}ms) "
        f"[Client: {request.client.host if request.client else 'unknown'}]"
    )
    response.headers["X-Response-Time-Ms"] = str(duration_ms)
    return response


# ============================================================
# CORS Security Hardening (Perbaikan BUG-007)
# ============================================================
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_origin_regex=settings.CORS_ORIGIN_REGEX,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["*"],
    expose_headers=["X-Response-Time-Ms"]
)


# ============================================================
# Global Exception Handlers
# ============================================================
@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    """Format error validasi pydantic menjadi respons yang ramah pengguna."""
    errors = []
    for err in exc.errors():
        loc = " -> ".join(str(l) for l in err.get("loc", []))
        msg = err.get("msg", "Input tidak valid")
        errors.append({"field": loc, "message": msg})

    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content={
            "detail": "Validasi masukan data gagal",
            "errors": errors
        }
    )


@app.exception_handler(StarletteHTTPException)
async def http_exception_handler(request: Request, exc: StarletteHTTPException):
    """Menangani seluruh HTTPException standar dengan format konsisten."""
    return JSONResponse(
        status_code=exc.status_code,
        content={"detail": exc.detail},
        headers=getattr(exc, "headers", None)
    )


@app.exception_handler(Exception)
async def unhandled_exception_handler(request: Request, exc: Exception):
    """Menangani unhandled exception tanpa membocorkan internal database / trace."""
    logger.exception(f"Unhandled error pada {request.method} {request.url.path}: {exc}")
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "detail": "Terjadi kesalahan internal pada server. Silakan hubungi administrator."
        }
    )


# ============================================================
# Registrasi Router
# ============================================================
app.include_router(auth_router, prefix=settings.API_V1_PREFIX)
app.include_router(api_router, prefix=settings.API_V1_PREFIX)


# ============================================================
# Health & Status Endpoints
# ============================================================
@app.get("/", tags=["Health"])
def read_root():
    return {
        "service": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "status": "online",
        "environment": settings.ENVIRONMENT,
        "docs_url": "/docs"
    }


@app.get("/health", tags=["Health"])
def health_check():
    return {
        "status": "healthy",
        "service": settings.APP_NAME,
        "timestamp": datetime.now(timezone.utc).isoformat()
    }


@app.get("/v1/models", include_in_schema=False)
def models_probe():
    """Mock endpoint kompatibilitas untuk probe IDE / tooling local AI."""
    return {"object": "list", "data": []}