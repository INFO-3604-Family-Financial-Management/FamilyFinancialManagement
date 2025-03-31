import { View, Text, SafeAreaView } from 'react-native'
import React from 'react'
import { useState } from 'react'
import { router } from 'expo-router'
import Checkbox from 'expo-checkbox';
import FormField from '../../components/FormField'
import CustomButton from '../../components/CustomButton'

const AddFamilyMember = () => {
    const [parentIsChecked, parentSetChecked] = useState(false);
    const [childIsChecked, childSetChecked] = useState(false);
    const [form, setForm] = useState({
        name: "", 
        income: "",
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
            <FormField
                title='Income'
                value={form.amount}
                handleChangeText={(e) => setForm({...form, income: e})}
                otherStyles='mt-7'
            />
            <View className='mt-10'>
                <Text className='text-base text-gray-100 text-medium'>Type</Text>
                <View className='border-2 border-white w-full p-4 bg-white rounded-2xl focus:border-black'>
                    {/* Edit so only one can be selected at a time */}
                    {/* Find a way to make the box and title on same line i cba rn */}
                    <View className="mb-2">
                        <Checkbox value={parentIsChecked} onValueChange={parentSetChecked} />
                        <Text>Parent (Breadwinner)</Text>
                    </View>

                    <View className="mb-2">
                        <Checkbox value={childIsChecked} onValueChange={childSetChecked} />
                        <Text>Child</Text>
                    </View>
                </View>
            </View>
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