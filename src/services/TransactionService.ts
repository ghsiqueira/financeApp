// src/services/TransactionService.ts - CÓDIGO COMPLETO
import { API_CONFIG } from '../constants';
import { 
  Transaction, 
  CreateTransactionData, 
  TransactionFilters, 
  PaginatedResponse,
  FinancialSummary
} from '../types';

class TransactionServiceClass {
  private baseURL: string;

  constructor() {
    this.baseURL = API_CONFIG.BASE_URL;
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

  // Obter token de autenticação
  private async getAuthToken(): Promise<string | null> {
    try {
      const AsyncStorage = require('@react-native-async-storage/async-storage').default;
      return await AsyncStorage.getItem('@FinanceApp:token');
    } catch (error) {
      return null;
    }
  }

  // Listar transações
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
      const response = await this.request<PaginatedResponse<Transaction[]>>(endpoint, {
        headers: {
          'Authorization': `Bearer ${await this.getAuthToken()}`,
        },
      });

      return {
        success: true,
        data: response.data || [],
        pagination: response.pagination || { current: 1, pages: 1, total: 0 }
      };
    } catch (error: any) {
      return {
        success: false,
        data: [],
        pagination: { current: 1, pages: 1, total: 0 },
        message: error.message || 'Erro ao carregar transações'
      };
    }
  }

  // Obter transação por ID
  async getTransactionById(id: string): Promise<Transaction> {
    try {
      const response = await this.request<{ success: boolean; transaction: Transaction }>(`/api/transactions/${id}`, {
        headers: {
          'Authorization': `Bearer ${await this.getAuthToken()}`,
        },
      });

      if (!response.success || !response.transaction) {
        throw new Error('Transação não encontrada');
      }

      return response.transaction;
    } catch (error: any) {
      throw new Error(error.message || 'Erro ao carregar transação');
    }
  }

  // Criar transação
  async createTransaction(transactionData: CreateTransactionData): Promise<Transaction> {
    try {
      const response = await this.request<{ success: boolean; transaction: Transaction }>('/api/transactions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${await this.getAuthToken()}`,
        },
        body: JSON.stringify(transactionData),
      });

      if (!response.success || !response.transaction) {
        throw new Error('Erro ao criar transação');
      }

      return response.transaction;
    } catch (error: any) {
      throw new Error(error.message || 'Erro ao criar transação');
    }
  }

  // Atualizar transação
  async updateTransaction(id: string, transactionData: Partial<CreateTransactionData>): Promise<Transaction> {
    try {
      const response = await this.request<{ success: boolean; transaction: Transaction }>(`/api/transactions/${id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${await this.getAuthToken()}`,
        },
        body: JSON.stringify(transactionData),
      });

      if (!response.success || !response.transaction) {
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
      const response = await this.request<{ success: boolean }>(`/api/transactions/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${await this.getAuthToken()}`,
        },
      });

      if (!response.success) {
        throw new Error('Erro ao deletar transação');
      }
    } catch (error: any) {
      throw new Error(error.message || 'Erro ao deletar transação');
    }
  }

  // Duplicar transação
  async duplicateTransaction(id: string): Promise<Transaction> {
    try {
      const response = await this.request<{ success: boolean; transaction: Transaction }>(`/api/transactions/${id}/duplicate`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${await this.getAuthToken()}`,
        },
      });

      if (!response.success || !response.transaction) {
        throw new Error('Erro ao duplicar transação');
      }

      return response.transaction;
    } catch (error: any) {
      throw new Error(error.message || 'Erro ao duplicar transação');
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
      const response = await this.request<{ success: boolean; data: any[] }>(endpoint, {
        headers: {
          'Authorization': `Bearer ${await this.getAuthToken()}`,
        },
      });

      if (!response.success) {
        throw new Error('Erro ao carregar dados por categoria');
      }

      return response.data;
    } catch (error: any) {
      throw new Error(error.message || 'Erro ao carregar transações por categoria');
    }
  }

  // Obter transações recentes (método auxiliar para HomeScreen)
  async getRecentTransactions(limit: number = 5): Promise<Transaction[]> {
    try {
      const response = await this.getTransactions({
        page: 1,
        limit: limit
      });

      if (response.success && response.data) {
        return response.data;
      }
      return [];
    } catch (error: any) {
      console.error('Erro ao buscar transações recentes:', error);
      return [];
    }
  }

  // Obter resumo financeiro (método auxiliar para HomeScreen)
  async getFinancialSummary(): Promise<FinancialSummary> {
    try {
      // Tentar buscar do endpoint específico primeiro
      try {
        const response = await this.request<{ success: boolean; summary: FinancialSummary }>('/api/transactions/summary', {
          headers: {
            'Authorization': `Bearer ${await this.getAuthToken()}`,
          },
        });

        if (response.success && response.summary) {
          return response.summary;
        }
      } catch (apiError) {
        // Se não tiver endpoint específico, calcular com base nas transações
        console.log('Endpoint de summary não disponível, calculando localmente...');
      }

      // Fallback: calcular com base nas transações recentes
      const transactions = await this.getRecentTransactions(1000); // Buscar mais transações para cálculo
      
      const income = transactions
        .filter(t => t.type === 'income')
        .reduce((sum, t) => sum + t.amount, 0);
      
      const expense = transactions
        .filter(t => t.type === 'expense')
        .reduce((sum, t) => sum + t.amount, 0);
      
      return {
        income,
        expense,
        balance: income - expense,
        incomeCount: transactions.filter(t => t.type === 'income').length,
        expenseCount: transactions.filter(t => t.type === 'expense').length,
      };
    } catch (error: any) {
      console.error('Erro ao buscar resumo financeiro:', error);
      return {
        income: 0,
        expense: 0,
        balance: 0,
        incomeCount: 0,
        expenseCount: 0,
      };
    }
  }

  // Obter estatísticas mensais
  async getMonthlyStats(year: number): Promise<any[]> {
    try {
      const response = await this.request<{ success: boolean; stats: any[] }>(`/api/transactions/monthly-stats?year=${year}`, {
        headers: {
          'Authorization': `Bearer ${await this.getAuthToken()}`,
        },
      });

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
      const response = await this.request<{ success: boolean; downloadUrl: string }>(endpoint, {
        headers: {
          'Authorization': `Bearer ${await this.getAuthToken()}`,
        },
      });

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
        headers: {
          'Authorization': `Bearer ${await this.getAuthToken()}`,
        },
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
        headers: {
          'Authorization': `Bearer ${await this.getAuthToken()}`,
        },
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