#!/usr/bin/env python3
"""
Generate realistic synthetic cloud/server resource-usage dataset.
Features:
- At least 5,000 records at 5-minute intervals (~18-20 days).
- Diurnal (daily) and weekly patterns (morning ramp, afternoon peak, evening load, night trough).
- Strong physical correlations: active users -> request rate -> CPU & network -> RAM.
- Realistic noise, occasional traffic spikes, and resource anomalies.
- Robust relative path resolution using pathlib.
"""

import sys
from pathlib import Path
import numpy as np
import pandas as pd
from datetime import datetime, timedelta

# Determine paths relative to this script
SCRIPT_DIR = Path(__file__).resolve().parent
ML_DIR = SCRIPT_DIR.parent
PROJECT_ROOT = ML_DIR.parent
RAW_DATA_DIR = ML_DIR / "data" / "raw"
OUTPUT_FILE = RAW_DATA_DIR / "synthetic_resource_usage.csv"

def generate_synthetic_data(n_records: int = 5500, start_date: datetime = None, random_state: int = 42):
    np.random.seed(random_state)
    if start_date is None:
        # Fixed reference date for consistency
        start_date = datetime(2026, 3, 1, 0, 0, 0)

    timestamps = [start_date + timedelta(minutes=5 * i) for i in range(n_records)]
    
    records = []
    
    # Base states with some memory for realistic time-series continuity
    prev_ram = 45.0
    prev_disk = 40.0

    print(f"Generating {n_records} synthetic cloud telemetry records...")

    for i, ts in enumerate(timestamps):
        hour = ts.hour
        minute = ts.minute
        day_of_week = ts.weekday() # 0 = Monday, 6 = Sunday
        is_weekend = day_of_week >= 5

        # Diurnal pattern using smooth sinusoidal wave + hour specific weighting
        # Peak around 14:00 - 20:00, trough around 03:00 - 05:00
        time_fraction = (hour + minute / 60.0) / 24.0
        daily_cycle = 0.5 - 0.45 * np.cos(2 * np.pi * (time_fraction - 0.15))
        
        # Weekend load factor (~70% of weekday)
        weekend_factor = 0.70 if is_weekend else 1.0

        # Base active users (200 - 2500)
        base_users = (300 + 1800 * daily_cycle) * weekend_factor
        user_noise = np.random.normal(0, 45)
        active_users = max(50, int(base_users + user_noise))

        # Request rate correlates strongly with active users (0.8 - 1.5 req/sec per user)
        req_multiplier = np.random.uniform(0.9, 1.4)
        request_rate = max(10.0, round(active_users * req_multiplier * (1.0 + np.random.normal(0, 0.05)), 1))

        # CPU Usage: heavily driven by request rate + background OS load (10-20%)
        # Normal CPU range: 25% - 85%
        base_cpu = 15.0 + (request_rate / 3500.0) * 60.0
        cpu_noise = np.random.normal(0, 3.5)
        cpu_usage = base_cpu + cpu_noise

        # RAM Usage: has memory continuity (stateful caching & memory allocation)
        # Follows active users and CPU with smoothing
        target_ram = 35.0 + (active_users / 2500.0) * 45.0 + (cpu_usage * 0.15)
        ram_usage = 0.85 * prev_ram + 0.15 * target_ram + np.random.normal(0, 0.8)
        prev_ram = ram_usage

        # Network Usage: strongly correlated with request rate & payload transmission
        network_usage = (request_rate / 3500.0) * 75.0 + np.random.normal(12.0, 4.0)

        # Disk Usage: slow cumulative drift with periodic cleanup/compaction drops
        drift = np.random.uniform(0.005, 0.02)
        if i % 288 == 0:  # once every ~24h log rotation / cleanup
            prev_disk = max(35.0, prev_disk - np.random.uniform(3.0, 6.0))
        else:
            prev_disk = min(88.0, prev_disk + drift)
        disk_usage = prev_disk + np.random.normal(0, 0.3)

        # Inject Occasional Traffic Spikes (flash sales, marketing campaigns, batch jobs)
        # ~1.5% chance
        is_spike = np.random.rand() < 0.015
        if is_spike:
            multiplier = np.random.uniform(1.35, 1.7)
            active_users = int(active_users * multiplier)
            request_rate = round(request_rate * multiplier, 1)
            cpu_usage = cpu_usage * multiplier
            network_usage = network_usage * multiplier
            ram_usage = ram_usage + np.random.uniform(8.0, 18.0)

        # Inject Occasional Resource Anomalies (~0.8% chance)
        # e.g., runaway process, memory leak spike, I/O thrashing
        is_anomaly = np.random.rand() < 0.008
        if is_anomaly:
            anomaly_type = np.random.choice(["cpu_runaway", "ram_spike", "network_flood", "io_freeze"])
            if anomaly_type == "cpu_runaway":
                cpu_usage += np.random.uniform(25.0, 45.0)
            elif anomaly_type == "ram_spike":
                ram_usage += np.random.uniform(30.0, 48.0)
            elif anomaly_type == "network_flood":
                network_usage += np.random.uniform(35.0, 50.0)
            elif anomaly_type == "io_freeze":
                cpu_usage += np.random.uniform(20.0, 35.0)
                disk_usage += np.random.uniform(15.0, 25.0)

        # Clip values to realistic percentages [5.0, 99.5]
        cpu_usage = float(np.clip(round(cpu_usage, 2), 5.0, 99.5))
        ram_usage = float(np.clip(round(ram_usage, 2), 8.0, 99.0))
        disk_usage = float(np.clip(round(disk_usage, 2), 10.0, 98.0))
        network_usage = float(np.clip(round(network_usage, 2), 2.0, 99.0))
        request_rate = float(round(request_rate, 1))

        records.append({
            "timestamp": ts.strftime("%Y-%m-%d %H:%M:%S"),
            "cpu_usage": cpu_usage,
            "ram_usage": ram_usage,
            "disk_usage": disk_usage,
            "network_usage": network_usage,
            "active_users": int(active_users),
            "request_rate": request_rate,
            "hour": hour,
            "day_of_week": day_of_week
        })

    df = pd.DataFrame(records)
    return df

def main():
    RAW_DATA_DIR.mkdir(parents=True, exist_ok=True)
    
    df = generate_synthetic_data(n_records=5500, random_state=42)
    df.to_csv(OUTPUT_FILE, index=False)
    
    print("\n" + "="*50)
    print("DATASET GENERATION COMPLETE")
    print("="*50)
    print(f"Saved file: {OUTPUT_FILE}")
    print(f"Total records generated: {len(df):,}")
    print(f"Date range: {df['timestamp'].iloc[0]} to {df['timestamp'].iloc[-1]}")
    print(f"Columns: {list(df.columns)}")
    print("\nDataset Summary Statistics:")
    print(df[["cpu_usage", "ram_usage", "disk_usage", "network_usage", "active_users", "request_rate"]].describe().round(2))
    print("="*50)

if __name__ == "__main__":
    main()
