import { View, Text, SafeAreaView, Alert, ActivityIndicator, TouchableOpacity, StyleSheet, StatusBar, ScrollView } from 'react-native'
import React, { useState, useEffect } from 'react'
import { router, useLocalSearchParams } from 'expo-router'
import FormField from '@/components/FormField'
import CustomButton from '@/components/CustomButton'
import { goalService } from '@/services/api'
import Checkbox from 'expo-checkbox'
import { Ionicons } from '@expo/vector-icons'
import { COLORS, SHADOWS, BORDER_RADIUS } from '../../constants/theme'

const EditFamilyGoal = () => {
  const params = useLocalSearchParams();
  const goalId = params.goalId;
  
  const [isLoading, setIsLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [goal, setGoal] = useState(null);
  const [form, setForm] = useState({
    name: '',
    amount: '',
    goalType: 'saving'
  });

  // Fetch goal data when component mounts
  useEffect(() => {
    const fetchGoalData = async () => {
      if (!goalId) {
        console.error('No goal ID found in params:', params);
        Alert.alert("Error", "No goal ID provided");
        router.back();
        return;
      }

      try {
        setIsLoading(true);
        console.log('Fetching family goal with ID:', goalId);
        
        // Get all goals
        const goals = await goalService.getGoals();
        console.log(`Fetched ${goals.length} goals`);
        
        // Find the family goal that matches the ID
        const familyGoal = goals.find(g => g.id.toString() === goalId.toString());
        
        if (!familyGoal) {
          console.error('Family goal not found with ID:', goalId);
          Alert.alert("Error", "Family goal not found");
          router.back();
          return;
        }
        
        console.log('Found family goal:', familyGoal);
        setGoal(familyGoal);

        setForm({
          name: familyGoal.name,
          amount: familyGoal.amount.toString(),
          goalType: familyGoal.goal_type || 'saving'
        });
      } catch (error) {
        console.error('Error fetching family goal:', error);
        Alert.alert("Error", "Failed to load family goal data");
      } finally {
        setIsLoading(false);
      }
    };

    fetchGoalData();
  }, [goalId]);

  const handleSubmit = async () => {
    // Validate form
    if (!form.name.trim()) {
      Alert.alert("Error", "Please enter a goal name");
      return;
    }

    const amount = parseFloat(form.amount);
    if (isNaN(amount) || amount <= 0) {
      Alert.alert("Error", "Please enter a valid amount greater than 0");
      return;
    }

    try {
      setSubmitting(true);
      
      console.log(`Attempting to update family goal ID: ${goalId}`);
      console.log('Update data:', {
        name: form.name,
        amount,
        goal_type: form.goalType,
        is_personal: false
      });
      
      // Use the goal service to update the goal
      await goalService.updateGoal(goalId, {
        name: form.name,
        amount: amount,
        goal_type: form.goalType,
        is_personal: false // Ensure this remains a family goal
      });
      
      Alert.alert(
        "Success", 
        "Family goal updated successfully",
        [{ text: "OK", onPress: () => router.push("/family-goals") }]
      );
    } catch (error) {
      console.error('Error updating family goal:', error);
      Alert.alert(
        "Error", 
        `Failed to update family goal: ${error.message || "Unknown error"}`,
        [
          { text: "Try Again" },
          { text: "Go Back", onPress: () => router.push("/family-goals") }
        ]
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (isLoading) {
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
          <Text style={styles.headerTitle}>Edit Family Goal</Text>
          <View style={{ width: 24 }} />
        </View>
        
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary.main} />
          <Text style={styles.loadingText}>Loading goal data...</Text>
        </View>
      </SafeAreaView>
    );
  }

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
        <Text style={styles.headerTitle}>Edit Family Goal</Text>
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
                handleChangeText={(text) => setForm({...form, name: text})}
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
                handleChangeText={(text) => setForm({...form, amount: text})}
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
      </ScrollView>
      
      {/* Action Buttons */}
      <View style={styles.buttonContainer}>
        <TouchableOpacity 
          style={styles.cancelButton}
          onPress={() => router.push("/family-goals")}
        >
          <Text style={styles.cancelButtonText}>Cancel</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[
            styles.saveButton,
            submitting && styles.disabledButton
          ]}
          onPress={handleSubmit}
          disabled={submitting}
        >
          {submitting ? (
            <Text style={styles.saveButtonText}>Saving...</Text>
          ) : (
            <Text style={styles.saveButtonText}>Save Changes</Text>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  )
}

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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: COLORS.neutral[600],
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

export default EditFamilyGoal