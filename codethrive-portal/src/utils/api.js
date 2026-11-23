import axios from 'axios';

const getApiUrl = () => {
  if (import.meta.env.VITE_API_URL) return import.meta.env.VITE_API_URL;
  if (typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')) {
    return 'http://localhost:5000/api/v1';
  }
  return 'https://codethrive-backend.onrender.com/api/v1';
};

export const getBaseServerUrl = () => {
  if (typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')) {
    return 'http://localhost:5000';
  }
  return 'https://codethrive-backend.onrender.com';
};

const API_URL = getApiUrl();

export const getFileUrl = (fileUrl) => {
  if (!fileUrl) return '#';
  if (fileUrl.startsWith('http://') || fileUrl.startsWith('https://')) return fileUrl;
  const baseUrl = API_URL.replace('/api/v1', '');
  return `${baseUrl}/${fileUrl.replace(/^\//, '')}`;
};

const api = axios.create({
  baseURL: API_URL,
  timeout: 25000,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// High-speed in-memory Stale-While-Revalidate (SWR) cache for instant sub-second navigations
const apiCache = new Map();
const FRESH_TTL_MS = 30 * 1000; // 30 seconds
const STALE_TTL_MS = 5 * 60 * 1000; // 5 minutes

export const clearApiCache = () => {
  apiCache.clear();
};

const originalGet = api.get.bind(api);

api.get = async function cachedGet(url, config = {}) {
  // If caller explicitly requested bypass cache
  if (config.skipCache) {
    return originalGet(url, config);
  }

  const cacheKey = `${url}__${JSON.stringify(config.params || {})}`;
  const cached = apiCache.get(cacheKey);
  const now = Date.now();

  // Fresh cache hit (<30s) -> Return immediately with 0ms latency
  if (cached && (now - cached.timestamp < FRESH_TTL_MS)) {
    return Promise.resolve(cached.response);
  }

  // Stale cache hit (<5m) -> Return immediately and revalidate in background
  if (cached && (now - cached.timestamp < STALE_TTL_MS)) {
    originalGet(url, config).then(res => {
      apiCache.set(cacheKey, { timestamp: Date.now(), response: res });
    }).catch(() => {});
    return Promise.resolve(cached.response);
  }

  // Cold cache miss -> Fetch and populate cache
  const res = await originalGet(url, config);
  apiCache.set(cacheKey, { timestamp: Date.now(), response: res });
  return res;
};

// Invalidate cache on mutations (POST, PUT, DELETE, PATCH)
['post', 'put', 'delete', 'patch'].forEach(method => {
  const originalMethod = api[method].bind(api);
  api[method] = async function mutatingMethod(...args) {
    const res = await originalMethod(...args);
    // Invalidate cached data on write so next read reflects updated data
    apiCache.clear();
    return res;
  };
});

// Add a request interceptor
api.interceptors.request.use(
  (config) => {
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
    return response;
  },
  (error) => {
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
