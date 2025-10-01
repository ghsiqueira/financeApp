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
   * Buscar todas as metas do usuário
   */
  static async getGoals(
    page: number = 1,
    limit: number = 20,
    filters: GoalFilters = {}
  ): Promise<GoalsResponse> {
    try {
      console.log('🔍 GoalService.getGoals: Iniciando busca...');
      console.log('🔍 Parâmetros:', { page, limit, filters });

      const response = await apiService.getGoals(page, limit, filters);
      
      console.log('📥 Resposta do backend:', response);

      if (response.success && response.data) {
        const responseData = response.data as any;
        const goalsData = responseData.goals || responseData.data || responseData;
        const paginationData = responseData.pagination || { current: 1, pages: 1, total: 0 };
        
        console.log('📊 Dados extraídos:');
        console.log('  - goalsData:', goalsData);
        console.log('  - goalsData.length:', goalsData?.length);
        console.log('  - paginationData:', paginationData);

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
   * Buscar meta por ID
   */
  static async getGoal(id: string): Promise<GoalResponse> {
    try {
      console.log('🔍 GoalService.getGoal: Buscando meta:', id);
      
      const response = await apiService.getGoal(id);
      
      console.log('📥 Resposta getGoal completa:', JSON.stringify(response, null, 2));

      if (response.success && response.data) {
        let goalData: any = response.data;
        
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
        let goalData: any = response.data;
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
        let goalData: any = response.data;
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
   * Buscar metas ativas
   */
  static async getActiveGoals(limit: number = 5): Promise<Goal[]> {
    try {
      console.log('🔍 GoalService.getActiveGoals:', limit);
      
      const response = await apiService.getActiveGoals(limit);
      
      console.log('📥 Resposta getActiveGoals:', JSON.stringify(response, null, 2));

      if (response.success && response.data) {
        // A estrutura pode ser response.data.data (aninhada)
        let goalsData = response.data as any;
        
        // Se tiver response.data.data, usar esse nível
        if (goalsData.data && Array.isArray(goalsData.data)) {
          console.log('✅ Encontrado array aninhado em response.data.data');
          goalsData = goalsData.data;
        }
        
        console.log('📊 Goals data extraído:', goalsData);
        console.log('📊 É array?', Array.isArray(goalsData));
        console.log('📊 Length:', goalsData?.length);
        
        if (Array.isArray(goalsData)) {
          const mappedGoals = goalsData.map((g: any) => this.mapGoal(g));
          console.log('✅ Metas ativas mapeadas:', mappedGoals.length);
          return mappedGoals;
        }
      }
      
      console.log('⚠️ Nenhuma meta ativa encontrada');
      return [];
    } catch (error: any) {
      console.error('❌ Erro ao buscar metas ativas:', error);
      return [];
    }
  }

  /**
   * Adicionar valor à meta
   */
  static async addToGoal(id: string, amount: number): Promise<GoalResponse> {
    try {
      console.log('💰 GoalService.addToGoal:', { id, amount });
      
      const response = await apiService.addToGoal(id, amount);
      
      console.log('📥 Resposta addToGoal:', response);

      if (response.success && response.data) {
        let goalData: any = response.data;
        if (goalData && goalData.goal) {
          goalData = goalData.goal;
        }
        
        return {
          success: true,
          data: this.mapGoal(goalData),
          message: response.message || 'Valor adicionado com sucesso'
        };
      }
      
      return {
        success: false,
        message: response.message || 'Erro ao adicionar valor'
      };
    } catch (error: any) {
      console.error('❌ Erro ao adicionar valor:', error);
      return {
        success: false,
        message: error.message || 'Erro ao adicionar valor'
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