import pandas as pd
from backend.app.services.strategy_simulation_engine import (
    simulate_moving_average_momentum,
    simulate_sector_performance_dispersion,
)


def test_momentum_signals():
    prices = pd.Series([10, 12, 14, 16, 18, 20, 18, 16, 14, 12])
    res = simulate_moving_average_momentum(prices, short_window=2, long_window=4, tx_cost=0.0)

    signals = res["signals"]
    assert len(signals) == 2
    assert signals[0]["type"] == "BUY"
    assert signals[0]["price"] == 16
    assert signals[1]["type"] == "SELL"
    assert signals[1]["price"] == 16


def test_sector_comparison():
    prices_dict = {
        "A": pd.Series([100, 101, 102, 103]),
        "B": pd.Series([50, 51, 50, 52]),
        "C": pd.Series([10, 11, 12, 11]),
    }
    sector_map = {
        "A": "Tech",
        "B": "Tech",
        "C": "Energy",
    }

    res = simulate_sector_performance_dispersion(prices_dict, sector_map)
    per_sector = res["per_sector"]

    assert "Tech" in per_sector
    assert "Energy" in per_sector
    assert set(per_sector["Tech"]["tickers"]) == {"A", "B"}
    assert set(per_sector["Energy"]["tickers"]) == {"C"}
