import { View, Text, SafeAreaView, TouchableOpacity, ActivityIndicator, ScrollView, StatusBar } from 'react-native'
import { router } from 'expo-router'
import React, { useState, useEffect, useCallback } from 'react'
import { useFocusEffect } from '@react-navigation/native'
import { familyService } from '../../services/api'
import CustomButton from '../../components/CustomButton'
import { Ionicons } from '@expo/vector-icons'

const Family = () => {
  const [familyName, setFamilyName] = useState("");
  const [loading, setLoading] = useState(true);
  const [hasFamily, setHasFamily] = useState(false);

  const fetchFamilyData = async () => {
    try {
      setLoading(true);
      const family = await familyService.getCurrentUserFamily();
      if (family && family.name) {
        setFamilyName(family.name);
        setHasFamily(true);
      } else {
        setHasFamily(false);
      }
    } catch (error) {
      console.error('Error fetching family:', error);
      setHasFamily(false);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Fetch the family data when component mounts
    fetchFamilyData();
  }, []);

  useFocusEffect(
      useCallback(() => {
        console.log('Goals screen in focus - refreshing data');
        fetchFamilyData();
        return () => {
          // Cleanup function (optional)
        };
      }, [])
    );

  // Family features with icons
  const familyFeatures = [
    {
      title: 'Family Members',
      icon: 'people-outline',
      route: 'family-members',
      description: 'View and manage family members'
    },
    {
      title: 'Shared Budget',
      icon: 'wallet-outline',
      route: 'family-budget',
      description: 'Track shared expenses and budgets'
    },
    {
      title: 'Shared Savings',
      icon: 'trending-up-outline',
      route: 'family-savings',
      description: 'Monitor family savings progress'
    },
    {
      title: 'Shared Goals',
      icon: 'flag-outline',
      route: 'family-goals',
      description: 'Set and achieve financial goals together'
    }
  ];

  if (loading) {
    return (
      <SafeAreaView className='bg-gray-500 h-full'>
        <StatusBar barStyle="dark-content" />
        <View className='flex-1 justify-center items-center'>
          <ActivityIndicator size="large" color="#FFF" />
          <Text className='text-white mt-4 font-medium'>Loading family data...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!hasFamily) {
    return (
      <SafeAreaView className='bg-gray-500 h-full'>
        <StatusBar barStyle="dark-content" />
        <View className='pt-12 px-6'>
          <Text className='text-black font-bold text-3xl text-center'>Family</Text>
        </View>
        
        <View className='flex-1 justify-center items-center px-6'>
          <View className='bg-white rounded-2xl p-8 shadow-md w-full items-center'>
            <Ionicons name="people" size={80} color="#D1D5DB" />
            <Text className='text-black text-xl font-semibold text-center mt-4 mb-2'>
              No Family Yet
            </Text>
            <Text className='text-gray-500 text-center mb-8'>
              Create a family to start managing finances together with your loved ones.
            </Text>
            <TouchableOpacity
              onPress={() => router.push('create-family')}
              className='bg-indigo-200 px-6 py-3 rounded-xl w-full'
            >
              <Text className='text-center text-black font-bold text-lg'>Create Family</Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className='bg-gray-500 h-full'>
      <StatusBar barStyle="dark-content" />
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header with family name */}
        <View className='bg-indigo-200 pt-12 pb-6 rounded-b-3xl shadow-md'>
          <View className='px-6'>
            <Text className='text-black font-bold text-2xl text-center'>{familyName} Family</Text>
            <View className='flex-row justify-center mt-4'>
              <View className='bg-white rounded-full p-3 shadow-sm'>
                <Ionicons name="people" size={36} color="#4B5563" />
              </View>
            </View>
          </View>
        </View>
        
        {/* Family features cards */}
        <View className='px-5 -mt-4'>
          <View className='bg-white rounded-3xl p-5 shadow-md'>
            {familyFeatures.map((feature, index) => (
              <TouchableOpacity 
                key={index}
                className='flex-row items-center bg-gray-50 rounded-xl p-4 mb-3 border border-gray-100'
                onPress={() => router.push(feature.route)}
              >
                <View className='bg-indigo-100 rounded-full p-3 mr-4'>
                  <Ionicons name={feature.icon} size={24} color="#4B5563" />
                </View>
                <View className='flex-1'>
                  <Text className='text-gray-800 text-lg font-semibold'>{feature.title}</Text>
                  <Text className='text-gray-500 text-sm'>{feature.description}</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
              </TouchableOpacity>
            ))}
          </View>
          
          {/* Family insights card */}
          <View className='bg-white rounded-xl p-5 mt-4 shadow-sm'>
            <Text className='text-gray-800 font-semibold mb-2 text-lg'>Family Finance Tips</Text>
            <Text className='text-gray-600 text-sm mb-3'>
              Establish clear financial goals and communicate openly about money matters with your family members.
            </Text>
            <TouchableOpacity 
              className='flex-row items-center'
              onPress={() => router.push('family-members')}
            >
              <Text className='text-indigo-500 font-medium'>Manage family members</Text>
              <Ionicons name="arrow-forward" size={16} color="#6366F1" style={{marginLeft: 4}} />
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}

export default Family