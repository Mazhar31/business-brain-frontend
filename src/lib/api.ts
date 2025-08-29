// src/lib/api.ts
import axios from 'axios';

// Base API configuration - matches your backend
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1';

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    try {
      const token = localStorage.getItem('token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (error) {
      console.error('Error accessing localStorage:', error);
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling - FIXED: No more window.location.href
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      try {
        // Clear tokens but let React handle navigation
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        
        // Dispatch a custom event that AuthContext can listen to
        window.dispatchEvent(new CustomEvent('auth:unauthorized'));
      } catch (storageError) {
        console.error('Error clearing localStorage:', storageError);
      }
    }
    return Promise.reject(error);
  }
);

export default api;