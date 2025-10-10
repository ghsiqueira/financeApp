// App.tsx - ATUALIZADO COM TEMA (sem ToastProvider pois você tem seu próprio)
import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import { AuthProvider } from './src/contexts/AuthContext';
import { ThemeProvider, useTheme } from './src/contexts/ThemeContext';
import { AppNavigator } from './src/navigation';

// Componente interno para acessar o tema
const AppContent = () => {
  const { theme } = useTheme();

  return (
    <>
      <StatusBar 
        style={theme.statusBarStyle} 
        backgroundColor={theme.statusBarBackground} 
      />
      <AppNavigator />
    </>
  );
};

export default function App() {
  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <AuthProvider>
          <NavigationContainer>
            <AppContent />
          </NavigationContainer>
        </AuthProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
