from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any

class PredictionRequest(BaseModel):
    cpu: float = Field(..., ge=0.0, le=100.0, description="Current CPU utilization %")
    ram: float = Field(..., ge=0.0, le=100.0, description="Current RAM utilization %")
    disk: float = Field(..., ge=0.0, le=100.0, description="Current Disk utilization %")
    network: float = Field(..., ge=0.0, le=100.0, description="Current Network bandwidth %")
    active_users: int = Field(..., ge=0, description="Active user count")
    request_rate: float = Field(..., ge=0.0, description="Request rate (req/sec)")
    hour: Optional[int] = Field(None, ge=0, le=23, description="Hour of day (0-23)")
    day_of_week: Optional[int] = Field(None, ge=0, le=6, description="Day of week (0=Mon, 6=Sun)")

class AnomalyInfo(BaseModel):
    status: str # "NORMAL" or "ANOMALY DETECTED"
    is_anomaly: bool
    score: float
    message: str
    affected_metric: Optional[str] = None
    severity: str

class RecommendationInfo(BaseModel):
    status: str # "CRITICAL", "HIGH_USAGE_EXPECTED", "LOW_UTILIZATION", "NORMAL"
    severity: str
    action: str

class PredictionResponse(BaseModel):
    timestamp: str
    current_metrics: Dict[str, Any]
    predicted_cpu: float
    predicted_ram: float
    prediction_horizon: str
    status: str
    recommendation: str
    severity: str
    anomaly: AnomalyInfo

class AlertRecord(BaseModel):
    timestamp: str
    type: str # "ANOMALY", "CRITICAL_CAPACITY", "HIGH_USAGE", "USER_TRAFFIC_SURGE"
    severity: str # "CRITICAL", "HIGH", "MEDIUM", "LOW"
    message: str
    metric: Optional[str] = None
    value: Optional[float] = None
    status: Optional[str] = "ACTIVE" # "ACTIVE" or "RESOLVED"
    resolved_at: Optional[str] = None
    resolved_by: Optional[str] = None

class ResolveAlertRequest(BaseModel):
    timestamp: Optional[str] = None
    type: Optional[str] = None
    status: str = "RESOLVED" # "RESOLVED" or "ACTIVE"
    resolved_by: Optional[str] = "Site Reliability Engineer"

class DashboardSummaryResponse(BaseModel):
    current_cpu: float
    current_ram: float
    disk: float
    network: float
    active_users: int
    request_rate: float
    predicted_cpu: float
    predicted_ram: float
    prediction_horizon: str
    status: str
    recommendation: str
    severity: str
    anomaly_status: str
    is_anomaly: bool
    recent_alerts: List[AlertRecord]
    last_updated: str

class ModelMetricsDetail(BaseModel):
    model_type: str
    target: Optional[str] = None
    mae: Optional[float] = None
    rmse: Optional[float] = None
    r2: Optional[float] = None

class ModelPerformanceResponse(BaseModel):
    evaluation_timestamp: str
    test_dataset_size: int
    prediction_horizon: str
    cpu_model: Dict[str, Any]
    ram_model: Dict[str, Any]
    anomaly_model: Dict[str, Any]
