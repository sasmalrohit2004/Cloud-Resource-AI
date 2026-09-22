#!/usr/bin/env python3
"""
CLI/Module utility for running inference against saved ML models.
Can be run directly from terminal or imported:
python ml/src/predict.py --cpu 75 --ram 68 --disk 50 --network 60 --users 1200 --requests 350
"""

import sys
import json
import argparse
from pathlib import Path
import numpy as np
import pandas as pd
import joblib

SCRIPT_DIR = Path(__file__).resolve().parent
ML_DIR = SCRIPT_DIR.parent
MODELS_DIR = ML_DIR / "models"
CONFIG_FILE = MODELS_DIR / "feature_config.json"

def run_standalone_prediction(
    cpu: float,
    ram: float,
    disk: float,
    network: float,
    active_users: int,
    request_rate: float,
    hour: int = 14,
    day_of_week: int = 2
):
    cpu_path = MODELS_DIR / "cpu_model.joblib"
    ram_path = MODELS_DIR / "ram_model.joblib"
    anomaly_path = MODELS_DIR / "anomaly_model.joblib"

    if not (cpu_path.exists() and ram_path.exists() and anomaly_path.exists() and CONFIG_FILE.exists()):
        raise FileNotFoundError(
            "Trained models or configuration not found. Please run generate_dataset.py, preprocess.py, and train.py first."
        )

    with open(CONFIG_FILE, "r") as f:
        config = json.load(f)

    features = config["features"]
    anomaly_features = config["anomaly_features"]

    cpu_model = joblib.load(cpu_path)
    ram_model = joblib.load(ram_path)
    anomaly_model = joblib.load(anomaly_path)

    # Construct input feature dictionary
    # Provide intelligent estimation for lag/rolling if not supplied (e.g. current ~ previous)
    raw_input = {
        "cpu_usage": cpu,
        "ram_usage": ram,
        "disk_usage": disk,
        "network_usage": network,
        "active_users": active_users,
        "request_rate": request_rate,
        "hour": hour,
        "day_of_week": day_of_week,
        "previous_cpu": cpu,
        "previous_ram": ram,
        "previous_disk": disk,
        "previous_network": network,
        "previous_request_rate": request_rate,
        "previous_active_users": active_users,
        "rolling_cpu_mean": cpu,
        "rolling_ram_mean": ram,
        "rolling_request_rate": request_rate
    }

    feature_df = pd.DataFrame([[raw_input[f] for f in features]], columns=features)
    anomaly_df = pd.DataFrame([[raw_input[f] for f in anomaly_features]], columns=anomaly_features)

    pred_cpu = float(np.clip(cpu_model.predict(feature_df)[0], 0.0, 100.0))
    pred_ram = float(np.clip(ram_model.predict(feature_df)[0], 0.0, 100.0))
    
    # Anomaly detector: 1 = Normal, -1 = Anomaly
    anomaly_raw = anomaly_model.predict(anomaly_df)[0]
    anomaly_score = float(anomaly_model.decision_function(anomaly_df)[0])
    is_anomaly = bool(anomaly_raw == -1)

    # Recommendation rule hierarchy
    if pred_cpu >= 90.0 or pred_ram >= 90.0:
        status = "CRITICAL"
        recommendation = "Critical resource usage expected. Increase capacity and investigate the workload."
        severity = "CRITICAL"
    elif pred_cpu >= 80.0 or pred_ram >= 80.0:
        status = "HIGH_USAGE_EXPECTED"
        recommendation = "High resource usage expected. Consider increasing available resources."
        severity = "HIGH"
    elif pred_cpu < 30.0 and pred_ram < 30.0:
        status = "LOW_UTILIZATION"
        recommendation = "Resources appear underutilized. Consider reducing allocated capacity."
        severity = "LOW"
    else:
        status = "NORMAL"
        recommendation = "Resource utilization is within a normal range. Maintain current capacity."
        severity = "NORMAL"

    result = {
        "current_metrics": {
            "cpu_usage": round(cpu, 2),
            "ram_usage": round(ram, 2),
            "disk_usage": round(disk, 2),
            "network_usage": round(network, 2),
            "active_users": active_users,
            "request_rate": request_rate
        },
        "predictions": {
            "predicted_cpu": round(pred_cpu, 2),
            "predicted_ram": round(pred_ram, 2),
            "prediction_horizon": "15 minutes ahead"
        },
        "anomaly": {
            "status": "ANOMALY" if is_anomaly else "NORMAL",
            "is_anomaly": is_anomaly,
            "score": round(anomaly_score, 4),
            "message": "Unusual resource consumption pattern detected" if is_anomaly else "Resource utilization follows expected profile"
        },
        "recommendation": {
            "status": status,
            "severity": severity,
            "action": recommendation
        }
    }
    return result

def main():
    parser = argparse.ArgumentParser(description="Cloud Resource AI Model Prediction")
    parser.add_argument("--cpu", type=float, default=65.0, help="Current CPU percentage")
    parser.add_argument("--ram", type=float, default=58.0, help="Current RAM percentage")
    parser.add_argument("--disk", type=float, default=42.0, help="Current Disk percentage")
    parser.add_argument("--network", type=float, default=55.0, help="Current Network percentage")
    parser.add_argument("--users", type=int, default=500, help="Active user count")
    parser.add_argument("--requests", type=float, default=120.0, help="Request rate (req/s)")
    parser.add_argument("--hour", type=int, default=14, help="Hour of day (0-23)")
    parser.add_argument("--day", type=int, default=2, help="Day of week (0=Mon, 6=Sun)")

    args = parser.parse_args()
    res = run_standalone_prediction(
        cpu=args.cpu,
        ram=args.ram,
        disk=args.disk,
        network=args.network,
        active_users=args.users,
        request_rate=args.requests,
        hour=args.hour,
        day_of_week=args.day
    )
    print(json.dumps(res, indent=2))

if __name__ == "__main__":
    main()
