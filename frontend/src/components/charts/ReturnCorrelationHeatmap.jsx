import React from 'react';
import { formatNumber } from '../../utils/financialFormatters';

const ReturnCorrelationHeatmap = ({ data }) => {
  if (!data) return null;

  const tickers = Object.keys(data);
  if (!tickers.length) return null;

  const getCellColor = (val) => {
    if (val === null || val === undefined) return 'var(--color-bg-primary)';
    if (val === 1.0) return 'var(--color-bg-elevated)';

    if (val < 0) {
      const alpha = Math.min(Math.abs(val) * 0.85, 0.9);
      return `rgba(59, 130, 246, ${alpha})`;
    } else {
      const alpha = Math.min(val * 0.85, 0.9);
      return `rgba(239, 68, 68, ${alpha})`;
    }
  };

  return (
    <div className="bg-bg-surface rounded-lg border border-border p-5 shadow-lg shadow-black/20 overflow-x-auto">
      <div className="mb-4">
        <h3 className="text-base font-semibold text-text-primary">Pearson Return Correlation Matrix</h3>
        <p className="text-xs text-text-secondary">Pairwise daily returns correlation for diversification diagnosis</p>
      </div>

      <div className="inline-block min-w-full">
        <div
          className="grid"
          style={{ gridTemplateColumns: `minmax(70px, auto) repeat(${tickers.length}, minmax(48px, 1fr))` }}
        >
          <div className="p-2" />
          {tickers.map((ticker) => (
            <div key={ticker} className="p-2 text-center text-xs font-semibold text-text-secondary truncate">
              {ticker}
            </div>
          ))}

          {tickers.map((rowTicker) => (
            <React.Fragment key={rowTicker}>
              <div className="p-2 text-right text-xs font-semibold text-text-secondary flex items-center justify-end truncate pr-3">
                {rowTicker}
              </div>
              {tickers.map((colTicker) => {
                const val = data[rowTicker]?.[colTicker];
                const bgStyle = getCellColor(val);
                return (
                  <div
                    key={`${rowTicker}-${colTicker}`}
                    className="p-2 m-0.5 rounded text-center text-xs font-medium flex items-center justify-center transition-all hover:scale-105 cursor-default"
                    style={{ backgroundColor: bgStyle }}
                    title={`${rowTicker} vs ${colTicker}: ${formatNumber(val, 3)}`}
                  >
                    <span className={Math.abs(val || 0) > 0.5 && val !== 1 ? 'text-white' : 'text-text-primary'}>
                      {val !== undefined && val !== null ? formatNumber(val, 2) : '-'}
                    </span>
                  </div>
                );
              })}
            </React.Fragment>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ReturnCorrelationHeatmap;
