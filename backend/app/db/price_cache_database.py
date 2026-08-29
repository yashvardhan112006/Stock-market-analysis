"""
SQLite local cache database manager for historical asset timeseries.
Minimizes upstream network requests and protects against provider rate-limiting.
"""
import sqlite3
import pandas as pd
from datetime import datetime, timedelta
from typing import Optional
from backend.app.core.market_universe_config import DATABASE_URL, CACHE_TTL_HOURS


def get_db_connection() -> sqlite3.Connection:
    DATABASE_URL.parent.mkdir(parents=True, exist_ok=True)
    return sqlite3.connect(DATABASE_URL)


def init_price_cache_db() -> None:
    """Ensure SQLite schema exists for daily asset OHLCV records."""
    conn = get_db_connection()
    with conn:
        conn.execute("""
            CREATE TABLE IF NOT EXISTS price_data (
                ticker TEXT,
                date TEXT,
                open REAL,
                high REAL,
                low REAL,
                close REAL,
                adj_close REAL,
                volume INTEGER,
                fetched_at TIMESTAMP,
                PRIMARY KEY (ticker, date)
            )
        """)
        conn.execute("CREATE INDEX IF NOT EXISTS idx_ticker_date ON price_data(ticker, date)")
    conn.close()


def is_price_cache_fresh(ticker: str, max_age_hours: int = CACHE_TTL_HOURS) -> bool:
    """Return True if local timeseries data was updated within max_age_hours."""
    if not DATABASE_URL.exists():
        return False

    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT MAX(fetched_at) FROM price_data WHERE ticker = ?", (ticker.upper(),))
    row = cursor.fetchone()
    conn.close()

    if not row or not row[0]:
        return False

    try:
        last_fetched = datetime.fromisoformat(row[0])
        return (datetime.now() - last_fetched) < timedelta(hours=max_age_hours)
    except (ValueError, TypeError):
        return False


def load_cached_price_series(ticker: str, start_date: str, end_date: str) -> Optional[pd.DataFrame]:
    """Load daily OHLCV rows for a given ticker between start_date and end_date."""
    if not DATABASE_URL.exists():
        return None

    conn = get_db_connection()
    query = """
        SELECT date, open as Open, high as High, low as Low, close as Close, 
               adj_close as "Adj Close", volume as Volume
        FROM price_data 
        WHERE ticker = ? AND date >= ? AND date <= ?
        ORDER BY date ASC
    """
    df = pd.read_sql_query(query, conn, params=(ticker.upper(), start_date, end_date))
    conn.close()

    if df.empty:
        return None

    df["date"] = pd.to_datetime(df["date"])
    df.set_index("date", inplace=True)
    return df


def persist_price_series(ticker: str, df: pd.DataFrame) -> None:
    """Store or update daily OHLCV dataframe in the SQLite cache."""
    if df.empty:
        return

    df_copy = df.copy()
    df_copy["ticker"] = ticker.upper()
    df_copy["date"] = df_copy.index.strftime("%Y-%m-%d")

    col_map = {
        "Open": "open",
        "High": "high",
        "Low": "low",
        "Close": "close",
        "Adj Close": "adj_close",
        "Volume": "volume",
    }
    df_copy.rename(columns=col_map, inplace=True)

    expected = ["ticker", "date", "open", "high", "low", "close", "adj_close", "volume"]
    for col in expected:
        if col not in df_copy.columns:
            df_copy[col] = None

    df_copy["fetched_at"] = datetime.now().isoformat()
    records = df_copy[expected + ["fetched_at"]].to_dict("records")

    conn = get_db_connection()
    with conn:
        conn.executemany("""
            INSERT OR REPLACE INTO price_data (ticker, date, open, high, low, close, adj_close, volume, fetched_at)
            VALUES (:ticker, :date, :open, :high, :low, :close, :adj_close, :volume, :fetched_at)
        """, records)
    conn.close()
