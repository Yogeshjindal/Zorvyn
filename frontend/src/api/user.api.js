import api from './axios';

export const getUsersAPI = (params) => api.get('/users', { params });
export const getUserByIdAPI = (id) => api.get(`/users/${id}`);
export const createUserAPI = (data) => api.post('/users', data);
export const updateUserAPI = (id, data) => api.put(`/users/${id}`, data);
export const deleteUserAPI = (id) => api.delete(`/users/${id}`);
