from app.api.routers.profile_router import router as profile_router
from app.api.routers.mapping_router import router as mapping_router
from app.api.routers.activity_router import router as activity_router

__all__ = [
    "profile_router",
    "mapping_router",
    "activity_router",
]
