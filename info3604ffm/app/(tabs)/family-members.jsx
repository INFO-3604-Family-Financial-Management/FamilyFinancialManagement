import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, SafeAreaView, RefreshControl, Alert, StyleSheet, StatusBar, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import CustomButton from '../../components/CustomButton';
import { familyManagementService, familyService } from '../../services/api';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SHADOWS, BORDER_RADIUS } from '../../constants/theme';

const FamilyMembers = () => {
  const [familyMembers, setFamilyMembers] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [familyData, setFamilyData] = useState(null);

  const fetchFamilyData = async () => {
    try {
      // First get all families (to get the current family's ID)
      const family = await familyService.getCurrentUserFamily();
      if (family) {
        setFamilyData(family);
        return family.id;
      }
      return null;
    } catch (error) {
      console.error('Error fetching family data:', error);
      return null;
    }
  };

  const fetchFamilyMembers = async () => {
    try {
      setLoading(true);
      const response = await familyManagementService.getFamilyMembers();
      console.log('Family members response:', response);
      setFamilyMembers(response);
    } catch (error) {
      console.error('Error fetching family members:', error);
      Alert.alert('Error', 'Failed to load family members');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // This will run once on component mount
  useEffect(() => {
    const loadInitialData = async () => {
      await fetchFamilyData();
      await fetchFamilyMembers();
    };
    
    loadInitialData();
  }, []);

  // This will run every time the screen comes into focus
  useFocusEffect(
    useCallback(() => {
      console.log('Family members screen in focus - refreshing data');
      const refreshData = async () => {
        await fetchFamilyData();
        await fetchFamilyMembers();
      };
      
      refreshData();
      
      return () => {
        // Optional cleanup function
      };
    }, [])
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchFamilyData();
    await fetchFamilyMembers();
  }, []);

  const handleAddMember = () => {
    if (!familyData) {
      // If no family exists yet, create one first
      Alert.alert(
        "No Family",
        "You need to create a family first",
        [{ text: "OK", onPress: () => router.push('/family') }]
      );
    } else {
      // Otherwise go to add member screen
      router.push('/add-family-member');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.primary.main} />

      <View style={styles.header}>
        <Text style={styles.headerTitle}>Family Members</Text>
        {familyData && (
          <Text style={styles.familyName}>{familyData.name} Family</Text>
        )}
      </View>

      <View style={styles.contentContainer}>
        {loading && !refreshing ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={COLORS.primary.main} />
            <Text style={styles.loadingText}>Loading family members...</Text>
          </View>
        ) : familyMembers.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="people-outline" size={60} color={COLORS.neutral[400]} />
            <Text style={styles.emptyTitle}>No Family Members</Text>
            <Text style={styles.emptyText}>
              {familyData 
                ? "Add family members to start sharing financial goals and budgets." 
                : "You need to create a family first."}
            </Text>
          </View>
        ) : (
          <FlatList
            data={familyMembers}
            keyExtractor={(item, index) => `${item.id || item.username || index}`}
            renderItem={({ item }) => (
              <TouchableOpacity 
                style={styles.memberCard}
                onPress={() => router.push({
                  pathname: '/edit-family',
                  params: { username: item.username }
                })}
                activeOpacity={0.7}
              >
                <View style={styles.memberAvatarContainer}>
                  <Text style={styles.memberInitials}>
                    {item.username ? item.username.charAt(0).toUpperCase() : "?"}
                  </Text>
                </View>
                <View style={styles.memberInfo}>
                  <Text style={styles.memberName}>{item.username}</Text>
                  <Text style={styles.memberEmail}>{item.email}</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color={COLORS.neutral[400]} />
              </TouchableOpacity>
            )}
            refreshControl={
              <RefreshControl 
                refreshing={refreshing} 
                onRefresh={onRefresh}
                colors={[COLORS.primary.main]}
                tintColor={COLORS.primary.main}
              />
            }
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
          />
        )}
      </View>

      <View style={styles.buttonContainer}>
        <CustomButton
          title="Add Family Member"
          handlePress={handleAddMember}
          iconName="person-add-outline"
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
    marginBottom: 80, // Space for button
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
  listContent: {
    paddingVertical: 8,
    flexGrow: 1,
  },
  memberCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    ...SHADOWS.small,
  },
  memberAvatarContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.primary.light + '40',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  memberInitials: {
    fontSize: 20,
    fontWeight: '600',
    color: COLORS.primary.main,
  },
  memberInfo: {
    flex: 1,
  },
  memberName: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.neutral[800],
    marginBottom: 4,
  },
  memberEmail: {
    fontSize: 12,
    color: COLORS.neutral[600],
  },
  buttonContainer: {
    position: 'absolute',
    bottom: 150, // Positioned to avoid tab bar overlap
    left: 0,
    right: 0,
    paddingHorizontal: 16,
  },
});

export default FamilyMembers;