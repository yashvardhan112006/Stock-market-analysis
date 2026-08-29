import pandas as pd
import numpy as np
from backend.app.services.risk_metrics_calculator import (
    calculate_sharpe_ratio,
    calculate_sortino_ratio,
    calculate_max_drawdown,
    calculate_correlation_matrix,
    calculate_portfolio_variance_and_benefit,
    calculate_beta_to_market,
    calculate_historical_var_95,
)


def test_sharpe_ratio():
    returns = pd.Series([0.01, -0.02, 0.03, 0.01, 0.0])
    rf_rate = 0.045
    excess_returns = returns - (rf_rate / 252)
    expected = np.sqrt(252) * (excess_returns.mean() / returns.std(ddof=1))
    result = calculate_sharpe_ratio(returns, rf_rate)
    assert np.isclose(result, expected)


def test_sortino_ratio():
    returns = pd.Series([0.02, -0.01, 0.03, -0.02, 0.01, -0.005])
    rf_rate = 0.045
    result = calculate_sortino_ratio(returns, rf_rate)
    assert isinstance(result, float)
    assert result != 0.0


def test_max_drawdown():
    prices = pd.Series([100, 110, 90, 95, 80, 100])
    res = calculate_max_drawdown(prices)
    assert np.isclose(res["max_drawdown"], -30 / 110)
    assert res["peak_date"] == "1"
    assert res["trough_date"] == "4"


def test_correlation_matrix():
    df = pd.DataFrame({
        "A": [0.01, 0.02, -0.01, 0.03],
        "B": [0.02, 0.04, -0.02, 0.06],
    })
    res = calculate_correlation_matrix(df)
    assert np.isclose(res.loc["A", "B"], res.loc["B", "A"])
    assert np.isclose(res.loc["A", "A"], 1.0)
    assert np.isclose(res.loc["B", "B"], 1.0)


def test_beta_calculation():
    market = pd.Series([0.01, -0.02, 0.015, -0.01, 0.025])
    asset = market * 2.0
    beta = calculate_beta_to_market(asset, market)
    assert np.isclose(beta, 2.0)


def test_var_95():
    returns = pd.Series(np.linspace(-0.10, 0.10, 101))
    var = calculate_historical_var_95(returns)
    assert var < 0


def test_portfolio_volatility():
    np.random.seed(42)
    df = pd.DataFrame({
        "A": np.random.normal(0.001, 0.02, 100),
        "B": np.random.normal(0.001, 0.02, 100),
    })
    weights = {"A": 0.5, "B": 0.5}
    res = calculate_portfolio_variance_and_benefit(df, weights)
    assert res["diversification_benefit"] > 0
