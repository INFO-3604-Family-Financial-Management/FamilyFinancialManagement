import { View, Text, SafeAreaView } from 'react-native'
import React from 'react'

const EditGoal = (goalID) => {
  return (
    <SafeAreaView className='bg-gray-500 h-full'>
        <View className='mt-10 items-center'>
            <Text>Edit Goal</Text>
        </View>
    </SafeAreaView>
  )
}

export default EditGoal