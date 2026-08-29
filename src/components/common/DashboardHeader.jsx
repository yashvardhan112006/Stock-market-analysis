import React from 'react';

const DashboardHeader = () => {
  return (
    <header className="sticky top-0 z-50 bg-bg-surface/90 backdrop-blur-md border-b border-border h-16 flex items-center px-6">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-accent-blue/10 border border-accent-blue/30 flex items-center justify-center text-accent-blue font-bold text-sm">
          PR
        </div>
        <div>
          <h1 className="text-base md:text-lg font-bold text-text-primary tracking-tight">
            Portfolio Risk & Returns Analytics
          </h1>
          <p className="text-xs text-text-secondary">
            Cross-market factor beta, drawdown profiling, diversification curves & strategy backtesting
          </p>
        </div>
      </div>
      <div className="ml-auto hidden sm:flex items-center gap-3">
        <span className="text-[11px] px-2 py-0.5 rounded bg-bg-elevated text-accent-green border border-accent-green/30 font-medium">
          LIVE DATA
        </span>
        <span className="text-[11px] text-text-secondary border border-border px-2 py-0.5 rounded bg-bg-primary">
          NSE · BSE · US
        </span>
      </div>
    </header>
  );
};

export default DashboardHeader;
