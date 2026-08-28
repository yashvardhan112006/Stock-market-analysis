import numpy as np
import pandas as pd
from typing import Dict, Any

def compute_log_returns(prices: pd.Series) -> pd.Series:
    """Compute logarithmic returns."""
    return np.log(prices / prices.shift(1))

def compute_cumulative_returns(prices: pd.Series) -> pd.Series:
    """Compute cumulative returns normalized to start at 100."""
    return (prices / prices.iloc[0]) * 100

def compute_annualized_return(prices: pd.Series) -> float:
    """Compute annualized geometric mean return."""
    if len(prices) < 2:
        return 0.0
    total_return = (prices.iloc[-1] / prices.iloc[0]) - 1
    # Check if index is datetime
    if pd.api.types.is_datetime64_any_dtype(prices.index):
        years = (prices.index[-1] - prices.index[0]).days / 365.25
    else:
        years = len(prices) / 252
        
    if years == 0:
        return 0.0
    return float((1 + total_return) ** (1 / years) - 1)

def compute_annualized_volatility(returns: pd.Series) -> float:
    """Compute annualized volatility (daily std x sqrt(252))."""
    return float(returns.std() * np.sqrt(252))

def compute_sharpe_ratio(returns: pd.Series, rf_rate: float = 0.045) -> float:
    """Compute Sharpe ratio."""
    if len(returns) < 2:
        return 0.0
    excess_returns = returns - (rf_rate / 252)
    vol = returns.std()
    if vol == 0:
        return 0.0
    return float(np.sqrt(252) * (excess_returns.mean() / vol))

def compute_sortino_ratio(returns: pd.Series, rf_rate: float = 0.045) -> float:
    """Compute Sortino ratio (downside deviation only)."""
    if len(returns) < 2:
        return 0.0
    excess_returns = returns - (rf_rate / 252)
    downside_returns = excess_returns[excess_returns < 0]
    if len(downside_returns) == 0:
        return 0.0
    downside_vol = downside_returns.std(ddof=0) if len(downside_returns) == 1 else downside_returns.std()
    if pd.isna(downside_vol) or downside_vol == 0:
        return 0.0
    return float(np.sqrt(252) * (excess_returns.mean() / downside_vol))

def compute_max_drawdown(prices: pd.Series) -> Dict[str, Any]:
    """Compute maximum drawdown and return metrics."""
    if len(prices) < 2:
        return {"max_drawdown": 0.0, "peak_date": None, "trough_date": None, "duration_days": 0}
        
    rolling_max = prices.cummax()
    drawdowns = (prices - rolling_max) / rolling_max
    max_drawdown = drawdowns.min()
    
    trough_idx = drawdowns.idxmin()
    peak_idx = prices.loc[:trough_idx].idxmax()
    
    if pd.api.types.is_datetime64_any_dtype(prices.index):
        duration = (trough_idx - peak_idx).days
        peak_str = peak_idx.isoformat()
        trough_str = trough_idx.isoformat()
    else:
        duration = int(trough_idx - peak_idx)
        peak_str = str(peak_idx)
        trough_str = str(trough_idx)
    
    return {
        "max_drawdown": float(max_drawdown),
        "peak_date": peak_str,
        "trough_date": trough_str,
        "duration_days": duration
    }

def compute_correlation_matrix(returns_df: pd.DataFrame) -> pd.DataFrame:
    """Compute correlation matrix."""
    return returns_df.corr()

def compute_beta(asset_returns: pd.Series, market_returns: pd.Series) -> float:
    """Compute beta using OLS slope."""
    cov = asset_returns.cov(market_returns)
    var = market_returns.var()
    if var == 0:
        return 0.0
    return float(cov / var)

def compute_var_95(returns: pd.Series) -> float:
    """Compute historical 95th percentile VaR."""
    if len(returns.dropna()) == 0:
        return 0.0
    return float(np.percentile(returns.dropna(), 5))

def compute_rolling_volatility(returns: pd.Series, window: int = 30) -> pd.Series:
    """Compute rolling volatility (rolling std x sqrt(252))."""
    return returns.rolling(window=window).std() * np.sqrt(252)

def compute_portfolio_metrics(returns_df: pd.DataFrame, weights: Dict[str, float]) -> Dict[str, Any]:
    """Compute weighted portfolio metrics."""
    weight_array = np.array([weights.get(col, 0) for col in returns_df.columns])
    total_weight = np.sum(weight_array)
    if total_weight > 0:
        weight_array = weight_array / total_weight
    
    port_returns = returns_df.dot(weight_array)
    
    ann_ret = port_returns.mean() * 252 
    ann_vol = port_returns.std() * np.sqrt(252)
    
    ind_vols = returns_df.std() * np.sqrt(252)
    weighted_avg_vol = np.dot(ind_vols, weight_array)
    div_benefit = weighted_avg_vol - ann_vol
    
    return {
        "annualized_return": float(ann_ret),
        "annualized_volatility": float(ann_vol),
        "diversification_benefit": float(div_benefit)
    }
