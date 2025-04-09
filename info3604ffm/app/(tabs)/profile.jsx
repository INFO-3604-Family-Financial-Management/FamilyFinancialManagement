import { View, Text, SafeAreaView, Image, TouchableOpacity, StatusBar } from 'react-native'
import React, { useState, useEffect } from 'react'
import CustomButton from '@/components/CustomButton'
import { useAuth } from '@/context/AuthContext'
import icons from "../../constants/icons"
import { router } from 'expo-router'
import { profileService } from '../../services/api'
import { Ionicons } from '@expo/vector-icons'

const Profile = () => {
  const { logout } = useAuth();
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setLoading(true);
        const profile = await profileService.getUserProfile();
        // Get username from profile
        if (profile && profile.username) {
          setUsername(profile.username);
        }
      } catch (error) {
        console.error('Error fetching profile:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchProfile();
  }, []);

  // Menu items with their icons and destinations
  const menuItems = [
    {
      title: 'Update Income',
      icon: 'cash-outline',
      destination: 'edit-profile',
      color: '#4B5563' // Gray color
    },
    {
      title: 'Budgets',
      icon: 'wallet-outline',
      destination: 'budget',
      color: '#4B5563' // Gray color
    },
    {
      title: 'Export Data',
      icon: 'download-outline',
      destination: 'export-data',
      color: '#4B5563' // Gray color
    }
  ];

  return (
    <SafeAreaView className="bg-gray-500 h-full">
      <StatusBar barStyle="dark-content" />
      
      {/* Top curved design with profile info */}
      <View className="bg-indigo-200 pt-12 pb-16 rounded-b-3xl shadow-md">
        <View className="px-6">
          <Text className="text-black text-2xl font-bold text-center mb-6">My Profile</Text>
          
          {/* Profile image and username */}
          <View className="items-center">
            <View className="bg-white rounded-full p-5 shadow-md">
              <Image
                source={icons.profile}
                resizeMode="contain"
                className="w-16 h-16"
              />
            </View>
            <Text className="text-gray-800 text-xl font-bold mt-4">
              {loading ? 'Loading...' : username}
            </Text>
          </View>
        </View>
      </View>
      
      {/* Menu items - Staggered for visual interest */}
      <View className="-mt-8 mx-5 z-10">
        <View className="bg-white rounded-3xl shadow-md p-6 mb-4">
          {menuItems.map((item, index) => (
            <TouchableOpacity 
              key={index}
              onPress={() => router.push(item.destination)}
              className="flex-row items-center border border-gray-200 rounded-xl p-4 mb-3"
            >
              <View className="bg-gray-100 rounded-full p-2 mr-4">
                <Ionicons name={item.icon} size={24} color={item.color} />
              </View>
              <Text className="text-gray-800 text-lg font-medium flex-1">{item.title}</Text>
              <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
            </TouchableOpacity>
          ))}
        </View>
      </View>
      
      {/* App version info */}
      <View className="items-center mt-6">
        <Text className="text-gray-600 text-xs">TFR Finance v1.0.0</Text>
      </View>
      
      {/* Logout button with better styling */}
      <View className="absolute bottom-8 w-full px-5">
        <TouchableOpacity 
          onPress={logout}
          className="bg-red-500 p-4 rounded-xl flex-row justify-center items-center shadow-md"
        >
          <Ionicons name="log-out-outline" size={22} color="white" className="mr-2" />
          <Text className="text-white font-bold text-lg ml-2">Logout</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  )
}

export default Profile