import React, { useState, useEffect, useCallback } from 'react';
import { 
  View, 
  Text, 
  FlatList, 
  TouchableOpacity, 
  ActivityIndicator,
  RefreshControl,
  StatusBar
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { budgetService } from '../../services/api';
import { COLORS, SHADOWS, BORDER_RADIUS } from '../../constants/theme';

const Budget = () => {
  // State
  const [currentMonth, setCurrentMonth] = useState('');
  const [budgets, setBudgets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [totals, setTotals] = useState({
    total: 0,
    spent: 0,
    remaining: 0
  });

  // Fetch budgets from API
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
      
      // Get all budgets for the current user
      const budgetData = await budgetService.getBudgets();
      
      if (!budgetData || !Array.isArray(budgetData)) {
        throw new Error('Invalid budget data received');
      }
      
      // Group by category
      const budgetsByCategory = {};
      budgetData.forEach(budget => {
        if (!budgetsByCategory[budget.category]) {
          budgetsByCategory[budget.category] = [];
        }
        budgetsByCategory[budget.category].push({
          id: budget.id,
          name: budget.name,
          amount: parseFloat(budget.amount),
          spent: parseFloat(budget.used_amount || 0),
          remaining: parseFloat(budget.remaining_amount || 0),
          percentage: parseFloat(budget.usage_percentage || 0)
        });
      });
      
      // Convert to array for rendering
      const categorizedBudgets = Object.entries(budgetsByCategory).map(([category, items]) => ({
        category,
        items,
        totalAmount: items.reduce((sum, item) => sum + item.amount, 0),
        totalSpent: items.reduce((sum, item) => sum + item.spent, 0),
        totalRemaining: items.reduce((sum, item) => sum + item.remaining, 0)
      }));
      
      // Sort categories alphabetically
      categorizedBudgets.sort((a, b) => a.category.localeCompare(b.category));
      
      setBudgets(categorizedBudgets);
      
      // Calculate overall totals
      const totalAmount = budgetData.reduce((sum, budget) => sum + parseFloat(budget.amount), 0);
      const totalSpent = budgetData.reduce((sum, budget) => sum + parseFloat(budget.used_amount || 0), 0);
      const totalRemaining = totalAmount - totalSpent;
      
      setTotals({
        total: totalAmount,
        spent: totalSpent,
        remaining: totalRemaining
      });
    } catch (err) {
      console.error('Failed to fetch budgets:', err);
      setError('Failed to load budget data. Please try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Initial fetch when component mounts
  useEffect(() => {
    fetchBudgets();
  }, []);

  // Refresh when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      console.log('Budget screen in focus - refreshing data');
      fetchBudgets();
      return () => {};
    }, [])
  );

  // Pull-to-refresh handler
  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchBudgets();
  }, []);

  // Format currency values
  const formatCurrency = (amount) => {
    return `$${parseFloat(amount).toFixed(2)}`;
  };

  // Calculate progress bar color based on percentage
  const getProgressBarColor = (percentage) => {
    if (percentage >= 90) return COLORS.error.main;
    if (percentage >= 75) return COLORS.secondary.main;
    return COLORS.success.main;
  };

  // Render a single budget item
  const renderBudgetItem = ({ item }) => (
    <TouchableOpacity 
      style={{
        backgroundColor: COLORS.white,
        borderRadius: 12,
        marginBottom: 10,
        padding: 12,
        ...SHADOWS.small
      }}
      onPress={() => {
        // Navigate to budget details or edit screen
        router.push({
          pathname: '/create-budget',
          params: { 
            budgetId: item.id,
            mode: 'edit'
          }
        });
      }}
    >
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <Text style={{ fontSize: 16, fontWeight: '600', color: COLORS.neutral[800], flex: 1 }} numberOfLines={1}>
          {item.name}
        </Text>
        <Text style={{ fontSize: 14, fontWeight: '600', color: COLORS.neutral[700] }}>
          {formatCurrency(item.amount)}
        </Text>
      </View>
      
      <View style={{ marginTop: 8 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
          <Text style={{ fontSize: 12, color: COLORS.neutral[500] }}>
            Spent: {formatCurrency(item.spent)}
          </Text>
          <Text style={{ fontSize: 12, color: COLORS.neutral[500] }}>
            {Math.round(item.percentage)}%
          </Text>
        </View>
        
        {/* Progress bar */}
        <View style={{ 
          height: 6, 
          backgroundColor: COLORS.neutral[200], 
          borderRadius: 3, 
          overflow: 'hidden' 
        }}>
          <View 
            style={{ 
              width: `${Math.min(item.percentage, 100)}%`, 
              height: '100%', 
              backgroundColor: getProgressBarColor(item.percentage) 
            }} 
          />
        </View>
        
        <Text style={{ 
          fontSize: 12, 
          color: COLORS.neutral[600], 
          marginTop: 4, 
          textAlign: 'right' 
        }}>
          {formatCurrency(item.remaining)} remaining
        </Text>
      </View>
    </TouchableOpacity>
  );

  // Render a category section with its budgets
  const renderCategorySection = ({ item }) => (
    <View style={{ marginBottom: 24 }}>
      <View style={{ 
        flexDirection: 'row', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        marginBottom: 12
      }}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <View style={{
            width: 32,
            height: 32,
            borderRadius: 16,
            backgroundColor: COLORS.primary.light,
            justifyContent: 'center',
            alignItems: 'center',
            marginRight: 8
          }}>
            <Ionicons name="folder-outline" size={16} color={COLORS.primary.main} />
          </View>
          <Text style={{ fontSize: 18, fontWeight: '600', color: COLORS.neutral[800] }}>
            {item.category}
          </Text>
        </View>
        
        <View style={{
          backgroundColor: COLORS.background.secondary,
          paddingHorizontal: 10,
          paddingVertical: 4,
          borderRadius: 12
        }}>
          <Text style={{ fontSize: 12, fontWeight: '500', color: COLORS.neutral[700] }}>
            {formatCurrency(item.totalSpent)} / {formatCurrency(item.totalAmount)}
          </Text>
        </View>
      </View>
      
      {/* Budget items within this category */}
      {item.items.map(budgetItem => renderBudgetItem({ item: budgetItem }))}
    </View>
  );

  // Summary card at the top
  const renderSummaryCard = () => (
    <View style={{
      backgroundColor: COLORS.primary.main,
      borderRadius: 16,
      padding: 16,
      marginHorizontal: 16,
      marginBottom: 24,
      ...SHADOWS.medium
    }}>
      <Text style={{ 
        fontSize: 16, 
        color: COLORS.white,
        fontWeight: '600',
        marginBottom: 8 
      }}>
        {currentMonth} Budget Overview
      </Text>
      
      <View style={{ flexDirection: 'row', marginTop: 8 }}>
        <View style={{ flex: 1, alignItems: 'center' }}>
          <Text style={{ color: 'rgba(255,255,255,0.8)', fontSize: 12, marginBottom: 4 }}>
            Total Budget
          </Text>
          <Text style={{ color: COLORS.white, fontSize: 18, fontWeight: '700' }}>
            {formatCurrency(totals.total)}
          </Text>
        </View>
        
        <View style={{ 
          width: 1, 
          backgroundColor: 'rgba(255,255,255,0.3)', 
          marginHorizontal: 8 
        }} />
        
        <View style={{ flex: 1, alignItems: 'center' }}>
          <Text style={{ color: 'rgba(255,255,255,0.8)', fontSize: 12, marginBottom: 4 }}>
            Spent
          </Text>
          <Text style={{ color: COLORS.white, fontSize: 18, fontWeight: '700' }}>
            {formatCurrency(totals.spent)}
          </Text>
        </View>
        
        <View style={{ 
          width: 1, 
          backgroundColor: 'rgba(255,255,255,0.3)', 
          marginHorizontal: 8 
        }} />
        
        <View style={{ flex: 1, alignItems: 'center' }}>
          <Text style={{ color: 'rgba(255,255,255,0.8)', fontSize: 12, marginBottom: 4 }}>
            Remaining
          </Text>
          <Text style={{ color: COLORS.white, fontSize: 18, fontWeight: '700' }}>
            {formatCurrency(totals.remaining)}
          </Text>
        </View>
      </View>
      
      {/* Overall progress bar */}
      <View style={{ marginTop: 16 }}>
        <View style={{ 
          height: 8, 
          backgroundColor: 'rgba(255,255,255,0.2)', 
          borderRadius: 4, 
          overflow: 'hidden' 
        }}>
          <View 
            style={{ 
              width: totals.total > 0 ? `${Math.min((totals.spent / totals.total) * 100, 100)}%` : '0%', 
              height: '100%', 
              backgroundColor: COLORS.white 
            }} 
          />
        </View>
        
        <Text style={{ 
          color: COLORS.white, 
          fontSize: 12, 
          textAlign: 'right', 
          marginTop: 4 
        }}>
          {totals.total > 0 ? Math.round((totals.spent / totals.total) * 100) : 0}% of budget used
        </Text>
      </View>
    </View>
  );

  // Empty state when no budgets exist
  const renderEmptyState = () => (
    <View style={{ 
      flex: 1, 
      alignItems: 'center', 
      justifyContent: 'center', 
      padding: 24 
    }}>
      <View style={{
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: COLORS.background.secondary,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16
      }}>
        <Ionicons name="wallet-outline" size={40} color={COLORS.neutral[400]} />
      </View>
      
      <Text style={{ 
        fontSize: 18, 
        fontWeight: '600', 
        color: COLORS.neutral[800],
        textAlign: 'center',
        marginBottom: 8
      }}>
        No Budgets Yet
      </Text>
      
      <Text style={{ 
        fontSize: 14, 
        color: COLORS.neutral[600],
        textAlign: 'center',
        marginBottom: 24
      }}>
        Create your first budget category to start tracking your spending
      </Text>
      
      <TouchableOpacity
        onPress={() => router.push({
          pathname: '/create-budget',
          params: { family: false }
        })}
        style={{
          backgroundColor: COLORS.primary.main,
          paddingHorizontal: 20,
          paddingVertical: 12,
          borderRadius: 12,
          flexDirection: 'row',
          alignItems: 'center',
          ...SHADOWS.small
        }}
      >
        <Ionicons name="add-circle-outline" size={20} color={COLORS.white} />
        <Text style={{ 
          marginLeft: 8, 
          color: COLORS.white, 
          fontWeight: '600' 
        }}>
          Create Budget
        </Text>
      </TouchableOpacity>
    </View>
  );

  if (loading && !refreshing) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.background.primary }}>
        <StatusBar barStyle="light-content" backgroundColor={COLORS.primary.main} />
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color={COLORS.primary.main} />
          <Text style={{ marginTop: 16, color: COLORS.neutral[600] }}>
            Loading budgets...
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
        paddingVertical: 20,
        borderBottomLeftRadius: 20,
        borderBottomRightRadius: 20,
        ...SHADOWS.medium
      }}>
        <Text style={{
          fontSize: 20,
          fontWeight: '700',
          color: COLORS.white,
          textAlign: 'center'
        }}>
          Budgets
        </Text>
      </View>
      
      {/* Main content */}
      {budgets.length === 0 ? (
        renderEmptyState()
      ) : (
        <FlatList
          data={budgets}
          keyExtractor={(item) => item.category}
          renderItem={renderCategorySection}
          ListHeaderComponent={renderSummaryCard()}
          contentContainerStyle={{ paddingVertical: 24, paddingHorizontal: 16 }}
          refreshControl={
            <RefreshControl 
              refreshing={refreshing} 
              onRefresh={onRefresh}
              colors={[COLORS.primary.main]}
            />
          }
        />
      )}
      
      {/* Add Budget FAB */}
      <View style={{
        position: 'absolute',
        right: 24,
        bottom: 24,
      }}>
        <TouchableOpacity
          onPress={() => router.push({
            pathname: '/create-budget',
            params: { family: false }
          })}
          style={{
            width: 56,
            height: 56,
            borderRadius: 28,
            backgroundColor: COLORS.primary.main,
            justifyContent: 'center',
            alignItems: 'center',
            ...SHADOWS.medium
          }}
        >
          <Ionicons name="add" size={24} color={COLORS.white} />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

export default Budget;