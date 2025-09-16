// src/services/BudgetService.ts
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_CONFIG } from '../constants';
import { 
  Budget, 
  CreateBudgetData, 
  ApiResponse, 
  PaginatedResponse,
  BudgetSummary 
} from '../types';

class BudgetServiceClass {
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

  // Criar orçamento
  async createBudget(budgetData: CreateBudgetData): Promise<Budget> {
    try {
      const response = await this.request<{ success: boolean; budget: Budget }>('/api/budgets', {
        method: 'POST',
        body: JSON.stringify(budgetData),
      });

      if (!response.success) {
        throw new Error('Erro ao criar orçamento');
      }

      return response.budget;
    } catch (error: any) {
      throw new Error(error.message || 'Erro ao criar orçamento');
    }
  }

  // Listar orçamentos
  async getBudgets(filters?: { 
    month?: number;
    year?: number;
    isActive?: boolean;
    page?: number;
    limit?: number;
  }): Promise<PaginatedResponse<Budget[]>> {
    try {
      const queryParams = new URLSearchParams();
      
      if (filters) {
        Object.entries(filters).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            queryParams.append(key, String(value));
          }
        });
      }

      const endpoint = `/api/budgets${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
      const response = await this.request<PaginatedResponse<Budget[]>>(endpoint);

      return response;
    } catch (error: any) {
      throw new Error(error.message || 'Erro ao carregar orçamentos');
    }
  }

  // Obter orçamento por ID
  async getBudgetById(id: string): Promise<Budget> {
    try {
      const response = await this.request<{ success: boolean; budget: Budget }>(`/api/budgets/${id}`);

      if (!response.success) {
        throw new Error('Orçamento não encontrado');
      }

      return response.budget;
    } catch (error: any) {
      throw new Error(error.message || 'Erro ao carregar orçamento');
    }
  }

  // Atualizar orçamento
  async updateBudget(id: string, budgetData: Partial<CreateBudgetData>): Promise<Budget> {
    try {
      const response = await this.request<{ success: boolean; budget: Budget }>(`/api/budgets/${id}`, {
        method: 'PUT',
        body: JSON.stringify(budgetData),
      });

      if (!response.success) {
        throw new Error('Erro ao atualizar orçamento');
      }

      return response.budget;
    } catch (error: any) {
      throw new Error(error.message || 'Erro ao atualizar orçamento');
    }
  }

  // Deletar orçamento
  async deleteBudget(id: string): Promise<void> {
    try {
      const response = await this.request<ApiResponse>(`/api/budgets/${id}`, {
        method: 'DELETE',
      });

      if (!response.success) {
        throw new Error('Erro ao deletar orçamento');
      }
    } catch (error: any) {
      throw new Error(error.message || 'Erro ao deletar orçamento');
    }
  }

  // Obter orçamentos do mês atual
  async getCurrentBudgets(limit?: number): Promise<Budget[]> {
    try {
      const now = new Date();
      const month = now.getMonth() + 1;
      const year = now.getFullYear();

      const queryParams = new URLSearchParams({
        month: month.toString(),
        year: year.toString(),
        isActive: 'true',
        ...(limit && { limit: limit.toString() }),
      });

      const response = await this.request<{ success: boolean; budgets: Budget[] }>(`/api/budgets?${queryParams.toString()}`);

      if (!response.success) {
        throw new Error('Erro ao carregar orçamentos atuais');
      }

      return response.budgets;
    } catch (error: any) {
      throw new Error(error.message || 'Erro ao carregar orçamentos do mês atual');
    }
  }

  // Obter resumo dos orçamentos
  async getBudgetSummary(month?: number, year?: number): Promise<BudgetSummary> {
    try {
      const now = new Date();
      const currentMonth = month || (now.getMonth() + 1);
      const currentYear = year || now.getFullYear();

      const response = await this.request<{ success: boolean; summary: BudgetSummary }>(`/api/budgets/current/summary?month=${currentMonth}&year=${currentYear}`);

      if (!response.success) {
        throw new Error('Erro ao carregar resumo dos orçamentos');
      }

      return response.summary;
    } catch (error: any) {
      throw new Error(error.message || 'Erro ao carregar resumo dos orçamentos');
    }
  }

  // Duplicar orçamento para próximo mês
  async duplicateBudgetToNextMonth(id: string): Promise<Budget> {
    try {
      const response = await this.request<{ success: boolean; budget: Budget }>(`/api/budgets/${id}/duplicate-next-month`, {
        method: 'POST',
      });

      if (!response.success) {
        throw new Error('Erro ao duplicar orçamento');
      }

      return response.budget;
    } catch (error: any) {
      throw new Error(error.message || 'Erro ao duplicar orçamento para próximo mês');
    }
  }

  // Ajustar limite do orçamento
  async adjustBudgetLimit(id: string, newLimit: number): Promise<Budget> {
    try {
      const response = await this.request<{ success: boolean; budget: Budget }>(`/api/budgets/${id}/adjust-limit`, {
        method: 'POST',
        body: JSON.stringify({ newLimit }),
      });

      if (!response.success) {
        throw new Error('Erro ao ajustar limite do orçamento');
      }

      return response.budget;
    } catch (error: any) {
      throw new Error(error.message || 'Erro ao ajustar limite do orçamento');
    }
  }

  // Resetar gastos do orçamento
  async resetBudgetSpent(id: string): Promise<Budget> {
    try {
      const response = await this.request<{ success: boolean; budget: Budget }>(`/api/budgets/${id}/reset-spent`, {
        method: 'POST',
      });

      if (!response.success) {
        throw new Error('Erro ao resetar gastos do orçamento');
      }

      return response.budget;
    } catch (error: any) {
      throw new Error(error.message || 'Erro ao resetar gastos do orçamento');
    }
  }

  // Obter orçamentos em excesso
  async getOverBudgets(): Promise<Budget[]> {
    try {
      const response = await this.request<{ success: boolean; budgets: Budget[] }>('/api/budgets/over-budget');

      if (!response.success) {
        throw new Error('Erro ao carregar orçamentos em excesso');
      }

      return response.budgets;
    } catch (error: any) {
      throw new Error(error.message || 'Erro ao carregar orçamentos em excesso');
    }
  }

  // Obter transações recentes do orçamento
  async getBudgetTransactions(id: string, limit: number = 10): Promise<any[]> {
    try {
      const response = await this.request<{ success: boolean; transactions: any[] }>(`/api/budgets/${id}/transactions?limit=${limit}`);

      if (!response.success) {
        throw new Error('Erro ao carregar transações do orçamento');
      }

      return response.transactions;
    } catch (error: any) {
      throw new Error(error.message || 'Erro ao carregar transações do orçamento');
    }
  }

  // Comparar orçamentos entre períodos
  async compareBudgetPeriods(
    fromMonth: number,
    fromYear: number,
    toMonth: number,
    toYear: number
  ): Promise<{
    period1: BudgetSummary;
    period2: BudgetSummary;
    comparison: {
      totalBudgetChange: number;
      totalSpentChange: number;
      efficiencyChange: number;
    };
  }> {
    try {
      const response = await this.request<{
        success: boolean;
        comparison: {
          period1: BudgetSummary;
          period2: BudgetSummary;
          comparison: {
            totalBudgetChange: number;
            totalSpentChange: number;
            efficiencyChange: number;
          };
        };
      }>(`/api/budgets/compare?fromMonth=${fromMonth}&fromYear=${fromYear}&toMonth=${toMonth}&toYear=${toYear}`);

      if (!response.success) {
        throw new Error('Erro ao comparar períodos');
      }

      return response.comparison;
    } catch (error: any) {
      throw new Error(error.message || 'Erro ao comparar orçamentos entre períodos');
    }
  }

  // Sugerir orçamento baseado em histórico
  async suggestBudget(categoryId: string, months: number = 3): Promise<{
    suggestedAmount: number;
    averageSpent: number;
    maxSpent: number;
    minSpent: number;
  }> {
    try {
      const response = await this.request<{
        success: boolean;
        suggestion: {
          suggestedAmount: number;
          averageSpent: number;
          maxSpent: number;
          minSpent: number;
        };
      }>(`/api/budgets/suggest?categoryId=${categoryId}&months=${months}`);

      if (!response.success) {
        throw new Error('Erro ao sugerir orçamento');
      }

      return response.suggestion;
    } catch (error: any) {
      throw new Error(error.message || 'Erro ao sugerir orçamento');
    }
  }

  // Copiar orçamentos de outro mês
  async copyBudgetsFromMonth(sourceMonth: number, sourceYear: number, targetMonth: number, targetYear: number): Promise<{
    copied: number;
    skipped: number;
    errors: string[];
  }> {
    try {
      const response = await this.request<{
        success: boolean;
        result: {
          copied: number;
          skipped: number;
          errors: string[];
        };
      }>('/api/budgets/copy-from-month', {
        method: 'POST',
        body: JSON.stringify({
          sourceMonth,
          sourceYear,
          targetMonth,
          targetYear,
        }),
      });

      if (!response.success) {
        throw new Error('Erro ao copiar orçamentos');
      }

      return response.result;
    } catch (error: any) {
      throw new Error(error.message || 'Erro ao copiar orçamentos de outro mês');
    }
  }

  // Exportar orçamentos
  async exportBudgets(filters?: {
    month?: number;
    year?: number;
    format?: 'csv' | 'excel';
  }): Promise<string> {
    try {
      const queryParams = new URLSearchParams();
      
      if (filters) {
        Object.entries(filters).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            queryParams.append(key, String(value));
          }
        });
      }

      const response = await this.request<{ success: boolean; downloadUrl: string }>(`/api/budgets/export?${queryParams.toString()}`);

      if (!response.success) {
        throw new Error('Erro ao exportar orçamentos');
      }

      return response.downloadUrl;
    } catch (error: any) {
      throw new Error(error.message || 'Erro ao exportar orçamentos');
    }
  }

  // Verificar se orçamento pode ser deletado
  async canDeleteBudget(id: string): Promise<{ canDelete: boolean; reason?: string }> {
    try {
      const response = await this.request<{
        success: boolean;
        canDelete: boolean;
        reason?: string;
      }>(`/api/budgets/${id}/can-delete`);

      if (!response.success) {
        throw new Error('Erro ao verificar orçamento');
      }

      return { canDelete: response.canDelete, reason: response.reason };
    } catch (error: any) {
      throw new Error(error.message || 'Erro ao verificar se orçamento pode ser deletado');
    }
  }

  // Obter histórico de gastos do orçamento
  async getBudgetSpendingHistory(id: string): Promise<{
    date: string;
    dailySpent: number;
    cumulativeSpent: number;
    transactionCount: number;
  }[]> {
    try {
      const response = await this.request<{
        success: boolean;
        history: {
          date: string;
          dailySpent: number;
          cumulativeSpent: number;
          transactionCount: number;
        }[];
      }>(`/api/budgets/${id}/spending-history`);

      if (!response.success) {
        throw new Error('Erro ao carregar histórico de gastos');
      }

      return response.history;
    } catch (error: any) {
      throw new Error(error.message || 'Erro ao carregar histórico de gastos do orçamento');
    }
  }
}

export const BudgetService = new BudgetServiceClass();