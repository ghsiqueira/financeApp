// src/navigation/AppNavigator.tsx
import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';
import { HomeScreen } from '../screens/main/HomeScreen';
import { 
  LoginScreen, 
  RegisterScreen, 
  ForgotPasswordScreen,
  ReportsScreen,
} from '../screens/PlaceholderScreens';
import { TransactionNavigator } from './TransactionNavigator';
import { GoalNavigator } from './GoalNavigator';
import { BudgetNavigator } from './BudgetNavigator';
import { ProfileNavigator } from './ProfileNavigator';
import { COLORS, FONTS } from '../constants';
import { Loading } from '../components/common';

const RootStack = createNativeStackNavigator();
const AuthenticationStack = createNativeStackNavigator();
const BottomTab = createBottomTabNavigator();

// Navegador das abas principais
const TabNavigator = () => {
  return (
    <BottomTab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: keyof typeof Ionicons.glyphMap = 'home';

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
          paddingBottom: 5,
          paddingTop: 5,
          height: 60,
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
      })}
    >
      <BottomTab.Screen 
        name="Home" 
        component={HomeScreen}
        options={{ title: 'Início' }}
      />
      <BottomTab.Screen 
        name="Transactions" 
        component={TransactionNavigator}
        options={{ title: 'Transações', headerShown: false }}
      />
      <BottomTab.Screen 
        name="Goals" 
        component={GoalNavigator}
        options={{ title: 'Metas', headerShown: false }}
      />
      <BottomTab.Screen 
        name="Budgets" 
        component={BudgetNavigator}
        options={{ title: 'Orçamentos', headerShown: false }}
      />
      <BottomTab.Screen 
        name="Reports" 
        component={ReportsScreen}
        options={{ title: 'Relatórios' }}
      />
      <BottomTab.Screen 
        name="Profile" 
        component={ProfileNavigator}
        options={{ title: 'Perfil', headerShown: false }}
      />
    </BottomTab.Navigator>
  );
};

// Navegador de autenticação
const AuthStack = () => {
  return (
    <AuthenticationStack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: COLORS.primary,
        },
        headerTintColor: COLORS.white,
        headerTitleStyle: {
          fontFamily: FONTS.bold,
        },
      }}
    >
      <AuthenticationStack.Screen 
        name="Login" 
        component={LoginScreen}
        options={{ 
          title: 'Entrar',
          headerShown: false 
        }}
      />
      <AuthenticationStack.Screen 
        name="Register" 
        component={RegisterScreen}
        options={{ title: 'Criar Conta' }}
      />
      <AuthenticationStack.Screen 
        name="ForgotPassword" 
        component={ForgotPasswordScreen}
        options={{ title: 'Recuperar Senha' }}
      />
    </AuthenticationStack.Navigator>
  );
};

// Navegador principal do app
export const AppNavigator = () => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return <Loading text="Carregando aplicativo..." />;
  }

  return (
    <RootStack.Navigator screenOptions={{ headerShown: false }}>
      {isAuthenticated ? (
        <RootStack.Screen name="Main" component={TabNavigator} />
      ) : (
        <RootStack.Screen name="Auth" component={AuthStack} />
      )}
    </RootStack.Navigator>
  );
};