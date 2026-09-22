from pathlib import Path
import json
import pandas as pd
import joblib

ML_DIR = Path(__file__).resolve().parent.parent

def test_raw_dataset():
    raw_csv = ML_DIR / "data" / "raw" / "synthetic_resource_usage.csv"
    assert raw_csv.exists(), "Raw dataset must exist"
    df = pd.read_csv(raw_csv)
    assert len(df) >= 5000, f"Dataset must contain >= 5000 records, got {len(df)}"
    required_cols = ["timestamp", "cpu_usage", "ram_usage", "disk_usage", "network_usage", "active_users", "request_rate", "hour", "day_of_week"]
    for c in required_cols:
        assert c in df.columns, f"Missing column {c}"

def test_processed_dataset():
    proc_csv = ML_DIR / "data" / "processed" / "resource_usage_processed.csv"
    assert proc_csv.exists(), "Processed dataset must exist"
    df = pd.read_csv(proc_csv)
    assert len(df) >= 4900, "Processed dataset must have valid length"
    assert "target_cpu" in df.columns, "target_cpu column must exist"
    assert "target_ram" in df.columns, "target_ram column must exist"
    assert "previous_cpu" in df.columns, "lag features must exist"
    assert "rolling_cpu_mean" in df.columns, "rolling features must exist"

def test_models_exist():
    cpu_model = ML_DIR / "models" / "cpu_model.joblib"
    ram_model = ML_DIR / "models" / "ram_model.joblib"
    anomaly_model = ML_DIR / "models" / "anomaly_model.joblib"
    config_file = ML_DIR / "models" / "feature_config.json"
    metrics_file = ML_DIR / "models" / "metrics.json"

    assert cpu_model.exists(), "cpu_model.joblib must exist"
    assert ram_model.exists(), "ram_model.joblib must exist"
    assert anomaly_model.exists(), "anomaly_model.joblib must exist"
    assert config_file.exists(), "feature_config.json must exist"
    assert metrics_file.exists(), "metrics.json must exist"

def test_evaluation_metrics_validity():
    metrics_file = ML_DIR / "models" / "metrics.json"
    with open(metrics_file, "r") as f:
        data = json.load(f)
    assert "cpu_model" in data
    assert "ram_model" in data
    assert data["cpu_model"]["r2"] > 0.5, "CPU model R² should be reasonable"
    assert data["ram_model"]["r2"] > 0.5, "RAM model R² should be reasonable"
