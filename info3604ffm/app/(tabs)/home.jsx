// app/(tabs)/home.jsx
import React, { useEffect, useState, useCallback } from 'react';
import { 
  View, 
  Text, 
  ScrollView, 
  RefreshControl, 
  ActivityIndicator, 
  TouchableOpacity,
  StatusBar,
  Image
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { expenseService, profileService, budgetService, familyService } from '../../services/api';
import { COLORS, SPACING, SHADOWS } from '../../constants/theme';

// Import our custom components
import Card from '../../components/Card';
import Button from '../../components/Button';

const HomeScreen = () => {
  // State variables
  const [userData, setUserData] = useState({
    username: '',
    income: 0,
    expenses: [],
    budgetStatus: { total: 0, used: 0, remaining: 0 },
    family: null,
    streak: { count: 0 }
  });
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentMonth, setCurrentMonth] = useState('');

  // Set current month when component mounts
  useEffect(() => {
    const months = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    const now = new Date();
    setCurrentMonth(months[now.getMonth()]);
  }, []);

  // Format currency helper
  const formatCurrency = (amount) => {
    return `$${parseFloat(amount).toFixed(2)}`;
  };

  // Function to fetch all required data
  const fetchData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Fetch user profile
      const profile = await profileService.getUserProfile();
      const income = parseFloat(profile?.monthly_income || 0);
      const username = profile?.username || '';
      
      // Fetch recent expenses
      const expenses = await expenseService.getRecentExpenses();
      
      // Get budget overview
      let budgetStatus = { total: 0, used: 0, remaining: 0 };
      try {
        const budgets = await budgetService.getBudgets();
        
        // Calculate totals
        budgetStatus.total = budgets.reduce((sum, b) => sum + parseFloat(b.amount || 0), 0);
        budgetStatus.used = budgets.reduce((sum, b) => sum + parseFloat(b.used_amount || 0), 0);
        budgetStatus.remaining = budgetStatus.total - budgetStatus.used;
      } catch (budgetError) {
        console.warn('Error fetching budget data:', budgetError);
      }
      
      // Check if user has a family
      let family = null;
      try {
        family = await familyService.getCurrentUserFamily();
      } catch (familyError) {
        console.warn('No family data found:', familyError);
      }

      // Get streak data
      let streak = { count: 0 };
      try {
        const streakData = await streakService.getStreak();
        streak = streakData;
      } catch (streakError) {
        console.warn('Error fetching streak data:', streakError);
      }
      
      // Update state with all fetched data
      setUserData({
        username,
        income,
        expenses,
        budgetStatus,
        family,
        streak
      });
    } catch (error) {
      console.error('Error fetching home screen data:', error);
      setError('Unable to load your data. Pull down to refresh.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Initial data fetch
  useEffect(() => {
    fetchData();
  }, []);

  // Refresh when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      console.log('Home screen in focus - refreshing data');
      fetchData();
      return () => {};
    }, [])
  );

  // Pull-to-refresh handler
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchData();
  }, []);

  // Calculate spending percentage for progress bar
  const spendingPercentage = userData.income > 0 
    ? Math.min(100, (userData.budgetStatus.used / userData.income) * 100) 
    : 0;

  if (loading && !refreshing) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.background.primary }}>
        <StatusBar barStyle="dark-content" backgroundColor={COLORS.background.primary} />
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color={COLORS.primary.main} />
          <Text style={{ marginTop: 16, color: COLORS.neutral[600] }}>
            Loading your financial dashboard...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.background.primary }}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.background.primary} />
      
      {/* Header with greeting and profile */}
      <View style={{ 
        flexDirection: 'row', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 12,
      }}>
        <View>
          <Text style={{ fontSize: 16, color: COLORS.neutral[500] }}>
            Welcome back,
          </Text>
          <Text style={{ fontSize: 20, fontWeight: '700', color: COLORS.neutral[800] }}>
            {userData.username || 'Friend'}
          </Text>
        </View>
        
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          {/* Streak indicator */}
          <TouchableOpacity
            onPress={() => router.push('/streak-stats')}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              backgroundColor: COLORS.primary.light,
              paddingHorizontal: 12,
              paddingVertical: 6,
              borderRadius: 16,
              marginRight: 10,
              ...SHADOWS.small
            }}
          >
            <Ionicons name="flame" size={18} color="#FF9500" />
            <Text style={{ 
              marginLeft: 4, 
              fontWeight: '600', 
              color: COLORS.primary.main 
            }}>
              {userData.streak?.count || 0}
            </Text>
          </TouchableOpacity>
          
          {/* User profile icon */}
          <TouchableOpacity 
            onPress={() => router.push('/profile')}
            style={{
              height: 42,
              width: 42,
              borderRadius: 21,
              backgroundColor: COLORS.primary.light,
              justifyContent: 'center',
              alignItems: 'center',
              ...SHADOWS.small
            }}
          >
            <Ionicons name="person" size={24} color={COLORS.primary.main} />
          </TouchableOpacity>
        </View>
      </View>
      
      <ScrollView 
        contentContainerStyle={{ paddingBottom: 20 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {error && (
          <Card variant="outlined" style={{ marginHorizontal: 16, backgroundColor: COLORS.error.light }}>
            <Text style={{ color: COLORS.error.dark }}>{error}</Text>
            <Button 
              title="Try Again" 
              onPress={fetchData} 
              variant="ghost" 
              size="small" 
              style={{ marginTop: 8 }}
            />
          </Card>
        )}
        
        {/* Financial Overview Card */}
        <Card 
          variant="elevated" 
          style={{ 
            marginHorizontal: 16,
            backgroundColor: COLORS.primary.main,
            paddingVertical: 20
          }}
        >
          <Text style={{ fontSize: 14, color: COLORS.white, opacity: 0.8 }}>
            {currentMonth} Income
          </Text>
          <Text style={{ 
            fontSize: 28, 
            fontWeight: '700', 
            color: COLORS.white,
            marginBottom: 12
          }}>
            {formatCurrency(userData.income)}
          </Text>
          
          {/* Spending progress bar */}
          <View style={{ marginVertical: 8 }}>
            <View style={{ 
              flexDirection: 'row', 
              justifyContent: 'space-between',
              marginBottom: 6 
            }}>
              <Text style={{ fontSize: 12, color: COLORS.white, opacity: 0.8 }}>
                Spending
              </Text>
              <Text style={{ fontSize: 12, color: COLORS.white }}>
                {formatCurrency(userData.budgetStatus.used)} / {formatCurrency(userData.income)}
              </Text>
            </View>
            
            <View style={{ 
              height: 8, 
              backgroundColor: 'rgba(255,255,255,0.2)', 
              borderRadius: 4, 
              overflow: 'hidden'
            }}>
              <View 
                style={{ 
                  width: `${spendingPercentage}%`, 
                  height: '100%', 
                  backgroundColor: spendingPercentage > 80 ? COLORS.error.main : COLORS.secondary.main,
                  borderRadius: 4
                }} 
              />
            </View>
          </View>
          
          {/* Quick actions */}
          <View style={{ 
            flexDirection: 'row', 
            marginTop: 16,
            justifyContent: 'space-between'
          }}>
            <TouchableOpacity
              onPress={() => router.push('/expense-tracking')}
              style={{
                flex: 1,
                marginRight: 8,
                backgroundColor: 'white',
                borderRadius: 12,
                paddingVertical: 10,
                paddingHorizontal: 16,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                ...SHADOWS.small
              }}
            >
              <Ionicons name="add-circle-outline" size={18} color={COLORS.primary.main} />
              <Text style={{ 
                marginLeft: 6, 
                fontWeight: '600', 
                fontSize: 14,
                color: COLORS.neutral[800] 
              }}>
                Add Expense
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              onPress={() => router.push('/budget')}
              style={{
                flex: 1,
                marginLeft: 8,
                backgroundColor: 'white',
                borderRadius: 12,
                paddingVertical: 10,
                paddingHorizontal: 16,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                ...SHADOWS.small
              }}
            >
              <Ionicons name="wallet-outline" size={18} color={COLORS.primary.main} />
              <Text style={{ 
                marginLeft: 6, 
                fontWeight: '600', 
                fontSize: 14,
                color: COLORS.neutral[800] 
              }}>
                View Budgets
              </Text>
            </TouchableOpacity>
          </View>
        </Card>
        
        {/* Recent Transactions Section */}
        <View style={{ marginTop: 24, paddingHorizontal: 16 }}>
          <View style={{ 
            flexDirection: 'row', 
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 12
          }}>
            <Text style={{ 
              fontSize: 18, 
              fontWeight: '600', 
              color: COLORS.neutral[800] 
            }}>
              Recent Transactions
            </Text>
            <TouchableOpacity onPress={() => router.push('/expenses')}>
              <Text style={{ color: COLORS.primary.main, fontWeight: '500' }}>See All</Text>
            </TouchableOpacity>
          </View>
          
          {userData.expenses.length === 0 ? (
            <Card variant="outlined" style={{ backgroundColor: COLORS.background.secondary }}>
              <View style={{ alignItems: 'center', padding: 16 }}>
                <Ionicons name="receipt-outline" size={48} color={COLORS.neutral[400]} />
                <Text style={{ 
                  marginTop: 8, 
                  fontSize: 16, 
                  color: COLORS.neutral[600],
                  textAlign: 'center' 
                }}>
                  No recent transactions
                </Text>
                <Button 
                  title="Record An Expense"
                  variant="primary"
                  size="small"
                  iconName="add-circle-outline"
                  onPress={() => router.push('/expense-tracking')}
                  style={{ marginTop: 16 }}
                />
              </View>
            </Card>
          ) : (
            userData.expenses.slice(0, 4).map((expense, index) => (
              <Card 
                key={expense.id || index}
                variant="outlined" 
                style={{ 
                  marginVertical: 6,
                  paddingVertical: 12,
                  paddingHorizontal: 16, 
                  backgroundColor: COLORS.white
                }}
                pressable
                onPress={() => router.push('/expenses')}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                    <View style={{
                      width: 40,
                      height: 40,
                      borderRadius: 20,
                      backgroundColor: COLORS.background.secondary,
                      justifyContent: 'center',
                      alignItems: 'center',
                      marginRight: 12
                    }}>
                      <Ionicons name="cart-outline" size={20} color={COLORS.neutral[600]} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text 
                        style={{ 
                          fontSize: 16, 
                          fontWeight: '500', 
                          color: COLORS.neutral[800],
                          marginBottom: 4
                        }}
                        numberOfLines={1}
                      >
                        {expense.description}
                      </Text>
                      
                      {expense.budget?.name && (
                        <Text style={{ fontSize: 12, color: COLORS.neutral[500] }} numberOfLines={1}>
                          {expense.budget.name}
                        </Text>
                      )}
                    </View>
                  </View>
                  
                  <Text style={{ 
                    fontSize: 16, 
                    fontWeight: '600', 
                    color: COLORS.error.main 
                  }}>
                    -{formatCurrency(expense.amount)}
                  </Text>
                </View>
              </Card>
            ))
          )}
        </View>
        
        {/* Quick Actions Section */}
        <View style={{ marginTop: 24, paddingHorizontal: 16 }}>
          <Text style={{ 
            fontSize: 18, 
            fontWeight: '600', 
            color: COLORS.neutral[800],
            marginBottom: 12 
          }}>
            Quick Actions
          </Text>
          
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginHorizontal: -8 }}>
            {[
              { 
                title: 'Goals', 
                icon: 'flag-outline', 
                color: COLORS.secondary.main,
                route: '/goals'
              },
              { 
                title: 'Family', 
                icon: 'people-outline', 
                color: COLORS.success.main,
                route: '/family'
              },
              { 
                title: 'Budget', 
                icon: 'wallet-outline', 
                color: COLORS.primary.main,
                route: '/budget'
              },
              { 
                title: 'Report', 
                icon: 'bar-chart-outline', 
                color: COLORS.error.main,
                route: '/expenses'
              },
            ].map((action, index) => (
              <TouchableOpacity 
                key={index}
                onPress={() => router.push(action.route)}
                style={{ 
                  width: '50%', 
                  paddingHorizontal: 8,
                  marginBottom: 16
                }}
              >
                <View style={{
                  backgroundColor: COLORS.white,
                  borderRadius: 12,
                  padding: 16,
                  alignItems: 'center',
                  ...SHADOWS.small
                }}>
                  <View style={{
                    width: 50,
                    height: 50,
                    borderRadius: 25,
                    backgroundColor: `${action.color}20`,
                    justifyContent: 'center',
                    alignItems: 'center',
                    marginBottom: 12
                  }}>
                    <Ionicons name={action.icon} size={24} color={action.color} />
                  </View>
                  <Text style={{ fontWeight: '500', color: COLORS.neutral[700] }}>
                    {action.title}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </View>
        
        {/* Family Section - show only if user has a family */}
        {userData.family && (
          <View style={{ marginTop: 24, paddingHorizontal: 16, marginBottom: 16 }}>
            <Text style={{ 
              fontSize: 18, 
              fontWeight: '600', 
              color: COLORS.neutral[800],
              marginBottom: 12 
            }}>
              Family Finance
            </Text>
            
            <Card 
              variant="elevated"
              style={{
                padding: 0,
                overflow: 'hidden',
                backgroundColor: COLORS.white
              }}
              pressable
              onPress={() => router.push('/family')}
            >
              <View style={{
                backgroundColor: COLORS.primary.light + '40',
                padding: 16,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <View style={{
                    width: 40,
                    height: 40,
                    borderRadius: 20,
                    backgroundColor: COLORS.primary.main + '30',
                    justifyContent: 'center',
                    alignItems: 'center',
                    marginRight: 12
                  }}>
                    <Ionicons name="people" size={22} color={COLORS.primary.main} />
                  </View>
                  <View>
                    <Text style={{ fontSize: 16, fontWeight: '600', color: COLORS.neutral[800] }}>
                      {userData.family.name} Family
                    </Text>
                    <Text style={{ fontSize: 12, color: COLORS.neutral[500] }}>
                      {userData.family.members_count || '0'} members
                    </Text>
                  </View>
                </View>
                <Ionicons name="chevron-forward" size={20} color={COLORS.neutral[400]} />
              </View>
              
              <View style={{ padding: 16, flexDirection: 'row' }}>
                <TouchableOpacity 
                  onPress={() => router.push('/family-budget')}
                  style={{ 
                    flex: 1, 
                    alignItems: 'center',
                    paddingHorizontal: 8, 
                    paddingVertical: 12,
                    borderRightWidth: 1,
                    borderRightColor: COLORS.neutral[200]
                  }}
                >
                  <Ionicons name="wallet-outline" size={24} color={COLORS.primary.main} />
                  <Text style={{ marginTop: 8, color: COLORS.neutral[700], fontWeight: '500' }}>
                    Budget
                  </Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  onPress={() => router.push('/family-goals')}
                  style={{ 
                    flex: 1, 
                    alignItems: 'center',
                    paddingHorizontal: 8, 
                    paddingVertical: 12
                  }}
                >
                  <Ionicons name="flag-outline" size={24} color={COLORS.primary.main} />
                  <Text style={{ marginTop: 8, color: COLORS.neutral[700], fontWeight: '500' }}>
                    Goals
                  </Text>
                </TouchableOpacity>
              </View>
            </Card>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

export default HomeScreen;