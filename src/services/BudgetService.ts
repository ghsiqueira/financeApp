// src/services/BudgetService.ts - VERSÃO CORRIGIDA COM TIPOS CORRETOS
import apiService from './api';
import { Budget, CreateBudgetData } from '../types';

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
      createdAt: apiBudget.createdAt || new Date().toISOString(),
      updatedAt: apiBudget.updatedAt || new Date().toISOString(),
      userId: apiBudget.userId || '',
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
      monthlyLimit: data.monthlyLimit, // Usar monthlyLimit em vez de amount
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
    try {
      const response = await apiService.getBudgets(page, limit, filters);
      
      if (response.success && response.data) {
        const budgetsData = response.data.data || response.data;
        const paginationData = response.data.pagination || { current: 1, pages: 1, total: 0 };
        
        return {
          success: true,
          data: Array.isArray(budgetsData) ? 
            budgetsData.map(b => this.mapBudget(b)) : [],
          pagination: paginationData,
        };
      }
      
      return {
        success: false,
        data: [],
        pagination: { current: 1, pages: 1, total: 0 },
        message: response.message || 'Erro ao carregar orçamentos'
      };
    } catch (error: any) {
      console.error('❌ Erro ao buscar orçamentos:', error);
      return {
        success: false,
        data: [],
        pagination: { current: 1, pages: 1, total: 0 },
        message: error.message || 'Erro ao carregar orçamentos'
      };
    }
  }

  /**
   * Buscar orçamento por ID
   */
  static async getBudget(id: string): Promise<BudgetResponse> {
    try {
      const response = await apiService.getBudget(id);
      
      if (response.success && response.data) {
        return {
          success: true,
          data: this.mapBudget(response.data),
        };
      }
      
      return {
        success: false,
        message: response.message || 'Orçamento não encontrado'
      };
    } catch (error: any) {
      console.error('❌ Erro ao buscar orçamento:', error);
      return {
        success: false,
        message: error.message || 'Erro ao carregar orçamento'
      };
    }
  }

  /**
   * Criar novo orçamento
   */
  static async createBudget(data: CreateBudgetData): Promise<BudgetResponse> {
    try {
      const mappedData = this.mapCreateData(data);
      const response = await apiService.createBudget(mappedData);
      
      if (response.success && response.data) {
        return {
          success: true,
          data: this.mapBudget(response.data),
        };
      }
      
      return {
        success: false,
        message: response.message || 'Erro ao criar orçamento'
      };
    } catch (error: any) {
      console.error('❌ Erro ao criar orçamento:', error);
      return {
        success: false,
        message: error.message || 'Erro ao criar orçamento'
      };
    }
  }

  /**
   * Atualizar orçamento
   */
  static async updateBudget(id: string, data: UpdateBudgetData): Promise<BudgetResponse> {
    try {
      const response = await apiService.updateBudget(id, data);
      
      if (response.success && response.data) {
        return {
          success: true,
          data: this.mapBudget(response.data),
        };
      }
      
      return {
        success: false,
        message: response.message || 'Erro ao atualizar orçamento'
      };
    } catch (error: any) {
      console.error('❌ Erro ao atualizar orçamento:', error);
      return {
        success: false,
        message: error.message || 'Erro ao atualizar orçamento'
      };
    }
  }

  /**
   * Deletar orçamento
   */
  static async deleteBudget(id: string): Promise<{ success: boolean; message?: string }> {
    try {
      const response = await apiService.deleteBudget(id);
      
      return {
        success: response.success,
        message: response.message || 'Orçamento deletado com sucesso'
      };
    } catch (error: any) {
      console.error('❌ Erro ao deletar orçamento:', error);
      return {
        success: false,
        message: error.message || 'Erro ao deletar orçamento'
      };
    }
  }

  /**
   * Ajustar limite do orçamento
   */
  static async adjustBudgetLimit(id: string, newLimit: number): Promise<BudgetResponse> {
    try {
      const updateData: UpdateBudgetData = { 
        monthlyLimit: newLimit // Usar monthlyLimit em vez de amount
      };
      return await this.updateBudget(id, updateData);
    } catch (error: any) {
      console.error('❌ Erro ao ajustar limite do orçamento:', error);
      return {
        success: false,
        message: error.message || 'Erro ao ajustar limite do orçamento'
      };
    }
  }

  /**
   * Buscar orçamentos atuais (método para HomeScreen)
   */
  static async getCurrentBudgets(limit: number = 5): Promise<Budget[]> {
    try {
      const response = await apiService.getCurrentBudgets(limit);
      
      if (response.success && response.data) {
        return Array.isArray(response.data) ? 
          response.data.map(b => this.mapBudget(b)) : [];
      }
      
      return [];
    } catch (error: any) {
      console.error('❌ Erro ao buscar orçamentos atuais:', error);
      return [];
    }
  }

  /**
   * Buscar resumo dos orçamentos
   */
  static async getBudgetSummary(month?: number, year?: number): Promise<any> {
    try {
      const currentDate = new Date();
      const filters: BudgetFilters = {
        month: month || currentDate.getMonth() + 1,
        year: year || currentDate.getFullYear(),
        isActive: true
      };

      const response = await this.getBudgets(1, 100, filters);
      
      if (response.success && response.data) {
        const budgets = response.data;
        
        return {
          totalBudgets: budgets.length,
          totalLimit: budgets.reduce((sum, b) => sum + (b.monthlyLimit || 0), 0),
          totalSpent: budgets.reduce((sum, b) => sum + (b.spent || 0), 0),
          overBudgetCount: budgets.filter(b => b.isOverBudget).length,
          budgets: budgets.slice(0, 5) // Top 5 para resumo
        };
      }
      
      return {
        totalBudgets: 0,
        totalLimit: 0,
        totalSpent: 0,
        overBudgetCount: 0,
        budgets: []
      };
    } catch (error: any) {
      console.error('❌ Erro ao buscar resumo dos orçamentos:', error);
      return {
        totalBudgets: 0,
        totalLimit: 0,
        totalSpent: 0,
        overBudgetCount: 0,
        budgets: []
      };
    }
  }

  /**
   * Ativar/Desativar orçamento
   */
  static async toggleBudgetStatus(id: string, isActive: boolean): Promise<BudgetResponse> {
    try {
      const updateData: UpdateBudgetData = { isActive };
      return await this.updateBudget(id, updateData);
    } catch (error: any) {
      console.error('❌ Erro ao alterar status do orçamento:', error);
      return {
        success: false,
        message: error.message || 'Erro ao alterar status do orçamento'
      };
    }
  }
}