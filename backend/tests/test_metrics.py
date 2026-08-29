import pandas as pd
import numpy as np
from backend.metrics import (
    compute_sharpe_ratio,
    compute_max_drawdown,
    compute_correlation_matrix,
    compute_portfolio_metrics
)

def test_sharpe_ratio():
    returns = pd.Series([0.01, -0.02, 0.03, 0.01, 0.0])
    rf_rate = 0.045
    excess_returns = returns - (rf_rate / 252)
    expected = np.sqrt(252) * (excess_returns.mean() / returns.std())
    
    result = compute_sharpe_ratio(returns, rf_rate)
    assert np.isclose(result, expected)

def test_max_drawdown():
    prices = pd.Series([100, 110, 90, 95, 80, 100])
    res = compute_max_drawdown(prices)
    assert np.isclose(res["max_drawdown"], -30 / 110)
    assert res["peak_date"] == '1'
    assert res["trough_date"] == '4'

def test_correlation_matrix():
    df = pd.DataFrame({
        "A": [0.01, 0.02, -0.01, 0.03],
        "B": [0.02, 0.04, -0.02, 0.06]
    })
    res = compute_correlation_matrix(df)
    assert res.loc["A", "B"] == res.loc["B", "A"]
    assert np.isclose(res.loc["A", "A"], 1.0)
    assert np.isclose(res.loc["B", "B"], 1.0)

def test_portfolio_volatility():
    np.random.seed(42)
    df = pd.DataFrame({
        "A": np.random.normal(0.001, 0.02, 100),
        "B": np.random.normal(0.001, 0.02, 100)
    })
    weights = {"A": 0.5, "B": 0.5}
    res = compute_portfolio_metrics(df, weights)
    
    assert res["diversification_benefit"] > 0
