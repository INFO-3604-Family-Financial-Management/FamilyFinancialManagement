import { View, Text, SafeAreaView, Image, TouchableOpacity } from 'react-native'
import React, { useState, useEffect } from 'react'
import CustomButton from '@/components/CustomButton'
import { useAuth } from '@/context/AuthContext'
import icons from "../../constants/icons"
import { router } from 'expo-router'
import { profileService } from '../../services/api'

const Profile = () => {
  const { logout } = useAuth();
  const [income, setIncome] = useState(0);
  
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const profile = await profileService.getUserProfile();
        setIncome(profile.monthly_income);
      } catch (error) {
        console.error('Error fetching profile:', error);
      }
    };
    
    fetchProfile();
  }, []);
  
  // Format currency
  const formatCurrency = (amount) => {
    return `$${parseFloat(amount).toFixed(2)}`;
  };

  return (
    <SafeAreaView className="bg-gray-500 h-full p-4">
      <View className="flex-1 justify-center items-center">
        <Text className="text-white text-2xl font-bold mb-10 absolute top-10">Profile</Text>
        <View className="absolute top-20 bg-white rounded-full p-2 mt-2">
          <Image
            source={icons.profile}
            resizeMode="contain"
          />
        </View>
        
        {/* Income Display */}
        <View className="absolute top-40 w-full items-center">
          <Text className="text-white text-lg">Monthly Income</Text>
          <Text className="text-white text-2xl font-bold">{formatCurrency(income)}</Text>
        </View>
        
        <View className="p-4 rounded-lg m-1 mt-10 h-[65vh]">
            <View className="flex-1 justify-center items-center p-4 w-full">
                <TouchableOpacity 
                  className="flex-row items-center justify-between w-full p-4 mb-4 border border-gray-300 rounded-lg"
                  onPress={() => router.push('edit-profile')}
                >
                    <Text className="text-lg text-center font-medium w-full">Update Income</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  className="flex-row items-center justify-between w-full p-4 mb-4 border border-gray-300 rounded-lg"
                >
                    <Text className="text-lg text-center font-medium w-full">Edit Profile</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  className="flex-row items-center justify-between w-full p-4 mb-4 border border-gray-300 rounded-lg"
                  onPress={() => router.push('budget')}
                >
                    <Text className="text-lg text-center font-medium w-full">Budgets</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  className="flex-row items-center justify-between w-full p-4 mb-4 border border-gray-300 rounded-lg"
                  onPress={() => router.push('export-data')}
                >
                    <Text className="text-lg text-center font-medium w-full">Export Data</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  className="flex-row items-center justify-between w-full p-4 border border-gray-300 rounded-lg"
                >
                    <Text className="text-lg text-center font-medium w-full">Settings</Text>
                </TouchableOpacity>
            </View>   
        </View>
        
        <View className="w-full absolute bottom-0">
          <CustomButton 
            title="Logout" 
            handlePress={logout}
            containerStyles="bg-red-500"
          />
        </View>
      </View>
    </SafeAreaView>
  )
}

export default Profile