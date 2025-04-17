import { View, Text, ScrollView, TouchableOpacity, StatusBar, Alert, Image } from 'react-native'
import React, { useState, useEffect } from 'react'
import { SafeAreaView } from 'react-native-safe-area-context'
import { router } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { useAuth } from '../../context/AuthContext'
import { profileService } from '../../services/api'
import { COLORS, SHADOWS, BORDER_RADIUS } from '../../constants/theme'

const ProfileScreen = () => {
  const { logout } = useAuth();
  const [userData, setUserData] = useState({
    username: '',
    email: '',
    income: 0,
    joinDate: null
  });
  const [loading, setLoading] = useState(true);
  
  // Fetch user profile data
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setLoading(true);
        const profile = await profileService.getUserProfile();
        
        setUserData({
          username: profile.username || '',
          email: profile.email || '',
          income: parseFloat(profile.monthly_income || 0),
          joinDate: profile.created_at ? new Date(profile.created_at) : null
        });
      } catch (error) {
        console.error('Error fetching profile:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchProfile();
  }, []);

  // Format currency
  const formatCurrency = (amount) => {
    return `$${parseFloat(amount).toFixed(2)}`;
  };
  
  // Format join date
  const formatDate = (date) => {
    if (!date) return 'N/A';
    
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  // Handle logout with confirmation
  const handleLogout = () => {
    Alert.alert(
      "Confirm Logout",
      "Are you sure you want to log out?",
      [
        { 
          text: "Cancel", 
          style: "cancel" 
        },
        { 
          text: "Logout", 
          style: "destructive",
          onPress: () => logout()
        }
      ]
    );
  };
  
  // Profile menu items
  const menuItems = [
    {
      title: 'Update Income',
      icon: 'cash-outline',
      color: COLORS.primary.main,
      route: '/edit-profile',
      description: 'Update your monthly income'
    },
    {
      title: 'Budget Management',
      icon: 'wallet-outline',
      color: COLORS.secondary.main,
      route: '/budget',
      description: 'Manage your budgets'
    },
    {
      title: 'Streak Statistics',
      icon: 'flame-outline',
      color: COLORS.success.main,
      route: '/streak-stats',
      description: 'View your login streak'
    },
    {
      title: 'Export Data',
      icon: 'download-outline',
      color: COLORS.error.main,
      route: '/export-data',
      description: 'Export your financial data'
    }
  ];

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.background.primary }}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.primary.main} />
      
      {/* Header */}
      <View style={{
        backgroundColor: COLORS.primary.main,
        paddingHorizontal: 20,
        paddingVertical: 20,
        borderBottomLeftRadius: 20,
        borderBottomRightRadius: 20,
        ...SHADOWS.medium
      }}>
        <Text style={{
          fontSize: 20,
          fontWeight: '700',
          color: COLORS.white,
          textAlign: 'center'
        }}>
          My Profile
        </Text>
      </View>
      
      <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
        {/* Profile Header */}
        <View style={{
          alignItems: 'center',
          paddingVertical: 24,
          paddingHorizontal: 16
        }}>
          <View style={{
            width: 100,
            height: 100,
            borderRadius: 50,
            backgroundColor: COLORS.primary.light,
            justifyContent: 'center',
            alignItems: 'center',
            marginBottom: 16,
            ...SHADOWS.medium
          }}>
            <Ionicons name="person" size={50} color={COLORS.primary.main} />
          </View>
          
          <Text style={{
            fontSize: 24,
            fontWeight: '700',
            color: COLORS.neutral[800],
            marginBottom: 4
          }}>
            {userData.username || 'User'}
          </Text>
          
          <Text style={{
            fontSize: 16,
            color: COLORS.neutral[600],
            marginBottom: 12
          }}>
            {userData.email || 'email@example.com'}
          </Text>
          
          <View style={{
            flexDirection: 'row',
            backgroundColor: COLORS.background.secondary,
            paddingHorizontal: 16,
            paddingVertical: 8,
            borderRadius: 12
          }}>
            <Text style={{
              color: COLORS.neutral[600],
              fontWeight: '500'
            }}>
              Member since:
            </Text>
            <Text style={{
              color: COLORS.neutral[800],
              fontWeight: '600',
              marginLeft: 4
            }}>
              {formatDate(userData.joinDate)}
            </Text>
          </View>
        </View>
        
        {/* Monthly Income Card */}
        <View style={{
          margin: 16,
          padding: 16,
          backgroundColor: COLORS.white,
          borderRadius: 16,
          ...SHADOWS.small
        }}>
          <Text style={{
            fontSize: 16,
            color: COLORS.neutral[600],
            marginBottom: 4
          }}>
            Monthly Income
          </Text>
          
          <View style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <Text style={{
              fontSize: 24,
              fontWeight: '700',
              color: COLORS.neutral[800]
            }}>
              {formatCurrency(userData.income)}
            </Text>
            
            <TouchableOpacity
              onPress={() => router.push('/edit-profile')}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                backgroundColor: COLORS.primary.light,
                paddingHorizontal: 12,
                paddingVertical: 6,
                borderRadius: 8
              }}
            >
              <Ionicons name="pencil" size={14} color={COLORS.primary.main} />
              <Text style={{
                marginLeft: 4,
                color: COLORS.primary.main,
                fontWeight: '500'
              }}>
                Update
              </Text>
            </TouchableOpacity>
          </View>
        </View>
        
        {/* Menu Items */}
        <View style={{
          paddingHorizontal: 16,
          marginBottom: 24
        }}>
          <Text style={{
            fontSize: 18,
            fontWeight: '600',
            color: COLORS.neutral[800],
            marginBottom: 12
          }}>
            Profile Settings
          </Text>
          
          {menuItems.map((item, index) => (
            <TouchableOpacity
              key={index}
              onPress={() => router.push(item.route)}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                backgroundColor: COLORS.white,
                padding: 16,
                borderRadius: 12,
                marginBottom: 12,
                ...SHADOWS.small
              }}
            >
              <View style={{
                width: 40,
                height: 40,
                borderRadius: 20,
                backgroundColor: `${item.color}15`,
                justifyContent: 'center',
                alignItems: 'center',
                marginRight: 12
              }}>
                <Ionicons name={item.icon} size={20} color={item.color} />
              </View>
              
              <View style={{ flex: 1 }}>
                <Text style={{
                  fontSize: 16,
                  fontWeight: '600',
                  color: COLORS.neutral[800],
                  marginBottom: 2
                }}>
                  {item.title}
                </Text>
                
                <Text style={{
                  fontSize: 12,
                  color: COLORS.neutral[500]
                }}>
                  {item.description}
                </Text>
              </View>
              
              <Ionicons name="chevron-forward" size={20} color={COLORS.neutral[400]} />
            </TouchableOpacity>
          ))}
        </View>
        
        {/* App Info Card */}
        <View style={{
          marginHorizontal: 16,
          padding: 16,
          backgroundColor: COLORS.background.secondary,
          borderRadius: 16
        }}>
          <Text style={{
            fontSize: 14,
            color: COLORS.neutral[600],
            textAlign: 'center',
            marginBottom: 8
          }}>
            TFR Finance v1.0.0
          </Text>
          
          <Text style={{
            fontSize: 12,
            color: COLORS.neutral[500],
            textAlign: 'center'
          }}>
            Family Financial Management
          </Text>
        </View>
      </ScrollView>
      
      {/* Logout Button */}
      <View style={{
        padding: 16,
        paddingBottom: 24,
        borderTopWidth: 1,
        borderTopColor: COLORS.neutral[200],
        backgroundColor: COLORS.white
      }}>
        <TouchableOpacity
          onPress={handleLogout}
          style={{
            backgroundColor: COLORS.error.main,
            paddingVertical: 14,
            borderRadius: 12,
            flexDirection: 'row',
            justifyContent: 'center',
            alignItems: 'center',
            ...SHADOWS.small
          }}
        >
          <Ionicons name="log-out-outline" size={20} color={COLORS.white} />
          <Text style={{
            color: COLORS.white,
            fontWeight: '600',
            fontSize: 16,
            marginLeft: 8
          }}>
            Logout
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  )
}

export default ProfileScreen;