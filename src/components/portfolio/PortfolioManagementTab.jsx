import React, { useState, useEffect } from 'react';
import PortfolioHoldingsLedger from './PortfolioHoldingsLedger';
import StockWatchlistTable from './StockWatchlistTable';

const STORAGE_KEYS = {
  HOLDINGS: 'pra_user_holdings',
  WATCHLIST: 'pra_user_watchlist',
};

const DEFAULT_HOLDINGS = [
  { ticker: 'RELIANCE.NS', qty: 15, avgPrice: 2850.0 },
  { ticker: 'TCS.NS', qty: 10, avgPrice: 3800.0 },
  { ticker: 'AAPL', qty: 5, avgPrice: 195.0 },
];

const DEFAULT_WATCHLIST = ['HDFCBANK.NS', 'NVDA', 'SPY', 'INFY.NS'];

const PortfolioManagementTab = ({ analysisData }) => {
  const [holdings, setHoldings] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.HOLDINGS);
      return saved ? JSON.parse(saved) : DEFAULT_HOLDINGS;
    } catch {
      return DEFAULT_HOLDINGS;
    }
  });

  const [watchlist, setWatchlist] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.WATCHLIST);
      return saved ? JSON.parse(saved) : DEFAULT_WATCHLIST;
    } catch {
      return DEFAULT_WATCHLIST;
    }
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.HOLDINGS, JSON.stringify(holdings));
  }, [holdings]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.WATCHLIST, JSON.stringify(watchlist));
  }, [watchlist]);

  const handleAddHolding = (newHolding) => {
    setHoldings((prev) => [...prev, newHolding]);
  };

  const handleRemoveHolding = (index) => {
    setHoldings((prev) => prev.filter((_, i) => i !== index));
  };

  const handleAddWatch = (ticker) => {
    if (!watchlist.includes(ticker)) {
      setWatchlist((prev) => [...prev, ticker]);
    }
  };

  const handleRemoveWatch = (ticker) => {
    setWatchlist((prev) => prev.filter((t) => t !== ticker));
  };

  return (
    <div className="flex flex-col lg:flex-row gap-6 w-full items-stretch">
      <PortfolioHoldingsLedger
        holdings={holdings}
        onAddHolding={handleAddHolding}
        onRemoveHolding={handleRemoveHolding}
        analysisData={analysisData}
      />
      <StockWatchlistTable
        watchlist={watchlist}
        onAddWatch={handleAddWatch}
        onRemoveWatch={handleRemoveWatch}
        analysisData={analysisData}
      />
    </div>
  );
};

export default PortfolioManagementTab;
