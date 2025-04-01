import { View, Text } from 'react-native'
import React, {useState} from 'react'
import { router } from 'expo-router'
import { SafeAreaView } from 'react-native-safe-area-context'
import FormField from '../../components/FormField'
import CustomButton from '../../components/CustomButton'

const EditFamilyGoal = () => {
    const [form, setForm] = useState({
        goalName: '',
        goalAmount: ''
    })
  return (
    <SafeAreaView className='bg-gray-500 h-full'>
        <View className='mt-10 items-center'>
            <Text className='text-black font-bold text-3xl'>Edit Goal</Text>
        </View>
        <View className=' p-4 rounded-lg shadow-md m-4 mt-10 h-[65vh]'>
            <Text className="text-2xl font-bold text-gray-900 text-center">Goal Type: Savings</Text>
            <FormField
                title="Goal Name"
                value={form.goalName}
                // if possible make the placeholder the old goal name
                placeholder="Meow Meow"
                handleChangeText={(e) => setForm({...form, goalName: e})}
                otherStyles={"mb-10, mt-10"}
                 />
            <FormField
                title="Goal Amount"
                value={form.goalAmount}
                // if possible make the placeholder the old goal name
                placeholder="$MeowMeow"
                handleChangeText={(e) => setForm({...form, goalAmount: e})}
                otherStyles={"mb-10, mt-10"}
            />
            <CustomButton
                title="Save"
                // change to handlePress={submit}
                handlePress={() => router.push("/family-goals")}
                containerStyles="mx-8 mt-10 w-half"
             />
             <CustomButton
                title="Cancel"
                handlePress={() => router.push("/family-goals")}
                containerStyles="mx-8 mt-5 w-half"
             />
        </View>
    </SafeAreaView>
  )
}

export default EditFamilyGoal