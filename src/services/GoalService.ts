// src/services/GoalService.ts - VERSÃO COMPLETA ATUALIZADA
import apiService from './api';
import { Goal, CreateGoalData } from '../types';
import { safeApiCall, getMockData } from '../utils/apiUtils';

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

// Interface GoalsResponse com propriedade success
export interface GoalsResponse {
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
export interface GoalResponse {
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
    return safeApiCall(
      async () => {
        const status = filters.isCompleted ? 'completed' : filters.status;
        const response = await apiService.getGoals(status, page, limit);
        
        const goalsData = response.data || [];
        
        return {
          success: true,
          data: Array.isArray(goalsData) ? goalsData.map(this.mapGoal) : [],
          pagination: response.pagination || { current: 1, pages: 1, total: 0 }
        };
      },
      // Fallback com dados mockados
      {
        success: true,
        data: getMockData().goals,
        pagination: { current: 1, pages: 1, total: 2 }
      }
    );
  }

  /**
   * Buscar meta por ID
   */
  static async getGoal(id: string): Promise<GoalResponse> {
    return safeApiCall(
      async () => {
        const response = await apiService.getGoal(id);
        
        if (response.success && response.data) {
          return {
            success: true,
            data: this.mapGoal(response.data)
          };
        } else {
          return {
            success: false,
            message: response.message || 'Meta não encontrada'
          };
        }
      },
      // Fallback
      {
        success: true,
        data: getMockData().goals[0]
      }
    );
  }

  /**
   * Criar nova meta
   */
  static async createGoal(data: CreateGoalData): Promise<GoalResponse> {
    return safeApiCall(
      async () => {
        const mappedData = this.mapCreateData(data);
        const response = await apiService.createGoal(mappedData);
        
        if (response.success && response.data) {
          return {
            success: true,
            data: this.mapGoal(response.data)
          };
        } else {
          return {
            success: false,
            message: response.message || 'Erro ao criar meta'
          };
        }
      },
      // Fallback
      {
        success: true,
        data: {
          ...getMockData().goals[0],
          ...data,
          id: 'temp-' + Date.now(),
          _id: 'temp-' + Date.now(),
        }
      }
    );
  }

  /**
   * Atualizar meta existente
   */
  static async updateGoal(id: string, data: UpdateGoalData): Promise<GoalResponse> {
    return safeApiCall(
      async () => {
        const mappedData = this.mapCreateData(data as CreateGoalData);
        const response = await apiService.updateGoal(id, mappedData);
        
        if (response.success && response.data) {
          return {
            success: true,
            data: this.mapGoal(response.data)
          };
        } else {
          return {
            success: false,
            message: response.message || 'Erro ao atualizar meta'
          };
        }
      },
      // Fallback
      {
        success: true,
        data: {
          ...getMockData().goals[0],
          ...data,
          id,
          _id: id,
        }
      }
    );
  }

  /**
   * Adicionar valor à meta
   */
  static async addAmountToGoal(id: string, amount: number): Promise<GoalResponse> {
    return safeApiCall(
      async () => {
        const response = await apiService.addAmountToGoal(id, amount);
        
        if (response.success && response.data) {
          return {
            success: true,
            data: this.mapGoal(response.data)
          };
        } else {
          return {
            success: false,
            message: response.message || 'Erro ao adicionar valor à meta'
          };
        }
      },
      // Fallback
      {
        success: true,
        data: {
          ...getMockData().goals[0],
          id,
          _id: id,
          currentAmount: (getMockData().goals[0].currentAmount || 0) + amount,
        }
      }
    );
  }

  /**
   * Deletar meta
   */
  static async deleteGoal(id: string): Promise<{ success: boolean; message?: string }> {
    return safeApiCall(
      async () => {
        const response = await apiService.deleteGoal(id);
        
        return {
          success: response.success,
          message: response.message || 'Meta deletada com sucesso'
        };
      },
      // Fallback
      {
        success: true,
        message: 'Meta deletada com sucesso (modo offline)'
      }
    );
  }

  /**
   * Buscar estatísticas das metas
   */
  static async getGoalStats() {
    return safeApiCall(
      async () => {
        const response = await apiService.getGoalStats();
        
        if (response.success) {
          return {
            success: true,
            data: response.data
          };
        } else {
          return {
            success: false,
            message: response.message || 'Erro ao buscar estatísticas'
          };
        }
      },
      // Fallback
      {
        success: true,
        data: {
          active: { count: 2, totalTarget: 65000, totalCurrent: 17000 },
          completed: { count: 0, totalTarget: 0, totalCurrent: 0 },
          paused: { count: 0, totalTarget: 0, totalCurrent: 0 },
          total: { count: 2, totalTarget: 65000, totalCurrent: 17000, progress: 26.15 }
        }
      }
    );
  }

  /**
   * Buscar metas ativas (método para HomeScreen)
   */
  static async getActiveGoals(limit: number = 5): Promise<GoalsResponse> {
    try {
      const response = await this.getGoals(1, limit, { status: 'active' });
      return response;
    } catch (error) {
      console.error('Erro ao buscar metas ativas:', error);
      return {
        success: true,
        data: getMockData().goals,
        pagination: { current: 1, pages: 1, total: 2 }
      };
    }
  }
}

// Exportar tipos
export { Goal, CreateGoalData };