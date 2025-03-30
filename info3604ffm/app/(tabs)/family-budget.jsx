import { View, Text, SafeAreaView, TouchableOpacity } from 'react-native'
import React from 'react'
import {router} from 'expo-router'
import CustomButton from '../../components/CustomButton'


const FamilyBudget = () => {
  return (
    <SafeAreaView className="bg-gray-500 h-full">
        <View className="mt-10 items-center">
            <Text className="text-black font-bold text-3xl">Family Budget</Text>
        </View>
        <View className='bg-white p-4 rounded-lg shadow-md m-4 mt-10 h-[55vh]'>
            <Text className="text-2xl font-bold text-gray-900 text-center">
                February
            </Text>
            <View className="flex-1 justify-center items-center bg-white p-4">
                <TouchableOpacity className="flex-row items-center justify-between w-full p-4 mb-4 border border-gray-300 rounded-lg">
                    <Text className="text-lg font-medium">Food</Text>
                    <Text className="text-lg text-right font-medium">$470 / $500</Text>
                </TouchableOpacity>
                <TouchableOpacity className="flex-row items-center justify-between w-full p-4 mb-4 border border-gray-300 rounded-lg">
                    <Text className="text-lg font-medium">House</Text>
                    <Text className="text-lg font-medium">$1000 / $1200</Text>
                </TouchableOpacity>
                <TouchableOpacity className="flex-row items-center justify-between w-full p-4 border border-gray-300 rounded-lg">
                    <Text className="text-lg font-medium">Health</Text>
                    <Text className="text-lg font-medium">$200 / $300</Text>
                </TouchableOpacity>
                <View>
                    <Text className="text-lg font-medium mt-10">
                        Total Spent: $2000
                    </Text>
                </View>
                <View>
                    <Text className="text-lg font-medium">
                        Total Remaining: $330
                    </Text>
                </View>
            </View>   
        </View>
        <CustomButton
        title="Add Category"
        handlePress={() => router.push("/create-budget")}
        containerStyles="mx-8 mt-2"
        />
        <CustomButton
        title="Add Money"
        handlePress={() => router.push("/create-budget")}
        containerStyles="mx-8 mt-2"
        />
    </SafeAreaView>
  )
}

export default FamilyBudget