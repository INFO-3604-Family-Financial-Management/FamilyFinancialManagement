import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, Image, FlatList, TouchableOpacity, SafeAreaView, RefreshControl } from 'react-native';
import axios from 'axios';
import { router } from 'expo-router';
import CustomButton from '../../components/CustomButton';
import { BACKEND_URL } from '../../constants/config';
import { authService } from '../../services/api';

const FamilyMembers = () => {
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
          <Text className="text-black text-2xl">Family Members</Text>
        </View>
        <View className="bg-white p-4 rounded-lg items-center justify-center text shadow-md m-4 mt-10 h-[65vh]">
          <FlatList
          className=''
            data={expenses}
            keyExtractor={(item) => item.id.toString()}
            renderItem={({ item }) => (
              <View className="items-center justify py-3 border-b border-gray-200 last:border-b-0">
                <TouchableOpacity className="flex-row items-center justify-between w-full p-4 border border-gray-300 rounded-lg"
                    onPress={() => router.push('edit-family')}
                >
                    <Text className="text-lg text-center font-medium w-full">{item.description}</Text>
                </TouchableOpacity>
              </View>
            )}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          />
        </View>
        <CustomButton
          title="View Budgets"
          handlePress={() => router.push('/budget')}
          containerStyles="mx-8 mt-6"
        />
      </SafeAreaView>
    );
  };

export default FamilyMembers