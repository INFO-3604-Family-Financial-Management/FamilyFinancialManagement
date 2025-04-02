import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, SafeAreaView, RefreshControl } from 'react-native';
import { router } from 'expo-router';
import CustomButton from '../../components/CustomButton';
import { familyManagementService } from '../../services/api';

const FamilyMembers = () => {
  const [familyMembers, setFamilyMembers] = useState([]); // Store family members
  const [refreshing, setRefreshing] = useState(false);

  const fetchFamilyMembers = async () => {
    try {
      const response = await familyManagementService.getFamilyMembers();
      console.log('Family response:', response); // Log for debugging
      setFamilyMembers(response); // Set the family members data
    } catch (error) {
      console.error('Error fetching family members:', error);
    }
  };

  useEffect(() => {
    fetchFamilyMembers();
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchFamilyMembers();
    setRefreshing(false);
  }, []);

  return (
    <SafeAreaView className="bg-gray-500 h-full">
      <View className="mt-10 items-center">
        <Text className="text-black text-2xl">Family Members</Text>
      </View>
      <View className="bg-white p-4 rounded-lg items-center justify-center text shadow-md m-4 mt-10 h-[65vh]">
        {familyMembers.length === 0 ? (
          <View className="items-center justify-center h-full">
            <Text className="text-gray-500 text-lg">No family members added yet.</Text>
          </View>
        ) : (
          <FlatList
            className="w-full"
            data={familyMembers}
            keyExtractor={(item, index) => index.toString()}
            renderItem={({ item }) => (
              <View className="items-center justify py-3 border-b border-gray-200 last:border-b-0">
                <TouchableOpacity 
                  className="flex-row items-center justify-between w-full p-4 border border-gray-300 rounded-lg"
                  onPress={() => router.push({
                    pathname: '/edit-family-member',
                    params: { username: item.username }
                  })}
                >
                  <View className="flex-1">
                    <Text className="text-lg font-medium">{item.username}</Text>
                    <Text className="text-xs text-gray-500">{item.email}</Text>
                  </View>
                </TouchableOpacity>
              </View>
            )}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          />
        )}
      </View>
      <CustomButton
        title="Add Family Member"
        handlePress={() => router.push('/add-family-member')}
        containerStyles="mx-8 mt-6"
      />
    </SafeAreaView>
  );
};

export default FamilyMembers;