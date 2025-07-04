import React from 'react'
import { createStackNavigator } from '@react-navigation/stack'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'

import AuthNavigator from './AuthNavigator'
import TabNavigator from './TabNavigator'
import LoadingScreen from '../screens/LoadingScreen'

// Types para navegação
export type RootStackParamList = {
  Auth: undefined
  Main: undefined
  Loading: undefined
}

const Stack = createStackNavigator<RootStackParamList>()

export function AppNavigator() {
  const { isAuthenticated, isLoading } = useAuth()
  const { theme } = useTheme()

  if (isLoading) {
    return <LoadingScreen />
  }

  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        cardStyle: { backgroundColor: theme.background },
        animationEnabled: true,
        gestureEnabled: true,
      }}
    >
      {isAuthenticated ? (
        <Stack.Screen name="Main" component={TabNavigator} />
      ) : (
        <Stack.Screen name="Auth" component={AuthNavigator} />
      )}
    </Stack.Navigator>
  )
}