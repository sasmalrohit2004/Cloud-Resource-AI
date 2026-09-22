"""
Simulation Service for Cloud Resource Telemetry Scenarios.
Provides preset scenarios aligned with college demonstration steps:
1. NORMAL
2. HIGH TRAFFIC
3. LOW UTILIZATION
4. CRITICAL LOAD
5. ANOMALY SPIKE
"""

from typing import Dict, Any

PRESET_SCENARIOS: Dict[str, Dict[str, Any]] = {
    "NORMAL": {
        "name": "Normal Workload",
        "description": "Standard business hour operations with stable resource utilization.",
        "cpu": 44.0,
        "ram": 52.0,
        "disk": 42.0,
        "network": 38.0,
        "active_users": 850,
        "request_rate": 1050.0,
        "hour": 14,
        "day_of_week": 2
    },
    "HIGH_TRAFFIC": {
        "name": "High Traffic / Busy Period",
        "description": "Mid-day peak load with high active concurrent users and elevated requests.",
        "cpu": 82.0,
        "ram": 81.0,
        "disk": 58.0,
        "network": 84.0,
        "active_users": 2800,
        "request_rate": 3600.0,
        "hour": 18,
        "day_of_week": 4
    },
    "LOW_UTILIZATION": {
        "name": "Low Utilization / Night Window",
        "description": "Off-peak night period with minimal visitor activity and low computing demand.",
        "cpu": 18.0,
        "ram": 26.0,
        "disk": 36.0,
        "network": 8.0,
        "active_users": 95,
        "request_rate": 110.0,
        "hour": 3,
        "day_of_week": 1
    },
    "CRITICAL_LOAD": {
        "name": "Critical Load / Flash Event",
        "description": "Severe resource saturation approaching hardware limits.",
        "cpu": 93.0,
        "ram": 91.0,
        "disk": 74.0,
        "network": 92.0,
        "active_users": 3900,
        "request_rate": 4800.0,
        "hour": 20,
        "day_of_week": 5
    },
    "ANOMALY_SPIKE": {
        "name": "Anomaly Spike (Runaway Process)",
        "description": "Severe CPU runaway or memory leak with divergent low request count.",
        "cpu": 96.0,
        "ram": 42.0,
        "disk": 38.0,
        "network": 16.0,
        "active_users": 150,
        "request_rate": 130.0,
        "hour": 11,
        "day_of_week": 3
    }
}

class SimulationService:
    @staticmethod
    def get_presets():
        return PRESET_SCENARIOS

    @staticmethod
    def get_preset(preset_key: str):
        key = preset_key.upper().replace(" ", "_")
        return PRESET_SCENARIOS.get(key, PRESET_SCENARIOS["NORMAL"])

simulation_service = SimulationService()
