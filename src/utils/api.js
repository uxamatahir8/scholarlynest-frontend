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
    if (error.response && error.response.status === 401) {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('auth_token');
        localStorage.removeItem('user');
        // Do not force redirect automatically to prevent disrupting public reading sessions
      }
    }
    return Promise.reject(error);
  }
);

export default api;
