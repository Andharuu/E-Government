"""
GovConnect Core API Aggregator Router.
Menggabungkan router modular Profile, Mapping, dan Activity
serta mempertahankan kompatibilitas impor dengan versi sebelumnya.
"""

from fastapi import APIRouter

from app.api.routers.profile_router import router as profile_router
from app.api.routers.mapping_router import router as mapping_router
from app.api.routers.activity_router import router as activity_router

# Re-export helper functions untuk backward-compatibility
from app.services.profile_service import (
    calculate_profile_completion,
    CORE_PROFILE_FIELDS,
)
from app.services.activity_service import (
    extract_domain,
    compute_activity_stats,
    compute_activity_analytics,
)

# Router utama yang menggabungkan seluruh sub-router
router = APIRouter()
router.include_router(profile_router)
router.include_router(mapping_router)
router.include_router(activity_router)

__all__ = [
    "router",
    "calculate_profile_completion",
    "CORE_PROFILE_FIELDS",
    "extract_domain",
    "compute_activity_stats",
    "compute_activity_analytics",
]