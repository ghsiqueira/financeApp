// src/services/BudgetService.ts
import apiService from './api';
import { Budget, CreateBudgetData } from '../types';
import { safeApiCall, getMockData } from '../utils/apiUtils';

// Interface para update que inclui campos adicionais
export interface UpdateBudgetData extends Partial<CreateBudgetData> {
  spent?: number;
  isActive?: boolean;
}

export interface BudgetFilters {
  month?: number;
  year?: number;
  isActive?: boolean;
  category?: string;
}

// Interface BudgetsResponse com propriedade success
export interface BudgetsResponse {
  success: boolean;
  data: Budget[];
  pagination: {
    current: number;
    pages: number;
    total: number;
  };
  message?: string;
}

// Interface para resposta individual
export interface BudgetResponse {
  success: boolean;
  data?: Budget;
  message?: string;
}

export class BudgetService {
  private static readonly BASE_PATH = '/budgets';

  /**
   * Mapear Budget da API para compatibilidade
   */
  private static mapBudget(apiBudget: any): Budget {
    return {
      ...apiBudget,
      id: apiBudget._id || apiBudget.id,
      _id: apiBudget._id || apiBudget.id,
      amount: apiBudget.monthlyLimit || apiBudget.amount,
      monthlyLimit: apiBudget.monthlyLimit || apiBudget.amount,
      limit: apiBudget.monthlyLimit || apiBudget.amount, // Alias para compatibilidade
      spent: apiBudget.spent || 0,
      // Garantir que category existe como objeto Category
      category: this.ensureCategory(apiBudget.category),
    };
  }

  /**
   * Garantir que category é um objeto Category válido
   */
  private static ensureCategory(category: any): any {
    if (typeof category === 'string') {
      return { 
        _id: category, 
        id: category, 
        name: 'Categoria', 
        icon: '💰', 
        color: '#4CAF50', 
        type: 'expense' as const, 
        isDefault: false, 
        createdAt: new Date().toISOString() 
      };
    }
    return category || {
      _id: 'default',
      id: 'default',
      name: 'Sem categoria',
      icon: '💰',
      color: '#4CAF50',
      type: 'expense' as const,
      isDefault: false,
      createdAt: new Date().toISOString()
    };
  }

  /**
   * Mapear dados de criação para API
   */
  private static mapCreateData(data: CreateBudgetData): any {
    return {
      name: data.name,
      category: data.category,
      monthlyLimit: data.monthlyLimit,
      month: data.month,
      year: data.year,
    };
  }

  /**
   * Buscar todos os orçamentos do usuário
   */
  static async getBudgets(
    page: number = 1,
    limit: number = 20,
    filters: BudgetFilters = {}
  ): Promise<BudgetsResponse> {
    return safeApiCall(
      async () => {
        // Usar apenas os 3 parâmetros que o apiService.getBudgets aceita
        const response = await apiService.getBudgets(
          filters.month,
          filters.year,
          filters.isActive
        );
        
        const budgetsData = response.data || [];
        
        return {
          success: true,
          data: Array.isArray(budgetsData) ? budgetsData.map(this.mapBudget) : [],
          pagination: response.pagination || { current: 1, pages: 1, total: 0 }
        };
      },
      // Fallback com dados mockados
      {
        success: true,
        data: getMockData().budgets,
        pagination: { current: 1, pages: 1, total: 2 }
      }
    );
  }

  /**
   * Buscar orçamento por ID
   */
  static async getBudget(id: string): Promise<BudgetResponse> {
    return safeApiCall(
      async () => {
        const response = await apiService.getBudget(id);
        
        if (response.success && response.data) {
          return {
            success: true,
            data: this.mapBudget(response.data)
          };
        } else {
          return {
            success: false,
            message: response.message || 'Orçamento não encontrado'
          };
        }
      },
      // Fallback
      {
        success: true,
        data: getMockData().budgets[0]
      }
    );
  }

  /**
   * Criar novo orçamento
   */
  static async createBudget(data: CreateBudgetData): Promise<BudgetResponse> {
    return safeApiCall(
      async () => {
        const mappedData = this.mapCreateData(data);
        const response = await apiService.createBudget(mappedData);
        
        if (response.success && response.data) {
          return {
            success: true,
            data: this.mapBudget(response.data)
          };
        } else {
          return {
            success: false,
            message: response.message || 'Erro ao criar orçamento'
          };
        }
      },
      // Fallback
      {
        success: true,
        data: {
          ...getMockData().budgets[0],
          ...data,
          id: 'temp-' + Date.now(),
          _id: 'temp-' + Date.now(),
          category: getMockData().budgets[0].category, // Garantir que category é um objeto
        }
      }
    );
  }

  /**
   * Atualizar orçamento existente
   */
  static async updateBudget(id: string, data: UpdateBudgetData): Promise<BudgetResponse> {
    return safeApiCall(
      async () => {
        const response = await apiService.updateBudget(id, data);
        
        if (response.success && response.data) {
          return {
            success: true,
            data: this.mapBudget(response.data)
          };
        } else {
          return {
            success: false,
            message: response.message || 'Erro ao atualizar orçamento'
          };
        }
      },
      // Fallback
      {
        success: true,
        data: {
          ...getMockData().budgets[0],
          ...data,
          id,
          _id: id,
          category: getMockData().budgets[0].category, // Garantir que category é um objeto
        }
      }
    );
  }

  /**
   * Deletar orçamento
   */
  static async deleteBudget(id: string): Promise<{ success: boolean; message?: string }> {
    return safeApiCall(
      async () => {
        const response = await apiService.deleteBudget(id);
        
        return {
          success: response.success,
          message: response.message || 'Orçamento deletado com sucesso'
        };
      },
      // Fallback
      {
        success: true,
        message: 'Orçamento deletado com sucesso (modo offline)'
      }
    );
  }

  /**
   * Buscar resumo dos orçamentos (método simplificado)
   */
  static async getBudgetSummary(month?: number, year?: number) {
    return safeApiCall(
      async () => {
        // Como não temos getBudgetSummary no apiService, vamos simular ou usar outro método
        const currentDate = new Date();
        const targetMonth = month || (currentDate.getMonth() + 1);
        const targetYear = year || currentDate.getFullYear();
        
        // Buscar orçamentos do mês atual
        const response = await this.getBudgets(1, 50, {
          month: targetMonth,
          year: targetYear,
          isActive: true
        });
        
        if (response.success) {
          // Calcular resumo manualmente
          const budgets = response.data;
          const totals = budgets.reduce((acc, budget) => {
            acc.budget += budget.monthlyLimit || 0;
            acc.spent += budget.spent || 0;
            acc.totalBudgets += 1;
            if ((budget.spent || 0) > (budget.monthlyLimit || 0)) {
              acc.overBudgetCount += 1;
            }
            return acc;
          }, {
            budget: 0,
            spent: 0,
            remaining: 0,
            usage: 0,
            overBudgetCount: 0,
            totalBudgets: 0,
          });

          totals.remaining = totals.budget - totals.spent;
          totals.usage = totals.budget > 0 ? (totals.spent / totals.budget) * 100 : 0;

          return {
            success: true,
            data: {
              budgets,
              totals,
              period: {
                month: targetMonth,
                year: targetYear,
              },
            }
          };
        } else {
          return {
            success: false,
            message: response.message || 'Erro ao buscar resumo'
          };
        }
      },
      // Fallback
      {
        success: true,
        data: {
          budgets: getMockData().budgets,
          totals: {
            budget: 1100,
            spent: 630,
            remaining: 470,
            usage: 57.27,
            overBudgetCount: 0,
            totalBudgets: 2,
          },
          period: {
            month: new Date().getMonth() + 1,
            year: new Date().getFullYear(),
          },
        }
      }
    );
  }

  /**
   * Buscar orçamentos atuais (método para HomeScreen)
   */
  static async getCurrentBudgets(limit: number = 5): Promise<Budget[]> {
    try {
      const currentDate = new Date();
      const response = await this.getBudgets(1, limit, {
        month: currentDate.getMonth() + 1,
        year: currentDate.getFullYear(),
        isActive: true
      });

      if (response.success && response.data) {
        return response.data;
      }
      return getMockData().budgets;
    } catch (error) {
      console.error('Erro ao buscar orçamentos atuais:', error);
      return getMockData().budgets;
    }
  }
}

// Exportar tipos
export { Budget, CreateBudgetData };