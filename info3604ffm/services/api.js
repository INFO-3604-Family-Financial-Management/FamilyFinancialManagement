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
        throw new Error(errorData.error || 'Registration failed');
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
      
      console.log('Tokens stored successfully');

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

// Enhanced fetchWithAuth function with better error handling
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
    
    // Add more detailed logging in development
    if (__DEV__) {
      console.log('Making request to:', fullUrl);
      console.log('Request details:', {
        method: options.method || 'GET',
        headers,
        body: options.body ? JSON.parse(options.body) : undefined
      });
    }

    const response = await fetch(fullUrl, {
      ...options,
      headers,
    });
    
    // Enhanced error logging in development
    if (__DEV__) {
      console.log('Response status:', response.status);
      
      if (!response.ok) {
        let errorText = '';
        try {
          const errorData = await response.clone().json();
          errorText = JSON.stringify(errorData);
        } catch (e) {
          try {
            errorText = await response.clone().text();
          } catch (e2) {
            errorText = 'Could not parse error response';
          }
        }
        
        console.error('Response error:', {
          status: response.status,
          statusText: response.statusText,
          errorText
        });
      }
    }
  
    // If unauthorized, try to refresh token
    if (response.status === 401) {
      try {
        token = await authService.refreshToken();
        headers.Authorization = `Bearer ${token}`;
        
        if (__DEV__) {
          console.log('Retrying request with new token');
        }
        
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
};

// Profile service for managing user profile including income
export const profileService = {
  // Get the user profile
  async getUserProfile() {
    try {
      console.log('Attempting to fetch user profile');
      
      const response = await fetchWithAuth('/api/profile/');
      console.log('Profile response status:', response.status);
      
      if (!response.ok) {
        if (response.status === 404) {
          console.log('Profile not found, returning default');
          return { monthly_income: 0, family: null };
        }
        
        // Try to get more detailed error info
        let errorData = {};
        try {
          errorData = await response.json();
        } catch (e) {
          // If we can't parse JSON, use a simple message
        }
        
        const errorMessage = errorData.detail || 'Failed to fetch user profile';
        console.error('Profile fetch error:', errorMessage);
        throw new Error(errorMessage);
      }
      
      const data = await response.json();
      console.log('Profile data received:', data);
      return data;
    } catch (error) {
      console.error('Get user profile error:', error.message);
      throw error;
    }
  },
  
  // Update user profile including monthly income and family
  async updateUserProfile(profileData) {
    try {
      console.log('Updating profile with data:', profileData);
      
      const updateData = {};
      
      // Only include fields that are provided
      if (profileData.monthly_income !== undefined) {
        updateData.monthly_income = parseFloat(profileData.monthly_income);
      }
      
      if (profileData.family !== undefined) {
        updateData.family = profileData.family;
      }
      
      const response = await fetchWithAuth('/api/profile/', {
        method: 'PATCH',
        body: JSON.stringify(updateData)
      });
      
      console.log('Update profile response status:', response.status);
      
      if (!response.ok) {
        let errorData = {};
        try {
          errorData = await response.json();
        } catch (e) {
          // If we can't parse JSON, use a simple message
        }
        
        const errorMessage = errorData.detail || 'Failed to update user profile';
        console.error('Profile update error:', errorMessage);
        throw new Error(errorMessage);
      }
      
      const data = await response.json();
      console.log('Profile update successful:', data);
      return data;
    } catch (error) {
      console.error('Update user profile error:', error.message);
      throw error;
    }
  },
  
  // Get user's family
  async getUserFamily() {
    try {
      const profile = await this.getUserProfile();
      return profile.family;
    } catch (error) {
      console.error('Get user family error:', error);
      return null;
    }
  },
  
  // Join a family
  async joinFamily(familyId) {
    try {
      return await this.updateUserProfile({ family: familyId });
    } catch (error) {
      console.error('Join family error:', error);
      throw error;
    }
  },
  
  // Leave current family
  async leaveFamily() {
    try {
      return await this.updateUserProfile({ family: null });
    } catch (error) {
      console.error('Leave family error:', error);
      throw error;
    }
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
          amount: parseFloat(expenseData.amount),
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
  },
  
  // Get monthly budget status
  async getMonthlyBudgetStatus() {
    try {
      const response = await fetchWithAuth('/api/monthly-budget-status/');
      
      if (!response.ok) {
        throw new Error('Failed to fetch monthly budget status');
      }
      
      return await response.json();
    } catch (error) {
      console.error('Get monthly budget status error:', error);
      return {
        monthly_expenses: 0,
        monthly_budget: 0,
        monthly_income: 0,
        remaining_budget: 0
      };
    }
  }
};

// Family service (updated to work with UserProfile-based membership)
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
  
  // Get family members for the current user's family
  async getFamilyMembers() {
    try {
      const response = await fetchWithAuth('/api/family/');
      if (!response.ok) {
        throw new Error('Failed to fetch family members');
      }
      
      return await response.json();
    } catch (error) {
      console.error('Get family members error:', error);
      // Return empty array instead of throwing since this is often used in rendering
      return [];
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
  
  // Get current user's family
  async getCurrentUserFamily() {
    try {
      const response = await fetchWithAuth('/api/user/familyID/');
      
      if (!response.ok) {
        if (response.status === 404) {
          // User doesn't belong to any family
          return null;
        }
        throw new Error('Failed to fetch user family');
      }
      
      return await response.json();
    } catch (error) {
      console.error('Get user family error:', error);
      throw error;
    }
  }
};

// Family management service (separate service for managing family members)
export const familyManagementService = {
  // Get family members
  async getFamilyMembers() {
    try {
      const response = await fetchWithAuth('/api/family/');
      
      if (!response.ok) {
        throw new Error('Failed to fetch family members');
      }
      
      return await response.json();
    } catch (error) {
      console.error('Get family members error:', error);
      throw error;
    }
  },
  
  // Add a member to family
  async addFamilyMember(familyId, username) {
    try {
      const response = await fetchWithAuth(`/api/families/${familyId}/members/`, {
        method: 'POST',
        body: JSON.stringify({ username })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to add family member');
      }
      
      return await response.json();
    } catch (error) {
      console.error('Add family member error:', error);
      throw error;
    }
  },
  
  // Remove a member from family
  async removeFamilyMember(familyId, username) {
    try {
      const response = await fetchWithAuth(`/api/families/${familyId}/members/`, {
        method: 'DELETE',
        body: JSON.stringify({ username })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to remove family member');
      }
      
      return await response.json();
    } catch (error) {
      console.error('Remove family member error:', error);
      throw error;
    }
  }
};

export const familyFinanceService = {
    // Get family financial data (e.g., income, expenses, savings)
    async getFamilyFinancialData() {
      try {
        const response = await fetchWithAuth('/api/family/finances/');
        if (!response.ok) {
          throw new Error('Failed to fetch family financial data');
        }
        return await response.json();
      } catch (error) {
        console.error('Get family financial data error:', error);
        throw error;
      }
    },
    // Get family income
    async getFamilyIncome() {
      try {
        const response = await fetchWithAuth('/api/family/income/');
        
        if (!response.ok) {
          throw new Error('Failed to fetch family income');
        }
        
        return await response.json();
      } catch (error) {
        console.error('Get family income error:', error);
        return { total_income: 0 }; // Default fallback
      }
    },
    // Get family expenses
    async getFamilyExpenses() {
      try {
        const response = await fetchWithAuth('/api/family/expenses/');
        
        if (!response.ok) {
          throw new Error('Failed to fetch family expenses');
        }
        
        return await response.json();
      } catch (error) {
        console.error('Get family expenses error:', error);
        return { total_expenses: 0 }; // Default fallback
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
        body: JSON.stringify({
          name: budgetData.category,
          amount: parseFloat(budgetData.amount),
          category: budgetData.category
        })
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
        body: JSON.stringify({
          name: goalData.name,
          amount: parseFloat(goalData.amount),
          goal_type: goalData.goalType || 'saving',
          is_personal: goalData.isPersonal !== false,
          family: goalData.family || null
        })
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
  },
  
  // Pin a goal
  async pinGoal(id) {
    try {
      const response = await fetchWithAuth(`/api/goals/${id}/pin/`, {
        method: 'POST'
      });
      
      if (!response.ok) {
        throw new Error('Failed to pin goal');
      }
      
      return await response.json();
    } catch (error) {
      console.error('Pin goal error:', error);
      throw error;
    }
  },
  
  // Unpin a goal
  async unpinGoal(id) {
    try {
      const response = await fetchWithAuth(`/api/goals/${id}/unpin/`, {
        method: 'POST'
      });
      
      if (!response.ok) {
        throw new Error('Failed to unpin goal');
      }
      
      return await response.json();
    } catch (error) {
      console.error('Unpin goal error:', error);
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
        body: JSON.stringify({
          goal: contributionData.goal,
          amount: parseFloat(contributionData.amount)
        })
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
        if (response.status === 404) {
          // Create a new streak if it doesn't exist
          return this.createStreak();
        }
        throw new Error('Failed to fetch streak');
      }
      
      const streaks = await response.json();
      return streaks.length > 0 ? streaks[0] : await this.createStreak();
    } catch (error) {
      console.error('Get streak error:', error);
      throw error;
    }
  },
  
  // Create a new streak
  async createStreak() {
    try {
      const response = await fetchWithAuth('/api/streaks/', {
        method: 'POST',
        body: JSON.stringify({
          count: 1
        })
      });
      
      if (!response.ok) {
        throw new Error('Failed to create streak');
      }
      
      return await response.json();
    } catch (error) {
      console.error('Create streak error:', error);
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
  },
  
  // Check and update streak logic (calls backend endpoint to handle streak logic)
  async checkAndUpdateStreak() {
    try {
      // First get the current streak
      const streak = await this.getStreak();
      
      if (!streak) {
        // Create a new streak if none exists
        return await this.createStreak();
      }
      
      // Use the specific update_streak backend method
      const response = await fetchWithAuth(`/api/streaks/${streak.id}/update_streak/`, {
        method: 'POST'
      });
      
      if (!response.ok) {
        throw new Error('Failed to update streak');
      }
      
      return await response.json();
    } catch (error) {
      console.error('Check and update streak error:', error);
      throw error;
    }
  }
};