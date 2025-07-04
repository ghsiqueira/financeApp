import React from 'react'
import { createStackNavigator, StackNavigationOptions } from '@react-navigation/stack'
import { useTheme } from '../context/ThemeContext'

import LoginScreen from '../screens/auth/LoginScreen'
import RegisterScreen from '../screens/auth/RegisterScreen'
import ForgotPasswordScreen from '../screens/auth/ForgotPasswordScreen'
import ResetPasswordScreen from '../screens/auth/ResetPasswordScreen'

export type AuthStackParamList = {
  Login: undefined
  Register: undefined
  ForgotPassword: undefined
  ResetPassword: { email: string }
}

const Stack = createStackNavigator<AuthStackParamList>()

export default function AuthNavigator() {
  const { theme } = useTheme()

  const screenOptions: StackNavigationOptions = {
    headerShown: false,
    cardStyle: { backgroundColor: theme.background },
    animationEnabled: true,
    gestureEnabled: true,
    cardStyleInterpolator: ({ current, layouts }) => {
      return {
        cardStyle: {
          transform: [
            {
              translateX: current.progress.interpolate({
                inputRange: [0, 1],
                outputRange: [layouts.screen.width, 0],
              }),
            },
          ],
        },
      }
    },
  }

  return (
    <Stack.Navigator
      initialRouteName="Login"
      screenOptions={screenOptions}
    >
      <Stack.Screen 
        name="Login" 
        component={LoginScreen}
        options={{
          animationTypeForReplace: 'pop',
        }}
      />
      <Stack.Screen 
        name="Register" 
        component={RegisterScreen}
      />
      <Stack.Screen 
        name="ForgotPassword" 
        component={ForgotPasswordScreen}
      />
      <Stack.Screen 
        name="ResetPassword" 
        component={ResetPasswordScreen}
      />
    </Stack.Navigator>
  )
}