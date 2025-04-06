import { View, Text, SafeAreaView, TouchableOpacity, ActivityIndicator, FlatList } from 'react-native'
import React, { useState, useEffect } from 'react'
import { router } from 'expo-router'
import CustomButton from '../../components/CustomButton'
import { budgetService, familyService } from '../../services/api'

const FamilyBudget = () => {
  const [currentMonth, setCurrentMonth] = useState('');
  const [budgets, setBudgets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [totals, setTotals] = useState({
    spent: 0,
    remaining: 0
  });
  
  useEffect(() => {
    // Get current month name
    const monthNames = [
      "January", "February", "March", "April", "May", "June",
      "July", "August", "September", "October", "November", "December"
    ];
    const now = new Date();
    setCurrentMonth(monthNames[now.getMonth()]);
    
    // Fetch family budget data
    const fetchBudgets = async () => {
      try {
        setLoading(true);
        
        // Get all budgets directly instead of using monthly status
        const budgetData = await budgetService.getBudgets();
        console.log('Budget data:', budgetData);
        
        if (!budgetData || !Array.isArray(budgetData)) {
          throw new Error('Invalid budget data received');
        }
        
        // Transform data into the expected format
        const budgetCategories = budgetData.map(budget => ({
          id: budget.id,
          category: budget.category,
          amount: budget.amount,
          spent: budget.used_amount || 0,
          remaining: budget.remaining_amount || (budget.amount - (budget.used_amount || 0))
        }));
        
        // Sort budget categories for consistent display
        const sortedBudgets = budgetCategories.sort((a, b) => 
          a.category.localeCompare(b.category)
        );
        
        setBudgets(sortedBudgets);
        
        // Calculate totals
        const totalSpent = sortedBudgets.reduce((sum, budget) => sum + Number(budget.spent), 0);
        const totalRemaining = sortedBudgets.reduce((sum, budget) => sum + Number(budget.remaining), 0);
        
        setTotals({
          spent: totalSpent,
          remaining: totalRemaining
        });
        
        setError(null);
      } catch (err) {
        console.error('Failed to fetch family budgets:', err);
        setError('Failed to load budget data. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchBudgets();
  }, []);

  // Format currency values
  const formatCurrency = (amount) => {
    return `$${parseFloat(amount).toFixed(2)}`;
  };

  // Render item for each budget category
  const renderBudgetItem = ({ item, index }) => (
    <TouchableOpacity 
      key={index}
      className={`flex-row items-center justify-between w-full p-4 border border-gray-300 rounded-lg ${
        index < budgets.length - 1 ? 'mb-4' : ''
      }`}
    >
      <Text className="text-lg font-medium">{item.category}</Text>
      <Text className="text-lg text-right font-medium">
        {formatCurrency(item.spent)} / {formatCurrency(item.amount)}
      </Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView className="bg-gray-500 h-full">
      <View className="mt-10 items-center">
        <Text className="text-black font-bold text-3xl">Family Budget</Text>
      </View>
      <View className='bg-white p-4 rounded-lg shadow-md m-4 mt-10 h-[55vh]'>
        <Text className="text-2xl font-bold text-gray-900 text-center">
          {currentMonth}
        </Text>
        <View className="flex-1 bg-white">
          {loading ? (
            <View className="flex-1 justify-center items-center">
              <ActivityIndicator size="large" color="#0000ff" />
            </View>
          ) : error ? (
            <Text className="text-red-500 text-center">{error}</Text>
          ) : budgets.length === 0 ? (
            <Text className="text-gray-500 text-center">No budget categories found. Add a new category to get started.</Text>
          ) : (
            <>
              <FlatList
                data={budgets}
                renderItem={renderBudgetItem}
                keyExtractor={(item) => item.id.toString()}
                className="w-full mb-4"
                contentContainerStyle={{ paddingVertical: 8 }}
                showsVerticalScrollIndicator={true}
              />
              
              <View className="mt-2">
                <Text className="text-lg font-medium">
                  Total Spent: {formatCurrency(totals.spent)}
                </Text>
                <Text className="text-lg font-medium">
                  Total Remaining: {formatCurrency(totals.remaining)}
                </Text>
              </View>
            </>
          )}
        </View>   
      </View>
      <CustomButton
        title="Add Category"
        handlePress={() => router.push("/create-budget")}
        containerStyles="mx-8 mt-2"
      />
      <CustomButton
        title="Add Money"
        handlePress={() => router.push("/create-budget")}
        containerStyles="mx-8 mt-2"
      />
    </SafeAreaView>
  )
}

export default FamilyBudget