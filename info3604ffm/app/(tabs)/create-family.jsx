import { View, Text, SafeAreaView, Alert } from 'react-native'
import React, { useState } from 'react'
import { router } from 'expo-router'
import FormField from '@/components/FormField'
import CustomButton from '@/components/CustomButton'
import { familyService, authService } from '@/services/api'

const CreateFamily = () => {
  const [form, setForm] = useState({
    name: '',
  })
  const [isLoading, setIsLoading] = useState(false)

  const validateForm = () => {
    if (!form.name.trim()) {
      Alert.alert("Error", "Please enter a family name")
      return false
    }
    return true
  }

  const submit = async () => {
    if (!validateForm()) return
    
    setIsLoading(true)
    
    try {
      const token = await authService.getAccessToken();
      if (!token) {
        throw new Error("You must be logged in to create a family");
      }
      
      // Create the family with the current user as a member
      const familyData = {
        name: form.name,
        members: [] // This needs to be sent but can be empty - backend will add current user
      }
      
      // Create the family
      const newFamily = await familyService.createFamily(familyData)
      
      Alert.alert(
        "Success",
        "Family created successfully!",
        [{ text: "OK", onPress: () => router.push('/family') }]
      )
    } catch (error) {
      console.error('Create family error:', error)
      Alert.alert("Error", error.message || "Failed to create family")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <SafeAreaView className='bg-gray-500 h-full'>
      <View className='mt-10 items-center'>
        <Text className='text-black font-bold text-3xl'>Create New Family</Text>
      </View>
      <View className='bg-gray-500 p-4 rounded-lg m-4 mt-10 h-[65vh]'>
        <FormField
          title='Family Name'
          value={form.name}
          handleChangeText={(e) => setForm({...form, name: e})}
          otherStyles='mt-7'
          placeholder="Enter your family name"
        />
        
        <Text className="text-white text-base mt-4 mx-2">
          Creating a family allows you to share budgets, goals, and financial plans with family members.
        </Text>
        
        <CustomButton
          title="Create Family"
          handlePress={submit}
          containerStyles="mx-8 mt-10 w-half"
          isLoading={isLoading}
        />
        <CustomButton
          title="Cancel"
          handlePress={() => router.push("/family")}
          containerStyles="mx-8 mt-5 w-half"
        />
      </View>
    </SafeAreaView>
  )
}

export default CreateFamily