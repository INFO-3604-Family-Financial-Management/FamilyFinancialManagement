import { View, Text, SafeAreaView, Alert, TouchableOpacity } from 'react-native'
import React, { useState } from 'react'
import { router } from 'expo-router'
import FormField from '@/components/FormField'
import CustomButton from '@/components/CustomButton'
import { goalService } from '@/services/api'
import Checkbox from 'expo-checkbox'

const AddGoal = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [form, setForm] = useState({
    name: '',
    amount: '',
    goalType: 'saving', // Default to saving
  });

  const validateForm = () => {
    if (!form.name.trim()) {
      Alert.alert("Validation Error", "Please enter a goal name");
      return false;
    }
    
    const amount = parseFloat(form.amount);
    if (isNaN(amount) || amount <= 0) {
      Alert.alert("Validation Error", "Please enter a valid amount greater than 0");
      return false;
    }
    
    return true;
  };

  const submit = async () => {
    if (!validateForm()) return;
    
    setIsLoading(true);
    
    try {
      const goalData = {
        name: form.name,
        amount: parseFloat(form.amount),
        goalType: form.goalType,
        isPersonal: true // Personal goal
      };
      
      await goalService.createGoal(goalData);
      
      Alert.alert(
        "Success",
        "Goal created successfully",
        [{ text: "OK", onPress: () => router.push('/goals') }]
      );
    } catch (error) {
      console.error('Create goal error:', error);
      Alert.alert("Error", error.message || "Failed to create goal");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView className='bg-gray-500 h-full'>
      <View className='mt-10 items-center'>
        <Text className='text-black font-bold text-3xl'>Add New Goal</Text>
      </View>
      <View className='bg-gray-500 p-4 rounded-lg m-4 mt-10 h-[65vh]'>
        <FormField
          title='Name'
          value={form.name}
          handleChangeText={(e) => setForm({...form, name: e})}
          otherStyles='mt-7'
        />
        <FormField
          title='Amount'
          value={form.amount}
          handleChangeText={(e) => setForm({...form, amount: e})}
          keyboardType="numeric"
          otherStyles='mt-7'
        />
        <View className='mt-10'>
          <Text className='text-base text-gray-100 text-medium'>Type</Text>
          <View className='border-2 border-white w-full p-4 bg-white rounded-2xl focus:border-black'>
            <TouchableOpacity onPress={() => setForm({...form, goalType: 'saving'})} className="mb-2 flex-row items-center">
              <Checkbox value={form.goalType === 'saving'} onValueChange={() => setForm({...form, goalType: 'saving'})} />
              <Text className="ml-2">Saving</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => setForm({...form, goalType: 'spending'})} className="mb-2 flex-row items-center">
              <Checkbox value={form.goalType === 'spending'} onValueChange={() => setForm({...form, goalType: 'spending'})} />
              <Text className="ml-2">Spending</Text>
            </TouchableOpacity>
          </View>
        </View>
        <CustomButton
          title="Save"
          handlePress={submit}
          containerStyles="mx-8 mt-10 w-half"
          isLoading={isLoading}
        />
        <CustomButton
          title="Cancel"
          handlePress={() => router.push("/goals")}
          containerStyles="mx-8 mt-5 w-half"
        />
      </View>
    </SafeAreaView>
  )
}

export default AddGoal