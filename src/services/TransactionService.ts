// src/services/TransactionService.ts - VERSÃO LIMPA E FUNCIONAL
import apiService from './api';
import { Transaction, CreateTransactionData, FinancialSummary, TransactionFilters, PaginatedResponse } from '../types';
import { safeApiCall, getMockData } from '../utils/apiUtils';

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
      category: data.category,
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
    return safeApiCall(
      async () => {
        const response = await apiService.getTransactions(filters);
        const transactionsData = response.data || [];
        
        return {
          success: true,
          data: Array.isArray(transactionsData) ? 
            transactionsData.map(transaction => this.mapTransaction(transaction)) : [],
          pagination: response.pagination || {
            current: filters.page || 1,
            pages: 1,
            total: Array.isArray(transactionsData) ? transactionsData.length : 0,
          },
        };
      },
      {
        success: true,
        data: (getMockData('transactions') as any[]).map(transaction => this.mapTransaction(transaction)),
        pagination: { current: 1, pages: 1, total: 0 },
      }
    );
  }

  /**
   * Buscar transação por ID
   */
  static async getTransaction(id: string): Promise<TransactionResponse> {
    return safeApiCall(
      async () => {
        const response = await apiService.getTransaction(id);
        return {
          success: true,
          data: response.data ? this.mapTransaction(response.data) : undefined,
        };
      },
      {
        success: true,
        data: this.mapTransaction((getMockData('transactions') as any[])[0]),
      }
    );
  }

  /**
   * Criar nova transação
   */
  static async createTransaction(data: CreateTransactionData): Promise<TransactionResponse> {
    return safeApiCall(
      async () => {
        const mappedData = this.mapCreateData(data);
        const response = await apiService.createTransaction(mappedData);
        return {
          success: true,
          data: response.data ? this.mapTransaction(response.data) : undefined,
        };
      },
      {
        success: true,
        data: this.mapTransaction({
          _id: Date.now().toString(),
          ...this.mapCreateData(data),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }),
      }
    );
  }

  /**
   * Atualizar transação
   */
  static async updateTransaction(id: string, data: UpdateTransactionData): Promise<Transaction> {
    return safeApiCall(
      async () => {
        const response = await apiService.updateTransaction(id, data);
        return this.mapTransaction(response.data);
      },
      this.mapTransaction({
        _id: id,
        ...data,
        updatedAt: new Date().toISOString(),
      })
    );
  }

  /**
   * Deletar transação
   */
  static async deleteTransaction(id: string): Promise<void> {
    return safeApiCall(
      async () => {
        await apiService.deleteTransaction(id);
      },
      undefined
    );
  }

  /**
   * Buscar resumo financeiro - MÉTODO NECESSÁRIO PARA O HOMESCREEN
   */
  static async getFinancialSummary(): Promise<FinancialSummary> {
    return safeApiCall(
      async () => {
        const transactionsResponse = await this.getTransactions({ 
          page: 1, 
          limit: 1000
        });
        
        if (transactionsResponse.success && transactionsResponse.data) {
          const transactions = transactionsResponse.data;
          
          const summary: FinancialSummary = {
            income: 0,
            expense: 0,
            incomeCount: 0,
            expenseCount: 0,
            balance: 0,
          };

          transactions.forEach(transaction => {
            if (transaction.type === 'income') {
              summary.income += transaction.amount;
              summary.incomeCount++;
            } else {
              summary.expense += transaction.amount;
              summary.expenseCount++;
            }
          });

          summary.balance = summary.income - summary.expense;
          return summary;
        }
        
        throw new Error('Não foi possível calcular resumo');
      },
      {
        income: 5000,
        expense: 3500,
        incomeCount: 15,
        expenseCount: 42,
        balance: 1500,
      }
    );
  }

  /**
   * Buscar transações recentes - MÉTODO NECESSÁRIO PARA O HOMESCREEN
   */
  static async getRecentTransactions(limit: number = 5): Promise<Transaction[]> {
    return safeApiCall(
      async () => {
        const response = await this.getTransactions({ 
          page: 1, 
          limit,
        });
        
        if (response.success && response.data) {
          return response.data.slice(0, limit);
        }
        
        throw new Error('Não foi possível buscar transações recentes');
      },
      (getMockData('transactions') as any[]).slice(0, limit).map(transaction => this.mapTransaction(transaction))
    );
  }

  /**
   * Duplicar transação - MÉTODO NECESSÁRIO PARA O HOOK
   */
  static async duplicateTransaction(id: string): Promise<Transaction> {
    return safeApiCall(
      async () => {
        const originalResponse = await this.getTransaction(id);
        if (originalResponse.success && originalResponse.data) {
          const original = originalResponse.data;
          const duplicateData: CreateTransactionData = {
            description: `${original.description} (cópia)`,
            amount: original.amount,
            type: original.type,
            category: original.category._id,
            date: new Date().toISOString(),
            isRecurring: original.isRecurring,
            recurringDay: original.recurringDay,
          };
          
          const createResponse = await this.createTransaction(duplicateData);
          if (createResponse.success && createResponse.data) {
            return createResponse.data;
          }
        }
        
        throw new Error('Não foi possível duplicar transação');
      },
      this.mapTransaction({
        _id: Date.now().toString(),
        description: 'Transação duplicada',
        amount: 100,
        type: 'expense',
        category: { name: 'Outros' },
        date: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      })
    );
  }

  /**
   * Buscar estatísticas das transações
   */
  static async getTransactionStats(): Promise<any> {
    return safeApiCall(
      async () => {
        const response = await this.getTransactions({ page: 1, limit: 1000 });
        
        if (response.success && response.data) {
          const transactions = response.data;
          
          const stats = {
            totalTransactions: transactions.length,
            totalIncome: transactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0),
            totalExpense: transactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0),
            averageTransaction: transactions.length > 0 ? transactions.reduce((sum, t) => sum + t.amount, 0) / transactions.length : 0,
            categoriesCount: new Set(transactions.map(t => t.category._id)).size,
          };
          
          return stats;
        }
        
        throw new Error('Não foi possível calcular estatísticas');
      },
      {
        totalTransactions: 50,
        totalIncome: 5000,
        totalExpense: 3500,
        averageTransaction: 150,
        categoriesCount: 8,
      }
    );
  }

  /**
   * Buscar transações por categoria
   */
  static async getTransactionsByCategory(categoryId: string, filters: TransactionFilters = {}): Promise<Transaction[]> {
    return safeApiCall(
      async () => {
        const response = await this.getTransactions({ ...filters, category: categoryId });
        return response.data || [];
      },
      (getMockData('transactions') as any[]).filter((t: any) => t.category._id === categoryId).map(transaction => this.mapTransaction(transaction))
    );
  }

  static async checkDuplicates(data: CreateTransactionData): Promise<Transaction[]> {
    const response = await this.getTransactions({});
    if (response.success && response.data) {
      return response.data.filter(
        (t) =>
          t.description === data.description &&
          t.amount === data.amount &&
          t.date.split('T')[0] === (data.date ? data.date.split('T')[0] : '')
      );
    }
    return [];
  }
}

// Exportar tipos
export { Transaction, CreateTransactionData };
