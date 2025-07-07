import React, { useEffect, useState } from 'react'
import { StatusBar } from 'expo-status-bar'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import { GestureHandlerRootView } from 'react-native-gesture-handler'
import { NavigationContainer } from '@react-navigation/native'
import Toast from 'react-native-toast-message'
import * as SplashScreen from 'expo-splash-screen'
import { useFonts, Inter_400Regular, Inter_500Medium, Inter_600SemiBold, Inter_700Bold } from '@expo-google-fonts/inter'

import { AuthProvider } from './src/context/AuthContext'
import { ThemeProvider } from './src/context/ThemeContext'
import { AppNavigator } from './src/navigation/AppNavigator'
import { toastConfig } from './src/utils/toastConfig'

// Prevent the splash screen from auto-hiding
SplashScreen.preventAutoHideAsync()

export default function App() {
  const [appIsReady, setAppIsReady] = useState(false)

  // Carregar fontes do Google Fonts
  let [fontsLoaded, fontError] = useFonts({
    'Inter-Regular': Inter_400Regular,
    'Inter-Medium': Inter_500Medium,
    'Inter-SemiBold': Inter_600SemiBold,
    'Inter-Bold': Inter_700Bold,
  })

  useEffect(() => {
    async function prepare() {
      try {
        // Aguardar carregamento das fontes
        if (fontsLoaded || fontError) {
          // Simular carregamento de dados iniciais se necessário
          await new Promise(resolve => setTimeout(resolve, 1000))
          
          // Se houver erro no carregamento das fontes, log do erro mas continue
          if (fontError) {
            console.warn('Erro ao carregar fontes:', fontError)
          }
        }
      } catch (e) {
        console.warn('Erro ao carregar recursos:', e)
      } finally {
        if (fontsLoaded || fontError) {
          setAppIsReady(true)
        }
      }
    }

    prepare()
  }, [fontsLoaded, fontError])

  useEffect(() => {
    if (appIsReady) {
      // Esconder splash screen quando o app estiver pronto
      SplashScreen.hideAsync()
    }
  }, [appIsReady])

  // Mostrar tela vazia enquanto o app não estiver pronto
  if (!appIsReady) {
    return null
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <ThemeProvider>
          <AuthProvider>
            <NavigationContainer>
              <StatusBar style="auto" />
              <AppNavigator />
              <Toast config={toastConfig} />
            </NavigationContainer>
          </AuthProvider>
        </ThemeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  )
}