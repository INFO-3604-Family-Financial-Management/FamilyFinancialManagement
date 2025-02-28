import { View, Text, StyleSheet } from 'react-native'
import React from 'react'
import { SafeAreaView } from 'react-native-safe-area-context'
import CustomButton from '@/components/CustomButton'
import { useAuth } from '@/context/AuthContext'

const Profile = () => {
  const { logout } = useAuth();

  return (
    <SafeAreaView className="bg-black h-full p-4">
      <View className="flex-1 justify-center items-center">
        <Text className="text-white text-2xl font-bold mb-10">Profile</Text>
        
        <View className="w-full">
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