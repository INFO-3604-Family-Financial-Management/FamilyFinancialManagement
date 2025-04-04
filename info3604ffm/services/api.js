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
      let refreshToken;
      if(Platform.OS === 'web') {
        refreshToken = await AsyncStorage.getItem(REFRESH_TOKEN_KEY);
      } else{
        refreshToken = await SecureStore.getItemAsync(REFRESH_TOKEN_KEY);
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

// Expense service
export const expenseService = {
  // Add a new expense
  async addExpense(expenseData) {
    try {
      const response = await fetchWithAuth('/api/expenses/', {
        method: 'POST',
        body: JSON.stringify({
          description: expenseData.description,
          amount: expenseData.amount,
          budget: expenseData.budget || null,
          goal: expenseData.goal || null
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
  
  // Get all expenses
  async getExpenses() {
    try {
      const response = await fetchWithAuth('/api/expenses/');
      
      if (!response.ok) {
        throw new Error('Failed to fetch expenses');
      }
      
      return await response.json();
    } catch (error) {
      console.error('Get expenses error:', error);
      throw error;
    }
  },
  
  // Get recent expenses
  async getRecentExpenses() {
    try {
      const response = await fetchWithAuth('/api/expenses/recent/');
      
      if (!response.ok) {
        throw new Error('Failed to fetch recent expenses');
      }
      
      return await response.json();
    } catch (error) {
      console.error('Get recent expenses error:', error);
      throw error;
    }
  },
  
  // Update an expense
  async updateExpense(id, expenseData) {
    try {
      const response = await fetchWithAuth(`/api/expenses/${id}/`, {
        method: 'PATCH',
        body: JSON.stringify(expenseData)
      });
      
      if (!response.ok) {
        throw new Error('Failed to update expense');
      }
      
      return await response.json();
    } catch (error) {
      console.error('Update expense error:', error);
      throw error;
    }
  },
  
  // Delete an expense
  async deleteExpense(id) {
    try {
      const response = await fetchWithAuth(`/api/expenses/${id}/`, {
        method: 'DELETE'
      });
      
      if (!response.ok) {
        throw new Error('Failed to delete expense');
      }
      
      return await response.json();
    } catch (error) {
      console.error('Delete expense error:', error);
      throw error;
    }
  }
};

// User Profile service
export const profileService = {
  // Get user profile
  async getUserProfile() {
    try {
      const response = await fetchWithAuth('/api/profile/');
      
      if (!response.ok) {
        throw new Error('Failed to fetch user profile');
      }
      
      return await response.json();
    } catch (error) {
      console.error('Get user profile error:', error);
      throw error;
    }
  },
  
  // Get full user info (including profile)
  async getUserInfo() {
    try {
      const response = await fetchWithAuth('/api/user-info/');
      
      if (!response.ok) {
        throw new Error('Failed to fetch user info');
      }
      
      return await response.json();
    } catch (error) {
      console.error('Get user info error:', error);
      throw error;
    }
  },
  
  // Update user profile
  async updateProfile(profileData) {
    try {
      const response = await fetchWithAuth('/api/profile/', {
        method: 'PATCH',
        body: JSON.stringify(profileData)
      });
      
      if (!response.ok) {
        throw new Error('Failed to update profile');
      }
      
      return await response.json();
    } catch (error) {
      console.error('Update profile error:', error);
      throw error;
    }
  }
};

// Family service
export const familyService = {
  // Get all families
  async getFamilies() {
    try {
      const response = await fetchWithAuth('/api/families/');
      
      if (!response.ok) {
        throw new Error('Failed to fetch families');
      }
      
      return await response.json();
    } catch (error) {
      console.error('Get families error:', error);
      throw error;
    }
  },
  
  // Get a specific family
  async getFamily(id) {
    try {
      const response = await fetchWithAuth(`/api/families/${id}/`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch family');
      }
      
      return await response.json();
    } catch (error) {
      console.error('Get family error:', error);
      throw error;
    }
  },
  
  // Create a new family
  async createFamily(familyData) {
    try {
      const response = await fetchWithAuth('/api/families/', {
        method: 'POST',
        body: JSON.stringify(familyData)
      });
      
      if (!response.ok) {
        throw new Error('Failed to create family');
      }
      
      return await response.json();
    } catch (error) {
      console.error('Create family error:', error);
      throw error;
    }
  },
  
  // Update a family
  async updateFamily(id, familyData) {
    try {
      const response = await fetchWithAuth(`/api/families/${id}/`, {
        method: 'PATCH',
        body: JSON.stringify(familyData)
      });
      
      if (!response.ok) {
        throw new Error('Failed to update family');
      }
      
      return await response.json();
    } catch (error) {
      console.error('Update family error:', error);
      throw error;
    }
  },
  
  // Join a family (update user profile)
  async joinFamily(familyId) {
    try {
      const response = await fetchWithAuth('/api/profile/', {
        method: 'PATCH',
        body: JSON.stringify({ family: familyId })
      });
      
      if (!response.ok) {
        throw new Error('Failed to join family');
      }
      
      return await response.json();
    } catch (error) {
      console.error('Join family error:', error);
      throw error;
    }
  },
  
  // Leave family (set family to null)
  async leaveFamily() {
    try {
      const response = await fetchWithAuth('/api/profile/', {
        method: 'PATCH',
        body: JSON.stringify({ family: null })
      });
      
      if (!response.ok) {
        throw new Error('Failed to leave family');
      }
      
      return await response.json();
    } catch (error) {
      console.error('Leave family error:', error);
      throw error;
    }
  }
};

// Budget service
export const budgetService = {
  // Get all budgets
  async getBudgets() {
    try {
      const response = await fetchWithAuth('/api/budgets/');
      
      if (!response.ok) {
        throw new Error('Failed to fetch budgets');
      }
      
      return await response.json();
    } catch (error) {
      console.error('Get budgets error:', error);
      throw error;
    }
  },
  
  // Create a new budget
  async createBudget(budgetData) {
    try {
      const response = await fetchWithAuth('/api/budgets/', {
        method: 'POST',
        body: JSON.stringify(budgetData)
      });
      
      if (!response.ok) {
        throw new Error('Failed to create budget');
      }
      
      return await response.json();
    } catch (error) {
      console.error('Create budget error:', error);
      throw error;
    }
  },
  
  // Update a budget
  async updateBudget(id, budgetData) {
    try {
      const response = await fetchWithAuth(`/api/budgets/${id}/`, {
        method: 'PATCH',
        body: JSON.stringify(budgetData)
      });
      
      if (!response.ok) {
        throw new Error('Failed to update budget');
      }
      
      return await response.json();
    } catch (error) {
      console.error('Update budget error:', error);
      throw error;
    }
  },
  
  // Delete a budget
  async deleteBudget(id) {
    try {
      const response = await fetchWithAuth(`/api/budgets/${id}/`, {
        method: 'DELETE'
      });
      
      if (!response.ok) {
        throw new Error('Failed to delete budget');
      }
      
      return await response.json();
    } catch (error) {
      console.error('Delete budget error:', error);
      throw error;
    }
  }
};

// Goal service
export const goalService = {
  // Get all goals (including family goals)
  async getGoals() {
    try {
      const response = await fetchWithAuth('/api/goals/');
      
      if (!response.ok) {
        throw new Error('Failed to fetch goals');
      }
      
      return await response.json();
    } catch (error) {
      console.error('Get goals error:', error);
      throw error;
    }
  },
  
  // Create a new goal
  async createGoal(goalData) {
    try {
      const response = await fetchWithAuth('/api/goals/', {
        method: 'POST',
        body: JSON.stringify(goalData)
      });
      
      if (!response.ok) {
        throw new Error('Failed to create goal');
      }
      
      return await response.json();
    } catch (error) {
      console.error('Create goal error:', error);
      throw error;
    }
  },
  
  // Update a goal
  async updateGoal(id, goalData) {
    try {
      const response = await fetchWithAuth(`/api/goals/${id}/`, {
        method: 'PATCH',
        body: JSON.stringify(goalData)
      });
      
      if (!response.ok) {
        throw new Error('Failed to update goal');
      }
      
      return await response.json();
    } catch (error) {
      console.error('Update goal error:', error);
      throw error;
    }
  },
  
  // Delete a goal
  async deleteGoal(id) {
    try {
      const response = await fetchWithAuth(`/api/goals/${id}/`, {
        method: 'DELETE'
      });
      
      if (!response.ok) {
        throw new Error('Failed to delete goal');
      }
      
      return await response.json();
    } catch (error) {
      console.error('Delete goal error:', error);
      throw error;
    }
  }
};

// Contribution service
export const contributionService = {
  // Get all contributions
  async getContributions() {
    try {
      const response = await fetchWithAuth('/api/contributions/');
      
      if (!response.ok) {
        throw new Error('Failed to fetch contributions');
      }
      
      return await response.json();
    } catch (error) {
      console.error('Get contributions error:', error);
      throw error;
    }
  },
  
  // Create a new contribution
  async createContribution(contributionData) {
    try {
      const response = await fetchWithAuth('/api/contributions/', {
        method: 'POST',
        body: JSON.stringify(contributionData)
      });
      
      if (!response.ok) {
        throw new Error('Failed to create contribution');
      }
      
      return await response.json();
    } catch (error) {
      console.error('Create contribution error:', error);
      throw error;
    }
  }
};

// Streak service
export const streakService = {
  // Get user streak
  async getStreak() {
    try {
      const response = await fetchWithAuth('/api/streaks/');
      
      if (!response.ok) {
        throw new Error('Failed to fetch streak');
      }
      
      const streaks = await response.json();
      return streaks.length > 0 ? streaks[0] : null;
    } catch (error) {
      console.error('Get streak error:', error);
      throw error;
    }
  },
  
  // Update streak
  async updateStreak(id, streakData) {
    try {
      const response = await fetchWithAuth(`/api/streaks/${id}/`, {
        method: 'PATCH',
        body: JSON.stringify(streakData)
      });
      
      if (!response.ok) {
        throw new Error('Failed to update streak');
      }
      
      return await response.json();
    } catch (error) {
      console.error('Update streak error:', error);
      throw error;
    }
  }
};