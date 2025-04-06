import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, SafeAreaView, RefreshControl, ActivityIndicator, Alert } from 'react-native';
import { router } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import CustomButton from '../../components/CustomButton';
import { expenseService } from '../../services/api';

const Expenses = () => {
  const [expenses, setExpenses] = useState([]);
  const [filteredExpenses, setFilteredExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  // Sorting and filtering states
  const [sortOrder, setSortOrder] = useState('newest'); // 'newest', 'oldest', 'highest', 'lowest'
  const [totalSpent, setTotalSpent] = useState(0);

  // Format currency
  const formatCurrency = (amount) => {
    return `$${parseFloat(amount).toFixed(2)}`;
  };

  // Format date
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Fetch all expenses
  const fetchExpenses = async () => {
    try {
      setLoading(true);
      setError(null);

      const data = await expenseService.getExpenses();
      console.log(`Fetched ${data.length} expenses`);

      // Calculate total spent
      const total = data.reduce((sum, expense) => sum + parseFloat(expense.amount), 0);
      setTotalSpent(total);

      setExpenses(data);
      sortAndFilterExpenses(data, sortOrder);
    } catch (error) {
      console.error('Error fetching expenses:', error);
      setError('Failed to load expenses. Pull down to refresh.');
    } finally {
      setLoading(false);
    }
  };

  // Sort and filter expenses
  const sortAndFilterExpenses = (data, order) => {
    let sorted = [...data];

    // Apply sorting
    switch (order) {
      case 'newest':
        sorted.sort((a, b) => new Date(b.date) - new Date(a.date));
        break;
      case 'oldest':
        sorted.sort((a, b) => new Date(a.date) - new Date(b.date));
        break;
      case 'highest':
        sorted.sort((a, b) => parseFloat(b.amount) - parseFloat(a.amount));
        break;
      case 'lowest':
        sorted.sort((a, b) => parseFloat(a.amount) - parseFloat(b.amount));
        break;
      default:
        sorted.sort((a, b) => new Date(b.date) - new Date(a.date));
    }

    setFilteredExpenses(sorted);
  };

  // Handle sorting change
  const handleSortChange = (order) => {
    setSortOrder(order);
    sortAndFilterExpenses(expenses, order);
  };

  // Delete expense
  const handleDeleteExpense = (id, description) => {
    Alert.alert(
      'Delete Expense',
      `Are you sure you want to delete "${description}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await expenseService.deleteExpense(id);
              fetchExpenses(); // Refresh the list
              Alert.alert('Success', 'Expense deleted successfully');
            } catch (error) {
              console.error('Error deleting expense:', error);
              Alert.alert('Error', 'Failed to delete expense. Please try again.');
            }
          }
        }
      ]
    );
  };

  // Initial fetch
  useEffect(() => {
    fetchExpenses();
  }, []);

  // Refresh when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      console.log('Expenses screen in focus - refreshing data');
      fetchExpenses();
      return () => { };
    }, [])
  );

  // Pull-to-refresh handler
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchExpenses();
    setRefreshing(false);
  }, []);

  // Render expense item
  const renderExpenseItem = ({ item }) => (
    <View className="flex-row items-center justify-between p-4 bg-white rounded-lg mb-2 shadow">
      <View className="flex-1">
        <Text className="text-lg font-semibold">{item.description}</Text>
        <Text className="text-gray-500">{formatDate(item.date)}</Text>
        {item.budget && (
          <Text className="text-gray-500">Budget: {item.budget.name || 'Unknown'}</Text>
        )}
      </View>
      <View className="flex-row items-center">
        <Text className="text-lg font-bold mr-4">{formatCurrency(item.amount)}</Text>
        <TouchableOpacity
          onPress={() => handleDeleteExpense(item.id, item.description)}
          className="p-2"
        >
          <Ionicons name="trash-outline" size={22} color="#FF0000" />
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <SafeAreaView className="bg-gray-500 flex-1">
      <View className="p-4">
        <View className="flex-row items-center justify-between mb-4">
          <Text className="text-black text-2xl font-bold">All Expenses</Text>
          <TouchableOpacity
            onPress={() => router.back()}
            className="p-2"
          >
            <Ionicons name="arrow-back" size={24} color="#000" />
          </TouchableOpacity>
        </View>

        {/* Total spent */}
        <View className="bg-gray-700 rounded-lg p-4 mb-4">
          <Text className="text-white text-center">Total Spent</Text>
          <Text className="text-white text-2xl font-bold text-center">
            {formatCurrency(totalSpent)}
          </Text>
        </View>

        {/* Sorting options */}
        <View className="bg-white rounded-lg p-2 mb-4 flex-row justify-around">
          <TouchableOpacity
            onPress={() => handleSortChange('newest')}
            className={`py-1 px-3 rounded-lg ${sortOrder === 'newest' ? 'bg-gray-300' : ''}`}
          >
            <Text>Newest</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => handleSortChange('oldest')}
            className={`py-1 px-3 rounded-lg ${sortOrder === 'oldest' ? 'bg-gray-300' : ''}`}
          >
            <Text>Oldest</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => handleSortChange('highest')}
            className={`py-1 px-3 rounded-lg ${sortOrder === 'highest' ? 'bg-gray-300' : ''}`}
          >
            <Text>Highest</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => handleSortChange('lowest')}
            className={`py-1 px-3 rounded-lg ${sortOrder === 'lowest' ? 'bg-gray-300' : ''}`}
          >
            <Text>Lowest</Text>
          </TouchableOpacity>
        </View>

        {/* Expense list */}
        {loading && !refreshing ? (
          <View className="flex-1 justify-center items-center mt-10">
            <ActivityIndicator size="large" color="#FFF" />
            <Text className="text-white mt-4">Loading expenses...</Text>
          </View>
        ) : error ? (
          <View className="flex-1 justify-center items-center mt-10">
            <Text className="text-white text-center">{error}</Text>
            <CustomButton
              title="Try Again"
              handlePress={fetchExpenses}
              containerStyles="mt-4"
            />
          </View>
        ) : filteredExpenses.length === 0 ? (
          <View className="flex-1 justify-center items-center mt-10">
            <Text className="text-white text-center text-lg">No expenses found</Text>
            <CustomButton
              title="Add Expense"
              handlePress={() => router.push('/expense-tracking')}
              containerStyles="mt-4"
            />
          </View>
        ) : (
          <FlatList
            data={filteredExpenses}
            keyExtractor={(item) => item.id.toString()}
            renderItem={renderExpenseItem}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            }
            ListFooterComponent={
              <View className="pb-20" />
            }
          />
        )}
      </View>

      {/* Add Expense Button */}
      <View className="absolute bottom-5 right-5">
        <TouchableOpacity
          onPress={() => router.push('/expense-tracking')}
          className="bg-indigo-200 w-14 h-14 rounded-full items-center justify-center shadow-lg"
        >
          <Ionicons name="add" size={30} color="#000" />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

export default Expenses;