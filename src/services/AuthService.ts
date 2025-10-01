// src/services/AuthService.ts - VERSÃO COMPLETA ATUALIZADA
import { API_CONFIG } from '../constants';
import { AuthResponse, LoginFormData, RegisterFormData, User, ApiResponse } from '../types';

class AuthServiceClass {
  private baseURL: string;
  private useMock: boolean = false;

  constructor() {
    this.baseURL = API_CONFIG.BASE_URL;
  }

  private createMockUser(email: string, name?: string): User {
    return {
      id: 'user-' + Date.now(),
      name: name || 'Usuário Teste',
      email: email,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  }

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

  async login(credentials: LoginFormData): Promise<AuthResponse> {
    if (this.useMock) {
      return new Promise((resolve, reject) => {
        setTimeout(() => {
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
        }, 1000);
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

  async register(userData: RegisterFormData): Promise<AuthResponse> {
    if (this.useMock) {
      return new Promise((resolve, reject) => {
        setTimeout(() => {
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
        }, 1500);
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

  async logout(): Promise<void> {
    if (this.useMock) {
      return new Promise((resolve) => {
        setTimeout(() => resolve(), 500);
      });
    }

    try {
      await this.request('/api/auth/logout', {
        method: 'POST',
      });
    } catch (error: any) {
      console.warn('Erro no logout do servidor:', error.message);
    }
  }

  // ===== NOVOS MÉTODOS DE RESET DE SENHA =====

  async forgotPassword(email: string): Promise<ApiResponse> {
    if (this.useMock) {
      return new Promise((resolve) => {
        setTimeout(() => {
          resolve({
            success: true,
            message: 'Código de recuperação enviado para o email'
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
      throw new Error(error.message || 'Erro ao enviar código de recuperação');
    }
  }

  async verifyResetCode(email: string, code: string): Promise<{ valid: boolean }> {
    if (this.useMock) {
      return new Promise((resolve) => {
        setTimeout(() => {
          resolve({ valid: code === '123456' });
        }, 500);
      });
    }

    try {
      const response = await this.request<{ valid: boolean }>('/api/auth/verify-reset-code', {
        method: 'POST',
        body: JSON.stringify({ email, code }),
      });
      return response;
    } catch (error: any) {
      throw new Error(error.message || 'Código inválido ou expirado');
    }
  }

  async resetPassword(email: string, code: string, newPassword: string): Promise<ApiResponse> {
    if (this.useMock) {
      return new Promise((resolve) => {
        setTimeout(() => {
          resolve({
            success: true,
            message: 'Senha redefinida com sucesso'
          });
        }, 1000);
      });
    }

    try {
      const response = await this.request<ApiResponse>('/api/auth/reset-password', {
        method: 'POST',
        body: JSON.stringify({ email, code, newPassword }),
      });
      return response;
    } catch (error: any) {
      throw new Error(error.message || 'Erro ao redefinir senha');
    }
  }

  async changePassword(currentPassword: string, newPassword: string): Promise<ApiResponse> {
    if (this.useMock) {
      return new Promise((resolve, reject) => {
        setTimeout(() => {
          if (currentPassword === 'wrongpass') {
            reject(new Error('Senha atual incorreta'));
          } else {
            resolve({
              success: true,
              message: 'Senha alterada com sucesso'
            });
          }
        }, 1000);
      });
    }

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

  async validateToken(token: string): Promise<boolean> {
    if (this.useMock) {
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

  async updateProfile(userData: Partial<User>): Promise<{ success: boolean; user: User; message?: string }> {
    if (this.useMock) {
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