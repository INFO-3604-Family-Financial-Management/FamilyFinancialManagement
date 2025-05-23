import { View, Text, Image, ScrollView, Alert } from 'react-native'
import React, { useState } from 'react'
import { SafeAreaView } from 'react-native-safe-area-context'
import images from '../../constants/images'
import FormField from '@/components/FormField'
import CustomButton from '@/components/CustomButton'
import { Link, Redirect, useRouter } from 'expo-router'
import { authService } from '@/services/api'

const SignIn = () => {
  const [form, setForm] = useState({
    username: '',
    password: ''
  })

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errors, setErrors] = useState({})

  const validateForm = () => {
    const newErrors = {}
    
    if (!form.username.trim()) {
      newErrors.username = 'Email/Username is required'
    }
    
    if (!form.password) {
      newErrors.password = 'Password is required'
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const router = useRouter();

  const submit = async () => {
    if (!validateForm()) return
    
    setIsSubmitting(true)
    
    try {
      // Login user
      await authService.login({
        username: form.username,
        password: form.password
      })
      
      // Navigate to home on success
      router.push('/home');
    } catch (error) { 
      Alert.alert("Login Failed", "Invalid username or password. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <SafeAreaView className='bg-gray-500 h-full'>
      <ScrollView>
        <View className='w-full justify-center items-center min-h-[85vh] px-4 my-6'>
          <Image source={images.logo}
            resizeMode='contain'
            className='w-[215px] h-[135px]'
          />

          <Text className='text-white text-2xl text-semibold mt-1'>
            Log in to TFR Finance
          </Text>

          <FormField
            title='Username'
            value={form.username}
            handleChangeText={(e) => setForm({...form, username: e})}
            otherStyles='mt-7'
          />
          {errors.username && <Text className="text-red-500 self-start ml-2">{errors.username}</Text>}
          
          <FormField
            title='Password'
            value={form.password}
            handleChangeText={(e) => setForm({...form, password: e})}
            otherStyles='mt-7'
          />
          {errors.password && <Text className="text-red-500 self-start ml-2">{errors.password}</Text>}

          <CustomButton
            title="Sign In"
            handlePress={submit}
            containerStyles="mt-7"
            isLoading={isSubmitting}
          />

          <View className='justify-center pt-5 flex-row gap-2'>
            <Text className='text-white text-base'>
              Don't have an account?
            </Text>
            <Link className="text-indigo-100 text-bold" href='/sign-up'>Sign Up</Link>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}

export default SignIn