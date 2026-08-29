import React, { useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { formatPercent, formatDate } from '../../utils/financialFormatters';

const RollingVolatilityRegimesChart = ({ data }) => {
  const [selectedAsset, setSelectedAsset] = useState(null);

  if (!data || !data.length) return null;

  const tickers = Array.from(
    new Set(
      Object.keys(data[0])
        .filter((k) => k !== 'date')
        .map((k) => k.replace(/_(30d|90d)$/, ''))
    )
  );

  const activeAsset = selectedAsset && tickers.includes(selectedAsset) ? selectedAsset : tickers[0];

  return (
    <div className="bg-bg-surface rounded-lg border border-border p-5 shadow-lg shadow-black/20">
      <div className="flex flex-wrap justify-between items-center mb-4 gap-2">
        <div>
          <h3 className="text-base font-semibold text-text-primary">Rolling Volatility Regimes</h3>
          <p className="text-xs text-text-secondary">30-day short-term vs 90-day structural annualized volatility</p>
        </div>

        <div className="flex items-center gap-2">
          <label className="text-xs text-text-secondary font-medium">Asset:</label>
          <select
            value={activeAsset}
            onChange={(e) => setSelectedAsset(e.target.value)}
            className="bg-bg-primary border border-border text-text-primary text-xs px-2.5 py-1.5 rounded-md focus:outline-none focus:border-accent-blue"
          >
            {tickers.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="h-[320px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 10, right: 30, left: 10, bottom: 5 }}>
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
              domain={['auto', 'auto']}
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
              formatter={(value, name) => [formatPercent(value), name]}
            />
            <Legend wrapperStyle={{ paddingTop: '16px', fontSize: '12px' }} />
            <Line
              type="monotone"
              dataKey={`${activeAsset}_30d`}
              name="30-Day Realized Volatility"
              stroke="#3b82f6"
              strokeWidth={2}
              dot={false}
            />
            <Line
              type="monotone"
              dataKey={`${activeAsset}_90d`}
              name="90-Day Realized Volatility"
              stroke="#8b5cf6"
              strokeWidth={2}
              strokeDasharray="4 4"
              dot={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default RollingVolatilityRegimesChart;
