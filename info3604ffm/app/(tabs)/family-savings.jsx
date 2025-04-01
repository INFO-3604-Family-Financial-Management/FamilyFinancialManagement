import { View, Text, SafeAreaView,TouchableOpacity } from 'react-native'
import React from 'react'

const FamilySavings = () => {
  return (
    <SafeAreaView className='bg-gray-500 h-full'>
      <View className='mt-10 items-center'>
        <Text className='text-black font-bold text-3xl'>Savings</Text>
      </View>
      <View className='bg-white p-4 rounded-lg shadow-md m-4 mt-10 h-[65vh]'>
        <Text className="text-2xl font-bold text-gray-900 text-center">
            February
        </Text>  
        <View>
          {/*Pi Chart Go here i aint wanna do this aint gonna lie  */}
        </View>
        <View className='items-center'>
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
    </SafeAreaView>
  )
}

export default FamilySavings