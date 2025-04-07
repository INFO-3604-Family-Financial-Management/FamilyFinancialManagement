import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, SafeAreaView, RefreshControl } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { router } from 'expo-router';
import CustomButton from '../../components/CustomButton';
import StreakIndicator from '../../components/StreakIndicator';
import { expenseService, profileService } from '../../services/api';

const HomeScreen = () => {
  const [expenses, setExpenses] = useState([]);
  const [income, setIncome] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Function to fetch all required data
  const fetchData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Fetch recent expenses
      const expensesData = await expenseService.getRecentExpenses();
      setExpenses(expensesData);
      
      // Fetch user profile to get income
      try {
        const profile = await profileService.getUserProfile();
        console.log('Profile data received on home screen:', profile);
        setIncome(parseFloat(profile?.monthly_income || 0));
      } catch (profileError) {
        console.error('Error fetching profile:', profileError);
        // Don't fail completely if just the profile fails
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      setError('Failed to load data. Pull down to refresh.');
    } finally {
      setLoading(false);
    }
  };

  // Initial data fetch
  useEffect(() => {
    fetchData();
  }, []);

  // Refetch data when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      console.log('Home screen in focus - refreshing data');
      fetchData();
      return () => {
        // Optional cleanup function
      };
    }, [])
  );

  // Pull-to-refresh functionality
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  }, []);

  // Format currency
  const formatCurrency = (amount) => {
    return `$${parseFloat(amount).toFixed(2)}`;
  };

  return (
    <SafeAreaView className="bg-gray-500 h-full">
      <StreakIndicator />
      <View className="mt-10 items-center">
        <Text className="text-black text-2xl">Home</Text>
      </View>
      
      {/* Income Display */}
      <TouchableOpacity 
        className="bg-gray-700 border-2 border-gray-200 h-24 mx-4 mt-8 rounded-2xl items-center justify-center"
        onPress={() => router.push('edit-profile')}
      >
        <Text className="text-white text-xl font-bold text-center">
          Monthly Income {'\n'} {formatCurrency(income)}
        </Text>
      </TouchableOpacity>

      <View className="bg-white p-4 rounded-lg shadow-md m-4 mt-8">
        <View className="flex-row justify-between mb-4">
          <Text className="text-xl font-bold text-gray-900">Latest Transactions</Text>
          <TouchableOpacity onPress={() => router.push('/expenses')}>
            <Text className="text-sm text-blue-600">View all</Text>
          </TouchableOpacity>
        </View>

        {error && (
          <Text className="text-red-500 py-2 text-center">{error}</Text>
        )}

        {loading && !refreshing ? (
          <Text className="text-gray-500 py-4 text-center">Loading...</Text>
        ) : expenses.length === 0 ? (
          <Text className="text-gray-500 py-4 text-center">No recent transactions</Text>
        ) : (
          <FlatList
            data={expenses}
            keyExtractor={(item) => item.id.toString()}
            renderItem={({ item }) => (
              <View className="flex-row items-center py-3 border-b border-gray-200 last:border-b-0">
                <View className="flex-1 ml-4">
                  <Text className="text-sm text-gray-500">{item.description}</Text>
                </View>
                <Text className="text-base font-semibold text-gray-900">{formatCurrency(item.amount)}</Text>
              </View>
            )}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          />
        )}
      </View>

      <CustomButton
        title="Add Expense"
        handlePress={() => router.push('/expense-tracking')}
        containerStyles="mx-8 mt-6"
      />
      
      <CustomButton
        title="View Budgets"
        handlePress={() => router.push('/budget')}
        containerStyles="mx-8 mt-2"
      />
    </SafeAreaView>
  );
};

export default HomeScreen;