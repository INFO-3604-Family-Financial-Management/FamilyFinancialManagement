import { View, Text, SafeAreaView, TouchableOpacity, ActivityIndicator, FlatList, RefreshControl } from 'react-native'
import React, { useState, useEffect, useCallback } from 'react'
import { router } from 'expo-router'
import { useFocusEffect } from '@react-navigation/native'
import CustomButton from '../../components/CustomButton'
import { goalService } from '../../services/api'

const Goals = () => {
  const [goals, setGoals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  const fetchGoals = async () => {
    try {
      setError(null);
      const data = await goalService.getGoals();
      // Filter to show only personal goals (not family goals)
      const personalGoals = data.filter(goal => goal.is_personal);
      setGoals(personalGoals);
    } catch (error) {
      console.error('Error fetching goals:', error);
      setError('Failed to load goals. Please try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Initial fetch on component mount
  useEffect(() => {
    fetchGoals();
  }, []);

  // Refresh when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      console.log('Goals screen in focus - refreshing data');
      fetchGoals();
      return () => {
        // Cleanup function (optional)
      };
    }, [])
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchGoals();
  };

  const renderGoalItem = ({ item }) => {
    return (
      <TouchableOpacity 
        className="flex-row items-center justify-between w-full p-4 mb-4 border-b border-gray-200"
        onPress={() => router.push({pathname: 'edit-goal', params: {goalId: item.id}})}
      >
        <View className="flex-1">
          <Text className="text-lg font-medium">{item.name}</Text>
          <View className="flex-row justify-between mt-1">
            <Text className="text-gray-600">
              Progress: {item.progress_percentage}%
            </Text>
            <Text className="text-gray-600">
              Remaining: ${item.remaining_amount}
            </Text>
          </View>
          
          {/* Simple progress bar */}
          <View className="h-2 bg-gray-200 rounded-full mt-2 w-full">
            <View 
              className="h-full bg-blue-500 rounded-full" 
              style={{ width: `${Math.min(item.progress_percentage, 100)}%` }} 
            />
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView className='bg-gray-500 h-full'>
      <View className="mt-20 items-center">
        <Text className="text-black font-bold text-4xl">Goals</Text>
      </View>
      
      <View className='p-4 rounded-lg mt-5 h-[65vh]'>
        {loading && !refreshing ? (
          <View className="flex-1 justify-center items-center">
            <ActivityIndicator size="large" color="#0000ff" />
          </View>
        ) : error ? (
          <View className="flex-1 justify-center items-center">
            <Text className="text-red-500 text-center">{error}</Text>
            <TouchableOpacity onPress={fetchGoals} className="mt-4 p-2 bg-blue-500 rounded-lg">
              <Text className="text-white">Try Again</Text>
            </TouchableOpacity>
          </View>
        ) : goals.length === 0 ? (
          <View className="flex-1 justify-center bg-white items-center rounded-lg p-4 my-4 w-full">
            <Text className="text-lg text-center">You don't have any goals yet.</Text>
            <Text className="text-gray-600 text-center mt-2">Create a goal to start tracking your progress.</Text>
          </View>
        ) : (
          <FlatList
            data={goals}
            renderItem={renderGoalItem}
            keyExtractor={item => item.id.toString()}
            className="w-full bg-white rounded-lg p-2"
            contentContainerStyle={{ paddingVertical: 10 }}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            }
          />
        )}
      </View>
      
      <CustomButton
        title="Add Goal"
        handlePress={() => router.push('add-goal')}
        containerStyles="mx-8 mt-6"
      />
    </SafeAreaView>
  );
}

export default Goals