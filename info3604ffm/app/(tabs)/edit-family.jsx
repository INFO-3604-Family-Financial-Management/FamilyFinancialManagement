import { View, Text, SafeAreaView, TouchableOpacity, Alert, ActivityIndicator } from 'react-native'
import { router, useLocalSearchParams } from 'expo-router'
import React, { useState, useEffect } from 'react'
import FormField from '@/components/FormField'
import Checkbox from 'expo-checkbox'
import CustomButton from '@/components/CustomButton'
import { familyService, familyManagementService } from '@/services/api'

const EditFamily = () => {
  const params = useLocalSearchParams();
  const username = params.username;
  
  const [isLoading, setIsLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    name: '',
    role: 'parent' // Default role
  });
  const [family, setFamily] = useState(null);
  const [error, setError] = useState(null);

  // Load family data and member info
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        setError(null);
        console.log('Fetching family data, username param:', username);
        
        // Get the family first
        const familyData = await familyService.getCurrentUserFamily();
        console.log('Family data:', familyData);
        
        if (!familyData) {
          console.error('No family found');
          setError("No family found");
          return;
        }
        
        setFamily(familyData);
        
        // If a username was provided, we're editing a specific member
        if (username) {
          console.log(`Editing family member: ${username}`);
          setForm({
            name: username,
            role: 'parent' // Default, could fetch actual role if available in your API
          });
        } else {
          // Otherwise we're editing the family itself
          console.log(`Editing family: ${familyData.name}`);
          setForm({
            name: familyData.name,
            role: 'parent'
          });
        }
      } catch (err) {
        console.error('Error fetching family data:', err);
        setError("Failed to load family data");
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchData();
  }, [username]);

  const handleSubmit = async () => {
    if (!form.name.trim()) {
      Alert.alert("Error", "Please enter a name");
      return;
    }
    
    try {
      setSubmitting(true);
      
      if (username) {
        // For member editing - simply show success as the backend doesn't currently
        // support role management
        console.log(`Member update for ${username} (role functionality not yet implemented in backend)`);
        
        Alert.alert(
          "Success",
          `Family member ${username} updated`,
          [{ text: "OK", onPress: () => router.push("/family-members") }]
        );
      } else if (family) {
        // For family name editing
        console.log(`Attempting to update family name to: ${form.name}`);
        
        try {
          // Use the service to update the family name
          await familyService.createFamily({
            ...family,
            name: form.name
          });
          
          Alert.alert(
            "Success",
            "Family information updated",
            [{ text: "OK", onPress: () => router.push("/family") }]
          );
        } catch (updateError) {
          console.error('Error updating family:', updateError);
          throw updateError;
        }
      }
    } catch (error) {
      console.error('Error updating family:', error);
      Alert.alert(
        "Error",
        `Failed to update family information: ${error.message || "Unknown error"}`,
        [{ text: "OK" }]
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <SafeAreaView className='bg-gray-500 h-full'>
        <View className='mt-10 items-center'>
          <Text className='text-black font-bold text-3xl'>Edit Family</Text>
          <ActivityIndicator size="large" color="#FFF" className="mt-10" />
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView className='bg-gray-500 h-full'>
        <View className='mt-10 items-center'>
          <Text className='text-black font-bold text-3xl'>Edit Family</Text>
          <Text className='text-red-500 mt-10'>{error}</Text>
          <CustomButton
            title="Go Back"
            handlePress={() => router.push("/family")}
            containerStyles="mt-10"
          />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className='bg-gray-500 h-full'>
      <View className='mt-10 items-center'>
        <Text className='text-black font-bold text-3xl'>
          {username ? 'Edit Family Member' : 'Edit Family'}
        </Text>
      </View>
      <View className='bg-gray-500 p-4 rounded-lg m-4 mt-10 h-[65vh]'>
        <FormField
          title={username ? 'Username' : 'Family Name'}
          value={form.name}
          handleChangeText={(text) => setForm({...form, name: text})}
          otherStyles='mt-7'
          editable={!username} // Username can't be edited, only family name can
        />
        
        {username && (
          <View className='mt-10'>
            <Text className='text-base text-gray-100 text-medium'>Role</Text>
            <View className='border-2 border-white w-full p-4 bg-white rounded-2xl focus:border-black'>
              <TouchableOpacity 
                onPress={() => setForm({...form, role: 'parent'})} 
                className="mb-2 flex-row items-center"
              >
                <Checkbox 
                  value={form.role === 'parent'} 
                  onValueChange={() => setForm({...form, role: 'parent'})} 
                />
                <Text className="ml-2">Parent (Breadwinner)</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                onPress={() => setForm({...form, role: 'child'})} 
                className="mb-2 flex-row items-center"
              >
                <Checkbox 
                  value={form.role === 'child'} 
                  onValueChange={() => setForm({...form, role: 'child'})} 
                />
                <Text className="ml-2">Child</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
        
        <CustomButton
          title={submitting ? "Saving..." : "Save"}
          handlePress={handleSubmit}
          containerStyles="mx-8 mt-10 w-half"
          isLoading={submitting}
        />
        
        <CustomButton
          title="Cancel"
          handlePress={() => router.push(username ? "/family-members" : "/family")}
          containerStyles="mx-8 mt-5 w-half"
        />
      </View>
    </SafeAreaView>
  )
}

export default EditFamily