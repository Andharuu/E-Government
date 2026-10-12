from fastapi import APIRouter

from app.api.v1.routers.auth import router as auth_router
from app.api.v1.routers.profile import router as profile_router
from app.api.v1.routers.mapping import router as mapping_router
from app.api.v1.routers.activity import router as activity_router
from app.api.v1.routers.notification import router as notification_router
from app.api.v1.routers.public_services import router as public_services_router
from app.api.v1.routers.admin import router as admin_router
from app.api.v1.routers.complaints import router as complaints_router

api_router = APIRouter(prefix="/api/v1")

api_router.include_router(auth_router)
api_router.include_router(profile_router)
api_router.include_router(mapping_router)
api_router.include_router(activity_router)
api_router.include_router(notification_router)
api_router.include_router(public_services_router)
api_router.include_router(admin_router)
api_router.include_router(complaints_router)
