import yfinance as yf
import pandas as pd
import logging
from backend.db import is_cache_fresh, get_cached_data, save_data

logger = logging.getLogger(__name__)

def fetch_prices(tickers: list[str], start_date: str, end_date: str) -> pd.DataFrame:
    """
    Fetch historical price data for a list of tickers.
    Checks SQLite cache first, falls back to yfinance if missing or stale.
    Returns DataFrame with Adjusted Close prices for each ticker.
    Aligns all tickers to common date index via inner join, ffill max 3 days.
    """
    data_frames = {}
    
    for ticker in tickers:
        df = None
        if is_cache_fresh(ticker):
            df = get_cached_data(ticker, start_date, end_date)
            
        if df is None or df.empty:
            try:
                logger.info(f"Fetching {ticker} from yfinance")
                yf_ticker = yf.Ticker(ticker)
                # Ensure we use auto_adjust=False to get 'Adj Close'
                df = yf_ticker.history(start=start_date, end=end_date, auto_adjust=False)
                if not df.empty:
                    df.index = pd.to_datetime(df.index).tz_localize(None)
                    save_data(ticker, df)
            except Exception as e:
                logger.warning(f"Failed to fetch data for {ticker}: {e}")
                continue
                
        if df is not None and not df.empty:
            if 'Adj Close' in df.columns:
                data_frames[ticker] = df['Adj Close']
            else:
                logger.warning(f"'Adj Close' not found for {ticker}")
            
    if not data_frames:
        return pd.DataFrame()
        
    combined_df = pd.DataFrame(data_frames)
    combined_df = combined_df.ffill(limit=3).dropna()
    
    return combined_df
