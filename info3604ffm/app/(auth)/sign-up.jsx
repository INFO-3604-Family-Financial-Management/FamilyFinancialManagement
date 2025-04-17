// app/(auth)/sign-up.jsx
import React, { useState } from 'react';
import { 
  View, 
  Text, 
  Image, 
  ScrollView, 
  Alert, 
  TextInput, 
  TouchableOpacity, 
  KeyboardAvoidingView, 
  Platform, 
  StatusBar,
  ActivityIndicator
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Link, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { authService } from '../../services/api';
import images from '../../constants/images';

// Define colors
const COLORS = {
  primary: '#6366F1',  // Purple button color
  background: '#F9FAFB', // Light gray background
  card: '#FFFFFF',     // White
  text: {
    primary: '#1F2937',  // Dark gray
    secondary: '#4B5563', // Medium gray
    muted: '#9CA3AF',   // Light gray
  },
  error: '#EF4444',    // Red
}

const SignUp = () => {
  // Form state - using original form structure
  const [form, setForm] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Validate form
  const validateForm = () => {
    const newErrors = {};
    
    if (!form.username.trim()) {
      newErrors.username = 'Username is required';
    }
    
    if (!form.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(form.email)) {
      newErrors.email = 'Please enter a valid email address';
    }
    
    if (!form.password) {
      newErrors.password = 'Password is required';
    } else if (form.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    }
    
    if (form.password !== form.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle registration submission
  const handleRegister = async () => {
    if (!validateForm()) return;
    
    setIsSubmitting(true);
    
    try {
      // Register user
      await authService.register({
        username: form.username,
        email: form.email,
        password: form.password
      });
      
      // On success, show confirmation and navigate to sign in
      Alert.alert(
        "Registration Successful",
        "Your account was created successfully. Please sign in.",
        [{ 
          text: "OK", 
          onPress: () => router.push("/sign-in") 
        }]
      );
    } catch (error) {
      console.error('Registration error:', error);
      Alert.alert(
        "Registration Failed", 
        error.message || "Something went wrong. Please try again.",
        [{ text: "OK" }]
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle text input changes
  const handleChange = (field, value) => {
    const newForm = {...form};
    newForm[field] = value;
    setForm(newForm);
    
    // Clear error when typing
    if (errors[field]) {
      const newErrors = {...errors};
      delete newErrors[field];
      setErrors(newErrors);
    }
  };

  return (
    <SafeAreaView 
      style={{ 
        flex: 1, 
        backgroundColor: COLORS.background
      }}
    >
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />
      
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView 
          contentContainerStyle={{ 
            paddingHorizontal: 24,
            paddingVertical: 40
          }}
          keyboardShouldPersistTaps="handled"
        >
          {/* Logo and Header */}
          <View style={{ alignItems: 'center', marginBottom: 32 }}>
            <Image 
              source={images.logo}
              resizeMode='contain'
              style={{ 
                width: 160, 
                height: 100, 
                marginBottom: 24 
              }}
            />
            
            <Text style={{ 
              fontSize: 28, 
              fontWeight: '700', 
              color: COLORS.text.primary, 
              textAlign: 'center'
            }}>
              Create Account
            </Text>
            
            <Text style={{ 
              fontSize: 16, 
              color: COLORS.text.secondary, 
              textAlign: 'center',
              marginTop: 8
            }}>
              Join TFR Finance to manage your finances
            </Text>
          </View>
          
          {/* Registration Form */}
          <View style={{ marginBottom: 24 }}>
            {/* Username field */}
            <View style={{ marginBottom: 16 }}>
              <Text style={{ 
                fontSize: 16, 
                fontWeight: '500', 
                color: COLORS.text.primary,
                marginBottom: 8
              }}>
                Username
              </Text>
              
              <View style={{
                flexDirection: 'row',
                alignItems: 'center',
                backgroundColor: COLORS.card,
                borderRadius: 12,
                borderWidth: 1,
                borderColor: errors.username ? COLORS.error : '#E5E7EB',
                paddingHorizontal: 16,
                height: 52,
              }}>
                <Ionicons 
                  name="person-outline" 
                  size={20} 
                  color={COLORS.text.muted}
                  style={{ marginRight: 12 }}
                />
                
                <TextInput
                  value={form.username}
                  onChangeText={(text) => handleChange('username', text)}
                  placeholder="Choose a username"
                  placeholderTextColor={COLORS.text.muted}
                  style={{
                    flex: 1,
                    fontSize: 16,
                    color: COLORS.text.primary
                  }}
                />
              </View>
              
              {errors.username && (
                <Text style={{ 
                  color: COLORS.error, 
                  fontSize: 14, 
                  marginTop: 4,
                  marginLeft: 4
                }}>
                  {errors.username}
                </Text>
              )}
            </View>
            
            {/* Email field */}
            <View style={{ marginBottom: 16 }}>
              <Text style={{ 
                fontSize: 16, 
                fontWeight: '500', 
                color: COLORS.text.primary,
                marginBottom: 8
              }}>
                Email
              </Text>
              
              <View style={{
                flexDirection: 'row',
                alignItems: 'center',
                backgroundColor: COLORS.card,
                borderRadius: 12,
                borderWidth: 1,
                borderColor: errors.email ? COLORS.error : '#E5E7EB',
                paddingHorizontal: 16,
                height: 52,
              }}>
                <Ionicons 
                  name="mail-outline" 
                  size={20} 
                  color={COLORS.text.muted}
                  style={{ marginRight: 12 }}
                />
                
                <TextInput
                  value={form.email}
                  onChangeText={(text) => handleChange('email', text)}
                  placeholder="Enter your email"
                  placeholderTextColor={COLORS.text.muted}
                  keyboardType="email-address"
                  style={{
                    flex: 1,
                    fontSize: 16,
                    color: COLORS.text.primary
                  }}
                />
              </View>
              
              {errors.email && (
                <Text style={{ 
                  color: COLORS.error, 
                  fontSize: 14, 
                  marginTop: 4,
                  marginLeft: 4
                }}>
                  {errors.email}
                </Text>
              )}
            </View>
            
            {/* Password field */}
            <View style={{ marginBottom: 16 }}>
              <Text style={{ 
                fontSize: 16, 
                fontWeight: '500', 
                color: COLORS.text.primary,
                marginBottom: 8
              }}>
                Password
              </Text>
              
              <View style={{
                flexDirection: 'row',
                alignItems: 'center',
                backgroundColor: COLORS.card,
                borderRadius: 12,
                borderWidth: 1,
                borderColor: errors.password ? COLORS.error : '#E5E7EB',
                paddingHorizontal: 16,
                height: 52,
              }}>
                <Ionicons 
                  name="lock-closed-outline" 
                  size={20} 
                  color={COLORS.text.muted}
                  style={{ marginRight: 12 }}
                />
                
                <TextInput
                  value={form.password}
                  onChangeText={(text) => handleChange('password', text)}
                  placeholder="Create a password"
                  placeholderTextColor={COLORS.text.muted}
                  secureTextEntry={!showPassword}
                  style={{
                    flex: 1,
                    fontSize: 16,
                    color: COLORS.text.primary
                  }}
                />
                
                <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                  <Ionicons 
                    name={showPassword ? 'eye-off-outline' : 'eye-outline'} 
                    size={20} 
                    color={COLORS.text.muted} 
                  />
                </TouchableOpacity>
              </View>
              
              {errors.password && (
                <Text style={{ 
                  color: COLORS.error, 
                  fontSize: 14, 
                  marginTop: 4,
                  marginLeft: 4
                }}>
                  {errors.password}
                </Text>
              )}
            </View>
            
            {/* Confirm Password field */}
            <View style={{ marginBottom: 16 }}>
              <Text style={{ 
                fontSize: 16, 
                fontWeight: '500', 
                color: COLORS.text.primary,
                marginBottom: 8
              }}>
                Confirm Password
              </Text>
              
              <View style={{
                flexDirection: 'row',
                alignItems: 'center',
                backgroundColor: COLORS.card,
                borderRadius: 12,
                borderWidth: 1,
                borderColor: errors.confirmPassword ? COLORS.error : '#E5E7EB',
                paddingHorizontal: 16,
                height: 52,
              }}>
                <Ionicons 
                  name="shield-checkmark-outline" 
                  size={20} 
                  color={COLORS.text.muted}
                  style={{ marginRight: 12 }}
                />
                
                <TextInput
                  value={form.confirmPassword}
                  onChangeText={(text) => handleChange('confirmPassword', text)}
                  placeholder="Confirm your password"
                  placeholderTextColor={COLORS.text.muted}
                  secureTextEntry={!showConfirmPassword}
                  style={{
                    flex: 1,
                    fontSize: 16,
                    color: COLORS.text.primary
                  }}
                />
                
                <TouchableOpacity onPress={() => setShowConfirmPassword(!showConfirmPassword)}>
                  <Ionicons 
                    name={showConfirmPassword ? 'eye-off-outline' : 'eye-outline'} 
                    size={20} 
                    color={COLORS.text.muted} 
                  />
                </TouchableOpacity>
              </View>
              
              {errors.confirmPassword && (
                <Text style={{ 
                  color: COLORS.error, 
                  fontSize: 14, 
                  marginTop: 4,
                  marginLeft: 4
                }}>
                  {errors.confirmPassword}
                </Text>
              )}
            </View>
            
            {/* Password requirements hint */}
            <View style={{
              backgroundColor: '#F3F4F6',
              borderRadius: 8,
              padding: 12,
              marginBottom: 20,
              marginTop: 8
            }}>
              <Text style={{ color: COLORS.text.secondary, fontSize: 14 }}>
                Password must be at least 8 characters long
              </Text>
            </View>
            
            {/* Register Button */}
            <TouchableOpacity
              onPress={handleRegister}
              disabled={isSubmitting}
              style={{
                backgroundColor: COLORS.primary,
                borderRadius: 12,
                height: 52,
                justifyContent: 'center',
                alignItems: 'center',
                marginTop: 4,
                shadowColor: "#000",
                shadowOffset: {
                  width: 0,
                  height: 2,
                },
                shadowOpacity: 0.1,
                shadowRadius: 3,
                elevation: 2,
              }}
            >
              {isSubmitting ? (
                <ActivityIndicator color={COLORS.card} />
              ) : (
                <Text style={{
                  fontSize: 16,
                  fontWeight: '600',
                  color: COLORS.card
                }}>
                  Create Account
                </Text>
              )}
            </TouchableOpacity>
          </View>
          
          {/* Sign In Link */}
          <View style={{ 
            flexDirection: 'row', 
            justifyContent: 'center'
          }}>
            <Text style={{ 
              fontSize: 16, 
              color: COLORS.text.secondary
            }}>
              Already have an account?
            </Text>
            
            <Link href="/sign-in" asChild>
              <TouchableOpacity>
                <Text style={{ 
                  fontSize: 16, 
                  fontWeight: '600', 
                  color: COLORS.primary,
                  marginLeft: 4
                }}>
                  Sign In
                </Text>
              </TouchableOpacity>
            </Link>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default SignUp;