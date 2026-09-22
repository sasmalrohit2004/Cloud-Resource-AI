from fastapi import APIRouter
from app.database.mongodb import db_manager
from app.services.prediction_service import prediction_service

router = APIRouter(tags=["Health"])

@router.get("/health")
def get_health():
    return {
        "status": "ok",
        "service": "Cloud Resource AI Decision Support API",
        "database": db_manager.get_status(),
        "models_ready": prediction_service.is_ready
    }
