import React, { useState, useMemo } from 'react';
import DashboardHeader from './components/common/DashboardHeader';
import LoadingOverlay from './components/common/LoadingOverlay';
import MarketTakeawayCard from './components/common/MarketTakeawayCard';
import AssetFilterToolbar from './components/dashboard/AssetFilterToolbar';
import RiskReturnMetricsTable from './components/dashboard/RiskReturnMetricsTable';
import StrategyBacktestView from './components/dashboard/StrategyBacktestView';
import AssetPriceHistoryChart from './components/charts/AssetPriceHistoryChart';
import ReturnCorrelationHeatmap from './components/charts/ReturnCorrelationHeatmap';
import DrawdownUnderwaterChart from './components/charts/DrawdownUnderwaterChart';
import RollingVolatilityRegimesChart from './components/charts/RollingVolatilityRegimesChart';
import PortfolioManagementTab from './components/portfolio/PortfolioManagementTab';
import { useMarketAnalytics } from './hooks/useMarketAnalytics';
import { formatPercent, formatNumber } from './utils/financialFormatters';
import './App.css';

function App() {
  const analytics = useMarketAnalytics();
  const [activeTab, setActiveTab] = useState('analytics'); // 'analytics' | 'portfolio'

  // Dynamic quantitative commentary
  const diagnosticCommentary = useMemo(() => {
    if (!analytics.analysisData?.metrics) return null;
    const metrics = analytics.analysisData.metrics;
    const tickers = Object.keys(metrics);
    if (!tickers.length) return null;

    let highestSharpe = { ticker: '', val: -Infinity };
    let deepestDrawdown = { ticker: '', val: 0 };
    let highestCagr = { ticker: '', val: -Infinity };

    tickers.forEach((t) => {
      const m = metrics[t];
      if (m.sharpe_ratio != null && m.sharpe_ratio > highestSharpe.val) {
        highestSharpe = { ticker: t, val: m.sharpe_ratio };
      }
      if (m.max_drawdown != null && m.max_drawdown < deepestDrawdown.val) {
        deepestDrawdown = { ticker: t, val: m.max_drawdown };
      }
      if (m.annualized_return != null && m.annualized_return > highestCagr.val) {
        highestCagr = { ticker: t, val: m.annualized_return };
      }
    });

    const parts = [];
    if (highestCagr.ticker) {
      parts.push(
        `${highestCagr.ticker} led the basket with an annualized growth rate (CAGR) of ${formatPercent(highestCagr.val)}.`
      );
    }
    if (highestSharpe.ticker) {
      parts.push(
        `${highestSharpe.ticker} demonstrated superior risk-adjusted efficiency with a Sharpe Ratio of ${formatNumber(highestSharpe.val)}.`
      );
    }
    if (deepestDrawdown.ticker) {
      parts.push(
        `${deepestDrawdown.ticker} registered the deepest peak-to-trough decline of ${formatPercent(deepestDrawdown.val)}, highlighting tail-risk sensitivity.`
      );
    }

    const portStats = analytics.analysisData.portfolio_metrics;
    if (portStats?.diversification_benefit) {
      parts.push(
        `Portfolio covariance compression yielded a diversification benefit of ${formatPercent(portStats.diversification_benefit)} in volatility reduction.`
      );
    }

    return parts.join(' ');
  }, [analytics.analysisData]);

  return (
    <div className="min-h-screen bg-bg-primary text-text-primary flex flex-col font-sans selection:bg-accent-blue/30 selection:text-white">
      <DashboardHeader />

      {/* Navigation Mode Switcher */}
      <div className="bg-bg-surface border-b border-border">
        <div className="max-w-[1600px] mx-auto px-4 md:px-6 flex gap-4">
          <button
            onClick={() => setActiveTab('analytics')}
            className={`py-3 px-4 text-sm font-semibold border-b-2 transition-all flex items-center gap-2 ${
              activeTab === 'analytics'
                ? 'border-accent-blue text-accent-blue bg-bg-elevated/30'
                : 'border-transparent text-text-secondary hover:text-text-primary'
            }`}
          >
            <span>📊</span> Cross-Market Analytics
          </button>
          <button
            onClick={() => setActiveTab('portfolio')}
            className={`py-3 px-4 text-sm font-semibold border-b-2 transition-all flex items-center gap-2 ${
              activeTab === 'portfolio'
                ? 'border-accent-blue text-accent-blue bg-bg-elevated/30'
                : 'border-transparent text-text-secondary hover:text-text-primary'
            }`}
          >
            <span>💼</span> Portfolio Ledger & Watchlist
          </button>
        </div>
      </div>

      {/* Global Asset & Filter Toolbar */}
      <AssetFilterToolbar {...analytics} />

      <main className="flex-1 w-full max-w-[1600px] mx-auto p-4 md:p-6 grid gap-6 dashboard-grid relative">
        {analytics.loading && <LoadingOverlay overlay />}

        {analytics.error && (
          <div className="col-span-full bg-accent-red/10 border border-accent-red/40 text-accent-red p-4 rounded-lg flex items-start gap-3">
            <span className="text-lg">⚠</span>
            <div>
              <h3 className="font-semibold text-sm">Pipeline Notification</h3>
              <p className="text-xs mt-0.5 opacity-90">{analytics.error}</p>
            </div>
          </div>
        )}

        {/* Tab 1: Quantitative Analytics Dashboard */}
        {activeTab === 'analytics' && (
          <>
            {analytics.analysisData?.metrics && (
              <section className="col-span-full animate-fade-in" style={{ animationDelay: '0.05s' }}>
                <RiskReturnMetricsTable data={analytics.analysisData.metrics} />
              </section>
            )}

            {analytics.analysisData?.price_chart?.length > 0 && (
              <section className="col-span-full animate-fade-in" style={{ animationDelay: '0.1s' }}>
                <AssetPriceHistoryChart
                  data={analytics.analysisData.price_chart}
                  currency={analytics.analysisData.currency}
                />
              </section>
            )}

            {(analytics.correlationData || analytics.analysisData?.drawdowns?.length > 0) && (
              <section
                className="col-span-full grid grid-cols-1 lg:grid-cols-2 gap-6 animate-fade-in"
                style={{ animationDelay: '0.15s' }}
              >
                {analytics.correlationData && <ReturnCorrelationHeatmap data={analytics.correlationData} />}
                {analytics.analysisData?.drawdowns?.length > 0 && (
                  <DrawdownUnderwaterChart data={analytics.analysisData.drawdowns} />
                )}
              </section>
            )}

            {analytics.analysisData?.rolling_volatility?.length > 0 && (
              <section className="col-span-full animate-fade-in" style={{ animationDelay: '0.2s' }}>
                <RollingVolatilityRegimesChart data={analytics.analysisData.rolling_volatility} />
              </section>
            )}

            {analytics.backtestData && (
              <section className="col-span-full animate-fade-in" style={{ animationDelay: '0.25s' }}>
                <StrategyBacktestView data={analytics.backtestData} />
              </section>
            )}

            {diagnosticCommentary && (
              <section className="col-span-full animate-fade-in" style={{ animationDelay: '0.3s' }}>
                <MarketTakeawayCard title="Quantitative Diagnostic Commentary" content={diagnosticCommentary} />
              </section>
            )}

            {!analytics.analysisData && !analytics.loading && !analytics.error && (
              <div className="col-span-full flex flex-col items-center justify-center py-24 text-text-secondary">
                <div className="w-16 h-16 rounded-2xl bg-bg-surface border border-border flex items-center justify-center text-3xl mb-4 shadow-md">
                  📈
                </div>
                <h2 className="text-xl font-semibold mb-1 text-text-primary">
                  Ready for Quantitative Factor Analysis
                </h2>
                <p className="text-sm opacity-70 max-w-md text-center">
                  Select US or Indian securities (NSE/BSE) from the bar above and click{' '}
                  <strong className="text-accent-blue">"Run Analytics"</strong> to compute risk factor loadings,
                  drawdown horizons, and empirical strategy curves.
                </p>
              </div>
            )}
          </>
        )}

        {/* Tab 2: Position Ledger & Watchlist */}
        {activeTab === 'portfolio' && (
          <section className="col-span-full animate-fade-in">
            <PortfolioManagementTab analysisData={analytics.analysisData} />
          </section>
        )}
      </main>

      <footer className="text-center text-xs text-text-secondary py-4 border-t border-border mt-auto">
        Portfolio Risk & Returns Analytics · Institutional Factor Modeling for Indian (NSE/BSE) & US Equities
      </footer>
    </div>
  );
}

export default App;
