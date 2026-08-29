# Portfolio Risk & Returns Analytics Dashboard

A full-stack quantitative portfolio analytics platform designed for cross-market risk profiling, factor attribution, drawdown horizon analysis, and strategy backtesting. Supports global equity markets including US equities/ETFs and Indian securities (NSE/BSE).

---

## System Architecture

```text
├── backend/
│   ├── app/
│   │   ├── api/
│   │   │   └── analytics_endpoints.py            # REST endpoints for analysis, backtests, correlation
│   │   ├── core/
│   │   │   └── market_universe_config.py         # Curated ticker universe, sectors, and quant defaults
│   │   ├── db/
│   │   │   └── price_cache_database.py           # SQLite caching engine for historical timeseries
│   │   ├── schemas/
│   │   │   └── analytics_contracts.py            # Pydantic input/output validation contracts
│   │   ├── services/
│   │   │   ├── risk_metrics_calculator.py        # CAGR, Sharpe, Sortino, VaR, Beta, Drawdown math
│   │   │   ├── strategy_simulation_engine.py     # SMA momentum, sector dispersion, diversification curves
│   │   │   └── market_price_feed.py              # Yahoo Finance ingestion, gap alignment, and caching
│   │   └── server.py                             # FastAPI application factory and lifespan manager
│   ├── data/                                     # Local SQLite cache file (gitignored)
│   ├── tests/
│   │   ├── test_risk_metrics_calculator.py       # Mathematical tests for risk factors & ratios
│   │   └── test_strategy_simulation_engine.py    # Backtest simulation logic tests
│   ├── requirements.txt                          # Python dependencies
│   └── main.py                                   # Top-level ASGI entrypoint
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── charts/
│   │   │   │   ├── AssetPriceHistoryChart.jsx        # Historical prices in native currency (₹ / $)
│   │   │   │   ├── ReturnCorrelationHeatmap.jsx      # Pearson correlation matrix heatmap
│   │   │   │   ├── DrawdownUnderwaterChart.jsx       # Peak-to-trough drawdown curves
│   │   │   │   └── RollingVolatilityRegimesChart.jsx # 30d & 90d rolling volatility comparison
│   │   │   ├── common/
│   │   │   │   ├── DashboardHeader.jsx               # Navigation bar & market status tags
│   │   │   │   ├── LoadingOverlay.jsx                # Computation progress spinner
│   │   │   │   └── MarketTakeawayCard.jsx            # Dynamic diagnostic insight cards
│   │   │   ├── dashboard/
│   │   │   │   ├── AssetFilterToolbar.jsx            # Ticker search, time horizon, portfolio weights
│   │   │   │   ├── RiskReturnMetricsTable.jsx        # Sortable factor metrics table
│   │   │   │   └── StrategyBacktestView.jsx          # Hypothesis testing comparisons
│   │   │   └── portfolio/
│   │   │       ├── PortfolioHoldingsLedger.jsx       # User position sizes, buy cost, unrealized P&L
│   │   │       ├── StockWatchlistTable.jsx           # Monitored assets live price table
│   │   │       └── PortfolioManagementTab.jsx        # Tab integrating ledger & watchlist with localStorage
│   │   ├── constants/
│   │   │   └── marketDefaults.js                 # Time horizons (1D-ALL), default assets, color palette
│   │   ├── hooks/
│   │   │   └── useMarketAnalytics.js             # Pipeline state coordination hook
│   │   ├── services/
│   │   │   └── analyticsApiClient.js             # Axios HTTP client
│   │   ├── utils/
│   │   │   └── financialFormatters.js            # INR/USD, %, and number formatters
│   │   └── App.jsx                               # Top-level layout and navigation mode switcher
│   ├── package.json
│   └── vite.config.js                            # Vite bundler & backend proxy config
├── Makefile                                      # Developer shortcuts (make dev, make test, etc.)
├── start.sh                                      # One-command startup script
└── .gitignore
```

---

## Methodology & Quantitative Formulations

### 1. Compound Annual Growth Rate (CAGR)
Annualized geometric mean compounding rate based on actual calendar or trading day duration:
$$\text{CAGR} = \left(1 + R_{\text{total}}\right)^{\frac{1}{Y}} - 1$$
Where $Y = \frac{\Delta \text{days}}{365.25}$ for timestamped series, or $\frac{N}{252}$ for discrete trading sessions.

### 2. Annualized Volatility
Sample standard deviation of daily continuously compounded or arithmetic returns scaled to a 252-day trading year:
$$\sigma_{\text{ann}} = \sigma_{\text{daily}} \times \sqrt{252}$$

### 3. Risk-Adjusted Ratios
- **Sharpe Ratio**: Measures excess return per unit of total risk against the benchmark risk-free rate ($R_f = 4.5\%$ p.a.):
  $$\text{Sharpe} = \frac{\bar{R}_p - R_f}{\sigma_p} \times \sqrt{252}$$
- **Sortino Ratio**: Evaluates return against downside semi-deviation only ($\sigma_d$), ignoring upside variance:
  $$\text{Sortino} = \frac{\bar{R}_p - R_f}{\sqrt{\frac{1}{N}\sum_{t=1}^N \min(0, R_{p,t} - r_{f,\text{daily}})^2}} \times \sqrt{252}$$

### 4. Maximum Drawdown (MDD)
Evaluates peak-to-trough equity erosion and structural recovery horizons:
$$\text{DD}_t = \frac{P_t - \max_{\tau \le t} P_\tau}{\max_{\tau \le t} P_\tau}, \quad \text{MDD} = \min_{t} \text{DD}_t$$

### 5. Systematic Risk (Beta)
Estimated via Ordinary Least Squares (OLS) regression against the market benchmark ($SPY$):
$$\beta_i = \frac{\text{Cov}(R_i, R_m)}{\text{Var}(R_m)}$$

### 6. Historical Value-at-Risk (VaR 95%)
Empirical non-parametric quantile representing the single-day loss threshold at a 95% confidence level:
$$\text{VaR}_{0.95} = \text{Quantile}_{0.05}(R_i)$$

### 7. Markowitz Covariance Effect (Diversification Benefit)
Demonstrates the volatility compression achievable through imperfectly correlated assets:
$$\text{Diversification Benefit} = \sum_{i=1}^N w_i \sigma_i - \sqrt{\mathbf{w}^T \mathbf{\Sigma} \mathbf{w}}$$

---

## Getting Started

### Prerequisites
- Python 3.11+
- Node.js 18+ and npm

### Quick Launch (Recommended)
Run the automated startup script to install dependencies (if missing), start the backend and frontend servers, and launch the dashboard in your default browser:

```bash
./start.sh
```

### Manual Development Workflow

Using `make`:

```bash
# Install backend & frontend packages
make install

# Execute pytest quantitative test suite
make test

# Start backend server (FastAPI at http://localhost:8000)
make backend

# Start frontend server (Vite at http://localhost:5173)
make frontend

# Compile production bundle
make build
```

---

## Market Coverage & Symbol Resolution

The platform dynamically pulls adjusted closing prices across international venues:
- **US Equities & ETFs**: Standard tickers (e.g. `SPY`, `QQQ`, `AAPL`, `MSFT`, `TLT`, `GLD`)
- **National Stock Exchange of India (NSE)**: Add `.NS` suffix (e.g. `RELIANCE.NS`, `TCS.NS`, `INFY.NS`, `HDFCBANK.NS`, `^NSEI`)
- **Bombay Stock Exchange (BSE)**: Add `.BO` suffix (e.g. `TATASTEEL.BO`, `^BSESN`)

*Data is cached locally in SQLite for 24 hours to ensure high performance and eliminate upstream rate-limiting.*

---

## Testing

The backend includes numerical assertions verifying statistical metrics against theoretical benchmarks:

```bash
python3 -m pytest backend/tests/ -v
```

Test coverage includes:
- Sharpe and Sortino ratio calculations against analytical solutions
- Maximum drawdown peak/trough identification on synthetic step functions
- Pearson correlation matrix symmetry and unit diagonal properties
- Covariance contraction in equal-weight portfolio simulations
- OLS Beta slope estimation against leveraged synthetic market returns
- Historical 95% Value-at-Risk quantile boundaries
