import { View, Text, SafeAreaView, TouchableOpacity, FlatList, ActivityIndicator, RefreshControl, Alert } from 'react-native'
import React, { useState, useEffect } from 'react'
import { router } from 'expo-router'
import CustomButton from '../../components/CustomButton'
import { goalService, familyService } from '../../services/api'
import { Ionicons } from '@expo/vector-icons'

const FamilyGoals = () => {
  const [goals, setGoals] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [familyId, setFamilyId] = useState(null);

  const fetchFamilyGoals = async () => {
    try {
      // First get the family ID - using getCurrentUserFamily instead of getFamily
      const family = await familyService.getCurrentUserFamily();
      if (!family || !family.id) {
        setIsLoading(false);
        return;
      }
      
      setFamilyId(family.id);
      
      // Then fetch all goals
      const allGoals = await goalService.getGoals();
      
      // Filter out family goals for this family
      const familyGoals = allGoals.filter(goal => 
        goal.family && goal.family.toString() === family.id.toString() && !goal.is_personal
      );
      
      setGoals(familyGoals || []);
    } catch (error) {
      console.error('Error fetching family goals:', error);
      Alert.alert("Error", "Failed to load family goals");
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  // Fetch goals when component mounts
  useEffect(() => {
    fetchFamilyGoals();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchFamilyGoals();
  };

  const navigateToEditGoal = (goalId) => {
    router.push({
      pathname: 'edit-family-goal',
      params: { goalId }
    });
  };

  const renderGoalItem = ({ item }) => {
    // Calculate progress percentage
    const progress = parseFloat(item.progress_percentage) || 0;
    
    return (
      <TouchableOpacity 
        className="bg-white rounded-lg p-4 my-2 shadow-sm"
        onPress={() => navigateToEditGoal(item.id)}
      >
        <View className="flex-row justify-between items-center">
          <Text className="text-lg font-medium">{item.name}</Text>
          <Text className="text-sm text-blue-600 font-medium">
            {item.goal_type === 'saving' ? 'Saving' : 'Spending'}
          </Text>
        </View>
        
        <View className="mt-2 mb-1">
          <Text className="text-gray-600">${item.progress || 0} of ${item.amount}</Text>
        </View>
        
        {/* Progress bar */}
        <View className="h-4 bg-gray-200 rounded-full w-full mt-2">
          <View 
            className="h-4 bg-blue-500 rounded-full" 
            style={{ width: `${Math.min(progress, 100)}%` }}
          />
        </View>
        
        <Text className="text-right text-sm text-gray-600 mt-1">{progress.toFixed(0)}%</Text>
      </TouchableOpacity>
    );
  };

  const renderEmptyList = () => (
    <View className="flex-1 justify-center items-center mt-10">
      {!isLoading && (
        <>
          <Ionicons name="flag-outline" size={64} color="#888" />
          <Text className="text-lg text-gray-600 mt-4 text-center">
            {!familyId 
              ? "You need to join a family first to see family goals" 
              : "No family goals found. Add your first goal!"}
          </Text>
          {!familyId && (
            <CustomButton
              title="Go to Family"
              handlePress={() => router.push('family')}
              containerStyles="mt-6 w-3/4"
            />
          )}
        </>
      )}
    </View>
  );

  return (
    <SafeAreaView className='bg-gray-500 h-full'>
      <View className="mt-20 items-center">
        <Text className="text-black font-bold text-4xl">Family Goals</Text>
      </View>
      
      <View className='p-4 rounded-lg mt-5 h-[55vh]'>
        {isLoading ? (
          <View className="flex-1 justify-center items-center">
            <ActivityIndicator size="large" color="#0000ff" />
            <Text className="mt-2 text-gray-700">Loading goals...</Text>
          </View>
        ) : (
          <FlatList
            data={goals}
            keyExtractor={(item) => item.id.toString()}
            renderItem={renderGoalItem}
            ListEmptyComponent={renderEmptyList}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            }
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ flexGrow: 1 }}
          />
        )}
      </View>
      
      <CustomButton
        title="Add Goal"
        handlePress={() => router.push('add-family-goal')}
        containerStyles="mx-8 mt-6"
        disabled={!familyId}
      />
    </SafeAreaView>
  );
};

export default FamilyGoals;