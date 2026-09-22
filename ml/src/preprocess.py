#!/usr/bin/env python3
"""
Preprocess the synthetic resource-usage dataset.
Key functions:
- Load raw telemetry data.
- Validate schema and percentage boundaries.
- Chronological sorting & deduplication.
- Generate lag and rolling window features (Strictly historical, NO future data leakage).
- Create 15-minute future prediction targets (shift -3 periods for 5-min intervals).
- Clean missing values and export processed dataset for training.
"""

from pathlib import Path
import pandas as pd
import numpy as np

SCRIPT_DIR = Path(__file__).resolve().parent
ML_DIR = SCRIPT_DIR.parent
RAW_DATA_FILE = ML_DIR / "data" / "raw" / "synthetic_resource_usage.csv"
PROCESSED_DIR = ML_DIR / "data" / "processed"
OUTPUT_FILE = PROCESSED_DIR / "resource_usage_processed.csv"

REQUIRED_COLUMNS = [
    "timestamp", "cpu_usage", "ram_usage", "disk_usage", 
    "network_usage", "active_users", "request_rate", "hour", "day_of_week"
]

def preprocess_pipeline(raw_file: Path = RAW_DATA_FILE, output_file: Path = OUTPUT_FILE):
    if not raw_file.exists():
        raise FileNotFoundError(f"Raw data file not found at: {raw_file}. Please run generate_dataset.py first.")

    print(f"Loading raw dataset from {raw_file}...")
    df = pd.read_csv(raw_file)

    # 1. Validate required columns
    missing_cols = set(REQUIRED_COLUMNS) - set(df.columns)
    if missing_cols:
        raise ValueError(f"Missing required columns in dataset: {missing_cols}")

    initial_count = len(df)
    print(f"Initial raw records: {initial_count:,}")

    # 2. Timestamp formatting and chronological sorting
    df["timestamp"] = pd.to_datetime(df["timestamp"])
    df = df.sort_values("timestamp").reset_index(drop=True)

    # 3. Deduplicate
    df = df.drop_duplicates(subset=["timestamp"]).reset_index(drop=True)
    print(f"Records after deduplication: {len(df):,}")

    # 4. Validate percentage bounds
    percent_cols = ["cpu_usage", "ram_usage", "disk_usage", "network_usage"]
    for col in percent_cols:
        df[col] = df[col].clip(0.0, 100.0)

    # 5. Feature Engineering: Historical Lag Features (Previous step: t - 1)
    df["previous_cpu"] = df["cpu_usage"].shift(1)
    df["previous_ram"] = df["ram_usage"].shift(1)
    df["previous_disk"] = df["disk_usage"].shift(1)
    df["previous_network"] = df["network_usage"].shift(1)
    df["previous_request_rate"] = df["request_rate"].shift(1)
    df["previous_active_users"] = df["active_users"].shift(1)

    # 6. Feature Engineering: Rolling Window Averages (Window=3: current + last 2 observations)
    # Strictly backward-looking (no leakage of future values)
    df["rolling_cpu_mean"] = df["cpu_usage"].rolling(window=3, min_periods=1).mean()
    df["rolling_ram_mean"] = df["ram_usage"].rolling(window=3, min_periods=1).mean()
    df["rolling_request_rate"] = df["request_rate"].rolling(window=3, min_periods=1).mean()

    # 7. Create Future Prediction Targets (~15 minutes ahead = 3 steps into future)
    # Target is what happens 3 steps ahead (t + 3)
    df["target_cpu"] = df["cpu_usage"].shift(-3)
    df["target_ram"] = df["ram_usage"].shift(-3)

    # 8. Remove rows where future targets are missing (end of series) or lag is NaN (first row)
    clean_df = df.dropna().copy().reset_index(drop=True)
    
    # Ensure hour and day_of_week are integers
    clean_df["hour"] = clean_df["hour"].astype(int)
    clean_df["day_of_week"] = clean_df["day_of_week"].astype(int)
    clean_df["active_users"] = clean_df["active_users"].astype(int)
    clean_df["previous_active_users"] = clean_df["previous_active_users"].astype(int)

    # Format timestamp back to ISO string for portability
    clean_df["timestamp"] = clean_df["timestamp"].dt.strftime("%Y-%m-%d %H:%M:%S")

    PROCESSED_DIR.mkdir(parents=True, exist_ok=True)
    clean_df.to_csv(output_file, index=False)

    print("\n" + "="*50)
    print("PREPROCESSING COMPLETE")
    print("="*50)
    print(f"Saved processed dataset to: {output_file}")
    print(f"Remaining valid training observations: {len(clean_df):,}")
    print(f"Dropped edge rows: {initial_count - len(clean_df)} (lag start + target horizon end)")
    print(f"Total features created: {len(clean_df.columns)}")
    print(f"Columns: {list(clean_df.columns)}")
    print("="*50)
    return clean_df

if __name__ == "__main__":
    preprocess_pipeline()
