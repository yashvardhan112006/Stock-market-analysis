"""
Market universe definition, quantitative defaults, and cross-market symbol resolution.
"""
from typing import List, Dict
from pathlib import Path

BACKEND_DIR = Path(__file__).resolve().parent.parent.parent
DATA_DIR = BACKEND_DIR / "data"
DATABASE_URL = DATA_DIR / "market_cache.db"

DEFAULT_RISK_FREE_RATE = 0.045  # 4.5% annual risk-free rate proxy (approx 3M T-Bill)
MARKET_BENCHMARK = "SPY"
CACHE_TTL_HOURS = 24

ASSET_UNIVERSE: List[Dict[str, str]] = [
    # US Equities & Sector ETFs
    {"ticker": "SPY", "name": "SPDR S&P 500 ETF", "sector": "Broad Market", "currency": "USD"},
    {"ticker": "QQQ", "name": "Invesco QQQ Trust (Nasdaq-100)", "sector": "Technology", "currency": "USD"},
    {"ticker": "XLK", "name": "Technology Select Sector SPDR", "sector": "Technology", "currency": "USD"},
    {"ticker": "XLE", "name": "Energy Select Sector SPDR", "sector": "Energy", "currency": "USD"},
    {"ticker": "TLT", "name": "iShares 20+ Year Treasury Bond ETF", "sector": "Fixed Income", "currency": "USD"},
    {"ticker": "AAPL", "name": "Apple Inc.", "sector": "Technology", "currency": "USD"},
    {"ticker": "MSFT", "name": "Microsoft Corporation", "sector": "Technology", "currency": "USD"},
    {"ticker": "GOOGL", "name": "Alphabet Inc.", "sector": "Technology", "currency": "USD"},
    {"ticker": "NVDA", "name": "NVIDIA Corporation", "sector": "Technology", "currency": "USD"},
    {"ticker": "GLD", "name": "SPDR Gold Shares", "sector": "Commodities", "currency": "USD"},

    # Indian Equities & Benchmarks (NSE / BSE)
    {"ticker": "^NSEI", "name": "Nifty 50 Index", "sector": "Broad Market", "currency": "INR"},
    {"ticker": "^BSESN", "name": "BSE Sensex Index", "sector": "Broad Market", "currency": "INR"},
    {"ticker": "RELIANCE.NS", "name": "Reliance Industries Ltd", "sector": "Energy", "currency": "INR"},
    {"ticker": "TCS.NS", "name": "Tata Consultancy Services", "sector": "Technology", "currency": "INR"},
    {"ticker": "INFY.NS", "name": "Infosys Ltd", "sector": "Technology", "currency": "INR"},
    {"ticker": "HDFCBANK.NS", "name": "HDFC Bank Ltd", "sector": "Financials", "currency": "INR"},
    {"ticker": "ICICIBANK.NS", "name": "ICICI Bank Ltd", "sector": "Financials", "currency": "INR"},
    {"ticker": "SBIN.NS", "name": "State Bank of India", "sector": "Financials", "currency": "INR"},
    {"ticker": "HINDUNILVR.NS", "name": "Hindustan Unilever Ltd", "sector": "Consumer Goods", "currency": "INR"},
    {"ticker": "ITC.NS", "name": "ITC Limited", "sector": "Consumer Goods", "currency": "INR"},
    {"ticker": "BHARTIARTL.NS", "name": "Bharti Airtel Ltd", "sector": "Telecommunications", "currency": "INR"},
    {"ticker": "TATAMOTORS.NS", "name": "Tata Motors Ltd", "sector": "Automotive", "currency": "INR"},
]

SECTOR_MAPPING: Dict[str, str] = {item["ticker"]: item["sector"] for item in ASSET_UNIVERSE}


def resolve_currency(ticker: str) -> str:
    """Determine quoting currency (INR for Indian venues, USD otherwise)."""
    t = ticker.upper()
    if t.endswith(".NS") or t.endswith(".BO") or t.startswith("^NSE") or t.startswith("^BSE"):
        return "INR"
    return "USD"
