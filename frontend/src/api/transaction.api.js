import api from './axios';

export const getTransactionsAPI = (params) => api.get('/transactions', { params });
export const getTransactionByIdAPI = (id) => api.get(`/transactions/${id}`);
export const createTransactionAPI = (data) => api.post('/transactions', data);
export const updateTransactionAPI = (id, data) => api.put(`/transactions/${id}`, data);
export const deleteTransactionAPI = (id) => api.delete(`/transactions/${id}`);
