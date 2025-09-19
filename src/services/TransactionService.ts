// src/services/TransactionService.ts - VERSÃO CORRIGIDA COM TIPOS CORRETOS
import apiService from './api';
import { Transaction, CreateTransactionData, FinancialSummary, TransactionFilters, PaginatedResponse, ApiResponse } from '../types';

// Interface para update que inclui campos adicionais
export interface UpdateTransactionData extends Partial<CreateTransactionData> {
  id?: string;
}

// Interface TransactionsResponse com propriedade success
export interface TransactionsResponse {
  success: boolean;
  data: Transaction[];
  pagination: {
    current: number;
    pages: number;
    total: number;
  };
  message?: string;
}

// Interface para resposta individual
export interface TransactionResponse {
  success: boolean;
  data?: Transaction;
  message?: string;
}

export class TransactionService {
  private static readonly BASE_PATH = '/transactions';

  /**
   * Mapear Transaction da API para compatibilidade
   */
  private static mapTransaction(apiTransaction: any): Transaction {
    return {
      ...apiTransaction,
      id: apiTransaction._id || apiTransaction.id,
      _id: apiTransaction._id || apiTransaction.id,
      userId: apiTransaction.userId || '',
      description: apiTransaction.description || '',
      amount: apiTransaction.amount || 0,
      type: apiTransaction.type || 'expense',
      category: this.ensureCategory(apiTransaction.category),
      date: apiTransaction.date || new Date().toISOString(),
      isRecurring: apiTransaction.isRecurring || false,
      recurringDay: apiTransaction.recurringDay,
      budgetId: apiTransaction.budgetId,
      createdAt: apiTransaction.createdAt || new Date().toISOString(),
      updatedAt: apiTransaction.updatedAt || new Date().toISOString(),
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
  private static mapCreateData(data: CreateTransactionData): any {
    return {
      description: data.description,
      amount: data.amount,
      type: data.type,
      category: data.category, // Manter como string conforme o tipo
      date: data.date || new Date().toISOString(),
      isRecurring: data.isRecurring || false,
      recurringDay: data.recurringDay,
      budgetId: data.budgetId,
    };
  }

  /**
   * Buscar todas as transações do usuário
   */
  static async getTransactions(filters: TransactionFilters = {}): Promise<PaginatedResponse<Transaction[]>> {
    try {
      const response = await apiService.getTransactions(filters);
      
      if (response.success && response.data) {
        const transactionsData = response.data.data || response.data;
        const paginationData = response.data.pagination || { current: 1, pages: 1, total: 0 };
        
        return {
          success: true,
          data: Array.isArray(transactionsData) ? 
            transactionsData.map(t => this.mapTransaction(t)) : [],
          pagination: paginationData,
        };
      }
      
      return {
        success: false,
        data: [],
        pagination: { current: 1, pages: 1, total: 0 },
        message: response.message || 'Erro ao carregar transações'
      };
    } catch (error: any) {
      console.error('❌ Erro ao buscar transações:', error);
      return {
        success: false,
        data: [],
        pagination: { current: 1, pages: 1, total: 0 },
        message: error.message || 'Erro ao carregar transações'
      };
    }
  }

  /**
   * Buscar transação por ID
   */
  static async getTransaction(id: string): Promise<TransactionResponse> {
    try {
      const response = await apiService.getTransaction(id);
      
      if (response.success && response.data) {
        return {
          success: true,
          data: this.mapTransaction(response.data),
        };
      }
      
      return {
        success: false,
        message: response.message || 'Transação não encontrada'
      };
    } catch (error: any) {
      console.error('❌ Erro ao buscar transação:', error);
      return {
        success: false,
        message: error.message || 'Erro ao carregar transação'
      };
    }
  }

  /**
   * Criar nova transação
   */
  static async createTransaction(data: CreateTransactionData): Promise<TransactionResponse> {
    try {
      const mappedData = this.mapCreateData(data);
      const response = await apiService.createTransaction(mappedData);
      
      if (response.success && response.data) {
        return {
          success: true,
          data: this.mapTransaction(response.data),
        };
      }
      
      return {
        success: false,
        message: response.message || 'Erro ao criar transação'
      };
    } catch (error: any) {
      console.error('❌ Erro ao criar transação:', error);
      return {
        success: false,
        message: error.message || 'Erro ao criar transação'
      };
    }
  }

  /**
   * Atualizar transação
   */
  static async updateTransaction(id: string, data: UpdateTransactionData): Promise<TransactionResponse> {
    try {
      const response = await apiService.updateTransaction(id, data);
      
      if (response.success && response.data) {
        return {
          success: true,
          data: this.mapTransaction(response.data),
        };
      }
      
      return {
        success: false,
        message: response.message || 'Erro ao atualizar transação'
      };
    } catch (error: any) {
      console.error('❌ Erro ao atualizar transação:', error);
      return {
        success: false,
        message: error.message || 'Erro ao atualizar transação'
      };
    }
  }

  /**
   * Deletar transação
   */
  static async deleteTransaction(id: string): Promise<{ success: boolean; message?: string }> {
    try {
      const response = await apiService.deleteTransaction(id);
      
      return {
        success: response.success,
        message: response.message || 'Transação deletada com sucesso'
      };
    } catch (error: any) {
      console.error('❌ Erro ao deletar transação:', error);
      return {
        success: false,
        message: error.message || 'Erro ao deletar transação'
      };
    }
  }

  /**
   * Buscar resumo financeiro
   */
  static async getFinancialSummary(month?: number, year?: number): Promise<FinancialSummary> {
    try {
      const response = await apiService.getFinancialSummary(month, year);
      
      if (response.success && response.data) {
        return response.data;
      }
      
      // Retornar resumo vazio baseado no tipo FinancialSummary correto
      return {
        income: 0,
        expense: 0,
        incomeCount: 0,
        expenseCount: 0,
        balance: 0,
      };
    } catch (error: any) {
      console.error('❌ Erro ao buscar resumo financeiro:', error);
      return {
        income: 0,
        expense: 0,
        incomeCount: 0,
        expenseCount: 0,
        balance: 0,
      };
    }
  }

  /**
   * Buscar transações recentes
   */
  static async getRecentTransactions(limit: number = 5): Promise<Transaction[]> {
    try {
      const response = await apiService.getRecentTransactions(limit);
      
      if (response.success && response.data) {
        return Array.isArray(response.data) ? 
          response.data.map(t => this.mapTransaction(t)) : [];
      }
      
      return [];
    } catch (error: any) {
      console.error('❌ Erro ao buscar transações recentes:', error);
      return [];
    }
  }

  /**
   * Duplicar transação
   */
  static async duplicateTransaction(id: string): Promise<TransactionResponse> {
    try {
      // Buscar a transação original
      const originalResponse = await this.getTransaction(id);
      
      if (!originalResponse.success || !originalResponse.data) {
        return {
          success: false,
          message: 'Transação original não encontrada'
        };
      }

      // Criar nova transação baseada na original
      const duplicateData: CreateTransactionData = {
        description: `${originalResponse.data.description} (Cópia)`,
        amount: originalResponse.data.amount,
        type: originalResponse.data.type,
        category: typeof originalResponse.data.category === 'string' ? 
          originalResponse.data.category : 
          originalResponse.data.category._id || originalResponse.data.category.id,
        date: new Date().toISOString(),
        isRecurring: false, // Não duplicar como recorrente
      };

      return await this.createTransaction(duplicateData);
    } catch (error: any) {
      console.error('❌ Erro ao duplicar transação:', error);
      return {
        success: false,
        message: error.message || 'Erro ao duplicar transação'
      };
    }
  }
}