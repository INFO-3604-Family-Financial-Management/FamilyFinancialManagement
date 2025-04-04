import { View, Text, SafeAreaView } from 'react-native'
import React from 'react'
import { useState } from 'react'
import { router } from 'expo-router'
import FormField from '../../components/FormField'
import CustomButton from '../../components/CustomButton'

const AddFamilyMember = () => {
    const [form, setForm] = useState({
        name: "",
    })

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
                    handlePress={() => router.push("/family-members")}
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