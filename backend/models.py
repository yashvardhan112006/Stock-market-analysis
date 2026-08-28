from pydantic import BaseModel, Field
from typing import Optional, Dict, List, Any

class AnalyzeRequest(BaseModel):
    tickers: List[str]
    start_date: str
    end_date: str
    weights: Optional[Dict[str, float]] = None
    risk_free_rate: float = 0.045

class AnalyzeResponse(BaseModel):
    metrics: Dict[str, Dict[str, Any]]
    portfolio_metrics: Optional[Dict[str, Any]] = None
    time_series: Dict[str, List[Dict[str, Any]]]

class BacktestRequest(BaseModel):
    ticker: str
    strategy_type: str  # "momentum", "sector", "diversification"
    params: Dict[str, Any]

class BacktestResponse(BaseModel):
    strategy_results: Dict[str, Any]
    signals: Optional[List[Dict[str, Any]]] = None
    comparison_metrics: Optional[Dict[str, Any]] = None

class CorrelationResponse(BaseModel):
    matrix: Dict[str, Dict[str, float]]
    tickers: List[str]
