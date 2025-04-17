import { View, Text, SafeAreaView, ActivityIndicator, StatusBar, StyleSheet } from 'react-native'
import React, { useState, useEffect, useCallback } from 'react'
import { useFocusEffect } from '@react-navigation/native'
import { Ionicons } from '@expo/vector-icons'
import { familyService, familyFinanceService } from '../../services/api'
import { COLORS, SHADOWS, BORDER_RADIUS } from '../../constants/theme'

const FamilySavings = () => {
  const [loading, setLoading] = useState(true);
  const [currentMonth, setCurrentMonth] = useState('');
  const [totalIncome, setTotalIncome] = useState(0);
  const [totalSpent, setTotalSpent] = useState(0);
  const [totalRemaining, setTotalRemaining] = useState(0);
  const [error, setError] = useState(null);
  const [familyName, setFamilyName] = useState('');

  const fetchFamilySavings = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Get the current month name
      const monthNames = [
        "January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"
      ];
      const now = new Date();
      setCurrentMonth(monthNames[now.getMonth()]);
      
      // Get family financial data from our new API endpoint
      console.log('Fetching family financial data...');
      const financialData = await familyFinanceService.getFamilyFinancialData();
      console.log('Retrieved family financial data:', financialData);
      
      // Set family name
      if (financialData.family && financialData.family.name) {
        setFamilyName(financialData.family.name);
      }
      
      // Set income, expenses, and savings
      if (financialData.finances) {
        setTotalIncome(parseFloat(financialData.finances.total_income) || 0);
        setTotalSpent(parseFloat(financialData.finances.total_expenses) || 0);
        setTotalRemaining(parseFloat(financialData.finances.total_savings) || 0);
      }
      
    } catch (err) {
      console.error('Failed to fetch family savings:', err);
      
      // Try fallback approach if the main endpoint fails
      try {
        console.log('Trying fallback approach...');
        
        // Get family details
        const family = await familyService.getCurrentUserFamily();
        if (family && family.name) {
          setFamilyName(family.name);
        }
        
        // Get income and expenses separately
        const incomeData = await familyFinanceService.getFamilyIncome();
        const expenseData = await familyFinanceService.getFamilyExpenses();
        
        const income = parseFloat(incomeData.total_income) || 0;
        const expenses = parseFloat(expenseData.total_expenses) || 0;
        const savings = income > expenses ? income - expenses : 0;
        
        setTotalIncome(income);
        setTotalSpent(expenses);
        setTotalRemaining(savings);
        
      } catch (fallbackErr) {
        console.error('Fallback approach also failed:', fallbackErr);
        setError('Failed to load savings data. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  // Initial fetch when component mounts
  useEffect(() => {
    fetchFamilySavings();
  }, []);

  // Refresh data when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      console.log('Family savings screen in focus - refreshing data');
      fetchFamilySavings();
      
      return () => {
        // Optional cleanup function
        console.log('Family savings screen lost focus');
      };
    }, [])
  );
  
  // Format currency values
  const formatCurrency = (amount) => {
    return `$${parseFloat(amount).toFixed(2)}`;
  };
  
  // Calculate percentages based on total income
  const spentPercentage = totalIncome > 0 ? (totalSpent / totalIncome * 100) : 0;
  const remainingPercentage = totalIncome > 0 ? (totalRemaining / totalIncome * 100) : 0;

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.primary.main} />
      
      <View style={styles.header}>
        <Text style={styles.headerTitle}>
          {familyName ? `${familyName} Savings` : 'Family Savings'}
        </Text>
      </View>
      
      <View style={styles.mainCard}>
        <Text style={styles.monthTitle}>
          {currentMonth}
        </Text>  
        
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={COLORS.primary.main} />
            <Text style={styles.loadingText}>Loading savings data...</Text>
          </View>
        ) : error ? (
          <View style={styles.errorContainer}>
            <Ionicons name="alert-circle-outline" size={60} color={COLORS.error.light} />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : (
          <View style={styles.dashboard}>
            {totalIncome > 0 ? (
              <View>
                {/* Large Savings Percentage Display */}
                <View style={styles.savingsRateContainer}>
                  <Text style={styles.savingsRateLabel}>SAVINGS RATE</Text>
                  <Text style={styles.savingsRateValue}>
                    {Math.round(remainingPercentage)}%
                  </Text>
                  <Text style={styles.savingsRateSubtitle}>
                    of monthly family income
                  </Text>
                </View>
                
                {/* Simple Bar Visualization */}
                <View style={styles.barContainer}>
                  <View style={styles.barBackground}>
                    <View 
                      style={[
                        styles.barSpent, 
                        { width: `${spentPercentage}%` }
                      ]} 
                    />
                    <View 
                      style={[
                        styles.barSaved, 
                        { width: `${remainingPercentage}%` }
                      ]} 
                    />
                  </View>
                  
                  {/* Legend */}
                  <View style={styles.legendContainer}>
                    <View style={styles.legendItem}>
                      <View style={styles.legendDotSpent} />
                      <Text style={styles.legendText}>Spent ({Math.round(spentPercentage)}%)</Text>
                    </View>
                    <View style={styles.legendItem}>
                      <View style={styles.legendDotSaved} />
                      <Text style={styles.legendText}>Saved ({Math.round(remainingPercentage)}%)</Text>
                    </View>
                  </View>
                </View>
                
                {/* Monthly Spending Summary */}
                <View style={styles.summaryCard}>
                  <Text style={styles.summaryTitle}>MONTHLY SUMMARY</Text>
                  <View style={styles.summaryRow}>
                    <Text style={styles.summaryLabel}>Total Income</Text>
                    <Text style={styles.summaryValue}>{formatCurrency(totalIncome)}</Text>
                  </View>
                  <View style={styles.summaryRow}>
                    <Text style={styles.summaryLabel}>Total Spent</Text>
                    <Text style={styles.spentValue}>{formatCurrency(totalSpent)}</Text>
                  </View>
                  <View style={styles.divider} />
                  <View style={styles.summaryRow}>
                    <Text style={styles.summaryLabel}>Remaining</Text>
                    <Text style={styles.savedValue}>{formatCurrency(totalRemaining)}</Text>
                  </View>
                </View>
              </View>
            ) : (
              <Text style={styles.noDataText}>
                No income data available for this month
              </Text>
            )}
          </View>
        )}
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background.primary,
  },
  header: {
    marginTop: 40,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.neutral[800],
  },
  mainCard: {
    backgroundColor: COLORS.white,
    padding: 16,
    borderRadius: 16,
    margin: 16,
    marginTop: 40,
    height: '65%',
    ...SHADOWS.medium,
  },
  monthTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.neutral[800],
    textAlign: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 40,
  },
  loadingText: {
    marginTop: 8,
    color: COLORS.neutral[600],
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 40,
  },
  errorText: {
    color: COLORS.error.main,
    textAlign: 'center',
  },
  dashboard: {
    marginVertical: 24,
    paddingHorizontal: 16,
  },
  savingsRateContainer: {
    marginBottom: 32,
  },
  savingsRateLabel: {
    fontSize: 14,
    color: COLORS.neutral[600],
  },
  savingsRateValue: {
    fontSize: 60,
    fontWeight: 'bold',
    color: COLORS.primary.main,
  },
  savingsRateSubtitle: {
    fontSize: 14,
    color: COLORS.neutral[500],
    marginTop: 4,
  },
  barContainer: {
    marginBottom: 32,
  },
  barBackground: {
    height: 32,
    backgroundColor: COLORS.neutral[200],
    borderRadius: BORDER_RADIUS.medium,
    overflow: 'hidden',
    flexDirection: 'row',
  },
  barSpent: {
    height: '100%',
    backgroundColor: COLORS.error.main,
  },
  barSaved: {
    height: '100%',
    backgroundColor: COLORS.primary.main,
  },
  legendContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  legendDotSpent: {
    width: 12,
    height: 12,
    backgroundColor: COLORS.error.main,
    borderRadius: 6,
    marginRight: 4,
  },
  legendDotSaved: {
    width: 12,
    height: 12,
    backgroundColor: COLORS.primary.main,
    borderRadius: 6,
    marginRight: 4,
  },
  legendText: {
    color: COLORS.neutral[700],
  },
  summaryCard: {
    backgroundColor: COLORS.neutral[100],
    padding: 16,
    borderRadius: BORDER_RADIUS.medium,
  },
  summaryTitle: {
    fontSize: 14,
    color: COLORS.neutral[600],
    marginBottom: 8,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  summaryLabel: {
    color: COLORS.neutral[600],
  },
  summaryValue: {
    fontWeight: 'bold',
  },
  spentValue: {
    color: COLORS.error.main,
  },
  savedValue: {
    color: COLORS.primary.main,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.neutral[300],
    marginVertical: 8,
  },
  noDataText: {
    color: COLORS.neutral[500],
    textAlign: 'center',
    marginTop: 40,
  },
});

export default FamilySavings