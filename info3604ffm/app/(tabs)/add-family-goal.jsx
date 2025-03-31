import { View, Text, SafeAreaView } from 'react-native'
import React, {useState} from 'react'
import Checkbox from 'expo-checkbox';
import FormField from '../../components/FormField'
import CustomButton from '../../components/CustomButton'
import { router } from 'expo-router'

const AddFamilyGoal = () => {
    const [savingsIsChecked, setSavingsChecked] = useState(false);
    const [spendingIsChecked, setSpendingChecked] = useState(false);
    const [form, setForm] = useState({
        name: '',
        amount: ''
    })
  return (
    <SafeAreaView className='bg-gray-500 h-full'>
        <View className='mt-10 items-center'>
            <Text className='text-black font-bold text-3xl'>Add New Goal</Text>
        </View>
        <View className='bg-gray-500 p-4 rounded-lg m-4 mt-10 h-[65vh]'>
            <FormField
                title='Name'
                value={form.name}
                handleChangeText={(e) => setForm({...form, name: e})}
                otherStyles='mt-7'
            />
            <FormField
                title='Amount'
                value={form.amount}
                handleChangeText={(e) => setForm({...form, amount: e})}
                otherStyles='mt-7'
            />
            <View className='mt-10'>
                <Text className='text-base text-gray-100 text-medium'>Type</Text>
                <View className='border-2 border-white w-full p-4 bg-white rounded-2xl focus:border-black'>
                    {/* Edit so only one can be selected at a time */}
                    {/* Find a way to make the box and title on same line i cba rn */}
                    <View className="mb-2">
                        <Checkbox value={savingsIsChecked} onValueChange={setSavingsChecked} />
                        <Text>Saving</Text>
                    </View>

                    <View className="mb-2">
                        <Checkbox value={spendingIsChecked} onValueChange={setSpendingChecked} />
                        <Text>Spending</Text>
                    </View>
                </View>
            </View>
            <CustomButton
                title="Save"
                // change to handlePress={submit}
                handlePress={() => router.push("/family")}
                containerStyles="mx-8 mt-10 w-half"
             />
             <CustomButton
                title="Cancel"
                handlePress={() => router.push("/family")}
                containerStyles="mx-8 mt-5 w-half"
             />
        </View>
    </SafeAreaView>
  )
}

export default AddFamilyGoal