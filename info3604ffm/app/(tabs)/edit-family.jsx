import { View, Text, SafeAreaView, TouchableOpacity, Alert, ActivityIndicator } from 'react-native'
import { router, useLocalSearchParams } from 'expo-router'
import React, { useState, useEffect } from 'react'
import FormField from '@/components/FormField'
import CustomButton from '@/components/CustomButton'
import { familyService, familyManagementService } from '@/services/api'
import { Ionicons } from '@expo/vector-icons'

const EditFamily = () => {
  const params = useLocalSearchParams();
  const username = params.username;
  
  const [isLoading, setIsLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    name: '',
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
          });
        } else {
          // Otherwise we're editing the family itself
          console.log(`Editing family: ${familyData.name}`);
          setForm({
            name: familyData.name,
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
    if (!form.name.trim() && !username) {
      Alert.alert("Error", "Please enter a name");
      return;
    }
    
    try {
      setSubmitting(true);
      
      if (username) {
        // For member settings, just show success as we're not changing anything
        Alert.alert(
          "Success",
          `Member settings updated`,
          [{ text: "OK", onPress: () => router.push("/family-members") }]
        );
      } else if (family) {
        // For family name editing
        console.log(`Attempting to update family name to: ${form.name}`);
        
        try {
          // Update the family name
          await familyService.createFamily({
            id: family.id,
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
        `Failed to update: ${error.message || "Unknown error"}`,
        [{ text: "OK" }]
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleRemoveMember = async () => {
    if (!username || !family) {
      return;
    }

    Alert.alert(
      "Remove Member",
      `Are you sure you want to remove ${username} from the family?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Remove",
          style: "destructive",
          onPress: async () => {
            try {
              setSubmitting(true);
              await familyManagementService.removeFamilyMember(family.id, username);
              Alert.alert(
                "Success",
                `${username} has been removed from the family`,
                [{ text: "OK", onPress: () => router.push("/family-members") }]
              );
            } catch (error) {
              console.error('Error removing family member:', error);
              Alert.alert("Error", `Failed to remove member: ${error.message || "Unknown error"}`);
            } finally {
              setSubmitting(false);
            }
          }
        }
      ]
    );
  };

  if (isLoading) {
    return (
      <SafeAreaView className='bg-gray-500 h-full'>
        <View className='mt-10 items-center'>
          <Text className='text-black font-bold text-3xl'>
            {username ? 'Member Settings' : 'Edit Family'}
          </Text>
          <ActivityIndicator size="large" color="#FFF" className="mt-10" />
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView className='bg-gray-500 h-full'>
        <View className='mt-10 items-center'>
          <Text className='text-black font-bold text-3xl'>
            {username ? 'Member Settings' : 'Edit Family'}
          </Text>
          <View className="mt-10 bg-red-100 p-4 rounded-lg w-4/5">
            <Text className='text-red-700 text-center font-medium'>{error}</Text>
          </View>
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
      {/* Top header with back button */}
      <View className='flex-row items-center justify-between px-4 mt-12'>
        <TouchableOpacity 
          onPress={() => router.back()}
          className="bg-gray-700 rounded-full p-2"
        >
          <Ionicons name="arrow-back" size={24} color="white" />
        </TouchableOpacity>
        <Text className='text-black font-bold text-2xl'>
          {username ? 'Member Settings' : 'Edit Family'}
        </Text>
        <View style={{ width: 32 }} /> {/* Empty view for even spacing */}
      </View>
      
      {/* Main content */}
      <View className='bg-gray-600 p-6 rounded-xl mx-4 mt-8 shadow-lg'>
        <View className="mb-6">
          <Text className='text-white text-xl font-semibold mb-4'>
            {username ? 'Member Information' : 'Family Information'}
          </Text>
          
          {username ? (
            // Username as a title card
            <View className="bg-indigo-700 p-5 rounded-xl mb-4">
              <Text className="text-white text-base font-medium mb-1">Username</Text>
              <Text className="text-white text-xl font-bold">{username}</Text>
            </View>
          ) : (
            // Editable family name input
            <FormField
              title="Family Name"
              value={form.name}
              handleChangeText={(text) => setForm({...form, name: text})}
              otherStyles='mb-4'
            />
          )}
          
          {/* Additional info card for member settings */}
          {username && (
            <View className="bg-gray-700 rounded-lg p-4 mt-2">
              <Text className="text-white text-sm">
                You can adjust settings for this family member or remove them from the family if needed.
              </Text>
            </View>
          )}
        </View>
        
        {/* Action buttons */}
        <View className="mt-auto">
          {!username && (
            <CustomButton
              title={submitting ? "Saving..." : "Save Changes"}
              handlePress={handleSubmit}
              containerStyles="bg-indigo-500 mb-3"
              textStyles="text-white"
              isLoading={submitting}
            />
          )}
          
          {username && (
            <CustomButton
              title="Remove from Family"
              handlePress={handleRemoveMember}
              containerStyles="bg-red-500 mb-3"
              textStyles="text-white"
              isLoading={submitting}
            />
          )}
          
          <CustomButton
            title="Go Back"
            handlePress={() => router.push(username ? "/family-members" : "/family")}
            containerStyles="bg-gray-400"
            textStyles="text-gray-800"
          />
        </View>
      </View>
    </SafeAreaView>
  )
}

export default EditFamily