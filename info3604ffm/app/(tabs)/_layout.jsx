import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Tabs, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS, SHADOWS } from '../../constants/theme';

// Custom tab bar component with modern design
const CustomTabBar = ({ state, descriptors, navigation }) => {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  
  // Only show these tabs in the tab bar
  const visibleRoutes = ['home', 'goals', 'expense-tracking', 'family', 'profile'];
  
  const filteredState = {
    ...state,
    routes: state.routes.filter(route => visibleRoutes.includes(route.name)),
    index: state.index > visibleRoutes.length - 1 ? 0 : state.index
  };
  
  return (
    <View style={[
      styles.tabBar,
      { 
        paddingBottom: Math.max(insets.bottom, 12),
        paddingTop: 8,
        height: 56 + Math.max(insets.bottom, 12)
      },
      SHADOWS.medium
    ]}>
      {filteredState.routes.map((route, index) => {
        const { options } = descriptors[route.key];
        const label = options.title || route.name;
        
        // Define tab icons based on route name
        const getTabIcon = (routeName, isFocused) => {
          const iconSize = 22;
          let iconName = 'help-circle';
          
          switch (routeName) {
            case 'home':
              iconName = isFocused ? 'home' : 'home-outline';
              break;
            case 'goals':
              iconName = isFocused ? 'flag' : 'flag-outline';
              break;
            case 'expense-tracking':
              iconName = isFocused ? 'add-circle' : 'add-circle-outline';
              break;
            case 'family':
              iconName = isFocused ? 'people' : 'people-outline';
              break;
            case 'profile':
              iconName = isFocused ? 'person' : 'person-outline';
              break;
          }
          
          return (
            <Ionicons 
              name={iconName} 
              size={iconSize} 
              color={isFocused ? COLORS.primary.main : COLORS.neutral[400]} 
            />
          );
        };
        
        const isFocused = filteredState.index === index;
        
        const handlePress = () => {
          // Special case for expense-tracking (centered button)
          if (route.name === 'expense-tracking') {
            router.push('/expense-tracking');
            return;
          }
          
          const event = navigation.emit({
            type: 'tabPress',
            target: route.key,
            canPreventDefault: true,
          });
          
          if (!isFocused && !event.defaultPrevented) {
            navigation.navigate(route.name, route.params);
          }
        };
        
        // Custom styling for add expense button (center tab)
        if (route.name === 'expense-tracking') {
          return (
            <TouchableOpacity
              key={route.key}
              accessibilityRole="button"
              accessibilityState={isFocused ? { selected: true } : {}}
              onPress={handlePress}
              style={styles.centerTab}
            >
              <View style={styles.fabButton}>
                <Ionicons name="add" size={26} color="white" />
              </View>
            </TouchableOpacity>
          );
        }
        
        // Regular tab buttons
        return (
          <TouchableOpacity
            key={route.key}
            accessibilityRole="button"
            accessibilityState={isFocused ? { selected: true } : {}}
            onPress={handlePress}
            style={styles.tab}
          >
            {getTabIcon(route.name, isFocused)}
            <Text style={[
              styles.tabText,
              { color: isFocused ? COLORS.primary.main : COLORS.neutral[400] }
            ]}>
              {label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

// Main TabsLayout component using Expo Router's Tabs
const TabsLayout = () => {
  return (
    <Tabs 
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: false,
      }}
      tabBar={props => <CustomTabBar {...props} />}
    >
      <Tabs.Screen 
        name="home"
        options={{
          title: 'Home',
        }}
      />
      <Tabs.Screen 
        name="goals"
        options={{
          title: 'Goals',
        }}
      />
      <Tabs.Screen 
        name="expense-tracking"
        options={{
          title: 'Add',
        }}
      />
      <Tabs.Screen 
        name="family"
        options={{
          title: 'Family',
        }}
      />
      <Tabs.Screen 
        name="profile"
        options={{
          title: 'Profile',
        }}
      />
      
      {/* Hidden screens - not shown in tab bar */}
      <Tabs.Screen 
        name="budget"
        options={{
          title: 'Budget',
          href: null,
        }}
      />
      <Tabs.Screen 
        name="expenses"
        options={{
          title: 'Expenses',
          href: null,
        }}
      />
      <Tabs.Screen 
        name="create-budget"
        options={{
          title: 'Create Budget',
          href: null,
        }}
      />
      <Tabs.Screen 
        name="export-data"
        options={{
          title: 'Export Data',
          href: null,
        }}
      />
      <Tabs.Screen 
        name="edit-goal"
        options={{
          title: 'Edit Goal',
          href: null,
        }}
      />
      <Tabs.Screen 
        name="family-members"
        options={{
          title: 'Family Members',
          href: null,
        }}
      />
      <Tabs.Screen 
        name="family-budget"
        options={{
          title: 'Family Budget',
          href: null,
        }}
      />
      <Tabs.Screen 
        name="family-savings"
        options={{
          title: 'Family Savings',
          href: null,
        }}
      />
      <Tabs.Screen 
        name="family-goals"
        options={{
          title: 'Family Goals',
          href: null,
        }}
      />
      <Tabs.Screen 
        name="edit-family"
        options={{
          title: 'Edit Family',
          href: null,
        }}
      />
      <Tabs.Screen 
        name="edit-family-goal"
        options={{
          title: 'Edit Family Goals',
          href: null,
        }}
      />
      <Tabs.Screen 
        name="add-family-goal"
        options={{
          title: 'Add Family Goals',
          href: null,
        }}
      />
      <Tabs.Screen 
        name="add-family-member"
        options={{
          title: 'Add Family Member',
          href: null,
        }}
      />
      <Tabs.Screen 
        name="edit-profile"
        options={{
          title: 'Edit Profile',
          href: null,
        }}
      />
      <Tabs.Screen 
        name="add-goal"
        options={{
          title: 'Add Goal',
          href: null,
        }}
      />
      <Tabs.Screen 
        name="streak-stats"
        options={{
          title: 'Streak Stats',
          href: null,
        }}
      />
      <Tabs.Screen 
        name="create-family"
        options={{
          title: 'Create Family',
          href: null,
        }}
      />
    </Tabs>
  );
};

const styles = StyleSheet.create({
  tabBar: {
    flexDirection: 'row',
    backgroundColor: COLORS.white,
    borderTopWidth: 1,
    borderTopColor: COLORS.neutral[200],
  },
  tab: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  centerTab: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tabText: {
    fontSize: 10,
    marginTop: 2,
    fontWeight: '500',
  },
  fabButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: COLORS.primary.main,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: -30, // Offset to position above the tab bar
    borderWidth: 4,
    borderColor: COLORS.white,
    ...SHADOWS.medium,
  }
});

export default TabsLayout;