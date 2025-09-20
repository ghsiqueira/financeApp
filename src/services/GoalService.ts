// src/services/GoalService.ts - VERSÃO COMPLETAMENTE CORRIGIDA
import apiService from './api';
import { Goal, CreateGoalData, ApiResponse } from '../types';

// Interface para update que inclui campos adicionais
export interface UpdateGoalData extends Partial<CreateGoalData> {
  currentAmount?: number;
  status?: 'active' | 'completed' | 'paused';
}

export interface GoalFilters {
  category?: string;
  isCompleted?: boolean;
  status?: 'active' | 'completed' | 'paused';
  dateFrom?: string;
  dateTo?: string;
  page?: number;
  limit?: number;
}

// Interface GoalsResponse corrigida com data como array
export interface GoalsResponse extends ApiResponse<Goal[]> {
  success: boolean;
  data: Goal[];
  pagination: {
    current: number;
    pages: number;
    total: number;
  };
  message?: string;
}

// Interface para resposta individual
export interface GoalResponse extends ApiResponse<Goal> {
  success: boolean;
  data?: Goal;
  message?: string;
}

export class GoalService {
  private static readonly BASE_PATH = '/goals';

  /**
   * Mapear Goal da API para compatibilidade
   */
  private static mapGoal(apiGoal: any): Goal {
    return {
      ...apiGoal,
      id: apiGoal._id || apiGoal.id,
      _id: apiGoal._id || apiGoal.id,
      name: apiGoal.title || apiGoal.name,
      title: apiGoal.title || apiGoal.name,
      targetDate: apiGoal.endDate || apiGoal.targetDate,
      endDate: apiGoal.endDate || apiGoal.targetDate,
      category: apiGoal.category || '',
      monthlyTarget: apiGoal.monthlyTarget || 0,
      status: apiGoal.status || 'active',
      progress: apiGoal.progress || 0,
      daysRemaining: apiGoal.daysRemaining || 0,
      monthlyTargetRemaining: apiGoal.monthlyTargetRemaining || 0,
      createdAt: apiGoal.createdAt || new Date().toISOString(),
      updatedAt: apiGoal.updatedAt || new Date().toISOString(),
      userId: apiGoal.userId || '',
      description: apiGoal.description || '',
      targetAmount: apiGoal.targetAmount || 0,
      currentAmount: apiGoal.currentAmount || 0,
      startDate: apiGoal.startDate || new Date().toISOString(),
    };
  }

  /**
   * Mapear dados de criação para API
   */
  private static mapCreateData(data: CreateGoalData): any {
    return {
      title: data.title,
      description: data.description || '',
      targetAmount: data.targetAmount,
      currentAmount: data.currentAmount || 0,
      startDate: data.startDate || new Date().toISOString(),
      endDate: data.targetDate || data.endDate,
      category: data.category || '',
    };
  }

  /**
   * Buscar todas as metas do usuário - CORRIGIDO PARA USAR APISERVICE CORRETO
   */
  static async getGoals(
    page: number = 1,
    limit: number = 20,
    filters: GoalFilters = {}
  ): Promise<GoalsResponse> {
    try {
      console.log('🔍 GoalService.getGoals: Iniciando busca...');
      console.log('🔍 Parâmetros:', { page, limit, filters });

      // Usar o método específico do apiService
      const response = await apiService.getGoals(page, limit, filters);
      
      console.log('📥 Resposta do backend:', response);

      if (response.success && response.data) {
        // O response.data pode ter diferentes estruturas dependendo da API
        // Vamos acessar de forma segura usando notação de colchetes
        const responseData = response.data as any;
        const goalsData = responseData.goals || responseData.data || responseData;
        const paginationData = responseData.pagination || { current: 1, pages: 1, total: 0 };
        
        console.log('📊 Dados extraídos:');
        console.log('  - goalsData:', goalsData);
        console.log('  - goalsData.length:', goalsData?.length);
        console.log('  - paginationData:', paginationData);

        // Mapear cada meta para o formato esperado
        const mappedGoals = Array.isArray(goalsData) ? 
          goalsData.map((g: any) => this.mapGoal(g)) : [];

        console.log('✅ Metas mapeadas:', mappedGoals.length);
        console.log('🎯 Primeira meta mapeada:', mappedGoals[0]);

        return {
          success: true,
          data: mappedGoals,
          pagination: paginationData,
        };
      }
      
      console.log('❌ Resposta não successful');
      return {
        success: false,
        data: [],
        pagination: { current: 1, pages: 1, total: 0 },
        message: response.message || 'Erro ao carregar metas'
      };
    } catch (error: any) {
      console.error('💥 GoalService.getGoals: Erro capturado:', error);
      console.error('💥 Error message:', error.message);
      console.error('💥 Error stack:', error.stack);
      
      return {
        success: false,
        data: [],
        pagination: { current: 1, pages: 1, total: 0 },
        message: error.message || 'Erro ao carregar metas'
      };
    }
  }

  /**
   * Buscar meta por ID - CORRIGIDO para tratar resposta da API corretamente
   */
  static async getGoal(id: string): Promise<GoalResponse> {
    try {
      console.log('🔍 GoalService.getGoal: Buscando meta:', id);
      
      const response = await apiService.getGoal(id);
      
      console.log('📥 Resposta getGoal completa:', JSON.stringify(response, null, 2));

      if (response.success && response.data) {
        // Baseado no log: {"data": {"goal": {...}, "success": true}, "message": "Sucesso", "success": true}
        // Precisamos extrair o goal da estrutura aninhada
        let goalData = response.data;
        
        // Se a resposta tem a estrutura { data: { goal: {...} } }
        if (goalData && goalData.goal) {
          goalData = goalData.goal;
        }
        
        console.log('🎯 Goal extraído:', goalData);
        
        const mappedGoal = this.mapGoal(goalData);
        console.log('🎯 Goal mapeado:', mappedGoal);
        
        return {
          success: true,
          data: mappedGoal,
        };
      }
      
      return {
        success: false,
        message: response.message || 'Meta não encontrada'
      };
    } catch (error: any) {
      console.error('❌ Erro ao buscar meta:', error);
      return {
        success: false,
        message: error.message || 'Erro ao carregar meta'
      };
    }
  }

  /**
   * Criar nova meta
   */
  static async createGoal(data: CreateGoalData): Promise<GoalResponse> {
    try {
      console.log('➕ GoalService.createGoal:', data);
      
      const mappedData = this.mapCreateData(data);
      console.log('📤 Dados mapeados para envio:', mappedData);
      
      const response = await apiService.createGoal(mappedData);
      
      console.log('📥 Resposta createGoal:', response);

      if (response.success && response.data) {
        // Extrair goal se estiver aninhado
        let goalData = response.data;
        if (goalData && goalData.goal) {
          goalData = goalData.goal;
        }
        
        return {
          success: true,
          data: this.mapGoal(goalData),
        };
      }
      
      return {
        success: false,
        message: response.message || 'Erro ao criar meta'
      };
    } catch (error: any) {
      console.error('❌ Erro ao criar meta:', error);
      return {
        success: false,
        message: error.message || 'Erro ao criar meta'
      };
    }
  }

  /**
   * Atualizar meta
   */
  static async updateGoal(id: string, data: UpdateGoalData): Promise<GoalResponse> {
    try {
      console.log('✏️ GoalService.updateGoal:', { id, data });
      
      const response = await apiService.updateGoal(id, data);
      
      console.log('📥 Resposta updateGoal:', response);

      if (response.success && response.data) {
        // Extrair goal se estiver aninhado
        let goalData = response.data;
        if (goalData && goalData.goal) {
          goalData = goalData.goal;
        }
        
        return {
          success: true,
          data: this.mapGoal(goalData),
        };
      }
      
      return {
        success: false,
        message: response.message || 'Erro ao atualizar meta'
      };
    } catch (error: any) {
      console.error('❌ Erro ao atualizar meta:', error);
      return {
        success: false,
        message: error.message || 'Erro ao atualizar meta'
      };
    }
  }

  /**
   * Deletar meta
   */
  static async deleteGoal(id: string): Promise<{ success: boolean; message?: string }> {
    try {
      console.log('🗑️ GoalService.deleteGoal:', id);
      
      const response = await apiService.deleteGoal(id);
      
      console.log('📥 Resposta deleteGoal:', response);

      return {
        success: response.success,
        message: response.message || 'Meta deletada com sucesso'
      };
    } catch (error: any) {
      console.error('❌ Erro ao deletar meta:', error);
      return {
        success: false,
        message: error.message || 'Erro ao deletar meta'
      };
    }
  }

  /**
   * Buscar metas ativas (método para HomeScreen)
   */
  static async getActiveGoals(limit: number = 5): Promise<Goal[]> {
    try {
      console.log('🔍 GoalService.getActiveGoals:', limit);
      
      const response = await apiService.getActiveGoals(limit);
      
      console.log('📥 Resposta getActiveGoals:', response);

      if (response.success && response.data) {
        return Array.isArray(response.data) ? 
          response.data.map((g: any) => this.mapGoal(g)) : [];
      }
      
      return [];
    } catch (error: any) {
      console.error('❌ Erro ao buscar metas ativas:', error);
      return [];
    }
  }

  /**
   * Adicionar valor à meta - CORRIGIDO
   */
  static async addToGoal(id: string, amount: number): Promise<GoalResponse> {
    try {
      console.log('💰 GoalService.addToGoal:', { id, amount });
      
      // VALIDAÇÃO CRÍTICA: Verificar se ID não é undefined
      if (!id || id === 'undefined' || id === 'null') {
        console.error('❌ ID da meta é inválido:', id);
        return {
          success: false,
          message: 'ID da meta é obrigatório e deve ser válido'
        };
      }

      if (!amount || amount <= 0) {
        return {
          success: false,
          message: 'Valor deve ser maior que zero'
        };
      }

      // PRIMEIRO: Buscar a meta atual para obter currentAmount
      console.log('🔍 Buscando meta atual para somar valor...');
      const currentGoalResponse = await this.getGoal(id);
      
      if (!currentGoalResponse.success || !currentGoalResponse.data) {
        return {
          success: false,
          message: 'Erro ao buscar meta atual'
        };
      }

      const currentGoal = currentGoalResponse.data;
      const newCurrentAmount = currentGoal.currentAmount + amount;
      
      console.log('💰 Valores:', {
        currentAmount: currentGoal.currentAmount,
        addingAmount: amount,
        newCurrentAmount: newCurrentAmount,
        targetAmount: currentGoal.targetAmount
      });

      // SEGUNDO: Atualizar a meta com o novo valor
      const updateData: UpdateGoalData = {
        currentAmount: newCurrentAmount
      };

      // Se atingir 100% da meta, marcar como completed
      if (newCurrentAmount >= currentGoal.targetAmount) {
        updateData.status = 'completed';
        console.log('🎉 Meta atingiu 100%! Marcando como completed');
      }
      
      console.log('📤 Atualizando meta com:', updateData);
      const response = await this.updateGoal(id, updateData);
      
      console.log('📥 Resposta addToGoal (via update):', response);

      if (response.success && response.data) {
        return {
          success: true,
          data: response.data,
          message: newCurrentAmount >= currentGoal.targetAmount ? 
            'Parabéns! Meta concluída!' : 
            'Valor adicionado com sucesso!'
        };
      }
      
      return {
        success: false,
        message: response.message || 'Erro ao adicionar valor à meta'
      };
    } catch (error: any) {
      console.error('❌ Erro ao adicionar valor à meta:', error);
      console.error('❌ Error details:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status
      });
      
      return {
        success: false,
        message: error.response?.data?.message || error.message || 'Erro ao adicionar valor à meta'
      };
    }
  }

  /**
   * Pausar meta
   */
  static async pauseGoal(id: string): Promise<GoalResponse> {
    try {
      console.log('⏸️ GoalService.pauseGoal:', id);
      
      const updateData: UpdateGoalData = { status: 'paused' };
      return await this.updateGoal(id, updateData);
    } catch (error: any) {
      console.error('❌ Erro ao pausar meta:', error);
      return {
        success: false,
        message: error.message || 'Erro ao pausar meta'
      };
    }
  }

  /**
   * Reativar meta
   */
  static async resumeGoal(id: string): Promise<GoalResponse> {
    try {
      console.log('▶️ GoalService.resumeGoal:', id);
      
      const updateData: UpdateGoalData = { status: 'active' };
      return await this.updateGoal(id, updateData);
    } catch (error: any) {
      console.error('❌ Erro ao reativar meta:', error);
      return {
        success: false,
        message: error.message || 'Erro ao reativar meta'
      };
    }
  }

  /**
   * Completar meta
   */
  static async completeGoal(id: string): Promise<GoalResponse> {
    try {
      console.log('✅ GoalService.completeGoal:', id);
      
      const updateData: UpdateGoalData = { status: 'completed' };
      return await this.updateGoal(id, updateData);
    } catch (error: any) {
      console.error('❌ Erro ao completar meta:', error);
      return {
        success: false,
        message: error.message || 'Erro ao completar meta'
      };
    }
  }
}