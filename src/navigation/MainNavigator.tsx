// src/navigation/MainNavigator.tsx
import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';

// Importar telas
import { HomeScreen } from '../screens/main/HomeScreen';
import { TransactionListScreen } from '../screens/transactions/TransactionListScreen';
import { GoalListScreen } from '../screens/goals/GoalListScreen';
import { BudgetListScreen } from '../screens/budgets/BudgetListScreen';

import { COLORS, FONTS, FONT_SIZES } from '../constants';
import { MainTabParamList } from '../types';

const Tab = createBottomTabNavigator<MainTabParamList>();
const Stack = createNativeStackNavigator();

const PlaceholderScreen = ({ title }: { title: string }) => {
  return (
    <div style={{
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: COLORS.background,
      padding: 20
    }}>
      <Ionicons name="construct-outline" size={64} color={COLORS.textSecondary} />
      <h2 style={{
        fontSize: FONT_SIZES.xl,
        fontFamily: FONTS.bold,
        color: COLORS.textPrimary,
        marginTop: 16,
        marginBottom: 8,
        textAlign: 'center'
      }}>
        {title}
      </h2>
      <p style={{
        fontSize: FONT_SIZES.md,
        color: COLORS.textSecondary,
        textAlign: 'center',
        lineHeight: 1.5
      }}>
        Esta tela está em desenvolvimento e será implementada em breve.
      </p>
    </div>
  );
};

const ReportsScreen = () => <PlaceholderScreen title="Relatórios" />;
const ProfileScreen = () => <PlaceholderScreen title="Perfil" />;

export function MainNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: keyof typeof Ionicons.glyphMap;

          switch (route.name) {
            case 'Home':
              iconName = focused ? 'home' : 'home-outline';
              break;
            case 'Transactions':
              iconName = focused ? 'receipt' : 'receipt-outline';
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
        tabBarInactiveTintColor: COLORS.textSecondary,
        tabBarLabelStyle: {
          fontSize: FONT_SIZES.xs,
          fontFamily: FONTS.medium,
        },
        tabBarStyle: {
          backgroundColor: COLORS.white,
          borderTopWidth: 1,
          borderTopColor: COLORS.gray200,
          height: 60,
          paddingBottom: 8,
          paddingTop: 8,
        },
        headerShown: false,
      })}
    >
      <Tab.Screen 
        name="Home" 
        component={HomeScreen}
        options={{
          tabBarLabel: 'Início'
        }}
      />
      <Tab.Screen 
        name="Transactions" 
        component={TransactionListScreen}
        options={{
          tabBarLabel: 'Transações'
        }}
      />
      <Tab.Screen 
        name="Goals" 
        component={GoalListScreen}
        options={{
          tabBarLabel: 'Metas'
        }}
      />
      <Tab.Screen 
        name="Budgets" 
        component={BudgetListScreen}
        options={{
          tabBarLabel: 'Orçamentos'
        }}
      />
      <Tab.Screen 
        name="Reports" 
        component={ReportsScreen}
        options={{
          tabBarLabel: 'Relatórios'
        }}
      />
      <Tab.Screen 
        name="Profile" 
        component={ProfileScreen}
        options={{
          tabBarLabel: 'Perfil'
        }}
      />
    </Tab.Navigator>
  );
}