"""
FastAPI REST endpoints for asset analysis, strategy backtests, and correlation matrices.
"""
from fastapi import APIRouter, HTTPException, Query
import pandas as pd
import numpy as np
import logging
from typing import Dict, Any, List, Optional

from backend.app.schemas.analytics_contracts import (
    AnalyzePortfolioRequest,
    AnalyzePortfolioResponse,
    BacktestSimulationRequest,
    BacktestSimulationResponse,
    CorrelationMatrixResponse,
    SingleAssetRiskMetrics,
    PortfolioCovarianceMetrics,
    DailyTimeseriesRecord,
    DrawdownHorizon,
)
from backend.app.core.market_universe_config import (
    ASSET_UNIVERSE,
    SECTOR_MAPPING,
    resolve_currency,
    MARKET_BENCHMARK,
)
from backend.app.services.market_price_feed import download_aligned_asset_prices
from backend.app.services.risk_metrics_calculator import (
    calculate_cagr,
    calculate_annualized_volatility,
    calculate_sharpe_ratio,
    calculate_sortino_ratio,
    calculate_max_drawdown,
    calculate_correlation_matrix,
    calculate_portfolio_variance_and_benefit,
    calculate_rolling_volatility,
    calculate_beta_to_market,
    calculate_historical_var_95,
)
from backend.app.services.strategy_simulation_engine import (
    simulate_moving_average_momentum,
    simulate_sector_performance_dispersion,
    simulate_diversification_volatility_frontier,
)

logger = logging.getLogger(__name__)
router = APIRouter()


def _sanitize_float(val: Any) -> Optional[float]:
    """Convert numpy/pandas types to clean serializable floats, replacing NaN/Inf with None."""
    if val is None:
        return None
    try:
        f = float(val)
        return None if (np.isnan(f) or np.isinf(f)) else round(f, 6)
    except (TypeError, ValueError):
        return None


@router.get("/health")
def check_api_health():
    """Service health monitoring probe."""
    return {"status": "healthy", "service": "portfolio-risk-returns-analytics"}


@router.get("/tickers")
def get_curated_asset_universe():
    """Return default asset universe of US and Indian equities with sector metadata."""
    return ASSET_UNIVERSE


@router.post("/analyze", response_model=AnalyzePortfolioResponse)
def analyze_selected_portfolio(req: AnalyzePortfolioRequest):
    """
    Compute cross-market factor risks, Sharpe/Sortino ratios, max drawdowns,
    and portfolio covariance compression across requested symbols.
    """
    if not req.tickers:
        raise HTTPException(status_code=400, detail="Must provide at least one asset ticker symbol")

    symbols = list(set(req.tickers))
    if MARKET_BENCHMARK not in symbols:
        symbols.append(MARKET_BENCHMARK)

    try:
        prices_df = download_aligned_asset_prices(symbols, req.start_date, req.end_date)
    except Exception as err:
        logger.error(f"Price pipeline failure: {err}")
        raise HTTPException(status_code=500, detail=f"Market data pipeline error: {str(err)}")

    if prices_df.empty:
        raise HTTPException(status_code=404, detail="No historical records returned for the requested parameters")

    returns_df = prices_df.pct_change().dropna()
    market_returns = returns_df[MARKET_BENCHMARK] if MARKET_BENCHMARK in returns_df.columns else None

    metrics_map: Dict[str, SingleAssetRiskMetrics] = {}
    time_series_map: Dict[str, List[DailyTimeseriesRecord]] = {}

    for ticker in req.tickers:
        if ticker not in prices_df.columns:
            continue

        p_series = prices_df[ticker].dropna()
        r_series = returns_df[ticker].dropna() if ticker in returns_df.columns else pd.Series(dtype=float)

        if len(p_series) < 2 or r_series.empty:
            continue

        ann_ret = calculate_cagr(p_series)
        ann_vol = calculate_annualized_volatility(r_series)
        sharpe = calculate_sharpe_ratio(r_series, req.risk_free_rate)
        sortino = calculate_sortino_ratio(r_series, req.risk_free_rate)
        dd_data = calculate_max_drawdown(p_series)
        var_95 = calculate_historical_var_95(r_series)

        beta_val = None
        if market_returns is not None and ticker != MARKET_BENCHMARK:
            beta_val = calculate_beta_to_market(r_series, market_returns)
        elif ticker == MARKET_BENCHMARK:
            beta_val = 1.0

        currency = resolve_currency(ticker)

        metrics_map[ticker] = SingleAssetRiskMetrics(
            annualized_return=_sanitize_float(ann_ret),
            annualized_volatility=_sanitize_float(ann_vol),
            sharpe_ratio=_sanitize_float(sharpe),
            sortino_ratio=_sanitize_float(sortino),
            max_drawdown=_sanitize_float(dd_data["max_drawdown"]),
            max_drawdown_details=DrawdownHorizon(
                peak_date=dd_data.get("peak_date"),
                trough_date=dd_data.get("trough_date"),
                duration_days=dd_data.get("duration_days", 0),
            ),
            beta=_sanitize_float(beta_val),
            var_95=_sanitize_float(var_95),
            currency=currency,
            latest_price=_sanitize_float(p_series.iloc[-1]),
        )

        roll_30 = calculate_rolling_volatility(r_series, window=30)
        roll_90 = calculate_rolling_volatility(r_series, window=90)
        rolling_peaks = p_series.cummax()
        underwater = (p_series - rolling_peaks) / rolling_peaks

        ts_list = []
        for date_idx in p_series.index:
            d_str = date_idx.strftime("%Y-%m-%d") if hasattr(date_idx, "strftime") else str(date_idx)
            ts_list.append(DailyTimeseriesRecord(
                date=d_str,
                price=_sanitize_float(p_series.get(date_idx)),
                rolling_vol_30=_sanitize_float(roll_30.get(date_idx)),
                rolling_vol_90=_sanitize_float(roll_90.get(date_idx)),
                drawdown=_sanitize_float(underwater.get(date_idx)),
            ))
        time_series_map[ticker] = ts_list

    port_metrics = None
    if req.weights and len(req.weights) > 0:
        valid_weights = {k: v for k, v in req.weights.items() if k in returns_df.columns}
        if valid_weights:
            pm = calculate_portfolio_variance_and_benefit(returns_df, valid_weights)
            port_metrics = PortfolioCovarianceMetrics(
                annualized_return=_sanitize_float(pm["annualized_return"]) or 0.0,
                annualized_volatility=_sanitize_float(pm["annualized_volatility"]) or 0.0,
                diversification_benefit=_sanitize_float(pm["diversification_benefit"]) or 0.0,
            )

    return AnalyzePortfolioResponse(
        metrics=metrics_map,
        portfolio_metrics=port_metrics,
        time_series=time_series_map,
    )


@router.post("/backtest", response_model=BacktestSimulationResponse)
def execute_strategy_simulation(req: BacktestSimulationRequest):
    """Run quantitative backtest simulation (momentum, sector attribution, or diversification curve)."""
    start_date = req.params.get("start_date", "2019-01-01")
    end_date = req.params.get("end_date", "2024-12-31")

    if req.strategy_type == "momentum":
        prices_df = download_aligned_asset_prices([req.ticker], start_date, end_date)
        if prices_df.empty or req.ticker not in prices_df.columns:
            raise HTTPException(status_code=404, detail=f"No price history found for {req.ticker}")

        results = simulate_moving_average_momentum(
            prices=prices_df[req.ticker],
            short_window=int(req.params.get("short_window", 50)),
            long_window=int(req.params.get("long_window", 200)),
            tx_cost=float(req.params.get("tx_cost", 0.001)),
        )
        return BacktestSimulationResponse(
            strategy_results=results,
            signals=results.get("signals"),
            comparison_metrics={
                "strategy": results["strategy_metrics"],
                "benchmark": results["benchmark_metrics"],
            },
        )

    elif req.strategy_type == "sector":
        tickers = req.params.get("tickers", [])
        if not tickers:
            raise HTTPException(status_code=400, detail="Tickers parameter required for sector test")

        prices_df = download_aligned_asset_prices(tickers, start_date, end_date)
        if prices_df.empty:
            raise HTTPException(status_code=404, detail="No price data available for sector universe")

        sector_map = {t: SECTOR_MAPPING.get(t, "Other") for t in tickers if t in prices_df.columns}
        prices_dict = {col: prices_df[col] for col in prices_df.columns}
        res = simulate_sector_performance_dispersion(
            prices_dict,
            sector_map,
            rf_rate=float(req.params.get("rf_rate", 0.045)),
        )
        return BacktestSimulationResponse(strategy_results=res)

    elif req.strategy_type == "diversification":
        tickers = req.params.get("tickers", [])
        if not tickers:
            raise HTTPException(status_code=400, detail="Tickers list required for diversification curve")

        prices_df = download_aligned_asset_prices(tickers, start_date, end_date)
        if prices_df.empty:
            raise HTTPException(status_code=404, detail="No price data available for diversification test")

        res = simulate_diversification_volatility_frontier(prices_df, tickers)
        return BacktestSimulationResponse(strategy_results=res)

    else:
        raise HTTPException(status_code=400, detail=f"Unsupported strategy type: {req.strategy_type}")


@router.get("/correlation", response_model=CorrelationMatrixResponse)
def calculate_asset_correlations(
    tickers: str = Query(..., description="Comma-separated ticker list"),
    start_date: str = Query("2019-01-01"),
    end_date: str = Query("2024-12-31"),
):
    """Compute Pearson daily return correlation matrix across requested tickers."""
    symbols = [t.strip().upper() for t in tickers.split(",") if t.strip()]
    if not symbols:
        raise HTTPException(status_code=400, detail="No valid ticker symbols provided")

    prices_df = download_aligned_asset_prices(symbols, start_date, end_date)
    if prices_df.empty:
        raise HTTPException(status_code=404, detail="No price records returned for correlation calculation")

    returns_df = prices_df.pct_change().dropna()
    corr_df = calculate_correlation_matrix(returns_df)

    matrix_out = {}
    for col in corr_df.columns:
        matrix_out[col] = {row_idx: _sanitize_float(corr_df.loc[row_idx, col]) for row_idx in corr_df.index}

    return CorrelationMatrixResponse(matrix=matrix_out, tickers=list(corr_df.columns))
