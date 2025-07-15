import React from 'react'
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'
import { createStackNavigator } from '@react-navigation/stack'
import { Ionicons } from '@expo/vector-icons'
import { useTheme } from '../context/ThemeContext'
import { Platform } from 'react-native'

import DashboardScreen from '../screens/dashboard/DashboardScreen'
import TransactionsScreen from '../screens/transactions/TransactionsScreen'
import AddTransactionScreen from '../screens/transactions/AddTransactionScreen'
import BudgetsScreen from '../screens/budgets/BudgetsScreen'
import AddBudgetScreen from '../screens/budgets/AddBudgetScreen'
import GoalsScreen from '../screens/goals/GoalsScreen'
import AddGoalScreen from '../screens/goals/AddGoalScreen'
import SettingsScreen from '../screens/settings/SettingsScreen'

// Stack Navigators para cada tab
const TransactionsStack = createStackNavigator()
const BudgetsStack = createStackNavigator()
const GoalsStack = createStackNavigator()

function TransactionsNavigator() {
  const { theme } = useTheme()
  return (
    <TransactionsStack.Navigator
      screenOptions={{
        headerShown: false,
        cardStyle: { backgroundColor: theme.background },
      }}
    >
      <TransactionsStack.Screen name="TransactionsList" component={TransactionsScreen} />
      <TransactionsStack.Screen 
        name="AddTransaction" 
        component={AddTransactionScreen}
        options={{
          presentation: 'modal',
          gestureDirection: 'vertical',
        }}
      />
    </TransactionsStack.Navigator>
  )
}

function BudgetsNavigator() {
  const { theme } = useTheme()
  return (
    <BudgetsStack.Navigator
      screenOptions={{
        headerShown: false,
        cardStyle: { backgroundColor: theme.background },
      }}
    >
      <BudgetsStack.Screen name="BudgetsList" component={BudgetsScreen} />
      <BudgetsStack.Screen 
        name="AddBudget" 
        component={AddBudgetScreen}
        options={{
          presentation: 'modal',
          gestureDirection: 'vertical',
        }}
      />
    </BudgetsStack.Navigator>
  )
}

function GoalsNavigator() {
  const { theme } = useTheme()
  return (
    <GoalsStack.Navigator
      screenOptions={{
        headerShown: false,
        cardStyle: { backgroundColor: theme.background },
      }}
    >
      <GoalsStack.Screen name="GoalsList" component={GoalsScreen} />
      <GoalsStack.Screen 
        name="AddGoal" 
        component={AddGoalScreen}
        options={{
          presentation: 'modal',
          gestureDirection: 'vertical',
        }}
      />
    </GoalsStack.Navigator>
  )
}

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
      })}
    >
      <Tab.Screen 
        name="Dashboard" 
        component={DashboardScreen}
        options={{ tabBarLabel: 'Dashboard' }}
      />
      <Tab.Screen 
        name="Transactions" 
        component={TransactionsNavigator}
        options={{ tabBarLabel: 'Transações' }}
      />
      <Tab.Screen 
        name="Budgets" 
        component={BudgetsNavigator}
        options={{ tabBarLabel: 'Orçamentos' }}
      />
      <Tab.Screen 
        name="Goals" 
        component={GoalsNavigator}
        options={{ tabBarLabel: 'Metas' }}
      />
      <Tab.Screen 
        name="Settings" 
        component={SettingsScreen}
        options={{ tabBarLabel: 'Configurações' }}
      />
    </Tab.Navigator>
  )
}