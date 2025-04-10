import { View, Text, SafeAreaView, ActivityIndicator } from 'react-native'
import React, { useState, useEffect, useCallback } from 'react'
import { useFocusEffect } from '@react-navigation/native'
import { familyService, familyFinanceService } from '../../services/api'

const FamilySavings = () => {
  const [loading, setLoading] = useState(true);
  const [currentMonth, setCurrentMonth] = useState('');
  const [totalIncome, setTotalIncome] = useState(0);
  const [totalSpent, setTotalSpent] = useState(0);
  const [totalRemaining, setTotalRemaining] = useState(0);
  const [error, setError] = useState(null);
  const [familyName, setFamilyName] = useState('');

  const fetchFamilySavings = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Get the current month name
      const monthNames = [
        "January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"
      ];
      const now = new Date();
      setCurrentMonth(monthNames[now.getMonth()]);
      
      // Get family financial data from our new API endpoint
      console.log('Fetching family financial data...');
      const financialData = await familyFinanceService.getFamilyFinancialData();
      console.log('Retrieved family financial data:', financialData);
      
      // Set family name
      if (financialData.family && financialData.family.name) {
        setFamilyName(financialData.family.name);
      }
      
      // Set income, expenses, and savings
      if (financialData.finances) {
        setTotalIncome(parseFloat(financialData.finances.total_income) || 0);
        setTotalSpent(parseFloat(financialData.finances.total_expenses) || 0);
        setTotalRemaining(parseFloat(financialData.finances.total_savings) || 0);
      }
      
    } catch (err) {
      console.error('Failed to fetch family savings:', err);
      
      // Try fallback approach if the main endpoint fails
      try {
        console.log('Trying fallback approach...');
        
        // Get family details
        const family = await familyService.getCurrentUserFamily();
        if (family && family.name) {
          setFamilyName(family.name);
        }
        
        // Get income and expenses separately
        const incomeData = await familyFinanceService.getFamilyIncome();
        const expenseData = await familyFinanceService.getFamilyExpenses();
        
        const income = parseFloat(incomeData.total_income) || 0;
        const expenses = parseFloat(expenseData.total_expenses) || 0;
        const savings = income > expenses ? income - expenses : 0;
        
        setTotalIncome(income);
        setTotalSpent(expenses);
        setTotalRemaining(savings);
        
      } catch (fallbackErr) {
        console.error('Fallback approach also failed:', fallbackErr);
        setError('Failed to load savings data. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  // Initial fetch when component mounts
  useEffect(() => {
    fetchFamilySavings();
  }, []);

  // Refresh data when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      console.log('Family savings screen in focus - refreshing data');
      fetchFamilySavings();
      
      return () => {
        // Optional cleanup function
        console.log('Family savings screen lost focus');
      };
    }, [])
  );
  
  // Format currency values
  const formatCurrency = (amount) => {
    return `$${parseFloat(amount).toFixed(2)}`;
  };
  
  // Calculate percentages based on total income
  const spentPercentage = totalIncome > 0 ? (totalSpent / totalIncome * 100) : 0;
  const remainingPercentage = totalIncome > 0 ? (totalRemaining / totalIncome * 100) : 0;

  return (
    <SafeAreaView className='bg-gray-500 h-full'>
      <View className='mt-10 items-center'>
        <Text className='text-black font-bold text-3xl'>
          {familyName ? `${familyName} Savings` : 'Family Savings'}
        </Text>
      </View>
      <View className='bg-white p-4 rounded-lg shadow-md m-4 mt-10 h-[65vh]'>
        <Text className="text-2xl font-bold text-gray-900 text-center">
            {currentMonth}
        </Text>  
        
        {loading ? (
          <View className="flex-1 justify-center items-center mt-10">
            <ActivityIndicator size="large" color="#0000ff" />
            <Text className="mt-2 text-gray-700">Loading savings data...</Text>
          </View>
        ) : error ? (
          <View className="flex-1 justify-center items-center mt-10">
            <Text className="text-red-500 text-center">{error}</Text>
          </View>
        ) : (
          <>
            <View className="my-6 px-4">
              {/* Modern Financial Dashboard */}
              {totalIncome > 0 ? (
                <View className="w-full">
                  {/* Large Savings Percentage Display */}
                  <View className="mb-8">
                    <Text className="text-gray-600 text-sm">SAVINGS RATE</Text>
                    <Text className="text-6xl font-bold text-blue-600">
                      {Math.round(remainingPercentage)}%
                    </Text>
                    <Text className="text-gray-500 text-sm mt-1">
                      of monthly family income
                    </Text>
                  </View>
                  
                  {/* Simple Bar Visualization */}
                  <View className="mb-6">
                    <View className="h-8 bg-gray-200 rounded-lg w-full overflow-hidden flex-row">
                      <View 
                        className="h-full bg-red-400" 
                        style={{ width: `${spentPercentage}%` }} 
                      />
                      <View 
                        className="h-full bg-blue-400" 
                        style={{ width: `${remainingPercentage}%` }} 
                      />
                    </View>
                    
                    {/* Legend */}
                    <View className="flex-row justify-between mt-2">
                      <View className="flex-row items-center">
                        <View className="w-3 h-3 bg-red-400 rounded-full mr-1" />
                        <Text className="text-gray-700">Spent ({Math.round(spentPercentage)}%)</Text>
                      </View>
                      <View className="flex-row items-center">
                        <View className="w-3 h-3 bg-blue-400 rounded-full mr-1" />
                        <Text className="text-gray-700">Saved ({Math.round(remainingPercentage)}%)</Text>
                      </View>
                    </View>
                  </View>
                  
                  {/* Monthly Spending Summary */}
                  <View className="bg-gray-100 p-4 rounded-lg">
                    <Text className="text-gray-600 text-sm mb-2">MONTHLY SUMMARY</Text>
                    <View className="flex-row justify-between mb-1">
                      <Text className="text-gray-600">Total Income</Text>
                      <Text className="font-semibold">{formatCurrency(totalIncome)}</Text>
                    </View>
                    <View className="flex-row justify-between mb-1">
                      <Text className="text-gray-600">Total Spent</Text>
                      <Text className="font-semibold text-red-500">{formatCurrency(totalSpent)}</Text>
                    </View>
                    <View className="h-px bg-gray-300 my-2" />
                    <View className="flex-row justify-between">
                      <Text className="text-gray-600">Remaining</Text>
                      <Text className="font-semibold text-blue-500">{formatCurrency(totalRemaining)}</Text>
                    </View>
                  </View>
                </View>
              ) : (
                <Text className="text-gray-500 text-center my-10">
                  No income data available for this month
                </Text>
              )}
            </View>
          </>
        )}
      </View>
    </SafeAreaView>
  )
}

export default FamilySavings