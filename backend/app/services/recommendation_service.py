"""
Recommendation Engine for Resource Optimization Decision-Support.
Completely decoupled from the ML models.
Interprets predicted CPU and RAM utilization ~15 minutes into the future
and assigns operational guidance.
"""

from typing import Dict, Any, Optional

class RecommendationEngine:
    @staticmethod
    def evaluate(
        predicted_cpu: float, 
        predicted_ram: float, 
        current_cpu: Optional[float] = None, 
        current_ram: Optional[float] = None
    ) -> Dict[str, str]:
        """
        Evaluate predicted and current metrics to produce decision-support recommendations.
        Hierarchy:
        1. CRITICAL: (Predicted/Current CPU >= 90% or RAM >= 90%)
        2. HIGH_USAGE_EXPECTED: (Predicted/Current CPU >= 80% or RAM >= 80%)
        3. LOW_UTILIZATION: (Predicted/Current CPU < 30% and RAM < 30%)
        4. NORMAL: Otherwise
        """
        eval_cpu = max(predicted_cpu, current_cpu if current_cpu is not None else predicted_cpu)
        eval_ram = max(predicted_ram, current_ram if current_ram is not None else predicted_ram)

        if eval_cpu >= 90.0 or eval_ram >= 90.0:
            return {
                "status": "CRITICAL",
                "severity": "CRITICAL",
                "recommendation": "Critical resource usage expected. Increase capacity and investigate the workload.",
                "color_variant": "danger"
            }
        
        if eval_cpu >= 80.0 or eval_ram >= 80.0:
            return {
                "status": "HIGH_USAGE_EXPECTED",
                "severity": "HIGH",
                "recommendation": "High resource usage expected. Consider increasing available resources.",
                "color_variant": "warning"
            }
        
        # Check low utilization
        min_cpu = min(predicted_cpu, current_cpu if current_cpu is not None else predicted_cpu)
        min_ram = min(predicted_ram, current_ram if current_ram is not None else predicted_ram)
        if min_cpu < 30.0 and min_ram < 30.0:
            return {
                "status": "LOW_UTILIZATION",
                "severity": "LOW",
                "recommendation": "Resources appear underutilized. Consider reducing allocated capacity.",
                "color_variant": "info"
            }
        
        return {
            "status": "NORMAL",
            "severity": "NORMAL",
            "recommendation": "Resource utilization is within a normal range. Maintain current capacity.",
            "color_variant": "success"
        }

recommendation_engine = RecommendationEngine()
