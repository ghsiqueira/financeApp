// src/services/BudgetService.ts - VERSÃO COMPLETA CORRIGIDA
import apiService from './api';
import { Budget, CreateBudgetData } from '../types';
import { safeApiCall, getMockData } from '../utils/apiUtils';

// Interface para update que inclui campos adicionais
export interface UpdateBudgetData extends Partial<CreateBudgetData> {
  spent?: number;
  isActive?: boolean;
  monthlyLimit?: number;
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
      amount: apiBudget.monthlyLimit || apiBudget.amount || 0,
      monthlyLimit: apiBudget.monthlyLimit || apiBudget.amount || 0,
      spent: apiBudget.spent || 0,
      usage: apiBudget.usage || 0,
      remaining: apiBudget.remaining || 0,
      isOverBudget: apiBudget.isOverBudget || false,
      overage: apiBudget.overage || 0,
      // Garantir que category existe como objeto Category
      category: this.ensureCategory(apiBudget.category),
      name: apiBudget.name || 'Orçamento',
      month: apiBudget.month || new Date().getMonth() + 1,
      year: apiBudget.year || new Date().getFullYear(),
      isActive: apiBudget.isActive !== undefined ? apiBudget.isActive : true,
      userId: apiBudget.userId || '',
      createdAt: apiBudget.createdAt || new Date().toISOString(),
      updatedAt: apiBudget.updatedAt || new Date().toISOString(),
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
        const response = await apiService.getBudgets(
          filters.month,
          filters.year,
          filters.isActive
        );
        
        const budgetsData = response.data || [];
        
        return {
          success: true,
          data: Array.isArray(budgetsData) ? 
            budgetsData.map((budget: any) => this.mapBudget(budget)) : [],
          pagination: response.pagination || {
            current: page,
            pages: 1,
            total: Array.isArray(budgetsData) ? budgetsData.length : 0,
          },
        };
      },
      {
        success: true,
        data: (getMockData('budgets') as any[]).map((budget: any) => this.mapBudget(budget)),
        pagination: { current: 1, pages: 1, total: 0 },
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
        return {
          success: true,
          data: response.data ? this.mapBudget(response.data) : undefined,
        };
      },
      {
        success: true,
        data: this.mapBudget((getMockData('budgets') as any[])[0]),
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
        return {
          success: true,
          data: response.data ? this.mapBudget(response.data) : undefined,
        };
      },
      {
        success: true,
        data: this.mapBudget({
          _id: Date.now().toString(),
          ...this.mapCreateData(data),
          spent: 0,
          isActive: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }),
      }
    );
  }

  /**
   * Atualizar orçamento
   */
  static async updateBudget(id: string, data: UpdateBudgetData): Promise<Budget> {
    return safeApiCall(
      async () => {
        const response = await apiService.updateBudget(id, data);
        return this.mapBudget(response.data);
      },
      this.mapBudget({
        _id: id,
        ...data,
        updatedAt: new Date().toISOString(),
      })
    );
  }

  /**
   * Deletar orçamento
   */
  static async deleteBudget(id: string): Promise<void> {
    return safeApiCall(
      async () => {
        await apiService.deleteBudget(id);
      },
      undefined
    );
  }

  /**
   * Ajustar limite do orçamento - MÉTODO NECESSÁRIO PARA O HOOK
   */
  static async adjustBudgetLimit(id: string, newLimit: number): Promise<Budget> {
    return safeApiCall(
      async () => {
        const updateData: UpdateBudgetData = { monthlyLimit: newLimit };
        const response = await apiService.updateBudget(id, updateData);
        return this.mapBudget(response.data);
      },
      this.mapBudget({
        _id: id,
        monthlyLimit: newLimit,
        amount: newLimit,
        updatedAt: new Date().toISOString(),
      })
    );
  }

  /**
   * Buscar orçamentos atuais (método para HomeScreen)
   */
  static async getCurrentBudgets(limit: number = 5): Promise<Budget[]> {
    return safeApiCall(
      async () => {
        const currentDate = new Date();
        const response = await this.getBudgets(1, limit, {
          month: currentDate.getMonth() + 1,
          year: currentDate.getFullYear(),
          isActive: true
        });

        if (response.success && response.data) {
          return response.data;
        }
        return [];
      },
      (getMockData('budgets') as any[]).slice(0, limit).map((budget: any) => this.mapBudget(budget))
    );
  }

  /**
   * Buscar resumo dos orçamentos
   */
  static async getBudgetSummary(month?: number, year?: number) {
    return safeApiCall(
      async () => {
        const currentDate = new Date();
        const targetMonth = month || (currentDate.getMonth() + 1);
        const targetYear = year || currentDate.getFullYear();
        
        const response = await this.getBudgets(1, 50, {
          month: targetMonth,
          year: targetYear,
          isActive: true
        });
        
        if (response.success) {
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
      {
        success: true,
        data: {
          budgets: (getMockData('budgets') as any[]).map((b: any) => this.mapBudget(b)),
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
}

// Exportar tipos
export { Budget, CreateBudgetData };
