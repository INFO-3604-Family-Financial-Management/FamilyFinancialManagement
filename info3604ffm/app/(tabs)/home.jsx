import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, Image, FlatList, TouchableOpacity, SafeAreaView, RefreshControl } from 'react-native';
import axios from 'axios';
import { router } from 'expo-router';
import CustomButton from '@/components/CustomButton';
import { BACKEND_URL } from '@/constants/config';
import { authService } from '@/services/api';

const LatestCustomers = () => {
  const [expenses, setExpenses] = useState([]);
  const [refreshing, setRefreshing] = useState(false);

  const fetchRecentExpenses = async () => {
    try {
      const token = await authService.getAccessToken();
      const response = await axios.get(`${BACKEND_URL}/api/expenses/recent/`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setExpenses(response.data);
    } catch (error) {
      console.error('Error fetching recent expenses:', error);
    }
  };

  useEffect(() => {
    fetchRecentExpenses();
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchRecentExpenses();
    setRefreshing(false);
  }, []);

  return (
    <SafeAreaView className="bg-gray-500 h-full">
      <View className="mt-10 items-center">
        <Text className="text-black text-2xl">Home</Text>
      </View>
      <View className="bg-gray-700 border-2 border-gray-200 h-24 mx-6 mt-10 flex-row rounded-2xl items-center justify-center">
        <Text className="text-white text-2xl font-extrabold text-center">
          Budget {'\n'} $2000
        </Text>
      </View>
      <View className="bg-white p-4 rounded-lg shadow-md m-4 mt-10">
        <View className="flex-row justify-between mb-4">
          <Text className="text-xl font-bold text-gray-900">Latest Transactions</Text>
          <TouchableOpacity onPress={() => router.push('/expenses')}>
            <Text className="text-sm text-blue-600">View all</Text>
          </TouchableOpacity>
        </View>

        <FlatList
          data={expenses}
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item }) => (
            <View className="flex-row items-center py-3 border-b border-gray-200 last:border-b-0">
              <View className="flex-1 ml-4">
                <Text className="text-sm text-gray-500">{item.description}</Text>
              </View>
              <Text className="text-base font-semibold text-gray-900">{item.amount}</Text>
            </View>
          )}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        />
      </View>
      <CustomButton
        title="View Budgets"
        handlePress={() => router.push('/goals')}
        containerStyles="mx-8 mt-6"
      />
    </SafeAreaView>
  );
};

export default LatestCustomers;