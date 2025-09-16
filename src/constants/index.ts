import Constants from 'expo-constants';

// API Configuration
export const API_CONFIG = {
  BASE_URL: __DEV__ 
    ? 'http://10.0.2.2:5000/api' // Para Android Emulator
    : 'https://your-production-api.com/api', // Produção
  TIMEOUT: 10000,
};

// Para debug - você pode adicionar isso temporariamente
console.log('API_CONFIG.BASE_URL:', API_CONFIG.BASE_URL);

// Colors
export const COLORS = {
  // Primary colors
  primary: '#667eea',
  primaryDark: '#5a6fd8',
  primaryLight: '#8da2f5',
  
  // Secondary colors
  secondary: '#764ba2',
  secondaryDark: '#6a4190',
  secondaryLight: '#8a5cb4',
  
  // Accent colors
  accent: '#f093fb',
  accentDark: '#ed7ef0',
  accentLight: '#f5b9fd',
  
  // Semantic colors
  success: '#4CAF50',
  successLight: '#81C784',
  successDark: '#388E3C',
  
  error: '#F44336',
  errorLight: '#EF5350',
  errorDark: '#D32F2F',
  
  warning: '#FF9800',
  warningLight: '#FFB74D',
  warningDark: '#F57C00',
  
  info: '#2196F3',
  infoLight: '#64B5F6',
  infoDark: '#1976D2',
  
  // Neutral colors
  white: '#FFFFFF',
  black: '#000000',
  
  // Gray scale
  gray50: '#FAFAFA',
  gray100: '#F5F5F5',
  gray200: '#EEEEEE',
  gray300: '#E0E0E0',
  gray400: '#BDBDBD',
  gray500: '#9E9E9E',
  gray600: '#757575',
  gray700: '#616161',
  gray800: '#424242',
  gray900: '#212121',
  
  // Background colors
  background: '#F8F9FA',
  surface: '#FFFFFF',
  
  // Text colors
  textPrimary: '#212121',
  textSecondary: '#757575',
  textHint: '#BDBDBD',
  textOnPrimary: '#FFFFFF',
  textOnSecondary: '#FFFFFF',
  
  // Income/Expense colors
  income: '#4CAF50',
  expense: '#F44336',
  
  // Chart colors
  chartColors: [
    '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0',
    '#9966FF', '#FF9F40', '#FF6384', '#C9CBCF',
    '#4BC0C0', '#FF6384', '#36A2EB', '#FFCE56'
  ],
};

// Typography
export const FONTS = {
  regular: 'System',
  medium: 'System',
  bold: 'System',
  light: 'System',
};

export const FONT_SIZES = {
  xs: 12,
  sm: 14,
  md: 16,
  lg: 18,
  xl: 20,
  '2xl': 24,
  '3xl': 30,
  '4xl': 36,
};

// Spacing
export const SPACING = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  '2xl': 48,
  '3xl': 64,
};

// Border radius
export const BORDER_RADIUS = {
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  '2xl': 24,
  full: 9999,
};

// Shadows
export const SHADOWS = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.18,
    shadowRadius: 1.0,
    elevation: 1,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.23,
    shadowRadius: 2.62,
    elevation: 4,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.30,
    shadowRadius: 4.65,
    elevation: 8,
  },
  xl: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.37,
    shadowRadius: 7.49,
    elevation: 12,
  },
};

// Transaction types
export const TRANSACTION_TYPES = {
  INCOME: 'income' as const,
  EXPENSE: 'expense' as const,
};

// Goal status
export const GOAL_STATUS = {
  ACTIVE: 'active' as const,
  COMPLETED: 'completed' as const,
  PAUSED: 'paused' as const,
};

// Screen dimensions
export const SCREEN_WIDTH = Constants.screenWidth || 375;
export const SCREEN_HEIGHT = Constants.screenHeight || 812;

// Common icons
export const ICONS = {
  // Navigation icons
  home: 'home',
  transactions: 'swap-horizontal',
  goals: 'target',
  budgets: 'wallet',
  reports: 'bar-chart',
  profile: 'person',
  
  // Action icons
  add: 'add',
  edit: 'create',
  delete: 'trash',
  save: 'checkmark',
  cancel: 'close',
  back: 'arrow-back',
  forward: 'arrow-forward',
  
  // Common icons
  search: 'search',
  filter: 'filter',
  menu: 'menu',
  settings: 'settings',
  help: 'help-circle',
  info: 'information-circle',
  warning: 'warning',
  error: 'alert-circle',
  success: 'checkmark-circle',
  
  // Financial icons
  income: 'trending-up',
  expense: 'trending-down',
  balance: 'scale',
  category: 'pricetag',
  recurring: 'refresh',
  
  // Date/Time icons
  calendar: 'calendar',
  time: 'time',
  
  // UI icons
  eye: 'eye',
  eyeOff: 'eye-off',
  chevronDown: 'chevron-down',
  chevronUp: 'chevron-up',
  chevronRight: 'chevron-forward',
  chevronLeft: 'chevron-back',
};

// Storage keys
export const STORAGE_KEYS = {
  AUTH_TOKEN: '@finance_app:auth_token',
  USER_DATA: '@finance_app:user_data',
  SETTINGS: '@finance_app:settings',
  ONBOARDING: '@finance_app:onboarding_completed',
};

// Error messages
export const ERROR_MESSAGES = {
  NETWORK_ERROR: 'Erro de conexão. Verifique sua internet.',
  SERVER_ERROR: 'Erro interno do servidor. Tente novamente.',
  UNAUTHORIZED: 'Sessão expirada. Faça login novamente.',
  VALIDATION_ERROR: 'Dados inválidos. Verifique os campos.',
  UNKNOWN_ERROR: 'Erro desconhecido. Tente novamente.',
};

// Success messages
export const SUCCESS_MESSAGES = {
  LOGIN: 'Login realizado com sucesso!',
  REGISTER: 'Conta criada com sucesso!',
  LOGOUT: 'Logout realizado com sucesso!',
  TRANSACTION_CREATED: 'Transação criada com sucesso!',
  TRANSACTION_UPDATED: 'Transação atualizada com sucesso!',
  TRANSACTION_DELETED: 'Transação deletada com sucesso!',
  GOAL_CREATED: 'Meta criada com sucesso!',
  GOAL_UPDATED: 'Meta atualizada com sucesso!',
  GOAL_DELETED: 'Meta deletada com sucesso!',
  BUDGET_CREATED: 'Orçamento criado com sucesso!',
  BUDGET_UPDATED: 'Orçamento atualizado com sucesso!',
  BUDGET_DELETED: 'Orçamento deletado com sucesso!',
};

// Validation rules
export const VALIDATION_RULES = {
  EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  PASSWORD_MIN_LENGTH: 6,
  NAME_MIN_LENGTH: 2,
  AMOUNT_MIN: 0.01,
  AMOUNT_MAX: 9999999.99,
};

// Date formats
export const DATE_FORMATS = {
  DISPLAY: 'DD/MM/YYYY',
  DISPLAY_WITH_TIME: 'DD/MM/YYYY HH:mm',
  API: 'YYYY-MM-DD',
  API_WITH_TIME: 'YYYY-MM-DDTHH:mm:ss.sssZ',
};

// Default values
export const DEFAULT_VALUES = {
  PAGINATION_LIMIT: 20,
  CHART_COLORS: COLORS.chartColors,
  CURRENCY_SYMBOL: 'R$',
  CURRENCY_LOCALE: 'pt-BR',
};