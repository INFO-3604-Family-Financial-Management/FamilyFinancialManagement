import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, SafeAreaView, RefreshControl, Alert } from 'react-native';
import { router } from 'expo-router';
import CustomButton from '../../components/CustomButton';
import { familyManagementService, familyService } from '../../services/api';

const FamilyMembers = () => {
  const [familyMembers, setFamilyMembers] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [familyData, setFamilyData] = useState(null);

  const fetchFamilyData = async () => {
    try {
      // First get all families (to get the current family's ID)
      const families = await familyService.getFamilies();
      if (families && families.length > 0) {
        setFamilyData(families[0]); // Assume the first family is the user's current family
        return families[0].id;
      }
      return null;
    } catch (error) {
      console.error('Error fetching family data:', error);
      return null;
    }
  };

  const fetchFamilyMembers = async () => {
    try {
      const response = await familyManagementService.getFamilyMembers();
      console.log('Family members response:', response);
      setFamilyMembers(response);
    } catch (error) {
      console.error('Error fetching family members:', error);
      Alert.alert('Error', 'Failed to load family members');
    }
  };

  useEffect(() => {
    // Fetch family data and members on component mount
    const loadData = async () => {
      await fetchFamilyData();
      await fetchFamilyMembers();
    };
    
    loadData();
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchFamilyMembers();
    setRefreshing(false);
  }, []);

  const handleAddMember = () => {
    if (!familyData) {
      // If no family exists yet, create one first
      router.push('/add-family');
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
        {familyMembers.length === 0 ? (
          <View className="items-center justify-center h-full">
            <Text className="text-gray-500 text-lg">No family members added yet.</Text>
          </View>
        ) : (
          <FlatList
            className="w-full"
            data={familyMembers}
            keyExtractor={(item) => item.id.toString()}
            renderItem={({ item }) => (
              <View className="items-center justify py-3 border-b border-gray-200 last:border-b-0">
                <TouchableOpacity 
                  className="flex-row items-center justify-between w-full p-4 border border-gray-300 rounded-lg"
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
              </View>
            )}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
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