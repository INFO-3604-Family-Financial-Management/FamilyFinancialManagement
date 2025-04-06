import { View, Text, SafeAreaView, TouchableOpacity } from 'react-native'
import { router } from 'expo-router'
import React, { useState, useEffect } from 'react'
import { familyService } from '../../services/api'

const Family = () => {
  const [familyName, setFamilyName] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch the family data when component mounts
    const fetchFamilyData = async () => {
      try {
        setLoading(true);
        const family = await familyService.getCurrentUserFamily();
        if (family && family.name) {
          setFamilyName(family.name);
        }
      } catch (error) {
        console.error('Error fetching family:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchFamilyData();
  }, []);

  return (
    <SafeAreaView className='bg-gray-500 h-full'>
      <View className='mt-10 items-center'>
        <Text className='text-black font-bold text-3xl'>{familyName} Family</Text>
      </View>
       <View className='p-4 rounded-lg  m-1 mt-10 h-[65vh]'>
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