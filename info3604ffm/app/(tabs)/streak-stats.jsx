import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, ActivityIndicator, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { streakService } from '../../services/api';
import CustomButton from '../../components/CustomButton';

const StreakStats = () => {
  const [streak, setStreak] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchStreakData();
  }, []);

  const fetchStreakData = async () => {
    try {
      setLoading(true);
      setError(null);
      const streakData = await streakService.getStreak();
      setStreak(streakData);
    } catch (error) {
      console.error('Error fetching streak:', error);
      setError('Failed to load streak data');
    } finally {
      setLoading(false);
    }
  };

  // Get the streak tier based on count
  const getStreakTier = (count = 0) => {
    if (count >= 365) return { name: "Diamond", color: "#B9F2FF", discount: "10%" };
    if (count >= 180) return { name: "Platinum", color: "#E5E4E2", discount: "7.5%" };
    if (count >= 90) return { name: "Gold", color: "#FFD700", discount: "5%" };
    if (count >= 30) return { name: "Silver", color: "#C0C0C0", discount: "2.5%" };
    if (count >= 7) return { name: "Bronze", color: "#CD7F32", discount: "1%" };
    return { name: "Beginner", color: "#A0A0A0", discount: "0%" };
  };

  // Calculate days until next tier
  const getDaysUntilNextTier = (count = 0) => {
    if (count < 7) return 7 - count;
    if (count < 30) return 30 - count;
    if (count < 90) return 90 - count;
    if (count < 180) return 180 - count;
    if (count < 365) return 365 - count;
    return 0; // Already at max tier
  };

  // Calculate streak start date
  const getStreakStartDate = (count = 0, lastUpdated = new Date()) => {
    const date = new Date(lastUpdated);
    date.setDate(date.getDate() - count + 1);
    return date.toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    });
  };

  // Format last updated date
  const formatLastUpdated = (dateString) => {
    if (!dateString) return 'Never';
    
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    });
  };

  return (
    <SafeAreaView className="bg-gray-500 h-full">
      <View className="flex-row items-center justify-between px-4 mt-10">
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="black" />
        </TouchableOpacity>
        <Text className="text-black font-bold text-2xl">Streak Statistics</Text>
        <View style={{ width: 24 }} />
      </View>
      
      {loading ? (
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color="#ffffff" />
        </View>
      ) : error ? (
        <View className="flex-1 justify-center items-center p-4">
          <Text className="text-red-500 text-center mb-4">{error}</Text>
          <CustomButton 
            title="Try Again" 
            handlePress={fetchStreakData} 
          />
        </View>
      ) : (
        <ScrollView className="p-4">
          <View className="bg-white rounded-lg shadow-md p-5 mb-4">
            <Text className="text-xl font-bold text-center mb-2">Current Streak</Text>
            <Text className="text-5xl font-bold text-center text-orange-500">{streak?.count || 0}</Text>
            <Text className="text-gray-500 text-center mb-4">consecutive days</Text>
            
            <View className="h-0.5 bg-gray-200 my-4" />
            
            <View className="flex-row justify-between mb-2">
              <Text className="text-gray-600">Started on</Text>
              <Text className="font-semibold">{getStreakStartDate(streak?.count, streak?.last_updated)}</Text>
            </View>
            
            <View className="flex-row justify-between mb-2">
              <Text className="text-gray-600">Last updated</Text>
              <Text className="font-semibold">{formatLastUpdated(streak?.last_updated)}</Text>
            </View>
          </View>
          
          <View className="bg-white rounded-lg shadow-md p-5 mb-4">
            <Text className="text-xl font-bold mb-4">Streak Tier</Text>
            
            {[
              { min: 0, name: "Beginner", color: "#A0A0A0", discount: "0%" },
              { min: 7, name: "Bronze", color: "#CD7F32", discount: "1%" },
              { min: 30, name: "Silver", color: "#C0C0C0", discount: "2.5%" },
              { min: 90, name: "Gold", color: "#FFD700", discount: "5%" },
              { min: 180, name: "Platinum", color: "#E5E4E2", discount: "7.5%" },
              { min: 365, name: "Diamond", color: "#B9F2FF", discount: "10%" }
            ].map((tier, index) => {
              const count = streak?.count || 0;
              const isCurrentTier = count >= tier.min && (index === 5 || count < [7, 30, 90, 180, 365, Infinity][index + 1]);
              
              return (
                <View key={tier.name} className={`p-3 rounded-lg mb-2 ${isCurrentTier ? 'bg-blue-100' : 'bg-gray-100'}`}>
                  <View className="flex-row justify-between items-center">
                    <View className="flex-row items-center">
                      <View style={{ width: 12, height: 12, borderRadius: 6, backgroundColor: tier.color, marginRight: 8 }} />
                      <Text className={`font-medium ${isCurrentTier ? 'text-blue-800' : 'text-gray-800'}`}>{tier.name}</Text>
                    </View>
                    <Text>{tier.min}+ days</Text>
                  </View>
                </View>
              );
            })}
            
            <View className="mt-4 p-4 bg-gray-100 rounded-lg">
              <Text className="text-center">
                {streak && streak.count > 0 ? (
                  getDaysUntilNextTier(streak.count) > 0 ? (
                    `${getDaysUntilNextTier(streak.count)} more days until next tier!`
                  ) : (
                    `Congratulations! You've reached the highest tier!`
                  )
                ) : (
                  `Start your streak today!`
                )}
              </Text>
            </View>
          </View>
          
          <View className="bg-white rounded-lg shadow-md p-5 mb-4">
            <Text className="text-xl font-bold mb-4">Streak Benefits</Text>
            <Text className="mb-4">
              Keep up your streak to unlock benefits and show your commitment to financial wellness!
            </Text>
            
            <View className="p-4 bg-gray-100 rounded-lg">
              <Text className="text-lg font-semibold mb-2">Tips to Maintain Your Streak:</Text>
              <View className="mb-2">
                <Text>• Log in to the app at least once per day</Text>
                <Text>• Record your daily expenses</Text>
                <Text>• Review your budget regularly</Text>
                <Text>• Set and track financial goals</Text>
              </View>
            </View>
          </View>
        </ScrollView>
      )}
    </SafeAreaView>
  );
};

export default StreakStats;