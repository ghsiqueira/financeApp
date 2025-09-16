// src/services/api.ts
import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_CONFIG, STORAGE_KEYS, ERROR_MESSAGES } from '../constants';
import { 
  ApiResponse, 
  PaginatedResponse,
  AuthResponse,
  User,
  Transaction,
  CreateTransactionData,
  Goal,
  CreateGoalData,
  Budget,
  CreateBudgetData,
  Category,
  CreateCategoryData,
  FinancialSummary,
  BudgetSummary,
  GoalStats,
  TransactionFilters,
  CategorySpendingData
} from '../types';

class ApiService {
  private api: AxiosInstance;

  constructor() {
    this.api = axios.create({
      baseURL: API_CONFIG.BASE_URL,
      timeout: API_CONFIG.TIMEOUT,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.setupInterceptors();
  }

  private setupInterceptors() {
    // Request interceptor para adicionar token de autenticação
    this.api.interceptors.request.use(
      async (config) => {
        const token = await AsyncStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Response interceptor para tratar erros
    this.api.interceptors.response.use(
      (response) => response,
      async (error) => {
        if (error.response?.status === 401) {
          // Token expirado, limpar storage e redirecionar para login
          await AsyncStorage.multiRemove([STORAGE_KEYS.AUTH_TOKEN, STORAGE_KEYS.USER_DATA]);
          // Aqui você pode adicionar lógica para redirecionar para login
        }
        return Promise.reject(error);
      }
    );
  }

  private async handleRequest<T>(
    requestFn: () => Promise<AxiosResponse<any>>
  ): Promise<T> {
    try {
      const response = await requestFn();
      return response.data;
    } catch (error: any) {
      if (error.response) {
        // Erro da API
        throw new Error(error.response.data?.message || ERROR_MESSAGES.SERVER_ERROR);
      } else if (error.request) {
        // Erro de rede
        throw new Error(ERROR_MESSAGES.NETWORK_ERROR);
      } else {
        // Erro desconhecido
        throw new Error(ERROR_MESSAGES.UNKNOWN_ERROR);
      }
    }
  }

  // Auth endpoints
  async login(email: string, password: string): Promise<AuthResponse> {
    return this.handleRequest(() =>
      this.api.post('/auth/login', { email, password })
    );
  }

  async register(name: string, email: string, password: string): Promise<AuthResponse> {
    return this.handleRequest(() =>
      this.api.post('/auth/register', { name, email, password })
    );
  }

  async getProfile(): Promise<ApiResponse<User>> {
    return this.handleRequest(() =>
      this.api.get('/auth/profile')
    );
  }

  async forgotPassword(email: string): Promise<ApiResponse> {
    return this.handleRequest(() =>
      this.api.post('/auth/forgot-password', { email })
    );
  }

  // Transaction endpoints
  async getTransactions(filters?: TransactionFilters): Promise<PaginatedResponse<Transaction[]>> {
    const params = new URLSearchParams();
    
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          params.append(key, value.toString());
        }
      });
    }

    return this.handleRequest(() =>
      this.api.get(`/transactions?${params.toString()}`)
    );
  }

  async getTransaction(id: string): Promise<ApiResponse<Transaction>> {
    return this.handleRequest(() =>
      this.api.get(`/transactions/${id}`)
    );
  }

  async createTransaction(data: CreateTransactionData): Promise<ApiResponse<Transaction>> {
    return this.handleRequest(() =>
      this.api.post('/transactions', data)
    );
  }

  async updateTransaction(id: string, data: Partial<CreateTransactionData>): Promise<ApiResponse<Transaction>> {
    return this.handleRequest(() =>
      this.api.put(`/transactions/${id}`, data)
    );
  }

  async deleteTransaction(id: string): Promise<ApiResponse> {
    return this.handleRequest(() =>
      this.api.delete(`/transactions/${id}`)
    );
  }

  async getTransactionSummary(startDate?: string, endDate?: string): Promise<ApiResponse<FinancialSummary>> {
    const params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);

    return this.handleRequest(() =>
      this.api.get(`/transactions/summary/overview?${params.toString()}`)
    );
  }

  // Goal endpoints
  async getGoals(status?: string, page?: number, limit?: number): Promise<PaginatedResponse<Goal[]>> {
    const params = new URLSearchParams();
    if (status) params.append('status', status);
    if (page) params.append('page', page.toString());
    if (limit) params.append('limit', limit.toString());

    return this.handleRequest(() =>
      this.api.get(`/goals?${params.toString()}`)
    );
  }

  async getGoal(id: string): Promise<ApiResponse<Goal>> {
    return this.handleRequest(() =>
      this.api.get(`/goals/${id}`)
    );
  }

  async createGoal(data: CreateGoalData): Promise<ApiResponse<Goal>> {
    return this.handleRequest(() =>
      this.api.post('/goals', data)
    );
  }

  async updateGoal(id: string, data: Partial<CreateGoalData>): Promise<ApiResponse<Goal>> {
    return this.handleRequest(() =>
      this.api.put(`/goals/${id}`, data)
    );
  }

  async addAmountToGoal(id: string, amount: number): Promise<ApiResponse<Goal>> {
    return this.handleRequest(() =>
      this.api.patch(`/goals/${id}/add-amount`, { amount })
    );
  }

  async deleteGoal(id: string): Promise<ApiResponse> {
    return this.handleRequest(() =>
      this.api.delete(`/goals/${id}`)
    );
  }

  async getGoalStats(): Promise<ApiResponse<GoalStats>> {
    return this.handleRequest(() =>
      this.api.get('/goals/stats/overview')
    );
  }

  // Budget endpoints
  async getBudgets(month?: number, year?: number, isActive?: boolean): Promise<PaginatedResponse<Budget[]>> {
    const params = new URLSearchParams();
    if (month) params.append('month', month.toString());
    if (year) params.append('year', year.toString());
    if (isActive !== undefined) params.append('isActive', isActive.toString());

    return this.handleRequest(() =>
      this.api.get(`/budgets?${params.toString()}`)
    );
  }

  async getBudget(id: string): Promise<ApiResponse<Budget>> {
    return this.handleRequest(() =>
      this.api.get(`/budgets/${id}`)
    );
  }

  async createBudget(data: CreateBudgetData): Promise<ApiResponse<Budget>> {
    return this.handleRequest(() =>
      this.api.post('/budgets', data)
    );
  }

  async updateBudget(id: string, data: Partial<CreateBudgetData>): Promise<ApiResponse<Budget>> {
    return this.handleRequest(() =>
      this.api.put(`/budgets/${id}`, data)
    );
  }

  async deleteBudget(id: string): Promise<ApiResponse> {
    return this.handleRequest(() =>
      this.api.delete(`/budgets/${id}`)
    );
  }

  async getCurrentBudgetSummary(): Promise<ApiResponse<BudgetSummary>> {
    return this.handleRequest(() =>
      this.api.get('/budgets/current/summary')
    );
  }

  async recalculateBudget(id: string): Promise<ApiResponse<Budget>> {
    return this.handleRequest(() =>
      this.api.patch(`/budgets/${id}/recalculate`)
    );
  }

  // Category endpoints
  async getCategories(type?: 'income' | 'expense'): Promise<ApiResponse<Category[]>> {
    const params = new URLSearchParams();
    if (type) params.append('type', type);

    return this.handleRequest(() =>
      this.api.get(`/categories?${params.toString()}`)
    );
  }

  async getCategory(id: string): Promise<ApiResponse<Category>> {
    return this.handleRequest(() =>
      this.api.get(`/categories/${id}`)
    );
  }

  async createCategory(data: CreateCategoryData): Promise<ApiResponse<Category>> {
    return this.handleRequest(() =>
      this.api.post('/categories', data)
    );
  }

  async updateCategory(id: string, data: Partial<CreateCategoryData>): Promise<ApiResponse<Category>> {
    return this.handleRequest(() =>
      this.api.put(`/categories/${id}`, data)
    );
  }

  async deleteCategory(id: string): Promise<ApiResponse> {
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

  // Utils
  async testConnection(): Promise<boolean> {
    try {
      const response = await this.api.get('/');
      return response.status === 200;
    } catch (error) {
      return false;
    }
  }

  // Get API instance for custom requests
  getApiInstance(): AxiosInstance {
    return this.api;
  }
}

export default new ApiService();