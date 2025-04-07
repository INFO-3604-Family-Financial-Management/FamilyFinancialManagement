import { View, Text, SafeAreaView, Alert, ActivityIndicator, TouchableOpacity } from 'react-native'
import React, { useState, useEffect } from 'react'
import { router, useLocalSearchParams } from 'expo-router'
import FormField from '@/components/FormField'
import CustomButton from '@/components/CustomButton'
import { goalService } from '@/services/api'
import Checkbox from 'expo-checkbox'

const EditFamilyGoal = () => {
  const params = useLocalSearchParams();
  const goalId = params.goalId;
  
  const [isLoading, setIsLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [goal, setGoal] = useState(null);
  const [form, setForm] = useState({
    name: '',
    amount: '',
    goalType: 'saving'
  });

  // Fetch goal data when component mounts
  useEffect(() => {
    const fetchGoalData = async () => {
      if (!goalId) {
        console.error('No goal ID found in params:', params);
        Alert.alert("Error", "No goal ID provided");
        router.back();
        return;
      }

      try {
        setIsLoading(true);
        console.log('Fetching family goal with ID:', goalId);
        
        // Get all goals
        const goals = await goalService.getGoals();
        console.log(`Fetched ${goals.length} goals`);
        
        // Find the family goal that matches the ID
        const familyGoal = goals.find(g => g.id.toString() === goalId.toString());
        
        if (!familyGoal) {
          console.error('Family goal not found with ID:', goalId);
          Alert.alert("Error", "Family goal not found");
          router.back();
          return;
        }
        
        console.log('Found family goal:', familyGoal);
        setGoal(familyGoal);

        setForm({
          name: familyGoal.name,
          amount: familyGoal.amount.toString(),
          goalType: familyGoal.goal_type || 'saving'
        });
      } catch (error) {
        console.error('Error fetching family goal:', error);
        Alert.alert("Error", "Failed to load family goal data");
      } finally {
        setIsLoading(false);
      }
    };

    fetchGoalData();
  }, [goalId]);

  const handleSubmit = async () => {
    // Validate form
    if (!form.name.trim()) {
      Alert.alert("Error", "Please enter a goal name");
      return;
    }

    const amount = parseFloat(form.amount);
    if (isNaN(amount) || amount <= 0) {
      Alert.alert("Error", "Please enter a valid amount greater than 0");
      return;
    }

    try {
      setSubmitting(true);
      
      console.log(`Attempting to update family goal ID: ${goalId}`);
      console.log('Update data:', {
        name: form.name,
        amount,
        goal_type: form.goalType,
        is_personal: false
      });
      
      // Use the goal service to update the goal
      await goalService.updateGoal(goalId, {
        name: form.name,
        amount: amount,
        goal_type: form.goalType,
        is_personal: false // Ensure this remains a family goal
      });
      
      Alert.alert(
        "Success", 
        "Family goal updated successfully",
        [{ text: "OK", onPress: () => router.push("/family-goals") }]
      );
    } catch (error) {
      console.error('Error updating family goal:', error);
      Alert.alert(
        "Error", 
        `Failed to update family goal: ${error.message || "Unknown error"}`,
        [
          { text: "Try Again" },
          { text: "Go Back", onPress: () => router.push("/family-goals") }
        ]
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <SafeAreaView className='bg-gray-500 h-full'>
        <View className='mt-10 items-center'>
          <Text className='text-black font-bold text-3xl'>Edit Family Goal</Text>
          <ActivityIndicator size="large" color="#FFF" className="mt-10" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className='bg-gray-500 h-full'>
      <View className='mt-10 items-center'>
        <Text className='text-black font-bold text-3xl'>Edit Family Goal</Text>
      </View>
      <View className='bg-gray-500 p-4 rounded-lg m-4 mt-10 h-[65vh]'>
        <Text className="text-2xl font-bold text-gray-900 text-center">
          Goal Type: {form.goalType === 'saving' ? 'Saving' : 'Spending'}
        </Text>
        
        <FormField
          title="Goal Name"
          value={form.name}
          handleChangeText={(text) => setForm({...form, name: text})}
          otherStyles="mt-7"
        />
        
        <FormField
          title="Goal Amount"
          value={form.amount}
          handleChangeText={(text) => setForm({...form, amount: text})}
          keyboardType="numeric"
          otherStyles="mt-7"
        />

        <View className='mt-10'>
          <Text className='text-base text-gray-100 text-medium'>Goal Type</Text>
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
          title={submitting ? "Saving..." : "Save"}
          handlePress={handleSubmit}
          containerStyles="mx-8 mt-10 w-half"
          isLoading={submitting}
        />
        
        <CustomButton
          title="Cancel"
          handlePress={() => router.push("/family-goals")}
          containerStyles="mx-8 mt-5 w-half"
        />
      </View>
    </SafeAreaView>
  )
}

export default EditFamilyGoal