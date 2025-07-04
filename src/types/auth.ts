export interface User {
  _id: string
  nome: string
  email: string
  emailVerificado: boolean
  avatarUrl?: string
  configuracoes: {
    tema: 'claro' | 'escuro' | 'sistema'
    moeda: string
    notificacoes: {
      email: boolean
      push: boolean
      orcamento: boolean
      metas: boolean
    }
    privacidade: {
      perfilPublico: boolean
      compartilharDados: boolean
    }
  }
  ultimoLogin?: string
  criadoEm: string
  atualizadoEm: string
}

export interface LoginData {
  email: string
  senha: string
}

export interface RegisterData {
  nome: string
  email: string
  senha: string
}

export interface LoginResponse {
  token: string
  refreshToken?: string
  user: User
}

export interface AuthState {
  user: User | null
  isLoading: boolean
  isAuthenticated: boolean
  error: string | null
}

export interface ForgotPasswordResponse {
  success: boolean
  message: string
}

export interface ResetPasswordResponse {
  success: boolean
  message: string
}