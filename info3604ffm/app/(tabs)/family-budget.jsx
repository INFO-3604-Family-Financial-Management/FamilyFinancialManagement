import { View, Text, TouchableOpacity, ActivityIndicator, FlatList, RefreshControl, StyleSheet, StatusBar } from 'react-native'
import React, { useState, useEffect, useCallback } from 'react'
import { router } from 'expo-router'
import { useFocusEffect } from '@react-navigation/native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import CustomButton from '@/components/CustomButton'
import { budgetService, familyService } from '../../services/api'
import { COLORS, SHADOWS, BORDER_RADIUS } from '../../constants/theme'

const FamilyBudget = () => {
  const [currentMonth, setCurrentMonth] = useState('');
  const [budgets, setBudgets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [totals, setTotals] = useState({
    spent: 0,
    remaining: 0
  });
  const [familyName, setFamilyName] = useState('');

  const fetchBudgets = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Get current month name
      const monthNames = [
        "January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"
      ];
      const now = new Date();
      setCurrentMonth(monthNames[now.getMonth()]);
      
      // Get family name
      try {
        const family = await familyService.getCurrentUserFamily();
        if (family && family.name) {
          setFamilyName(family.name);
        }
      } catch (error) {
        console.error('Error getting family name:', error);
      }
      
      // Get family budgets
      console.log('Fetching family budgets...');
      const budgetData = await budgetService.getFamilyBudgets();
      console.log('Family budget data:', budgetData);
      
      if (!budgetData || !Array.isArray(budgetData)) {
        throw new Error('Invalid budget data received');
      }
      
      // Transform data into the expected format
      const budgetCategories = budgetData.map(budget => ({
        id: budget.id,
        category: budget.category,
        name: budget.name,
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
      
    } catch (err) {
      console.error('Failed to fetch family budgets:', err);
      setError('Failed to load budget data. Please try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };
  
  // Initial fetch on mount
  useEffect(() => {
    fetchBudgets();
  }, []);

  // Refresh when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      console.log('Family budget screen in focus - refreshing data');
      fetchBudgets();
      return () => {
        // Cleanup function (optional)
      };
    }, [])
  );

  // Pull-to-refresh handler
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchBudgets();
  }, []);

  // Format currency values
  const formatCurrency = (amount) => {
    return `$${parseFloat(amount).toFixed(2)}`;
  };

  // Calculate progress bar color based on percentage
  const getProgressBarColor = (spent, total) => {
    const percentage = (spent / total) * 100;
    if (percentage >= 90) return COLORS.error.main;
    if (percentage >= 75) return COLORS.secondary.main;
    return COLORS.success.main;
  };

  // Render budget item for the FlatList
  const renderBudgetItem = ({ item }) => (
    <TouchableOpacity 
      style={styles.budgetCard}
      onPress={() => router.push({
        pathname: '/create-budget',
        params: { 
          budgetId: item.id,
          mode: 'edit',
          family: 'true'
        }
      })}
    >
      <View style={styles.budgetCardHeader}>
        <View style={styles.categoryContainer}>
          <View style={styles.categoryIconContainer}>
            <Ionicons name="folder-outline" size={20} color={COLORS.primary.main} />
          </View>
          <Text style={styles.categoryTitle}>{item.category}</Text>
        </View>
        <Text style={styles.budgetName}>{item.name}</Text>
      </View>
      
      <View style={styles.budgetAmounts}>
        <Text style={styles.spentText}>
          {formatCurrency(item.spent)} <Text style={styles.ofText}>of</Text> {formatCurrency(item.amount)}
        </Text>
      </View>
      
      {/* Progress bar */}
      <View style={styles.progressContainer}>
        <View style={styles.progressBackground}>
          <View 
            style={[
              styles.progressFill, 
              { 
                width: `${Math.min((item.spent / item.amount) * 100, 100)}%`,
                backgroundColor: getProgressBarColor(item.spent, item.amount)
              }
            ]} 
          />
        </View>
        
        <Text style={styles.remainingText}>
          {formatCurrency(item.remaining)} remaining
        </Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.primary.main} />
      
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Family Budget</Text>
        {familyName && (
          <Text style={styles.familyName}>{familyName} Family</Text>
        )}
      </View>
      
      <View style={styles.contentContainer}>
        {/* Month Card */}
        <View style={styles.monthCard}>
          <Text style={styles.monthText}>{currentMonth}</Text>
        </View>
        
        {/* Content based on state */}
        {loading && !refreshing ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={COLORS.primary.main} />
            <Text style={styles.loadingText}>Loading family budgets...</Text>
          </View>
        ) : error ? (
          <View style={styles.errorContainer}>
            <Ionicons name="alert-circle-outline" size={60} color={COLORS.error.light} />
            <Text style={styles.errorText}>{error}</Text>
            <CustomButton 
              title="Try Again" 
              handlePress={fetchBudgets}
              containerStyles="mt-5" 
            />
          </View>
        ) : budgets.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="wallet-outline" size={60} color={COLORS.neutral[400]} />
            <Text style={styles.emptyTitle}>No Family Budgets</Text>
            <Text style={styles.emptyText}>
              Create your first family budget category to start tracking shared expenses.
            </Text>
          </View>
        ) : (
          <>
            <FlatList
              data={budgets}
              keyExtractor={(item) => item.id.toString()}
              renderItem={renderBudgetItem}
              refreshControl={
                <RefreshControl 
                  refreshing={refreshing} 
                  onRefresh={onRefresh}
                  colors={[COLORS.primary.main]}
                  tintColor={COLORS.primary.main}
                />
              }
              style={styles.budgetList}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.listContent}
            />
            
            {/* Summary Card */}
            <View style={styles.summaryCard}>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Total Spent:</Text>
                <Text style={styles.summaryValue}>{formatCurrency(totals.spent)}</Text>
              </View>
              <View style={styles.divider} />
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Total Remaining:</Text>
                <Text style={[styles.summaryValue, styles.remainingValue]}>
                  {formatCurrency(totals.remaining)}
                </Text>
              </View>
            </View>
          </>
        )}
      </View>

      {/* Add Budget Button */}
      <TouchableOpacity
        style={styles.floatingButton}
        onPress={() => router.push({
          pathname: "/create-budget",
          params: { family: 'true' }
        })}
      >
        <Ionicons name="add" size={24} color={COLORS.white} />
      </TouchableOpacity>
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
    paddingVertical: 20,
    paddingHorizontal: 16,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    alignItems: 'center',
    ...SHADOWS.medium,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.white,
  },
  familyName: {
    fontSize: 16,
    color: COLORS.white,
    opacity: 0.9,
    marginTop: 4,
  },
  contentContainer: {
    flex: 1,
    padding: 16,
  },
  monthCard: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    alignItems: 'center',
    ...SHADOWS.small,
  },
  monthText: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.neutral[800],
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: COLORS.neutral[600],
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  errorText: {
    fontSize: 16,
    color: COLORS.error.main,
    textAlign: 'center',
    marginTop: 12,
    marginBottom: 16,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    backgroundColor: COLORS.white,
    borderRadius: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.neutral[800],
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: COLORS.neutral[600],
    textAlign: 'center',
    maxWidth: '80%',
  },
  budgetList: {
    marginBottom: 16,
  },
  listContent: {
    paddingBottom: 8,
  },
  budgetCard: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    ...SHADOWS.small,
  },
  budgetCardHeader: {
    marginBottom: 12,
  },
  categoryContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  categoryIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.primary.light + '20',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  categoryTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.neutral[700],
  },
  budgetName: {
    fontSize: 14,
    color: COLORS.neutral[500],
    marginLeft: 40,
  },
  budgetAmounts: {
    marginBottom: 8,
  },
  spentText: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.neutral[700],
  },
  ofText: {
    fontWeight: '400',
    color: COLORS.neutral[500],
  },
  progressContainer: {
    marginTop: 4,
  },
  progressBackground: {
    height: 8,
    backgroundColor: COLORS.neutral[200],
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  remainingText: {
    fontSize: 12,
    color: COLORS.neutral[500],
    marginTop: 4,
    textAlign: 'right',
  },
  summaryCard: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 16,
    ...SHADOWS.small,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.neutral[200],
    marginVertical: 4,
  },
  summaryLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: COLORS.neutral[700],
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.neutral[800],
  },
  remainingValue: {
    color: COLORS.success.main,
  },
  floatingButton: {
    position: 'absolute',
    right: 24,
    bottom: 150,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: COLORS.primary.main,
    justifyContent: 'center',
    alignItems: 'center',
    ...SHADOWS.medium,
  },
});

export default FamilyBudget