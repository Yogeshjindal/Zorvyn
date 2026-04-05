import api from './axios';

export const registerAPI = (data) => api.post('/auth/register', data);
export const loginAPI = (data) => api.post('/auth/login', data);
export const getMeAPI = () => api.get('/auth/me');
export const updateMeAPI = (data) => api.put('/auth/me', data);
export const changePasswordAPI = (data) => api.put('/auth/change-password', data);
