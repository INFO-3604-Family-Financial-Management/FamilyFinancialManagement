import { View, Text, TouchableOpacity, Alert } from "react-native";
import React, {useState} from "react";
import { router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import CustomButton from "@/components/CustomButton";
import FormField from "@/components/FormField";
import { budgetService } from '../../services/api';

const CreateBudget = () => {
    const [form, setForm] = useState({
        category: '',
        amount: 0
    })
    const submit = async () => {
      try {
        if (!form.category.trim()) {
          Alert.alert('Error', 'Please enter a category');
          return;
        }
        
        if (!form.amount || isNaN(form.amount) || parseFloat(form.amount) <= 0) {
          Alert.alert('Error', 'Please enter a valid amount greater than 0');
          return;
        }
        
        const budgetData = {
          name: form.category, // Use category as name for simplicity
          category: form.category,
          amount: parseFloat(form.amount)
        };
        
        await budgetService.createBudget(budgetData);
        
        Alert.alert(
          'Success',
          'Budget category created successfully',
          [{ text: 'OK', onPress: () => router.push('/budget') }]
        );
      } catch (error) {
        console.error('Create budget error:', error);
        Alert.alert('Error', error.message || 'Failed to create budget category');
      }
    };
  return (
    <SafeAreaView className="bg-gray-500 h-full">
      <View className="mt-10 items-center">
        <Text className="text-black font-bold text-3xl">Adding New Category</Text>
      </View>
      <View className="bg-gray-600 p-4 rounded-lg m-4 mt-10 h-[65vh]">
        <Text className="text-2xl text-left font-bold text-gray-900 text-center">
          February
        </Text>
        <View className=" justify-center items-center p-4">
            <FormField
                title='Category'
                value={form.category}
                handleChangeText={(e) => setForm({...form, category: e})}
                otherStyles='mt-7'
            />
            <FormField
                title='Amount'
                value={form.amount}
                keyboardType='number-pad'
                handleChangeText={(e) => setForm({...form, amount: e})}
                otherStyles='mt-7'
            />
        </View>
        <CustomButton
          title="Save"
          handlePress={submit}
          containerStyles="mx-8 mt-10 w-half"
        />
        <CustomButton
          title="Cancel"
          handlePress={() => router.push("/budget")}
          containerStyles="mx-8 mt-2 w-half"
        />
      </View>
    </SafeAreaView>
  );
};

export default CreateBudget;
