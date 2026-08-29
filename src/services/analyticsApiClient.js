/**
 * Axios API client for backend analytics and backtest endpoints.
 */
import axios from 'axios';

const httpClient = axios.create({
  baseURL: '/api',
  timeout: 30000,
});

httpClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const errorMsg = error.response?.data?.detail || error.message || 'Analytics service unavailable';
    return Promise.reject(new Error(errorMsg));
  }
);

export const fetchSupportedTickers = () => httpClient.get('/tickers').then((r) => r.data);

export const postPortfolioAnalysis = (payload) => httpClient.post('/analyze', payload).then((r) => r.data);

export const postStrategyBacktest = (payload) => httpClient.post('/backtest', payload).then((r) => r.data);

export const fetchCorrelationMatrix = (tickers, startDate, endDate) => {
  const params = new URLSearchParams({
    tickers: tickers.join(','),
  });
  if (startDate) params.set('start_date', startDate);
  if (endDate) params.set('end_date', endDate);
  return httpClient.get(`/correlation?${params.toString()}`).then((r) => r.data);
};
