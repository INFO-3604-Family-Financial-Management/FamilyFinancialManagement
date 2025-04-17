// app/(auth)/sign-in.jsx
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

const SignIn = () => {
  // Use the original form structure since it was working before
  const [form, setForm] = useState({
    username: '',
    password: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);

  // Validate form
  const validateForm = () => {
    const newErrors = {};
    
    if (!form.username.trim()) {
      newErrors.username = 'Username is required';
    }
    
    if (!form.password) {
      newErrors.password = 'Password is required';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle login submission
  const handleLogin = async () => {
    if (!validateForm()) return;
    
    setIsSubmitting(true);
    
    try {
      // Login user
      await authService.login({
        username: form.username,
        password: form.password
      });
      
      // Navigate to home on success
      router.replace('/home');
    } catch (error) { 
      Alert.alert(
        "Login Failed", 
        "Invalid username or password. Please try again.",
        [{ text: "OK" }]
      );
    } finally {
      setIsSubmitting(false);
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
            flexGrow: 1, 
            justifyContent: 'center',
            paddingHorizontal: 24
          }}
          keyboardShouldPersistTaps="handled"
        >
          {/* Logo and Header */}
          <View style={{ alignItems: 'center', marginBottom: 40 }}>
            <Image 
              source={images.logo}
              resizeMode='contain'
              style={{ 
                width: 180, 
                height: 120, 
                marginBottom: 24 
              }}
            />
            
            <Text style={{ 
              fontSize: 28, 
              fontWeight: '700', 
              color: COLORS.text.primary, 
              textAlign: 'center'
            }}>
              Welcome Back
            </Text>
            
            <Text style={{ 
              fontSize: 16, 
              color: COLORS.text.secondary, 
              textAlign: 'center',
              marginTop: 8
            }}>
              Sign in to continue to TFR Finance
            </Text>
          </View>
          
          {/* Login Form */}
          <View style={{ marginBottom: 24 }}>
            {/* Username Field */}
            <View style={{ marginBottom: 20 }}>
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
                  onChangeText={(text) => {
                    const newForm = {...form};
                    newForm.username = text;
                    setForm(newForm);
                    // Clear error when typing
                    if (errors.username) {
                      const newErrors = {...errors};
                      delete newErrors.username;
                      setErrors(newErrors);
                    }
                  }}
                  placeholder="Enter your username"
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
            
            {/* Password Field */}
            <View style={{ marginBottom: 20 }}>
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
                  onChangeText={(text) => {
                    const newForm = {...form};
                    newForm.password = text;
                    setForm(newForm);
                    // Clear error when typing
                    if (errors.password) {
                      const newErrors = {...errors};
                      delete newErrors.password;
                      setErrors(newErrors);
                    }
                  }}
                  placeholder="Enter your password"
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
            
            {/* Login Button */}
            <TouchableOpacity
              onPress={handleLogin}
              disabled={isSubmitting}
              style={{
                backgroundColor: COLORS.primary,
                borderRadius: 12,
                height: 52,
                justifyContent: 'center',
                alignItems: 'center',
                marginTop: 20,
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
                  Sign In
                </Text>
              )}
            </TouchableOpacity>
          </View>
          
          {/* Sign Up Link */}
          <View style={{ 
            flexDirection: 'row', 
            justifyContent: 'center'
          }}>
            <Text style={{ 
              fontSize: 16, 
              color: COLORS.text.secondary
            }}>
              Don't have an account?
            </Text>
            
            <Link href="/sign-up" asChild>
              <TouchableOpacity>
                <Text style={{ 
                  fontSize: 16, 
                  fontWeight: '600', 
                  color: COLORS.primary,
                  marginLeft: 4
                }}>
                  Sign Up
                </Text>
              </TouchableOpacity>
            </Link>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default SignIn;