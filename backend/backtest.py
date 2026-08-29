import pandas as pd
import numpy as np
from typing import Dict, Any, List
from backend.metrics import (
    compute_annualized_return,
    compute_annualized_volatility,
    compute_max_drawdown,
    compute_sharpe_ratio
)

def momentum_backtest(prices: pd.Series, short_window: int = 50, long_window: int = 200, tx_cost: float = 0.001) -> Dict[str, Any]:
    """
    Simulate a moving average crossover strategy.
    Buys on golden cross, sells (goes to cash) on death cross.
    """
    df = prices.to_frame(name='price')
    df['short_sma'] = df['price'].rolling(window=short_window).mean()
    df['long_sma'] = df['price'].rolling(window=long_window).mean()
    
    # Signal is 1 if short > long, else 0
    df['signal'] = 0
    df.loc[df['short_sma'] > df['long_sma'], 'signal'] = 1
    
    # Compute daily returns
    df['return'] = df['price'].pct_change()
    
    # Strategy return is previous day's signal * today's return
    df['strategy_return'] = df['signal'].shift(1) * df['return']
    
    # Apply transaction costs on trades
    df['trade'] = df['signal'].diff().abs()
    df.loc[df['trade'] > 0, 'strategy_return'] -= tx_cost
    
    # Fill NaNs
    df['strategy_return'] = df['strategy_return'].fillna(0)
    df['return'] = df['return'].fillna(0)
    
    # Cumulative returns
    df['strat_cum'] = (1 + df['strategy_return']).cumprod() * 100
    df['bench_cum'] = (1 + df['return']).cumprod() * 100
    
    # Metrics
    strat_prices = df['strat_cum']
    strat_returns = df['strategy_return']
    bench_returns = df['return']
    
    strategy_metrics = {
        "annualized_return": float(compute_annualized_return(strat_prices)),
        "annualized_volatility": float(compute_annualized_volatility(strat_returns)),
        "sharpe_ratio": float(compute_sharpe_ratio(strat_returns)),
        "max_drawdown": compute_max_drawdown(strat_prices)["max_drawdown"]
    }
    
    # Signals for JSON
    signals = []
    trade_days = df[df['trade'] > 0]
    for date, row in trade_days.iterrows():
        sig_type = "BUY" if row['signal'] == 1 else "SELL"
        date_str = date.isoformat() if hasattr(date, 'isoformat') else str(date)
        signals.append({
            "date": date_str,
            "type": sig_type,
            "price": float(row['price'])
        })
        
    # Serialize series for JSON
    strat_cum_list = [{"date": d.isoformat() if hasattr(d, 'isoformat') else str(d), "value": float(v)} for d, v in df['strat_cum'].items()]
    bench_cum_list = [{"date": d.isoformat() if hasattr(d, 'isoformat') else str(d), "value": float(v)} for d, v in df['bench_cum'].items()]
        
    return {
        "strategy_cumulative_returns": strat_cum_list,
        "benchmark_cumulative_returns": bench_cum_list,
        "strategy_metrics": strategy_metrics,
        "signals": signals
    }

def sector_comparison(prices_dict: Dict[str, pd.Series], sector_map: Dict[str, str], rf_rate: float = 0.045) -> Dict[str, Any]:
    """
    Group tickers by sector and compute average metrics.
    """
    sector_metrics = {}
    
    # First, calculate returns for each ticker
    ticker_metrics = {}
    for ticker, prices in prices_dict.items():
        returns = prices.pct_change().dropna()
        ticker_metrics[ticker] = {
            "ann_ret": compute_annualized_return(prices),
            "ann_vol": compute_annualized_volatility(returns),
            "sharpe": compute_sharpe_ratio(returns, rf_rate)
        }
        
    # Group by sector
    sectors = set(sector_map.values())
    for sector in sectors:
        sector_tickers = [t for t, s in sector_map.items() if s == sector and t in ticker_metrics]
        if not sector_tickers:
            continue
            
        avg_ret = np.mean([ticker_metrics[t]["ann_ret"] for t in sector_tickers])
        avg_vol = np.mean([ticker_metrics[t]["ann_vol"] for t in sector_tickers])
        avg_sharpe = np.mean([ticker_metrics[t]["sharpe"] for t in sector_tickers])
        
        sector_metrics[sector] = {
            "tickers": sector_tickers,
            "annualized_return": float(avg_ret),
            "annualized_volatility": float(avg_vol),
            "sharpe_ratio": float(avg_sharpe)
        }
        
    return {
        "per_sector": sector_metrics,
        "summary": "Sector comparison complete."
    }

def diversification_analysis(prices_df: pd.DataFrame, add_order: List[str]) -> Dict[str, Any]:
    """
    Add assets one by one with equal weights, compute portfolio vol at each step.
    """
    steps = []
    current_tickers = []
    
    returns_df = prices_df.pct_change().dropna()
    
    for ticker in add_order:
        if ticker not in returns_df.columns:
            continue
            
        current_tickers.append(ticker)
        
        # Equal weights
        weights = np.ones(len(current_tickers)) / len(current_tickers)
        
        port_returns = returns_df[current_tickers].dot(weights)
        port_vol = port_returns.std() * np.sqrt(252)
        
        ind_vols = returns_df[current_tickers].std() * np.sqrt(252)
        weighted_avg_vol = np.dot(ind_vols, weights)
        
        div_benefit = weighted_avg_vol - port_vol
        
        steps.append({
            "num_assets": len(current_tickers),
            "tickers": list(current_tickers),
            "portfolio_vol": float(port_vol),
            "weighted_avg_vol": float(weighted_avg_vol),
            "diversification_benefit": float(div_benefit)
        })
        
    return {"steps": steps}
