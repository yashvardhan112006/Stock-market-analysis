import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { CHART_PALETTE } from '../../constants/marketDefaults';
import { formatCurrency, formatDate } from '../../utils/financialFormatters';

const AssetPriceHistoryChart = ({ data, currency = 'USD' }) => {
  if (!data || !data.length) return null;

  const tickers = Object.keys(data[0]).filter((k) => k !== 'date');
  const currencySymbol = currency === 'INR' ? '₹' : (currency === 'MIXED' ? '' : '$');
  const chartTitle = currency === 'MIXED'
    ? 'Historical Price Trajectory (Multi-Currency)'
    : `Historical Price Trajectory (${currencySymbol})`;

  return (
    <div className="bg-bg-surface rounded-lg border border-border p-5 shadow-lg shadow-black/20">
      <div className="flex flex-wrap justify-between items-center mb-4 gap-2">
        <div>
          <h3 className="text-base font-semibold text-text-primary">{chartTitle}</h3>
          <p className="text-xs text-text-secondary">Unadjusted market prices in native quote currency</p>
        </div>
        <span className="text-xs text-text-secondary border border-border px-2.5 py-1 rounded bg-bg-primary">
          {tickers.length} Assets Selected
        </span>
      </div>

      <div className="h-[380px] w-full">
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
              tickFormatter={(val) => {
                if (val >= 100000 && currency === 'INR') return `₹${(val / 100000).toFixed(1)}L`;
                if (val >= 1000) return `${currencySymbol}${(val / 1000).toFixed(1)}K`;
                return `${currencySymbol}${val.toFixed(0)}`;
              }}
              domain={['auto', 'auto']}
              width={65}
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
              formatter={(value, name) => [formatCurrency(value, currency), name]}
            />
            <Legend wrapperStyle={{ paddingTop: '16px', fontSize: '12px' }} />
            {tickers.map((ticker, idx) => (
              <Line
                key={ticker}
                type="monotone"
                dataKey={ticker}
                stroke={CHART_PALETTE[idx % CHART_PALETTE.length]}
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4 }}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default AssetPriceHistoryChart;
