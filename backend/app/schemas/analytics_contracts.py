"""
Pydantic contracts validating API requests and serializing quantitative outputs.
"""
from pydantic import BaseModel, Field
from typing import Optional, Dict, List, Any


class AnalyzePortfolioRequest(BaseModel):
    tickers: List[str] = Field(..., description="List of target stock or ETF ticker symbols")
    start_date: str = Field(..., description="Start date (YYYY-MM-DD)")
    end_date: str = Field(..., description="End date (YYYY-MM-DD)")
    weights: Optional[Dict[str, float]] = Field(None, description="Portfolio weights per asset (sum to 1.0)")
    risk_free_rate: float = Field(0.045, description="Annualized benchmark risk-free rate proxy")


class DrawdownHorizon(BaseModel):
    peak_date: Optional[str] = None
    trough_date: Optional[str] = None
    duration_days: int = 0


class SingleAssetRiskMetrics(BaseModel):
    annualized_return: Optional[float] = None
    annualized_volatility: Optional[float] = None
    sharpe_ratio: Optional[float] = None
    sortino_ratio: Optional[float] = None
    max_drawdown: Optional[float] = None
    max_drawdown_details: Optional[DrawdownHorizon] = None
    beta: Optional[float] = None
    var_95: Optional[float] = None
    currency: str = "USD"
    latest_price: Optional[float] = None


class PortfolioCovarianceMetrics(BaseModel):
    annualized_return: float
    annualized_volatility: float
    diversification_benefit: float


class DailyTimeseriesRecord(BaseModel):
    date: str
    price: Optional[float] = None
    rolling_vol_30: Optional[float] = None
    rolling_vol_90: Optional[float] = None
    drawdown: Optional[float] = None


class AnalyzePortfolioResponse(BaseModel):
    metrics: Dict[str, SingleAssetRiskMetrics]
    portfolio_metrics: Optional[PortfolioCovarianceMetrics] = None
    time_series: Dict[str, List[DailyTimeseriesRecord]]


class BacktestSimulationRequest(BaseModel):
    ticker: str = Field(..., description="Primary asset or strategy ticker")
    strategy_type: str = Field(..., description="'momentum' | 'sector' | 'diversification'")
    params: Dict[str, Any] = Field(default_factory=dict)


class BacktestSimulationResponse(BaseModel):
    strategy_results: Dict[str, Any]
    signals: Optional[List[Dict[str, Any]]] = None
    comparison_metrics: Optional[Dict[str, Any]] = None


class CorrelationMatrixResponse(BaseModel):
    matrix: Dict[str, Dict[str, Optional[float]]]
    tickers: List[str]
