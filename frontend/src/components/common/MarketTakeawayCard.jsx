import React from 'react';

const MarketTakeawayCard = ({ title = 'Quantitative Findings', content }) => {
  if (!content) return null;

  return (
    <div className="bg-bg-surface border border-accent-blue/20 rounded-lg p-5 shadow-lg shadow-black/20 relative overflow-hidden">
      <div className="absolute top-0 left-0 w-1.5 h-full bg-accent-blue" />
      <div className="flex items-start gap-3">
        <div className="w-8 h-8 rounded-md bg-accent-blue/10 flex items-center justify-center text-accent-blue shrink-0 mt-0.5 font-bold text-sm">
          💡
        </div>
        <div className="flex-1">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-accent-blue mb-1">
            {title}
          </h4>
          <p className="text-sm text-text-primary leading-relaxed">{content}</p>
        </div>
      </div>
    </div>
  );
};

export default MarketTakeawayCard;
