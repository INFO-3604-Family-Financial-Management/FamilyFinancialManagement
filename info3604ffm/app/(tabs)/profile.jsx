import { View, Text, StyleSheet, SafeAreaView, Image, FlatList, TouchableOpacity } from 'react-native'
import React from 'react'
import CustomButton from '@/components/CustomButton'
import { useAuth } from '@/context/AuthContext'
import icons from "../../constants/icons"
import { router } from 'expo-router'

const Profile = () => {
  const { logout } = useAuth();

  return (
    <SafeAreaView className="bg-gray-500 h-full p-4">
      <View className="flex-1 justify-center items-center">
        <Text className="text-white text-2xl font-bold mb-10 absolute top-10">Profile</Text>
        <View className=' absolute top-20 bg-white rounded-full p-2 mt-2'>
          <Image
          source={icons.profile}
          resizeMode="contain"
          />
        </View>
        <View className='p-4 rounded-lg  m-1 mt-10 h-[65vh]'>
            <View className="flex-1 justify-center items-center p-4 w-full">
                <TouchableOpacity className="flex-row items-center justify-between w-full p-4 mb-4 border border-gray-300 rounded-lg"
                >
                    <Text className="text-lg text-center font-medium w-full">Edit Profile</Text>
                </TouchableOpacity>
                <TouchableOpacity className="flex-row items-center justify-between w-full p-4 mb-4 border border-gray-300 rounded-lg"
                  onPress={() => router.push('budget')}
                >
                    <Text className="text-lg text-center font-medium w-full">Budgets</Text>
                </TouchableOpacity>
                <TouchableOpacity className="flex-row items-center justify-between w-full p-4 mb-4 border border-gray-300 rounded-lg"
                    onPress={() => router.push('export-data')}
                >
                    <Text className="text-lg text-center font-medium w-full">Export Data</Text>
                </TouchableOpacity>
                <TouchableOpacity className="flex-row items-center justify-between w-full p-4 border border-gray-300 rounded-lg">
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