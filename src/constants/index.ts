// Cores do app
export const COLORS = {
  // Cores primárias
  primary: '#2563EB',
  primaryDark: '#1D4ED8',
  primaryLight: '#3B82F6',
  
  // Cores secundárias
  secondary: '#64748B',
  secondaryDark: '#475569',
  
  // Status colors
  success: '#10B981',
  warning: '#F59E0B',
  error: '#EF4444',
  info: '#3B82F6',
  
  // Neutras
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
  
  // Text colors
  textPrimary: '#111827',
  textSecondary: '#6B7280',
  textWhite: '#FFFFFF',
  textHint: '#9CA3AF',
  
  // Background colors
  background: '#FFFFFF',
  backgroundSecondary: '#F9FAFB',
  backgroundDark: '#1F2937',
  
  // Border colors
  border: '#E5E7EB',
  borderLight: '#F3F4F6',
  
  // Component specific colors
  inputBackground: '#F9FAFB',
  inputBorder: '#D1D5DB',
  
  // Overlay colors - ADICIONADO
  overlay: 'rgba(0, 0, 0, 0.5)',
  overlayLight: 'rgba(0, 0, 0, 0.3)',
  overlayDark: 'rgba(0, 0, 0, 0.7)',
  
  // Variações de cores com transparência
  primary10: 'rgba(37, 99, 235, 0.1)',
  primary20: 'rgba(37, 99, 235, 0.2)',
  success10: 'rgba(16, 185, 129, 0.1)',
  warning10: 'rgba(245, 158, 11, 0.1)',
  error10: 'rgba(239, 68, 68, 0.1)',
  
  // Cores específicas para status de transações
  income: '#10B981',
  expense: '#EF4444',
  transfer: '#8B5CF6',
  
  // Cores adicionais para variações light
  infoLight: 'rgba(59, 130, 246, 0.1)',
  errorLight: 'rgba(239, 68, 68, 0.1)',
};

// Fontes
export const FONTS = {
  regular: 'System',
  medium: 'System',
  bold: 'System',
  light: 'System',
};

// Tamanhos de fonte
export const FONT_SIZES = {
  xs: 12,
  sm: 14,
  base: 16,
  lg: 18,
  xl: 20,
  xxl: 24,
  xxxl: 32,
  '2xl': 24, // Adicionado para resolver o erro no TransactionListScreen
  '3xl': 30, // Adicionado para resolver erros em auth screens
  md: 16,   // Adicionado para resolver o erro no TransactionListScreen
};

// Espaçamentos
export const SPACING = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

// Bordas
export const BORDER_RADIUS = {
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  full: 9999,
};

// Sombras - ADICIONADO
export const SHADOWS = {
  sm: {
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.18,
    shadowRadius: 1.0,
    elevation: 1,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.23,
    shadowRadius: 2.62,
    elevation: 4,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.30,
    shadowRadius: 4.65,
    elevation: 8,
  },
  xl: {
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 6,
    },
    shadowOpacity: 0.37,
    shadowRadius: 7.49,
    elevation: 12,
  },
  card: {
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
};

// Chaves do AsyncStorage
export const STORAGE_KEYS = {
  TOKEN: '@FinanceApp:token',
  USER: '@FinanceApp:user',
  BIOMETRIC_ENABLED: '@FinanceApp:biometric',
  THEME: '@FinanceApp:theme',
  LANGUAGE: '@FinanceApp:language',
  FIRST_LAUNCH: '@FinanceApp:firstLaunch',
  
  // Adicionando as chaves que estavam sendo usadas no api.ts
  AUTH_TOKEN: '@FinanceApp:token', // Mesmo valor que TOKEN
  USER_DATA: '@FinanceApp:user',   // Mesmo valor que USER
};

// Mensagens de erro
export const ERROR_MESSAGES = {
  NETWORK_ERROR: 'Erro de conexão. Verifique sua internet.',
  SERVER_ERROR: 'Erro no servidor. Tente novamente mais tarde.',
  UNAUTHORIZED: 'Sessão expirada. Faça login novamente.',
  VALIDATION_ERROR: 'Dados inválidos. Verifique os campos.',
  UNKNOWN_ERROR: 'Erro desconhecido. Tente novamente.',
  EMAIL_ALREADY_EXISTS: 'Este email já está cadastrado.',
  INVALID_CREDENTIALS: 'Email ou senha incorretos.',
  USER_NOT_FOUND: 'Usuário não encontrado.',
  WEAK_PASSWORD: 'Senha muito fraca.',
  EMAIL_NOT_VERIFIED: 'Email não verificado.',
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
  
  // Adicionando as constantes que estavam faltando
  EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  PASSWORD_MIN_LENGTH: 6,
  NAME_MIN_LENGTH: 2,
  NAME_MAX_LENGTH: 50,
  AMOUNT_MIN: 0.01,
  AMOUNT_MAX: 999999999,
};

// Valores padrão
export const DEFAULT_VALUES = {
  CURRENCY_LOCALE: 'pt-BR',
  CURRENCY_CODE: 'BRL',
  CURRENCY_SYMBOL: 'R$',
  DATE_LOCALE: 'pt-BR',
  PAGINATION_LIMIT: 20,
  API_TIMEOUT: 10000,
  RETRY_ATTEMPTS: 3,
};

// Configurações de API
export const API_CONFIG = {
  BASE_URL: __DEV__ ? 
    'http://10.0.2.2:5000' : // Android emulador
    // 'http://localhost:3000' : // iOS simulator  
    'https://your-api.com',
  TIMEOUT: 10000,
  RETRY_ATTEMPTS: 3,
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
  
  // Adicionando as variações em maiúscula que estavam sendo usadas
  DISPLAY: 'DD/MM/YYYY',
  DISPLAY_WITH_TIME: 'DD/MM/YYYY HH:mm',
  API: 'YYYY-MM-DD',
  API_WITH_TIME: 'YYYY-MM-DDTHH:mm:ss.SSSZ',
};

// Configurações de moeda
export const CURRENCY = {
  code: 'BRL',
  symbol: 'R$',
  precision: 2,
  separator: ',',
  delimiter: '.',
  locale: 'pt-BR',
};

// Tipos de transação
export const TRANSACTION_TYPES = {
  INCOME: 'income',
  EXPENSE: 'expense',
  TRANSFER: 'transfer',
};

// Categorias padrão
export const DEFAULT_CATEGORIES = {
  INCOME: [
    'Salário',
    'Freelance',
    'Investimentos',
    'Outros',
  ],
  EXPENSE: [
    'Alimentação',
    'Transporte',
    'Moradia',
    'Saúde',
    'Educação',
    'Entretenimento',
    'Outros',
  ],
};

// Configurações de biometria
export const BIOMETRIC_CONFIG = {
  TITLE: 'Autenticação Biométrica',
  SUBTITLE: 'Use sua impressão digital ou Face ID',
  DESCRIPTION: 'Confirme sua identidade para acessar o app',
  FALLBACK_TITLE: 'Usar senha',
  NEGATIVE_TEXT: 'Cancelar',
};

// Temas
export const THEMES = {
  LIGHT: 'light',
  DARK: 'dark',
  SYSTEM: 'system',
};

// Configurações de notificação
export const NOTIFICATION_CONFIG = {
  CHANNEL_ID: 'finance_app_notifications',
  CHANNEL_NAME: 'Finance App Notifications',
  CHANNEL_DESCRIPTION: 'Notificações do app de finanças',
};