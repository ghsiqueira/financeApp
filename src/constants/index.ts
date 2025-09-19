// src/constants/index.ts - CONSTANTES COMPLETAS E COMPATÍVEIS

// Cores
export const COLORS = {
  // Cores principais
  primary: '#3B82F6',
  primaryDark: '#1E40AF',
  primaryLight: '#93C5FD',
  secondary: '#10B981',
  secondaryDark: '#047857',

  // Cores de estado
  success: '#22C55E',
  warning: '#F59E0B',
  error: '#EF4444',
  info: '#06B6D4',

  // Cores básicas
  white: '#FFFFFF',
  black: '#000000',

  // Cores de fundo
  background: '#F9FAFB',
  backgroundSecondary: '#F3F4F6',

  // Cores de texto
  textPrimary: '#111827',
  textSecondary: '#6B7280',
  textTertiary: '#9CA3AF', // Necessário para HomeScreen
  textWhite: '#FFFFFF',
  textHint: '#9CA3AF',

  // Cores de borda
  border: '#E5E7EB',
  borderLight: '#F3F4F6',

  // Cores de cinza
  gray50: '#F9FAFB',
  gray100: '#F3F4F6',
  gray200: '#E5E7EB', // Necessário para HomeScreen
  gray300: '#D1D5DB',
  gray400: '#9CA3AF',
  gray500: '#6B7280',
  gray600: '#4B5563',
  gray700: '#374151',
  gray800: '#1F2937',
  gray900: '#111827',

  // Cores com transparência (necessárias para HomeScreen)
  success10: '#E7F7EF',
  error10: '#FFF2F2',
  primary10: '#EBF4FF',
  secondary10: '#E6FFFA',
  warning10: '#FFFAEB',

  // Variações de cores
  successLight: '#86EFAC',
  successDark: '#15803D',
  warningLight: '#FCD34D',
  warningDark: '#D97706',
  errorLight: '#FCA5A5',
  errorDark: '#DC2626',
  infoLight: '#67E8F9',
  infoDark: '#0891B2',

  // Overlay colors (adicionados para compatibilidade)
  overlay: 'rgba(0, 0, 0, 0.5)',
  overlayLight: 'rgba(0, 0, 0, 0.3)',
  overlayDark: 'rgba(0, 0, 0, 0.7)',

  // Cores específicas para status de transações
  income: '#10B981',
  expense: '#EF4444',
  transfer: '#8B5CF6',

  primary20: 'rgba(59, 130, 246, 0.2)',
};

// Espaçamentos
export const SPACING = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
  '2xl': 32, // Alias para xl, necessário para HomeScreen
  '3xl': 48, // Para casos futuros
};

// Tamanhos de fonte
export const FONT_SIZES = {
  xs: 12,
  sm: 14,
  base: 16,   // Adicionado para compatibilidade
  md: 16,
  lg: 18,
  xl: 20,
  xxl: 24,    // Adicionado para compatibilidade
  xxxl: 32,   // Adicionado para compatibilidade
  '2xl': 24,
  '3xl': 30,
  '4xl': 36,
};

// Fontes
export const FONTS = {
  regular: 'System',
  medium: 'System',
  bold: 'System',
  light: 'System',
  thin: 'System',
};

// Bordas
export const BORDER_RADIUS = {
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  '2xl': 20,
  full: 9999,
};

// Sombras
export const SHADOWS = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8,
  },
  xl: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 12,
  },
  card: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
};

// Animações
export const ANIMATIONS = {
  DURATION: {
    fast: 150,
    normal: 250,
    slow: 350,
  },
  EASING: {
    linear: 'linear',
    ease: 'ease',
    easeIn: 'ease-in',
    easeOut: 'ease-out',
    easeInOut: 'ease-in-out',
  },
};

// Breakpoints para responsividade
export const BREAKPOINTS = {
  xs: 0,
  sm: 576,
  md: 768,
  lg: 992,
  xl: 1200,
  xxl: 1400,
};

// Z-index para camadas
export const Z_INDEX = {
  dropdown: 1000,
  modal: 1050,
  popover: 1060,
  tooltip: 1070,
  toast: 1080,
  overlay: 1090,
};

// Configurações específicas do app
export const APP_CONFIG = {
  name: 'Finance Manager',
  version: '1.0.0',
  currency: 'BRL',
  locale: 'pt-BR',
  dateFormat: 'DD/MM/YYYY',
  timeFormat: 'HH:mm',
};

// Limites e validações
export const LIMITS = {
  description: {
    min: 3,
    max: 100,
  },
  amount: {
    min: 0.01,
    max: 999999999,
  },
  category: {
    nameMin: 2,
    nameMax: 50,
  },
  goal: {
    titleMin: 3,
    titleMax: 100,
    amountMin: 1,
    amountMax: 999999999,
  },
  budget: {
    nameMin: 3,
    nameMax: 50,
    limitMin: 1,
    limitMax: 999999999,
  },
};

// Configurações de paginação
export const PAGINATION = {
  defaultLimit: 20,
  maxLimit: 100,
  defaultPage: 1,
};

// Tipos de transação
export const TRANSACTION_TYPES = {
  INCOME: 'income' as const,
  EXPENSE: 'expense' as const,
  TRANSFER: 'transfer' as const,
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

// Status de metas
export const GOAL_STATUS = {
  ACTIVE: 'active' as const,
  COMPLETED: 'completed' as const,
  PAUSED: 'paused' as const,
};

// Tipos de notificação
export const NOTIFICATION_TYPES = {
  SUCCESS: 'success' as const,
  ERROR: 'error' as const,
  WARNING: 'warning' as const,
  INFO: 'info' as const,
};

// Configurações de formatação
export const FORMAT_CONFIG = {
  currency: {
    style: 'currency',
    currency: 'BRL',
    locale: 'pt-BR',
  },
  number: {
    locale: 'pt-BR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  },
  date: {
    locale: 'pt-BR',
    options: {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    },
  },
};

// Configurações de biometria
export const BIOMETRIC_CONFIG = {
  TITLE: 'Autenticação Biométrica',
  SUBTITLE: 'Use sua impressão digital ou Face ID',
  DESCRIPTION: 'Confirme sua identidade para acessar o app',
  FALLBACK_TITLE: 'Usar senha',
  NEGATIVE_TEXT: 'Cancelar',
};

// Configurações de notificação
export const NOTIFICATION_CONFIG = {
  CHANNEL_ID: 'finance_app_notifications',
  CHANNEL_NAME: 'Finance App Notifications',
  CHANNEL_DESCRIPTION: 'Notificações do app de finanças',
};

// Chaves do AsyncStorage
export const STORAGE_KEYS = {
  TOKEN: '@FinanceApp:token',
  USER: '@FinanceApp:user',
  BIOMETRIC_ENABLED: '@FinanceApp:biometric',
  THEME: '@FinanceApp:theme',
  LANGUAGE: '@FinanceApp:language',
  FIRST_LAUNCH: '@FinanceApp:firstLaunch',
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

// Regras de validação
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

  // Constantes para compatibilidade
  EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  PASSWORD_MIN_LENGTH: 6,
  NAME_MIN_LENGTH: 2,
  NAME_MAX_LENGTH: 50,
  AMOUNT_MIN: 0.01,
  AMOUNT_MAX: 999999999,
};

// Configurações de API
export const API_CONFIG = {
  BASE_URL: __DEV__
    ? 'http://10.0.2.2:5000' // Android emulador
    : 'https://your-api.com',
  TIMEOUT: 10000,
  RETRY_ATTEMPTS: 3,
};
