#!/usr/bin/env python3
"""
Evaluate Trained ML Models on the Chronological Test Set (Last 20%).
Metrics calculated from real test observations:
- Mean Absolute Error (MAE)
- Root Mean Squared Error (RMSE)
- Coefficient of Determination (R²)
- Anomaly rate summary

Persists results to ml/models/metrics.json for FastAPI backend consumption.
"""

from pathlib import Path
import json
import pandas as pd
import numpy as np
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score
import joblib

SCRIPT_DIR = Path(__file__).resolve().parent
ML_DIR = SCRIPT_DIR.parent
DATA_FILE = ML_DIR / "data" / "processed" / "resource_usage_processed.csv"
MODELS_DIR = ML_DIR / "models"
METRICS_FILE = MODELS_DIR / "metrics.json"
CONFIG_FILE = MODELS_DIR / "feature_config.json"

def evaluate_models():
    if not DATA_FILE.exists():
        raise FileNotFoundError(f"Processed dataset not found at {DATA_FILE}")

    cpu_model_path = MODELS_DIR / "cpu_model.joblib"
    ram_model_path = MODELS_DIR / "ram_model.joblib"
    anomaly_model_path = MODELS_DIR / "anomaly_model.joblib"

    if not (cpu_model_path.exists() and ram_model_path.exists() and anomaly_model_path.exists()):
        raise FileNotFoundError("One or more trained model files missing. Run train.py first.")

    with open(CONFIG_FILE, "r") as f:
        config = json.load(f)

    features = config["features"]
    anomaly_features = config["anomaly_features"]

    print("Loading models and test data...")
    cpu_model = joblib.load(cpu_model_path)
    ram_model = joblib.load(ram_model_path)
    anomaly_model = joblib.load(anomaly_model_path)

    df = pd.read_csv(DATA_FILE)
    split_idx = int(len(df) * 0.8)
    test_df = df.iloc[split_idx:].copy().reset_index(drop=True)

    X_test = test_df[features]
    y_true_cpu = test_df["target_cpu"].values
    y_true_ram = test_df["target_ram"].values

    # Predictions on test partition
    print(f"Running test set inference on {len(test_df):,} chronological test records...")
    y_pred_cpu = cpu_model.predict(X_test)
    y_pred_ram = ram_model.predict(X_test)

    # CPU Metrics
    cpu_mae = float(mean_absolute_error(y_true_cpu, y_pred_cpu))
    cpu_rmse = float(np.sqrt(mean_squared_error(y_true_cpu, y_pred_cpu)))
    cpu_r2 = float(r2_score(y_true_cpu, y_pred_cpu))

    # RAM Metrics
    ram_mae = float(mean_absolute_error(y_true_ram, y_pred_ram))
    ram_rmse = float(np.sqrt(mean_squared_error(y_true_ram, y_pred_ram)))
    ram_r2 = float(r2_score(y_true_ram, y_pred_ram))

    # Anomaly Detection Evaluation
    X_anomaly_test = test_df[anomaly_features]
    anomaly_preds = anomaly_model.predict(X_anomaly_test)
    anomaly_count = int(np.sum(anomaly_preds == -1))
    normal_count = int(np.sum(anomaly_preds == 1))
    anomaly_pct = float(round((anomaly_count / len(test_df)) * 100, 2))

    metrics_data = {
        "evaluation_timestamp": pd.Timestamp.now().isoformat(),
        "test_dataset_size": len(test_df),
        "prediction_horizon": "15 minutes (~3 intervals of 5 min)",
        "cpu_model": {
            "model_type": "RandomForestRegressor",
            "target": "target_cpu",
            "mae": round(cpu_mae, 3),
            "rmse": round(cpu_rmse, 3),
            "r2": round(cpu_r2, 4)
        },
        "ram_model": {
            "model_type": "RandomForestRegressor",
            "target": "target_ram",
            "mae": round(ram_mae, 3),
            "rmse": round(ram_rmse, 3),
            "r2": round(ram_r2, 4)
        },
        "anomaly_model": {
            "model_type": "IsolationForest",
            "test_anomalies_detected": anomaly_count,
            "test_normal_records": normal_count,
            "anomaly_percentage": anomaly_pct
        }
    }

    with open(METRICS_FILE, "w") as f:
        json.dump(metrics_data, f, indent=2)

    print("\n" + "="*50)
    print("MODEL EVALUATION RESULTS (CALCULATED FROM TEST DATA)")
    print("="*50)
    print(f"Test Records: {len(test_df):,}")
    print("\n--- CPU Utilization Model (Random Forest) ---")
    print(f"  MAE:  {cpu_mae:.3f}%")
    print(f"  RMSE: {cpu_rmse:.3f}%")
    print(f"  R²:   {cpu_r2:.4f}")
    print("\n--- RAM Utilization Model (Random Forest) ---")
    print(f"  MAE:  {ram_mae:.3f}%")
    print(f"  RMSE: {ram_rmse:.3f}%")
    print(f"  R²:   {ram_r2:.4f}")
    print("\n--- Anomaly Detector (Isolation Forest) ---")
    print(f"  Anomalies in test set: {anomaly_count} / {len(test_df)} ({anomaly_pct}%)")
    print(f"Saved evaluation metrics to: {METRICS_FILE}")
    print("="*50)

    return metrics_data

if __name__ == "__main__":
    evaluate_models()
