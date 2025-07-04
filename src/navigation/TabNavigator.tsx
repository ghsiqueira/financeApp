import React from 'react'
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'
import { Ionicons } from '@expo/vector-icons'
import { useTheme } from '../context/ThemeContext'
import { Platform } from 'react-native'

import DashboardScreen from '../screens/dashboard/DashboardScreen'
import TransactionsScreen from '../screens/transactions/TransactionsScreen'
import BudgetsScreen from '../screens/budgets/BudgetsScreen'
import GoalsScreen from '../screens/goals/GoalsScreen'
import SettingsScreen from '../screens/settings/SettingsScreen'

export type TabParamList = {
  Dashboard: undefined
  Transactions: undefined
  Budgets: undefined
  Goals: undefined
  Settings: undefined
}

const Tab = createBottomTabNavigator<TabParamList>()

export default function TabNavigator() {
  const { theme, isDark } = useTheme()

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: keyof typeof Ionicons.glyphMap

          switch (route.name) {
            case 'Dashboard':
              iconName = focused ? 'home' : 'home-outline'
              break
            case 'Transactions':
              iconName = focused ? 'list' : 'list-outline'
              break
            case 'Budgets':
              iconName = focused ? 'wallet' : 'wallet-outline'
              break
            case 'Goals':
              iconName = focused ? 'trophy' : 'trophy-outline'
              break
            case 'Settings':
              iconName = focused ? 'settings' : 'settings-outline'
              break
            default:
              iconName = 'home-outline'
          }

          return <Ionicons name={iconName} size={size} color={color} />
        },
        tabBarActiveTintColor: theme.primary,
        tabBarInactiveTintColor: theme.textSecondary,
        tabBarStyle: {
          backgroundColor: theme.surface,
          borderTopColor: theme.border,
          borderTopWidth: 1,
          height: Platform.OS === 'ios' ? 85 : 65,
          paddingBottom: Platform.OS === 'ios' ? 25 : 10,
          paddingTop: 8,
          elevation: 8,
          shadowColor: theme.shadow,
          shadowOffset: {
            width: 0,
            height: -2,
          },
          shadowOpacity: 0.1,
          shadowRadius: 4,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '500',
          marginBottom: Platform.OS === 'ios' ? 0 : 5,
        },
        tabBarItemStyle: {
          paddingVertical: 4,
        },
      })}
    >
      <Tab.Screen 
        name="Dashboard" 
        component={DashboardScreen}
        options={{
          tabBarLabel: 'Início',
          tabBarBadge: undefined, // Pode ser usado para notificações
        }}
      />
      <Tab.Screen 
        name="Transactions" 
        component={TransactionsScreen}
        options={{
          tabBarLabel: 'Transações',
        }}
      />
      <Tab.Screen 
        name="Budgets" 
        component={BudgetsScreen}
        options={{
          tabBarLabel: 'Orçamentos',
        }}
      />
      <Tab.Screen 
        name="Goals" 
        component={GoalsScreen}
        options={{
          tabBarLabel: 'Metas',
        }}
      />
      <Tab.Screen 
        name="Settings" 
        component={SettingsScreen}
        options={{
          tabBarLabel: 'Configurações',
        }}
      />
    </Tab.Navigator>
  )
}