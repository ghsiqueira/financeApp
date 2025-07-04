import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { useColorScheme } from 'react-native'
import * as SecureStore from 'expo-secure-store'

export type ThemeMode = 'light' | 'dark' | 'system'

export interface Theme {
  primary: string
  secondary: string
  background: string
  surface: string
  card: string
  text: string
  textSecondary: string
  border: string
  success: string
  warning: string
  error: string
  info: string
  shadow: string
  overlay: string
}

export const lightTheme: Theme = {
  primary: '#007AFF',
  secondary: '#5856D6',
  background: '#F2F2F7',
  surface: '#FFFFFF',
  card: '#FFFFFF',
  text: '#000000',
  textSecondary: '#8E8E93',
  border: '#E5E5EA',
  success: '#34C759',
  warning: '#FF9500',
  error: '#FF3B30',
  info: '#007AFF',
  shadow: '#000000',
  overlay: 'rgba(0, 0, 0, 0.5)'
}

export const darkTheme: Theme = {
  primary: '#0A84FF',
  secondary: '#5E5CE6',
  background: '#000000',
  surface: '#1C1C1E',
  card: '#2C2C2E',
  text: '#FFFFFF',
  textSecondary: '#8E8E93',
  border: '#38383A',
  success: '#30D158',
  warning: '#FF9F0A',
  error: '#FF453A',
  info: '#64D2FF',
  shadow: '#000000',
  overlay: 'rgba(0, 0, 0, 0.7)'
}

interface ThemeContextData {
  theme: Theme
  themeMode: ThemeMode
  isDark: boolean
  setThemeMode: (mode: ThemeMode) => void
  toggleTheme: () => void
}

const ThemeContext = createContext<ThemeContextData>({} as ThemeContextData)

interface ThemeProviderProps {
  children: ReactNode
}

export function ThemeProvider({ children }: ThemeProviderProps) {
  const systemColorScheme = useColorScheme()
  const [themeMode, setThemeModeState] = useState<ThemeMode>('system')

  // Determinar tema atual baseado no modo
  const isDark = themeMode === 'system' 
    ? systemColorScheme === 'dark'
    : themeMode === 'dark'

  const theme = isDark ? darkTheme : lightTheme

  useEffect(() => {
    loadThemePreference()
  }, [])

  async function loadThemePreference() {
    try {
      const savedTheme = await SecureStore.getItemAsync('themeMode')
      if (savedTheme && ['light', 'dark', 'system'].includes(savedTheme)) {
        setThemeModeState(savedTheme as ThemeMode)
      }
    } catch (error) {
      console.log('Erro ao carregar preferência de tema:', error)
    }
  }

  async function setThemeMode(mode: ThemeMode) {
    try {
      setThemeModeState(mode)
      await SecureStore.setItemAsync('themeMode', mode)
    } catch (error) {
      console.log('Erro ao salvar preferência de tema:', error)
    }
  }

  function toggleTheme() {
    const newMode = isDark ? 'light' : 'dark'
    setThemeMode(newMode)
  }

  const value: ThemeContextData = {
    theme,
    themeMode,
    isDark,
    setThemeMode,
    toggleTheme
  }

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const context = useContext(ThemeContext)
  
  if (!context) {
    throw new Error('useTheme deve ser usado dentro de um ThemeProvider')
  }
  
  return context
}