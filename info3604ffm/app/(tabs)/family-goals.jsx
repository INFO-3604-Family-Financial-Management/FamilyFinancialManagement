import { View, Text, TouchableOpacity, ActivityIndicator, FlatList, RefreshControl, StyleSheet, StatusBar } from 'react-native'
import React, { useState, useEffect } from 'react'
import { router } from 'expo-router'
import { useFocusEffect } from '@react-navigation/native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import CustomButton from '@/components/CustomButton'
import { goalService, familyService } from '../../services/api'
import { COLORS, SHADOWS, BORDER_RADIUS } from '../../constants/theme'

const FamilyGoals = () => {
  const [goals, setGoals] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [familyId, setFamilyId] = useState(null);
  const [familyName, setFamilyName] = useState('');

  const fetchFamilyGoals = async () => {
    try {
      // First get the family ID - using getCurrentUserFamily instead of getFamily
      const family = await familyService.getCurrentUserFamily();
      if (!family || !family.id) {
        setIsLoading(false);
        return;
      }
      
      setFamilyId(family.id);
      if (family.name) {
        setFamilyName(family.name);
      }
      
      // Then fetch all goals
      const allGoals = await goalService.getGoals();
      
      // Filter out family goals for this family
      const familyGoals = allGoals.filter(goal => 
        goal.family && goal.family.toString() === family.id.toString() && !goal.is_personal
      );
      
      setGoals(familyGoals || []);
    } catch (error) {
      console.error('Error fetching family goals:', error);
      Alert.alert("Error", "Failed to load family goals");
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  // Fetch goals when component mounts
  useEffect(() => {
    fetchFamilyGoals();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchFamilyGoals();
  };

  const navigateToEditGoal = (goalId) => {
    router.push({
      pathname: 'edit-family-goal',
      params: { goalId }
    });
  };

  // Format currency
  const formatCurrency = (amount) => {
    return `$${parseFloat(amount).toFixed(2)}`;
  };

  // Calculate progress bar color based on percentage
  const getProgressBarColor = (progress) => {
    if (progress >= 100) return COLORS.success.main;
    if (progress >= 75) return COLORS.primary.main;
    if (progress >= 50) return COLORS.secondary.main;
    return COLORS.neutral[400];
  };

  const renderGoalItem = ({ item }) => {
    // Calculate progress percentage
    const progress = parseFloat(item.progress_percentage) || 0;
    const goalType = item.goal_type === 'saving';
    
    return (
      <TouchableOpacity 
        style={styles.goalCard}
        onPress={() => navigateToEditGoal(item.id)}
        activeOpacity={0.7}
      >
        <View style={styles.goalCardHeader}>
          <View style={styles.goalIconContainer}>
            <Ionicons 
              name={goalType ? 'wallet-outline' : 'cart-outline'} 
              size={20} 
              color={goalType ? COLORS.success.main : COLORS.primary.main} 
            />
          </View>
          <View style={styles.goalInfo}>
            <Text style={styles.goalName}>{item.name}</Text>
            <Text style={[
              styles.goalType,
              { color: goalType ? COLORS.success.main : COLORS.primary.main }
            ]}>
              {goalType ? 'Saving' : 'Spending'} Goal
            </Text>
          </View>
        </View>
        
        <View style={styles.goalAmounts}>
          <Text style={styles.amountText}>
            {formatCurrency(item.progress || 0)} <Text style={styles.ofText}>of</Text> {formatCurrency(item.amount)}
          </Text>
          <Text style={styles.percentageText}>
            {progress.toFixed(0)}%
          </Text>
        </View>
        
        {/* Progress bar */}
        <View style={styles.progressContainer}>
          <View style={styles.progressBackground}>
            <View 
              style={[
                styles.progressFill, 
                { 
                  width: `${Math.min(progress, 100)}%`,
                  backgroundColor: getProgressBarColor(progress)
                }
              ]} 
            />
          </View>
          
          {progress < 100 && (
            <Text style={styles.remainingText}>
              {formatCurrency(item.amount - (item.progress || 0))} to go
            </Text>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  const renderEmptyList = () => (
    <View style={styles.emptyContainer}>
      {!isLoading && (
        <>
          <Ionicons name="flag-outline" size={60} color={COLORS.neutral[400]} />
          <Text style={styles.emptyTitle}>
            {!familyId 
              ? "Join a Family First" 
              : "No Family Goals Found"}
          </Text>
          <Text style={styles.emptyText}>
            {!familyId 
              ? "You need to join a family to see shared goals." 
              : "Create your first family goal to start tracking shared objectives."}
          </Text>
          {!familyId && (
            <CustomButton
              title="Go to Family"
              handlePress={() => router.push('family')}
              containerStyles="mt-6"
            />
          )}
        </>
      )}
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.primary.main} />
      
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Family Goals</Text>
        {familyName && (
          <Text style={styles.familyName}>{familyName} Family</Text>
        )}
      </View>
      
      <View style={styles.contentContainer}>
        {/* Content based on state */}
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={COLORS.primary.main} />
            <Text style={styles.loadingText}>Loading family goals...</Text>
          </View>
        ) : (
          <FlatList
            data={goals}
            keyExtractor={(item) => item.id.toString()}
            renderItem={renderGoalItem}
            ListEmptyComponent={renderEmptyList}
            refreshControl={
              <RefreshControl 
                refreshing={refreshing} 
                onRefresh={onRefresh}
                colors={[COLORS.primary.main]}
                tintColor={COLORS.primary.main}
              />
            }
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.listContent}
          />
        )}
      </View>

      {/* Add Goal Button */}
      <View style={styles.buttonContainer}>
        <CustomButton
          title="Add Family Goal"
          handlePress={() => router.push('add-family-goal')}
          disabled={!familyId}
          iconName="add-circle-outline"
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
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    backgroundColor: COLORS.white,
    borderRadius: 16,
    ...SHADOWS.small,
    marginTop: 16,
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
    marginBottom: 16,
  },
  listContent: {
    paddingBottom: 100, // Extra space for button
    flexGrow: 1,
  },
  goalCard: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    ...SHADOWS.small,
  },
  goalCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  goalIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.primary.light + '20',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  goalInfo: {
    flex: 1,
  },
  goalName: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.neutral[800],
  },
  goalType: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.neutral[600],
  },
  goalAmounts: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  amountText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.neutral[800],
  },
  ofText: {
    fontSize: 14,
    color: COLORS.neutral[600],
  },
  percentageText: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.neutral[600],
  },
  progressContainer: {
    marginTop: 8,
  },
  progressBackground: {
    height: 8,
    backgroundColor: COLORS.neutral[200],
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: 8,
    borderRadius: 4,
  },
  remainingText: {
    fontSize: 12,
    color: COLORS.neutral[600],
    marginTop: 4,
  },
  buttonContainer: {
    padding: 16,
    backgroundColor: COLORS.background.primary,
  },
});

export default FamilyGoals;