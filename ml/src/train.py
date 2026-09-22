#!/usr/bin/env python3
"""
Train Machine Learning Models:
1. CPU Utilization Predictor: RandomForestRegressor -> target_cpu (~15 mins ahead)
2. RAM Utilization Predictor: RandomForestRegressor -> target_ram (~15 mins ahead)
3. Anomaly Detector: IsolationForest -> NORMAL / ANOMALY

Strict Rules:
- Chronological 80/20 train/test split (No random shuffling).
- Standardized feature schemas persisted in feature_config.json.
- Model persistence via joblib.
"""

from pathlib import Path
import json
import pandas as pd
import numpy as np
from sklearn.ensemble import RandomForestRegressor, IsolationForest
import joblib

SCRIPT_DIR = Path(__file__).resolve().parent
ML_DIR = SCRIPT_DIR.parent
DATA_FILE = ML_DIR / "data" / "processed" / "resource_usage_processed.csv"
MODELS_DIR = ML_DIR / "models"

# Exact ordered feature list used consistently for training and inference
FEATURES = [
    "cpu_usage",
    "ram_usage",
    "disk_usage",
    "network_usage",
    "active_users",
    "request_rate",
    "hour",
    "day_of_week",
    "previous_cpu",
    "previous_ram",
    "previous_disk",
    "previous_network",
    "previous_request_rate",
    "previous_active_users",
    "rolling_cpu_mean",
    "rolling_ram_mean",
    "rolling_request_rate"
]

ANOMALY_FEATURES = [
    "cpu_usage",
    "ram_usage",
    "disk_usage",
    "network_usage",
    "request_rate"
]

def train_models():
    if not DATA_FILE.exists():
        raise FileNotFoundError(f"Processed dataset not found at {DATA_FILE}. Run preprocess.py first.")

    MODELS_DIR.mkdir(parents=True, exist_ok=True)

    print(f"Loading processed data from {DATA_FILE}...")
    df = pd.read_csv(DATA_FILE)
    print(f"Total dataset records: {len(df):,}")

    # Chronological Split: 80% Train, 20% Test
    split_idx = int(len(df) * 0.8)
    train_df = df.iloc[:split_idx].copy()
    test_df = df.iloc[split_idx:].copy()

    print(f"Training split: {len(train_df):,} records (chronological past)")
    print(f"Testing split:  {len(test_df):,} records (chronological future)")

    X_train = train_df[FEATURES]
    y_train_cpu = train_df["target_cpu"]
    y_train_ram = train_df["target_ram"]

    # 1. Train CPU Random Forest Regressor
    print("\n[1/3] Training CPU RandomForestRegressor...")
    cpu_model = RandomForestRegressor(
        n_estimators=100,
        max_depth=14,
        min_samples_split=4,
        min_samples_leaf=2,
        random_state=42,
        n_jobs=-1
    )
    cpu_model.fit(X_train, y_train_cpu)
    cpu_model_path = MODELS_DIR / "cpu_model.joblib"
    joblib.dump(cpu_model, cpu_model_path)
    print(f"Saved CPU model to: {cpu_model_path}")

    # 2. Train RAM Random Forest Regressor
    print("\n[2/3] Training RAM RandomForestRegressor...")
    ram_model = RandomForestRegressor(
        n_estimators=100,
        max_depth=14,
        min_samples_split=4,
        min_samples_leaf=2,
        random_state=42,
        n_jobs=-1
    )
    ram_model.fit(X_train, y_train_ram)
    ram_model_path = MODELS_DIR / "ram_model.joblib"
    joblib.dump(ram_model, ram_model_path)
    print(f"Saved RAM model to: {ram_model_path}")

    # 3. Train Isolation Forest for Anomaly Detection
    # Using resource and traffic utilization vectors
    print("\n[3/3] Training IsolationForest Anomaly Detector...")
    X_anomaly_train = train_df[ANOMALY_FEATURES]
    anomaly_model = IsolationForest(
        n_estimators=100,
        contamination=0.035, # ~3.5% expected anomaly rate
        max_samples="auto",
        random_state=42,
        n_jobs=-1
    )
    anomaly_model.fit(X_anomaly_train)
    anomaly_model_path = MODELS_DIR / "anomaly_model.joblib"
    joblib.dump(anomaly_model, anomaly_model_path)
    print(f"Saved Anomaly model to: {anomaly_model_path}")

    # 4. Save Feature Configuration JSON to guarantee consistency between train and inference
    config = {
        "features": FEATURES,
        "anomaly_features": ANOMALY_FEATURES,
        "target_cpu": "target_cpu",
        "target_ram": "target_ram",
        "prediction_horizon_steps": 3,
        "prediction_horizon_minutes": 15,
        "sample_interval_minutes": 5,
        "train_samples": len(train_df),
        "test_samples": len(test_df),
        "cpu_model_type": "RandomForestRegressor",
        "ram_model_type": "RandomForestRegressor",
        "anomaly_model_type": "IsolationForest"
    }

    config_path = MODELS_DIR / "feature_config.json"
    with open(config_path, "w") as f:
        json.dump(config, f, indent=2)
    print(f"Saved feature configuration to: {config_path}")

    print("\n" + "="*50)
    print("ALL MODELS TRAINED AND SAVED SUCCESSFULLY")
    print("="*50)

if __name__ == "__main__":
    train_models()
