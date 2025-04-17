import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, SafeAreaView, RefreshControl, ActivityIndicator, Alert, StyleSheet, StatusBar } from 'react-native';
import { router } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import CustomButton from '../../components/CustomButton';
import { expenseService } from '../../services/api';
import { COLORS, SHADOWS, BORDER_RADIUS } from '../../constants/theme';

const Expenses = () => {
  const [expenses, setExpenses] = useState([]);
  const [filteredExpenses, setFilteredExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  // Sorting and filtering states
  const [sortOrder, setSortOrder] = useState('oldest'); // Changed default from 'newest' to 'oldest'
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

    // Apply sorting with improved date handling
    switch (order) {
      case 'newest':
        sorted.sort((a, b) => {
          const dateA = new Date(a.date || 0);
          const dateB = new Date(b.date || 0);
          return dateB - dateA;
        });
        break;
      case 'oldest':
        sorted.sort((a, b) => {
          const dateA = new Date(a.date || 0);
          const dateB = new Date(b.date || 0);
          return dateA - dateB;
        });
        break;
      case 'highest':
        sorted.sort((a, b) => parseFloat(b.amount || 0) - parseFloat(a.amount || 0));
        break;
      case 'lowest':
        sorted.sort((a, b) => parseFloat(a.amount || 0) - parseFloat(b.amount || 0));
        break;
      default:
        // Also change the default case to sort by oldest
        sorted.sort((a, b) => {
          const dateA = new Date(a.date || 0);
          const dateB = new Date(b.date || 0);
          return dateA - dateB; // Changed from dateB - dateA to dateA - dateB
        });
    }

    // Log the sorted order to verify it's working
    console.log(`Sorted expenses by ${order}, first item:`, 
      sorted.length > 0 ? 
        { date: sorted[0].date, amount: sorted[0].amount } : 
        'No expenses'
    );

    setFilteredExpenses(sorted);
  };

  // Handle sorting change with improved handling
  const handleSortChange = (order) => {
    console.log(`Changing sort order to: ${order}`);
    setSortOrder(order);
    
    // Ensure we have the latest expenses data
    sortAndFilterExpenses(expenses, order);
    
    // Verify the state was updated
    console.log(`Sort order is now: ${order}`);
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
    <TouchableOpacity
      style={styles.expenseCard}
      onPress={() => router.push({
        pathname: '/expense-tracking',
        params: { expenseId: item.id, mode: 'edit' }
      })}
    >
      <View style={styles.expenseCardContent}>
        <View style={styles.expenseIconContainer}>
          <Ionicons 
            name={item.category ? 
              getCategoryIcon(item.category) : 
              "cart-outline"} 
            size={24} 
            color={COLORS.primary.main} 
          />
        </View>
        
        <View style={styles.expenseDetails}>
          <Text style={styles.expenseTitle} numberOfLines={1}>
            {item.description}
          </Text>
          <Text style={styles.expenseDate}>
            {formatDate(item.date)}
          </Text>
          
          <View style={styles.expenseTags}>
            {item.budget && (
              <View style={styles.expenseTag}>
                <Ionicons name="wallet-outline" size={12} color={COLORS.neutral[600]} />
                <Text style={styles.expenseTagText}>
                  {item.budget.name}
                </Text>
              </View>
            )}
            
            {item.goal && (
              <View style={styles.expenseTag}>
                <Ionicons name="flag-outline" size={12} color={COLORS.neutral[600]} />
                <Text style={styles.expenseTagText}>
                  {item.goal.name}
                </Text>
              </View>
            )}
          </View>
        </View>
        
        <View style={styles.expenseAmountContainer}>
          <Text style={styles.expenseAmount}>
            {formatCurrency(item.amount)}
          </Text>
          
          <TouchableOpacity
            style={styles.deleteButton}
            onPress={() => handleDeleteExpense(item.id, item.description)}
          >
            <Ionicons name="trash-outline" size={18} color={COLORS.error.main} />
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );

  // Helper function to determine icon based on category
  const getCategoryIcon = (category) => {
    const lowerCategory = category.toLowerCase();
    if (lowerCategory.includes('food')) return 'fast-food-outline';
    if (lowerCategory.includes('transport')) return 'car-outline';
    if (lowerCategory.includes('utilities')) return 'flash-outline';
    if (lowerCategory.includes('entertainment')) return 'film-outline';
    if (lowerCategory.includes('shopping')) return 'cart-outline';
    if (lowerCategory.includes('health')) return 'medkit-outline';
    if (lowerCategory.includes('education')) return 'school-outline';
    return 'cash-outline';
  };

  // Filter options for the horizontal FlatList
  const filterOptions = [
    { id: 'newest', label: 'Newest', icon: 'time-outline' },
    { id: 'oldest', label: 'Oldest', icon: 'calendar-outline' },
    { id: 'highest', label: 'Highest', icon: 'trending-up-outline' },
    { id: 'lowest', label: 'Lowest', icon: 'trending-down-outline' }
  ];
  
  // Render a filter button item for the FlatList
  const renderFilterItem = ({ item }) => (
    <TouchableOpacity
      style={[
        styles.filterButton,
        sortOrder === item.id && styles.activeFilterButton
      ]}
      onPress={() => handleSortChange(item.id)}
    >
      <Ionicons
        name={item.icon}
        size={16}
        color={sortOrder === item.id ? COLORS.white : COLORS.neutral[600]}
        style={styles.filterIcon}
      />
      <Text style={[
        styles.filterButtonText,
        sortOrder === item.id && styles.activeFilterText
      ]}>
        {item.label}
      </Text>
    </TouchableOpacity>
  );

  // Loading state
  if (loading && !refreshing) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor={COLORS.primary.main} />
        
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Expenses</Text>
          <TouchableOpacity 
            style={styles.addButton}
            onPress={() => router.push('/expense-tracking')}
          >
            <Ionicons name="add" size={24} color={COLORS.white} />
          </TouchableOpacity>
        </View>
        
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary.main} />
          <Text style={styles.loadingText}>Loading your expenses...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.primary.main} />
      
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Expenses</Text>
        <TouchableOpacity 
          style={styles.addButton}
          onPress={() => router.push('/expense-tracking')}
        >
          <Ionicons name="add" size={24} color={COLORS.white} />
        </TouchableOpacity>
      </View>
      
      {/* Summary Card */}
      <View style={styles.summaryCard}>
        <Text style={styles.summaryLabel}>Total Spent</Text>
        <Text style={styles.summaryAmount}>{formatCurrency(totalSpent)}</Text>
      </View>
      
      {/* Filters - Using FlatList instead of ScrollView */}
      <View style={styles.filtersContainer}>
        <FlatList
          data={filterOptions}
          renderItem={renderFilterItem}
          keyExtractor={(item) => item.id}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterListContent}
        />
      </View>

      {/* Content */}
      <View style={styles.content}>
        {error ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="alert-circle-outline" size={60} color={COLORS.error.light} />
            <Text style={styles.emptyTitle}>{error}</Text>
            <CustomButton
              title="Try Again"
              handlePress={fetchExpenses}
              containerStyles="mt-4"
            />
          </View>
        ) : filteredExpenses.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="receipt-outline" size={60} color={COLORS.neutral[400]} />
            <Text style={styles.emptyTitle}>No Expenses Found</Text>
            <Text style={styles.emptySubtitle}>
              Start tracking your spending by adding your first expense.
            </Text>
            <CustomButton
              title="Add Expense"
              handlePress={() => router.push('/expense-tracking')}
              containerStyles="mt-5"
            />
          </View>
        ) : (
          <FlatList
            data={filteredExpenses}
            keyExtractor={(item) => item.id.toString()}
            renderItem={renderExpenseItem}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.listContent}
            refreshControl={
              <RefreshControl 
                refreshing={refreshing} 
                onRefresh={onRefresh} 
                colors={[COLORS.primary.main]}
                tintColor={COLORS.primary.main}
              />
            }
          />
        )}
      </View>
      
      {/* Add button for mobile */}
      <TouchableOpacity 
        style={styles.floatingActionButton}
        onPress={() => router.push('/expense-tracking')}
      >
        <Ionicons name="add" size={30} color={COLORS.white} />
      </TouchableOpacity>
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
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.white,
  },
  addButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  summaryCard: {
    marginHorizontal: 16,
    marginTop: 16,
    padding: 20,
    backgroundColor: COLORS.primary.main,
    borderRadius: 16,
    alignItems: 'center',
    ...SHADOWS.medium,
  },
  summaryLabel: {
    fontSize: 14,
    color: COLORS.white,
    opacity: 0.8,
    marginBottom: 8,
  },
  summaryAmount: {
    fontSize: 28,
    fontWeight: '700',
    color: COLORS.white,
  },
  filtersContainer: {
    marginTop: 16,
    paddingHorizontal: 16,
    height: 50, // Fixed height to avoid layout shifts
  },
  filterListContent: {
    paddingVertical: 4,
  },
  filterButton: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: COLORS.white,
    borderRadius: 50,
    marginRight: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.neutral[200],
    ...SHADOWS.tiny,
  },
  activeFilterButton: {
    backgroundColor: COLORS.primary.main,
    borderColor: COLORS.primary.main,
  },
  filterIcon: {
    marginRight: 6,
  },
  filterButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.neutral[700],
  },
  activeFilterText: {
    color: COLORS.white,
  },
  content: {
    flex: 1,
    marginTop: 16,
    paddingHorizontal: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: COLORS.neutral[600],
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.neutral[800],
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: COLORS.neutral[600],
    textAlign: 'center',
    maxWidth: '80%',
  },
  listContent: {
    paddingBottom: 100, // Extra space for FAB
  },
  expenseCard: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    marginBottom: 12,
    ...SHADOWS.small,
    overflow: 'hidden',
  },
  expenseCardContent: {
    flexDirection: 'row',
    padding: 16,
  },
  expenseIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.primary.light + '20',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  expenseDetails: {
    flex: 1,
    justifyContent: 'center',
  },
  expenseTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.neutral[800],
    marginBottom: 4,
  },
  expenseDate: {
    fontSize: 12,
    color: COLORS.neutral[500],
    marginBottom: 6,
  },
  expenseTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  expenseTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.neutral[200],
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    marginRight: 6,
    marginBottom: 4,
  },
  expenseTagText: {
    fontSize: 10,
    color: COLORS.neutral[700],
    marginLeft: 4,
  },
  expenseAmountContainer: {
    alignItems: 'flex-end',
    justifyContent: 'space-between',
  },
  expenseAmount: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.error.main,
    marginBottom: 12,
  },
  deleteButton: {
    padding: 6,
  },
  floatingActionButton: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: COLORS.primary.main,
    justifyContent: 'center',
    alignItems: 'center',
    ...SHADOWS.medium,
  },
});

export default Expenses;