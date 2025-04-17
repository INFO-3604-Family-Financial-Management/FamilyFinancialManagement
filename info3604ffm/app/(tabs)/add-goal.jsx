import React, { useState } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity,
  SafeAreaView,
  StyleSheet,
  StatusBar,
  ScrollView,
  Alert
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Checkbox from 'expo-checkbox';
import FormField from '@/components/FormField';
import CustomButton from '@/components/CustomButton';
import { goalService } from '@/services/api';
import { COLORS, SHADOWS, BORDER_RADIUS } from '@/constants/theme';

const AddGoal = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [form, setForm] = useState({
    name: '',
    amount: '',
    goalType: 'saving', // Default to saving
  });

  const validateForm = () => {
    if (!form.name.trim()) {
      Alert.alert("Validation Error", "Please enter a goal name");
      return false;
    }
    
    const amount = parseFloat(form.amount);
    if (isNaN(amount) || amount <= 0) {
      Alert.alert("Validation Error", "Please enter a valid amount greater than 0");
      return false;
    }
    
    return true;
  };

  const submit = async () => {
    if (!validateForm()) return;
    
    setIsLoading(true);
    
    try {
      const goalData = {
        name: form.name,
        amount: parseFloat(form.amount),
        goalType: form.goalType,
        isPersonal: true // Personal goal
      };
      
      await goalService.createGoal(goalData);
      
      Alert.alert(
        "Success",
        "Goal created successfully",
        [{ text: "OK", onPress: () => router.push('/goals') }]
      );
    } catch (error) {
      console.error('Create goal error:', error);
      Alert.alert("Error", error.message || "Failed to create goal");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.primary.main} />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={24} color={COLORS.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Add New Goal</Text>
        <View style={{ width: 24 }} />
      </View>
      
      <ScrollView 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Goal Form Card */}
        <View style={styles.formCard}>
          <Text style={styles.sectionTitle}>Goal Details</Text>
          
          {/* Name Input */}
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Goal Name</Text>
            <View style={styles.textInputContainer}>
              <FormField
                title=""
                value={form.name}
                handleChangeText={(e) => setForm({...form, name: e})}
                icon="bookmark-outline"
              />
            </View>
          </View>
          
          {/* Amount Input */}
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Goal Amount</Text>
            <View style={styles.textInputContainer}>
              <FormField
                title=""
                value={form.amount}
                handleChangeText={(e) => setForm({...form, amount: e})}
                keyboardType="numeric"
                icon="calculator-outline"
              />
            </View>
          </View>
          
          {/* Goal Type Selection */}
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Goal Type</Text>
            <View style={styles.checkboxContainer}>
              <TouchableOpacity 
                style={styles.checkboxOption}
                onPress={() => setForm({...form, goalType: 'saving'})}
              >
                <Checkbox 
                  value={form.goalType === 'saving'} 
                  onValueChange={() => setForm({...form, goalType: 'saving'})}
                  color={form.goalType === 'saving' ? COLORS.primary.main : undefined}
                  style={styles.checkbox}
                />
                <View style={styles.checkboxContent}>
                  <Text style={styles.checkboxLabel}>Saving</Text>
                  <Text style={styles.checkboxDescription}>Track money you want to save</Text>
                </View>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.checkboxOption}
                onPress={() => setForm({...form, goalType: 'spending'})}
              >
                <Checkbox 
                  value={form.goalType === 'spending'} 
                  onValueChange={() => setForm({...form, goalType: 'spending'})}
                  color={form.goalType === 'spending' ? COLORS.primary.main : undefined}
                  style={styles.checkbox}
                />
                <View style={styles.checkboxContent}>
                  <Text style={styles.checkboxLabel}>Spending</Text>
                  <Text style={styles.checkboxDescription}>Track money you plan to spend</Text>
                </View>
              </TouchableOpacity>
            </View>
          </View>
        </View>
        
        {/* Help Card */}
        <View style={styles.infoCard}>
          <View style={styles.infoHeader}>
            <Ionicons name="information-circle" size={20} color={COLORS.primary.main} />
            <Text style={styles.infoTitle}>About Goals</Text>
          </View>
          <Text style={styles.infoText}>
            Set personal goals to track your finances. Saving goals help you save
            towards a target, while spending goals help you monitor planned expenses.
          </Text>
        </View>
      </ScrollView>
      
      {/* Action Buttons */}
      <View style={styles.buttonContainer}>
        <TouchableOpacity 
          style={styles.cancelButton}
          onPress={() => router.push("/goals")}
        >
          <Text style={styles.cancelButtonText}>Cancel</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[
            styles.saveButton,
            isLoading && styles.disabledButton
          ]}
          onPress={submit}
          disabled={isLoading}
        >
          {isLoading ? (
            <Text style={styles.saveButtonText}>Creating...</Text>
          ) : (
            <Text style={styles.saveButtonText}>Create Goal</Text>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background.primary,
  },
  header: {
    backgroundColor: COLORS.primary.main,
    paddingHorizontal: 16,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    ...SHADOWS.medium,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.white,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 100, // Extra space for bottom buttons
  },
  formCard: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    ...SHADOWS.small,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.neutral[800],
    marginBottom: 16,
  },
  inputContainer: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.neutral[700],
    marginBottom: 8,
  },
  textInputContainer: {
    borderRadius: 12,
  },
  checkboxContainer: {
    backgroundColor: COLORS.background.secondary,
    borderRadius: 12,
    padding: 8,
  },
  checkboxOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    marginBottom: 8,
    backgroundColor: COLORS.white,
    borderRadius: 8,
    ...SHADOWS.tiny,
  },
  checkbox: {
    marginRight: 12,
    height: 22,
    width: 22,
    borderRadius: 4,
  },
  checkboxContent: {
    flex: 1,
  },
  checkboxLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: COLORS.neutral[800],
    marginBottom: 2,
  },
  checkboxDescription: {
    fontSize: 12,
    color: COLORS.neutral[500],
  },
  infoCard: {
    backgroundColor: COLORS.primary.light + '20',
    borderRadius: 12,
    padding: 16,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.primary.main,
    marginBottom: 16,
  },
  infoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  infoTitle: {
    marginLeft: 8,
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.primary.main,
  },
  infoText: {
    color: COLORS.neutral[700],
    lineHeight: 20,
  },
  buttonContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    padding: 16,
    backgroundColor: COLORS.white,
    borderTopWidth: 1,
    borderTopColor: COLORS.neutral[200],
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
    borderWidth: 1,
    borderColor: COLORS.neutral[300],
    borderRadius: 12,
  },
  cancelButtonText: {
    color: COLORS.neutral[700],
    fontWeight: '600',
    fontSize: 16,
  },
  saveButton: {
    flex: 2,
    backgroundColor: COLORS.primary.main,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    ...SHADOWS.small,
  },
  saveButtonText: {
    color: COLORS.white,
    fontWeight: '600',
    fontSize: 16,
  },
  disabledButton: {
    opacity: 0.7,
  },
});

export default AddGoal;