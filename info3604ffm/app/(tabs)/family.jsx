// app/(tabs)/family.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { 
  View, 
  Text, 
  SafeAreaView, 
  TouchableOpacity, 
  ActivityIndicator, 
  ScrollView, 
  StatusBar,
  StyleSheet,
  ImageBackground,
  FlatList,
  RefreshControl
} from 'react-native';
import { router } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { 
  familyService, 
  familyFinanceService, 
  familyManagementService 
} from '../../services/api';
import { COLORS, SPACING, SHADOWS, BORDER_RADIUS } from '../../constants/theme';
import Button from '../../components/Button';
import Card from '../../components/Card';

const gradientBackground = require('../../assets/images/gradient-bg.svg');

const Family = () => {
  // State
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [hasFamily, setHasFamily] = useState(false);
  const [familyData, setFamilyData] = useState(null);
  const [financialData, setFinancialData] = useState({
    totalIncome: 0,
    totalExpenses: 0,
    totalSavings: 0
  });
  const [familyMembers, setFamilyMembers] = useState([]);
  const [error, setError] = useState(null);

  // Format currency helper
  const formatCurrency = (amount) => {
    return `$${parseFloat(amount).toFixed(2)}`;
  };

  // Fetch all family data 
  const fetchFamilyData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Get family information
      const family = await familyService.getCurrentUserFamily();
      
      if (family && family.id) {
        setFamilyData(family);
        setHasFamily(true);
        
        // Fetch family members
        try {
          const members = await familyManagementService.getFamilyMembers();
          setFamilyMembers(members || []);
        } catch (memberError) {
          console.error('Error fetching family members:', memberError);
          setFamilyMembers([]);
        }
        
        // Fetch family financial data
        try {
          const finances = await familyFinanceService.getFamilyFinancialData();
          
          if (finances && finances.finances) {
            setFinancialData({
              totalIncome: parseFloat(finances.finances.total_income || 0),
              totalExpenses: parseFloat(finances.finances.total_expenses || 0),
              totalSavings: parseFloat(finances.finances.total_savings || 0)
            });
          }
        } catch (financeError) {
          console.error('Error fetching family finances:', financeError);
          // Keep default values (0s)
        }
      } else {
        setHasFamily(false);
      }
    } catch (error) {
      console.error('Error fetching family data:', error);
      setError('Failed to load family data. Please try again.');
      setHasFamily(false);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Initial fetch on component mount
  useEffect(() => {
    fetchFamilyData();
  }, []);

  // Refresh when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      console.log('Family screen in focus - refreshing data');
      fetchFamilyData();
      return () => {};
    }, [])
  );

  // Pull-to-refresh handler
  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchFamilyData();
  }, []);
  
  // Family features data for UI grid
  const familyFeatures = [
    {
      id: 'members',
      title: 'Members',
      icon: 'people',
      color: COLORS.primary.main,
      route: 'family-members',
      description: 'Manage family members'
    },
    {
      id: 'budget',
      title: 'Budget',
      icon: 'wallet',
      color: COLORS.secondary.main,
      route: 'family-budget',
      description: 'Track shared expenses'
    },
    {
      id: 'savings',
      title: 'Savings',
      icon: 'trending-up',
      color: COLORS.success.main,
      route: 'family-savings',
      description: 'Monitor savings'
    },
    {
      id: 'goals',
      title: 'Goals',
      icon: 'flag',
      color: COLORS.error.main,
      route: 'family-goals',
      description: 'Set financial goals'
    },
  ];

  // If loading, show spinner
  if (loading && !refreshing) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor={COLORS.primary.main} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary.main} />
          <Text style={styles.loadingText}>Loading family data...</Text>
        </View>
      </SafeAreaView>
    );
  }

  // If no family, show onboarding screen
  if (!hasFamily) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor={COLORS.primary.main} />
        
        <ImageBackground 
          source={gradientBackground} 
          style={styles.gradientBackground}
          resizeMode="cover"
        >
          <View style={styles.noFamilyContent}>
            <View style={styles.iconContainer}>
              <Ionicons name="people" size={80} color={COLORS.primary.main} />
            </View>
            
            <Text style={styles.noFamilyTitle}>
              Create Your Family
            </Text>
            <Text style={styles.noFamilyDescription}>
              Start managing your family finances together. Create a family to invite members, share budgets, and achieve financial goals as a team.
            </Text>
            
            <Button
              title="Create Family"
              variant="primary"
              size="large"
              iconName="add-circle"
              iconPosition="left"
              onPress={() => router.push('create-family')}
              style={styles.createFamilyButton}
            />
          </View>
        </ImageBackground>
      </SafeAreaView>
    );
  }

  // Render family dashboard
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.primary.main} />
      
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Family</Text>
      </View>
      
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onPress={onRefresh} />
        }
      >
        {/* Family Card */}
        <Card variant="elevated" style={styles.familyCard}>
          <View style={styles.familyCardHeader}>
            <View style={styles.familyAvatarContainer}>
              <Ionicons name="people" size={32} color={COLORS.white} />
            </View>
            <View style={styles.familyHeaderContent}>
              <Text style={styles.familyName}>{familyData?.name || 'My Family'}</Text>
              <Text style={styles.memberCount}>
                {familyMembers.length} {familyMembers.length === 1 ? 'member' : 'members'}
              </Text>
            </View>
            
            <TouchableOpacity 
              style={styles.editButton}
              onPress={() => router.push({
                pathname: '/edit-family',
                params: { familyId: familyData?.id }
              })}
            >
              <Ionicons name="pencil" size={18} color={COLORS.white} />
            </TouchableOpacity>
          </View>
          
          {/* Financial summary */}
          <View style={styles.financialSummary}>
            <View style={styles.financialItem}>
              <Text style={styles.financialLabel}>Income</Text>
              <Text style={styles.financialValue}>
                {formatCurrency(financialData.totalIncome)}
              </Text>
            </View>
            
            <View style={styles.divider} />
            
            <View style={styles.financialItem}>
              <Text style={styles.financialLabel}>Expenses</Text>
              <Text style={styles.financialValue}>
                {formatCurrency(financialData.totalExpenses)}
              </Text>
            </View>
            
            <View style={styles.divider} />
            
            <View style={styles.financialItem}>
              <Text style={styles.financialLabel}>Savings</Text>
              <Text style={[
                styles.financialValue, 
                { color: COLORS.success.main }
              ]}>
                {formatCurrency(financialData.totalSavings)}
              </Text>
            </View>
          </View>
        </Card>
        
        {/* Family Members */}
        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Family Members</Text>
            <TouchableOpacity onPress={() => router.push('family-members')}>
              <Text style={styles.seeAllText}>See All</Text>
            </TouchableOpacity>
          </View>
          
          <ScrollView 
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.membersScrollContent}
          >
            {familyMembers.length > 0 ? (
              familyMembers.map((member, index) => (
                <TouchableOpacity 
                  key={member.id || index}
                  style={styles.memberCard}
                  onPress={() => router.push({
                    pathname: '/edit-family',
                    params: { username: member.username }
                  })}
                >
                  <View style={styles.memberAvatarContainer}>
                    <Text style={styles.memberInitial}>
                      {member.username ? member.username[0].toUpperCase() : '?'}
                    </Text>
                  </View>
                  <Text style={styles.memberName} numberOfLines={1}>
                    {member.username || 'Member'}
                  </Text>
                </TouchableOpacity>
              ))
            ) : (
              <Text style={styles.noMembersText}>No family members yet</Text>
            )}
            
            {/* Add member button */}
            <TouchableOpacity 
              style={styles.addMemberCard}
              onPress={() => router.push('add-family-member')}
            >
              <View style={styles.addMemberIcon}>
                <Ionicons name="add" size={24} color={COLORS.primary.main} />
              </View>
              <Text style={styles.addMemberText}>Add Member</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
        
        {/* Family Features Grid */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>Family Finance</Text>
          
          <View style={styles.featuresGrid}>
            {familyFeatures.map((feature) => (
              <TouchableOpacity
                key={feature.id}
                style={styles.featureCard}
                onPress={() => router.push(feature.route)}
              >
                <View style={[
                  styles.featureIconContainer,
                  { backgroundColor: `${feature.color}20` }
                ]}>
                  <Ionicons name={feature.icon} size={24} color={feature.color} />
                </View>
                <Text style={styles.featureTitle}>{feature.title}</Text>
                <Text style={styles.featureDescription}>{feature.description}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
        
        {/* Tips Card */}
        <Card variant="outlined" style={styles.tipsCard}>
          <View style={styles.tipsHeader}>
            <Ionicons name="information-circle" size={20} color={COLORS.primary.main} />
            <Text style={styles.tipsTitle}>Family Finance Tips</Text>
          </View>
          <Text style={styles.tipText}>
            Regular family budget meetings can help keep everyone on the same page with financial goals and responsibilities.
          </Text>
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background.primary,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    color: COLORS.neutral[600],
    fontSize: 16,
  },
  gradientBackground: {
    flex: 1,
    justifyContent: 'center',
    padding: 24,
  },
  noFamilyContent: {
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: 20,
    padding: 24,
    ...SHADOWS.medium,
  },
  iconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: `${COLORS.primary.main}20`,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  noFamilyTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.neutral[800],
    marginBottom: 12,
  },
  noFamilyDescription: {
    fontSize: 16,
    textAlign: 'center',
    color: COLORS.neutral[600],
    marginBottom: 24,
  },
  createFamilyButton: {
    width: '100%',
  },
  header: {
    backgroundColor: COLORS.primary.main,
    paddingTop: 16,
    paddingBottom: 16,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    ...SHADOWS.medium,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.white,
    textAlign: 'center',
  },
  scrollContent: {
    paddingBottom: 40,
  },
  familyCard: {
    margin: 16,
    padding: 0,
    borderRadius: 16,
    overflow: 'hidden',
  },
  familyCardHeader: {
    backgroundColor: COLORS.primary.main,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  familyAvatarContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  familyHeaderContent: {
    flex: 1,
  },
  familyName: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.white,
  },
  memberCount: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
  },
  editButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  financialSummary: {
    flexDirection: 'row',
    padding: 16,
  },
  financialItem: {
    flex: 1,
    alignItems: 'center',
  },
  financialLabel: {
    fontSize: 14,
    color: COLORS.neutral[500],
    marginBottom: 4,
  },
  financialValue: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.neutral[800],
  },
  divider: {
    width: 1,
    height: '100%',
    backgroundColor: COLORS.neutral[200],
  },
  sectionContainer: {
    marginTop: 24,
    paddingHorizontal: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.neutral[800],
  },
  seeAllText: {
    fontSize: 14,
    color: COLORS.primary.main,
    fontWeight: '500',
  },
  membersScrollContent: {
    paddingVertical: 8,
    paddingRight: 8,
  },
  memberCard: {
    width: 80,
    marginRight: 16,
    alignItems: 'center',
  },
  memberAvatarContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: COLORS.primary.light,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
    ...SHADOWS.small,
  },
  memberInitial: {
    fontSize: 24,
    fontWeight: '600',
    color: COLORS.primary.main,
  },
  memberName: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.neutral[700],
    textAlign: 'center',
  },
  addMemberCard: {
    width: 80,
    marginRight: 16,
    alignItems: 'center',
  },
  addMemberIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 2,
    borderColor: COLORS.primary.main,
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  addMemberText: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.primary.main,
    textAlign: 'center',
  },
  noMembersText: {
    color: COLORS.neutral[500],
    alignSelf: 'center',
    marginLeft: 8,
  },
  featuresGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -8,
    marginVertical: 8,
  },
  featureCard: {
    width: '50%',
    paddingHorizontal: 8,
    marginBottom: 16,
  },
  featureCardInner: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 16,
    ...SHADOWS.small,
    height: '100%',
  },
  featureIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  featureTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.neutral[800],
    marginBottom: 4,
  },
  featureDescription: {
    fontSize: 12,
    color: COLORS.neutral[500],
  },
  tipsCard: {
    marginHorizontal: 16,
    marginTop: 24,
    backgroundColor: COLORS.background.secondary,
  },
  tipsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  tipsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.neutral[800],
    marginLeft: 8,
  },
  tipText: {
    fontSize: 14,
    color: COLORS.neutral[600],
    lineHeight: 20,
  }
});

export default Family;