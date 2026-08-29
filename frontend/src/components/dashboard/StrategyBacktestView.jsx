import React, { useState } from 'react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import MarketTakeawayCard from '../common/MarketTakeawayCard';
import { formatPercent, formatNumber, formatDate } from '../../utils/financialFormatters';

const StrategyBacktestView = ({ data }) => {
  const [activeStrategy, setActiveStrategy] = useState('sector');

  if (!data) return null;

  const tabs = [
    { id: 'sector', label: 'Sector Factor Comparison' },
    { id: 'momentum', label: 'Momentum vs Buy & Hold' },
    { id: 'diversification', label: 'Diversification Frontier' },
  ];

  return (
    <div className="bg-bg-surface rounded-lg border border-border p-5 shadow-lg shadow-black/20">
      <div className="flex flex-wrap justify-between items-center border-b border-border pb-3 mb-4 gap-2">
        <div>
          <h3 className="text-base font-semibold text-text-primary">Quantitative Hypothesis Backtesting</h3>
          <p className="text-xs text-text-secondary">Empirical evaluation of factor regimes and asset allocation models</p>
        </div>

        <div className="flex bg-bg-primary rounded-lg p-1 border border-border">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveStrategy(tab.id)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
                activeStrategy === tab.id
                  ? 'bg-accent-blue text-white shadow-sm'
                  : 'text-text-secondary hover:text-text-primary'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div>
        {activeStrategy === 'sector' && (
          <div className="space-y-4">
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.sector_comparison || []} margin={{ top: 15, right: 30, left: 10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} opacity={0.6} />
                  <XAxis dataKey="sector" stroke="var(--color-text-secondary)" tick={{ fill: 'var(--color-text-secondary)', fontSize: 11 }} />
                  <YAxis yAxisId="left" orientation="left" stroke="#3b82f6" tickFormatter={(v) => `${(v * 100).toFixed(0)}%`} width={55} />
                  <YAxis yAxisId="right" orientation="right" stroke="#10b981" width={45} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'var(--color-bg-elevated)',
                      borderColor: 'var(--color-border)',
                      borderRadius: '6px',
                      color: 'var(--color-text-primary)',
                      fontSize: '12px',
                    }}
                    formatter={(val, name) => [
                      name === 'CAGR' ? formatPercent(val) : formatNumber(val),
                      name,
                    ]}
                  />
                  <Legend wrapperStyle={{ paddingTop: '10px', fontSize: '12px' }} />
                  <Bar yAxisId="left" dataKey="return" name="CAGR" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                  <Bar yAxisId="right" dataKey="sharpe" name="Sharpe Ratio" fill="#10b981" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <MarketTakeawayCard
              title="Sector Attribution Takeaway"
              content="Sector concentration significantly shifts factor loadings. Technology ETFs generate elevated compound returns during expansionary monetary cycles, whereas Energy and Fixed Income offer asymmetric hedge characteristics during inflationary and recessionary regimes."
            />
          </div>
        )}

        {activeStrategy === 'momentum' && (
          <div className="space-y-4">
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data.momentum_strategy || []} margin={{ top: 10, right: 30, left: 10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} opacity={0.6} />
                  <XAxis
                    dataKey="date"
                    stroke="var(--color-text-secondary)"
                    tick={{ fill: 'var(--color-text-secondary)', fontSize: 11 }}
                    tickFormatter={(val) => {
                      const d = new Date(val);
                      return `${d.toLocaleString('default', { month: 'short' })} ${d.getFullYear().toString().slice(-2)}`;
                    }}
                    minTickGap={45}
                  />
                  <YAxis stroke="var(--color-text-secondary)" domain={['auto', 'auto']} width={55} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'var(--color-bg-elevated)',
                      borderColor: 'var(--color-border)',
                      borderRadius: '6px',
                      color: 'var(--color-text-primary)',
                      fontSize: '12px',
                    }}
                    labelFormatter={(val) => formatDate(val)}
                    formatter={(value) => [formatNumber(value), 'Index Level (Base 100)']}
                  />
                  <Legend wrapperStyle={{ paddingTop: '10px', fontSize: '12px' }} />
                  <Line type="monotone" dataKey="strategy" name="50/200-SMA Momentum Strategy" stroke="#f59e0b" strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="benchmark" name="Buy & Hold Benchmark" stroke="#3b82f6" strokeWidth={2} strokeDasharray="4 4" dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="bg-bg-primary p-3 rounded-lg border border-border">
                <span className="text-[11px] text-text-secondary uppercase tracking-wider block">Strategy Sharpe</span>
                <span className="text-base font-bold text-accent-amber font-mono">
                  {formatNumber(data.momentum_metrics?.strategy_sharpe)}
                </span>
              </div>
              <div className="bg-bg-primary p-3 rounded-lg border border-border">
                <span className="text-[11px] text-text-secondary uppercase tracking-wider block">Strategy CAGR</span>
                <span className="text-base font-bold text-accent-amber font-mono">
                  {formatPercent(data.momentum_metrics?.strategy_return)}
                </span>
              </div>
              <div className="bg-bg-primary p-3 rounded-lg border border-border">
                <span className="text-[11px] text-text-secondary uppercase tracking-wider block">Strategy Max DD</span>
                <span className="text-base font-bold text-accent-red font-mono">
                  {formatPercent(data.momentum_metrics?.strategy_max_dd)}
                </span>
              </div>
              <div className="bg-bg-primary p-3 rounded-lg border border-border">
                <span className="text-[11px] text-text-secondary uppercase tracking-wider block">Transaction Slippage</span>
                <span className="text-base font-bold text-text-primary font-mono">10 bps / trade</span>
              </div>
            </div>

            <MarketTakeawayCard
              title="Momentum Strategy Rationale"
              content="Moving average trend rules mitigate major catastrophic tail risks by shifting capital to cash during protracted drawdowns. However, during choppy horizontal consolidation, whipsaw execution costs create moderate drag compared to passive buy-and-hold."
            />
          </div>
        )}

        {activeStrategy === 'diversification' && (
          <div className="space-y-4">
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data.diversification_effect || []} margin={{ top: 10, right: 30, left: 10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} opacity={0.6} />
                  <XAxis dataKey="assets_count" stroke="var(--color-text-secondary)" tick={{ fill: 'var(--color-text-secondary)', fontSize: 11 }} label={{ value: 'Number of Portfolio Holdings (N)', position: 'insideBottom', offset: -4, fill: 'var(--color-text-secondary)', fontSize: 11 }} />
                  <YAxis stroke="var(--color-text-secondary)" tickFormatter={(v) => `${(v * 100).toFixed(0)}%`} width={55} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'var(--color-bg-elevated)',
                      borderColor: 'var(--color-border)',
                      borderRadius: '6px',
                      color: 'var(--color-text-primary)',
                      fontSize: '12px',
                    }}
                    formatter={(val, name) => [formatPercent(val), name]}
                  />
                  <Legend wrapperStyle={{ paddingTop: '15px', fontSize: '12px' }} />
                  <Line type="monotone" dataKey="portfolio_volatility" name="Realized Portfolio Volatility (Covariance Effect)" stroke="#10b981" strokeWidth={2.5} dot={{ r: 4 }} />
                  <Line type="monotone" dataKey="avg_asset_volatility" name="Weighted Average Asset Volatility" stroke="#ef4444" strokeWidth={1.5} strokeDasharray="4 4" dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>

            <MarketTakeawayCard
              title="Markowitz Diversification Benefit"
              content="Adding uncorrelated assets lowers total portfolio variance towards the systematic market risk asymptote. Notice how realized volatility falls below the weighted average volatility of underlying components — mathematically proving the free lunch of asset diversification."
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default StrategyBacktestView;
