import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
  ActivityIndicator,
  Alert
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { profileService } from '../../services/api';
import { COLORS, SHADOWS, BORDER_RADIUS } from '../../constants/theme';

const EditProfile = () => {
  // State
  const [form, setForm] = useState({
    monthlyIncome: ''
  });
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  // Fetch user profile
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const profile = await profileService.getUserProfile();
        
        if (profile && profile.monthly_income !== undefined) {
          setForm({
            monthlyIncome: profile.monthly_income.toString()
          });
        } else {
          setForm({
            monthlyIncome: '0'
          });
        }
      } catch (error) {
        console.error('Error fetching profile:', error);
        setError('Failed to load profile data. You can still update your income below.');
        
        // Set default value on error
        setForm({
          monthlyIncome: '0'
        });
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

  // Handle form submission
  const handleSubmit = async () => {
    try {
      // Validate input
      let incomeValue = form.monthlyIncome.trim();
      
      // Handle empty value
      if (!incomeValue) {
        incomeValue = '0';
      }
      
      // Validate numeric value
      if (isNaN(parseFloat(incomeValue)) || parseFloat(incomeValue) < 0) {
        Alert.alert('Error', 'Please enter a valid income amount (0 or greater)');
        return;
      }

      setSubmitting(true);
      setError(null);
      
      // Update profile
      await profileService.updateUserProfile({
        monthly_income: parseFloat(incomeValue)
      });

      Alert.alert(
        'Success',
        'Your income has been updated successfully',
        [{ 
          text: 'OK', 
          onPress: () => router.back()
        }]
      );
    } catch (error) {
      console.error('Update profile error:', error);
      setError('Failed to update your income. Please try again.');
      Alert.alert('Error', 'Failed to update your income. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  // Format currency
  const formatCurrency = (value) => {
    if (!value) return '$0.00';
    return `$${parseFloat(value).toFixed(2)}`;
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.background.primary }}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.primary.main} />
      
      {/* Header */}
      <View style={{
        backgroundColor: COLORS.primary.main,
        paddingHorizontal: 20,
        paddingTop: 20,
        paddingBottom: 20,
        flexDirection: 'row',
        alignItems: 'center',
        borderBottomLeftRadius: 20,
        borderBottomRightRadius: 20,
        ...SHADOWS.medium
      }}>
        <TouchableOpacity 
          onPress={() => router.back()}
          style={{
            width: 40,
            height: 40,
            borderRadius: 20,
            backgroundColor: 'rgba(255,255,255,0.2)',
            justifyContent: 'center',
            alignItems: 'center'
          }}
        >
          <Ionicons name="arrow-back" size={24} color={COLORS.white} />
        </TouchableOpacity>
        
        <Text style={{
          flex: 1,
          fontSize: 20,
          fontWeight: '700',
          color: COLORS.white,
          textAlign: 'center',
          marginRight: 40 // To balance with back button
        }}>
          Update Income
        </Text>
      </View>
      
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView 
          contentContainerStyle={{ padding: 16 }}
          keyboardShouldPersistTaps="handled"
        >
          {loading ? (
            <View style={{ 
              alignItems: 'center', 
              justifyContent: 'center', 
              paddingVertical: 40 
            }}>
              <ActivityIndicator size="large" color={COLORS.primary.main} />
              <Text style={{ 
                marginTop: 16, 
                color: COLORS.neutral[600],
                textAlign: 'center'
              }}>
                Loading your profile...
              </Text>
            </View>
          ) : (
            <>
              {error && (
                <View style={{
                  backgroundColor: COLORS.error.light + '30',
                  borderRadius: 12,
                  padding: 16,
                  marginBottom: 24,
                  borderLeftWidth: 4,
                  borderLeftColor: COLORS.error.main
                }}>
                  <Text style={{ color: COLORS.error.main }}>
                    {error}
                  </Text>
                </View>
              )}
              
              {/* Income Preview Card */}
              <View style={{
                backgroundColor: COLORS.primary.main,
                borderRadius: 16,
                padding: 20,
                marginBottom: 24,
                alignItems: 'center',
                ...SHADOWS.medium
              }}>
                <Text style={{ 
                  fontSize: 16, 
                  color: COLORS.white, 
                  opacity: 0.9,
                  marginBottom: 8
                }}>
                  Your Monthly Income
                </Text>
                
                <Text style={{ 
                  fontSize: 32, 
                  fontWeight: '700', 
                  color: COLORS.white 
                }}>
                  {formatCurrency(form.monthlyIncome)}
                </Text>
              </View>
              
              {/* Income Input */}
              <View style={{
                backgroundColor: COLORS.white,
                borderRadius: 16,
                padding: 20,
                marginBottom: 24,
                ...SHADOWS.small
              }}>
                <Text style={{ 
                  fontSize: 18, 
                  fontWeight: '600', 
                  color: COLORS.neutral[800],
                  marginBottom: 16
                }}>
                  Update Monthly Income
                </Text>
                
                <Text style={{ 
                  fontSize: 14, 
                  color: COLORS.neutral[600],
                  marginBottom: 16
                }}>
                  Enter your monthly income to help track your budget and savings progress.
                </Text>
                
                <View style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  backgroundColor: COLORS.background.secondary,
                  borderRadius: 12,
                  paddingHorizontal: 16,
                  marginBottom: 8
                }}>
                  <Text style={{ 
                    fontSize: 20, 
                    fontWeight: '500', 
                    color: COLORS.neutral[700],
                    marginRight: 8
                  }}>
                    $
                  </Text>
                  
                  <TextInput
                    value={form.monthlyIncome}
                    onChangeText={(text) => {
                      // Only allow numbers and a single decimal point
                      if (/^\d*\.?\d*$/.test(text) || text === '') {
                        setForm({ ...form, monthlyIncome: text });
                      }
                    }}
                    placeholder="0.00"
                    keyboardType="decimal-pad"
                    style={{
                      flex: 1,
                      fontSize: 20,
                      paddingVertical: 12,
                      color: COLORS.neutral[800]
                    }}
                  />
                </View>
                
                <Text style={{ 
                  fontSize: 12, 
                  color: COLORS.neutral[500],
                  fontStyle: 'italic'
                }}>
                  This is the total amount you expect to earn each month before taxes.
                </Text>
              </View>
              
              {/* Information Card */}
              <View style={{
                backgroundColor: COLORS.primary.light + '20',
                borderRadius: 12,
                padding: 16,
                marginBottom: 24,
                borderLeftWidth: 4,
                borderLeftColor: COLORS.primary.main
              }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                  <Ionicons name="information-circle" size={20} color={COLORS.primary.main} />
                  <Text style={{ 
                    marginLeft: 8, 
                    fontSize: 16, 
                    fontWeight: '600', 
                    color: COLORS.primary.main 
                  }}>
                    Why is this important?
                  </Text>
                </View>
                
                <Text style={{ color: COLORS.neutral[700], lineHeight: 20 }}>
                  Your income is used to calculate budget percentages and savings goals. 
                  Keeping it updated helps you maintain accurate financial tracking.
                </Text>
              </View>
            </>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
      
      {/* Bottom action buttons */}
      <View style={{
        padding: 16,
        backgroundColor: COLORS.white,
        borderTopWidth: 1,
        borderTopColor: COLORS.neutral[200]
      }}>
        <View style={{ flexDirection: 'row' }}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={{
              flex: 1,
              backgroundColor: COLORS.neutral[200],
              borderRadius: 12,
              paddingVertical: 16,
              marginRight: 8,
              alignItems: 'center'
            }}
          >
            <Text style={{ 
              color: COLORS.neutral[800], 
              fontWeight: '600' 
            }}>
              Cancel
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            onPress={handleSubmit}
            disabled={submitting || loading}
            style={{
              flex: 2,
              backgroundColor: COLORS.primary.main,
              borderRadius: 12,
              paddingVertical: 16,
              marginLeft: 8,
              alignItems: 'center',
              opacity: (submitting || loading) ? 0.7 : 1,
              ...SHADOWS.small
            }}
          >
            {submitting ? (
              <ActivityIndicator size="small" color={COLORS.white} />
            ) : (
              <Text style={{ 
                color: COLORS.white, 
                fontWeight: '600' 
              }}>
                Update Income
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
};

export default EditProfile;