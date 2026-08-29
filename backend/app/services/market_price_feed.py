"""
Market price downloader and timeseries alignment feed.
Downloads historical daily OHLCV from Yahoo Finance with SQLite caching.
"""
import yfinance as yf
import pandas as pd
import logging
from typing import List
from backend.app.db.price_cache_database import (
    is_price_cache_fresh,
    load_cached_price_series,
    persist_price_series,
)

logger = logging.getLogger(__name__)


def download_aligned_asset_prices(tickers: List[str], start_date: str, end_date: str) -> pd.DataFrame:
    """
    Fetch adjusted close prices for multiple international assets (NSE, BSE, US).
    Checks local SQLite cache first; falls back to Yahoo Finance for stale/missing dates.
    Aligns all series onto a common date index, forward-filling minor holiday gaps up to 3 days.
    """
    cleaned_tickers = [t.strip().upper() for t in tickers if t.strip()]
    if not cleaned_tickers:
        return pd.DataFrame()

    data_map = {}

    for ticker in cleaned_tickers:
        df = None
        if is_price_cache_fresh(ticker):
            df = load_cached_price_series(ticker, start_date, end_date)

        if df is None or df.empty:
            try:
                logger.info(f"Downloading {ticker} quotes from Yahoo Finance")
                yf_ticker = yf.Ticker(ticker)
                downloaded = yf_ticker.history(start=start_date, end=end_date, auto_adjust=False)

                if not downloaded.empty:
                    # Make tz-naive to ensure clean merge alignment across different exchanges
                    downloaded.index = pd.to_datetime(downloaded.index).tz_localize(None)
                    persist_price_series(ticker, downloaded)
                    df = downloaded
            except Exception as err:
                logger.warning(f"Failed to fetch market data for {ticker}: {err}")

        if df is not None and not df.empty:
            price_col = "Adj Close" if "Adj Close" in df.columns else "Close"
            if price_col in df.columns:
                series = df[price_col].copy()
                series.name = ticker
                # Filter to requested date window
                series = series.loc[
                    (series.index >= pd.to_datetime(start_date)) & 
                    (series.index <= pd.to_datetime(end_date))
                ]
                if not series.empty:
                    data_map[ticker] = series

    if not data_map:
        return pd.DataFrame()

    combined = pd.DataFrame(data_map)
    combined = combined.ffill(limit=3).dropna()

    return combined


# Compatibility alias
fetch_prices = download_aligned_asset_prices
