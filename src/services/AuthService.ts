// src/services/AuthService.ts
import { API_CONFIG } from '../constants';
import { AuthResponse, LoginFormData, RegisterFormData, User, ApiResponse } from '../types';

class AuthServiceClass {
  private baseURL: string;
  private useMock: boolean = false; // ✅ TEMPORÁRIO: Usar mock enquanto não tem servidor

  constructor() {
    this.baseURL = API_CONFIG.BASE_URL;
  }

  // Mock para desenvolvimento - REMOVER quando tiver servidor real
  private createMockUser(email: string, name?: string): User {
    return {
      id: 'user-' + Date.now(),
      name: name || 'Usuário Teste',
      email: email,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  }

  // Função auxiliar para fazer requisições
  private async request<T = any>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;
    
    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    };

    // Criar AbortController para timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), API_CONFIG.TIMEOUT);
    config.signal = controller.signal;

    try {
      const response = await fetch(url, config);
      clearTimeout(timeoutId);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || `HTTP ${response.status}`);
      }

      return data;
    } catch (error: any) {
      if (error.name === 'AbortError') {
        throw new Error('Tempo limite da requisição excedido');
      }
      throw error;
    }
  }

  // Login
  async login(credentials: LoginFormData): Promise<AuthResponse> {
    if (this.useMock) {
      // MOCK para desenvolvimento
      return new Promise((resolve, reject) => {
        setTimeout(() => {
          // Simular validação básica
          if (credentials.email && credentials.password.length >= 6) {
            resolve({
              success: true,
              message: 'Login realizado com sucesso',
              token: 'mock-token-' + Date.now(),
              user: this.createMockUser(credentials.email)
            });
          } else {
            reject(new Error('Email ou senha inválidos'));
          }
        }, 1000); // Simular delay da rede
      });
    }

    try {
      const response = await this.request<AuthResponse>('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify(credentials),
      });

      return response;
    } catch (error: any) {
      throw new Error(error.message || 'Erro no login');
    }
  }

  // Registro
  async register(userData: RegisterFormData): Promise<AuthResponse> {
    if (this.useMock) {
      // MOCK para desenvolvimento
      return new Promise((resolve, reject) => {
        setTimeout(() => {
          // Simular validação básica
          if (userData.email && userData.password.length >= 6 && userData.name) {
            resolve({
              success: true,
              message: 'Registro realizado com sucesso',
              token: 'mock-token-' + Date.now(),
              user: this.createMockUser(userData.email, userData.name)
            });
          } else {
            reject(new Error('Dados inválidos para registro'));
          }
        }, 1500); // Simular delay da rede
      });
    }

    try {
      const response = await this.request<AuthResponse>('/api/auth/register', {
        method: 'POST',
        body: JSON.stringify(userData),
      });

      return response;
    } catch (error: any) {
      throw new Error(error.message || 'Erro no registro');
    }
  }

  // Logout
  async logout(): Promise<void> {
    if (this.useMock) {
      // MOCK para desenvolvimento
      return new Promise((resolve) => {
        setTimeout(() => {
          resolve();
        }, 500);
      });
    }

    try {
      await this.request('/api/auth/logout', {
        method: 'POST',
      });
    } catch (error: any) {
      // Logout pode falhar no servidor, mas isso não deve impedir o logout local
      console.warn('Erro no logout do servidor:', error.message);
    }
  }

  // Esqueci a senha
  async forgotPassword(email: string): Promise<ApiResponse> {
    if (this.useMock) {
      // MOCK para desenvolvimento
      return new Promise((resolve) => {
        setTimeout(() => {
          resolve({
            success: true,
            message: 'Email de recuperação enviado com sucesso'
          });
        }, 1000);
      });
    }

    try {
      const response = await this.request<ApiResponse>('/api/auth/forgot-password', {
        method: 'POST',
        body: JSON.stringify({ email }),
      });

      return response;
    } catch (error: any) {
      throw new Error(error.message || 'Erro ao enviar email de recuperação');
    }
  }

  // Redefinir senha
  async resetPassword(token: string, newPassword: string): Promise<ApiResponse> {
    try {
      const response = await this.request<ApiResponse>('/api/auth/reset-password', {
        method: 'POST',
        body: JSON.stringify({ token, newPassword }),
      });

      return response;
    } catch (error: any) {
      throw new Error(error.message || 'Erro ao redefinir senha');
    }
  }

  // Validar token
  async validateToken(token: string): Promise<boolean> {
    if (this.useMock) {
      // MOCK para desenvolvimento - sempre válido se começar com 'mock-token'
      return token.startsWith('mock-token');
    }

    try {
      const response = await this.request('/api/auth/validate', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      return response.success;
    } catch (error) {
      return false;
    }
  }

  // Atualizar perfil
  async updateProfile(userData: Partial<User>): Promise<{ success: boolean; user: User; message?: string }> {
    if (this.useMock) {
      // MOCK para desenvolvimento
      return new Promise((resolve) => {
        setTimeout(() => {
          resolve({
            success: true,
            user: {
              id: 'user-mock',
              name: userData.name || 'Usuário Atualizado',
              email: userData.email || 'user@mock.com',
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            },
            message: 'Perfil atualizado com sucesso'
          });
        }, 800);
      });
    }

    try {
      const response = await this.request<{ success: boolean; user: User; message?: string }>('/api/auth/profile', {
        method: 'PUT',
        body: JSON.stringify(userData),
      });

      return response;
    } catch (error: any) {
      throw new Error(error.message || 'Erro ao atualizar perfil');
    }
  }

  // Alterar senha
  async changePassword(currentPassword: string, newPassword: string): Promise<ApiResponse> {
    try {
      const response = await this.request<ApiResponse>('/api/auth/change-password', {
        method: 'POST',
        body: JSON.stringify({ currentPassword, newPassword }),
      });

      return response;
    } catch (error: any) {
      throw new Error(error.message || 'Erro ao alterar senha');
    }
  }

  // Verificar disponibilidade de email
  async checkEmailAvailability(email: string): Promise<{ available: boolean }> {
    try {
      const response = await this.request<{ available: boolean }>(`/api/auth/check-email?email=${encodeURIComponent(email)}`, {
        method: 'GET',
      });

      return response;
    } catch (error: any) {
      throw new Error(error.message || 'Erro ao verificar email');
    }
  }

  // Reenviar email de verificação
  async resendVerificationEmail(email: string): Promise<ApiResponse> {
    try {
      const response = await this.request<ApiResponse>('/api/auth/resend-verification', {
        method: 'POST',
        body: JSON.stringify({ email }),
      });

      return response;
    } catch (error: any) {
      throw new Error(error.message || 'Erro ao reenviar email de verificação');
    }
  }

  // Verificar email
  async verifyEmail(token: string): Promise<ApiResponse> {
    try {
      const response = await this.request<ApiResponse>('/api/auth/verify-email', {
        method: 'POST',
        body: JSON.stringify({ token }),
      });

      return response;
    } catch (error: any) {
      throw new Error(error.message || 'Erro ao verificar email');
    }
  }

  // Refresh token
  async refreshToken(refreshToken: string): Promise<{ token: string; refreshToken: string }> {
    try {
      const response = await this.request<{ token: string; refreshToken: string }>('/api/auth/refresh', {
        method: 'POST',
        body: JSON.stringify({ refreshToken }),
      });

      return response;
    } catch (error: any) {
      throw new Error(error.message || 'Erro ao renovar token');
    }
  }

  // Deletar conta
  async deleteAccount(password: string): Promise<ApiResponse> {
    try {
      const response = await this.request<ApiResponse>('/api/auth/delete-account', {
        method: 'DELETE',
        body: JSON.stringify({ password }),
      });

      return response;
    } catch (error: any) {
      throw new Error(error.message || 'Erro ao deletar conta');
    }
  }
}

export const AuthService = new AuthServiceClass();