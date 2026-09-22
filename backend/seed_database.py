#!/usr/bin/env python3
"""
Database Seeder for Cloud Resource AI.
Populates MongoDB with realistic historical telemetry metrics from the generated dataset.
Ensures that upon startup, historical charts (CPU, RAM, Network, Request Rate) and
Alerts are populated for college demonstrations.
"""

from pathlib import Path
import sys
import pandas as pd
from datetime import datetime

# Adjust Python path to import app modules
BACKEND_DIR = Path(__file__).resolve().parent
sys.path.insert(0, str(BACKEND_DIR))

from app.database.mongodb import db_manager, DB_NAME
from app.services.prediction_service import prediction_service

PROJECT_ROOT = BACKEND_DIR.parent
DATA_FILE = PROJECT_ROOT / "ml" / "data" / "processed" / "resource_usage_processed.csv"
RAW_FILE = PROJECT_ROOT / "ml" / "data" / "raw" / "synthetic_resource_usage.csv"

def seed_database(limit_records: int = 288):
    target_file = DATA_FILE if DATA_FILE.exists() else RAW_FILE
    if not target_file.exists():
        print(f"Dataset file not found at {target_file}. Run generate_dataset.py first.")
        return False

    print(f"Loading telemetry data from {target_file}...")
    df = pd.read_csv(target_file)
    
    # Take the last 288 records (representing 24 hours of 5-minute intervals)
    sample_df = df.tail(limit_records).copy()
    print(f"Seeding {len(sample_df)} historical metric records into {DB_NAME}...")

    inserted_count = 0
    for _, row in sample_df.iterrows():
        metric = {
            "timestamp": str(row["timestamp"]),
            "cpu_usage": float(row["cpu_usage"]),
            "ram_usage": float(row["ram_usage"]),
            "disk_usage": float(row["disk_usage"]),
            "network_usage": float(row["network_usage"]),
            "active_users": int(row["active_users"]),
            "request_rate": float(row["request_rate"])
        }
        db_manager.insert_metric(metric)
        inserted_count += 1

    # Insert initial representative demo alerts
    sample_alerts = [
        {
            "timestamp": sample_df.iloc[-40]["timestamp"],
            "type": "HIGH_USAGE",
            "severity": "HIGH",
            "message": "High resource utilization anticipated in 15-minute horizon",
            "metric": "CPU",
            "value": 81.4
        },
        {
            "timestamp": sample_df.iloc[-18]["timestamp"],
            "type": "ANOMALY",
            "severity": "HIGH",
            "message": "Unusual resource-usage pattern detected on CPU (Score: -0.128)",
            "metric": "CPU",
            "value": 89.2
        },
        {
            "timestamp": sample_df.iloc[-5]["timestamp"],
            "type": "ANOMALY",
            "severity": "MEDIUM",
            "message": "Unusual request/compute divergence detected",
            "metric": "Request Rate",
            "value": 1420.0
        }
    ]

    for alert in sample_alerts:
        db_manager.insert_alert(alert)

    # Trigger one baseline prediction on latest record
    latest_row = sample_df.iloc[-1]
    try:
        prediction_service.predict(
            cpu=float(latest_row["cpu_usage"]),
            ram=float(latest_row["ram_usage"]),
            disk=float(latest_row["disk_usage"]),
            network=float(latest_row["network_usage"]),
            active_users=int(latest_row["active_users"]),
            request_rate=float(latest_row["request_rate"])
        )
    except Exception as e:
        print(f"Initial prediction trigger notice: {e}")

    print(f"Successfully seeded {inserted_count} metrics and {len(sample_alerts)} demo alerts.")
    return True

if __name__ == "__main__":
    seed_database()
