import React, { useState, useEffect } from 'react';
import { View, Text, SafeAreaView, Alert, ActivityIndicator, ScrollView } from 'react-native';
import { router } from 'expo-router';
import FormField from '../../components/FormField';
import CustomButton from '../../components/CustomButton';
import { profileService } from '../../services/api';

const EditProfile = () => {
  const [form, setForm] = useState({
    monthlyIncome: '0',
  });
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setLoading(true);
        setError(null);
        
        console.log('Fetching profile data for edit screen...');
        const profile = await profileService.getUserProfile();
        console.log('Profile data received in edit screen:', profile);
        
        if (profile && profile.monthly_income !== undefined) {
          // Ensure we convert to string for the text input
          setForm({
            monthlyIncome: profile.monthly_income.toString(),
          });
        } else {
          console.log('Setting default income value');
          setForm({
            monthlyIncome: '0',
          });
        }
      } catch (error) {
        console.error('Error fetching profile:', error);
        setError('Failed to load profile. You can still set your income below.');
        // Set default value even on error
        setForm({
          monthlyIncome: '0',
        });
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

  const handleSubmit = async () => {
    try {
      let incomeValue = form.monthlyIncome.trim();
      
      // Handle empty string
      if (!incomeValue) {
        incomeValue = '0';
      }
      
      // Validate numeric value
      if (isNaN(parseFloat(incomeValue)) || parseFloat(incomeValue) < 0) {
        Alert.alert('Error', 'Please enter a valid income amount (0 or greater)');
        return;
      }

      setSubmitting(true);
      setError(null);
      
      console.log('Submitting profile update with income:', incomeValue);
      await profileService.updateUserProfile({
        monthly_income: parseFloat(incomeValue),
      });

      Alert.alert(
        'Success',
        'Your income has been updated',
        [{ 
          text: 'OK', 
          onPress: () => {
            // Navigate back and ensure data refresh
            router.back();
          }
        }]
      );
    } catch (error) {
      console.error('Update profile error:', error);
      setError('Failed to update your income. Please try again.');
      Alert.alert('Error', 'Failed to update your income. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView className="bg-gray-500 h-full">
      <ScrollView>
        <View className="mt-10 items-center">
          <Text className="text-black font-bold text-3xl">Update Income</Text>
        </View>
        <View className="bg-gray-500 p-4 rounded-lg m-4 mt-10">
          {loading ? (
            <View className="items-center justify-center py-10">
              <ActivityIndicator size="large" color="#FFF" />
              <Text className="text-white mt-4">Loading profile...</Text>
            </View>
          ) : (
            <>
              {error && (
                <Text className="text-red-300 text-base mb-4 text-center">{error}</Text>
              )}
              
              <FormField
                title="Monthly Income"
                value={form.monthlyIncome}
                handleChangeText={(value) => setForm({ ...form, monthlyIncome: value })}
                keyboardType="numeric"
                placeholder="Enter your monthly income"
                otherStyles="mt-7"
              />
              <Text className="text-white text-base mt-2 ml-2">
                Set your monthly income to better track your budget and savings.
              </Text>

              <CustomButton
                title={submitting ? "Updating..." : "Save"}
                handlePress={handleSubmit}
                containerStyles="mx-8 mt-10"
                isLoading={submitting}
              />
              <CustomButton
                title="Cancel"
                handlePress={() => router.back()}
                containerStyles="mx-8 mt-5"
              />
            </>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default EditProfile;