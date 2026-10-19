import axios from 'axios';

// quản lý api url
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api'
});

// đính kèm token vào header của request
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export default api;
api.interceptors.response.use(response => response, error => {
  if (error.response?.status === 401 && !error.config?.url?.includes('/login')) {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    if (window.location.pathname !== '/login') window.location.assign('/login');
  }
  return Promise.reject(error);
});
