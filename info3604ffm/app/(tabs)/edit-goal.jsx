import { View, Text, SafeAreaView, Alert, ActivityIndicator, TouchableOpacity, StyleSheet, StatusBar, ScrollView } from 'react-native'
import React, { useState, useEffect } from 'react'
import { router, useLocalSearchParams } from 'expo-router'
import FormField from '@/components/FormField'
import CustomButton from '@/components/CustomButton'
import { goalService } from '@/services/api'
import Checkbox from 'expo-checkbox'
import { Ionicons } from '@expo/vector-icons'
import { COLORS, SHADOWS, BORDER_RADIUS } from '../../constants/theme'

const EditGoal = () => {
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
        console.log('Fetching goal with ID:', goalId);
        
        // Get the complete list of goals
        const goals = await goalService.getGoals();
        console.log(`Fetched ${goals.length} goals`);
        
        // Find the goal that matches our ID
        const targetGoal = goals.find(g => g.id.toString() === goalId.toString());
        
        if (!targetGoal) {
          console.error('Goal not found with ID:', goalId);
          Alert.alert("Error", "Goal not found");
          router.back();
          return;
        }
        
        console.log('Found goal:', targetGoal);
        setGoal(targetGoal);

        // Initialize the form with the goal data
        setForm({
          name: targetGoal.name,
          amount: targetGoal.amount.toString(),
          goalType: targetGoal.goal_type || 'saving',
        });
      } catch (error) {
        console.error('Error fetching goal:', error);
        Alert.alert("Error", "Failed to load goal data");
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
      
      // Create update payload
      const updateData = {
        name: form.name,
        amount: amount,
        goal_type: form.goalType
      };
      
      console.log(`Updating goal ID ${goalId} with:`, updateData);
      
      // Use the goalService to update the goal
      await goalService.updateGoal(goalId, updateData);
      
      Alert.alert(
        "Success", 
        "Goal updated successfully",
        [{ text: "OK", onPress: () => router.push("/goals") }]
      );
    } catch (error) {
      console.error('Error updating goal:', error);
      Alert.alert("Error", "Failed to update goal. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor={COLORS.primary.main} />
        
        <View style={styles.header}>
          <TouchableOpacity 
            onPress={() => router.back()}
            style={styles.backButton}
          >
            <Ionicons name="arrow-back" size={24} color={COLORS.white} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Edit Goal</Text>
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
        <Text style={styles.headerTitle}>Edit Goal</Text>
        <View style={{ width: 24 }} />
      </View>
      
      <ScrollView 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Goal Form Card */}
        <View style={styles.formCard}>
          <View style={styles.goalTypeHeader}>
            <Ionicons name={form.goalType === 'saving' ? 'wallet-outline' : 'cart-outline'} 
                      size={24} 
                      color={form.goalType === 'saving' ? COLORS.success.main : COLORS.primary.main} />
            <Text style={styles.goalTypeTitle}>
              {form.goalType === 'saving' ? 'Saving' : 'Spending'} Goal
            </Text>
          </View>
          
          {/* Name Input */}
          <View style={styles.inputContainer}>
            <Text style={styles.fieldLabel}>Goal Name</Text>
            <View style={styles.inputWrapper}>
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
            <Text style={styles.fieldLabel}>Goal Amount</Text>
            <View style={styles.inputWrapper}>
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
            <Text style={styles.fieldLabel}>Goal Type</Text>
            <View style={styles.checkboxContainer}>
              <View style={[
                styles.checkboxOption,
                form.goalType === 'saving' && styles.selectedCheckboxOption
              ]}>
                <Checkbox 
                  value={form.goalType === 'saving'} 
                  onValueChange={() => setForm({...form, goalType: 'saving'})}
                  color={form.goalType === 'saving' ? COLORS.primary.main : undefined}
                  style={styles.checkbox}
                />
                <View style={styles.checkboxLabelContainer}>
                  <Text style={styles.checkboxLabel}>Saving</Text>
                  <Text style={styles.checkboxDescription}>Track money you're saving</Text>
                </View>
              </View>
              
              <View style={[
                styles.checkboxOption,
                form.goalType === 'spending' && styles.selectedCheckboxOption
              ]}>
                <Checkbox 
                  value={form.goalType === 'spending'} 
                  onValueChange={() => setForm({...form, goalType: 'spending'})}
                  color={form.goalType === 'spending' ? COLORS.primary.main : undefined}
                  style={styles.checkbox}
                />
                <View style={styles.checkboxLabelContainer}>
                  <Text style={styles.checkboxLabel}>Spending</Text>
                  <Text style={styles.checkboxDescription}>Track money you'll spend</Text>
                </View>
              </View>
            </View>
          </View>
          
          {/* Buttons */}
          <View style={styles.buttonContainer}>
            <CustomButton
              title={submitting ? "Saving..." : "Save"}
              handlePress={handleSubmit}
              containerStyles="mx-8 mt-10 w-half"
              isLoading={submitting}
            />
            
            <CustomButton
              title="Cancel"
              handlePress={() => router.back()}
              containerStyles="mx-8 mt-5 w-half"
            />
          </View>
        </View>
      </ScrollView>
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
  },
  formCard: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    ...SHADOWS.medium,
  },
  goalTypeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.neutral[200],
  },
  goalTypeTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: COLORS.primary.main,
    marginLeft: 10,
    textAlign: 'center',
  },
  inputContainer: {
    marginBottom: 24,
  },
  fieldLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.primary.dark,
    marginBottom: 8,
    paddingLeft: 4,
  },
  inputWrapper: {
    backgroundColor: COLORS.background.secondary,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.neutral[300],
    overflow: 'hidden',
    ...SHADOWS.tiny,
  },
  checkboxContainer: {
    backgroundColor: COLORS.background.secondary,
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: COLORS.neutral[300],
  },
  checkboxOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    marginBottom: 12,
    backgroundColor: COLORS.white,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.neutral[200],
    ...SHADOWS.tiny,
  },
  selectedCheckboxOption: {
    backgroundColor: COLORS.primary.light + '15',
    borderColor: COLORS.primary.main,
  },
  checkbox: {
    marginRight: 8,
    height: 22,
    width: 22,
    borderRadius: 4,
  },
  checkboxLabelContainer: {
    flex: 1,
  },
  checkboxLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.neutral[800],
  },
  checkboxDescription: {
    fontSize: 12,
    color: COLORS.neutral[600],
    marginTop: 2,
  },
  buttonContainer: {
    marginTop: 16,
  },
});

export default EditGoal