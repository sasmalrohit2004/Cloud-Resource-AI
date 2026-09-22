import os
import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

load_dotenv()

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)
logger = logging.getLogger("cloud_resource_ai")

from app.database.mongodb import db_manager
from app.services.prediction_service import prediction_service
from app.routes import health, metrics, prediction, alerts, dashboard, auth

@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Starting Cloud Resource AI Backend...")
    # Verify models
    if prediction_service.is_ready:
        logger.info("ML Models verified and ready for inference.")
    else:
        logger.warning("ML Models not loaded. Please ensure train.py has been run.")

    # Auto-seed if database is currently empty
    try:
        latest = db_manager.get_latest_metric()
        if not latest:
            logger.info("Database appears unseeded. Executing initial metric seeding...")
            from seed_database import seed_database
            seed_database(limit_records=180)
    except Exception as e:
        logger.warning(f"Auto-seed check note: {e}")

    yield
    logger.info("Shutting down Cloud Resource AI Backend.")

app = FastAPI(
    title="Cloud Resource AI Decision-Support API",
    description="ML-Based Cloud Resource Utilization Prediction & Optimization API",
    version="1.0.0",
    lifespan=lifespan
)

# CORS Configuration
raw_origins = os.getenv("ALLOWED_ORIGINS", "http://localhost:5173,http://localhost:3000,http://127.0.0.1:5173,http://127.0.0.1:3000")
allowed_origins = [o.strip() for o in raw_origins.split(",") if o.strip()]

# In development or preview containers, allow matching origins
app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins if allowed_origins else ["*"],
    allow_origin_regex=r"https?://.*",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount Routers under /api
app.include_router(health.router, prefix="/api")
app.include_router(metrics.router, prefix="/api")
app.include_router(prediction.router, prefix="/api")
app.include_router(alerts.router, prefix="/api")
app.include_router(dashboard.router, prefix="/api")
app.include_router(auth.router, prefix="/api")

@app.get("/")
def root():
    return {
        "system": "Cloud Resource AI",
        "description": "ML-Based Cloud Resource Utilization Prediction & Optimization System",
        "status": "online",
        "docs_url": "/docs",
        "api_health": "/api/health"
    }
