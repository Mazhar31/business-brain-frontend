// src/services/authService.ts
import api from '../lib/api';

interface User {
  id: string;
  email: string;
  full_name: string;
  is_active: boolean;
  created_at: string;
}

interface LoginResponse {
  access_token: string;
  token_type: string;
  user: User;
}

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export const authService = {
  // Login user
  login: async (email: string, password: string): Promise<ApiResponse<LoginResponse>> => {
    try {
      const response = await api.post('/auth/login', {
        email,
        password
      });
      
      const { access_token, user } = response.data;
      
      // Store token and user data
      localStorage.setItem('token', access_token);
      localStorage.setItem('user', JSON.stringify(user));
      
      return { success: true, data: response.data };
    } catch (error: any) {
      // Ensure no stale session remains
      localStorage.removeItem('token');
      localStorage.removeItem('user');

      return {
        success: false,
        error: error.response?.data?.detail || 'Login failed'
      };
    }
  },

  // Register user
  signup: async (email: string, password: string, full_name: string): Promise<ApiResponse<{ message: string }>> => {
    try {
      const response = await api.post('/auth/signup', {
        email,
        password,
        full_name
      });
      
      return { success: true, data: response.data };
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.detail || 'Signup failed'
      };
    }
  },

  // Get current user
  getCurrentUser: async (): Promise<ApiResponse<User>> => {
    try {
      const response = await api.get('/auth/me');
      return { success: true, data: response.data };
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.detail || 'Failed to get user data'
      };
    }
  },

  // Logout user - FIXED: No more window.location.href
  logout: (): void => {
    // Just clear local storage, let React Router handle navigation
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    // Navigation will be handled by AuthContext and React Router
  },

  // Check if user is authenticated
  isAuthenticated: (): boolean => {
    return !!localStorage.getItem('token');
  },

  // Get stored user data
  getStoredUser: (): User | null => {
    try {
      const user = localStorage.getItem('user');
      return user ? JSON.parse(user) : null;
    } catch (error) {
      console.error('Error parsing stored user data:', error);
      localStorage.removeItem('user');
      return null;
    }
  }
};