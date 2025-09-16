// src/services/GoalService.ts - CÓDIGO COMPLETO
import apiService from './api';
import { Goal as TypesGoal, CreateGoalData as TypesCreateGoalData, GoalStats } from '../types';

// Usar tipos do arquivo types/index.ts para compatibilidade
export type Goal = TypesGoal;
export type CreateGoalData = TypesCreateGoalData;

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

export class GoalService {
  private static readonly BASE_PATH = '/goals';

  /**
   * Mapear Goal da API para compatibilidade (se necessário)
   */
  private static mapGoal(apiGoal: TypesGoal): Goal {
    return apiGoal;
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
      const status = filters.isCompleted ? 'completed' : 'active';
      const response = await apiService.getGoals(status, page, limit);
      
      const goalsData = response.data || [];
      
      return {
        success: true,
        data: Array.isArray(goalsData) ? goalsData.map(this.mapGoal) : [],
        pagination: response.pagination || { current: 1, pages: 1, total: 0 }
      };
    } catch (error) {
      console.error('Erro ao buscar metas:', error);
      return {
        success: false,
        data: [],
        pagination: { current: 1, pages: 1, total: 0 },
        message: error instanceof Error ? error.message : 'Erro ao buscar metas'
      };
    }
  }

  /**
   * Buscar uma meta específica
   */
  static async getGoalById(id: string): Promise<Goal> {
    try {
      const response = await apiService.getGoal(id);
      
      if (!response.data) {
        throw new Error('Meta não encontrada');
      }
      
      return this.mapGoal(response.data);
    } catch (error) {
      console.error('Erro ao buscar meta:', error);
      throw error;
    }
  }

  /**
   * Criar nova meta
   */
  static async createGoal(goalData: CreateGoalData): Promise<Goal> {
    try {
      const response = await apiService.createGoal(goalData);
      
      if (!response.data) {
        throw new Error('Erro ao criar meta');
      }
      
      return this.mapGoal(response.data);
    } catch (error) {
      console.error('Erro ao criar meta:', error);
      throw error;
    }
  }

  /**
   * Atualizar meta existente
   */
  static async updateGoal(id: string, goalData: UpdateGoalData): Promise<Goal> {
    try {
      const { status, currentAmount, ...apiUpdateData } = goalData;
      
      let response;
      if (status || currentAmount !== undefined) {
        response = await apiService.updateGoal(id, goalData as any);
      } else {
        response = await apiService.updateGoal(id, apiUpdateData);
      }
      
      if (!response.data) {
        throw new Error('Erro ao atualizar meta');
      }
      
      return this.mapGoal(response.data);
    } catch (error) {
      console.error('Erro ao atualizar meta:', error);
      throw error;
    }
  }

  /**
   * Deletar meta
   */
  static async deleteGoal(id: string): Promise<void> {
    try {
      await apiService.deleteGoal(id);
    } catch (error) {
      console.error('Erro ao deletar meta:', error);
      throw error;
    }
  }

  /**
   * Adicionar valor à meta
   */
  static async addToGoal(id: string, amount: number): Promise<Goal> {
    try {
      const response = await apiService.addAmountToGoal(id, amount);
      
      if (!response.data) {
        throw new Error('Erro ao adicionar valor à meta');
      }
      
      return this.mapGoal(response.data);
    } catch (error) {
      console.error('Erro ao adicionar valor à meta:', error);
      throw error;
    }
  }

  /**
   * Obter estatísticas das metas
   */
  static async getGoalStats(): Promise<GoalStats> {
    try {
      const response = await apiService.getGoalStats();
      
      if (!response.data) {
        return {
          active: { count: 0, totalTarget: 0, totalCurrent: 0 },
          completed: { count: 0, totalTarget: 0, totalCurrent: 0 },
          paused: { count: 0, totalTarget: 0, totalCurrent: 0 },
          total: { count: 0, totalTarget: 0, totalCurrent: 0, progress: 0 }
        };
      }
      
      return response.data;
    } catch (error) {
      console.error('Erro ao buscar estatísticas das metas:', error);
      throw error;
    }
  }

  /**
   * Pausar meta
   */
  static async pauseGoal(id: string): Promise<Goal> {
    try {
      const response = await apiService.updateGoal(id, { status: 'paused' } as any);
      
      if (!response.data) {
        throw new Error('Erro ao pausar meta');
      }
      
      return this.mapGoal(response.data);
    } catch (error) {
      console.error('Erro ao pausar meta:', error);
      throw error;
    }
  }

  /**
   * Retomar meta
   */
  static async resumeGoal(id: string): Promise<Goal> {
    try {
      const response = await apiService.updateGoal(id, { status: 'active' } as any);
      
      if (!response.data) {
        throw new Error('Erro ao retomar meta');
      }
      
      return this.mapGoal(response.data);
    } catch (error) {
      console.error('Erro ao retomar meta:', error);
      throw error;
    }
  }

  /**
   * Marcar meta como concluída
   */
  static async completeGoal(id: string): Promise<Goal> {
    try {
      const response = await apiService.updateGoal(id, { status: 'completed' } as any);
      
      if (!response.data) {
        throw new Error('Erro ao concluir meta');
      }
      
      return this.mapGoal(response.data);
    } catch (error) {
      console.error('Erro ao concluir meta:', error);
      throw error;
    }
  }

  /**
   * Obter metas ativas (método auxiliar para HomeScreen)
   */
  static async getActiveGoals(limit: number = 10): Promise<Goal[]> {
    try {
      const response = await this.getGoals(1, limit, { status: 'active' });
      return response.data;
    } catch (error) {
      console.error('Erro ao buscar metas ativas:', error);
      return [];
    }
  }

  /**
   * Obter metas recentes (método auxiliar)
   */
  static async getRecentGoals(limit: number = 5): Promise<Goal[]> {
    try {
      const response = await this.getGoals(1, limit);
      return response.data;
    } catch (error) {
      console.error('Erro ao buscar metas recentes:', error);
      return [];
    }
  }

  /**
   * Obter metas por status
   */
  static async getGoalsByStatus(status: 'active' | 'completed' | 'paused', limit: number = 20): Promise<Goal[]> {
    try {
      const response = await this.getGoals(1, limit, { status });
      return response.data;
    } catch (error) {
      console.error(`Erro ao buscar metas ${status}:`, error);
      return [];
    }
  }
}