/**
 * Custom React hook coordinating ticker selection, time horizon adjustments,
 * API analytical requests, and series restructuring for charting.
 */
import { useState, useCallback, useEffect } from 'react';
import {
  fetchSupportedTickers,
  postPortfolioAnalysis,
  postStrategyBacktest,
  fetchCorrelationMatrix,
} from '../services/analyticsApiClient';
import { RANGE_PRESETS, DEFAULT_TICKERS } from '../constants/marketDefaults';

const detectCurrencyFromSymbol = (ticker) => {
  const t = ticker.toUpperCase();
  if (t.endsWith('.NS') || t.endsWith('.BO') || t.startsWith('^NSE') || t.startsWith('^BSE')) {
    return 'INR';
  }
  return 'USD';
};

const resolveOverallCurrency = (tickers) => {
  const currencies = [...new Set(tickers.map(detectCurrencyFromSymbol))];
  return currencies.length === 1 ? currencies[0] : 'MIXED';
};

export const useMarketAnalytics = () => {
  const [selectedTickers, setSelectedTickers] = useState(DEFAULT_TICKERS);
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [activeRange, setActiveRange] = useState('5Y');
  const [weights, setWeights] = useState({});
  const [portfolioMode, setPortfolioMode] = useState(false);
  const [riskFreeRate, setRiskFreeRate] = useState(4.5);

  const [analysisData, setAnalysisData] = useState(null);
  const [backtestData, setBacktestData] = useState(null);
  const [correlationData, setCorrelationData] = useState(null);
  const [availableTickers, setAvailableTickers] = useState([]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const setRangePreset = useCallback((preset) => {
    const end = new Date();
    const start = new Date();

    if (preset.days === 'ytd') {
      start.setMonth(0, 1);
    } else {
      start.setDate(end.getDate() - preset.days);
    }

    setDateRange({
      start: start.toISOString().split('T')[0],
      end: end.toISOString().split('T')[0],
    });
    setActiveRange(preset.label);
  }, []);

  useEffect(() => {
    const fiveYear = RANGE_PRESETS.find((p) => p.label === '5Y') || RANGE_PRESETS[8];
    setRangePreset(fiveYear);
  }, [setRangePreset]);

  useEffect(() => {
    fetchSupportedTickers()
      .then((data) => setAvailableTickers(data || []))
      .catch((err) => console.warn('Could not load universe database:', err.message));
  }, []);

  const formatTimeSeriesData = (timeSeries) => {
    if (!timeSeries) return { price_chart: [], drawdowns: [], rolling_volatility: [] };

    const tickers = Object.keys(timeSeries);
    if (!tickers.length) return { price_chart: [], drawdowns: [], rolling_volatility: [] };

    const dateMap = {};
    tickers.forEach((ticker) => {
      (timeSeries[ticker] || []).forEach((pt) => {
        if (!dateMap[pt.date]) {
          dateMap[pt.date] = { date: pt.date };
        }
        dateMap[pt.date][ticker] = pt.price;
        dateMap[pt.date][`${ticker}_dd`] = pt.drawdown;
        dateMap[pt.date][`${ticker}_30d`] = pt.rolling_vol_30;
        dateMap[pt.date][`${ticker}_90d`] = pt.rolling_vol_90;
      });
    });

    const sortedDates = Object.keys(dateMap).sort();
    const records = sortedDates.map((d) => dateMap[d]);

    const price_chart = records.map((r) => {
      const row = { date: r.date };
      tickers.forEach((t) => {
        if (r[t] !== undefined) row[t] = r[t];
      });
      return row;
    });

    const drawdowns = records.map((r) => {
      const row = { date: r.date };
      tickers.forEach((t) => {
        if (r[`${t}_dd`] !== undefined) row[t] = r[`${t}_dd`];
      });
      return row;
    });

    const rolling_volatility = records
      .map((r) => {
        const row = { date: r.date };
        let exists = false;
        tickers.forEach((t) => {
          if (r[`${t}_30d`] !== undefined) {
            row[`${t}_30d`] = r[`${t}_30d`];
            exists = true;
          }
          if (r[`${t}_90d`] !== undefined) {
            row[`${t}_90d`] = r[`${t}_90d`];
            exists = true;
          }
        });
        return exists ? row : null;
      })
      .filter(Boolean);

    return { price_chart, drawdowns, rolling_volatility };
  };

  const formatBacktestResults = (sectorRes, momentumRes, divRes) => {
    const out = {};

    if (sectorRes?.strategy_results?.per_sector) {
      const sectors = sectorRes.strategy_results.per_sector;
      out.sector_comparison = Object.entries(sectors).map(([secName, secData]) => ({
        sector: secName,
        return: secData.annualized_return,
        volatility: secData.annualized_volatility,
        sharpe: secData.sharpe_ratio,
        tickers: secData.tickers?.join(', ') || '',
      }));
    }

    if (momentumRes?.strategy_results) {
      const sr = momentumRes.strategy_results;
      const pointMap = {};
      (sr.strategy_cumulative_returns || []).forEach((p) => {
        pointMap[p.date] = { date: p.date, strategy: p.value };
      });
      (sr.benchmark_cumulative_returns || []).forEach((p) => {
        if (!pointMap[p.date]) pointMap[p.date] = { date: p.date };
        pointMap[p.date].benchmark = p.value;
      });
      out.momentum_strategy = Object.values(pointMap).sort((a, b) => a.date.localeCompare(b.date));

      if (sr.strategy_metrics) {
        out.momentum_metrics = {
          strategy_sharpe: sr.strategy_metrics.sharpe_ratio,
          strategy_return: sr.strategy_metrics.annualized_return,
          strategy_vol: sr.strategy_metrics.annualized_volatility,
          strategy_max_dd: sr.strategy_metrics.max_drawdown,
        };
      }
      out.momentum_signals = sr.signals || [];
    }

    if (divRes?.strategy_results?.steps) {
      out.diversification_effect = divRes.strategy_results.steps.map((s) => ({
        assets_count: s.num_assets,
        tickers_label: s.tickers.join(', '),
        portfolio_volatility: s.portfolio_vol,
        avg_asset_volatility: s.weighted_avg_vol,
        diversification_benefit: s.diversification_benefit,
      }));
    }

    return Object.keys(out).length > 0 ? out : null;
  };

  const runAnalysis = useCallback(async () => {
    if (!selectedTickers.length) {
      setError('Please select at least one asset.');
      return;
    }
    if (!dateRange.start || !dateRange.end) {
      setError('Please provide a valid date range.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const payload = {
        tickers: selectedTickers,
        start_date: dateRange.start,
        end_date: dateRange.end,
        risk_free_rate: riskFreeRate / 100,
        ...(portfolioMode && Object.keys(weights).length > 0 && { weights }),
      };

      const [analysisRes, sectorRes, momentumRes, divRes, corrRes] = await Promise.all([
        postPortfolioAnalysis(payload).catch((err) => ({ error: err.message })),
        postStrategyBacktest({
          ticker: selectedTickers[0],
          strategy_type: 'sector',
          params: { tickers: selectedTickers, start_date: dateRange.start, end_date: dateRange.end, rf_rate: riskFreeRate / 100 },
        }).catch(() => null),
        postStrategyBacktest({
          ticker: selectedTickers[0],
          strategy_type: 'momentum',
          params: { start_date: dateRange.start, end_date: dateRange.end, short_window: 50, long_window: 200, tx_cost: 0.001 },
        }).catch(() => null),
        postStrategyBacktest({
          ticker: selectedTickers[0],
          strategy_type: 'diversification',
          params: { tickers: selectedTickers, start_date: dateRange.start, end_date: dateRange.end },
        }).catch(() => null),
        fetchCorrelationMatrix(selectedTickers, dateRange.start, dateRange.end).catch(() => null),
      ]);

      if (analysisRes?.error) {
        setError(analysisRes.error);
        setAnalysisData(null);
      } else {
        const transformed = formatTimeSeriesData(analysisRes.time_series);
        const currency = resolveOverallCurrency(selectedTickers);
        setAnalysisData({
          metrics: analysisRes.metrics,
          portfolio_metrics: analysisRes.portfolio_metrics,
          currency,
          ...transformed,
        });
      }

      setBacktestData(formatBacktestResults(sectorRes, momentumRes, divRes));
      setCorrelationData(corrRes?.matrix || null);
    } catch (err) {
      setError(err.message || 'Error occurred during portfolio calculation.');
    } finally {
      setLoading(false);
    }
  }, [selectedTickers, dateRange, weights, portfolioMode, riskFreeRate]);

  return {
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
    analysisData,
    backtestData,
    correlationData,
    availableTickers,
    loading,
    error,
    runAnalysis,
    RANGE_PRESETS,
  };
};
