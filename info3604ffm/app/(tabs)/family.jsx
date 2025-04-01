import { View, Text, SafeAreaView, TouchableOpacity } from 'react-native'
import { router } from 'expo-router'
import React from 'react'

const Family = () => {
  return (
    <SafeAreaView className='bg-gray-500 h-full'>
      <View className='mt-10 items-center'>
        <Text className='text-black font-bold text-3xl'>Family</Text>
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