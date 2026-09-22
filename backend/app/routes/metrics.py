from fastapi import APIRouter, Query, HTTPException
from typing import Optional
from app.schemas.metrics import MetricRecord, MetricHistoryResponse
from app.database.mongodb import db_manager

router = APIRouter(prefix="/metrics", tags=["Metrics"])

@router.get("/current", response_model=MetricRecord)
def get_current_metrics():
    latest = db_manager.get_latest_metric()
    if not latest:
        # Fallback initial observation
        return {
            "timestamp": "2026-03-20 14:30:00",
            "cpu_usage": 42.5,
            "ram_usage": 56.2,
            "disk_usage": 44.0,
            "network_usage": 38.5,
            "active_users": 840,
            "request_rate": 1050.0
        }
    return latest

@router.get("/history", response_model=MetricHistoryResponse)
def get_metric_history(hours: int = Query(default=24, ge=1, le=168)):
    # 5-minute intervals -> 12 points per hour
    points_needed = hours * 12
    records = db_manager.get_metric_history(limit=points_needed)
    
    # If DB has fewer records, return whatever exists
    return {
        "items": records,
        "count": len(records),
        "hours": hours
    }

@router.post("", response_model=dict)
def ingest_metric(metric: MetricRecord):
    data = metric.model_dump()
    db_manager.insert_metric(data)
    return {"status": "success", "message": "Metric recorded successfully"}
