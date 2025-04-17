import React, { useState, useEffect, useCallback } from 'react';
import { 
  View, 
  Text, 
  FlatList, 
  TouchableOpacity, 
  StyleSheet, 
  ActivityIndicator,
  RefreshControl,
  Alert,
  StatusBar
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { goalService } from '@/services/api';
import { COLORS, SPACING, SHADOWS, BORDER_RADIUS } from '@/constants/theme';
import Button from '@/components/Button';

// Goal Card Component
const GoalCard = ({ goal, onPress }) => {
  // Calculate metrics
  const progress = parseFloat(goal.progress_percentage) || 0;
  const remaining = parseFloat(goal.remaining_amount) || 0;
  const amount = parseFloat(goal.amount) || 0;
  const currentAmount = amount - remaining;
  
  // Format currency
  const formatCurrency = (value) => `$${parseFloat(value).toFixed(2)}`;
  
  // Get specific styling based on goal type
  const getGoalStyles = () => {
    if (goal.goal_type === 'saving') {
      return {
        icon: 'trending-up',
        color: COLORS.success.main,
        lightColor: COLORS.success.light,
        bgColor: `${COLORS.success.main}10`
      };
    } else {
      return {
        icon: 'cart',
        color: COLORS.secondary.main,
        lightColor: COLORS.secondary.light,
        bgColor: `${COLORS.secondary.main}10`
      };
    }
  };
  
  const goalStyles = getGoalStyles();
  
  return (
    <TouchableOpacity 
      style={styles.goalCard}
      onPress={onPress}
      activeOpacity={0.75}
    >
      <View style={styles.goalCardHeader}>
        <View style={[
          styles.goalIconContainer,
          { backgroundColor: goalStyles.bgColor }
        ]}>
          <Ionicons name={goalStyles.icon} size={24} color={goalStyles.color} />
        </View>
        
        <View style={styles.goalTitleContainer}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Text style={styles.goalTitle} numberOfLines={1}>
              {goal.name}
            </Text>
            
            {goal.pinned && (
              <Ionicons name="pin" size={16} color={COLORS.primary.main} style={{ marginLeft: 6 }} />
            )}
          </View>
          
          <Text style={styles.goalType}>
            {goal.goal_type === 'saving' ? 'Saving Goal' : 'Spending Goal'}
          </Text>
        </View>
      </View>
      
      <View style={styles.goalProgress}>
        <View style={styles.progressHeader}>
          <Text style={styles.progressText}>
            {formatCurrency(currentAmount)} of {formatCurrency(amount)}
          </Text>
          <Text style={styles.progressPercentage}>
            {Math.round(progress)}%
          </Text>
        </View>
        
        {/* Progress bar */}
        <View style={styles.progressBarContainer}>
          <View 
            style={[
              styles.progressBar,
              { 
                width: `${Math.min(progress, 100)}%`,
                backgroundColor: goalStyles.color
              }
            ]} 
          />
        </View>
        
        <Text style={styles.remainingText}>
          {goal.goal_type === 'saving' 
            ? `${formatCurrency(remaining)} more to save`
            : `${formatCurrency(remaining)} left to spend`
          }
        </Text>
      </View>
    </TouchableOpacity>
  );
};

const Goals = () => {
  // Parse route params
  const params = useLocalSearchParams();
  const successMessage = params?.success;
  const messageType = params?.type;
  
  // State
  const [goals, setGoals] = useState([]);
  const [filteredGoals, setFilteredGoals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeFilter, setActiveFilter] = useState('all'); // 'all', 'saving', 'spending'
  
  // Fetch goals from API
  const fetchGoals = async () => {
    setLoading(true);
    try {
      const data = await goalService.getGoals();
      
      // Filter to only show personal goals
      const personalGoals = data.filter(goal => goal.is_personal);
      setGoals(personalGoals);
      
      // Apply active filter
      filterGoals(personalGoals, activeFilter);
    } catch (error) {
      console.error('Error fetching goals:', error);
      Alert.alert('Error', 'Failed to load goals. Please try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };
  
  // Filter goals based on type
  const filterGoals = (goalsData, filter) => {
    switch (filter) {
      case 'saving':
        setFilteredGoals(goalsData.filter(goal => goal.goal_type === 'saving'));
        break;
      case 'spending':
        setFilteredGoals(goalsData.filter(goal => goal.goal_type === 'spending'));
        break;
      case 'all':
      default:
        setFilteredGoals(goalsData);
        break;
    }
  };
  
  // Handle filter selection
  const handleFilterChange = (filter) => {
    setActiveFilter(filter);
    filterGoals(goals, filter);
  };
  
  // Navigate to goal details/edit screen
  const handleGoalPress = (goalId) => {
    router.push({
      pathname: '/edit-goal',
      params: { goalId }
    });
  };
  
  // Initial data fetch
  useEffect(() => {
    fetchGoals();
    
    // Show success message if passed from previous screen
    if (successMessage && messageType) {
      const message = messageType === 'contribution'
        ? 'Contribution added successfully!'
        : 'Goal created successfully!';
        
      Alert.alert('Success', message);
    }
  }, [successMessage, messageType]);
  
  // Refresh when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      console.log('Goals screen in focus - refreshing data');
      fetchGoals();
      return () => {};
    }, [])
  );
  
  // Pull-to-refresh handler
  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchGoals();
  }, []);
  
  // Calculate total progress across all goals of each type
  const getSavingProgress = () => {
    const savingGoals = goals.filter(goal => goal.goal_type === 'saving');
    
    if (savingGoals.length === 0) return { percentage: 0, saved: 0, total: 0 };
    
    const totalTarget = savingGoals.reduce((sum, goal) => sum + parseFloat(goal.amount || 0), 0);
    const totalSaved = savingGoals.reduce((sum, goal) => {
      const remaining = parseFloat(goal.remaining_amount || 0);
      const amount = parseFloat(goal.amount || 0);
      return sum + (amount - remaining);
    }, 0);
    
    return {
      percentage: totalTarget > 0 ? (totalSaved / totalTarget) * 100 : 0,
      saved: totalSaved,
      total: totalTarget
    };
  };
  
  const getSpendingProgress = () => {
    const spendingGoals = goals.filter(goal => goal.goal_type === 'spending');
    
    if (spendingGoals.length === 0) return { percentage: 0, spent: 0, total: 0 };
    
    const totalTarget = spendingGoals.reduce((sum, goal) => sum + parseFloat(goal.amount || 0), 0);
    const totalSpent = spendingGoals.reduce((sum, goal) => {
      const remaining = parseFloat(goal.remaining_amount || 0);
      const amount = parseFloat(goal.amount || 0);
      return sum + (amount - remaining);
    }, 0);
    
    return {
      percentage: totalTarget > 0 ? (totalSpent / totalTarget) * 100 : 0,
      spent: totalSpent,
      total: totalTarget
    };
  };
  
  // Format currency helper
  const formatCurrency = (amount) => {
    return `${parseFloat(amount).toFixed(2)}`;
  };
  
  // Header with summary cards
  const renderHeader = () => {
    const savingProgress = getSavingProgress();
    const spendingProgress = getSpendingProgress();
    
    return (
      <View style={styles.headerContainer}>
        {/* Savings Summary Card */}
        <View style={[styles.summaryCard, { backgroundColor: COLORS.success.main }]}>
          <View style={styles.summaryIconContainer}>
            <Ionicons name="trending-up" size={24} color={COLORS.white} />
          </View>
          
          <Text style={styles.summaryTitle}>Saving Goals</Text>
          
          <View style={styles.summaryDetails}>
            <Text style={styles.summaryAmount}>
              {formatCurrency(savingProgress.saved)}
              <Text style={styles.summarySubtext}> / {formatCurrency(savingProgress.total)}</Text>
            </Text>
            
            <View style={styles.summaryProgressContainer}>
              <View 
                style={[
                  styles.summaryProgress, 
                  { width: `${Math.min(savingProgress.percentage, 100)}%` }
                ]} 
              />
            </View>
          </View>
        </View>
        
        {/* Spending Summary Card */}
        <View style={[styles.summaryCard, { backgroundColor: COLORS.secondary.main }]}>
          <View style={styles.summaryIconContainer}>
            <Ionicons name="cart" size={24} color={COLORS.white} />
          </View>
          
          <Text style={styles.summaryTitle}>Spending Goals</Text>
          
          <View style={styles.summaryDetails}>
            <Text style={styles.summaryAmount}>
              {formatCurrency(spendingProgress.spent)}
              <Text style={styles.summarySubtext}> / {formatCurrency(spendingProgress.total)}</Text>
            </Text>
            
            <View style={styles.summaryProgressContainer}>
              <View 
                style={[
                  styles.summaryProgress, 
                  { width: `${Math.min(spendingProgress.percentage, 100)}%` }
                ]} 
              />
            </View>
          </View>
        </View>
      </View>
    );
  };
  
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.primary.main} />
      
      {/* Header */}
      <View style={styles.mainHeader}>
        <Text style={styles.screenTitle}>Goals</Text>
      </View>
      
      {/* Content */}
      <View style={styles.content}>
        {loading && !refreshing ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={COLORS.primary.main} />
            <Text style={styles.loadingText}>Loading goals...</Text>
          </View>
        ) : (
          <>
            {/* Filters */}
            <View style={styles.filterContainer}>
              <TouchableOpacity 
                style={[
                  styles.filterButton, 
                  activeFilter === 'all' && styles.activeFilterButton
                ]}
                onPress={() => handleFilterChange('all')}
              >
                <Text style={[
                  styles.filterText,
                  activeFilter === 'all' && styles.activeFilterText
                ]}>
                  All
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[
                  styles.filterButton, 
                  activeFilter === 'saving' && styles.activeFilterButton
                ]}
                onPress={() => handleFilterChange('saving')}
              >
                <Text style={[
                  styles.filterText,
                  activeFilter === 'saving' && styles.activeFilterText
                ]}>
                  Saving
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[
                  styles.filterButton, 
                  activeFilter === 'spending' && styles.activeFilterButton
                ]}
                onPress={() => handleFilterChange('spending')}
              >
                <Text style={[
                  styles.filterText,
                  activeFilter === 'spending' && styles.activeFilterText
                ]}>
                  Spending
                </Text>
              </TouchableOpacity>
            </View>
            
            <FlatList
              data={filteredGoals}
              keyExtractor={item => item.id.toString()}
              renderItem={({ item }) => (
                <GoalCard 
                  goal={item} 
                  onPress={() => handleGoalPress(item.id)} 
                />
              )}
              ListHeaderComponent={renderHeader}
              ListEmptyComponent={(
                <View style={styles.emptyContainer}>
                  <View style={styles.emptyIconContainer}>
                    <Ionicons name="flag" size={64} color={COLORS.neutral[300]} />
                  </View>
                  <Text style={styles.emptyText}>
                    {activeFilter === 'all' 
                      ? "You don't have any goals yet" 
                      : `No ${activeFilter} goals found`
                    }
                  </Text>
                  <Text style={styles.emptySubtext}>
                    Create a goal to start tracking your financial progress
                  </Text>
                </View>
              )}
              contentContainerStyle={styles.listContent}
              refreshControl={
                <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
              }
            />
          </>
        )}
      </View>
      
      {/* Add Goal FAB */}
      <View style={styles.fabContainer}>
        <TouchableOpacity 
          style={styles.fab}
          onPress={() => router.push('/add-goal')}
        >
          <Ionicons name="add" size={24} color={COLORS.white} />
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
  mainHeader: {
    backgroundColor: COLORS.primary.main,
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
    ...SHADOWS.medium,
  },
  screenTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.white,
    textAlign: 'center',
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
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
  headerContainer: {
    flexDirection: 'row',
    marginBottom: 24,
    marginTop: 16,
  },
  summaryCard: {
    flex: 1,
    borderRadius: 16,
    padding: 12,
    marginHorizontal: 4,
    ...SHADOWS.small,
  },
  summaryIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  summaryTitle: {
    fontSize: 12,
    fontWeight: '500',
    color: COLORS.white,
    opacity: 0.9,
    marginBottom: 8,
  },
  summaryDetails: {
    marginTop: 4,
  },
  summaryAmount: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.white,
    marginBottom: 6,
  },
  summarySubtext: {
    fontSize: 12,
    fontWeight: '400',
    opacity: 0.8,
  },
  summaryProgressContainer: {
    height: 4,
    backgroundColor: 'rgba(255,255,255,0.3)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  summaryProgress: {
    height: '100%',
    backgroundColor: COLORS.white,
  },
  filterContainer: {
    flexDirection: 'row',
    backgroundColor: COLORS.neutral[200],
    borderRadius: 8,
    padding: 2,
    marginVertical: 16,
  },
  filterButton: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 6,
  },
  activeFilterButton: {
    backgroundColor: COLORS.white,
    ...SHADOWS.small,
  },
  filterText: {
    fontWeight: '500',
    color: COLORS.neutral[600],
  },
  activeFilterText: {
    color: COLORS.primary.main,
  },
  listContent: {
    paddingBottom: 100, // Extra space for FAB
  },
  goalCard: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    marginBottom: 16,
    padding: 16,
    ...SHADOWS.small,
  },
  goalCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  goalIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  goalTitleContainer: {
    flex: 1,
  },
  goalTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.neutral[800],
    marginBottom: 4,
  },
  goalType: {
    fontSize: 12,
    color: COLORS.neutral[500],
  },
  goalProgress: {
    
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  progressText: {
    fontSize: 14,
    color: COLORS.neutral[600],
  },
  progressPercentage: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.neutral[800],
  },
  progressBarContainer: {
    height: 8,
    backgroundColor: COLORS.neutral[200],
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressBar: {
    height: '100%',
    borderRadius: 4,
  },
  remainingText: {
    fontSize: 12,
    color: COLORS.neutral[500],
    textAlign: 'right',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    marginTop: 24,
  },
  emptyIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: COLORS.neutral[100],
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.neutral[700],
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: 14,
    color: COLORS.neutral[500],
    textAlign: 'center',
    marginBottom: 24,
  },
  fabContainer: {
    position: 'absolute',
    right: 24,
    bottom: 24,
  },
  fab: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: COLORS.primary.main,
    justifyContent: 'center',
    alignItems: 'center',
    ...SHADOWS.medium,
  },
});

export default Goals;