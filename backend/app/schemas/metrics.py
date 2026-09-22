from pydantic import BaseModel, Field
from typing import Optional, List

class MetricRecord(BaseModel):
    timestamp: str = Field(..., description="ISO formatted timestamp")
    cpu_usage: float = Field(..., ge=0.0, le=100.0, description="CPU usage percentage")
    ram_usage: float = Field(..., ge=0.0, le=100.0, description="RAM usage percentage")
    disk_usage: float = Field(..., ge=0.0, le=100.0, description="Disk usage percentage")
    network_usage: float = Field(..., ge=0.0, le=100.0, description="Network usage percentage")
    active_users: int = Field(..., ge=0, description="Number of active users")
    request_rate: float = Field(..., ge=0.0, description="Incoming requests per second")

class MetricHistoryResponse(BaseModel):
    items: List[MetricRecord]
    count: int
    hours: Optional[int] = None
