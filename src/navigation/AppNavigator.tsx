// src/navigation/AppNavigator.tsx
import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';

import { useAuth } from '../contexts/AuthContext';
import { AuthNavigator } from './AuthNavigator';
import { MainTabNavigator } from './MainTabNavigator';
import { RootStackParamList } from './types';
import { Loading } from '../components/common';
import { COLORS } from '../constants';

const RootStack = createNativeStackNavigator<RootStackParamList>();

export const AppNavigator: React.FC = () => {
  const { isAuthenticated, isLoading } = useAuth();

  // Mostra loading enquanto verifica autenticação
  if (isLoading) {
    return (
      <>
        <StatusBar style="light" backgroundColor={COLORS.primary} />
        <Loading text="Carregando aplicativo..." />
      </>
    );
  }

  return (
    <>
      {/* StatusBar configurado globalmente */}
      <StatusBar 
        style={isAuthenticated ? "light" : "light"} 
        backgroundColor={COLORS.primary} 
      />
      
      <RootStack.Navigator 
        screenOptions={{ 
          headerShown: false,
          animation: 'fade' // Transição suave entre Auth e Main
        }}
      >
        {isAuthenticated ? (
          // Usuário autenticado - mostra as abas principais
          <RootStack.Screen 
            name="Main" 
            component={MainTabNavigator}
            options={{
              animationTypeForReplace: 'push' // Animação quando faz login
            }}
          />
        ) : (
          // Usuário não autenticado - mostra telas de auth
          <RootStack.Screen 
            name="Auth" 
            component={AuthNavigator}
            options={{
              animationTypeForReplace: 'pop' // Animação quando faz logout
            }}
          />
        )}
      </RootStack.Navigator>
    </>
  );
};