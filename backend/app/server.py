"""
FastAPI application server and lifespan manager.
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import logging

from backend.app.db.price_cache_database import init_price_cache_db
from backend.app.api.analytics_endpoints import router as analytics_router

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(name)s: %(message)s")
logger = logging.getLogger("portfolio_analytics")


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Lifecycle event handler for database table creation and cleanup."""
    logger.info("Initializing price cache database schema...")
    init_price_cache_db()
    logger.info("Price cache database online.")
    yield


app = FastAPI(
    title="Portfolio Risk & Returns Analytics API",
    description="Cross-market quantitative risk factor profiling, drawdown modeling, and empirical backtest engine.",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000", "*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(analytics_router, prefix="/api")
