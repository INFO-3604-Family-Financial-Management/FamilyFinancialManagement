// info3604ffm/app/(tabs)/create-budget.jsx
import { View, Text, TouchableOpacity, Alert, ActivityIndicator } from "react-native";
import React, {useState, useEffect} from "react";
import { router, useLocalSearchParams } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import CustomButton from "@/components/CustomButton";
import FormField from "@/components/FormField";
import Checkbox from 'expo-checkbox';
import { budgetService, profileService } from '../../services/api';

const CreateBudget = () => {
    const params = useLocalSearchParams();
    const defaultIsFamily = params.family === 'true';
    
    const [form, setForm] = useState({
        category: '',
        amount: '',
        isFamily: defaultIsFamily
    });
    const [currentMonth, setCurrentMonth] = useState('');
    const [hasFamily, setHasFamily] = useState(false);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
      // Get current month name
      const monthNames = [
        "January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"
      ];
      const now = new Date();
      setCurrentMonth(monthNames[now.getMonth()]);
      
      // Check if user has a family
      const checkFamily = async () => {
        try {
          setLoading(true);
          const profile = await profileService.getUserProfile();
          setHasFamily(!!profile.family);
          
          // If user doesn't have a family but family budget was requested,
          // revert to personal budget
          if (!profile.family && defaultIsFamily) {
            setForm(prev => ({...prev, isFamily: false}));
            Alert.alert(
              'Notice', 
              'You need to be part of a family to create family budgets. Creating as personal budget instead.'
            );
          }
        } catch (error) {
          console.error('Error checking family:', error);
          setHasFamily(false);
          if (defaultIsFamily) {
            setForm(prev => ({...prev, isFamily: false}));
          }
        } finally {
          setLoading(false);
        }
      };
      
      checkFamily();
    }, [defaultIsFamily]);

    const submit = async () => {
      try {
        if (!form.category.trim()) {
          Alert.alert('Error', 'Please enter a category');
          return;
        }
        
        if (!form.amount || isNaN(parseFloat(form.amount)) || parseFloat(form.amount) <= 0) {
          Alert.alert('Error', 'Please enter a valid amount greater than 0');
          return;
        }
        
        setSubmitting(true);
        
        const budgetData = {
          name: form.category, 
          category: form.category,
          amount: parseFloat(form.amount)
        };
        
        if (form.isFamily) {
          // Create as family budget
          console.log('Creating as family budget');
          await budgetService.createFamilyBudget(budgetData);
          
          Alert.alert(
            'Success',
            'Family budget category created successfully',
            [{ text: 'OK', onPress: () => router.push('/family-budget') }]
          );
        } else {
          // Create as personal budget
          console.log('Creating as personal budget');
          await budgetService.createBudget(budgetData);
          
          Alert.alert(
            'Success',
            'Budget category created successfully',
            [{ text: 'OK', onPress: () => router.push('/budget') }]
          );
        }
      } catch (error) {
        console.error('Create budget error:', error);
        Alert.alert('Error', error.message || 'Failed to create budget category');
      } finally {
        setSubmitting(false);
      }
    };
    
    if (loading) {
      return (
        <SafeAreaView className="bg-gray-500 h-full">
          <View className="mt-10 items-center">
            <Text className="text-black font-bold text-3xl">Adding New Category</Text>
            <ActivityIndicator size="large" color="#FFF" className="mt-10" />
          </View>
        </SafeAreaView>
      );
    }
    
    return (
      <SafeAreaView className="bg-gray-500 h-full">
        <View className="mt-10 items-center">
          <Text className="text-black font-bold text-3xl">
            Adding New {form.isFamily ? "Family" : "Personal"} Category
          </Text>
        </View>
        <View className="bg-gray-600 p-4 rounded-lg m-4 mt-10 h-[65vh]">
          <Text className="text-2xl text-left font-bold text-gray-900 text-center">
            {currentMonth}
          </Text>
          <View className=" justify-center items-center p-4">
              <FormField
                  title='Category'
                  value={form.category}
                  placeholder="Enter budget category"
                  handleChangeText={(e) => setForm({...form, category: e})}
                  otherStyles='mt-7'
              />
              <FormField
                  title='Amount'
                  value={form.amount}
                  placeholder="Enter amount"
                  keyboardType='numeric'
                  handleChangeText={(e) => setForm({...form, amount: e})}
                  otherStyles='mt-7'
              />
              
              {/* Family budget toggle */}
              {hasFamily && (
                <View className="flex-row items-center mt-7 bg-white p-3 rounded-xl w-full">
                  <Checkbox
                    value={form.isFamily}
                    onValueChange={(value) => setForm({...form, isFamily: value})}
                  />
                  <Text className="ml-2">Create as family budget</Text>
                </View>
              )}
          </View>
          <CustomButton
            title={submitting ? "Saving..." : "Save"}
            handlePress={submit}
            containerStyles="mx-8 mt-10 w-half"
            isLoading={submitting}
          />
          <CustomButton
            title="Cancel"
            handlePress={() => router.push(form.isFamily ? "/family-budget" : "/budget")}
            containerStyles="mx-8 mt-2 w-half"
          />
        </View>
      </SafeAreaView>
    );
};

export default CreateBudget;