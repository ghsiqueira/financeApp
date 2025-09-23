// src/navigation/MainTabNavigator.tsx
import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { Platform } from 'react-native';

import { HomeScreen } from '../screens/main/HomeScreen';
import { TransactionNavigator } from './TransactionNavigator';
import { GoalNavigator } from './GoalNavigator';
import { BudgetNavigator } from './BudgetNavigator';
import { ReportsScreen } from '../screens/reports/ReportsScreen';
import { ProfileNavigator } from './ProfileNavigator';
import { MainTabParamList } from './types';
import { COLORS, FONTS } from '../constants';

const Tab = createBottomTabNavigator<MainTabParamList>();

export const MainTabNavigator: React.FC = () => {
  return (
    <Tab.Navigator
      initialRouteName="Home"
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: keyof typeof Ionicons.glyphMap;

          switch (route.name) {
            case 'Home':
              iconName = focused ? 'home' : 'home-outline';
              break;
            case 'Transactions':
              iconName = focused ? 'card' : 'card-outline';
              break;
            case 'Goals':
              iconName = focused ? 'flag' : 'flag-outline';
              break;
            case 'Budgets':
              iconName = focused ? 'pie-chart' : 'pie-chart-outline';
              break;
            case 'Reports':
              iconName = focused ? 'analytics' : 'analytics-outline';
              break;
            case 'Profile':
              iconName = focused ? 'person' : 'person-outline';
              break;
            default:
              iconName = 'home-outline';
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: COLORS.gray400,
        tabBarStyle: {
          backgroundColor: COLORS.white,
          borderTopColor: COLORS.gray200,
          borderTopWidth: 1,
          paddingBottom: Platform.OS === 'ios' ? 20 : 5,
          paddingTop: 5,
          height: Platform.OS === 'ios' ? 85 : 60,
        },
        tabBarLabelStyle: {
          fontFamily: FONTS.medium,
          fontSize: 12,
        },
        headerStyle: {
          backgroundColor: COLORS.primary,
        },
        headerTintColor: COLORS.white,
        headerTitleStyle: {
          fontFamily: FONTS.bold,
        },
        tabBarHideOnKeyboard: true, // Esconde tab bar quando teclado abrir
      })}
    >
      <Tab.Screen 
        name="Home" 
        component={HomeScreen}
        options={{ 
          title: 'Início',
          tabBarLabel: 'Início',
          headerShown: false, // HomeScreen tem header customizado
        }}
      />
      <Tab.Screen 
        name="Transactions" 
        component={TransactionNavigator}
        options={{ 
          title: 'Transações',
          tabBarLabel: 'Transações',
          headerShown: false, // TransactionNavigator gerencia seus próprios headers
        }}
      />
      <Tab.Screen 
        name="Goals" 
        component={GoalNavigator}
        options={{ 
          title: 'Metas',
          tabBarLabel: 'Metas',
          headerShown: false, // GoalNavigator gerencia seus próprios headers
        }}
      />
      <Tab.Screen 
        name="Budgets" 
        component={BudgetNavigator}
        options={{ 
          title: 'Orçamentos',
          tabBarLabel: 'Orçamentos',
          headerShown: false, // BudgetNavigator gerencia seus próprios headers
        }}
      />
      <Tab.Screen 
        name="Reports" 
        component={ReportsScreen}
        options={{ 
          title: 'Relatórios',
          tabBarLabel: 'Relatórios',
          headerShown: false, // ReportsScreen tem header customizado
        }}
      />
      <Tab.Screen 
        name="Profile" 
        component={ProfileNavigator}
        options={{ 
          title: 'Perfil',
          tabBarLabel: 'Perfil',
          headerShown: false, // ProfileNavigator gerencia seus próprios headers
        }}
      />
    </Tab.Navigator>
  );
};