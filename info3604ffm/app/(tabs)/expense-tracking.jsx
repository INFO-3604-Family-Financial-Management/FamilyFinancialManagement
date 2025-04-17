import React, { useState, useEffect, useCallback } from "react";
import { 
  View, 
  Text, 
  ScrollView, 
  Keyboard,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
  TextInput,
  StyleSheet,
  ActivityIndicator
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { 
  expenseService, 
  budgetService, 
  goalService, 
  contributionService 
} from "@/services/api";
import { COLORS, SHADOWS, BORDER_RADIUS, SPACING } from '@/constants/theme';
import Button from '@/components/Button';

// Dropdown component with consistent style
const Dropdown = ({ label, placeholder, value, items, onSelect, icon }) => {
  const [isOpen, setIsOpen] = useState(false);
  
  return (
    <View style={styles.inputContainer}>
      <Text style={styles.inputLabel}>{label}</Text>
      
      <TouchableOpacity 
        style={styles.dropdown}
        onPress={() => {
          Keyboard.dismiss();
          setIsOpen(!isOpen);
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          {icon && (
            <Ionicons name={icon} size={20} color={COLORS.neutral[400]} style={{ marginRight: 8 }} />
          )}
          <Text style={[
            styles.dropdownText, 
            !value && { color: COLORS.neutral[400] }
          ]}>
            {value || placeholder}
          </Text>
        </View>
        <Ionicons 
          name={isOpen ? "chevron-up" : "chevron-down"} 
          size={20} 
          color={COLORS.neutral[400]} 
        />
      </TouchableOpacity>
      
      {isOpen && (
        <View style={styles.dropdownMenu}>
          <ScrollView nestedScrollEnabled={true} style={{ maxHeight: 200 }}>
            {items.map((item, index) => (
              <TouchableOpacity 
                key={item.key || index}
                style={styles.dropdownItem}
                onPress={() => {
                  onSelect(item.key);
                  setIsOpen(false);
                }}
              >
                <Text style={[
                  styles.dropdownItemText,
                  value === item.key && { color: COLORS.primary.main, fontWeight: '600' }
                ]}>
                  {item.value}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}
    </View>
  );
};

// Main component
const ExpenseTracking = () => {
  // State management
  const [isContribution, setIsContribution] = useState(false);
  const [form, setForm] = useState({
    title: "",
    amount: "",
    category: null,
    budget: null,
    goal: null
  });
  const [categories, setCategories] = useState([]);
  const [budgets, setBudgets] = useState([]);
  const [spendingGoals, setSpendingGoals] = useState([]);
  const [savingGoals, setSavingGoals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState({});

  // Fetch data from API
  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch both personal and family budgets
      const personalBudgets = await budgetService.getBudgets();
      let familyBudgets = [];
      
      try {
        // Try to fetch family budgets
        familyBudgets = await budgetService.getFamilyBudgets();
      } catch (error) {
        console.log('No family budgets available');
      }
      
      // Format budgets for dropdown
      const formattedBudgets = [
        ...personalBudgets.map(budget => ({
          key: budget.id,
          value: `${budget.category}: ${budget.name} ($${budget.amount})`,
          isFamily: false
        })),
        ...familyBudgets.map(budget => ({
          key: budget.id,
          value: `👨‍👩‍👦 Family - ${budget.category}: ${budget.name} ($${budget.amount})`,
          isFamily: true
        }))
      ];
      
      setBudgets(formattedBudgets);

      // Extract unique categories from budgets
      const uniqueCategories = [...new Set([
        ...personalBudgets.map(budget => budget.category),
        ...familyBudgets.map(budget => budget.category)
      ])];
      
      const formattedCategories = uniqueCategories.map(category => ({
        key: category,
        value: category
      }));
      
      setCategories(formattedCategories);

      // Fetch goals and separate by type
      const goalsData = await goalService.getGoals();
      
      // Filter and format spending goals
      const spending = goalsData.filter(goal => goal.goal_type === 'spending');
      const formattedSpendingGoals = spending.map(goal => ({
        key: goal.id,
        value: `${goal.is_personal ? '' : '👨‍👩‍👦 Family - '}${goal.name} ($${goal.amount})`,
        isFamily: !goal.is_personal
      }));
      setSpendingGoals(formattedSpendingGoals);
      
      // Filter and format saving goals
      const saving = goalsData.filter(goal => goal.goal_type === 'saving');
      const formattedSavingGoals = saving.map(goal => ({
        key: goal.id,
        value: `${goal.is_personal ? '' : '👨‍👩‍👦 Family - '}${goal.name} ($${goal.amount})`,
        isFamily: !goal.is_personal
      }));
      setSavingGoals(formattedSavingGoals);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Initial data fetch
  useEffect(() => {
    fetchData();
  }, []);

  // Refresh when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      console.log('Expense tracking screen in focus - refreshing data');
      fetchData();
      return () => {
        // Optional cleanup
      };
    }, [])
  );

  // Form validation
  const validateForm = () => {
    const newErrors = {};
    
    if (!isContribution && !form.title.trim()) {
      newErrors.title = 'Description is required';
    }
    
    if (!form.amount.trim()) {
      newErrors.amount = 'Amount is required';
    } else if (isNaN(parseFloat(form.amount)) || parseFloat(form.amount) <= 0) {
      newErrors.amount = 'Please enter a valid amount greater than 0';
    }
    
    if (isContribution && !form.goal) {
      newErrors.goal = 'Please select a savings goal';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Form submission
  const handleSubmit = async () => {
    if (!validateForm()) return;
    
    try {
      setSubmitting(true);
      
      const amount = parseFloat(form.amount);
      
      if (isContribution) {
        // Process as a contribution to a savings goal
        const contributionData = {
          amount: amount,
          goal: form.goal
        };

        await contributionService.createContribution(contributionData);
        
        router.push({
          pathname: '/goals',
          params: { success: true, type: 'contribution' }
        });
      } else {
        // Process as an expense
        const expenseData = {
          description: form.title,
          amount: amount,
          budget: form.budget,
          goal: form.goal
        };

        await expenseService.addExpense(expenseData);
        
        router.push({
          pathname: '/home',
          params: { success: true, type: 'expense' }
        });
      }

      // Reset form
      setForm({
        title: "",
        amount: "",
        category: null,
        budget: null,
        goal: null
      });
      
    } catch (error) {
      console.error('Transaction error:', error);
      alert(error.message || 'Failed to process transaction');
    } finally {
      setSubmitting(false);
    }
  };

  // Cancel and go back
  const handleCancel = () => {
    router.back();
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor={COLORS.primary.main} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary.main} />
          <Text style={styles.loadingText}>Loading...</Text>
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
          onPress={handleCancel}
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={24} color={COLORS.white} />
        </TouchableOpacity>
        
        <Text style={styles.headerTitle}>
          {isContribution ? 'Add Contribution' : 'Add Expense'}
        </Text>
        
        <View style={{ width: 40 }} />
      </View>
      
      {/* Transaction Type Switcher */}
      <View style={styles.typeSwitcherContainer}>
        <View style={styles.typeSwitcher}>
          <TouchableOpacity 
            style={[
              styles.typeOption,
              !isContribution && styles.activeTypeOption
            ]}
            onPress={() => setIsContribution(false)}
          >
            <Ionicons 
              name="cart-outline" 
              size={18} 
              color={!isContribution ? COLORS.white : COLORS.neutral[500]} 
            />
            <Text style={[
              styles.typeOptionText,
              !isContribution && styles.activeTypeOptionText
            ]}>
              Expense
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[
              styles.typeOption,
              isContribution && styles.activeTypeOption
            ]}
            onPress={() => setIsContribution(true)}
          >
            <Ionicons 
              name="save-outline" 
              size={18} 
              color={isContribution ? COLORS.white : COLORS.neutral[500]} 
            />
            <Text style={[
              styles.typeOptionText,
              isContribution && styles.activeTypeOptionText
            ]}>
              Contribution
            </Text>
          </TouchableOpacity>
        </View>
      </View>
      
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.formContainer}
      >
        <ScrollView 
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          {/* Form Card */}
          <View style={styles.formCard}>
            {/* Description/Title Field - only for expenses */}
            {!isContribution && (
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Description</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="What did you spend on?"
                  placeholderTextColor={COLORS.neutral[400]}
                  value={form.title}
                  onChangeText={(text) => {
                    setForm({ ...form, title: text });
                    if (errors.title) {
                      setErrors({ ...errors, title: null });
                    }
                  }}
                />
                {errors.title && (
                  <Text style={styles.errorText}>{errors.title}</Text>
                )}
              </View>
            )}
            
            {/* Amount Field */}
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>
                {isContribution ? 'Contribution Amount' : 'Expense Amount'}
              </Text>
              <View style={styles.amountInputContainer}>
                <Text style={styles.currencySymbol}>$</Text>
                <TextInput
                  style={styles.amountInput}
                  placeholder="0.00"
                  placeholderTextColor={COLORS.neutral[400]}
                  keyboardType="decimal-pad"
                  value={form.amount}
                  onChangeText={(text) => {
                    // Only allow numbers and a single decimal point
                    if (/^\d*\.?\d*$/.test(text) || text === '') {
                      setForm({ ...form, amount: text });
                      if (errors.amount) {
                        setErrors({ ...errors, amount: null });
                      }
                    }
                  }}
                />
              </View>
              {errors.amount && (
                <Text style={styles.errorText}>{errors.amount}</Text>
              )}
            </View>
            
            {/* For Expenses: Category and Budget */}
            {!isContribution && (
              <>
                {/* Category Dropdown */}
                <Dropdown
                  label="Category"
                  placeholder="Select a category"
                  value={form.category ? categories.find(c => c.key === form.category)?.value : null}
                  items={categories}
                  onSelect={(value) => setForm({ ...form, category: value })}
                  icon="list-outline"
                />
                
                {/* Budget Dropdown */}
                <Dropdown
                  label="Budget (Optional)"
                  placeholder="Select a budget"
                  value={form.budget ? budgets.find(b => b.key === form.budget)?.value : null}
                  items={budgets}
                  onSelect={(value) => setForm({ ...form, budget: value })}
                  icon="wallet-outline"
                />
                
                {/* Goal for Expenses */}
                <Dropdown
                  label="Spending Goal (Optional)"
                  placeholder="Select a goal"
                  value={form.goal ? spendingGoals.find(g => g.key === form.goal)?.value : null}
                  items={spendingGoals}
                  onSelect={(value) => setForm({ ...form, goal: value })}
                  icon="flag-outline"
                />
              </>
            )}
            
            {/* For Contributions: Saving Goal */}
            {isContribution && (
              <View>
                <Dropdown
                  label="Savings Goal"
                  placeholder="Select a savings goal"
                  value={form.goal ? savingGoals.find(g => g.key === form.goal)?.value : null}
                  items={savingGoals}
                  onSelect={(value) => {
                    setForm({ ...form, goal: value });
                    if (errors.goal) {
                      setErrors({ ...errors, goal: null });
                    }
                  }}
                  icon="flag-outline"
                />
                {errors.goal && (
                  <Text style={styles.errorText}>{errors.goal}</Text>
                )}
                
                {savingGoals.length === 0 && (
                  <View style={styles.noGoalsMessage}>
                    <Ionicons name="alert-circle-outline" size={20} color={COLORS.secondary.main} />
                    <Text style={styles.noGoalsText}>
                      You don't have any savings goals yet. Create a savings goal first.
                    </Text>
                  </View>
                )}
              </View>
            )}
            
            {/* Information card for contributions */}
            {isContribution && (
              <View style={styles.infoCard}>
                <View style={styles.infoHeader}>
                  <Ionicons name="information-circle" size={20} color={COLORS.primary.main} />
                  <Text style={styles.infoTitle}>About Contributions</Text>
                </View>
                <Text style={styles.infoText}>
                  Contributions are amounts you're setting aside toward your savings goals. 
                  They help you track progress toward financial targets.
                </Text>
              </View>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
      
      {/* Action Buttons */}
      <View style={styles.actionContainer}>
        <Button
          title="Cancel"
          variant="outline"
          onPress={handleCancel}
          style={styles.cancelButton}
        />
        <Button
          title={isContribution ? "Save Contribution" : "Save Expense"}
          variant="primary"
          onPress={handleSubmit}
          isLoading={submitting}
          style={styles.saveButton}
        />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background.primary,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    color: COLORS.neutral[600],
  },
  header: {
    backgroundColor: COLORS.primary.main,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.white,
  },
  typeSwitcherContainer: {
    alignItems: 'center',
    marginTop: 16,
    marginBottom: 8,
  },
  typeSwitcher: {
    flexDirection: 'row',
    backgroundColor: COLORS.neutral[200],
    borderRadius: 20,
    padding: 4,
    width: '80%',
  },
  typeOption: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 8,
    borderRadius: 16,
  },
  activeTypeOption: {
    backgroundColor: COLORS.primary.main,
  },
  typeOptionText: {
    marginLeft: 4,
    fontWeight: '500',
    color: COLORS.neutral[500],
  },
  activeTypeOptionText: {
    color: COLORS.white,
  },
  formContainer: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  formCard: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 16,
    ...SHADOWS.medium,
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
  textInput: {
    backgroundColor: COLORS.background.secondary,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: COLORS.neutral[800],
  },
  amountInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.background.secondary,
    borderRadius: 8,
    paddingHorizontal: 16,
  },
  currencySymbol: {
    fontSize: 18,
    fontWeight: '500',
    color: COLORS.neutral[700],
    marginRight: 4,
  },
  amountInput: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 18,
    fontWeight: '500',
    color: COLORS.neutral[800],
  },
  dropdown: {
    backgroundColor: COLORS.background.secondary,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dropdownText: {
    fontSize: 16,
    color: COLORS.neutral[800],
  },
  dropdownMenu: {
    marginTop: 4,
    backgroundColor: COLORS.white,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.neutral[200],
    ...SHADOWS.medium,
    maxHeight: 200,
    zIndex: 1000,
  },
  dropdownItem: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.neutral[200],
  },
  dropdownItemText: {
    fontSize: 14,
    color: COLORS.neutral[800],
  },
  errorText: {
    color: COLORS.error.main,
    fontSize: 12,
    marginTop: 4,
    marginLeft: 8,
  },
  noGoalsMessage: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.secondary.light + '30',
    padding: 12,
    borderRadius: 8,
    marginTop: 12,
  },
  noGoalsText: {
    flex: 1,
    marginLeft: 8,
    fontSize: 14,
    color: COLORS.secondary.dark,
  },
  infoCard: {
    backgroundColor: COLORS.primary.light + '30',
    padding: 12,
    borderRadius: 8,
    marginTop: 16,
  },
  infoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  infoTitle: {
    marginLeft: 8,
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.primary.main,
  },
  infoText: {
    fontSize: 14,
    color: COLORS.neutral[700],
    lineHeight: 20,
  },
  actionContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 24,
    backgroundColor: COLORS.white,
    borderTopWidth: 1,
    borderTopColor: COLORS.neutral[200],
  },
  cancelButton: {
    flex: 1,
    marginRight: 8,
  },
  saveButton: {
    flex: 2,
    marginLeft: 8,
  },
});

export default ExpenseTracking;