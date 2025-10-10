import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { STORAGE_KEYS } from '../constants';

export type ThemeMode = 'light' | 'dark';

export interface Theme {
  // Cores principais
  primary: string;
  primaryDark: string;
  primaryLight: string;
  secondary: string;
  secondaryDark: string;

  // Cores de estado
  success: string;
  warning: string;
  error: string;
  info: string;

  // Cores básicas
  white: string;
  black: string;

  // Cores de fundo
  background: string;
  backgroundSecondary: string;
  card: string;

  // Cores de texto
  textPrimary: string;
  textSecondary: string;
  textTertiary: string;
  textWhite: string;
  textHint: string;

  // Cores de borda
  border: string;
  borderLight: string;

  // Cores de cinza
  gray50: string;
  gray100: string;
  gray200: string;
  gray300: string;
  gray400: string;
  gray500: string;
  gray600: string;
  gray700: string;
  gray800: string;
  gray900: string;

  // Cores com transparência
  success10: string;
  error10: string;
  primary10: string;
  secondary10: string;
  warning10: string;

  // Cores de overlay
  overlay: string;
  overlayLight: string;
  overlayDark: string;

  // Cores específicas
  income: string;
  expense: string;
  transfer: string;

  // Cores de status bar
  statusBarStyle: 'light' | 'dark';
  statusBarBackground: string;
}

export const lightTheme: Theme = {
  primary: '#3B82F6',
  primaryDark: '#1E40AF',
  primaryLight: '#93C5FD',
  secondary: '#10B981',
  secondaryDark: '#047857',

  success: '#22C55E',
  warning: '#F59E0B',
  error: '#EF4444',
  info: '#06B6D4',

  white: '#FFFFFF',
  black: '#000000',

  background: '#F9FAFB',
  backgroundSecondary: '#F3F4F6',
  card: '#FFFFFF',

  textPrimary: '#111827',
  textSecondary: '#6B7280',
  textTertiary: '#9CA3AF',
  textWhite: '#FFFFFF',
  textHint: '#9CA3AF',

  border: '#E5E7EB',
  borderLight: '#F3F4F6',

  gray50: '#F9FAFB',
  gray100: '#F3F4F6',
  gray200: '#E5E7EB',
  gray300: '#D1D5DB',
  gray400: '#9CA3AF',
  gray500: '#6B7280',
  gray600: '#4B5563',
  gray700: '#374151',
  gray800: '#1F2937',
  gray900: '#111827',

  success10: '#E7F7EF',
  error10: '#FFF2F2',
  primary10: '#EBF4FF',
  secondary10: '#E6FFFA',
  warning10: '#FFFAEB',

  overlay: 'rgba(0, 0, 0, 0.5)',
  overlayLight: 'rgba(0, 0, 0, 0.3)',
  overlayDark: 'rgba(0, 0, 0, 0.7)',

  income: '#10B981',
  expense: '#EF4444',
  transfer: '#8B5CF6',

  statusBarStyle: 'light',
  statusBarBackground: '#3B82F6',
};

export const darkTheme: Theme = {
  primary: '#60A5FA',
  primaryDark: '#3B82F6',
  primaryLight: '#1E40AF',
  secondary: '#34D399',
  secondaryDark: '#10B981',

  success: '#4ADE80',
  warning: '#FBBF24',
  error: '#F87171',
  info: '#22D3EE',

  white: '#000000',
  black: '#FFFFFF',

  background: '#0F172A',
  backgroundSecondary: '#1E293B',
  card: '#1E293B',

  // ✅ AJUSTADO: Texto BRANCO PURO para labels e textos
  textPrimary: '#FFFFFF',        // ✅ Era #F1F5F9, agora é BRANCO PURO
  textSecondary: '#E2E8F0',      // ✅ Era #CBD5E1, agora é mais claro
  textTertiary: '#CBD5E1',       // ✅ Era #94A3B8, agora é mais claro
  textWhite: '#0F172A',
  textHint: '#94A3B8',           // ✅ Era #64748B, agora é mais claro

  border: '#334155',
  borderLight: '#1E293B',

  gray50: '#1E293B',
  gray100: '#334155',
  gray200: '#475569',
  gray300: '#64748B',
  gray400: '#94A3B8',
  gray500: '#CBD5E1',
  gray600: '#E2E8F0',
  gray700: '#F1F5F9',
  gray800: '#F8FAFC',
  gray900: '#FFFFFF',

  success10: '#14532D',
  error10: '#450A0A',
  primary10: '#1E3A8A',
  secondary10: '#064E3B',
  warning10: '#451A03',

  overlay: 'rgba(0, 0, 0, 0.7)',
  overlayLight: 'rgba(0, 0, 0, 0.5)',
  overlayDark: 'rgba(0, 0, 0, 0.9)',

  income: '#34D399',
  expense: '#F87171',
  transfer: '#A78BFA',

  statusBarStyle: 'light',
  statusBarBackground: '#0F172A',
};

interface ThemeContextType {
  theme: Theme;
  themeMode: ThemeMode;
  isDarkMode: boolean;
  toggleTheme: () => void;
  setThemeMode: (mode: ThemeMode) => void;
}

export const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

interface ThemeProviderProps {
  children: ReactNode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const [themeMode, setThemeModeState] = useState<ThemeMode>('light');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadTheme();
  }, []);

  const loadTheme = async () => {
    try {
      const savedTheme = await AsyncStorage.getItem(STORAGE_KEYS.THEME);
      if (savedTheme === 'dark' || savedTheme === 'light') {
        setThemeModeState(savedTheme);
      }
    } catch (error) {
      console.error('Erro ao carregar tema:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const setThemeMode = async (mode: ThemeMode) => {
    try {
      setThemeModeState(mode);
      await AsyncStorage.setItem(STORAGE_KEYS.THEME, mode);
    } catch (error) {
      console.error('Erro ao salvar tema:', error);
    }
  };

  const toggleTheme = async () => {
    const newMode: ThemeMode = themeMode === 'light' ? 'dark' : 'light';
    await setThemeMode(newMode);
  };

  const theme = themeMode === 'dark' ? darkTheme : lightTheme;
  const isDarkMode = themeMode === 'dark';

  if (isLoading) {
    return null;
  }

  return (
    <ThemeContext.Provider
      value={{
        theme,
        themeMode,
        isDarkMode,
        toggleTheme,
        setThemeMode,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme deve ser usado dentro de ThemeProvider');
  }
  return context;
};
