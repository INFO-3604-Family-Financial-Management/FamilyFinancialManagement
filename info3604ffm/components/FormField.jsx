import { View, Text, TextInput, Image, TouchableOpacity } from 'react-native'
import React, { useState } from 'react'

import icons from '../constants/icons'

const FormField = ({title, value, placeholder, handleChangeText, otherStyles, ...props}) => {

    const [showPassword, setShowPassword] = useState(false)

  return (
    <View className={`space-y-2 ${otherStyles}`}>
      <Text className='text-base text-gray-100 text-medium'>{title}</Text>
      <View className='border-2 border-white w-full h-16 px-4 bg-white rounded-2xl focus:border-black items-center flex-row'>
        <TextInput className='flex-1 text-black text-semibold'
         value={value}
         placeholder={placeholder}
         placeholderTextColor="#7b7b8b"
         onChangeText={handleChangeText}
         secureTextEntry={title === 'Password' && !showPassword}
        />

        {title === 'Password' && (
            <TouchableOpacity onPress={() => 
                setShowPassword(!showPassword)}>
                <Image source={!showPassword ? icons.eye : icons.eyehide}
                    resizeMode='contain'
                    className='w-6 h-6' />
            </TouchableOpacity>
        )}
      </View>
    </View>
  )
}

export default FormField