import { View, Text, Image, ScrollView, Alert } from 'react-native'
import React, { useState } from 'react'
import { SafeAreaView } from 'react-native-safe-area-context'
import images from '../../constants/images'
import FormField from '@/components/FormField'
import CustomButton from '@/components/CustomButton'
import { Link, router } from 'expo-router'
import { authService } from '@/services/api'

const SignUp = () => {
  const [form, setForm] = useState({
    username: '',
    email: '',
    password: ''
  })

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errors, setErrors] = useState({})

  const validateForm = () => {
    const newErrors = {}
    
    if (!form.username.trim()) {
      newErrors.username = 'Username is required'
    }
    
    if (!form.password) {
      newErrors.password = 'Password is required'
    } else if (form.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters'
    }

    if (!form.email.trim()) {
      newErrors.email = 'Email is required'
    } else if (!/\S+@\S+\.\S+/.test(form.email)) {
      newErrors.email = 'Email is invalid'
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const submit = async () => {
    if (!validateForm()) return
    
    setIsSubmitting(true)
    
    try {
      // Register user
      await authService.register({
        username: form.username,
        email: form.email,
        password: form.password
      })
      
      // On success, navigate to sign in
      Alert.alert(
        "Registration Successful",
        "Your account was created successfully. Please sign in.",
        [{ text: "OK", onPress: () => router.push("/home") }]
      )
    } catch (error) {
      Alert.alert("Registration Failed", error.message || "Something went wrong. Please try again.")
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
            Sign up to TFR Finance
          </Text>

          <FormField
            title='Username'
            value={form.username}
            handleChangeText={(e) => setForm({...form, username: e})}
            otherStyles='mt-7'
          />
          {errors.username && <Text className="text-red-500 self-start ml-2">{errors.username}</Text>}
          
          <FormField
            title='Email'
            value={form.email}
            handleChangeText={(e) => setForm({...form, email: e})}
            otherStyles='mt-7'
            keyboardType='email-address'
          />
          
          <FormField
            title='Password'
            value={form.password}
            handleChangeText={(e) => setForm({...form, password: e})}
            otherStyles='mt-7'
          />
          {errors.password && <Text className="text-red-500 self-start ml-2">{errors.password}</Text>}

          <CustomButton
            title="Sign Up"
            handlePress={submit}
            containerStyles="mt-7"
            isLoading={isSubmitting}
          />

          <View className='justify-center pt-5 flex-row gap-2'>
            <Text className='text-white text-base'>
              Already have an account?
            </Text>
            <Link className="text-indigo-100 text-bold" href='/sign-in'>Sign In</Link>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}

export default SignUp