import React from 'react';

const LoadingOverlay = ({ overlay = false, message = 'Executing quantitative calculations...' }) => {
  const content = (
    <div className="flex flex-col items-center justify-center p-6 text-center">
      <div className="relative w-10 h-10 mb-3">
        <div className="w-10 h-10 border-2 border-border rounded-full" />
        <div className="w-10 h-10 border-2 border-accent-blue border-t-transparent rounded-full animate-spin absolute top-0 left-0" />
      </div>
      <span className="text-sm font-medium text-text-primary">{message}</span>
      <span className="text-xs text-text-secondary mt-1">Ingesting asset timeseries & synchronizing calendar gaps</span>
    </div>
  );

  if (overlay) {
    return (
      <div className="absolute inset-0 z-40 bg-bg-primary/70 backdrop-blur-sm flex items-center justify-center rounded-lg">
        {content}
      </div>
    );
  }

  return content;
};

export default LoadingOverlay;
