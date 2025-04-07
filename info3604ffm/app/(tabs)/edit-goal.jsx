import { View, Text, SafeAreaView, Alert, ActivityIndicator } from 'react-native'
import React, { useState, useEffect } from 'react'
import { router, useLocalSearchParams } from 'expo-router'
import FormField from '@/components/FormField'
import CustomButton from '@/components/CustomButton'
import { goalService } from '@/services/api'
import Checkbox from 'expo-checkbox'

const EditGoal = () => {
  const params = useLocalSearchParams();
  const goalId = params.goalId;
  
  const [isLoading, setIsLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [goal, setGoal] = useState(null);
  const [form, setForm] = useState({
    name: '',
    amount: '',
    goalType: 'saving',
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
        console.log('Fetching goal with ID:', goalId);
        
        // Get the complete list of goals
        const goals = await goalService.getGoals();
        console.log(`Fetched ${goals.length} goals`);
        
        // Find the goal that matches our ID
        const targetGoal = goals.find(g => g.id.toString() === goalId.toString());
        
        if (!targetGoal) {
          console.error('Goal not found with ID:', goalId);
          Alert.alert("Error", "Goal not found");
          router.back();
          return;
        }
        
        console.log('Found goal:', targetGoal);
        setGoal(targetGoal);

        // Initialize the form with the goal data
        setForm({
          name: targetGoal.name,
          amount: targetGoal.amount.toString(),
          goalType: targetGoal.goal_type || 'saving',
        });
      } catch (error) {
        console.error('Error fetching goal:', error);
        Alert.alert("Error", "Failed to load goal data");
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
      
      // Create update payload
      const updateData = {
        name: form.name,
        amount: amount,
        goal_type: form.goalType
      };
      
      console.log(`Updating goal ID ${goalId} with:`, updateData);
      
      // Use the goalService to update the goal
      await goalService.updateGoal(goalId, updateData);
      
      Alert.alert(
        "Success", 
        "Goal updated successfully",
        [{ text: "OK", onPress: () => router.push("/goals") }]
      );
    } catch (error) {
      console.error('Error updating goal:', error);
      Alert.alert("Error", "Failed to update goal. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <SafeAreaView className='bg-gray-500 h-full'>
        <View className='mt-10 items-center'>
          <Text className='text-black font-bold text-3xl'>Edit Goal</Text>
          <ActivityIndicator size="large" color="#FFF" className="mt-10" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className='bg-gray-500 h-full'>
      <View className='mt-10 items-center'>
        <Text className='text-black font-bold text-3xl'>Edit Goal</Text>
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
            <View className="mb-2 flex-row items-center">
              <Checkbox 
                value={form.goalType === 'saving'} 
                onValueChange={() => setForm({...form, goalType: 'saving'})} 
              />
              <Text className="ml-2">Saving</Text>
            </View>

            <View className="mb-2 flex-row items-center">
              <Checkbox 
                value={form.goalType === 'spending'} 
                onValueChange={() => setForm({...form, goalType: 'spending'})} 
              />
              <Text className="ml-2">Spending</Text>
            </View>
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
          handlePress={() => router.back()}
          containerStyles="mx-8 mt-5 w-half"
        />
      </View>
    </SafeAreaView>
  )
}

export default EditGoal