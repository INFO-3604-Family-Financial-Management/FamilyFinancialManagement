import { View, Text, Image } from 'react-native'
import React from 'react'
import { Tabs, Redirect } from 'expo-router'
import icons from "../../constants/icons"

const TabIcon = ({ icon, color, name, focused }) => {
  return (
    <View>
      <Image 
        source={icon}
        resizeMode="contain"
        tintColor={color}
        className='w-6 h-6'
      />
    </View>
  )
}

const TabsLayout = () => {
  return (
    <>
      <Tabs> 
        <Tabs.Screen 
          name="home"
          options={{
            title: 'Home',
            headerShown: false,
            tabBarIcon: ({color, focused}) => (
              <TabIcon
                icon={icons.home}
                color={color}
                name="Home"
                focused={focused}
              />
            )
          }}
        />
        <Tabs.Screen 
          name="goals"
          options={{
            title: 'Goals',
            headerShown: false,
            tabBarIcon: ({color, focused}) => (
              <TabIcon
                icon={icons.target}
                color={color}
                name="Goals"
                focused={focused}
              />
            )
          }}
        />
        <Tabs.Screen 
          name="expense-tracking"
          options={{
            title: 'Expenses',
            headerShown: false,
            tabBarIcon: ({color, focused}) => (
              <TabIcon
                icon={icons.add}
                color={color}
                name="Expenses"
                focused={focused}
              />
            )
          }}
        />
        <Tabs.Screen 
          name="family"
          options={{
            title: 'Family',
            headerShown: false,
            tabBarIcon: ({color, focused}) => (
              <TabIcon
                icon={icons.family}
                color={color}
                name="Family"
                focused={focused}
              />
            )
          }}
        />
        <Tabs.Screen 
          name="profile"
          options={{
            title: 'Profile',
            headerShown: false,
            tabBarIcon: ({color, focused}) => (
              <TabIcon
                icon={icons.profile}
                color={color}
                name="Profile"
                focused={focused}
              />
            )
          }}
        />
        <Tabs.Screen 
          name="budget"
          options={{
            title: 'Budget',
            headerShown: false,
            tabBarItemStyle: { display: 'none' },
            tabBarIcon: ({color, focused}) => (
              <TabIcon
                icon={icons.profile}
                color={color}
                name="Budget"
                focused={focused}
              />
            )
          }}
        />
        <Tabs.Screen 
          name="expenses"
          options={{
            title: 'Expenses',
            headerShown: false,
            tabBarItemStyle: { display: 'none' },
            tabBarIcon: ({color, focused}) => (
              <TabIcon
                icon={icons.profile}
                color={color}
                name="Expenses"
                focused={focused}
              />
            )
          }}
        />
        <Tabs.Screen 
          name="create-budget"
          options={{
            title: 'Create Budget',
            headerShown: false,
            tabBarItemStyle: { display: 'none' },
            tabBarIcon: ({color, focused}) => (
              <TabIcon
                icon={icons.profile}
                color={color}
                name="Create Budget"
                focused={focused}
              />
            )
          }}
        />
        <Tabs.Screen 
          name="export-data"
          options={{
            title: 'Export Data',
            headerShown: false,
            tabBarItemStyle: { display: 'none' },
            tabBarIcon: ({color, focused}) => (
              <TabIcon
                icon={icons.profile}
                color={color}
                name="Export Data"
                focused={focused}
              />
            )
          }}
        />
        <Tabs.Screen 
          name="edit-goal"
          options={{
            title: 'Edit Goal',
            headerShown: false,
            tabBarItemStyle: { display: 'none' },
            tabBarIcon: ({color, focused}) => (
              <TabIcon
                icon={icons.profile}
                color={color}
                name="Edit Goal"
                focused={focused}
              />
            )
          }}
        />
        <Tabs.Screen 
          name="family-members"
          options={{
            title: 'Family Members',
            headerShown: false,
            tabBarItemStyle: { display: 'none' },
            tabBarIcon: ({color, focused}) => (
              <TabIcon
                icon={icons.profile}
                color={color}
                name="Family Members"
                focused={focused}
              />
            )
          }}
        />
        <Tabs.Screen 
          name="family-budget"
          options={{
            title: 'Family Budget',
            headerShown: false,
            tabBarItemStyle: { display: 'none' },
            tabBarIcon: ({color, focused}) => (
              <TabIcon
                icon={icons.profile}
                color={color}
                name="Family Budget"
                focused={focused}
              />
            )
          }}
        />
        <Tabs.Screen 
          name="family-savings"
          options={{
            title: 'Family Savings',
            headerShown: false,
            tabBarItemStyle: { display: 'none' },
            tabBarIcon: ({color, focused}) => (
              <TabIcon
                icon={icons.profile}
                color={color}
                name="Family Savings"
                focused={focused}
              />
            )
          }}
        />
        <Tabs.Screen 
          name="family-goals"
          options={{
            title: 'Family Goals',
            headerShown: false,
            tabBarItemStyle: { display: 'none' },
            tabBarIcon: ({color, focused}) => (
              <TabIcon
                icon={icons.profile}
                color={color}
                name="Family Goals"
                focused={focused}
              />
            )
          }}
        />
        <Tabs.Screen 
          name="edit-family"
          options={{
            title: 'Edit Family',
            headerShown: false,
            tabBarItemStyle: { display: 'none' },
            tabBarIcon: ({color, focused}) => (
              <TabIcon
                icon={icons.profile}
                color={color}
                name="Edit Family"
                focused={focused}
              />
            )
          }}
        />
        <Tabs.Screen 
          name="edit-family-goal"
          options={{
            title: 'Edit Family Goals',
            headerShown: false,
            tabBarItemStyle: { display: 'none' },
            tabBarIcon: ({color, focused}) => (
              <TabIcon
                icon={icons.profile}
                color={color}
                name="Edit Family Goals"
                focused={focused}
              />
            )
          }}
        />
        <Tabs.Screen 
          name="add-family-goal"
          options={{
            title: 'Add Family Goals',
            headerShown: false,
            tabBarItemStyle: { display: 'none' },
            tabBarIcon: ({color, focused}) => (
              <TabIcon
                icon={icons.profile}
                color={color}
                name="Add Family Goals"
                focused={focused}
              />
            )
          }}
        />
        <Tabs.Screen 
          name="add-family-member"
          options={{
            title: 'Add Family Member',
            headerShown: false,
            tabBarItemStyle: { display: 'none' },
            tabBarIcon: ({color, focused}) => (
              <TabIcon
                icon={icons.profile}
                color={color}
                name="Add Family Member"
                focused={focused}
              />
            )
          }}
        />
        <Tabs.Screen 
          name="edit-profile"
          options={{
            title: 'Edit Profile',
            headerShown: false,
            tabBarItemStyle: { display: 'none' },
            tabBarIcon: ({color, focused}) => (
              <TabIcon
                icon={icons.profile}
                color={color}
                name="Edit Profile"
                focused={focused}
              />
            )
          }}
        />
      </Tabs>
    </>
  )
}

export default TabsLayout;