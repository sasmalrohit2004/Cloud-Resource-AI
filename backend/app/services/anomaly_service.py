"""
Anomaly Detection Service using trained IsolationForest.
Detects unusual resource utilization patterns.
Crucial distinction: An anomaly indicates unusual behavior, NOT a cyberattack.
"""

from pathlib import Path
import json
import logging
import pandas as pd
import numpy as np
import joblib

logger = logging.getLogger("cloud_resource_ai.anomaly")

SCRIPT_DIR = Path(__file__).resolve().parent
BACKEND_DIR = SCRIPT_DIR.parent.parent
PROJECT_ROOT = BACKEND_DIR.parent
MODELS_DIR = PROJECT_ROOT / "ml" / "models"
MODEL_PATH = MODELS_DIR / "anomaly_model.joblib"
CONFIG_PATH = MODELS_DIR / "feature_config.json"

class AnomalyService:
    def __init__(self):
        self.model = None
        self.features = ["cpu_usage", "ram_usage", "disk_usage", "network_usage", "request_rate"]
        self.is_loaded = False
        self.load_model()

    def load_model(self):
        try:
            if MODEL_PATH.exists():
                self.model = joblib.load(MODEL_PATH)
                if CONFIG_PATH.exists():
                    with open(CONFIG_PATH, "r") as f:
                        cfg = json.load(f)
                        self.features = cfg.get("anomaly_features", self.features)
                self.is_loaded = True
                logger.info(f"Anomaly model loaded successfully from {MODEL_PATH}")
            else:
                logger.warning(f"Anomaly model not found at {MODEL_PATH}")
        except Exception as e:
            logger.error(f"Failed to load anomaly model: {e}")
            self.is_loaded = False

    def detect(self, telemetry: dict) -> dict:
        if not self.is_loaded or self.model is None:
            # Fallback heuristic if model file is missing
            return {
                "status": "NORMAL",
                "is_anomaly": False,
                "score": 0.0,
                "message": "Anomaly model not loaded",
                "affected_metric": None,
                "severity": "NORMAL"
            }

        feature_values = [telemetry.get(f, 0.0) for f in self.features]
        df = pd.DataFrame([feature_values], columns=self.features)

        # IsolationForest decision_function: negative is outlier
        pred = self.model.predict(df)[0]
        score = float(self.model.decision_function(df)[0])
        # Significant statistical deviation threshold
        is_anomaly = bool(pred == -1 and score < -0.04)

        # Determine dominant anomaly driver if anomalous
        affected_metric = None
        severity = "NORMAL"
        message = "Resource utilization matches expected behavioral baseline"

        if is_anomaly:
            # Check individual metrics against unusual thresholds
            if telemetry.get("cpu_usage", 0) > 85.0:
                affected_metric = "CPU"
            elif telemetry.get("ram_usage", 0) > 85.0:
                affected_metric = "RAM"
            elif telemetry.get("network_usage", 0) > 85.0:
                affected_metric = "Network"
            elif telemetry.get("disk_usage", 0) > 90.0:
                affected_metric = "Disk"
            else:
                affected_metric = "Request / Compute Divergence"

            severity = "HIGH" if score < -0.1 else "MEDIUM"
            message = f"Unusual resource-usage pattern detected on {affected_metric} (Anomaly Score: {score:.3f})"

        return {
            "status": "ANOMALY DETECTED" if is_anomaly else "NORMAL",
            "is_anomaly": is_anomaly,
            "score": round(score, 4),
            "message": message,
            "affected_metric": affected_metric,
            "severity": severity
        }

anomaly_service = AnomalyService()
