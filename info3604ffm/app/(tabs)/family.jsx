import { View, Text, SafeAreaView, TouchableOpacity, ActivityIndicator } from 'react-native'
import { router } from 'expo-router'
import React, { useState, useEffect } from 'react'
import { familyService } from '../../services/api'
import CustomButton from '../../components/CustomButton'

const Family = () => {
  const [familyName, setFamilyName] = useState("");
  const [loading, setLoading] = useState(true);
  const [hasFamily, setHasFamily] = useState(false);

  useEffect(() => {
    // Fetch the family data when component mounts
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

    fetchFamilyData();
  }, []);

  if (loading) {
    return (
      <SafeAreaView className='bg-gray-500 h-full'>
        <View className='mt-10 items-center'>
          <Text className='text-black font-bold text-3xl'>Family</Text>
          <ActivityIndicator size="large" color="#FFF" className="mt-20" />
        </View>
      </SafeAreaView>
    );
  }

  if (!hasFamily) {
    return (
      <SafeAreaView className='bg-gray-500 h-full'>
        <View className='mt-10 items-center'>
          <Text className='text-black font-bold text-3xl'>Family</Text>
        </View>
        <View className='p-4 rounded-lg m-4 mt-20 h-[55vh] items-center justify-center'>
          <Text className='text-white text-xl text-center mb-6'>
            You don't have a family yet. Create one to start managing family finances together.
          </Text>
          <CustomButton
            title="Create Family"
            handlePress={() => router.push('create-family')}
            containerStyles="w-64 mt-4"
          />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className='bg-gray-500 h-full'>
      <View className='mt-10 items-center'>
        <Text className='text-black font-bold text-3xl'>{familyName} Family</Text>
      </View>
       <View className='p-4 rounded-lg m-1 mt-10 h-[65vh]'>
            <View className="flex-1 justify-center items-center p-4 w-full">
                <TouchableOpacity className="flex-row items-center justify-between w-full p-4 mb-6 border border-gray-300 rounded-lg"
                    onPress={() => router.push('family-members')}
                >
                    <Text className="text-lg text-center font-medium w-full">Family Members</Text>
                </TouchableOpacity>
                <TouchableOpacity className="flex-row items-center justify-between w-full p-4 mb-6 border border-gray-300 rounded-lg"
                  onPress={() => router.push('family-budget')}
                >
                    <Text className="text-lg text-center font-medium w-full">Shared Budget</Text>
                </TouchableOpacity>
                <TouchableOpacity className="flex-row items-center justify-between w-full p-4 mb-6 border border-gray-300 rounded-lg"
                    onPress={() => router.push('family-savings')}
                >
                    <Text className="text-lg text-center font-medium w-full">Shared Savings</Text>
                </TouchableOpacity>
                <TouchableOpacity className="flex-row items-center justify-between w-full p-4 border border-gray-300 rounded-lg"
                    onPress={() => router.push('family-goals')}
                >
                    <Text className="text-lg text-center font-medium w-full">Shared Goals</Text>
                </TouchableOpacity>
            </View>   
        </View>
    </SafeAreaView>
  )
}

export default Family