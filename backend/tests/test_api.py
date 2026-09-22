import sys
from pathlib import Path
import pytest
from fastapi.testclient import TestClient

BACKEND_DIR = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(BACKEND_DIR))

from app.main import app
from app.services.recommendation_service import recommendation_engine

client = TestClient(app)

def test_health_endpoint():
    res = client.get("/api/health")
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "ok"
    assert "models_ready" in data

def test_recommendation_rules():
    # 1. Critical: CPU >= 90% or RAM >= 90%
    rec1 = recommendation_engine.evaluate(92.0, 50.0)
    assert rec1["status"] == "CRITICAL"
    assert "Critical resource usage expected" in rec1["recommendation"]

    # 2. High Usage: CPU >= 80% or RAM >= 80%
    rec2 = recommendation_engine.evaluate(82.0, 60.0)
    assert rec2["status"] == "HIGH_USAGE_EXPECTED"
    assert "High resource usage expected" in rec2["recommendation"]

    # 3. Low Utilization: CPU < 30% and RAM < 30%
    rec3 = recommendation_engine.evaluate(22.0, 25.0)
    assert rec3["status"] == "LOW_UTILIZATION"
    assert "underutilized" in rec3["recommendation"]

    # 4. Normal
    rec4 = recommendation_engine.evaluate(55.0, 60.0)
    assert rec4["status"] == "NORMAL"
    assert "normal range" in rec4["recommendation"]

def test_prediction_endpoint():
    payload = {
        "cpu": 65.0,
        "ram": 58.0,
        "disk": 42.0,
        "network": 55.0,
        "active_users": 500,
        "request_rate": 120.0,
        "hour": 14,
        "day_of_week": 2
    }
    res = client.post("/api/predict", json=payload)
    assert res.status_code == 200
    data = res.json()
    assert "predicted_cpu" in data
    assert "predicted_ram" in data
    assert "anomaly" in data
    assert "status" in data
    assert "recommendation" in data
    assert data["prediction_horizon"] == "15 minutes ahead (~3 observations)"

def test_prediction_input_validation():
    # CPU > 100 should fail validation
    payload = {
        "cpu": 150.0,
        "ram": 58.0,
        "disk": 42.0,
        "network": 55.0,
        "active_users": 500,
        "request_rate": 120.0
    }
    res = client.post("/api/predict", json=payload)
    assert res.status_code == 422

def test_dashboard_summary():
    res = client.get("/api/dashboard/summary")
    assert res.status_code == 200
    data = res.json()
    assert "current_cpu" in data
    assert "predicted_cpu" in data
    assert "recommendation" in data

def test_model_performance():
    res = client.get("/api/model/performance")
    assert res.status_code == 200
    data = res.json()
    assert "cpu_model" in data
    assert "ram_model" in data
    assert "mae" in data["cpu_model"]
    assert "r2" in data["cpu_model"]
