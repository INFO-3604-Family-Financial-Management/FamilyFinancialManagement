import * as SecureStore from 'expo-secure-store';
import { BACKEND_URL } from '@/constants/config';
import axios from 'axios';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Secure Storage Keys
const ACCESS_TOKEN_KEY = 'tfr_access_token';
const REFRESH_TOKEN_KEY = 'tfr_refresh_token';

// API Service for authentication
export const authService = {
  // Register a new user
  async register(userData) {
    try {
      console.log('Attempting registration with:', {
        ...userData,
        password: '[REDACTED]'
      });
      
      const response = await fetch(`${BACKEND_URL}/api/register/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: userData.username,
          email: userData.email,
          password: userData.password,
        }),
      });

      console.log('Registration response status:', response.status);

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Registration error data:', errorData);
        throw new Error(errorData.detail || 'Registration failed');
      }

      return await response.json();
    } catch (error) {
      console.error('Registration error:', error);
      throw error;
    }
  },

  // Login user and get tokens
  async login(credentials) {
    try {
      const response = await axios.post(`${BACKEND_URL}/api/token/`, credentials);
      const data = response.data;
      
      // Store tokens securely
      if(Platform.OS === 'web') {
        await AsyncStorage.setItem(
          ACCESS_TOKEN_KEY, 
          data.access
        );
        await AsyncStorage.setItem(
          REFRESH_TOKEN_KEY,
          data.refresh
        );
      }else{
        await SecureStore.setItemAsync(
          ACCESS_TOKEN_KEY,
          data.access
        );
        await SecureStore.setItemAsync(
          REFRESH_TOKEN_KEY,
          data.refresh
        );
      }
      
      return data;
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  },

  // Get current access token
  async getAccessToken() {
    try {
      if(Platform.OS === 'web'){
        return await AsyncStorage.getItem(ACCESS_TOKEN_KEY);
      }else{
        return await SecureStore.getItemAsync(ACCESS_TOKEN_KEY);
      }
    } catch (error) {
      console.error('Error getting access token:', error);
      return null;
    }
  },

  // Refresh token when expired
  async refreshToken() {
    try {
       
      if(Platform.OS === 'web'){
        const refreshToken = await AsyncStorage.getItem(REFRESH_TOKEN_KEY);
      }else{
        const refreshToken = await SecureStore.getItemAsync(REFRESH_TOKEN_KEY);
      }
      
      if (!refreshToken) {
        throw new Error('No refresh token available');
      }
      
      const response = await fetch(`${BACKEND_URL}/api/token/refresh/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          refresh: refreshToken,
        }),
      });

      if (!response.ok) {
        // If refresh fails, logout user
        await this.logout();
        throw new Error('Session expired. Please login again.');
      }

      const data = await response.json();
      if(Platform.OS === 'web'){
        await AsyncStorage.setItem
        (ACCESS_TOKEN_KEY, data.access);
      }else{
        await SecureStore.setItemAsync(ACCESS_TOKEN_KEY, data.access);
      }
      
      return data.access;
    } catch (error) {
      console.error('Token refresh error:', error);
      throw error;
    }
  },
  
  // Logout user (clear tokens)
  async logout() {
    try {
      if(Platform.OS === 'web'){
        await AsyncStorage.removeItem(ACCESS_TOKEN_KEY);
        await AsyncStorage.removeItem(REFRESH_TOKEN_KEY);
      }else{
        await SecureStore.deleteItemAsync(ACCESS_TOKEN_KEY);
        await SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY);
      }
    } catch (error) {
      console.error('Logout error:', error);
    }
  },
  
  // Check if user is logged in
  async isLoggedIn() {
    try {
      const token = await this.getAccessToken();
      return !!token;
    } catch (error) {
      return false;
    }
  }
};

// Create a fetch wrapper with auth headers for protected endpoints
export const fetchWithAuth = async (url, options = {}) => {
  try {
    let token = await authService.getAccessToken();
    
    // Set default headers
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers,
    };
    
    // Add auth token if available
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }
    
    const response = await fetch(`${BACKEND_URL}${url}`, {
      ...options,
      headers,
    });
    
    // If unauthorized, try to refresh token
    if (response.status === 401) {
      try {
        token = await authService.refreshToken();
        
        // Retry request with new token
        headers.Authorization = `Bearer ${token}`;
        
        return fetch(`${BACKEND_URL}${url}`, {
          ...options,
          headers,
        });
      } catch (refreshError) {
        // If refresh fails, throw error to be handled by caller
        throw new Error('Authentication failed. Please login again.');
      }
    }
    
    return response;
  } catch (error) {
    console.error('API request error:', error);
    throw error;
  }
};