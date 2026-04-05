import api from './axios';

export const getSummaryAPI = (params) => api.get('/dashboard/summary', { params });
export const getRecentActivityAPI = (params) => api.get('/dashboard/recent', { params });
export const getWeeklyComparisonAPI = () => api.get('/dashboard/weekly');
export const getCategoryBreakdownAPI = (params) => api.get('/dashboard/categories', { params });
export const getMonthlyTrendsAPI = (params) => api.get('/dashboard/trends', { params });
