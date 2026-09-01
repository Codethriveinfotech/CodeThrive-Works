import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1';

const api = axios.create({
  baseURL: API_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add a request interceptor
api.interceptors.request.use(
  (config) => {
    // You can add token to headers if you are not using httpOnly cookies
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add a response interceptor
api.interceptors.response.use(
  (response) => {
    return response.data;
  },
  (error) => {
    // Handle global errors here (e.g., 401 Unauthorized -> redirect to login)
    if (error.response?.status === 401) {
      const isMock = localStorage.getItem('isMock');
      if (!isMock) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        if (!window.location.pathname.includes('/login')) {
          window.location.href = '/employee/login';
        }
      } else {
        console.warn('Mock mode: Suppressed 401 Unauthorized redirect');
      }
    }
    return Promise.reject(error);
  }
);

export default api;
