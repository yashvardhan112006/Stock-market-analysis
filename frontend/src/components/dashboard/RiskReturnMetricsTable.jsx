import React, { useState } from 'react';
import { formatCurrency, formatPercent, formatNumber } from '../../utils/financialFormatters';

const RiskReturnMetricsTable = ({ data }) => {
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });

  if (!data) return null;

  const rows = Object.entries(data).map(([ticker, metrics]) => ({
    ticker,
    ...metrics,
  }));

  const sortedRows = [...rows].sort((a, b) => {
    if (!sortConfig.key) return 0;
    const aVal = a[sortConfig.key];
    const bVal = b[sortConfig.key];
    if (aVal == null && bVal != null) return 1;
    if (aVal != null && bVal == null) return -1;
    if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
    if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
    return 0;
  });

  const requestSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const getMetricStyle = (val, type) => {
    if (val === null || val === undefined) return '';
    if (type === 'return') return val > 0 ? 'text-accent-green' : 'text-accent-red';
    if (type === 'ratio') return val > 1.0 ? 'text-accent-green' : (val < 0 ? 'text-accent-red' : '');
    return '';
  };

  const columns = [
    { key: 'ticker', label: 'Symbol' },
    {
      key: 'latest_price',
      label: 'Last Price',
      align: 'right',
      render: (r) => formatCurrency(r.latest_price, r.currency),
    },
    {
      key: 'annualized_return',
      label: 'CAGR (Ann.)',
      align: 'right',
      type: 'return',
      render: (r) => formatPercent(r.annualized_return),
    },
    {
      key: 'annualized_volatility',
      label: 'Volatility (Ann.)',
      align: 'right',
      render: (r) => formatPercent(r.annualized_volatility),
    },
    {
      key: 'sharpe_ratio',
      label: 'Sharpe Ratio',
      align: 'right',
      type: 'ratio',
      render: (r) => formatNumber(r.sharpe_ratio),
    },
    {
      key: 'sortino_ratio',
      label: 'Sortino Ratio',
      align: 'right',
      type: 'ratio',
      render: (r) => formatNumber(r.sortino_ratio),
    },
    {
      key: 'max_drawdown',
      label: 'Max Drawdown',
      align: 'right',
      render: (r) => formatPercent(r.max_drawdown),
    },
    {
      key: 'beta',
      label: 'Beta (vs SPY)',
      align: 'right',
      render: (r) => formatNumber(r.beta),
    },
    {
      key: 'var_95',
      label: '1D VaR (95%)',
      align: 'right',
      render: (r) => formatPercent(r.var_95),
    },
  ];

  return (
    <div className="bg-bg-surface rounded-lg border border-border overflow-hidden shadow-lg shadow-black/20">
      <div className="p-4 border-b border-border flex justify-between items-center bg-bg-elevated/30">
        <div>
          <h3 className="text-base font-semibold text-text-primary">Statistical Risk & Performance Factor Profile</h3>
          <p className="text-xs text-text-secondary">Ex-post risk-adjusted parameters calculated on historical trading days (252-day basis)</p>
        </div>
        <span className="text-xs text-text-secondary">Click headers to sort</span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm whitespace-nowrap">
          <thead className="bg-bg-elevated/80 border-b border-border">
            <tr>
              {columns.map((col) => (
                <th
                  key={col.key}
                  onClick={() => requestSort(col.key)}
                  className={`px-4 py-3 font-semibold text-xs text-text-secondary uppercase tracking-wider cursor-pointer hover:text-text-primary transition-colors ${
                    col.align === 'right' ? 'text-right' : 'text-left'
                  }`}
                >
                  <div className={`inline-flex items-center gap-1 ${col.align === 'right' ? 'justify-end' : ''}`}>
                    {col.label}
                    {sortConfig.key === col.key && (
                      <span className="text-accent-blue font-bold text-xs">
                        {sortConfig.direction === 'asc' ? '↑' : '↓'}
                      </span>
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border/60">
            {sortedRows.map((row, idx) => (
              <tr
                key={row.ticker}
                className={`hover:bg-bg-elevated/60 transition-colors ${
                  idx % 2 === 0 ? 'bg-bg-primary/20' : ''
                }`}
              >
                <td className="px-4 py-3 font-bold text-text-primary flex items-center gap-2">
                  <span>{row.ticker}</span>
                  <span className="text-[10px] uppercase px-1.5 py-0.5 rounded bg-bg-elevated text-text-secondary border border-border font-normal">
                    {row.currency || 'USD'}
                  </span>
                </td>
                {columns.slice(1).map((col) => (
                  <td
                    key={col.key}
                    className={`px-4 py-3 font-mono text-xs ${col.align === 'right' ? 'text-right' : 'text-left'} ${
                      col.type ? getMetricStyle(row[col.key], col.type) : 'text-text-primary'
                    }`}
                  >
                    {col.render ? col.render(row) : (row[col.key] ?? 'N/A')}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default RiskReturnMetricsTable;
