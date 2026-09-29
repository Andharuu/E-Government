from fastapi import APIRouter

from app.api.v1.routers.auth import router as auth_router
from app.api.v1.routers.profile import router as profile_router
from app.api.v1.routers.mapping import router as mapping_router
from app.api.v1.routers.activity import router as activity_router

api_router = APIRouter(prefix="/api/v1")

api_router.include_router(auth_router)
api_router.include_router(profile_router)
api_router.include_router(mapping_router)
api_router.include_router(activity_router)
