/**
 * Financial formatting utilities for market currencies, percentage returns, and dates.
 */

export const formatCurrency = (val, currency = 'USD') => {
  if (val === null || val === undefined || isNaN(val)) return 'N/A';
  const num = Number(val);
  const symbol = currency === 'INR' ? '₹' : (currency === 'USD' ? '$' : '');

  if (Math.abs(num) >= 1_000_000) {
    return `${symbol}${(num / 1_000_000).toFixed(2)}M`;
  }
  if (Math.abs(num) >= 100_000 && currency === 'INR') {
    return `${symbol}${(num / 100_000).toFixed(2)}L`;
  }
  if (Math.abs(num) >= 1_000) {
    return `${symbol}${num.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }
  return `${symbol}${num.toFixed(2)}`;
};

export const formatPercent = (val, includePlus = false) => {
  if (val === null || val === undefined || isNaN(val)) return 'N/A';
  const num = Number(val) * 100;
  const prefix = includePlus && num > 0 ? '+' : '';
  return `${prefix}${num.toFixed(2)}%`;
};

export const formatNumber = (val, decimals = 2) => {
  if (val === null || val === undefined || isNaN(val)) return 'N/A';
  return Number(val).toFixed(decimals);
};

export const formatDate = (dateStr) => {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};
