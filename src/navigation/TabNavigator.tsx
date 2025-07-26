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
import BudgetDetailsScreen from '../screens/budgets/BudgetDetailsScreen'
import GoalsScreen from '../screens/goals/GoalsScreen'
import AddGoalScreen from '../screens/goals/AddGoalScreen'
import SettingsScreen from '../screens/settings/SettingsScreen'

// Definir tipos de navegação
export type RootTabParamList = {
  Dashboard: undefined
  Transactions: undefined
  Budgets: undefined
  Goals: undefined
  Settings: undefined
}

export type TransactionsStackParamList = {
  TransactionsList: undefined
  AddTransaction: { transaction?: any }
}

export type BudgetsStackParamList = {
  BudgetsList: undefined
  AddBudget: { budget?: any }
  BudgetDetails: { budget: any }
}

export type GoalsStackParamList = {
  GoalsList: undefined
  AddGoal: { goal?: any }
}

// Stack Navigators para cada tab
const TransactionsStack = createStackNavigator<TransactionsStackParamList>()
const BudgetsStack = createStackNavigator<BudgetsStackParamList>()
const GoalsStack = createStackNavigator<GoalsStackParamList>()
const Tab = createBottomTabNavigator<RootTabParamList>()

// Stack Navigator para Transações
function TransactionsNavigator() {
  const { theme } = useTheme()
  
  return (
    <TransactionsStack.Navigator
      screenOptions={{
        headerShown: false,
        cardStyle: { backgroundColor: theme.background },
        gestureEnabled: true,
      }}
    >
      <TransactionsStack.Screen 
        name="TransactionsList" 
        component={TransactionsScreen} 
      />
      <TransactionsStack.Screen 
        name="AddTransaction" 
        component={AddTransactionScreen}
        options={{
          presentation: 'modal',
          gestureDirection: 'vertical',
          cardStyleInterpolator: ({ current, layouts }) => {
            return {
              cardStyle: {
                transform: [
                  {
                    translateY: current.progress.interpolate({
                      inputRange: [0, 1],
                      outputRange: [layouts.screen.height, 0],
                    }),
                  },
                ],
              },
              overlayStyle: {
                opacity: current.progress.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, 0.5],
                }),
              },
            }
          },
        }}
      />
    </TransactionsStack.Navigator>
  )
}

// Stack Navigator para Orçamentos - CORRIGIDO
function BudgetsNavigator() {
  const { theme } = useTheme()
  
  return (
    <BudgetsStack.Navigator
      screenOptions={{
        headerShown: false,
        cardStyle: { backgroundColor: theme.background },
        gestureEnabled: true,
      }}
    >
      <BudgetsStack.Screen 
        name="BudgetsList" 
        component={BudgetsScreen}
        options={{
          title: 'Orçamentos'
        }}
      />
      <BudgetsStack.Screen 
        name="AddBudget" 
        component={AddBudgetScreen}
        options={{
          presentation: 'modal',
          gestureDirection: 'vertical',
          title: 'Novo Orçamento',
          cardStyleInterpolator: ({ current, layouts }) => {
            return {
              cardStyle: {
                transform: [
                  {
                    translateY: current.progress.interpolate({
                      inputRange: [0, 1],
                      outputRange: [layouts.screen.height, 0],
                    }),
                  },
                ],
              },
              overlayStyle: {
                opacity: current.progress.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, 0.5],
                }),
              },
            }
          },
        }}
      />
      <BudgetsStack.Screen 
        name="BudgetDetails" 
        component={BudgetDetailsScreen}
        options={{
          title: 'Detalhes do Orçamento',
          gestureDirection: 'horizontal',
        }}
      />
    </BudgetsStack.Navigator>
  )
}

// Stack Navigator para Metas
function GoalsNavigator() {
  const { theme } = useTheme()
  
  return (
    <GoalsStack.Navigator
      screenOptions={{
        headerShown: false,
        cardStyle: { backgroundColor: theme.background },
        gestureEnabled: true,
      }}
    >
      <GoalsStack.Screen 
        name="GoalsList" 
        component={GoalsScreen} 
      />
      <GoalsStack.Screen 
        name="AddGoal" 
        component={AddGoalScreen}
        options={{
          presentation: 'modal',
          gestureDirection: 'vertical',
          cardStyleInterpolator: ({ current, layouts }) => {
            return {
              cardStyle: {
                transform: [
                  {
                    translateY: current.progress.interpolate({
                      inputRange: [0, 1],
                      outputRange: [layouts.screen.height, 0],
                    }),
                  },
                ],
              },
              overlayStyle: {
                opacity: current.progress.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, 0.5],
                }),
              },
            }
          },
        }}
      />
    </GoalsStack.Navigator>
  )
}

// Tab Navigator Principal
export default function TabNavigator() {
  const { theme } = useTheme()

  // Função para obter ícone da tab
  const getTabBarIcon = (routeName: string, focused: boolean, size: number) => {
    let iconName: keyof typeof Ionicons.glyphMap

    switch (routeName) {
      case 'Dashboard':
        iconName = focused ? 'home' : 'home-outline'
        break
      case 'Transactions':
        iconName = focused ? 'swap-horizontal' : 'swap-horizontal-outline'
        break
      case 'Budgets':
        iconName = focused ? 'wallet' : 'wallet-outline'
        break
      case 'Goals':
        iconName = focused ? 'flag' : 'flag-outline'
        break
      case 'Settings':
        iconName = focused ? 'settings' : 'settings-outline'
        break
      default:
        iconName = 'help-circle-outline'
    }

    return <Ionicons name={iconName} size={size} color={focused ? theme.primary : theme.textSecondary} />
  }

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarIcon: ({ focused, size }) => getTabBarIcon(route.name, focused, size),
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
        // Animação suave entre tabs
        tabBarHideOnKeyboard: true,
      })}
    >
      <Tab.Screen 
        name="Dashboard" 
        component={DashboardScreen}
        options={{ 
          tabBarLabel: 'Dashboard',
          title: 'Dashboard'
        }}
      />
      <Tab.Screen 
        name="Transactions" 
        component={TransactionsNavigator}
        options={{ 
          tabBarLabel: 'Transações',
          title: 'Transações'
        }}
      />
      <Tab.Screen 
        name="Budgets" 
        component={BudgetsNavigator}
        options={{ 
          tabBarLabel: 'Orçamentos',
          title: 'Orçamentos'
        }}
      />
      <Tab.Screen 
        name="Goals" 
        component={GoalsNavigator}
        options={{ 
          tabBarLabel: 'Metas',
          title: 'Metas'
        }}
      />
      <Tab.Screen 
        name="Settings" 
        component={SettingsScreen}
        options={{ 
          tabBarLabel: 'Configurações',
          title: 'Configurações'
        }}
      />
    </Tab.Navigator>
  )
}