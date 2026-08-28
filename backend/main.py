from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import pandas as pd
import numpy as np
from typing import List, Dict, Optional

from backend.db import init_db
from backend.models import (
    AnalyzeRequest, AnalyzeResponse,
    BacktestRequest, BacktestResponse,
    CorrelationResponse
)
from backend.data_fetcher import fetch_prices
from backend.metrics import (
    compute_log_returns,
    compute_annualized_return, compute_annualized_volatility,
    compute_sharpe_ratio, compute_sortino_ratio,
    compute_max_drawdown, compute_correlation_matrix,
    compute_portfolio_metrics, compute_rolling_volatility,
    compute_cumulative_returns, compute_beta, compute_var_95
)
from backend.backtest import momentum_backtest, sector_comparison, diversification_analysis

import logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Initialize database on startup."""
    init_db()
    logger.info("Database initialized")
    yield


app = FastAPI(title="Portfolio Risk & Returns Analytics API", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000", "*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

TICKERS_DB = [
    # ── US Market ──
    {"ticker": "SPY", "name": "S&P 500 ETF", "sector": "Broad Market"},
    {"ticker": "QQQ", "name": "Invesco QQQ Trust", "sector": "Technology"},
    {"ticker": "XLK", "name": "Technology Select Sector SPDR", "sector": "Technology"},
    {"ticker": "XLE", "name": "Energy Select Sector SPDR", "sector": "Energy"},
    {"ticker": "TLT", "name": "iShares 20+ Year Treasury Bond ETF", "sector": "Bonds"},
    {"ticker": "AAPL", "name": "Apple Inc.", "sector": "Technology"},
    {"ticker": "MSFT", "name": "Microsoft Corp.", "sector": "Technology"},
    {"ticker": "GOOGL", "name": "Alphabet Inc.", "sector": "Technology"},
    {"ticker": "AMZN", "name": "Amazon.com Inc.", "sector": "Technology"},
    {"ticker": "NVDA", "name": "NVIDIA Corp.", "sector": "Technology"},
    {"ticker": "XLF", "name": "Financial Select Sector SPDR", "sector": "Financials"},
    {"ticker": "XLV", "name": "Health Care Select Sector SPDR", "sector": "Healthcare"},
    {"ticker": "GLD", "name": "SPDR Gold Shares", "sector": "Commodities"},
    {"ticker": "IWM", "name": "iShares Russell 2000 ETF", "sector": "Broad Market"},
    {"ticker": "VNQ", "name": "Vanguard Real Estate ETF", "sector": "Real Estate"},
    # ── Indian Market (NSE) ──
    {"ticker": "^NSEI", "name": "Nifty 50 Index", "sector": "Broad Market"},
    {"ticker": "^BSESN", "name": "BSE Sensex Index", "sector": "Broad Market"},
    {"ticker": "RELIANCE.NS", "name": "Reliance Industries", "sector": "Energy"},
    {"ticker": "TCS.NS", "name": "Tata Consultancy Services", "sector": "Technology"},
    {"ticker": "INFY.NS", "name": "Infosys", "sector": "Technology"},
    {"ticker": "HDFCBANK.NS", "name": "HDFC Bank", "sector": "Financials"},
    {"ticker": "ICICIBANK.NS", "name": "ICICI Bank", "sector": "Financials"},
    {"ticker": "SBIN.NS", "name": "State Bank of India", "sector": "Financials"},
    {"ticker": "HINDUNILVR.NS", "name": "Hindustan Unilever", "sector": "FMCG"},
    {"ticker": "ITC.NS", "name": "ITC Ltd", "sector": "FMCG"},
    {"ticker": "BHARTIARTL.NS", "name": "Bharti Airtel", "sector": "Telecom"},
    {"ticker": "WIPRO.NS", "name": "Wipro", "sector": "Technology"},
    {"ticker": "TATAMOTORS.NS", "name": "Tata Motors", "sector": "Automobiles"},
    {"ticker": "ADANIENT.NS", "name": "Adani Enterprises", "sector": "Conglomerate"},
    {"ticker": "SUNPHARMA.NS", "name": "Sun Pharma", "sector": "Healthcare"},
    {"ticker": "HCLTECH.NS", "name": "HCL Technologies", "sector": "Technology"},
]

SECTOR_MAP = {t["ticker"]: t["sector"] for t in TICKERS_DB}


def _safe_float(val):
    """Convert numpy/pandas types to Python float, handling NaN."""
    if val is None or (isinstance(val, float) and np.isnan(val)):
        return None
    try:
        f = float(val)
        return None if np.isnan(f) or np.isinf(f) else f
    except (TypeError, ValueError):
        return None


@app.get("/api/health")
def health_check():
    return {"status": "ok"}


@app.get("/api/tickers")
def get_tickers():
    return TICKERS_DB


@app.post("/api/analyze")
def analyze_portfolio(req: AnalyzeRequest):
    if not req.tickers:
        raise HTTPException(status_code=400, detail="No tickers provided")

    try:
        prices_df = fetch_prices(req.tickers, req.start_date, req.end_date)
    except Exception as e:
        logger.error(f"Data fetch error: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to fetch data: {str(e)}")

    if prices_df.empty:
        raise HTTPException(status_code=404, detail="No data found for the given tickers and date range")

    returns_df = prices_df.pct_change().dropna()

    # Determine market returns (SPY as benchmark)
    market_returns = None
    if "SPY" in returns_df.columns:
        market_returns = returns_df["SPY"]

    metrics_dict = {}
    time_series_dict = {}
    drawdown_series_dict = {}

    for ticker in req.tickers:
        if ticker not in prices_df.columns:
            continue

        t_prices = prices_df[ticker].dropna()
        t_returns = returns_df[ticker].dropna() if ticker in returns_df.columns else pd.Series(dtype=float)

        if t_returns.empty or len(t_prices) < 2:
            continue

        # Compute all metrics
        ann_ret = compute_annualized_return(t_prices)
        ann_vol = compute_annualized_volatility(t_returns)
        sharpe = compute_sharpe_ratio(t_returns, req.risk_free_rate)
        sortino = compute_sortino_ratio(t_returns, req.risk_free_rate)
        max_dd = compute_max_drawdown(t_prices)
        var_95 = compute_var_95(t_returns)

        # Beta relative to SPY
        beta = None
        if market_returns is not None and ticker != "SPY":
            beta = compute_beta(t_returns, market_returns)
        elif ticker == "SPY":
            beta = 1.0

        # Detect currency from ticker
        is_indian = ticker.endswith(".NS") or ticker.endswith(".BO") or ticker.startswith("^NSE") or ticker.startswith("^BSE")
        currency = "INR" if is_indian else "USD"

        metrics_dict[ticker] = {
            "annualized_return": _safe_float(ann_ret),
            "annualized_volatility": _safe_float(ann_vol),
            "sharpe_ratio": _safe_float(sharpe),
            "sortino_ratio": _safe_float(sortino),
            "max_drawdown": _safe_float(max_dd["max_drawdown"]),
            "max_drawdown_details": {
                "peak_date": max_dd.get("peak_date"),
                "trough_date": max_dd.get("trough_date"),
                "duration_days": max_dd.get("duration_days", 0),
            },
            "beta": _safe_float(beta),
            "var_95": _safe_float(var_95),
            "currency": currency,
            "latest_price": _safe_float(t_prices.iloc[-1]),
        }

        # Time series data — include raw price for actual currency charts
        roll_vol_30 = compute_rolling_volatility(t_returns, window=30)
        roll_vol_90 = compute_rolling_volatility(t_returns, window=90)

        # Drawdown time series
        rolling_max = t_prices.cummax()
        drawdown = (t_prices - rolling_max) / rolling_max

        ts_data = []
        for date in t_prices.index:
            date_str = date.isoformat() if hasattr(date, "isoformat") else str(date)
            rv30 = roll_vol_30.get(date) if date in roll_vol_30.index else None
            rv90 = roll_vol_90.get(date) if date in roll_vol_90.index else None
            dd = drawdown.get(date) if date in drawdown.index else None
            ts_data.append({
                "date": date_str,
                "price": _safe_float(t_prices.get(date)),
                "rolling_vol_30": _safe_float(rv30),
                "rolling_vol_90": _safe_float(rv90),
                "drawdown": _safe_float(dd),
            })

        time_series_dict[ticker] = ts_data

    # Portfolio-level metrics
    port_metrics = None
    if req.weights and len(req.weights) > 0:
        valid_weights = {k: v for k, v in req.weights.items() if k in returns_df.columns}
        if valid_weights:
            pm = compute_portfolio_metrics(returns_df[list(valid_weights.keys())], valid_weights)
            port_metrics = {k: _safe_float(v) for k, v in pm.items()}

    return {
        "metrics": metrics_dict,
        "portfolio_metrics": port_metrics,
        "time_series": time_series_dict,
    }


@app.post("/api/backtest")
def run_backtest(req: BacktestRequest):
    try:
        start_date = req.params.get("start_date", "2019-01-01")
        end_date = req.params.get("end_date", "2024-12-31")

        if req.strategy_type == "momentum":
            tickers_to_fetch = [req.ticker]
            prices_df = fetch_prices(tickers_to_fetch, start_date, end_date)
            if prices_df.empty or req.ticker not in prices_df.columns:
                raise HTTPException(status_code=404, detail=f"No data found for {req.ticker}")

            res = momentum_backtest(
                prices_df[req.ticker],
                short_window=req.params.get("short_window", 50),
                long_window=req.params.get("long_window", 200),
                tx_cost=req.params.get("tx_cost", 0.001),
            )
            return {"strategy_results": res, "signals": res.get("signals")}

        elif req.strategy_type == "sector":
            tickers = req.params.get("tickers", [])
            if not tickers:
                raise HTTPException(status_code=400, detail="No tickers provided for sector comparison")

            prices_df = fetch_prices(tickers, start_date, end_date)
            if prices_df.empty:
                raise HTTPException(status_code=404, detail="No data found")

            sector_map = {t: SECTOR_MAP.get(t, "Other") for t in tickers if t in prices_df.columns}
            prices_dict = {col: prices_df[col] for col in prices_df.columns}

            res = sector_comparison(prices_dict, sector_map, req.params.get("rf_rate", 0.045))
            return {"strategy_results": res}

        elif req.strategy_type == "diversification":
            tickers = req.params.get("tickers", [])
            if not tickers:
                raise HTTPException(status_code=400, detail="No tickers provided for diversification analysis")

            prices_df = fetch_prices(tickers, start_date, end_date)
            if prices_df.empty:
                raise HTTPException(status_code=404, detail="No data found")

            res = diversification_analysis(prices_df, tickers)
            return {"strategy_results": res}

        else:
            raise HTTPException(status_code=400, detail=f"Unknown strategy_type: {req.strategy_type}")

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Backtest error: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Backtest failed: {str(e)}")


@app.get("/api/correlation")
def get_correlation(
    tickers: str = Query(..., description="Comma-separated ticker symbols"),
    start_date: str = Query("2019-01-01"),
    end_date: str = Query("2024-12-31"),
):
    ticker_list = [t.strip().upper() for t in tickers.split(",") if t.strip()]
    if not ticker_list:
        raise HTTPException(status_code=400, detail="No tickers provided")

    prices_df = fetch_prices(ticker_list, start_date, end_date)
    if prices_df.empty:
        raise HTTPException(status_code=404, detail="No data found")

    returns_df = prices_df.pct_change().dropna()
    corr_df = compute_correlation_matrix(returns_df)

    matrix = {}
    for col in corr_df.columns:
        matrix[col] = {idx: _safe_float(val) for idx, val in corr_df[col].items()}

    return {"matrix": matrix, "tickers": list(corr_df.columns)}
