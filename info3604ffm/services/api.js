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
    
    // Add more detailed logging in development
    if (__DEV__) {
      console.log('Making request to:', fullUrl);
      console.log('Request details:', {
        method: options.method || 'GET',
        headers,
        body: options.body ? JSON.parse(options.body) : undefined
      });
    }

    try {
      const response = await fetch(fullUrl, {
        ...options,
        headers,
      });
      
      // Enhanced error logging in development
      if (__DEV__) {
        console.log('Response status:', response.status);
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          console.error('Response error:', {
            status: response.status,
            statusText: response.statusText,
            data: errorData
          });
          
          // Return early to avoid double parsing
          return response;
        }
      } else if (!response.ok) {
        await response.json().catch(() => ({}));
        return response;
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
  
  async getFamily() {
    try {
      // First get all families
      const response = await fetchWithAuth('/api/families/');
      
      if (!response.ok) {
        throw new Error('Failed to fetch families');
      }
      
      const families = await response.json();
      
      // If no families exist, return null
      if (!families || families.length === 0) {
        return null;
      }
  
      // Get the current user's family members to identify the family they belong to
      const familyMembersResponse = await fetchWithAuth('/api/family/');
      
      if (!familyMembersResponse.ok) {
        // If we can't get family members, just return the first family as a fallback
        console.warn('Could not determine specific family, using first available');
        return families[0];
      }
      
      const familyData = await familyMembersResponse.json();
      
      // The /api/family/ endpoint should return data that includes the family ID
      // If it does, use that to find the correct family
      if (familyData && familyData.family_id) {
        const userFamily = families.find(f => f.id === familyData.family_id);
        return userFamily || families[0]; // Return user's family or first as fallback
      }
      
      // If we can't determine specific family, return the first one
      return families[0];
    }
    catch (error) {
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
  
  // Add a member to a family
  async addFamilyMember(familyId, username) {
    try {
      const response = await fetchWithAuth(`/api/families/${familyId}/members/`, {
        method: 'POST',
        body: JSON.stringify({ username })
      });
      
      if (!response.ok) {
        throw new Error('Failed to add family member');
      }
      
      return await response.json();
    } catch (error) {
      console.error('Add family member error:', error);
      throw error;
    }
  },
  
  // Remove a member from a family
  async removeFamilyMember(familyId, username) {
    try {
      const response = await fetchWithAuth(`/api/families/${familyId}/members/`, {
        method: 'DELETE',
        body: JSON.stringify({ username })
      });
      
      if (!response.ok) {
        throw new Error('Failed to remove family member');
      }
      
      return await response.json();
    } catch (error) {
      console.error('Remove family member error:', error);
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

// Income service
export const incomeService = {
  // Get all income entries
  async getIncome() {
    try {
      const response = await fetchWithAuth('/api/income/');
      
      if (!response.ok) {
        throw new Error('Failed to fetch income');
      }
      
      return await response.json();
    } catch (error) {
      console.error('Get income error:', error);
      throw error;
    }
  },
  
  // Add a new income entry
  async addIncome(incomeData) {
    try {
      const response = await fetchWithAuth('/api/income/', {
        method: 'POST',
        body: JSON.stringify({
          amount: parseFloat(incomeData.amount),
          description: incomeData.description || ''
        })
      });
      
      if (!response.ok) {
        throw new Error('Failed to add income');
      }
      
      return await response.json();
    } catch (error) {
      console.error('Add income error:', error);
      throw error;
    }
  },
  
  // Delete an income entry
  async deleteIncome(id) {
    try {
      const response = await fetchWithAuth(`/api/income/${id}/`, {
        method: 'DELETE'
      });
      
      if (!response.ok) {
        throw new Error('Failed to delete income');
      }
      
      return await response.json();
    } catch (error) {
      console.error('Delete income error:', error);
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

// Unified service for family management (for existing components)
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