import React from 'react';
import CreatableSelect from 'react-select/creatable';
import { RANGE_PRESETS } from '../../constants/marketDefaults';

const AssetFilterToolbar = ({
  selectedTickers,
  setSelectedTickers,
  dateRange,
  setDateRange,
  activeRange,
  setRangePreset,
  weights,
  setWeights,
  portfolioMode,
  setPortfolioMode,
  riskFreeRate,
  setRiskFreeRate,
  runAnalysis,
  loading,
  availableTickers = [],
}) => {
  const customStyles = {
    control: (base, state) => ({
      ...base,
      backgroundColor: 'var(--color-bg-surface)',
      borderColor: state.isFocused ? 'var(--color-accent-blue)' : 'var(--color-border)',
      color: 'var(--color-text-primary)',
      minWidth: '260px',
      boxShadow: state.isFocused ? '0 0 0 1px var(--color-accent-blue)' : 'none',
      '&:hover': { borderColor: 'var(--color-accent-blue)' },
    }),
    menu: (base) => ({
      ...base,
      backgroundColor: 'var(--color-bg-surface)',
      border: '1px solid var(--color-border)',
      zIndex: 50,
    }),
    option: (base, state) => ({
      ...base,
      backgroundColor: state.isFocused ? 'var(--color-bg-elevated)' : 'var(--color-bg-surface)',
      color: 'var(--color-text-primary)',
      cursor: 'pointer',
      fontSize: '13px',
    }),
    multiValue: (base) => ({
      ...base,
      backgroundColor: 'var(--color-bg-elevated)',
      borderRadius: '4px',
    }),
    multiValueLabel: (base) => ({
      ...base,
      color: 'var(--color-text-primary)',
      fontWeight: 500,
      fontSize: '12px',
    }),
    multiValueRemove: (base) => ({
      ...base,
      color: 'var(--color-text-secondary)',
      '&:hover': {
        backgroundColor: 'var(--color-accent-red)',
        color: 'white',
      },
    }),
    input: (base) => ({
      ...base,
      color: 'var(--color-text-primary)',
    }),
    placeholder: (base) => ({
      ...base,
      color: 'var(--color-text-secondary)',
    }),
  };

  const tickerOptions = availableTickers.length
    ? availableTickers.map((t) => ({
        value: typeof t === 'string' ? t : t.ticker,
        label: typeof t === 'string' ? t : `${t.ticker} — ${t.name}`,
      }))
    : [];

  const currentOptions = selectedTickers.map((t) => {
    const found = tickerOptions.find((o) => o.value === t);
    return found || { value: t, label: t };
  });

  return (
    <div className="bg-bg-surface/80 backdrop-blur-sm p-4 border-b border-border sticky top-16 z-40">
      <div className="max-w-[1600px] mx-auto flex flex-wrap gap-4 items-end">
        {/* Ticker Search & Select */}
        <div className="flex-1 min-w-[280px]">
          <div className="flex justify-between items-center mb-1.5">
            <label className="block text-[11px] uppercase tracking-wider text-text-secondary font-medium">
              Portfolio Assets
            </label>
            <span className="text-[10px] text-text-secondary opacity-75">
              NSE: <code className="text-accent-blue">.NS</code> · BSE: <code className="text-accent-blue">.BO</code>
            </span>
          </div>
          <CreatableSelect
            isMulti
            options={tickerOptions}
            value={currentOptions}
            onChange={(opts) => setSelectedTickers((opts || []).map((o) => o.value.toUpperCase()))}
            onCreateOption={(inputValue) => {
              const ticker = inputValue.toUpperCase().trim();
              if (ticker && !selectedTickers.includes(ticker)) {
                setSelectedTickers([...selectedTickers, ticker]);
              }
            }}
            formatCreateLabel={(input) => `Add "${input.toUpperCase()}"`}
            styles={customStyles}
            placeholder="Search or enter any symbol (e.g. RELIANCE.NS, NVDA)..."
            className="text-sm"
            noOptionsMessage={() => 'Type any stock symbol and press Enter'}
          />
        </div>

        {/* Time Horizon Quick Buttons & Dropdown */}
        <div className="flex flex-col">
          <div className="flex justify-between items-center mb-1.5">
            <label className="block text-[11px] uppercase tracking-wider text-text-secondary font-medium">
              Time Horizon
            </label>
            <select
              value={activeRange || ''}
              onChange={(e) => {
                const preset = RANGE_PRESETS.find((p) => p.label === e.target.value);
                if (preset && setRangePreset) setRangePreset(preset);
              }}
              className="text-[11px] bg-bg-primary text-accent-blue font-medium rounded border border-border px-1.5 py-0.5 focus:outline-none focus:border-accent-blue"
            >
              <option value="" disabled>Quick select...</option>
              {RANGE_PRESETS.map((p) => (
                <option key={p.label} value={p.label}>
                  {p.label} ({p.days === 'ytd' ? 'YTD' : `${p.days}d`})
                </option>
              ))}
            </select>
          </div>
          <div className="flex bg-bg-primary rounded-lg p-0.5 border border-border flex-wrap gap-0.5">
            {RANGE_PRESETS.map((preset) => (
              <button
                key={preset.label}
                onClick={() => setRangePreset && setRangePreset(preset)}
                className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-all duration-150 ${
                  activeRange === preset.label
                    ? 'bg-accent-blue text-white shadow-sm'
                    : 'text-text-secondary hover:text-text-primary hover:bg-bg-elevated'
                }`}
              >
                {preset.label}
              </button>
            ))}
          </div>
        </div>

        {/* Date Inputs */}
        <div className="flex gap-2">
          <div className="flex flex-col">
            <label className="block text-[11px] uppercase tracking-wider text-text-secondary mb-1.5 font-medium">
              From
            </label>
            <input
              type="date"
              value={dateRange.start}
              onChange={(e) => setDateRange((prev) => ({ ...prev, start: e.target.value }))}
              className="bg-bg-primary border border-border text-text-primary text-sm px-2.5 py-1.5 rounded-md focus:outline-none focus:border-accent-blue"
            />
          </div>
          <div className="flex flex-col">
            <label className="block text-[11px] uppercase tracking-wider text-text-secondary mb-1.5 font-medium">
              To
            </label>
            <input
              type="date"
              value={dateRange.end}
              onChange={(e) => setDateRange((prev) => ({ ...prev, end: e.target.value }))}
              className="bg-bg-primary border border-border text-text-primary text-sm px-2.5 py-1.5 rounded-md focus:outline-none focus:border-accent-blue"
            />
          </div>
        </div>

        {/* Risk-Free Rate */}
        <div className="flex flex-col">
          <label className="block text-[11px] uppercase tracking-wider text-text-secondary mb-1.5 font-medium">
            Rf Rate (%)
          </label>
          <input
            type="number"
            step="0.1"
            min="0"
            max="25"
            value={riskFreeRate}
            onChange={(e) => setRiskFreeRate(parseFloat(e.target.value) || 0)}
            className="w-20 bg-bg-primary border border-border text-text-primary text-sm px-2.5 py-1.5 rounded-md focus:outline-none focus:border-accent-blue"
          />
        </div>

        {/* Portfolio Basket Mode Toggle */}
        <div className="flex items-end pb-1">
          <label className="flex items-center gap-2 cursor-pointer text-sm text-text-primary select-none">
            <div className="relative">
              <input
                type="checkbox"
                checked={portfolioMode}
                onChange={(e) => setPortfolioMode(e.target.checked)}
                className="sr-only"
              />
              <div
                className={`w-9 h-5 rounded-full transition-colors duration-200 ${
                  portfolioMode ? 'bg-accent-blue' : 'bg-border'
                }`}
              >
                <div
                  className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform duration-200 ${
                    portfolioMode ? 'translate-x-4' : 'translate-x-0.5'
                  }`}
                />
              </div>
            </div>
            <span className="text-xs font-medium">Weighted Basket</span>
          </label>
        </div>

        {/* Run Analysis Button */}
        <button
          onClick={runAnalysis}
          disabled={loading || selectedTickers.length === 0}
          className="ml-auto px-6 py-2.5 bg-accent-blue text-white font-semibold text-sm rounded-lg hover:bg-blue-500 active:scale-[0.98] transition-all duration-150 disabled:opacity-40 disabled:cursor-not-allowed shadow-lg shadow-accent-blue/20"
        >
          {loading ? (
            <span className="flex items-center gap-2">
              <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Analyzing...
            </span>
          ) : (
            'Run Analytics'
          )}
        </button>
      </div>

      {/* Weights Allocation Bar */}
      {portfolioMode && (
        <div className="max-w-[1600px] mx-auto mt-3 pt-3 border-t border-border">
          <div className="flex flex-wrap gap-4 items-center">
            <span className="text-[11px] uppercase tracking-wider text-text-secondary font-medium">
              Capital Allocations:
            </span>
            {selectedTickers.map((ticker) => (
              <div key={ticker} className="flex items-center gap-1.5">
                <span className="text-xs font-bold text-accent-blue">{ticker}</span>
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="1"
                  value={weights[ticker] ?? Math.round(100 / selectedTickers.length)}
                  onChange={(e) =>
                    setWeights((prev) => ({
                      ...prev,
                      [ticker]: parseFloat(e.target.value) / 100,
                    }))
                  }
                  className="w-14 bg-bg-primary border border-border text-text-primary text-xs px-2 py-1 rounded focus:outline-none focus:border-accent-blue text-center"
                />
                <span className="text-[10px] text-text-secondary">%</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default AssetFilterToolbar;
