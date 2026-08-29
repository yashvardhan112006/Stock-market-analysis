from backend.app.services.risk_metrics_calculator import (
    calculate_log_returns,
    calculate_normalized_wealth_index,
    calculate_cagr,
    calculate_annualized_volatility,
    calculate_sharpe_ratio,
    calculate_sortino_ratio,
    calculate_max_drawdown,
    calculate_correlation_matrix,
    calculate_beta_to_market,
    calculate_historical_var_95,
    calculate_rolling_volatility,
    calculate_portfolio_variance_and_benefit,
)
from backend.app.services.market_price_feed import download_aligned_asset_prices
from backend.app.services.strategy_simulation_engine import (
    simulate_moving_average_momentum,
    simulate_sector_performance_dispersion,
    simulate_diversification_volatility_frontier,
)

__all__ = [
    "calculate_log_returns",
    "calculate_normalized_wealth_index",
    "calculate_cagr",
    "calculate_annualized_volatility",
    "calculate_sharpe_ratio",
    "calculate_sortino_ratio",
    "calculate_max_drawdown",
    "calculate_correlation_matrix",
    "calculate_beta_to_market",
    "calculate_historical_var_95",
    "calculate_rolling_volatility",
    "calculate_portfolio_variance_and_benefit",
    "download_aligned_asset_prices",
    "simulate_moving_average_momentum",
    "simulate_sector_performance_dispersion",
    "simulate_diversification_volatility_frontier",
]
