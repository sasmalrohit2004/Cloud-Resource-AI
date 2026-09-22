from fastapi import APIRouter
from datetime import datetime
from app.schemas.prediction import DashboardSummaryResponse
from app.database.mongodb import db_manager
from app.services.prediction_service import prediction_service

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])

@router.get("/summary", response_model=DashboardSummaryResponse)
def get_dashboard_summary():
    # 1. Fetch current metrics
    latest_metric = db_manager.get_latest_metric()
    if not latest_metric:
        latest_metric = {
            "timestamp": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
            "cpu_usage": 44.5,
            "ram_usage": 58.2,
            "disk_usage": 42.0,
            "network_usage": 39.1,
            "active_users": 850,
            "request_rate": 1020.0
        }

    # 2. Fetch latest prediction or compute on current metrics
    latest_pred = db_manager.get_latest_prediction()
    if not latest_pred:
        try:
            pred_res = prediction_service.predict(
                cpu=latest_metric["cpu_usage"],
                ram=latest_metric["ram_usage"],
                disk=latest_metric["disk_usage"],
                network=latest_metric["network_usage"],
                active_users=latest_metric["active_users"],
                request_rate=latest_metric["request_rate"]
            )
            predicted_cpu = pred_res["predicted_cpu"]
            predicted_ram = pred_res["predicted_ram"]
            status = pred_res["status"]
            recommendation = pred_res["recommendation"]
            severity = pred_res["severity"]
            anomaly_status = pred_res["anomaly"]["status"]
            is_anomaly = pred_res["anomaly"]["is_anomaly"]
        except Exception:
            predicted_cpu = latest_metric["cpu_usage"]
            predicted_ram = latest_metric["ram_usage"]
            status = "NORMAL"
            recommendation = "Resource utilization is within a normal range. Maintain current capacity."
            severity = "NORMAL"
            anomaly_status = "NORMAL"
            is_anomaly = False
    else:
        predicted_cpu = latest_pred.get("predicted_cpu", latest_metric["cpu_usage"])
        predicted_ram = latest_pred.get("predicted_ram", latest_metric["ram_usage"])
        status = latest_pred.get("status", "NORMAL")
        recommendation = latest_pred.get("recommendation", "Maintain current capacity.")
        is_anomaly = latest_pred.get("is_anomaly", False)
        anomaly_status = "ANOMALY DETECTED" if is_anomaly else "NORMAL"
        severity = "CRITICAL" if status == "CRITICAL" else ("HIGH" if status == "HIGH_USAGE_EXPECTED" else ("LOW" if status == "LOW_UTILIZATION" else "NORMAL"))

    # 3. Recent alerts
    recent_alerts = db_manager.get_recent_alerts(limit=10)

    return {
        "current_cpu": round(latest_metric["cpu_usage"], 1),
        "current_ram": round(latest_metric["ram_usage"], 1),
        "disk": round(latest_metric["disk_usage"], 1),
        "network": round(latest_metric["network_usage"], 1),
        "active_users": int(latest_metric["active_users"]),
        "request_rate": round(latest_metric["request_rate"], 1),
        "predicted_cpu": round(predicted_cpu, 1),
        "predicted_ram": round(predicted_ram, 1),
        "prediction_horizon": "Next 15 minutes",
        "status": status,
        "recommendation": recommendation,
        "severity": severity,
        "anomaly_status": anomaly_status,
        "is_anomaly": is_anomaly,
        "recent_alerts": recent_alerts,
        "last_updated": latest_metric.get("timestamp", datetime.now().strftime("%Y-%m-%d %H:%M:%S"))
    }
