// src/services/TransactionService.ts
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_CONFIG } from '../constants';
import { 
  Transaction, 
  CreateTransactionData, 
  ApiResponse, 
  PaginatedResponse, 
  TransactionFilters,
  FinancialSummary 
} from '../types';

class TransactionServiceClass {
  private baseURL: string;

  constructor() {
    this.baseURL = API_CONFIG.BASE_URL;
  }

  // Função auxiliar para obter token
  private async getAuthToken(): Promise<string | null> {
    try {
      return await AsyncStorage.getItem('@FinanceApp:token');
    } catch (error) {
      console.error('Erro ao obter token:', error);
      return null;
    }
  }

  // Função auxiliar para fazer requisições autenticadas
  private async request<T = any>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const token = await this.getAuthToken();
    const url = `${this.baseURL}${endpoint}`;
    
    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` }),
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

  // Criar transação
  async createTransaction(transactionData: CreateTransactionData): Promise<Transaction> {
    try {
      const response = await this.request<{ success: boolean; transaction: Transaction }>('/api/transactions', {
        method: 'POST',
        body: JSON.stringify(transactionData),
      });

      if (!response.success) {
        throw new Error('Erro ao criar transação');
      }

      return response.transaction;
    } catch (error: any) {
      throw new Error(error.message || 'Erro ao criar transação');
    }
  }

  // Listar transações com filtros
  async getTransactions(filters?: TransactionFilters): Promise<PaginatedResponse<Transaction[]>> {
    try {
      const queryParams = new URLSearchParams();
      
      if (filters) {
        Object.entries(filters).forEach(([key, value]) => {
          if (value !== undefined && value !== null && value !== '') {
            queryParams.append(key, value.toString());
          }
        });
      }

      const endpoint = `/api/transactions${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
      const response = await this.request<PaginatedResponse<Transaction[]>>(endpoint);

      return response;
    } catch (error: any) {
      throw new Error(error.message || 'Erro ao carregar transações');
    }
  }

  // Obter transação por ID
  async getTransactionById(id: string): Promise<Transaction> {
    try {
      const response = await this.request<{ success: boolean; transaction: Transaction }>(`/api/transactions/${id}`);

      if (!response.success) {
        throw new Error('Transação não encontrada');
      }

      return response.transaction;
    } catch (error: any) {
      throw new Error(error.message || 'Erro ao carregar transação');
    }
  }

  // Atualizar transação
  async updateTransaction(id: string, transactionData: Partial<CreateTransactionData>): Promise<Transaction> {
    try {
      const response = await this.request<{ success: boolean; transaction: Transaction }>(`/api/transactions/${id}`, {
        method: 'PUT',
        body: JSON.stringify(transactionData),
      });

      if (!response.success) {
        throw new Error('Erro ao atualizar transação');
      }

      return response.transaction;
    } catch (error: any) {
      throw new Error(error.message || 'Erro ao atualizar transação');
    }
  }

  // Deletar transação
  async deleteTransaction(id: string): Promise<void> {
    try {
      const response = await this.request<ApiResponse>(`/api/transactions/${id}`, {
        method: 'DELETE',
      });

      if (!response.success) {
        throw new Error('Erro ao deletar transação');
      }
    } catch (error: any) {
      throw new Error(error.message || 'Erro ao deletar transação');
    }
  }

  // Obter resumo financeiro
  async getFinancialSummary(filters?: { startDate?: string; endDate?: string }): Promise<FinancialSummary> {
    try {
      const queryParams = new URLSearchParams();
      
      if (filters) {
        Object.entries(filters).forEach(([key, value]) => {
          if (value !== undefined && value !== null && value !== '') {
            queryParams.append(key, value.toString());
          }
        });
      }

      const endpoint = `/api/transactions/summary${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
      const response = await this.request<{ success: boolean; summary: FinancialSummary }>(endpoint);

      if (!response.success) {
        throw new Error('Erro ao carregar resumo');
      }

      return response.summary;
    } catch (error: any) {
      throw new Error(error.message || 'Erro ao carregar resumo financeiro');
    }
  }

  // Obter transações por categoria
  async getTransactionsByCategory(filters?: { startDate?: string; endDate?: string; type?: 'income' | 'expense' }): Promise<any[]> {
    try {
      const queryParams = new URLSearchParams();
      
      if (filters) {
        Object.entries(filters).forEach(([key, value]) => {
          if (value !== undefined && value !== null && value !== '') {
            queryParams.append(key, value.toString());
          }
        });
      }

      const endpoint = `/api/transactions/by-category${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
      const response = await this.request<{ success: boolean; data: any[] }>(endpoint);

      if (!response.success) {
        throw new Error('Erro ao carregar dados por categoria');
      }

      return response.data;
    } catch (error: any) {
      throw new Error(error.message || 'Erro ao carregar transações por categoria');
    }
  }

  // Obter transações recentes
  async getRecentTransactions(limit: number = 10): Promise<Transaction[]> {
    try {
      const response = await this.request<{ success: boolean; transactions: Transaction[] }>(`/api/transactions/recent?limit=${limit}`);

      if (!response.success) {
        throw new Error('Erro ao carregar transações recentes');
      }

      return response.transactions;
    } catch (error: any) {
      throw new Error(error.message || 'Erro ao carregar transações recentes');
    }
  }

  // Duplicar transação
  async duplicateTransaction(id: string): Promise<Transaction> {
    try {
      const response = await this.request<{ success: boolean; transaction: Transaction }>(`/api/transactions/${id}/duplicate`, {
        method: 'POST',
      });

      if (!response.success) {
        throw new Error('Erro ao duplicar transação');
      }

      return response.transaction;
    } catch (error: any) {
      throw new Error(error.message || 'Erro ao duplicar transação');
    }
  }

  // Obter estatísticas mensais
  async getMonthlyStats(year: number): Promise<any[]> {
    try {
      const response = await this.request<{ success: boolean; stats: any[] }>(`/api/transactions/monthly-stats?year=${year}`);

      if (!response.success) {
        throw new Error('Erro ao carregar estatísticas');
      }

      return response.stats;
    } catch (error: any) {
      throw new Error(error.message || 'Erro ao carregar estatísticas mensais');
    }
  }

  // Exportar transações
  async exportTransactions(filters?: TransactionFilters, format: 'csv' | 'excel' = 'csv'): Promise<string> {
    try {
      const queryParams = new URLSearchParams();
      queryParams.append('format', format);
      
      if (filters) {
        Object.entries(filters).forEach(([key, value]) => {
          if (value !== undefined && value !== null && value !== '') {
            queryParams.append(key, value.toString());
          }
        });
      }

      const endpoint = `/api/transactions/export?${queryParams.toString()}`;
      const response = await this.request<{ success: boolean; downloadUrl: string }>(endpoint);

      if (!response.success) {
        throw new Error('Erro ao exportar transações');
      }

      return response.downloadUrl;
    } catch (error: any) {
      throw new Error(error.message || 'Erro ao exportar transações');
    }
  }

  // Importar transações
  async importTransactions(file: FormData): Promise<{ imported: number; errors: string[] }> {
    try {
      const token = await this.getAuthToken();
      const url = `${this.baseURL}/api/transactions/import`;
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          ...(token && { 'Authorization': `Bearer ${token}` }),
        },
        body: file,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Erro na importação');
      }

      return data;
    } catch (error: any) {
      throw new Error(error.message || 'Erro ao importar transações');
    }
  }

  // Verificar transações duplicadas
  async checkDuplicates(transactionData: CreateTransactionData): Promise<Transaction[]> {
    try {
      const response = await this.request<{ success: boolean; duplicates: Transaction[] }>('/api/transactions/check-duplicates', {
        method: 'POST',
        body: JSON.stringify(transactionData),
      });

      if (!response.success) {
        throw new Error('Erro ao verificar duplicatas');
      }

      return response.duplicates;
    } catch (error: any) {
      throw new Error(error.message || 'Erro ao verificar transações duplicadas');
    }
  }

  // Processar transações recorrentes
  async processRecurringTransactions(): Promise<{ processed: number }> {
    try {
      const response = await this.request<{ success: boolean; processed: number }>('/api/transactions/process-recurring', {
        method: 'POST',
      });

      if (!response.success) {
        throw new Error('Erro ao processar transações recorrentes');
      }

      return { processed: response.processed };
    } catch (error: any) {
      throw new Error(error.message || 'Erro ao processar transações recorrentes');
    }
  }
}

export const TransactionService = new TransactionServiceClass();