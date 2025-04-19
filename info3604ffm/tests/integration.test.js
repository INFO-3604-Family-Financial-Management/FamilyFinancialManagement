// info3604ffm/tests/integration.test.js

import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { NavigationContainer } from '@react-navigation/native';
import '@testing-library/jest-native/extend-expect';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Mock modules that are used
jest.mock('axios');
jest.mock('@react-native-async-storage/async-storage');
jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn().mockResolvedValue('mock-token'),
  setItemAsync: jest.fn(),
  deleteItemAsync: jest.fn(),
}));
jest.mock('@react-navigation/native', () => {
  const actualNav = jest.requireActual('@react-navigation/native');
  return {
    ...actualNav,
    useNavigation: () => ({
      navigate: jest.fn(),
      goBack: jest.fn(),
    }),
  };
});
jest.mock('expo-router', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
  }),
  useLocalSearchParams: () => ({
    goalId: '1',
    family: 'false',
    username: 'testuser',
  }),
}));

// Import components to test
import SignIn from '../app/(auth)/sign-in';
import Home from '../app/(tabs)/home';
import Budget from '../app/(tabs)/budget';
import Goals from '../app/(tabs)/goals';
import ExpenseTracking from '../app/(tabs)/expense-tracking';

// Mock service responses
const mockExpenses = [
  {
    id: 1,
    description: 'Grocery shopping',
    amount: '120.50',
    date: '2025-04-15',
    user: 1,
    budget: 1,
    goal: null,
    created_at: '2025-04-15T12:30:45Z'
  },
  {
    id: 2,
    description: 'Movie tickets',
    amount: '30.00',
    date: '2025-04-16',
    user: 1,
    budget: 2,
    goal: null,
    created_at: '2025-04-16T18:20:10Z'
  }
];

const mockBudgets = [
  {
    id: 1,
    name: 'Groceries',
    amount: '500.00',
    category: 'Food',
    user: 1,
    created_at: '2025-04-01T00:00:00Z',
    used_amount: '220.50',
    remaining_amount: '279.50',
    usage_percentage: 44.1
  },
  {
    id: 2,
    name: 'Entertainment',
    amount: '300.00',
    category: 'Leisure',
    user: 1,
    created_at: '2025-04-01T00:00:00Z',
    used_amount: '150.00',
    remaining_amount: '150.00',
    usage_percentage: 50.0
  }
];

const mockGoals = [
  {
    id: 1,
    name: 'New Car',
    amount: '10000.00',
    goal_type: 'saving',
    is_personal: true,
    user: 1,
    family: null,
    created_at: '2025-04-01T00:00:00Z',
    pinned: false,
    progress: '2500.00',
    progress_percentage: 25.0,
    remaining_amount: '7500.00'
  },
  {
    id: 2,
    name: 'Vacation',
    amount: '5000.00',
    goal_type: 'saving',
    is_personal: true,
    user: 1,
    family: null,
    created_at: '2025-04-02T00:00:00Z',
    pinned: true,
    progress: '1000.00',
    progress_percentage: 20.0,
    remaining_amount: '4000.00'
  }
];

const mockProfile = {
  user: 1,
  username: 'testuser',
  email: 'test@example.com',
  family: 1,
  monthly_income: '5000.00',
  created_at: '2025-04-01T00:00:00Z',
  last_updated: '2025-04-15T10:30:45Z'
};

describe('Authentication Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should handle login correctly', async () => {
    // Mock API response for successful login
    axios.post.mockResolvedValueOnce({
      data: { access: 'test-access-token', refresh: 'test-refresh-token' }
    });

    const { getByText, getByPlaceholderText } = render(
      <NavigationContainer>
        <SignIn />
      </NavigationContainer>
    );

    // Fill in login form
    fireEvent.changeText(getByPlaceholderText('Username'), 'testuser');
    fireEvent.changeText(getByPlaceholderText('Password'), 'password123');
    
    // Submit the form
    fireEvent.press(getByText('Sign In'));

    // Wait for API call to complete
    await waitFor(() => {
      expect(axios.post).toHaveBeenCalledWith(
        expect.stringContaining('/api/token/'), 
        { username: 'testuser', password: 'password123' }
      );
    });

    // Check if tokens were stored
    expect(AsyncStorage.setItem).toHaveBeenCalledWith('tfr_access_token', 'test-access-token');
    expect(AsyncStorage.setItem).toHaveBeenCalledWith('tfr_refresh_token', 'test-refresh-token');
  });

  it('should show error on failed login', async () => {
    // Mock API response for failed login
    axios.post.mockRejectedValueOnce({
      response: { 
        data: { detail: 'Invalid credentials' },
        status: 401
      }
    });

    const { getByText, getByPlaceholderText, findByText } = render(
      <NavigationContainer>
        <SignIn />
      </NavigationContainer>
    );

    // Fill in login form with incorrect credentials
    fireEvent.changeText(getByPlaceholderText('Username'), 'wronguser');
    fireEvent.changeText(getByPlaceholderText('Password'), 'wrongpass');
    
    // Submit the form
    fireEvent.press(getByText('Sign In'));

    // Wait for error alert to appear
    const alertText = await findByText('Login Failed');
    expect(alertText).toBeTruthy();
  });
});

describe('Home Screen Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock API responses
    axios.get.mockImplementation((url) => {
      if (url.includes('/api/expenses/recent/')) {
        return Promise.resolve({ data: mockExpenses });
      } else if (url.includes('/api/profile/')) {
        return Promise.resolve({ data: mockProfile });
      } else if (url.includes('/api/streaks/')) {
        return Promise.resolve({ data: [{ id: 1, count: 7, last_updated: '2025-04-19T00:00:00Z' }] });
      }
      return Promise.reject(new Error('not found'));
    });
  });

  it('should display recent transactions and income', async () => {
    const { findByText } = render(
      <NavigationContainer>
        <Home />
      </NavigationContainer>
    );

    // Check if monthly income is displayed
    const incomeText = await findByText(/Monthly Income/);
    expect(incomeText).toBeTruthy();
    
    // Check if transactions are displayed
    const transaction1 = await findByText('Grocery shopping');
    expect(transaction1).toBeTruthy();
    
    const transaction2 = await findByText('Movie tickets');
    expect(transaction2).toBeTruthy();
  });

  it('should fetch and display streak info', async () => {
    const { findByText } = render(
      <NavigationContainer>
        <Home />
      </NavigationContainer>
    );

    // Check if streak count is displayed
    const streakText = await findByText('7');
    expect(streakText).toBeTruthy();
  });
});

describe('Budget Screen Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock API responses
    axios.get.mockImplementation((url) => {
      if (url.includes('/api/budgets/')) {
        return Promise.resolve({ data: mockBudgets });
      }
      return Promise.reject(new Error('not found'));
    });
  });

  it('should display budget categories and their progress', async () => {
    const { findByText } = render(
      <NavigationContainer>
        <Budget />
      </NavigationContainer>
    );

    // Check if budget categories are displayed
    const category1 = await findByText('Food');
    expect(category1).toBeTruthy();
    
    const category2 = await findByText('Leisure');
    expect(category2).toBeTruthy();
    
    // Check if amounts are displayed
    const amount1 = await findByText('$220.50 of $500.00');
    expect(amount1).toBeTruthy();
    
    const amount2 = await findByText('$150.00 of $300.00');
    expect(amount2).toBeTruthy();
  });
});

describe('Goals Screen Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock API responses
    axios.get.mockImplementation((url) => {
      if (url.includes('/api/goals/')) {
        return Promise.resolve({ data: mockGoals });
      }
      return Promise.reject(new Error('not found'));
    });
  });

  it('should display goals and their progress', async () => {
    const { findByText } = render(
      <NavigationContainer>
        <Goals />
      </NavigationContainer>
    );

    // Check if goals are displayed
    const goal1 = await findByText('New Car');
    expect(goal1).toBeTruthy();
    
    const goal2 = await findByText('Vacation');
    expect(goal2).toBeTruthy();
    
    // Check if progress is displayed
    const progress1 = await findByText('Progress: 25%');
    expect(progress1).toBeTruthy();
    
    const progress2 = await findByText('Progress: 20%');
    expect(progress2).toBeTruthy();
  });
});

describe('Expense Tracking Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock API responses
    axios.get.mockImplementation((url) => {
      if (url.includes('/api/budgets/')) {
        return Promise.resolve({ data: mockBudgets });
      } else if (url.includes('/api/goals/')) {
        return Promise.resolve({ data: mockGoals });
      }
      return Promise.reject(new Error('not found'));
    });
    
    axios.post.mockResolvedValue({
      data: { 
        id: 3, 
        description: 'New Expense', 
        amount: '75.00',
        date: '2025-04-19',
        user: 1,
        budget: 1,
        goal: null,
        created_at: '2025-04-19T15:30:00Z'
      }
    });
  });

  it('should allow adding a new expense', async () => {
    const { findByText, findByPlaceholderText, findAllByText } = render(
      <NavigationContainer>
        <ExpenseTracking />
      </NavigationContainer>
    );

    // Wait for the component to load
    await findByText('New Expense');
    
    // Fill in expense details
    const titleInput = await findByPlaceholderText('Enter expense name');
    fireEvent.changeText(titleInput, 'New Expense');
    
    const amountInput = await findByPlaceholderText('Enter amount');
    fireEvent.changeText(amountInput, '75.00');
    
    // Select budget (this is simplified since the actual dropdown selection is complex)
    const budgetSelectors = await findAllByText('Select a budget');
    fireEvent.press(budgetSelectors[0]);
    
    // Save the expense
    const saveButton = await findByText('Save Expense');
    fireEvent.press(saveButton);
    
    // Verify API call
    await waitFor(() => {
      expect(axios.post).toHaveBeenCalledWith(
        expect.stringContaining('/api/expenses/'),
        expect.objectContaining({
          description: 'New Expense',
          amount: 75.0
        })
      );
    });
  });

  it('should allow adding a contribution to a savings goal', async () => {
    const { findByText, findByPlaceholderText, findAllByText } = render(
      <NavigationContainer>
        <ExpenseTracking />
      </NavigationContainer>
    );

    // Switch to Contribution mode
    const contributionTab = await findByText('Contribution');
    fireEvent.press(contributionTab);
    
    // Wait for the component to update
    await findByText('New Contribution');
    
    // Fill in contribution details
    const amountInput = await findByPlaceholderText('Enter amount');
    fireEvent.changeText(amountInput, '500.00');
    
    // Select a savings goal (simplified)
    const goalSelectors = await findAllByText('Select a savings goal');
    fireEvent.press(goalSelectors[0]);
    
    // Save the contribution
    const saveButton = await findByText('Save Contribution');
    fireEvent.press(saveButton);
    
    // Verify API call
    await waitFor(() => {
      expect(axios.post).toHaveBeenCalledWith(
        expect.stringContaining('/api/contributions/'),
        expect.objectContaining({
          amount: 500.0
        })
      );
    });
  });
});