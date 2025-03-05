import { TouchableOpacity, Text } from 'react-native'
import React from 'react'

const CustomButton = ({title, handlePress, containerStyles, textStyles, isLoading}) => {
  return (
    <TouchableOpacity 
      onPress={handlePress}
      activeOpacity={0.7}
      className={`bg-primary p-4 rounded-xl min-w-[165px] min-h-[6spx] items-center justify-center ${containerStyles} ${isLoading ? 'opacity-50' : ''}`}
      disabled={isLoading}>
        <Text className={`text-black font-bold text-lg ${textStyles}`}>
          {title}
        </Text>
    </TouchableOpacity>
  )
}

export default CustomButton;