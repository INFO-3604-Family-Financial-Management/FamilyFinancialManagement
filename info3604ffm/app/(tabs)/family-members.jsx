import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, SafeAreaView, RefreshControl, Alert } from 'react-native';
import { router } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import CustomButton from '../../components/CustomButton';
import { familyManagementService, familyService } from '../../services/api';

const FamilyMembers = () => {
  const [familyMembers, setFamilyMembers] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [familyData, setFamilyData] = useState(null);

  const fetchFamilyData = async () => {
    try {
      // First get all families (to get the current family's ID)
      const family = await familyService.getCurrentUserFamily();
      if (family) {
        setFamilyData(family);
        return family.id;
      }
      return null;
    } catch (error) {
      console.error('Error fetching family data:', error);
      return null;
    }
  };

  const fetchFamilyMembers = async () => {
    try {
      setLoading(true);
      const response = await familyManagementService.getFamilyMembers();
      console.log('Family members response:', response);
      setFamilyMembers(response);
    } catch (error) {
      console.error('Error fetching family members:', error);
      Alert.alert('Error', 'Failed to load family members');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // This will run once on component mount
  useEffect(() => {
    const loadInitialData = async () => {
      await fetchFamilyData();
      await fetchFamilyMembers();
    };
    
    loadInitialData();
  }, []);

  // This will run every time the screen comes into focus
  useFocusEffect(
    useCallback(() => {
      console.log('Family members screen in focus - refreshing data');
      const refreshData = async () => {
        await fetchFamilyData();
        await fetchFamilyMembers();
      };
      
      refreshData();
      
      return () => {
        // Optional cleanup function
      };
    }, [])
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchFamilyData();
    await fetchFamilyMembers();
  }, []);

  const handleAddMember = () => {
    if (!familyData) {
      // If no family exists yet, create one first
      Alert.alert(
        "No Family",
        "You need to create a family first",
        [{ text: "OK", onPress: () => router.push('/family') }]
      );
    } else {
      // Otherwise go to add member screen
      router.push('/add-family-member');
    }
  };

  return (
    <SafeAreaView className="bg-gray-500 h-full">
      <View className="mt-10 items-center">
        <Text className="text-black font-bold text-3xl">Family Members</Text>
        {familyData && (
          <Text className="text-white text-lg mt-2">{familyData.name}</Text>
        )}
      </View>
      <View className="bg-white p-4 rounded-lg items-center justify-center text shadow-md m-4 mt-10 h-[65vh]">
        {loading && !refreshing ? (
          <View className="items-center justify-center h-full">
            <Text className="text-gray-500 text-lg">Loading family members...</Text>
          </View>
        ) : familyMembers.length === 0 ? (
          <View className="items-center justify-center h-full">
            <Text className="text-gray-500 text-lg">No family members added yet.</Text>
          </View>
        ) : (
          <FlatList
            className="w-full"
            data={familyMembers}
            keyExtractor={(item, index) => `${item.id || item.username || index}`}
            renderItem={({ item }) => (
              <TouchableOpacity 
                className="flex-row items-center justify-between w-full p-4 mb-4 border border-gray-300 rounded-lg"
                onPress={() => router.push({
                  pathname: '/edit-family',
                  params: { username: item.username }
                })}
              >
                <View className="flex-1">
                  <Text className="text-lg font-medium">{item.username}</Text>
                  <Text className="text-xs text-gray-500">{item.email}</Text>
                </View>
              </TouchableOpacity>
            )}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
            contentContainerStyle={{ 
              paddingVertical: 10,
              flexGrow: 1,
              ...(familyMembers.length === 0 && { justifyContent: 'center' })
            }}
          />
        )}
      </View>
      <CustomButton
        title="Add Family Member"
        handlePress={handleAddMember}
        containerStyles="mx-8 mt-6"
      />
    </SafeAreaView>
  );
};

export default FamilyMembers;