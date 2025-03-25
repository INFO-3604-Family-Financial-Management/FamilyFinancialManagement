import { View, Text, SafeAreaView, TouchableOpacity } from 'react-native'
import React from 'react'
import CustomButton from '../../components/CustomButton'

const Goals = () => {
  return (
    <SafeAreaView className='bg-gray-500 h-full'>
        <View className="mt-20 items-center">
            <Text className="text-black font-bold text-4xl">Goals</Text>
        </View>
        {/* @Varun this is going to have to be dynamic similar to the homepage. On click it will redirect to an edit goal page to edit the goal so you will need to make the api request using the goal id. idk how the backend code is for this and i too lazy to check rn  */}
        <View className='p-4 rounded-lg mt-5 h-[55vh]'>
            <View className="flex-1 justify-center bg-white items-center rounded-lg p-4 my-4 w-full">
                <TouchableOpacity className="flex-row items-center justify-between w-full p-4 mb-4 rounded-lg"
                >
                    <Text className="text-lg text-left font-medium w-full"> - Save for France</Text>
                    {/* Graph would go here. I will write code for the graph soon.  */}
                </TouchableOpacity>
            </View>   
        </View>
        
        <CustomButton
            title="Add Goal"
            onPress={() => {router.push('/add-goal')}}
            containerStyles="mx-8 mt-6"
        />
    </SafeAreaView>
  )
}

export default Goals