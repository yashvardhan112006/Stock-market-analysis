"""
Quantitative strategy simulation and factor attribution engine.
Simulates SMA trend-following, sector dispersion, and Markowitz portfolio diversification curves.
"""
import pandas as pd
import numpy as np
from typing import Dict, Any, List
from backend.app.services.risk_metrics_calculator import (
    calculate_cagr,
    calculate_annualized_volatility,
    calculate_max_drawdown,
    calculate_sharpe_ratio,
)


def simulate_moving_average_momentum(
    prices: pd.Series,
    short_window: int = 50,
    long_window: int = 200,
    tx_cost: float = 0.001,
) -> Dict[str, Any]:
    """
    Simulate a moving average trend-following strategy against buy-and-hold benchmark.
    - Long (1) when short SMA crosses above long SMA (Golden Cross)
    - Flat (0) on Death Cross
    - Deducts execution slippage / transaction cost on each trade execution
    """
    df = prices.to_frame(name="price")
    df["short_sma"] = df["price"].rolling(window=short_window).mean()
    df["long_sma"] = df["price"].rolling(window=long_window).mean()

    df["signal"] = 0
    df.loc[df["short_sma"] > df["long_sma"], "signal"] = 1

    df["return"] = df["price"].pct_change().fillna(0)
    df["strategy_return"] = df["signal"].shift(1).fillna(0) * df["return"]

    # Transaction cost drag on turnover
    df["trades"] = df["signal"].diff().abs().fillna(0)
    df.loc[df["trades"] > 0, "strategy_return"] -= tx_cost

    df["strategy_cum"] = (1 + df["strategy_return"]).cumprod() * 100
    df["benchmark_cum"] = (1 + df["return"]).cumprod() * 100

    strat_metrics = {
        "annualized_return": float(calculate_cagr(df["strategy_cum"])),
        "annualized_volatility": float(calculate_annualized_volatility(df["strategy_return"])),
        "sharpe_ratio": float(calculate_sharpe_ratio(df["strategy_return"])),
        "max_drawdown": float(calculate_max_drawdown(df["strategy_cum"])["max_drawdown"]),
    }

    bench_metrics = {
        "annualized_return": float(calculate_cagr(df["price"])),
        "annualized_volatility": float(calculate_annualized_volatility(df["return"])),
        "sharpe_ratio": float(calculate_sharpe_ratio(df["return"])),
        "max_drawdown": float(calculate_max_drawdown(df["price"])["max_drawdown"]),
    }

    signals = []
    trade_days = df[df["trades"] > 0]
    for idx, row in trade_days.iterrows():
        d_str = idx.strftime("%Y-%m-%d") if hasattr(idx, "strftime") else str(idx)
        signals.append({
            "date": d_str,
            "type": "BUY" if row["signal"] == 1 else "SELL",
            "price": float(row["price"]),
        })

    strat_cum_list = [
        {"date": d.strftime("%Y-%m-%d") if hasattr(d, "strftime") else str(d), "value": float(v)}
        for d, v in df["strategy_cum"].items()
    ]
    bench_cum_list = [
        {"date": d.strftime("%Y-%m-%d") if hasattr(d, "strftime") else str(d), "value": float(v)}
        for d, v in df["benchmark_cum"].items()
    ]

    return {
        "strategy_cumulative_returns": strat_cum_list,
        "benchmark_cumulative_returns": bench_cum_list,
        "strategy_metrics": strat_metrics,
        "benchmark_metrics": bench_metrics,
        "signals": signals,
    }


def simulate_sector_performance_dispersion(
    prices_dict: Dict[str, pd.Series],
    sector_map: Dict[str, str],
    rf_rate: float = 0.045,
) -> Dict[str, Any]:
    """Group securities by industry sector to measure dispersion in risk-adjusted performance."""
    stats_by_ticker = {}
    for ticker, series in prices_dict.items():
        ret = series.pct_change().dropna()
        stats_by_ticker[ticker] = {
            "return": calculate_cagr(series),
            "volatility": calculate_annualized_volatility(ret),
            "sharpe": calculate_sharpe_ratio(ret, rf_rate=rf_rate),
        }

    sectors = sorted(list(set(sector_map.values())))
    sector_metrics = {}

    for sec in sectors:
        matched = [t for t, s in sector_map.items() if s == sec and t in stats_by_ticker]
        if not matched:
            continue

        sector_metrics[sec] = {
            "tickers": matched,
            "annualized_return": float(np.mean([stats_by_ticker[t]["return"] for t in matched])),
            "annualized_volatility": float(np.mean([stats_by_ticker[t]["volatility"] for t in matched])),
            "sharpe_ratio": float(np.mean([stats_by_ticker[t]["sharpe"] for t in matched])),
        }

    return {
        "per_sector": sector_metrics,
        "summary": "Sector attribution and risk-adjusted comparison completed.",
    }


def simulate_diversification_volatility_frontier(
    prices_df: pd.DataFrame,
    add_order: List[str],
) -> Dict[str, Any]:
    """
    Trace portfolio volatility trajectory as uncorrelated assets are added with 1/N allocation,
    illustrating covariance reduction toward systematic risk.
    """
    steps = []
    active = []
    returns_df = prices_df.pct_change().dropna()

    for ticker in add_order:
        if ticker not in returns_df.columns:
            continue

        active.append(ticker)
        k = len(active)
        w = np.ones(k) / k

        sub_rets = returns_df[active]
        port_ret = sub_rets.dot(w)
        port_vol = float(port_ret.std(ddof=1) * np.sqrt(252))

        indiv_vols = sub_rets.std(ddof=1) * np.sqrt(252)
        weighted_avg_vol = float(np.dot(indiv_vols, w))
        benefit = max(0.0, weighted_avg_vol - port_vol)

        steps.append({
            "num_assets": k,
            "tickers": list(active),
            "portfolio_vol": port_vol,
            "weighted_avg_vol": weighted_avg_vol,
            "diversification_benefit": benefit,
        })

    return {"steps": steps}


# Compatibility aliases
momentum_backtest = simulate_moving_average_momentum
sector_comparison = simulate_sector_performance_dispersion
diversification_analysis = simulate_diversification_volatility_frontier
