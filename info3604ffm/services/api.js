import * as SecureStore from 'expo-secure-store';
import { BACKEND_URL } from '@/constants/config';
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
      const response = await fetch(`${BACKEND_URL}/api/token/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: credentials.username,
          password: credentials.password,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Login failed');
      }

      const data = await response.json();
      
      // Store tokens securely
      if(Platform.OS === 'web') {
        await AsyncStorage.setItem(ACCESS_TOKEN_KEY, data.access);
        await AsyncStorage.setItem(REFRESH_TOKEN_KEY, data.refresh);
      } else{
        await SecureStore.setItemAsync(ACCESS_TOKEN_KEY, data.access);
        await SecureStore.setItemAsync(REFRESH_TOKEN_KEY, data.refresh);
      }
      
      console.log('Tokens stored successfully:', {
        accessToken: data.access,
        refreshToken: data.refresh
      });

      return data;
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  },

  // Get current access token
  async getAccessToken() {
    try {
      let token;
      if(Platform.OS === 'web') {
        token = await AsyncStorage.getItem(ACCESS_TOKEN_KEY);
      } else{
        token = await SecureStore.getItemAsync(ACCESS_TOKEN_KEY);
      }
      console.log('Retrieved access token:', token);
      return token;
    } catch (error) {
      console.error('Error getting access token:', error);
      return null;
    }
  },

  // Refresh token when expired
  async refreshToken() {
    try {
      if(Platform.OS === 'web') {
        const refreshToken = await AsyncStorage.getItem(REFRESH_TOKEN_KEY);
      } else{
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
      if(Platform.OS === 'web') {
        await AsyncStorage.setItem(ACCESS_TOKEN_KEY, data.access);
      } else{
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
      if(Platform.OS === 'web') {
        await AsyncStorage.removeItem(ACCESS_TOKEN_KEY);
        await AsyncStorage.removeItem(REFRESH_TOKEN_KEY);
      } else{
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
    
    // Ensure proper URL construction
    const fullUrl = `${BACKEND_URL}${url.startsWith('/') ? url : '/' + url}`;
    console.log('Making request to:', fullUrl); // Debug log
    
    // Add more detailed logging
    console.log('Request details:', {
      method: options.method || 'GET',
      headers,
      body: options.body ? JSON.parse(options.body) : undefined
    });

    try {
      const response = await fetch(fullUrl, {
        ...options,
        headers,
      });
      
      // Enhanced error logging
      console.log('Response status:', response.status);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('Response error:', {
          status: response.status,
          statusText: response.statusText,
          data: errorData
        });
      }
    
      // If unauthorized, try to refresh token
      if (response.status === 401) {
        try {
          token = await authService.refreshToken();
          headers.Authorization = `Bearer ${token}`;
          
          console.log('Retrying request with new token:', token);
          return fetch(fullUrl, {
            ...options,
            headers,
          });
        } catch (refreshError) {
          console.error('Token refresh failed:', refreshError);
          throw new Error('Authentication failed. Please login again.');
        }
      }
      
      return response;
    } catch (error) {
      console.error('API request error:', error);
      throw error;
    }
  } catch (error) {
    console.error('API request error:', error);
    throw error;
  }
};


export const expenseService = {
  // Add a new expense
  async addExpense(expenseData) {
    try {
      const response = await fetchWithAuth('/api/expenses/', {
        method: 'POST',
        body: JSON.stringify({
          description: expenseData.description,
          amount: expenseData.amount
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to add expense');
      }

      return await response.json();
    } catch (error) {
      console.error('Add expense error:', error);
      throw error;
    }
  },
  async getRecentExpenses() {
    try {
      const response = await fetchWithAuth('/api/expenses/recent/');

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to fetch recent expenses');
      }

      return await response.json();
    } catch (error) {
      console.error('Get recent expenses error:', error);
      throw error;
    }
  }
};

export const familyManagementService = {
  // Add a new family member
  async addFamilyMember(memberData) {
    try {
      const response = await fetchWithAuth('/api/family-members/', {
        method: 'POST',
        body: JSON.stringify({
          name: memberData.name,
          email: memberData.email,
          relationship: memberData.relationship
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to add family member');
      }

      return await response.json();
    } catch (error) {
      console.error('Add family member error:', error);
      throw error;
    }
  },
  // Edit a family member
  async editFamilyMember(memberId, memberData) {
    try {
      const response = await fetchWithAuth(`/api/family-members/${memberId}/`, {
        method: 'PUT',
        body: JSON.stringify({
          name: memberData.name,
          email: memberData.email,
          relationship: memberData.relationship
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to edit family member');
      }

      return await response.json();
    } catch (error) {
      console.error('Edit family member error:', error);
      throw error;
    }
  },
  // Delete a family member
  async deleteFamilyMember(memberId) {
    try {
      const response = await fetchWithAuth(`/api/family-members/${memberId}/`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to delete family member');
      }

      return await response.json();
    } catch (error) {
      console.error('Delete family member error:', error);
      throw error;
    }
  },
  // Get all family members
  async getFamilyMembers() {
    try {        
      const response = await fetchWithAuth('api/family/');

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to fetch family members');
      }

      return await response.json();
    } catch (error) {
      console.error('Get family members error:', error);
      throw error;
    }
  },
  // Get a specific family member
  async getFamilyMember(memberId) {
    try {
      const response = await fetchWithAuth(`/api/families/${memberId}/`);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to fetch family member');
      }

      return await response.json();
    } catch (error) {
      console.error('Get family member error:', error);
      throw error;
    }
  }
};