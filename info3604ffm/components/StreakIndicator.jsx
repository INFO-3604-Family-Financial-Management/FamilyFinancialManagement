import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, Modal, ActivityIndicator, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Animatable from 'react-native-animatable';
import { streakService } from '../services/api';
import { router } from 'expo-router';

const StreakIndicator = () => {
  const [streak, setStreak] = useState(null);
  const [previousStreak, setPreviousStreak] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [isStreakUpdated, setIsStreakUpdated] = useState(false);

  // Fetch streak data when component mounts
  useEffect(() => {
    fetchStreakData();
  }, []);

  // Check for streak milestones
  useEffect(() => {
    if (streak && previousStreak && streak.count !== previousStreak.count) {
      // Streak has updated
      setIsStreakUpdated(true);
      
      // Check for milestone
      if ([7, 30, 100, 365].includes(streak.count)) {
        Alert.alert(
          "Streak Milestone!",
          `Congratulations! You've maintained a ${streak.count}-day streak. Keep up the good work!`,
          [{ text: "Thanks!" }]
        );
      }
    }
  }, [streak, previousStreak]);

  const fetchStreakData = async () => {
    try {
      setLoading(true);
      
      // Store previous streak data for comparison
      if (streak) {
        setPreviousStreak({...streak});
      }
      
      const streakData = await streakService.getStreak();
      setStreak(streakData);
    } catch (error) {
      console.error('Error fetching streak:', error);
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

  // Format the last updated date
  const formatLastUpdated = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  // Check if streak was updated today
  const isUpdatedToday = () => {
    if (!streak || !streak.last_updated) return false;
    
    const today = new Date();
    const lastUpdated = new Date(streak.last_updated);
    
    return (
      today.getFullYear() === lastUpdated.getFullYear() &&
      today.getMonth() === lastUpdated.getMonth() &&
      today.getDate() === lastUpdated.getDate()
    );
  };

  // Update streak manually (could be used for a refresh button)
  const handleUpdateStreak = async () => {
    try {
      if (!streak) return;
      
      setLoading(true);
      await streakService.checkAndUpdateStreak();
      await fetchStreakData();
      
      Alert.alert("Success", "Your streak has been updated!");
    } catch (error) {
      console.error('Error updating streak:', error);
      Alert.alert("Error", "Failed to update streak. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Show info modal with streak details
  const openModal = () => {
    setShowModal(true);
  };

  // Render streak information modal
  const renderModal = () => {
    const tier = getStreakTier(streak?.count || 0);
    
    return (
      <Modal
        animationType="fade"
        transparent={true}
        visible={showModal}
        onRequestClose={() => setShowModal(false)}
      >
        <View className="flex-1 justify-center items-center bg-black bg-opacity-50">
          <View className="bg-white rounded-xl p-6 w-4/5 max-w-md">
            <Text className="text-xl font-bold text-center mb-4">Your Streak</Text>
            
            {loading ? (
              <ActivityIndicator size="small" color="#0000ff" />
            ) : streak ? (
              <>
                <Animatable.View 
                  animation="pulse" 
                  iterationCount="infinite" 
                  duration={2000} 
                  className="items-center mb-4"
                >
                  <Text className="text-5xl font-bold text-orange-500">{streak.count}</Text>
                  <Text className="text-gray-600 mt-1">days in a row</Text>
                </Animatable.View>
                
                <View className="bg-gray-100 p-3 rounded-lg mb-4">
                  <Text className="text-center font-bold" style={{color: tier.color}}>
                    {tier.name} Tier
                  </Text>
                </View>
                
                <Text className="text-center mb-4">
                  Keep tracking your finances daily to grow your streak!
                </Text>
                
                <Text className="text-gray-500 text-sm text-center">
                  Last updated: {formatLastUpdated(streak.last_updated)}
                </Text>
              </>
            ) : (
              <Text className="text-center">No streak data available</Text>
            )}
            
            <TouchableOpacity
              className="bg-blue-500 rounded-lg py-3 px-4 mt-6"
              onPress={() => setShowModal(false)}
              onLongPress={() => router.push('/streak-stats')}
              delayLongPress={500}
            >
              <Text className="text-white text-center font-bold">Close</Text>
            </TouchableOpacity>
            <TouchableOpacity
              className="bg-indigo-500 rounded-lg py-3 px-4 mt-2"
              onPress={() => {
                setShowModal(false);
                router.push('/streak-stats');
              }}
            >
              <Text className="text-white text-center font-bold">View Detailed Stats</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    );
  };

  // If still loading or no streak, show a placeholder
  if (loading && !streak) {
    return (
      <View className="absolute top-12 left-4">
        <ActivityIndicator size="small" color="#FFF" />
      </View>
    );
  }

  // Determine the color based on streak status
  const getStreakColor = () => {
    if (!streak) return 'gray';
    if (isUpdatedToday()) return '#FFD700'; // Gold for updated today
    return '#FF9500'; // Orange for active streak
  };

  return (
    <>
      <TouchableOpacity
        className="absolute top-12 left-4 flex-row items-center p-2"
        onPress={openModal}
      >
        <Animatable.View 
          animation={isStreakUpdated ? "pulse" : undefined}
          iterationCount={isStreakUpdated ? 3 : undefined}
          onAnimationEnd={() => setIsStreakUpdated(false)}
          className="flex-row items-center bg-gray-800 bg-opacity-40 px-3 py-1.5 rounded-full"
        >
          <Ionicons name="flame" size={20} color={getStreakColor()} />
          <Text className="text-white font-bold ml-1">
            {streak ? streak.count : '0'}
          </Text>
        </Animatable.View>
      </TouchableOpacity>
      
      {renderModal()}
    </>
  );
};

export default StreakIndicator;