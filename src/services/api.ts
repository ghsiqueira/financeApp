// src/services/api.ts - VERSÃO MELHORADA
import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import { Platform } from 'react-native';
import secureStorage, { StorageType } from '../utils/secureStorage';
import { STORAGE_KEYS } from '../constants';
import { ApiResponse, LoginFormData, RegisterFormData, Transaction, Goal, Budget, Category, FinancialSummary, CategorySpendingData } from '../types';

class ApiService {
  private api: AxiosInstance;
  private baseURL: string;

  constructor() {
    // Configurar URL base correta para cada plataforma
    this.baseURL = this.getBaseURL();
    
    console.log(`🔗 Configurando API com URL: ${this.baseURL}`);

    this.api = axios.create({
      baseURL: this.baseURL,
      timeout: 15000, // Aumentado para 15 segundos
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
    });

    this.setupInterceptors();
  }

  private getBaseURL(): string {
    if (__DEV__) {
      // Ambiente de desenvolvimento
      switch (Platform.OS) {
        case 'android':
          return 'http://10.0.2.2:5000/api'; // Android Emulator
        case 'ios':
          return 'http://localhost:5000/api'; // iOS Simulator
        default:
          return 'http://localhost:5000/api'; // Web/outras plataformas
      }
    } else {
      // Ambiente de produção
      return 'https://your-production-api.com/api';
    }
  }

  private setupInterceptors(): void {
    // Request interceptor - adicionar token automaticamente
    this.api.interceptors.request.use(
      async (config) => {
        try {
          console.log(`📤 Fazendo requisição: ${config.method?.toUpperCase()} ${config.url}`);

          const token = await secureStorage.getItem(STORAGE_KEYS.TOKEN, StorageType.SECURE);
          if (token) {
            config.headers.Authorization = `Bearer ${token}`;
            console.log(`🔑 Token adicionado ao header (${token.substring(0, 20)}...)`);
          } else {
            console.warn('⚠️ Token não encontrado no SecureStore');
          }
        } catch (error) {
          console.warn('⚠️ Erro ao obter token:', error);
        }
        return config;
      },
      (error) => {
        console.error('❌ Erro no request interceptor:', error);
        return Promise.reject(error);
      }
    );

    // Response interceptor - tratar respostas e erros
    this.api.interceptors.response.use(
      (response: AxiosResponse) => {
        console.log(`📥 Resposta recebida: ${response.status} ${response.statusText}`);
        return response;
      },
      async (error) => {
        console.error('❌ Erro na resposta da API:', error);

        // Tratar diferentes tipos de erro
        if (error.code === 'ECONNABORTED') {
          console.error('⏰ Timeout na requisição');
          throw new Error('Tempo limite excedido. Verifique sua conexão.');
        }

        if (error.code === 'NETWORK_ERROR' || error.message === 'Network Error') {
          console.error('🌐 Erro de rede');
          throw new Error('Erro de conexão. Verifique se o servidor está rodando.');
        }

        if (error.response) {
          const { status, data } = error.response;
          console.error(`🚫 Erro HTTP ${status}:`, data);

          switch (status) {
            case 401:
              // Token expirado - fazer logout
              await secureStorage.removeItem(STORAGE_KEYS.TOKEN, StorageType.SECURE);
              throw new Error('Sessão expirada. Faça login novamente.');
            case 404:
              throw new Error('Recurso não encontrado.');
            case 422:
              throw new Error(data?.message || 'Dados inválidos.');
            case 500:
              throw new Error('Erro interno do servidor.');
            default:
              throw new Error(data?.message || `Erro HTTP ${status}`);
          }
        }

        // Erro sem resposta (servidor offline)
        if (error.request) {
          console.error('📡 Servidor não responde');
          throw new Error('Servidor não está respondendo. Verifique se está rodando na porta 5000.');
        }

        throw error;
      }
    );
  }

  private async handleRequest<T>(requestFn: () => Promise<AxiosResponse<T>>): Promise<ApiResponse<T>> {
    try {
      const response = await requestFn();
      return {
        success: true,
        data: response.data,
        message: 'Sucesso'
      };
    } catch (error: any) {
      console.error('❌ Erro na requisição:', error.message);
      return {
        success: false,
        message: error.message || 'Erro desconhecido',
        errors: [error]
      };
    }
  }

  // Método para testar conexão
  async testConnection(): Promise<boolean> {
    try {
      console.log('🔍 Testando conexão com API...');
      // Remover /api da URL base para o teste, pois o endpoint / está na raiz
      const testUrl = this.baseURL.replace('/api', '');
      const response = await axios.get(testUrl, { timeout: 5000 });
      console.log('✅ Conexão OK - Resposta:', response.data);
      return true;
    } catch (error: any) {
      console.error('❌ Falha no teste de conexão:', error.message);
      return false;
    }
  }

  // AUTH ENDPOINTS
  async login(credentials: LoginFormData): Promise<ApiResponse<any>> {
    return this.handleRequest(() =>
      this.api.post('/auth/login', credentials)
    );
  }

  async register(userData: RegisterFormData): Promise<ApiResponse<any>> {
    return this.handleRequest(() =>
      this.api.post('/auth/register', userData)
    );
  }

  async logout(): Promise<ApiResponse<any>> {
    return this.handleRequest(() =>
      this.api.post('/auth/logout')
    );
  }

  async refreshToken(): Promise<ApiResponse<any>> {
    return this.handleRequest(() =>
      this.api.post('/auth/refresh')
    );
  }

  // TRANSACTION ENDPOINTS
  async getTransactions(filters?: any): Promise<ApiResponse<{ data: Transaction[]; pagination: any }>> {
    console.log('🌐 apiService.getTransactions chamado com:', filters);
    
    const params = new URLSearchParams();
    if (filters) {
      Object.keys(filters).forEach(key => {
        if (filters[key] !== undefined && filters[key] !== null && filters[key] !== '') {
          params.append(key, filters[key].toString());
        }
      });
    }

    console.log('🔗 URL params:', params.toString());
    console.log('🌍 URL completa:', `${this.baseURL}/transactions?${params.toString()}`);

    const result = await this.handleRequest(() =>
      this.api.get(`/transactions?${params.toString()}`)
    );
    
    console.log('📡 Resposta do handleRequest:', JSON.stringify(result, null, 2));
    return result;
  }

  async getTransaction(id: string): Promise<ApiResponse<Transaction>> {
    return this.handleRequest(() =>
      this.api.get(`/transactions/${id}`)
    );
  }

  async createTransaction(data: any): Promise<ApiResponse<Transaction>> {
    return this.handleRequest(() =>
      this.api.post('/transactions', data)
    );
  }

  async updateTransaction(id: string, data: any): Promise<ApiResponse<Transaction>> {
    return this.handleRequest(() =>
      this.api.put(`/transactions/${id}`, data)
    );
  }

  async deleteTransaction(id: string): Promise<ApiResponse<void>> {
    return this.handleRequest(() =>
      this.api.delete(`/transactions/${id}`)
    );
  }

  async getFinancialSummary(month?: number, year?: number): Promise<ApiResponse<FinancialSummary>> {
    const params = new URLSearchParams();
    if (month) params.append('month', month.toString());
    if (year) params.append('year', year.toString());

    return this.handleRequest(() =>
      this.api.get(`/transactions/summary?${params.toString()}`)
    );
  }

  async getRecentTransactions(limit: number = 5): Promise<ApiResponse<Transaction[]>> {
    return this.handleRequest(() =>
      this.api.get(`/transactions/recent?limit=${limit}`)
    );
  }

  // GOAL ENDPOINTS
  async getGoals(page: number = 1, limit: number = 20, filters?: any): Promise<ApiResponse<{ data: Goal[]; pagination: any }>> {
    const params = new URLSearchParams();
    params.append('page', page.toString());
    params.append('limit', limit.toString());
    
    if (filters) {
      Object.keys(filters).forEach(key => {
        if (filters[key] !== undefined && filters[key] !== null && filters[key] !== '') {
          params.append(key, filters[key].toString());
        }
      });
    }

    return this.handleRequest(() =>
      this.api.get(`/goals?${params.toString()}`)
    );
  }

  async getGoal(id: string): Promise<ApiResponse<Goal>> {
    return this.handleRequest(() =>
      this.api.get(`/goals/${id}`)
    );
  }

  async createGoal(data: any): Promise<ApiResponse<Goal>> {
    return this.handleRequest(() =>
      this.api.post('/goals', data)
    );
  }

  async updateGoal(id: string, data: any): Promise<ApiResponse<Goal>> {
    return this.handleRequest(() =>
      this.api.put(`/goals/${id}`, data)
    );
  }

  async deleteGoal(id: string): Promise<ApiResponse<void>> {
    return this.handleRequest(() =>
      this.api.delete(`/goals/${id}`)
    );
  }

  async getActiveGoals(limit: number = 5): Promise<ApiResponse<Goal[]>> {
    return this.handleRequest(() =>
      this.api.get(`/goals/active?limit=${limit}`)
    );
  }

  async addToGoal(id: string, amount: number): Promise<ApiResponse<Goal>> {
    return this.handleRequest(() =>
      this.api.post(`/goals/${id}/add`, { amount })
    );
  }

  // GOAL SHARING ENDPOINTS
  async getPendingShares(): Promise<ApiResponse<any[]>> {
    return this.handleRequest(() =>
      this.api.get('/goal-shares/pending')  // ✅ Já tem /api no baseURL
    );
  }

  async getAcceptedShares(): Promise<ApiResponse<any[]>> {
    return this.handleRequest(() =>
      this.api.get('/goal-shares/accepted')  // ✅ Já tem /api no baseURL
    );
  }

  async acceptShare(shareId: string): Promise<ApiResponse<any>> {
    return this.handleRequest(() =>
      this.api.post(`/goal-shares/${shareId}/accept`)
    );
  }

  async rejectShare(shareId: string): Promise<ApiResponse<any>> {
    return this.handleRequest(() =>
      this.api.post(`/goal-shares/${shareId}/reject`)
    );
  }

  async deleteShare(shareId: string): Promise<ApiResponse<void>> {
    return this.handleRequest(() =>
      this.api.delete(`/goal-shares/${shareId}`)
    );
  }

  async updateShareRole(shareId: string, role: string): Promise<ApiResponse<any>> {
    return this.handleRequest(() =>
      this.api.patch(`/goal-shares/${shareId}/role`, { role })
    );
  }

  async shareGoal(goalId: string, data: { email: string; role: string }): Promise<ApiResponse<any>> {
    return this.handleRequest(() =>
      this.api.post(`/goals/${goalId}/share`, data)
    );
  }

  async getGoalShares(goalId: string): Promise<ApiResponse<any[]>> {
    return this.handleRequest(() =>
      this.api.get(`/goals/${goalId}/shares`)
    );
  }

  // BUDGET ENDPOINTS
  async getBudgets(page: number = 1, limit: number = 20, filters?: any): Promise<ApiResponse<{ data: Budget[]; pagination: any }>> {
    const params = new URLSearchParams();
    params.append('page', page.toString());
    params.append('limit', limit.toString());
    
    if (filters) {
      Object.keys(filters).forEach(key => {
        if (filters[key] !== undefined && filters[key] !== null && filters[key] !== '') {
          params.append(key, filters[key].toString());
        }
      });
    }

    return this.handleRequest(() =>
      this.api.get(`/budgets?${params.toString()}`)
    );
  }

  async getBudget(id: string): Promise<ApiResponse<Budget>> {
    return this.handleRequest(() =>
      this.api.get(`/budgets/${id}`)
    );
  }

  async createBudget(data: any): Promise<ApiResponse<Budget>> {
    return this.handleRequest(() =>
      this.api.post('/budgets', data)
    );
  }

  async updateBudget(id: string, data: any): Promise<ApiResponse<Budget>> {
    return this.handleRequest(() =>
      this.api.put(`/budgets/${id}`, data)
    );
  }

  async deleteBudget(id: string): Promise<ApiResponse<void>> {
    return this.handleRequest(() =>
      this.api.delete(`/budgets/${id}`)
    );
  }

  async getCurrentBudgets(limit: number = 5): Promise<ApiResponse<Budget[]>> {
    return this.handleRequest(() =>
      this.api.get(`/budgets/current?limit=${limit}`)
    );
  }

  // CATEGORY ENDPOINTS
  async getCategories(filters?: any): Promise<ApiResponse<Category[]>> {
    const params = new URLSearchParams();
    if (filters) {
      Object.keys(filters).forEach(key => {
        if (filters[key] !== undefined && filters[key] !== null && filters[key] !== '') {
          params.append(key, filters[key].toString());
        }
      });
    }

    return this.handleRequest(() =>
      this.api.get(`/categories?${params.toString()}`)
    );
  }

  async getCategory(id: string): Promise<ApiResponse<Category>> {
    return this.handleRequest(() =>
      this.api.get(`/categories/${id}`)
    );
  }

  async createCategory(data: any): Promise<ApiResponse<Category>> {
    return this.handleRequest(() =>
      this.api.post('/categories', data)
    );
  }

  async updateCategory(id: string, data: any): Promise<ApiResponse<Category>> {
    return this.handleRequest(() =>
      this.api.put(`/categories/${id}`, data)
    );
  }

  async deleteCategory(id: string): Promise<ApiResponse<void>> {
    return this.handleRequest(() =>
      this.api.delete(`/categories/${id}`)
    );
  }

  async getCategorySpending(startDate?: string, endDate?: string, type?: 'income' | 'expense'): Promise<ApiResponse<CategorySpendingData[]>> {
    const params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    if (type) params.append('type', type);

    return this.handleRequest(() =>
      this.api.get(`/categories/stats/spending?${params.toString()}`)
    );
  }

  async getAvailableIcons(): Promise<ApiResponse<{ all: string[]; categories: Record<string, string[]> }>> {
    return this.handleRequest(() =>
      this.api.get('/categories/icons/available')
    );
  }

  // UTILITIES
  getBaseUrl(): string {
    return this.baseURL;
  }

  setBaseUrl(url: string): void {
    this.baseURL = url;
    this.api.defaults.baseURL = url;
    console.log(`🔧 URL base alterada para: ${url}`);
  }

  // Get API instance for custom requests
  getApiInstance(): AxiosInstance {
    return this.api;
  }
}

export default new ApiService();