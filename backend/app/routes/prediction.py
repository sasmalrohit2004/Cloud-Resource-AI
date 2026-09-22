from fastapi import APIRouter, HTTPException
from typing import Dict, Any
from app.schemas.prediction import PredictionRequest, PredictionResponse, ModelPerformanceResponse
from app.services.prediction_service import prediction_service
from app.services.simulation_service import simulation_service

router = APIRouter(tags=["Prediction"])

@router.post("/predict", response_model=PredictionResponse)
def make_prediction(req: PredictionRequest):
    try:
        result = prediction_service.predict(
            cpu=req.cpu,
            ram=req.ram,
            disk=req.disk,
            network=req.network,
            active_users=req.active_users,
            request_rate=req.request_rate,
            hour=req.hour,
            day_of_week=req.day_of_week
        )
        return result
    except RuntimeError as re:
        raise HTTPException(status_code=503, detail=str(re))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Prediction error: {str(e)}")

@router.get("/model/performance", response_model=Dict[str, Any])
def get_performance():
    metrics = prediction_service.get_model_performance()
    if "error" in metrics:
        raise HTTPException(status_code=404, detail=metrics["error"])
    return metrics

@router.get("/simulation/presets", response_model=Dict[str, Any])
def get_presets():
    return simulation_service.get_presets()
