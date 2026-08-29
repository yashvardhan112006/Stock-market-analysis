/**
 * Market defaults: time horizon presets, asset universe defaults, and chart palettes.
 */

export const RANGE_PRESETS = [
  { label: '1D', days: 1 },
  { label: '7D', days: 7 },
  { label: '1M', days: 30 },
  { label: '3M', days: 90 },
  { label: '6M', days: 180 },
  { label: 'YTD', days: 'ytd' },
  { label: '1Y', days: 365 },
  { label: '3Y', days: 1095 },
  { label: '5Y', days: 1825 },
  { label: 'ALL', days: 3650 },
];

export const CHART_PALETTE = [
  '#3b82f6', // Blue
  '#10b981', // Emerald
  '#f59e0b', // Amber
  '#ef4444', // Red
  '#8b5cf6', // Violet
  '#ec4899', // Pink
  '#06b6d4', // Cyan
  '#f97316', // Orange
];

export const DEFAULT_TICKERS = ['SPY', 'QQQ', 'RELIANCE.NS', 'TCS.NS', 'AAPL'];
