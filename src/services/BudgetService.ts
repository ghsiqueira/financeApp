// src/services/BudgetService.ts - VERSÃO COM DEBUG PARA IDENTIFICAR PROBLEMA
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
    console.log('🔄 BudgetService.mapBudget - Dados recebidos:', apiBudget);
    
    const mapped = {
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

    console.log('✅ BudgetService.mapBudget - Dados mapeados:', mapped);
    return mapped;
  }

  /**
   * Garantir que category é um objeto Category válido
   */
  private static ensureCategory(category: any): any {
    console.log('🔄 BudgetService.ensureCategory - Category recebida:', category);
    
    if (typeof category === 'string') {
      const defaultCategory = { 
        _id: category, 
        id: category, 
        name: 'Categoria', 
        icon: '💰', 
        color: '#4CAF50', 
        type: 'expense' as const, 
        isDefault: false, 
        createdAt: new Date().toISOString() 
      };
      console.log('✅ Category convertida de string:', defaultCategory);
      return defaultCategory;
    }
    
    const finalCategory = category || {
      _id: 'default',
      id: 'default',
      name: 'Sem categoria',
      icon: '💰',
      color: '#4CAF50',
      type: 'expense' as const,
      isDefault: false,
      createdAt: new Date().toISOString()
    };
    
    console.log('✅ Category final:', finalCategory);
    return finalCategory;
  }

  /**
   * Mapear dados de criação para API
   */
  private static mapCreateData(data: CreateBudgetData): any {
    const mapped = {
      name: data.name,
      category: data.category,
      monthlyLimit: data.monthlyLimit,
      month: data.month,
      year: data.year,
    };
    
    console.log('🔄 BudgetService.mapCreateData:', mapped);
    return mapped;
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
      console.log('🔍 BudgetService.getBudgets - Iniciando busca com parâmetros:', { page, limit, filters });
      
      const response = await apiService.getBudgets(page, limit, filters);
      console.log('📡 BudgetService.getBudgets - Resposta da API completa:', JSON.stringify(response, null, 2));
      
      if (response.success && response.data) {
        console.log('✅ API respondeu com sucesso');
        
        // Verificar estrutura da resposta
        console.log('🔍 Verificando estrutura da resposta...');
        console.log('- response.data:', typeof response.data, Array.isArray(response.data));
        console.log('- response.data.data:', typeof response.data.data, Array.isArray(response.data.data));
        
        // Extrair os dados dos orçamentos - CORRIGINDO AQUI
        let budgetsData: any[];
        if (Array.isArray(response.data)) {
          // Se response.data já é um array, usar diretamente
          budgetsData = response.data;
          console.log('📋 Dados extraídos diretamente de response.data (array)');
        } else if (response.data.data && Array.isArray(response.data.data)) {
          // Se está em response.data.data
          budgetsData = response.data.data;
          console.log('📋 Dados extraídos de response.data.data');
        } else {
          // Fallback - tentar extrair de outras possíveis estruturas
          budgetsData = [];
          console.log('⚠️ Estrutura de dados não reconhecida, usando array vazio');
        }
        
        console.log('📊 budgetsData final:', budgetsData);
        console.log('📊 budgetsData é array?', Array.isArray(budgetsData));
        console.log('📊 budgetsData.length:', budgetsData.length);
        
        // Mapear os orçamentos
        const mappedBudgets = Array.isArray(budgetsData) ? 
          budgetsData.map(b => this.mapBudget(b)) : [];
        
        console.log('🗂️ Orçamentos mapeados:', mappedBudgets.length, 'itens');
        
        // Extrair paginação
        const paginationData = response.data.pagination || { current: 1, pages: 1, total: budgetsData.length };
        console.log('📄 Dados de paginação:', paginationData);
        
        const finalResponse = {
          success: true,
          data: mappedBudgets,
          pagination: paginationData,
        };
        
        console.log('🎯 BudgetService.getBudgets - Resposta final:', finalResponse);
        return finalResponse;
      }
      
      console.log('❌ API não respondeu com sucesso ou sem dados');
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
      console.log('🔍 BudgetService.getBudget - Buscando ID:', id);
      
      const response = await apiService.getBudget(id);
      console.log('📡 BudgetService.getBudget - Resposta da API:', response);
      
      if (response.success && response.data) {
        const mappedBudget = this.mapBudget(response.data);
        console.log('✅ Orçamento encontrado e mapeado:', mappedBudget);
        
        return {
          success: true,
          data: mappedBudget,
        };
      }
      
      console.log('❌ Orçamento não encontrado');
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
      console.log('🔄 BudgetService.createBudget - Dados originais:', data);
      
      const mappedData = this.mapCreateData(data);
      console.log('📤 Dados a serem enviados:', mappedData);
      
      const response = await apiService.createBudget(mappedData);
      console.log('📡 Resposta da criação:', response);
      
      if (response.success && response.data) {
        const mappedBudget = this.mapBudget(response.data);
        console.log('✅ Orçamento criado e mapeado:', mappedBudget);
        
        return {
          success: true,
          data: mappedBudget,
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
      console.log('🔄 BudgetService.updateBudget - ID:', id, 'Dados:', data);
      
      const response = await apiService.updateBudget(id, data);
      console.log('📡 Resposta da atualização:', response);
      
      if (response.success && response.data) {
        const mappedBudget = this.mapBudget(response.data);
        console.log('✅ Orçamento atualizado e mapeado:', mappedBudget);
        
        return {
          success: true,
          data: mappedBudget,
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
      console.log('🗑️ BudgetService.deleteBudget - ID:', id);
      
      const response = await apiService.deleteBudget(id);
      console.log('📡 Resposta da exclusão:', response);
      
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
      console.log('💰 BudgetService.adjustBudgetLimit - ID:', id, 'Novo limite:', newLimit);
      
      const updateData: UpdateBudgetData = { 
        monthlyLimit: newLimit
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
      console.log('🏠 BudgetService.getCurrentBudgets - Limite:', limit);
      
      const response = await apiService.getCurrentBudgets(limit);
      console.log('📡 Resposta getCurrentBudgets:', response);
      
      if (response.success && response.data) {
        const mappedBudgets = Array.isArray(response.data) ? 
          response.data.map(b => this.mapBudget(b)) : [];
        
        console.log('✅ Orçamentos atuais mapeados:', mappedBudgets.length);
        return mappedBudgets;
      }
      
      console.log('⚠️ Nenhum orçamento atual encontrado');
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

      console.log('📊 BudgetService.getBudgetSummary - Filtros:', filters);

      const response = await this.getBudgets(1, 100, filters);
      
      if (response.success && response.data) {
        const budgets = response.data;
        
        const summary = {
          totalBudgets: budgets.length,
          totalLimit: budgets.reduce((sum, b) => sum + (b.monthlyLimit || 0), 0),
          totalSpent: budgets.reduce((sum, b) => sum + (b.spent || 0), 0),
          overBudgetCount: budgets.filter(b => b.isOverBudget).length,
          budgets: budgets.slice(0, 5) // Top 5 para resumo
        };
        
        console.log('📊 Resumo calculado:', summary);
        return summary;
      }
      
      console.log('⚠️ Falha ao obter resumo, retornando dados zerados');
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
      console.log('🔄 BudgetService.toggleBudgetStatus - ID:', id, 'isActive:', isActive);
      
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