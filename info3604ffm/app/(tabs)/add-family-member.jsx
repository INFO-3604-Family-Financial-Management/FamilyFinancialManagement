import { View, Text, SafeAreaView, Alert } from 'react-native'
import React from 'react'
import { useState } from 'react'
import { router } from 'expo-router'
import FormField from '../../components/FormField'
import CustomButton from '../../components/CustomButton'
import { familyManagementService, familyService } from '../../services/api'

const AddFamilyMember = () => {
    const [form, setForm] = useState({
        name: "",
    })
    const submit = async () => {
        try {
          if (!form.name.trim()) {
            Alert.alert('Error', 'Please enter a username');
            return;
          }
          
          // First get the family ID
          let familyId;
          const family = await familyService.getCurrentUserFamily();
          
          if (!family) {
            // Create a family if none exists
            const newFamily = await familyService.createFamily({ name: 'My Family' });
            familyId = newFamily.id;
          } else {
            familyId = family.id;  // Access the id directly on the family object
          }
          
          await familyManagementService.addFamilyMember(familyId, form.name);
          
          Alert.alert(
            'Success',
            'Family member added successfully',
            [{ text: 'OK', onPress: () => router.push('/family-members') }]
          );
        } catch (error) {
          console.error('Add family member error:', error);
          Alert.alert('Error', error.message || 'Failed to add family member');
        }
      };
    return (
        <SafeAreaView className="bg-gray-500 h-full">
            <View className='mt-10 items-center'>
                <Text className='text-black font-bold text-3xl'>Add Family Member</Text>
            </View>
            <View className='bg-gray-500 p-4 rounded-lg m-4 mt-10 h-[65vh]'>
                <FormField
                    title='Name'
                    value={form.name}
                    handleChangeText={(e) => setForm({...form, name: e})}
                    otherStyles='mt-7'
                />
                <CustomButton
                    title="Save"
                    // change to handlePress={submit}
                    handlePress={submit}
                    //{() => router.push("/family-members")}
                    containerStyles="mx-8 mt-10 w-half"
                />
                <CustomButton
                    title="Cancel"
                    handlePress={() => router.push("/family-members")}
                    containerStyles="mx-8 mt-5 w-half"
                />
            </View>
        </SafeAreaView>
    )
}

export default AddFamilyMember