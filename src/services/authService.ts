import apiService from './api'
import { LoginResponse, User, RegisterData, LoginData } from '../types/auth'

export interface ForgotPasswordData {
  email: string
}

export interface ResetPasswordData {
  email: string
  code: string
  novaSenha: string
}

export interface UpdateProfileData {
  nome?: string
  email?: string
  senha?: string
  configuracoes?: {
    tema?: 'claro' | 'escuro' | 'sistema'
    moeda?: string
    notificacoes?: {
      email?: boolean
      push?: boolean
      orcamento?: boolean
      metas?: boolean
    }
  }
}

class AuthService {
  /**
   * Fazer login do usuário
   */
  async login(email: string, senha: string): Promise<LoginResponse> {
    const data: LoginData = { email, senha }
    const response = await apiService.post<{
      success: boolean
      data: LoginResponse
    }>('/auth/login', data)
    
    return response.data
  }

  /**
   * Registrar novo usuário
   */
  async register(nome: string, email: string, senha: string): Promise<LoginResponse> {
    const data: RegisterData = { nome, email, senha }
    const response = await apiService.post<{
      success: boolean
      data: LoginResponse
    }>('/auth/register', data)
    
    return response.data
  }

  /**
   * Solicitar código de recuperação de senha
   */
  async forgotPassword(email: string): Promise<void> {
    const data: ForgotPasswordData = { email }
    await apiService.post('/auth/forgot-password', data)
  }

  /**
   * Redefinir senha com código
   */
  async resetPassword(email: string, code: string, novaSenha: string): Promise<void> {
    const data: ResetPasswordData = { email, code, novaSenha }
    await apiService.post('/auth/reset-password', data)
  }

  /**
   * Fazer logout
   */
  async logout(): Promise<void> {
    await apiService.post('/auth/logout')
  }

  /**
   * Obter perfil do usuário
   */
  async getProfile(): Promise<User> {
    const response = await apiService.get<{
      success: boolean
      data: {
        user: User
        estatisticas: any
      }
    }>('/user/profile')
    
    return response.data.user
  }

  /**
   * Atualizar perfil do usuário
   */
  async updateProfile(data: UpdateProfileData): Promise<User> {
    const response = await apiService.patch<{
      success: boolean
      data: User
    }>('/user/profile', data)
    
    return response.data
  }

  /**
   * Alterar senha do usuário
   */
  async changePassword(senhaAtual: string, novaSenha: string): Promise<void> {
    await apiService.post('/user/change-password', {
      senhaAtual,
      novaSenha
    })
  }

  /**
   * Atualizar configurações do usuário
   */
  async updateSettings(configuracoes: UpdateProfileData['configuracoes']): Promise<void> {
    await apiService.patch('/user/settings', configuracoes)
  }

  /**
   * Excluir conta do usuário
   */
  async deleteAccount(senha: string): Promise<void> {
    await apiService.delete('/user/delete-account', {
      data: {
        senha,
        confirmacao: 'EXCLUIR CONTA'
      }
    })
  }

  /**
   * Obter estatísticas do usuário
   */
  async getUserStatistics(periodo: 'mes' | 'trimestre' | 'ano' | 'tudo' = 'ano') {
    const response = await apiService.get<{
      success: boolean
      data: any
    }>(`/user/statistics/overview?periodo=${periodo}`)
    
    return response.data
  }

  /**
   * Exportar dados do usuário
   */
  async exportData(formato: 'json' | 'csv' = 'json', incluir: string = 'todos') {
    const response = await apiService.get<{
      success: boolean
      data: any
    }>(`/user/export/data?formato=${formato}&incluir=${incluir}`)
    
    return response.data
  }

  /**
   * Importar dados do usuário
   */
  async importData(dados: any, sobrescrever: boolean = false) {
    const response = await apiService.post<{
      success: boolean
      data: any
    }>('/user/import/data', {
      dados,
      sobrescrever
    })
    
    return response.data
  }

  /**
   * Verificar se o token é válido
   */
  async validateToken(): Promise<boolean> {
    try {
      await this.getProfile()
      return true
    } catch (error) {
      return false
    }
  }

  /**
   * Renovar token de acesso
   */
  async refreshToken(refreshToken: string): Promise<{ token: string, refreshToken: string }> {
    const response = await apiService.post<{
      success: boolean
      data: {
        token: string
        refreshToken: string
      }
    }>('/auth/refresh-token', { refreshToken })
    
    return response.data
  }
}

export const authService = new AuthService()
export default authService