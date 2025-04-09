import React, { useState, useEffect } from "react";
import { 
  View, 
  Text, 
  ScrollView, 
  Alert, 
  ActivityIndicator, 
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { SelectList } from "react-native-dropdown-select-list";
import FormField from "@/components/FormField";
import CustomButton from "@/components/CustomButton";
import { expenseService, budgetService, goalService, contributionService } from "@/services/api";
import { router } from "expo-router";
import { Ionicons } from '@expo/vector-icons';

const ExpenseTracking = () => {
  // State to toggle between expense and contribution
  const [isContribution, setIsContribution] = useState(false);
  
  // Form state
  const [form, setForm] = useState({
    title: "",
    value: "",
    category: null,
    description: "",
    budget: null,
    goal: null
  });

  // Data states
  const [categories, setCategories] = useState([]);
  const [budgets, setBudgets] = useState([]);
  const [spendingGoals, setSpendingGoals] = useState([]);
  const [savingGoals, setSavingGoals] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch budgets and goals when component mounts
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // Fetch budgets
        const budgetsData = await budgetService.getBudgets();
        const formattedBudgets = budgetsData.map(budget => ({
          key: budget.id,
          value: `${budget.category}: ${budget.name} ($${budget.amount})`
        }));
        setBudgets(formattedBudgets);

        // Extract unique categories from budgets
        const uniqueCategories = [...new Set(budgetsData.map(budget => budget.category))];
        const formattedCategories = uniqueCategories.map(category => ({
          key: category,
          value: category
        }));
        setCategories(formattedCategories);

        // Fetch goals and separate by type
        const goalsData = await goalService.getGoals();
        
        // Filter for spending goals
        const spending = goalsData.filter(goal => goal.goal_type === 'spending');
        const formattedSpendingGoals = spending.map(goal => ({
          key: goal.id,
          value: `${goal.name} ($${goal.amount})`
        }));
        setSpendingGoals(formattedSpendingGoals);
        
        // Filter for saving goals
        const saving = goalsData.filter(goal => goal.goal_type === 'saving');
        const formattedSavingGoals = saving.map(goal => ({
          key: goal.id,
          value: `${goal.name} ($${goal.amount})`
        }));
        setSavingGoals(formattedSavingGoals);
      } catch (error) {
        console.error('Error fetching data:', error);
        Alert.alert('Error', 'Failed to load budgets and goals. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Handler for form submission
  const submit = async () => {
    try {
      // Validate form
      if (!form.title.trim() && !isContribution) {
        Alert.alert('Error', 'Please enter a title');
        return;
      }

      const amount = parseFloat(form.value);
      if (isNaN(amount) || amount <= 0) {
        Alert.alert('Error', 'Please enter a valid amount greater than 0');
        return;
      }

      if (isContribution && !form.goal) {
        Alert.alert('Error', 'Please select a savings goal for your contribution');
        return;
      }

      if (isContribution) {
        // Submit as a contribution to a savings goal
        const contributionData = {
          amount: amount,
          goal: form.goal
        };

        await contributionService.createContribution(contributionData);
        
        Alert.alert(
          'Success',
          'Contribution added successfully',
          [{ text: 'OK', onPress: () => router.push('/goals') }]
        );
      } else {
        // Submit as an expense
        const expenseData = {
          description: form.title,
          amount: amount,
          budget: form.budget,
          goal: form.goal // This would be a spending goal
        };

        await expenseService.addExpense(expenseData);
        
        Alert.alert(
          'Success',
          'Expense added successfully',
          [{ text: 'OK', onPress: () => router.push('/home') }]
        );
      }

      // Clear form after successful submission
      setForm({
        title: "",
        value: "",
        category: null,
        description: "",
        budget: null,
        goal: null
      });
      
    } catch (error) {
      console.error('Add transaction error:', error);
      Alert.alert('Error', error.message || 'Failed to add transaction');
    }
  };

  // If still loading, show spinner
  if (loading) {
    return (
      <SafeAreaView className="bg-gray-500 h-full flex-1">
        <StatusBar barStyle="light-content" />
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color="#FFF" />
          <Text className="text-white mt-4 font-medium">Loading data...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="bg-gray-500 flex-1">
      <StatusBar barStyle="light-content" />
      
      {/* Header with back button */}
      <View className="flex-row items-center justify-between px-4 pt-2 pb-4">
        <TouchableOpacity 
          onPress={() => router.back()}
          className="bg-gray-700 rounded-full p-2"
        >
          <Ionicons name="arrow-back" size={24} color="white" />
        </TouchableOpacity>
        <Text className="text-white text-xl font-bold">
          {isContribution ? 'New Contribution' : 'New Expense'}
        </Text>
        <View style={{ width: 32 }} /> {/* Empty view for even spacing */}
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
      >
        <ScrollView 
          className="flex-1 px-4"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 40 }}
        >
          {/* Transaction Type Toggle */}
          <View className="flex-row justify-center mb-8 mt-2">
            <View className="bg-gray-700 p-1 rounded-full flex-row shadow-md">
              <TouchableOpacity 
                className={`py-2 px-5 rounded-full ${!isContribution ? 'bg-indigo-500' : 'bg-transparent'}`}
                onPress={() => setIsContribution(false)}
              >
                <Text className={`font-medium ${!isContribution ? 'text-white' : 'text-gray-300'}`}>
                  Expense
                </Text>
              </TouchableOpacity>
              <TouchableOpacity 
                className={`py-2 px-5 rounded-full ${isContribution ? 'bg-indigo-500' : 'bg-transparent'}`}
                onPress={() => setIsContribution(true)}
              >
                <Text className={`font-medium ${isContribution ? 'text-white' : 'text-gray-300'}`}>
                  Contribution
                </Text>
              </TouchableOpacity>
            </View>
          </View>
          
          {/* Card Container */}
          <View className="bg-gray-700 rounded-2xl p-5 shadow-lg mb-6">
            {/* Title/Description Field - only for expenses */}
            {!isContribution && (
              <FormField
                title="What did you spend on?"
                value={form.title}
                placeholder="Enter expense name"
                handleChangeText={(text) => setForm({ ...form, title: text })}
                otherStyles="mb-4"
              />
            )}
            
            {/* Amount Field */}
            <FormField
              title={isContribution ? "How much are you contributing?" : "How much did you spend?"}
              value={form.value}
              placeholder="Enter amount"
              handleChangeText={(text) => setForm({ ...form, value: text })}
              keyboardType="numeric"
              otherStyles="mb-4"
            />
            
            {/* For Expenses: Category, Budget, and Spending Goal */}
            {!isContribution && (
              <>
                {/* Category Selection */}
                <View className="mb-4">
                  <Text className="text-base text-gray-100 mb-2 font-medium">Category</Text>
                  <SelectList
                    setSelected={(value) => setForm({ ...form, category: value })}
                    data={categories}
                    save="key"
                    placeholder="Select a category"
                    boxStyles={{ backgroundColor: 'white', borderRadius: 10, borderWidth: 0 }}
                    dropdownStyles={{ backgroundColor: 'white', borderRadius: 10, borderWidth: 0, marginTop: 4 }}
                    dropdownTextStyles={{ color: '#333' }}
                    inputStyles={{ color: '#333' }}
                    searchPlaceholder="Search categories..."
                  />
                </View>
                
                {/* Budget Selection */}
                <View className="mb-4">
                  <Text className="text-base text-gray-100 mb-2 font-medium">Budget (Optional)</Text>
                  <SelectList
                    setSelected={(value) => setForm({ ...form, budget: value })}
                    data={budgets}
                    save="key"
                    placeholder="Select a budget"
                    boxStyles={{ backgroundColor: 'white', borderRadius: 10, borderWidth: 0 }}
                    dropdownStyles={{ backgroundColor: 'white', borderRadius: 10, borderWidth: 0, marginTop: 4 }}
                    dropdownTextStyles={{ color: '#333' }}
                    inputStyles={{ color: '#333' }}
                    searchPlaceholder="Search budgets..."
                  />
                </View>
                
                {/* Spending Goal Selection */}
                <View className="mb-4">
                  <Text className="text-base text-gray-100 mb-2 font-medium">Spending Goal (Optional)</Text>
                  <SelectList
                    setSelected={(value) => setForm({ ...form, goal: value })}
                    data={spendingGoals}
                    save="key"
                    placeholder="Select a goal"
                    boxStyles={{ backgroundColor: 'white', borderRadius: 10, borderWidth: 0 }}
                    dropdownStyles={{ backgroundColor: 'white', borderRadius: 10, borderWidth: 0, marginTop: 4 }}
                    dropdownTextStyles={{ color: '#333' }}
                    inputStyles={{ color: '#333' }}
                    searchPlaceholder="Search spending goals..."
                  />
                </View>
              </>
            )}
            
            {/* For Contributions: Saving Goal Selection */}
            {isContribution && (
              <View className="mb-4">
                <Text className="text-base text-gray-100 mb-2 font-medium">Select Savings Goal</Text>
                <SelectList
                  setSelected={(value) => setForm({ ...form, goal: value })}
                  data={savingGoals}
                  save="key"
                  placeholder="Select a savings goal"
                  boxStyles={{ backgroundColor: 'white', borderRadius: 10, borderWidth: 0 }}
                  dropdownStyles={{ backgroundColor: 'white', borderRadius: 10, borderWidth: 0, marginTop: 4 }}
                  dropdownTextStyles={{ color: '#333' }}
                  inputStyles={{ color: '#333' }}
                  searchPlaceholder="Search savings goals..."
                />
                
                {savingGoals.length === 0 && (
                  <View className="mt-2 p-3 bg-yellow-800 rounded-lg">
                    <Text className="text-yellow-200 font-medium">
                      You don't have any savings goals yet. Create a savings goal first.
                    </Text>
                  </View>
                )}
                
                <View className="mt-4 p-4 bg-indigo-900 bg-opacity-50 rounded-lg">
                  <View className="flex-row items-center mb-2">
                    <Ionicons name="information-circle" size={20} color="#60A5FA" />
                    <Text className="text-white font-medium ml-2">About Contributions</Text>
                  </View>
                  <Text className="text-gray-300">
                    Contributions are amounts you're setting aside toward your savings goals. 
                    They help you track progress toward financial targets.
                  </Text>
                </View>
              </View>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Fixed Submit Button at bottom */}
      <View className="px-4 pb-6 pt-2 bg-gray-500 shadow-lg">
        <CustomButton
          title={isContribution ? "Save Contribution" : "Save Expense"}
          handlePress={submit}
          containerStyles={`${isContribution ? 'bg-indigo-500' : 'bg-indigo-200'}`}
          textStyles={isContribution ? 'text-white' : 'text-black'}
        />
      </View>
    </SafeAreaView>
  );
};

export default ExpenseTracking;