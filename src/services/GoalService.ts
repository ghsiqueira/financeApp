// src/services/GoalService.ts - VERSÃO CORRIGIDA
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
      // Converter filtros para formato da API
      const apiFilters = {
        page,
        limit,
        ...filters,
        // Remover campos que não são suportados pela API
        isCompleted: undefined,
      };

      const response = await apiService.getGoals(page, limit, apiFilters);
      
      if (response.success && response.data) {
        const goalsData = response.data.data || response.data;
        const paginationData = response.data.pagination || { current: 1, pages: 1, total: 0 };
        
        return {
          success: true,
          data: Array.isArray(goalsData) ? 
            goalsData.map(g => this.mapGoal(g)) : [],
          pagination: paginationData,
        };
      }
      
      return {
        success: false,
        data: [],
        pagination: { current: 1, pages: 1, total: 0 },
        message: response.message || 'Erro ao carregar metas'
      };
    } catch (error: any) {
      console.error('❌ Erro ao buscar metas:', error);
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
      const response = await apiService.getGoal(id);
      
      if (response.success && response.data) {
        return {
          success: true,
          data: this.mapGoal(response.data),
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
      const mappedData = this.mapCreateData(data);
      const response = await apiService.createGoal(mappedData);
      
      if (response.success && response.data) {
        return {
          success: true,
          data: this.mapGoal(response.data),
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
      const response = await apiService.updateGoal(id, data);
      
      if (response.success && response.data) {
        return {
          success: true,
          data: this.mapGoal(response.data),
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
      const response = await apiService.deleteGoal(id);
      
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
      const response = await apiService.getActiveGoals(limit);
      
      if (response.success && response.data) {
        return Array.isArray(response.data) ? 
          response.data.map(g => this.mapGoal(g)) : [];
      }
      
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
      const response = await apiService.addToGoal(id, amount);
      
      if (response.success && response.data) {
        return {
          success: true,
          data: this.mapGoal(response.data),
        };
      }
      
      return {
        success: false,
        message: response.message || 'Erro ao adicionar valor à meta'
      };
    } catch (error: any) {
      console.error('❌ Erro ao adicionar valor à meta:', error);
      return {
        success: false,
        message: error.message || 'Erro ao adicionar valor à meta'
      };
    }
  }

  /**
   * Pausar meta
   */
  static async pauseGoal(id: string): Promise<GoalResponse> {
    try {
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