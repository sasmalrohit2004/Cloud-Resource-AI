from fastapi import APIRouter, Query, Body
from typing import List, Optional
from app.schemas.prediction import AlertRecord, ResolveAlertRequest
from app.database.mongodb import db_manager

router = APIRouter(prefix="/alerts", tags=["Alerts"])

@router.get("", response_model=List[AlertRecord])
def get_recent_alerts(limit: int = Query(default=50, ge=1, le=200)):
    alerts = db_manager.get_recent_alerts(limit=limit)
    return alerts

@router.post("", response_model=AlertRecord)
def create_alert(alert: AlertRecord):
    db_manager.insert_alert(alert.model_dump())
    return alert

@router.post("/resolve")
def resolve_alert(request: ResolveAlertRequest):
    count = db_manager.resolve_alert(
        timestamp=request.timestamp,
        alert_type=request.type,
        status=request.status,
        resolved_by=request.resolved_by or "Site Reliability Engineer"
    )
    return {
        "status": "success",
        "resolved_count": count,
        "message": f"Alert {request.status.lower()} successfully"
    }

@router.post("/resolve-all")
def resolve_all_alerts(resolved_by: str = Body(default="Site Reliability Engineer", embed=True)):
    count = db_manager.resolve_all_alerts(resolved_by=resolved_by)
    return {
        "status": "success",
        "resolved_count": count,
        "message": f"Successfully resolved {count} active alerts"
    }

@router.delete("")
def clear_alerts():
    db_manager.clear_alerts()
    return {"status": "cleared", "message": "All alerts successfully cleared"}

