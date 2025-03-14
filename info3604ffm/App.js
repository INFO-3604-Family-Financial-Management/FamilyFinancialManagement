import * as React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import Home from './app/(tabs)/home'; // Adjust the import path
import ExpenseTracking from './app/(tabs)/expense-tracking'; // Adjust the import path

const Stack = createStackNavigator();

function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Home">
        <Stack.Screen name="Home" component={Home} />
        <Stack.Screen name="ExpenseTracking" component={ExpenseTracking} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

export default App;