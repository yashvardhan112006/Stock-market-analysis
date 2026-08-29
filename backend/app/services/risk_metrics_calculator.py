"""
Quantitative risk, return, factor sensitivity, and portfolio covariance engine.
All routines are stateless pure mathematical functions operating on pandas timeseries.
"""
import numpy as np
import pandas as pd
from typing import Dict, Any

TRADING_DAYS_PER_YEAR = 252


def calculate_log_returns(prices: pd.Series) -> pd.Series:
    """Compute daily continuously compounded (log) return series."""
    return np.log(prices / prices.shift(1)).dropna()


def calculate_normalized_wealth_index(prices: pd.Series) -> pd.Series:
    """Normalize price series to wealth path starting at 100."""
    if prices.empty or prices.iloc[0] == 0:
        return pd.Series(dtype=float)
    return (prices / prices.iloc[0]) * 100


def calculate_cagr(prices: pd.Series) -> float:
    """
    Calculate Compound Annual Growth Rate (CAGR).
    Accounts for leap days (365.25) when DatetimeIndex is present, otherwise 252 trading sessions.
    """
    if len(prices) < 2:
        return 0.0

    total_return = (prices.iloc[-1] / prices.iloc[0]) - 1.0

    if pd.api.types.is_datetime64_any_dtype(prices.index):
        delta_days = (prices.index[-1] - prices.index[0]).days
        years = delta_days / 365.25
    else:
        years = len(prices) / TRADING_DAYS_PER_YEAR

    if years <= 0:
        return 0.0

    if (1.0 + total_return) <= 0:
        return -1.0

    return float((1.0 + total_return) ** (1.0 / years) - 1.0)


def calculate_annualized_volatility(returns: pd.Series) -> float:
    """Annualize standard deviation of returns: std * sqrt(252)."""
    if len(returns) < 2:
        return 0.0
    return float(returns.std(ddof=1) * np.sqrt(TRADING_DAYS_PER_YEAR))


def calculate_sharpe_ratio(returns: pd.Series, rf_rate: float = 0.045) -> float:
    """
    Ex-post annualized Sharpe Ratio:
    (E[R] - R_f) / sigma * sqrt(252)
    """
    clean_returns = returns.dropna()
    if len(clean_returns) < 2:
        return 0.0

    daily_rf = rf_rate / TRADING_DAYS_PER_YEAR
    excess = clean_returns - daily_rf
    vol = clean_returns.std(ddof=1)

    if vol == 0 or np.isnan(vol):
        return 0.0

    return float(np.sqrt(TRADING_DAYS_PER_YEAR) * (excess.mean() / vol))


def calculate_sortino_ratio(returns: pd.Series, rf_rate: float = 0.045) -> float:
    """
    Annualized Sortino Ratio:
    (E[R] - R_f) / downside_vol * sqrt(252)
    Penalizes solely negative excess volatility.
    """
    clean_returns = returns.dropna()
    if len(clean_returns) < 2:
        return 0.0

    daily_rf = rf_rate / TRADING_DAYS_PER_YEAR
    excess = clean_returns - daily_rf
    downside = excess[excess < 0]

    if len(downside) == 0:
        return 0.0

    downside_vol = downside.std(ddof=1) if len(downside) > 1 else abs(downside.iloc[0])
    if downside_vol == 0 or np.isnan(downside_vol):
        return 0.0

    return float(np.sqrt(TRADING_DAYS_PER_YEAR) * (excess.mean() / downside_vol))


def calculate_max_drawdown(prices: pd.Series) -> Dict[str, Any]:
    """
    Calculate maximum peak-to-trough equity decline and duration.
    Drawdown_t = (P_t - cummax(P_t)) / cummax(P_t)
    """
    if len(prices) < 2:
        return {"max_drawdown": 0.0, "peak_date": None, "trough_date": None, "duration_days": 0}

    rolling_max = prices.cummax()
    drawdowns = (prices - rolling_max) / rolling_max
    max_dd = drawdowns.min()

    trough_idx = drawdowns.idxmin()
    peak_idx = prices.loc[:trough_idx].idxmax()

    if pd.api.types.is_datetime64_any_dtype(prices.index):
        duration = int((trough_idx - peak_idx).days)
        peak_str = peak_idx.strftime("%Y-%m-%d") if hasattr(peak_idx, "strftime") else str(peak_idx)
        trough_str = trough_idx.strftime("%Y-%m-%d") if hasattr(trough_idx, "strftime") else str(trough_idx)
    else:
        duration = int(trough_idx - peak_idx)
        peak_str = str(peak_idx)
        trough_str = str(trough_idx)

    return {
        "max_drawdown": float(max_dd),
        "peak_date": peak_str,
        "trough_date": trough_str,
        "duration_days": duration,
    }


def calculate_correlation_matrix(returns_df: pd.DataFrame) -> pd.DataFrame:
    """Pairwise Pearson correlation matrix across asset returns."""
    return returns_df.corr(method="pearson")


def calculate_beta_to_market(asset_returns: pd.Series, market_returns: pd.Series) -> float:
    """OLS Beta slope: Cov(R_a, R_m) / Var(R_m)."""
    aligned = pd.concat([asset_returns, market_returns], axis=1).dropna()
    if len(aligned) < 5:
        return 1.0

    m_var = aligned.iloc[:, 1].var(ddof=1)
    if m_var == 0 or np.isnan(m_var):
        return 1.0

    cov = aligned.iloc[:, 0].cov(aligned.iloc[:, 1])
    return float(cov / m_var)


def calculate_historical_var_95(returns: pd.Series) -> float:
    """Empirical 1-day 95% Value-at-Risk (5th percentile quantile of returns)."""
    clean = returns.dropna()
    if clean.empty:
        return 0.0
    return float(np.percentile(clean, 5))


def calculate_rolling_volatility(returns: pd.Series, window: int = 30) -> pd.Series:
    """Rolling annualized volatility over an N-day window."""
    return returns.rolling(window=window).std(ddof=1) * np.sqrt(TRADING_DAYS_PER_YEAR)


def calculate_portfolio_variance_and_benefit(
    returns_df: pd.DataFrame,
    weights: Dict[str, float],
) -> Dict[str, float]:
    """
    Calculate portfolio annualized return, portfolio realized volatility,
    and Markowitz diversification benefit:
    Diversification Benefit = (Weighted Average Asset Volatility) - (Realized Portfolio Volatility)
    """
    cols = [col for col in returns_df.columns if col in weights]
    if not cols:
        return {"annualized_return": 0.0, "annualized_volatility": 0.0, "diversification_benefit": 0.0}

    raw_weights = np.array([weights[c] for c in cols], dtype=float)
    total = np.sum(raw_weights)
    w = raw_weights / total if total > 0 else np.ones(len(cols)) / len(cols)

    sub_returns = returns_df[cols]
    portfolio_daily_returns = sub_returns.dot(w)

    ann_return = float(portfolio_daily_returns.mean() * TRADING_DAYS_PER_YEAR)
    ann_vol = float(portfolio_daily_returns.std(ddof=1) * np.sqrt(TRADING_DAYS_PER_YEAR))

    individual_vols = sub_returns.std(ddof=1) * np.sqrt(TRADING_DAYS_PER_YEAR)
    weighted_avg_vol = float(np.dot(individual_vols, w))

    div_benefit = max(0.0, weighted_avg_vol - ann_vol)

    return {
        "annualized_return": ann_return,
        "annualized_volatility": ann_vol,
        "diversification_benefit": div_benefit,
    }


# Backwards compatibility function aliases
compute_log_returns = calculate_log_returns
compute_cumulative_returns = calculate_normalized_wealth_index
compute_annualized_return = calculate_cagr
compute_annualized_volatility = calculate_annualized_volatility
compute_sharpe_ratio = calculate_sharpe_ratio
compute_sortino_ratio = calculate_sortino_ratio
compute_max_drawdown = calculate_max_drawdown
compute_correlation_matrix = calculate_correlation_matrix
compute_beta = calculate_beta_to_market
compute_var_95 = calculate_historical_var_95
compute_rolling_volatility = calculate_rolling_volatility
compute_portfolio_metrics = calculate_portfolio_variance_and_benefit
