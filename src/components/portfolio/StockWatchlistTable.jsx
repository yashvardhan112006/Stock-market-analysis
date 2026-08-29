import React, { useState } from 'react';
import { formatCurrency, formatPercent } from '../../utils/financialFormatters';

const StockWatchlistTable = ({ watchlist, onAddWatch, onRemoveWatch, analysisData }) => {
  const [tickerInput, setTickerInput] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!tickerInput.trim()) return;
    onAddWatch(tickerInput.toUpperCase().trim());
    setTickerInput('');
  };

  return (
    <div className="w-full lg:w-[380px] bg-bg-surface rounded-lg border border-border p-5 shadow-lg shadow-black/20 flex flex-col h-full">
      <div className="mb-4">
        <h2 className="text-base font-semibold text-text-primary">Market Watchlist</h2>
        <p className="text-xs text-text-secondary">Track candidate symbols for cross-sectional comparison</p>
      </div>

      <div className="overflow-x-auto flex-1 mb-4">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-border text-text-secondary text-xs uppercase tracking-wider bg-bg-elevated/40">
              <th className="p-3 font-semibold">Symbol</th>
              <th className="p-3 font-semibold text-right">Price</th>
              <th className="p-3 font-semibold text-right">Ann. Vol</th>
              <th className="p-3 text-center" />
            </tr>
          </thead>
          <tbody className="text-text-primary text-xs divide-y divide-border/50">
            {watchlist.length === 0 ? (
              <tr>
                <td colSpan="4" className="p-6 text-center text-text-secondary">
                  Watchlist is empty.
                </td>
              </tr>
            ) : (
              watchlist.map((ticker) => {
                const metric = analysisData?.metrics?.[ticker];
                const currentPrice = metric?.latest_price;
                const currency = metric?.currency || (ticker.endsWith('.NS') || ticker.endsWith('.BO') ? 'INR' : 'USD');
                const vol = metric?.annualized_volatility;

                return (
                  <tr key={ticker} className="hover:bg-bg-elevated/50 transition-colors">
                    <td className="p-3 font-bold flex items-center gap-1.5">
                      <span>{ticker}</span>
                      <span className="text-[9px] uppercase px-1 py-0.2 rounded bg-bg-elevated text-text-secondary border border-border font-normal">
                        {currency}
                      </span>
                    </td>
                    <td className="p-3 text-right font-mono font-semibold">
                      {formatCurrency(currentPrice, currency)}
                    </td>
                    <td className="p-3 text-right font-mono text-text-secondary">
                      {formatPercent(vol)}
                    </td>
                    <td className="p-3 text-center">
                      <button
                        onClick={() => onRemoveWatch(ticker)}
                        className="text-text-secondary hover:text-accent-red transition-colors p-1 rounded"
                        title="Remove"
                      >
                        ✕
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      <form onSubmit={handleSubmit} className="flex gap-2 bg-bg-primary/50 p-3 rounded-lg border border-border/60 mt-auto">
        <input
          type="text"
          required
          placeholder="e.g. INFY.NS or TSLA"
          className="flex-1 bg-bg-surface border border-border rounded px-3 py-1.5 text-xs text-text-primary focus:outline-none focus:border-accent-blue"
          value={tickerInput}
          onChange={(e) => setTickerInput(e.target.value)}
        />
        <button
          type="submit"
          className="bg-accent-blue hover:bg-blue-500 text-white px-3.5 py-1.5 rounded text-xs font-semibold transition-colors"
        >
          Watch
        </button>
      </form>
    </div>
  );
};

export default StockWatchlistTable;
