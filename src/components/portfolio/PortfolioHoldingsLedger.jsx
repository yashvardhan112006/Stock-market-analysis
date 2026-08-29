import React, { useState } from 'react';
import { formatCurrency, formatPercent } from '../../utils/financialFormatters';

const PortfolioHoldingsLedger = ({ holdings, onAddHolding, onRemoveHolding, analysisData }) => {
  const [form, setForm] = useState({ ticker: '', qty: '', avgPrice: '' });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.ticker || !form.qty || !form.avgPrice) return;

    onAddHolding({
      ticker: form.ticker.toUpperCase().trim(),
      qty: parseFloat(form.qty),
      avgPrice: parseFloat(form.avgPrice),
    });
    setForm({ ticker: '', qty: '', avgPrice: '' });
  };

  let totalValueINR = 0;
  let totalValueUSD = 0;

  const enrichedHoldings = holdings.map((h, idx) => {
    const metricObj = analysisData?.metrics?.[h.ticker];
    const currentPrice = metricObj?.latest_price;
    const currency = metricObj?.currency || (h.ticker.endsWith('.NS') || h.ticker.endsWith('.BO') ? 'INR' : 'USD');

    let pnl = null;
    let pnlPct = null;
    let positionVal = null;

    if (currentPrice !== undefined && currentPrice !== null) {
      positionVal = currentPrice * h.qty;
      pnl = (currentPrice - h.avgPrice) * h.qty;
      pnlPct = h.avgPrice > 0 ? (currentPrice - h.avgPrice) / h.avgPrice : 0;

      if (currency === 'INR') totalValueINR += positionVal;
      else totalValueUSD += positionVal;
    }

    return {
      ...h,
      index: idx,
      currentPrice,
      currency,
      pnl,
      pnlPct,
      positionVal,
    };
  });

  return (
    <div className="flex-1 bg-bg-surface rounded-lg border border-border p-5 shadow-lg shadow-black/20 flex flex-col h-full">
      <div className="flex justify-between items-center mb-4">
        <div>
          <h2 className="text-base font-semibold text-text-primary">Portfolio Holdings Ledger</h2>
          <p className="text-xs text-text-secondary">Position weights, real-time unrealized P&L, and aggregate market valuation</p>
        </div>
        {!analysisData && (
          <span className="text-xs text-text-secondary border border-border px-2 py-0.5 rounded bg-bg-primary">
            Run analytics to populate live quotes
          </span>
        )}
      </div>

      <div className="overflow-x-auto flex-1 mb-4">
        <table className="w-full text-left border-collapse min-w-[620px]">
          <thead>
            <tr className="border-b border-border text-text-secondary text-xs uppercase tracking-wider bg-bg-elevated/40">
              <th className="p-3 font-semibold">Asset</th>
              <th className="p-3 font-semibold text-right">Shares</th>
              <th className="p-3 font-semibold text-right">Avg Cost</th>
              <th className="p-3 font-semibold text-right">Market Price</th>
              <th className="p-3 font-semibold text-right">Unrealized P&L</th>
              <th className="p-3 font-semibold text-right">Current Value</th>
              <th className="p-3 text-center" />
            </tr>
          </thead>
          <tbody className="text-text-primary text-xs divide-y divide-border/50">
            {enrichedHoldings.length === 0 ? (
              <tr>
                <td colSpan="7" className="p-6 text-center text-text-secondary">
                  No holdings recorded yet. Add your positions using the form below.
                </td>
              </tr>
            ) : (
              enrichedHoldings.map((h) => {
                const pnlColor = h.pnl > 0 ? 'text-accent-green' : (h.pnl < 0 ? 'text-accent-red' : 'text-text-secondary');
                return (
                  <tr key={h.index} className="hover:bg-bg-elevated/50 transition-colors">
                    <td className="p-3 font-bold flex items-center gap-1.5">
                      <span>{h.ticker}</span>
                      <span className="text-[10px] uppercase px-1 py-0.2 rounded bg-bg-elevated text-text-secondary font-normal border border-border">
                        {h.currency}
                      </span>
                    </td>
                    <td className="p-3 text-right font-mono">{h.qty.toLocaleString()}</td>
                    <td className="p-3 text-right font-mono">{formatCurrency(h.avgPrice, h.currency)}</td>
                    <td className="p-3 text-right font-mono">{formatCurrency(h.currentPrice, h.currency)}</td>
                    <td className={`p-3 text-right font-mono font-medium ${pnlColor}`}>
                      {h.pnl !== null ? (
                        <div className="flex flex-col items-end">
                          <span>{formatCurrency(h.pnl, h.currency)}</span>
                          <span className="text-[10px] opacity-80">{formatPercent(h.pnlPct, true)}</span>
                        </div>
                      ) : (
                        '-'
                      )}
                    </td>
                    <td className="p-3 text-right font-mono font-semibold">
                      {formatCurrency(h.positionVal, h.currency)}
                    </td>
                    <td className="p-3 text-center">
                      <button
                        onClick={() => onRemoveHolding(h.index)}
                        className="text-text-secondary hover:text-accent-red transition-colors p-1 rounded hover:bg-bg-primary"
                        title="Remove position"
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

      <div className="p-3 bg-bg-elevated/70 rounded-lg border border-border flex justify-between items-center mb-4">
        <span className="text-xs text-text-secondary uppercase tracking-wider font-semibold">
          Aggregate Portfolio Valuation:
        </span>
        <div className="text-right flex items-center gap-4">
          {totalValueINR > 0 && (
            <div className="flex items-baseline gap-1.5">
              <span className="text-xs text-text-secondary">INR:</span>
              <span className="text-sm font-bold text-text-primary font-mono">{formatCurrency(totalValueINR, 'INR')}</span>
            </div>
          )}
          {totalValueUSD > 0 && (
            <div className="flex items-baseline gap-1.5">
              <span className="text-xs text-text-secondary">USD:</span>
              <span className="text-sm font-bold text-text-primary font-mono">{formatCurrency(totalValueUSD, 'USD')}</span>
            </div>
          )}
          {totalValueINR === 0 && totalValueUSD === 0 && (
            <span className="text-xs text-text-secondary font-mono">-</span>
          )}
        </div>
      </div>

      <form onSubmit={handleSubmit} className="flex gap-2 flex-wrap items-end bg-bg-primary/50 p-3 rounded-lg border border-border/60">
        <div className="flex-1 min-w-[90px]">
          <label className="block text-[10px] uppercase tracking-wider text-text-secondary mb-1">Ticker</label>
          <input
            type="text"
            required
            placeholder="e.g. RELIANCE.NS"
            className="w-full bg-bg-surface border border-border rounded px-2.5 py-1.5 text-xs text-text-primary focus:outline-none focus:border-accent-blue"
            value={form.ticker}
            onChange={(e) => setForm({ ...form, ticker: e.target.value })}
          />
        </div>
        <div className="flex-1 min-w-[70px]">
          <label className="block text-[10px] uppercase tracking-wider text-text-secondary mb-1">Shares</label>
          <input
            type="number"
            step="any"
            required
            placeholder="10"
            className="w-full bg-bg-surface border border-border rounded px-2.5 py-1.5 text-xs text-text-primary focus:outline-none focus:border-accent-blue"
            value={form.qty}
            onChange={(e) => setForm({ ...form, qty: e.target.value })}
          />
        </div>
        <div className="flex-1 min-w-[80px]">
          <label className="block text-[10px] uppercase tracking-wider text-text-secondary mb-1">Avg Cost</label>
          <input
            type="number"
            step="any"
            required
            placeholder="2450.0"
            className="w-full bg-bg-surface border border-border rounded px-2.5 py-1.5 text-xs text-text-primary focus:outline-none focus:border-accent-blue"
            value={form.avgPrice}
            onChange={(e) => setForm({ ...form, avgPrice: e.target.value })}
          />
        </div>
        <button
          type="submit"
          className="bg-accent-blue hover:bg-blue-500 text-white px-4 py-1.5 rounded text-xs font-semibold transition-colors h-[32px]"
        >
          Add Position
        </button>
      </form>
    </div>
  );
};

export default PortfolioHoldingsLedger;
