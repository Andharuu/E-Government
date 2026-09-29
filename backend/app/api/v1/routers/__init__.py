from app.api.v1.routers.profile import router as profile_router
from app.api.v1.routers.mapping import router as mapping_router
from app.api.v1.routers.activity import router as activity_router

__all__ = [
    "profile_router",
    "mapping_router",
    "activity_router",
]
