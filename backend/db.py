import sqlite3
import pandas as pd
from datetime import datetime, timedelta
import os

DB_PATH = os.path.join(os.path.dirname(__file__), 'data', 'market_cache.db')

def init_db():
    """Initialize the SQLite database schema."""
    os.makedirs(os.path.dirname(DB_PATH), exist_ok=True)
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute("""
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
    conn.commit()
    conn.close()

def is_cache_fresh(ticker: str, max_age_hours: int = 24) -> bool:
    """Check if the cached data for a ticker is recent enough."""
    if not os.path.exists(DB_PATH):
        return False
    
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute("""
        SELECT MAX(fetched_at) FROM price_data WHERE ticker = ?
    """, (ticker,))
    row = cursor.fetchone()
    conn.close()
    
    if not row or not row[0]:
        return False
        
    last_fetched = datetime.fromisoformat(row[0])
    return datetime.now() - last_fetched < timedelta(hours=max_age_hours)

def get_cached_data(ticker: str, start_date: str, end_date: str) -> pd.DataFrame | None:
    """Retrieve cached data for a given ticker and date range."""
    if not os.path.exists(DB_PATH):
        return None
        
    conn = sqlite3.connect(DB_PATH)
    query = """
        SELECT date, open as Open, high as High, low as Low, close as Close, adj_close as "Adj Close", volume as Volume
        FROM price_data 
        WHERE ticker = ? AND date >= ? AND date <= ?
        ORDER BY date ASC
    """
    df = pd.read_sql_query(query, conn, params=(ticker, start_date, end_date))
    conn.close()
    
    if df.empty:
        return None
        
    df['date'] = pd.to_datetime(df['date'])
    df.set_index('date', inplace=True)
    return df

def save_data(ticker: str, df: pd.DataFrame):
    """Save ticker data to the SQLite cache."""
    if df.empty:
        return
        
    df_to_save = df.copy()
    df_to_save['ticker'] = ticker
    df_to_save['date'] = df_to_save.index.strftime('%Y-%m-%d')
    
    col_mapping = {
        'Open': 'open',
        'High': 'high',
        'Low': 'low',
        'Close': 'close',
        'Adj Close': 'adj_close',
        'Volume': 'volume'
    }
    df_to_save.rename(columns=col_mapping, inplace=True)
    
    expected_cols = ['ticker', 'date', 'open', 'high', 'low', 'close', 'adj_close', 'volume']
    for col in expected_cols:
        if col not in df_to_save.columns:
            df_to_save[col] = None
            
    df_to_save['fetched_at'] = datetime.now().isoformat()
    
    records = df_to_save[['ticker', 'date', 'open', 'high', 'low', 'close', 'adj_close', 'volume', 'fetched_at']].to_dict('records')
    
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.executemany("""
        REPLACE INTO price_data (ticker, date, open, high, low, close, adj_close, volume, fetched_at)
        VALUES (:ticker, :date, :open, :high, :low, :close, :adj_close, :volume, :fetched_at)
    """, records)
    conn.commit()
    conn.close()
