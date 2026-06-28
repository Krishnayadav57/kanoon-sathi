from fastapi import APIRouter

from app.api.v1 import (
    admin,
    auth,
    chat,
    compliance,
    complaints,
    dashboard,
    documents,
    knowledge_base,
    lawyers,
    learning,
    offices,
    payments,
    scam_detection,
    situation_analyzer,
)

api_router = APIRouter()
api_router.include_router(auth.router)
api_router.include_router(chat.router)
api_router.include_router(knowledge_base.router)
api_router.include_router(situation_analyzer.router)
api_router.include_router(complaints.router)
api_router.include_router(scam_detection.router)
api_router.include_router(dashboard.router)
api_router.include_router(payments.router)
api_router.include_router(documents.router)
api_router.include_router(learning.router)
api_router.include_router(offices.router)
api_router.include_router(lawyers.router)
api_router.include_router(compliance.router)
api_router.include_router(admin.router)
