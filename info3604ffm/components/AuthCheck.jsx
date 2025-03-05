import React, { useEffect } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { useSegments, useRouter } from 'expo-router';
import { useAuth } from '@/context/AuthContext';

// Groups that don't require authentication
const publicGroups = ['(auth)'];

const AuthCheck = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;

    const inAuthGroup = segments[0] === '(auth)';
    const onIndexPage = segments.length === 0 || segments[0] === '';

    // Handle authentication routing
    if (!isAuthenticated && !inAuthGroup && !onIndexPage) {
      // Redirect to sign-in if not authenticated and not in auth group
      router.replace('/sign-in');
    } else if (isAuthenticated && inAuthGroup) {
      // Redirect to home if authenticated and trying to access auth screens
      router.replace('/home');
    }
  }, [isAuthenticated, segments, isLoading]);

  if (isLoading) {
    // Show loading spinner while checking authentication
    return (
      <View className="flex-1 justify-center items-center bg-black">
        <ActivityIndicator size="large" color="#FED403" />
      </View>
    );
  }

  return <>{children}</>;
};

export default AuthCheck;