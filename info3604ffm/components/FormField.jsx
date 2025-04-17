import { View, Text, TextInput, Image, TouchableOpacity } from 'react-native'
import React, { useState } from 'react'
import Ionicons from 'react-native-vector-icons/Ionicons';
import icons from '../constants/icons'

const FormField = ({ 
  title, 
  value, 
  placeholder, 
  handleChangeText, 
  otherStyles, 
  icon, 
  keyboardType = 'default',
  onFocus,
  onBlur,
  ...props
}) => {

    const [showPassword, setShowPassword] = useState(false)

  return (
    <View className={`space-y-2 ${otherStyles}`}>
      {title ? <Text className='text-base text-gray-100 text-medium'>{title}</Text> : null}
      <View className='border-2 border-white w-full h-16 px-4 bg-white rounded-2xl focus:border-black items-center flex-row'>
        {icon && (
          <Ionicons name={icon} size={20} color="#7b7b8b" className='mr-2' />
        )}
        <TextInput 
          className='flex-1 text-black text-semibold'
          value={value}
          placeholder={placeholder}
          placeholderTextColor="#7b7b8b"
          onChangeText={handleChangeText}
          secureTextEntry={title === 'Password' && !showPassword}
          keyboardType={keyboardType}
          onFocus={onFocus}
          onBlur={onBlur}
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