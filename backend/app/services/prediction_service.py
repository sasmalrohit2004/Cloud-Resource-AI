"""
Core Machine Learning Prediction Service.
Integrates:
- Pre-trained RandomForestRegressor for CPU (~15m horizon)
- Pre-trained RandomForestRegressor for RAM (~15m horizon)
- IsolationForest for Anomaly detection
- Recommendation Engine for optimization advice
- Database persistence for predictions and alerts
"""

from pathlib import Path
import json
import logging
from datetime import datetime
from typing import Dict, Any, Optional
import pandas as pd
import numpy as np
import joblib

from app.database.mongodb import db_manager
from app.services.recommendation_service import recommendation_engine
from app.services.anomaly_service import anomaly_service

logger = logging.getLogger("cloud_resource_ai.prediction")

SCRIPT_DIR = Path(__file__).resolve().parent
BACKEND_DIR = SCRIPT_DIR.parent.parent
PROJECT_ROOT = BACKEND_DIR.parent
MODELS_DIR = PROJECT_ROOT / "ml" / "models"

CPU_MODEL_PATH = MODELS_DIR / "cpu_model.joblib"
RAM_MODEL_PATH = MODELS_DIR / "ram_model.joblib"
CONFIG_PATH = MODELS_DIR / "feature_config.json"
METRICS_PATH = MODELS_DIR / "metrics.json"

class PredictionService:
    def __init__(self):
        self.cpu_model = None
        self.ram_model = None
        self.config: Dict[str, Any] = {}
        self.features = []
        self.is_ready = False
        self.load_models()

    def load_models(self):
        try:
            if not (CPU_MODEL_PATH.exists() and RAM_MODEL_PATH.exists() and CONFIG_PATH.exists()):
                logger.warning("Models or config missing in ml/models/. Run training pipeline.")
                self.is_ready = False
                return False

            with open(CONFIG_PATH, "r") as f:
                self.config = json.load(f)
                self.features = self.config.get("features", [])

            self.cpu_model = joblib.load(CPU_MODEL_PATH)
            self.ram_model = joblib.load(RAM_MODEL_PATH)
            self.is_ready = True
            logger.info("Loaded CPU & RAM models successfully.")
            return True
        except Exception as e:
            logger.error(f"Error loading models: {e}")
            self.is_ready = False
            return False

    def get_model_performance(self) -> Dict[str, Any]:
        if METRICS_PATH.exists():
            try:
                with open(METRICS_PATH, "r") as f:
                    return json.load(f)
            except Exception as e:
                logger.error(f"Error reading metrics.json: {e}")
        
        # If metrics file has not been created yet
        return {
            "error": "Metrics not found. Run python ml/src/evaluate.py to compute metrics from the test set."
        }

    def predict(
        self,
        cpu: float,
        ram: float,
        disk: float,
        network: float,
        active_users: int,
        request_rate: float,
        hour: Optional[int] = None,
        day_of_week: Optional[int] = None
    ) -> Dict[str, Any]:
        if not self.is_ready:
            # Try reloading once in case models were trained while server was running
            loaded = self.load_models()
            if not loaded:
                raise RuntimeError("ML models are not available. Run the training pipeline first: python ml/src/train.py")

        now = datetime.now()
        if hour is None:
            hour = now.hour
        if day_of_week is None:
            day_of_week = now.weekday()

        # Fetch latest historical record from DB to construct authentic lag/rolling features
        latest_history = db_manager.get_metric_history(limit=3)

        # If telemetry aligns closely with DB history, use historical lags;
        # otherwise, treat as an active simulated workload regime where current sliders set the operating baseline.
        if latest_history and len(latest_history) > 0 and abs(latest_history[-1].get("cpu_usage", cpu) - cpu) < 15.0:
            last = latest_history[-1]
            prev_cpu = last.get("cpu_usage", cpu)
            prev_ram = last.get("ram_usage", ram)
            prev_disk = last.get("disk_usage", disk)
            prev_network = last.get("network_usage", network)
            prev_req = last.get("request_rate", request_rate)
            prev_users = last.get("active_users", active_users)

            # Rolling window over last historical + current
            all_cpu = [h.get("cpu_usage", cpu) for h in latest_history] + [cpu]
            all_ram = [h.get("ram_usage", ram) for h in latest_history] + [ram]
            all_req = [h.get("request_rate", request_rate) for h in latest_history] + [request_rate]
            
            roll_cpu = float(np.mean(all_cpu[-3:]))
            roll_ram = float(np.mean(all_ram[-3:]))
            roll_req = float(np.mean(all_req[-3:]))
        else:
            prev_cpu = float(cpu)
            prev_ram = float(ram)
            prev_disk = float(disk)
            prev_network = float(network)
            prev_req = float(request_rate)
            prev_users = int(active_users)
            roll_cpu = float(cpu)
            roll_ram = float(ram)
            roll_req = float(request_rate)

        # Build precise feature row using EXACT feature order from feature_config.json
        feature_map = {
            "cpu_usage": float(cpu),
            "ram_usage": float(ram),
            "disk_usage": float(disk),
            "network_usage": float(network),
            "active_users": int(active_users),
            "request_rate": float(request_rate),
            "hour": int(hour),
            "day_of_week": int(day_of_week),
            "previous_cpu": float(prev_cpu),
            "previous_ram": float(prev_ram),
            "previous_disk": float(prev_disk),
            "previous_network": float(prev_network),
            "previous_request_rate": float(prev_req),
            "previous_active_users": int(prev_users),
            "rolling_cpu_mean": float(roll_cpu),
            "rolling_ram_mean": float(roll_ram),
            "rolling_request_rate": float(roll_req),
        }

        # Vector in exact order
        X_vec = [[feature_map[f] for f in self.features]]
        df_input = pd.DataFrame(X_vec, columns=self.features)

        # 1. Predict Future CPU & RAM with trained models
        raw_pred_cpu = float(self.cpu_model.predict(df_input)[0])
        raw_pred_ram = float(self.ram_model.predict(df_input)[0])

        pred_cpu = float(np.clip(round(raw_pred_cpu, 1), 0.0, 100.0))
        pred_ram = float(np.clip(round(raw_pred_ram, 1), 0.0, 100.0))

        # 2. Run Anomaly Detection
        telemetry_dict = {
            "cpu_usage": cpu,
            "ram_usage": ram,
            "disk_usage": disk,
            "network_usage": network,
            "request_rate": request_rate
        }
        anomaly_result = anomaly_service.detect(telemetry_dict)

        # 3. Run Recommendation Engine
        rec = recommendation_engine.evaluate(pred_cpu, pred_ram, current_cpu=cpu, current_ram=ram)

        iso_ts = now.strftime("%Y-%m-%d %H:%M:%S")

        response_data = {
            "timestamp": iso_ts,
            "current_metrics": {
                "cpu": round(cpu, 1),
                "ram": round(ram, 1),
                "disk": round(disk, 1),
                "network": round(network, 1),
                "active_users": active_users,
                "request_rate": round(request_rate, 1)
            },
            "predicted_cpu": pred_cpu,
            "predicted_ram": pred_ram,
            "prediction_horizon": "15 minutes ahead (~3 observations)",
            "status": rec["status"],
            "recommendation": rec["recommendation"],
            "severity": rec["severity"],
            "anomaly": anomaly_result
        }

        # Persist prediction to database
        db_manager.insert_prediction({
            "timestamp": iso_ts,
            "predicted_cpu": pred_cpu,
            "predicted_ram": pred_ram,
            "status": rec["status"],
            "recommendation": rec["recommendation"],
            "is_anomaly": anomaly_result["is_anomaly"],
            "current_cpu": cpu,
            "current_ram": ram
        })

        # Generate alert in database if anomaly detected or critical status
        if anomaly_result["is_anomaly"]:
            db_manager.insert_alert({
                "timestamp": iso_ts,
                "type": "ANOMALY",
                "severity": anomaly_result["severity"],
                "message": anomaly_result["message"],
                "metric": anomaly_result.get("affected_metric"),
                "value": cpu if anomaly_result.get("affected_metric") == "CPU" else ram
            })
        elif rec["status"] == "CRITICAL":
            db_manager.insert_alert({
                "timestamp": iso_ts,
                "type": "CRITICAL_CAPACITY",
                "severity": "CRITICAL",
                "message": f"Critical load threshold exceeded: Predicted CPU {pred_cpu}%, RAM {pred_ram}%",
                "metric": "Capacity",
                "value": max(pred_cpu, pred_ram)
            })
        elif rec["status"] == "HIGH_USAGE_EXPECTED":
            db_manager.insert_alert({
                "timestamp": iso_ts,
                "type": "HIGH_USAGE",
                "severity": "HIGH",
                "message": f"High load threshold expected in 15m: CPU {pred_cpu}%, RAM {pred_ram}%",
                "metric": "Resource",
                "value": max(pred_cpu, pred_ram)
            })

        return response_data

prediction_service = PredictionService()
