// Cores do app
export const COLORS = {
  // Cores principais
  primary: '#4CAF50',
  primaryDark: '#45a049',
  primaryLight: '#81C784',
  secondary: '#2196F3',
  secondaryDark: '#1976D2',
  
  // Estados
  success: '#10B981',
  warning: '#F59E0B',
  error: '#EF4444',
  info: '#3B82F6',
  
  // Tons de cinza
  white: '#FFFFFF',
  black: '#000000',
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
  
  // Fundos
  background: '#F8FAFC',
  surface: '#FFFFFF',
  overlay: 'rgba(0, 0, 0, 0.5)',
  
  // Transações
  income: '#10B981',
  expense: '#EF4444',
  
  // Bordas
  border: '#E5E7EB',
  borderLight: '#F3F4F6',
  
  // Textos
  textPrimary: '#111827',
  textSecondary: '#6B7280',
  textTertiary: '#9CA3AF',
  textWhite: '#FFFFFF',
  
  // Transparências
  primary10: 'rgba(76, 175, 80, 0.1)',
  primary20: 'rgba(76, 175, 80, 0.2)',
  success10: 'rgba(16, 185, 129, 0.1)',
  error10: 'rgba(239, 68, 68, 0.1)',
  warning10: 'rgba(245, 158, 11, 0.1)',
};

// Fontes
export const FONTS = {
  light: 'System',
  regular: 'System',
  medium: 'System',
  semiBold: 'System',
  bold: 'System',
};

// Tamanhos de fonte
export const FONT_SIZES = {
  xs: 12,
  sm: 14,
  md: 16,
  lg: 18,
  xl: 20,
  '2xl': 24,
  '3xl': 28,
  '4xl': 32,
  '5xl': 36,
  '6xl': 42,
};

// Espaçamentos
export const SPACING = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  '2xl': 48,
  '3xl': 64,
};

// Raios de borda
export const BORDER_RADIUS = {
  none: 0,
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  '2xl': 20,
  '3xl': 24,
  full: 9999,
};

// Sombras
export const SHADOWS = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },
  xl: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 8,
  },
};

// Configurações da API
export const API_CONFIG = {
  BASE_URL: __DEV__ ? 'http://localhost:3000' : 'https://your-api.com',
  TIMEOUT: 10000,
  RETRY_ATTEMPTS: 3,
};

// Configurações de validação
export const VALIDATION_RULES = {
  email: {
    pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    message: 'Digite um email válido',
  },
  password: {
    minLength: 6,
    pattern: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
    message: 'Senha deve ter pelo menos 6 caracteres com letra maiúscula, minúscula e número',
  },
  amount: {
    min: 0.01,
    max: 999999999,
    message: 'Valor deve estar entre R$ 0,01 e R$ 999.999.999,00',
  },
  name: {
    minLength: 2,
    maxLength: 50,
    message: 'Nome deve ter entre 2 e 50 caracteres',
  },
};

// Configurações de paginação
export const PAGINATION = {
  DEFAULT_LIMIT: 20,
  MAX_LIMIT: 100,
};

// Formatos de data
export const DATE_FORMATS = {
  display: 'DD/MM/YYYY',
  displayWithTime: 'DD/MM/YYYY HH:mm',
  api: 'YYYY-MM-DD',
  apiWithTime: 'YYYY-MM-DDTHH:mm:ss.SSSZ',
};

// Configurações de moeda
export const CURRENCY = {
  code: 'BRL',
  symbol: 'R$',
  precision: 2,
  separator: ',',
  delimiter: '.',
};

// Configurações de notificação
export const NOTIFICATION_CONFIG = {
  AUTO_HIDE_DURATION: 3000,
  MAX_NOTIFICATIONS: 5,
};

// Categorias padrão
export const DEFAULT_CATEGORIES = {
  expense: [
    { name: 'Alimentação', icon: '🍔', color: '#F59E0B' },
    { name: 'Transporte', icon: '🚗', color: '#3B82F6' },
    { name: 'Saúde', icon: '🏥', color: '#EF4444' },
    { name: 'Educação', icon: '📚', color: '#8B5CF6' },
    { name: 'Lazer', icon: '🎮', color: '#F97316' },
    { name: 'Compras', icon: '🛍️', color: '#EC4899' },
    { name: 'Casa', icon: '🏠', color: '#10B981' },
    { name: 'Outros', icon: '💰', color: '#6B7280' },
  ],
  income: [
    { name: 'Salário', icon: '💼', color: '#10B981' },
    { name: 'Freelance', icon: '💻', color: '#3B82F6' },
    { name: 'Investimentos', icon: '📈', color: '#8B5CF6' },
    { name: 'Outros', icon: '💰', color: '#6B7280' },
  ],
};

// Tipos de meta
export const GOAL_TYPES = {
  EMERGENCY_FUND: 'emergency_fund',
  VACATION: 'vacation',
  HOUSE: 'house',
  CAR: 'car',
  EDUCATION: 'education',
  RETIREMENT: 'retirement',
  OTHER: 'other',
};

// Status de meta
export const GOAL_STATUS = {
  ACTIVE: 'active',
  COMPLETED: 'completed',
  PAUSED: 'paused',
};

// Períodos para relatórios
export const REPORT_PERIODS = {
  WEEK: 'week',
  MONTH: 'month',
  QUARTER: 'quarter',
  YEAR: 'year',
  CUSTOM: 'custom',
};

// Tipos de gráfico
export const CHART_TYPES = {
  LINE: 'line',
  BAR: 'bar',
  PIE: 'pie',
  DONUT: 'donut',
};

// Configurações de performance
export const PERFORMANCE = {
  IMAGE_CACHE_SIZE: 100,
  LIST_INITIAL_BATCH_SIZE: 10,
  LIST_WINDOW_SIZE: 21,
  LIST_UPDATE_CELL_BATCH_SIZE: 5,
};

// URLs úteis
export const URLS = {
  PRIVACY_POLICY: 'https://your-app.com/privacy',
  TERMS_OF_SERVICE: 'https://your-app.com/terms',
  SUPPORT: 'mailto:support@your-app.com',
  WEBSITE: 'https://your-app.com',
};

// Configurações de animação
export const ANIMATION_CONFIG = {
  DURATION: {
    SHORT: 200,
    MEDIUM: 300,
    LONG: 500,
  },
  EASING: {
    EASE_IN_OUT: 'ease-in-out',
    EASE_OUT: 'ease-out',
    SPRING: 'spring',
  },
};

export default {
  COLORS,
  FONTS,
  FONT_SIZES,
  SPACING,
  BORDER_RADIUS,
  SHADOWS,
  API_CONFIG,
  VALIDATION_RULES,
  PAGINATION,
  DATE_FORMATS,
  CURRENCY,
  NOTIFICATION_CONFIG,
  DEFAULT_CATEGORIES,
  GOAL_TYPES,
  GOAL_STATUS,
  REPORT_PERIODS,
  CHART_TYPES,
  PERFORMANCE,
  URLS,
  ANIMATION_CONFIG,
};