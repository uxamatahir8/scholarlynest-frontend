import axios from 'axios';

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api',
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

// Request interceptor to dynamically inject the Sanctum Auth Token
api.interceptors.request.use(
  (config) => {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('api-request-started'));
      const token = localStorage.getItem('auth_token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    if (typeof FormData !== 'undefined' && config.data instanceof FormData) {
      if (typeof config.headers?.delete === 'function') {
        config.headers.delete('Content-Type');
        config.headers.delete('content-type');
      } else if (config.headers) {
        delete config.headers['Content-Type'];
        delete config.headers['content-type'];
      }
    }
    return config;
  },
  (error) => {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('api-request-ended'));
    }
    return Promise.reject(error);
  }
);

// Response interceptor to handle auth expiration
api.interceptors.response.use(
  (response) => {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('api-request-ended'));
    }
    return response;
  },
  (error) => {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('api-request-ended'));
    }
    const status = error?.response?.status;
    if (status === 401) {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('auth_token');
        localStorage.removeItem('user');
        // Do not force redirect automatically to prevent disrupting public reading sessions
      }
    }
    return Promise.reject(error);
  }
);

export function buildApiUrl(path) {
  if (!path) return '';
  if (path.startsWith('http://') || path.startsWith('https://')) return path;
  
  const apiBase = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api').replace(/\/$/, '');
  const hasApiSuffix = apiBase.endsWith('/api');
  
  let cleanPath = path;
  if (cleanPath.startsWith('/')) {
    cleanPath = cleanPath.slice(1);
  }
  
  const startsWithApi = cleanPath.startsWith('api/');
  
  if (hasApiSuffix) {
    if (startsWithApi) {
      cleanPath = cleanPath.slice(4);
    }
  } else {
    if (!startsWithApi) {
      cleanPath = 'api/' + cleanPath;
    }
  }
  
  return `${apiBase}/${cleanPath}`;
}

export default api;
