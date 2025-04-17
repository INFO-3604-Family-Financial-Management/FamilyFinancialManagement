// app/(tabs)/create-budget.jsx
import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  Switch,
  ActivityIndicator,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  StatusBar
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { budgetService, profileService } from '../../services/api';
import { COLORS, SHADOWS, BORDER_RADIUS } from '../../constants/theme';

const CreateBudget = () => {
  // Get params from route
  const params = useLocalSearchParams();
  const isFamily = params.family === 'true';
  const budgetId = params.budgetId;
  const isEditing = params.mode === 'edit';
  
  // State
  const [form, setForm] = useState({
    category: '',
    name: '',
    amount: '',
    isFamily: isFamily || false
  });
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [hasFamily, setHasFamily] = useState(false);
  const [errors, setErrors] = useState({});
  const [currentMonth, setCurrentMonth] = useState('');
  
  // Get current month on mount
  useEffect(() => {
    const monthNames = [
      "January", "February", "March", "April", "May", "June",
      "July", "August", "September", "October", "November", "December"
    ];
    const now = new Date();
    setCurrentMonth(monthNames[now.getMonth()]);
  }, []);
  
  // Fetch initial data
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Check if user has a family
        const profile = await profileService.getUserProfile();
        setHasFamily(!!profile.family);
        
        // If editing, fetch budget details
        if (isEditing && budgetId) {
          let budgetData;
          if (isFamily) {
            // Fetch family budget
            const familyBudgets = await budgetService.getFamilyBudgets();
            budgetData = familyBudgets.find(b => b.id.toString() === budgetId.toString());
          } else {
            // Fetch personal budget
            const budgets = await budgetService.getBudgets();
            budgetData = budgets.find(b => b.id.toString() === budgetId.toString());
          }
          
          if (budgetData) {
            setForm({
              category: budgetData.category || '',
              name: budgetData.name || '',
              amount: budgetData.amount.toString() || '',
              isFamily: isFamily || false
            });
          } else {
            Alert.alert('Error', 'Budget not found');
            router.back();
          }
        }
      } catch (error) {
        console.error('Error loading data:', error);
        Alert.alert('Error', 'Failed to load data');
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [budgetId, isEditing, isFamily]);

  // Validate form
  const validateForm = () => {
    const newErrors = {};
    
    if (!form.category.trim()) {
      newErrors.category = 'Category is required';
    }
    
    if (!form.name.trim()) {
      newErrors.name = 'Name is required';
    }
    
    if (!form.amount.trim()) {
      newErrors.amount = 'Amount is required';
    } else if (isNaN(parseFloat(form.amount)) || parseFloat(form.amount) <= 0) {
      newErrors.amount = 'Amount must be a positive number';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submission
  const handleSubmit = async () => {
    if (!validateForm()) return;
    
    try {
      setSubmitting(true);
      
      const budgetData = {
        category: form.category,
        name: form.name,
        amount: parseFloat(form.amount)
      };
      
      if (isEditing && budgetId) {
        // Update existing budget
        if (form.isFamily) {
          await budgetService.updateFamilyBudget(budgetId, budgetData);
        } else {
          await budgetService.updateBudget(budgetId, budgetData);
        }
        
        Alert.alert(
          'Success',
          'Budget updated successfully',
          [{ text: 'OK', onPress: () => router.back() }]
        );
      } else {
        // Create new budget
        if (form.isFamily) {
          await budgetService.createFamilyBudget(budgetData);
          
          Alert.alert(
            'Success',
            'Family budget created successfully',
            [{ text: 'OK', onPress: () => router.push('/family-budget') }]
          );
        } else {
          await budgetService.createBudget(budgetData);
          
          Alert.alert(
            'Success',
            'Budget created successfully',
            [{ text: 'OK', onPress: () => router.push('/budget') }]
          );
        }
      }
    } catch (error) {
      console.error('Error saving budget:', error);
      Alert.alert('Error', error.message || 'Failed to save budget');
    } finally {
      setSubmitting(false);
    }
  };

  // Input field component
  const InputField = ({ label, value, onChange, placeholder, keyboardType, error }) => (
    <View style={{ marginBottom: 16 }}>
      <Text style={{ 
        fontSize: 16, 
        fontWeight: '500', 
        color: COLORS.neutral[700],
        marginBottom: 8
      }}>
        {label}
      </Text>
      
      <View style={{
        backgroundColor: COLORS.white,
        borderRadius: 12,
        borderWidth: error ? 1 : 0,
        borderColor: error ? COLORS.error.main : 'transparent',
        ...SHADOWS.small
      }}>
        <TextInput
          value={value}
          onChangeText={onChange}
          placeholder={placeholder}
          keyboardType={keyboardType || 'default'}
          style={{
            paddingHorizontal: 16,
            paddingVertical: 12,
            fontSize: 16,
            color: COLORS.neutral[800]
          }}
        />
      </View>
      
      {error && (
        <Text style={{ 
          color: COLORS.error.main, 
          fontSize: 12, 
          marginTop: 4, 
          marginLeft: 4 
        }}>
          {error}
        </Text>
      )}
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.background.primary }}>
        <StatusBar barStyle="light-content" backgroundColor={COLORS.primary.main} />
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color={COLORS.primary.main} />
          <Text style={{ marginTop: 16, color: COLORS.neutral[600] }}>
            {isEditing ? 'Loading budget...' : 'Loading...'}
          </Text>
        </View>
      </SafeAreaView>
    );
  }

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
          {isEditing ? 'Edit Budget' : 'Create Budget'}
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
          {/* Current Month Banner */}
          <View style={{
            backgroundColor: COLORS.white,
            borderRadius: 12,
            padding: 16,
            marginBottom: 24,
            alignItems: 'center',
            ...SHADOWS.small
          }}>
            <Text style={{ 
              fontSize: 16, 
              color: COLORS.neutral[600],
              marginBottom: 4
            }}>
              Budget for
            </Text>
            <Text style={{ 
              fontSize: 24, 
              fontWeight: '700', 
              color: COLORS.neutral[800] 
            }}>
              {currentMonth}
            </Text>
          </View>
          
          {/* Budget Form */}
          <View style={{ marginBottom: 24 }}>
            <InputField
              label="Category"
              value={form.category}
              onChange={(text) => setForm({ ...form, category: text })}
              placeholder="e.g., Housing, Food, Transportation"
              error={errors.category}
            />
            
            <InputField
              label="Budget Name"
              value={form.name}
              onChange={(text) => setForm({ ...form, name: text })}
              placeholder="e.g., Rent, Groceries, Gas"
              error={errors.name}
            />
            
            <InputField
              label="Monthly Amount"
              value={form.amount}
              onChange={(text) => {
                // Only allow numbers and a single decimal point
                if (/^\d*\.?\d*$/.test(text) || text === '') {
                  setForm({ ...form, amount: text });
                }
              }}
              placeholder="0.00"
              keyboardType="decimal-pad"
              error={errors.amount}
            />
            
            {/* Family Budget Toggle - Only if user has a family */}
            {hasFamily && (
              <View style={{ 
                marginTop: 8,
                backgroundColor: COLORS.white,
                borderRadius: 12,
                padding: 16,
                ...SHADOWS.small
              }}>
                <View style={{
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <View>
                    <Text style={{ 
                      fontSize: 16, 
                      fontWeight: '500', 
                      color: COLORS.neutral[800],
                      marginBottom: 4
                    }}>
                      Family Budget
                    </Text>
                    <Text style={{ 
                      fontSize: 14, 
                      color: COLORS.neutral[600] 
                    }}>
                      Share this budget with your family
                    </Text>
                  </View>
                  
                  <Switch
                    value={form.isFamily}
                    onValueChange={(value) => {
                      // If editing, don't allow changing between personal and family
                      if (!isEditing) {
                        setForm({ ...form, isFamily: value });
                      }
                    }}
                    trackColor={{ 
                      false: COLORS.neutral[300], 
                      true: COLORS.primary.light 
                    }}
                    thumbColor={form.isFamily ? COLORS.primary.main : COLORS.neutral[100]}
                    disabled={isEditing} // Can't change type when editing
                  />
                </View>
              </View>
            )}
          </View>
          
          {/* Family Budget Info Card - Show if family budget is selected */}
          {form.isFamily && (
            <View style={{
              backgroundColor: COLORS.primary.light + '30',
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
                  Family Budget
                </Text>
              </View>
              
              <Text style={{ color: COLORS.neutral[700] }}>
                This budget will be shared with all members of your family. 
                Everyone can track expenses against this budget.
              </Text>
            </View>
          )}
          
          {/* Form buttons */}
          <View style={{ flexDirection: 'row', marginBottom: 40 }}>
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
              disabled={submitting}
              style={{
                flex: 2,
                backgroundColor: COLORS.primary.main,
                borderRadius: 12,
                paddingVertical: 16,
                marginLeft: 8,
                alignItems: 'center',
                opacity: submitting ? 0.7 : 1,
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
                  {isEditing ? 'Update Budget' : 'Create Budget'}
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default CreateBudget;