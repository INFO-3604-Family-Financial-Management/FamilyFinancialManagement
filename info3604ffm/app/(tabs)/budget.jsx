import { View, Text, TouchableOpacity, ActivityIndicator, FlatList, RefreshControl } from 'react-native'
import React, { useState, useEffect, useCallback } from 'react'
import { router } from 'expo-router'
import { useFocusEffect } from '@react-navigation/native'
import { SafeAreaView } from 'react-native-safe-area-context'
import CustomButton from '@/components/CustomButton'
import { budgetService } from '@/services/api'

const Budget = () => {
  const [currentMonth, setCurrentMonth] = useState('');
  const [budgets, setBudgets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [totals, setTotals] = useState({
    spent: 0,
    remaining: 0
  });

  const fetchBudgets = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Get current month name
      const monthNames = [
        "January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"
      ];
      const now = new Date();
      setCurrentMonth(monthNames[now.getMonth()]);
      
      // Get all budgets for the current user
      const budgetData = await budgetService.getBudgets();
      
      if (!budgetData || !Array.isArray(budgetData)) {
        throw new Error('Invalid budget data received');
      }
      
      // Transform data into the expected format
      const budgetCategories = budgetData.map(budget => ({
        id: budget.id,
        category: budget.category,
        name: budget.name,
        amount: budget.amount,
        spent: budget.used_amount || 0,
        remaining: budget.remaining_amount || 0
      }));
      
      // Sort budget categories for consistent display
      const sortedBudgets = budgetCategories.sort((a, b) => 
        a.category.localeCompare(b.category)
      );
      
      setBudgets(sortedBudgets);
      
      // Calculate totals
      const totalSpent = sortedBudgets.reduce((sum, budget) => sum + Number(budget.spent), 0);
      const totalRemaining = sortedBudgets.reduce((sum, budget) => sum + Number(budget.remaining), 0);
      
      setTotals({
        spent: totalSpent,
        remaining: totalRemaining
      });
      
    } catch (err) {
      console.error('Failed to fetch budgets:', err);
      setError('Failed to load budget data. Please try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Initial fetch
  useEffect(() => {
    fetchBudgets();
  }, []);

  // Pull-to-refresh handler
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchBudgets();
  }, []);

  useFocusEffect(
      useCallback(() => {
        console.log('Goals screen in focus - refreshing data');
        fetchBudgets();
        return () => {
          // Cleanup function (optional)
        };
      }, [])
    );

  // Format currency values
  const formatCurrency = (amount) => {
    return `$${parseFloat(amount).toFixed(2)}`;
  };

  // Render budget item for the FlatList
  const renderBudgetItem = ({ item }) => (
    <TouchableOpacity 
      className="bg-white p-4 rounded-lg mb-3 shadow"
    >
      <View className="flex-row justify-between items-center">
        <Text className="text-lg font-medium">{item.category}</Text>
      </View>
      
      <View className="mt-2 mb-1">
        <Text className="text-gray-600">{formatCurrency(item.spent)} of {formatCurrency(item.amount)}</Text>
      </View>
      
      {/* Progress bar */}
      <View className="h-3 bg-gray-200 rounded-full w-full mt-2">
        <View 
          className="h-3 bg-blue-500 rounded-full" 
          style={{ width: `${Math.min((item.spent / item.amount) * 100, 100)}%` }}
        />
      </View>
      
      <Text className="text-right text-sm text-gray-600 mt-1">
        {formatCurrency(item.remaining)} remaining
      </Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView className="bg-gray-500 h-full">
        <View className="mt-10 items-center">
            <Text className="text-black font-bold text-3xl">Budgets</Text>
        </View>
        <View className='p-4 rounded-lg m-4 mt-5 h-[65vh]'>
            <View className="bg-white p-4 rounded-lg mb-4">
              <Text className="text-2xl font-bold text-gray-900 text-center">
                  {currentMonth}
              </Text>
            </View>
            
            {loading && !refreshing ? (
              <View className="flex-1 justify-center items-center">
                <ActivityIndicator size="large" color="#0000ff" />
                <Text className="text-white mt-2">Loading budgets...</Text>
              </View>
            ) : error ? (
              <View className="flex-1 justify-center items-center">
                <Text className="text-white text-center mb-4">{error}</Text>
                <CustomButton 
                  title="Try Again" 
                  handlePress={fetchBudgets} 
                />
              </View>
            ) : budgets.length === 0 ? (
              <View className="flex-1 justify-center items-center bg-white rounded-lg p-4">
                <Text className="text-gray-500 text-center">No budget categories found. Add a new category to get started.</Text>
              </View>
            ) : (
              <>
                <FlatList
                  data={budgets}
                  keyExtractor={(item) => item.id.toString()}
                  renderItem={renderBudgetItem}
                  refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                  }
                  className="w-full mb-4"
                  showsVerticalScrollIndicator={false}
                  contentContainerStyle={{ paddingVertical: 4 }}
                />
                
                <View className="bg-white p-4 rounded-lg">
                  <View className="flex-row justify-between mb-1">
                    <Text className="text-lg font-medium">Total Spent:</Text>
                    <Text className="text-lg font-medium">{formatCurrency(totals.spent)}</Text>
                  </View>
                  <View className="flex-row justify-between">
                    <Text className="text-lg font-medium">Total Remaining:</Text>
                    <Text className="text-lg font-medium">{formatCurrency(totals.remaining)}</Text>
                  </View>
                </View>
              </>
            )}
        </View>

        <CustomButton
          title="Add Category"
          handlePress={() => router.push("/create-budget")}
          containerStyles="mx-8 mt-2"
        />
    </SafeAreaView>
  )
}

export default Budget