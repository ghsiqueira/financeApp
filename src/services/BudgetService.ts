// src/services/BudgetService.ts - CÓDIGO COMPLETO
import { API_CONFIG } from '../constants';
import { 
  Budget, 
  CreateBudgetData, 
  PaginatedResponse,
  BudgetSummary
} from '../types';

interface BudgetFilters {
  month?: number;
  year?: number;
  isActive?: boolean;
  page?: number;
  limit?: number;
}

class BudgetServiceClass {
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

  // Listar orçamentos
  async getBudgets(filters?: BudgetFilters): Promise<PaginatedResponse<Budget[]>> {
    try {
      const queryParams = new URLSearchParams();
      
      if (filters) {
        Object.entries(filters).forEach(([key, value]) => {
          if (value !== undefined && value !== null && value !== '') {
            queryParams.append(key, value.toString());
          }
        });
      }

      const endpoint = `/api/budgets${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
      const response = await this.request<PaginatedResponse<Budget[]>>(endpoint, {
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
        message: error.message || 'Erro ao carregar orçamentos'
      };
    }
  }

  // Obter orçamento por ID
  async getBudgetById(id: string): Promise<Budget> {
    try {
      const response = await this.request<{ success: boolean; budget: Budget }>(`/api/budgets/${id}`, {
        headers: {
          'Authorization': `Bearer ${await this.getAuthToken()}`,
        },
      });

      if (!response.success || !response.budget) {
        throw new Error('Orçamento não encontrado');
      }

      return response.budget;
    } catch (error: any) {
      throw new Error(error.message || 'Erro ao carregar orçamento');
    }
  }

  // Criar orçamento
  async createBudget(budgetData: CreateBudgetData): Promise<Budget> {
    try {
      const response = await this.request<{ success: boolean; budget: Budget }>('/api/budgets', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${await this.getAuthToken()}`,
        },
        body: JSON.stringify(budgetData),
      });

      if (!response.success || !response.budget) {
        throw new Error('Erro ao criar orçamento');
      }

      return response.budget;
    } catch (error: any) {
      throw new Error(error.message || 'Erro ao criar orçamento');
    }
  }

  // Atualizar orçamento
  async updateBudget(id: string, budgetData: Partial<CreateBudgetData>): Promise<PaginatedResponse<Budget>> {
    try {
      const response = await this.request<{ success: boolean; budget: Budget }>(`/api/budgets/${id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${await this.getAuthToken()}`,
        },
        body: JSON.stringify(budgetData),
      });

      if (!response.success || !response.budget) {
        throw new Error('Erro ao atualizar orçamento');
      }

      return {
        success: true,
        data: response.budget,
        pagination: { current: 1, pages: 1, total: 1 }
      };
    } catch (error: any) {
      throw new Error(error.message || 'Erro ao atualizar orçamento');
    }
  }

  // Deletar orçamento
  async deleteBudget(id: string): Promise<void> {
    try {
      const response = await this.request<{ success: boolean }>(`/api/budgets/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${await this.getAuthToken()}`,
        },
      });

      if (!response.success) {
        throw new Error('Erro ao deletar orçamento');
      }
    } catch (error: any) {
      throw new Error(error.message || 'Erro ao deletar orçamento');
    }
  }

  // Obter resumo dos orçamentos
  async getBudgetSummary(): Promise<BudgetSummary> {
    try {
      const response = await this.request<{ success: boolean; summary: BudgetSummary }>('/api/budgets/summary', {
        headers: {
          'Authorization': `Bearer ${await this.getAuthToken()}`,
        },
      });

      if (!response.success || !response.summary) {
        throw new Error('Erro ao carregar resumo dos orçamentos');
      }

      return response.summary;
    } catch (error: any) {
      // Fallback: calcular resumo básico
      console.error('Erro ao buscar resumo dos orçamentos:', error);
      const currentDate = new Date();
      return {
        budgets: [],
        totals: {
          budget: 0,
          spent: 0,
          remaining: 0,
          usage: 0,
          overBudgetCount: 0,
          totalBudgets: 0,
        },
        period: {
          month: currentDate.getMonth() + 1,
          year: currentDate.getFullYear(),
        },
      };
    }
  }

  // Recalcular orçamento
  async recalculateBudget(id: string): Promise<Budget> {
    try {
      const response = await this.request<{ success: boolean; budget: Budget }>(`/api/budgets/${id}/recalculate`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${await this.getAuthToken()}`,
        },
      });

      if (!response.success || !response.budget) {
        throw new Error('Erro ao recalcular orçamento');
      }

      return response.budget;
    } catch (error: any) {
      throw new Error(error.message || 'Erro ao recalcular orçamento');
    }
  }

  // Obter orçamentos atuais (método auxiliar para HomeScreen)
  async getCurrentBudgets(limit: number = 5): Promise<Budget[]> {
    try {
      const currentDate = new Date();
      const response = await this.getBudgets({
        month: currentDate.getMonth() + 1,
        year: currentDate.getFullYear(),
        page: 1,
        limit: limit
      });

      if (response.success && response.data) {
        return response.data;
      }
      return [];
    } catch (error: any) {
      console.error('Erro ao buscar orçamentos atuais:', error);
      return [];
    }
  }

  // Ajustar limite do orçamento (método auxiliar)
  async adjustBudgetLimit(id: string, newLimit: number): Promise<Budget> {
    try {
      const response = await this.updateBudget(id, { monthlyLimit: newLimit });
      
      if (response.success && response.data) {
        return response.data;
      }
      throw new Error('Erro ao ajustar limite do orçamento');
    } catch (error: any) {
      console.error('Erro ao ajustar limite do orçamento:', error);
      throw error;
    }
  }

  // Obter orçamentos por categoria
  async getBudgetsByCategory(categoryId: string): Promise<Budget[]> {
    try {
      const response = await this.request<{ success: boolean; budgets: Budget[] }>(`/api/budgets/category/${categoryId}`, {
        headers: {
          'Authorization': `Bearer ${await this.getAuthToken()}`,
        },
      });

      if (!response.success) {
        throw new Error('Erro ao buscar orçamentos da categoria');
      }

      return response.budgets || [];
    } catch (error: any) {
      console.error('Erro ao buscar orçamentos por categoria:', error);
      return [];
    }
  }

  // Verificar se orçamento pode ser deletado
  async canDeleteBudget(id: string): Promise<{ canDelete: boolean; reason?: string }> {
    try {
      const response = await this.request<{
        success: boolean;
        canDelete: boolean;
        reason?: string;
      }>(`/api/budgets/${id}/can-delete`, {
        headers: {
          'Authorization': `Bearer ${await this.getAuthToken()}`,
        },
      });

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
      }>(`/api/budgets/${id}/spending-history`, {
        headers: {
          'Authorization': `Bearer ${await this.getAuthToken()}`,
        },
      });

      if (!response.success) {
        throw new Error('Erro ao carregar histórico de gastos');
      }

      return response.history;
    } catch (error: any) {
      throw new Error(error.message || 'Erro ao carregar histórico de gastos do orçamento');
    }
  }

  // Obter alertas de orçamento
  async getBudgetAlerts(): Promise<{
    overBudget: Budget[];
    nearLimit: Budget[];
    recommendations: string[];
  }> {
    try {
      const response = await this.request<{
        success: boolean;
        alerts: {
          overBudget: Budget[];
          nearLimit: Budget[];
          recommendations: string[];
        };
      }>('/api/budgets/alerts', {
        headers: {
          'Authorization': `Bearer ${await this.getAuthToken()}`,
        },
      });

      if (!response.success || !response.alerts) {
        throw new Error('Erro ao carregar alertas de orçamento');
      }

      return response.alerts;
    } catch (error: any) {
      console.error('Erro ao buscar alertas de orçamento:', error);
      return {
        overBudget: [],
        nearLimit: [],
        recommendations: [],
      };
    }
  }

  // Duplicar orçamento para próximo mês
  async duplicateBudget(id: string, targetMonth: number, targetYear: number): Promise<Budget> {
    try {
      const response = await this.request<{ success: boolean; budget: Budget }>(`/api/budgets/${id}/duplicate`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${await this.getAuthToken()}`,
        },
        body: JSON.stringify({
          targetMonth,
          targetYear,
        }),
      });

      if (!response.success || !response.budget) {
        throw new Error('Erro ao duplicar orçamento');
      }

      return response.budget;
    } catch (error: any) {
      throw new Error(error.message || 'Erro ao duplicar orçamento');
    }
  }

  // Arquivar orçamento
  async archiveBudget(id: string): Promise<Budget> {
    try {
      const response = await this.request<{ success: boolean; budget: Budget }>(`/api/budgets/${id}/archive`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${await this.getAuthToken()}`,
        },
      });

      if (!response.success || !response.budget) {
        throw new Error('Erro ao arquivar orçamento');
      }

      return response.budget;
    } catch (error: any) {
      throw new Error(error.message || 'Erro ao arquivar orçamento');
    }
  }

  // Restaurar orçamento arquivado
  async restoreBudget(id: string): Promise<Budget> {
    try {
      const response = await this.request<{ success: boolean; budget: Budget }>(`/api/budgets/${id}/restore`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${await this.getAuthToken()}`,
        },
      });

      if (!response.success || !response.budget) {
        throw new Error('Erro ao restaurar orçamento');
      }

      return response.budget;
    } catch (error: any) {
      throw new Error(error.message || 'Erro ao restaurar orçamento');
    }
  }
}

export const BudgetService = new BudgetServiceClass();