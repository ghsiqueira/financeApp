// src/services/TransactionService.ts - VERSÃO CORRIGIDA
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
   * Mapear Transaction da API para compatibilidade - VERSÃO CORRIGIDA
   */
  private static mapTransaction(apiTransaction: any): Transaction {
    // ✅ CORREÇÃO: Não adicionar campos padrão que sobrescrevem os dados da API
    console.log('🔄 Mapeando transação da API:', JSON.stringify(apiTransaction, null, 2));
    
    const mapped: Transaction = {
      _id: apiTransaction._id || apiTransaction.id,
      id: apiTransaction.id || apiTransaction._id,
      userId: apiTransaction.userId,
      description: apiTransaction.description,
      amount: Number(apiTransaction.amount),
      type: apiTransaction.type,
      category: this.ensureCategory(apiTransaction.category),
      date: apiTransaction.date,
      isRecurring: Boolean(apiTransaction.isRecurring),
      recurringDay: apiTransaction.recurringDay,
      budgetId: apiTransaction.budgetId,
      notes: apiTransaction.notes,
      createdAt: apiTransaction.createdAt,
      updatedAt: apiTransaction.updatedAt,
    };
    
    console.log('✅ Transação mapeada:', JSON.stringify(mapped, null, 2));
    return mapped;
  }

  /**
   * Garantir que category é um objeto Category válido - VERSÃO CORRIGIDA
   */
  private static ensureCategory(category: any): any {
    console.log('🏷️ Processando categoria:', JSON.stringify(category, null, 2));
    
    if (!category) {
      console.log('⚠️ Categoria não fornecida, usando padrão');
      return { 
        _id: 'default', 
        id: 'default', 
        name: 'Sem categoria', 
        icon: '📝', 
        color: '#4CAF50', 
        type: 'expense' as const, 
        isDefault: false, 
        createdAt: new Date().toISOString() 
      };
    }
    
    // Se já é um objeto category válido, retornar como está
    if (typeof category === 'object' && category.name) {
      console.log('✅ Categoria já é objeto válido:', category.name);
      return {
        ...category,
        id: category.id || category._id,
        _id: category._id || category.id,
      };
    }
    
    // Se é string, criar objeto básico
    if (typeof category === 'string') {
      console.log('🔄 Convertendo categoria string para objeto:', category);
      return { 
        _id: category, 
        id: category, 
        name: 'Categoria', 
        icon: '📝', 
        color: '#4CAF50', 
        type: 'expense' as const, 
        isDefault: false, 
        createdAt: new Date().toISOString() 
      };
    }
    
    console.log('⚠️ Categoria em formato desconhecido, usando padrão');
    return {
      _id: 'default',
      id: 'default',
      name: 'Sem categoria',
      icon: '📝',
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
      notes: data.notes,
    };
  }

  /**
   * Verificar duplicatas de transação
   */
  static async checkDuplicates(transactionData: CreateTransactionData): Promise<Transaction[]> {
    try {
      // Filtros para buscar transações similares
      const filters = {
        description: transactionData.description.trim(),
        amount: transactionData.amount,
        type: transactionData.type,
        category: transactionData.category,
        // Buscar transações dos últimos 30 dias para verificar duplicatas
        startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
        endDate: new Date().toISOString(),
      };

      const response = await this.getTransactions(filters);
      
      if (response.success && response.data) {
        // Filtrar apenas transações que são realmente similares
        const duplicates = response.data.filter((transaction: Transaction) => {
          const isSameDescription = transaction.description?.toLowerCase().trim() === 
            transactionData.description.toLowerCase().trim();
          const isSameAmount = Math.abs(transaction.amount - transactionData.amount) < 0.01;
          const isSameType = transaction.type === transactionData.type;
          const isSameCategory = 
            (typeof transaction.category === 'string' && transaction.category === transactionData.category) ||
            (typeof transaction.category === 'object' && 
             (transaction.category._id === transactionData.category || 
              transaction.category.id === transactionData.category));
          
          return isSameDescription && isSameAmount && isSameType && isSameCategory;
        });

        return duplicates;
      }
      
      return [];
    } catch (error: any) {
      console.error('❌ Erro ao verificar duplicatas:', error);
      // Em caso de erro, retorna array vazio para não bloquear a criação
      return [];
    }
  }

  /**
   * Buscar todas as transações do usuário - VERSÃO CORRIGIDA
   */
  static async getTransactions(filters: TransactionFilters = {}): Promise<TransactionsResponse> {
    try {
      console.log('🔍 TransactionService.getTransactions chamado com filtros:', filters);
      
      const response = await apiService.getTransactions(filters);
      console.log('📡 Resposta bruta da API:', JSON.stringify(response, null, 2));
      
      if (response.success && response.data) {
        // Verificar se response.data tem a estrutura esperada
        const responseData = response.data as any;
        
        // A estrutura pode ser response.data.data.data ou response.data.data
        let apiData: any;
        let transactionsData: any[];
        let paginationData: any;

        if (responseData.data && responseData.data.data) {
          // Caso: response.data.data.data (estrutura aninhada)
          apiData = responseData.data;
          transactionsData = apiData.data;
          paginationData = apiData.pagination;
        } else if (responseData.data && Array.isArray(responseData.data)) {
          // Caso: response.data.data é diretamente o array
          transactionsData = responseData.data;
          paginationData = responseData.pagination || { current: 1, pages: 1, total: responseData.data.length };
        } else if (Array.isArray(responseData)) {
          // Caso: response.data é diretamente o array
          transactionsData = responseData;
          paginationData = { current: 1, pages: 1, total: responseData.length };
        } else {
          console.log('⚠️ Estrutura de dados não reconhecida:', responseData);
          return {
            success: false,
            data: [],
            pagination: { current: 1, pages: 1, total: 0 },
            message: 'Estrutura de dados não reconhecida'
          };
        }
        
        console.log('📊 Dados das transações extraídos:', transactionsData);
        console.log('🔢 Tipo dos dados:', typeof transactionsData, Array.isArray(transactionsData));
        console.log('📄 Dados de paginação:', paginationData);
        
        if (Array.isArray(transactionsData)) {
          const mappedTransactions = transactionsData.map(t => this.mapTransaction(t));
          console.log('✅ Transações mapeadas:', mappedTransactions.length, 'transações');
          if (mappedTransactions.length > 0) {
            console.log('🔍 Primeira transação mapeada:', mappedTransactions[0]);
          }
          
          return {
            success: true,
            data: mappedTransactions,
            pagination: paginationData || { current: 1, pages: 1, total: mappedTransactions.length },
          };
        } else {
          console.log('⚠️ transactionsData não é um array:', transactionsData);
          return {
            success: false,
            data: [],
            pagination: { current: 1, pages: 1, total: 0 },
            message: 'Dados não são um array'
          };
        }
      }
      
      console.log('⚠️ Resposta não contém dados válidos');
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
   * Buscar transação por ID - VERSÃO CORRIGIDA
   */
  static async getTransaction(id: string): Promise<TransactionResponse> {
    try {
      console.log('🔍 Buscando transação por ID:', id);
      const response = await apiService.getTransaction(id);
      console.log('📡 Resposta da API para getTransaction:', JSON.stringify(response, null, 2));
      
      if (response.success && response.data) {
        // ✅ CORREÇÃO: Verificar se response.data.data existe (estrutura aninhada)
        let transactionData = response.data as any;
        
        // Se há estrutura aninhada response.data.data, usar essa
        if (transactionData.data && transactionData.data._id) {
          console.log('🔄 Detectada estrutura aninhada, extraindo response.data.data');
          transactionData = transactionData.data;
        }
        
        console.log('📊 Dados da transação extraídos:', JSON.stringify(transactionData, null, 2));
        
        const mappedTransaction = this.mapTransaction(transactionData);
        console.log('✅ Transação mapeada:', JSON.stringify(mappedTransaction, null, 2));
        
        return {
          success: true,
          data: mappedTransaction,
        };
      }
      
      console.log('❌ Resposta não contém dados válidos');
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
        // Verificar estrutura aninhada
        let transactionData = response.data as any;
        if (transactionData.data && transactionData.data._id) {
          transactionData = transactionData.data;
        }
        
        return {
          success: true,
          data: this.mapTransaction(transactionData),
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
        // Verificar estrutura aninhada
        let transactionData = response.data as any;
        if (transactionData.data && transactionData.data._id) {
          transactionData = transactionData.data;
        }
        
        return {
          success: true,
          data: this.mapTransaction(transactionData),
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
      console.log('🔍 Buscando resumo financeiro...');
      const response = await apiService.getFinancialSummary(month, year);
      
      console.log('📊 Resposta da API (resumo):', JSON.stringify(response, null, 2));
      
      if (response.success && response.data) {
        // Verificar estrutura da resposta (pode ser aninhada como nas transações)
        let summaryData = response.data as any;
        
        // Se tiver response.data.data, usar esse nível
        if (summaryData.data) {
          summaryData = summaryData.data;
        }
        
        console.log('📈 Dados do resumo extraídos:', summaryData);
        
        // Garantir que todos os valores são números válidos
        const summary: FinancialSummary = {
          income: isNaN(Number(summaryData.income)) ? 0 : Number(summaryData.income),
          expense: isNaN(Number(summaryData.expense)) ? 0 : Number(summaryData.expense),
          incomeCount: isNaN(Number(summaryData.incomeCount)) ? 0 : Number(summaryData.incomeCount),
          expenseCount: isNaN(Number(summaryData.expenseCount)) ? 0 : Number(summaryData.expenseCount),
          balance: 0, // Será calculado abaixo
        };
        
        // Calcular balance manualmente para garantir precisão
        summary.balance = summary.income - summary.expense;
        
        console.log('✅ Resumo processado:', summary);
        return summary;
      }
      
      console.log('⚠️ Resposta da API não contém dados válidos, retornando resumo vazio');
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
      console.log('🔍 Buscando transações recentes, limite:', limit);
      const response = await apiService.getRecentTransactions(limit);
      
      console.log('📊 Resposta da API (recentes):', JSON.stringify(response, null, 2));
      
      if (response.success && response.data) {
        let transactionsData = response.data as any;
        
        // Verificar se tem estrutura aninhada
        if (transactionsData.data) {
          transactionsData = transactionsData.data;
        }
        
        // Se ainda tem .data (response.data.data.data)
        if (transactionsData.data) {
          transactionsData = transactionsData.data;
        }
        
        console.log('📋 Dados das transações recentes extraídos:', transactionsData);
        console.log('🔢 É array?', Array.isArray(transactionsData));
        
        if (Array.isArray(transactionsData)) {
          const mappedTransactions = transactionsData.map((t: any) => this.mapTransaction(t));
          console.log('✅ Transações recentes mapeadas:', mappedTransactions.length);
          return mappedTransactions;
        }
      }
      
      console.log('⚠️ Nenhuma transação recente encontrada');
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