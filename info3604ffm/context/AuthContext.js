import React, { createContext, useState, useContext, useEffect } from 'react';
import { authService } from '@/services/api';
import { router } from 'expo-router';

// Create context
const AuthContext = createContext();

// Auth provider component
export function AuthProvider({ children }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Check authentication status on mount
  useEffect(() => {
    checkAuthStatus();
  }, []);

  // Function to check if user is authenticated
  const checkAuthStatus = async () => {
    setIsLoading(true);
    try {
      const isLoggedIn = await authService.isLoggedIn();
      setIsAuthenticated(isLoggedIn);
    } catch (error) {
      console.error('Auth check error:', error);
      setIsAuthenticated(false);
    } finally {
      setIsLoading(false);
    }
  };

  // Login function
  const login = async (credentials) => {
    try {
      await authService.login(credentials);
      setIsAuthenticated(true);
      return true;
    } catch (error) {
      console.error('Login error in context:', error);
      return false;
    }
  };

  // Register function
  const register = async (userData) => {
    try {
      await authService.register(userData);
      return true;
    } catch (error) {
      console.error('Register error in context:', error);
      return false;
    }
  };

  // Logout function
  const logout = async () => {
    try {
      await authService.logout();
      setIsAuthenticated(false);
      router.replace('/sign-in');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  // Context value
  const value = {
    isAuthenticated,
    isLoading,
    login,
    logout,
    register,
    checkAuthStatus,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// Custom hook to use auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
