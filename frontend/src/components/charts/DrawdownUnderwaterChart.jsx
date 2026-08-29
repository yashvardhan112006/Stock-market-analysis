import React, { useState } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { formatPercent, formatDate } from '../../utils/financialFormatters';

const DrawdownUnderwaterChart = ({ data }) => {
  const [selectedAsset, setSelectedAsset] = useState(null);

  if (!data || !data.length) return null;

  const tickers = Object.keys(data[0]).filter((k) => k !== 'date');
  const activeAsset = selectedAsset && tickers.includes(selectedAsset) ? selectedAsset : tickers[0];

  return (
    <div className="bg-bg-surface rounded-lg border border-border p-5 shadow-lg shadow-black/20 flex flex-col h-full">
      <div className="flex flex-wrap justify-between items-center mb-4 gap-2">
        <div>
          <h3 className="text-base font-semibold text-text-primary">Historical Drawdown Profile</h3>
          <p className="text-xs text-text-secondary">Underwater equity curve: peak-to-trough decline</p>
        </div>

        <div className="flex bg-bg-primary rounded-md border border-border overflow-hidden p-0.5 max-w-full overflow-x-auto">
          {tickers.map((ticker) => (
            <button
              key={ticker}
              onClick={() => setSelectedAsset(ticker)}
              className={`px-2.5 py-1 text-xs font-medium rounded transition-colors whitespace-nowrap ${
                activeAsset === ticker
                  ? 'bg-bg-elevated text-accent-blue font-semibold shadow-sm'
                  : 'text-text-secondary hover:text-text-primary'
              }`}
            >
              {ticker}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 w-full min-h-[260px]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 10, right: 30, left: 10, bottom: 5 }}>
            <defs>
              <linearGradient id="drawdownGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#ef4444" stopOpacity={0.35} />
                <stop offset="95%" stopColor="#ef4444" stopOpacity={0.02} />
              </linearGradient>
            </defs>
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
            <YAxis
              stroke="var(--color-text-secondary)"
              tick={{ fill: 'var(--color-text-secondary)', fontSize: 11 }}
              tickFormatter={(val) => `${(val * 100).toFixed(0)}%`}
              domain={['dataMin', 0]}
              width={55}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'var(--color-bg-elevated)',
                borderColor: 'var(--color-border)',
                borderRadius: '6px',
                color: 'var(--color-text-primary)',
                fontSize: '12px',
              }}
              labelFormatter={(val) => formatDate(val)}
              formatter={(value) => [formatPercent(value), `${activeAsset} Drawdown`]}
            />
            <Area
              type="monotone"
              dataKey={activeAsset}
              stroke="#ef4444"
              strokeWidth={2}
              fill="url(#drawdownGradient)"
              isAnimationActive={false}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default DrawdownUnderwaterChart;
