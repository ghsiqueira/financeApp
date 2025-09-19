// src/services/GoalService.ts - VERSÃO LIMPA E FUNCIONAL
import apiService from './api';
import { Goal, CreateGoalData, ApiResponse } from '../types';
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
    return safeApiCall(
      async () => {
        const status = filters.isCompleted ? 'completed' : filters.status;
        const response = await apiService.getGoals(status, page, limit);
        const goalsData = response.data || [];
        
        return {
          success: true,
          data: Array.isArray(goalsData) ? 
            goalsData.map(goal => this.mapGoal(goal)) : [],
          pagination: response.pagination || {
            current: page,
            pages: 1,
            total: Array.isArray(goalsData) ? goalsData.length : 0,
          },
        };
      },
      {
        success: true,
        data: (getMockData('goals') as any[]).map(goal => this.mapGoal(goal)),
        pagination: { current: 1, pages: 1, total: 0 },
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
        return {
          success: true,
          data: response.data ? this.mapGoal(response.data) : undefined,
        };
      },
      {
        success: true,
        data: this.mapGoal((getMockData('goals') as any[])[0]),
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
        return {
          success: true,
          data: response.data ? this.mapGoal(response.data) : undefined,
        };
      },
      {
        success: true,
        data: this.mapGoal({
          _id: Date.now().toString(),
          ...this.mapCreateData(data),
          status: 'active',
          progress: 0,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }),
      }
    );
  }

  /**
   * Atualizar meta
   */
  static async updateGoal(id: string, data: UpdateGoalData): Promise<Goal> {
    return safeApiCall(
      async () => {
        const response = await apiService.updateGoal(id, data);
        return this.mapGoal(response.data);
      },
      this.mapGoal({
        _id: id,
        ...data,
        updatedAt: new Date().toISOString(),
      })
    );
  }

  /**
   * Deletar meta
   */
  static async deleteGoal(id: string): Promise<void> {
    return safeApiCall(
      async () => {
        await apiService.deleteGoal(id);
      },
      undefined
    );
  }

  /**
   * Adicionar valor à meta
   */
  static async addToGoal(id: string, amount: number): Promise<Goal> {
    return safeApiCall(
      async () => {
        const updateData: UpdateGoalData = { currentAmount: amount };
        const response = await apiService.updateGoal(id, updateData);
        return this.mapGoal(response.data);
      },
      this.mapGoal({
        _id: id,
        currentAmount: amount,
        updatedAt: new Date().toISOString(),
      })
    );
  }

  /**
   * Pausar meta
   */
  static async pauseGoal(id: string): Promise<Goal> {
    return safeApiCall(
      async () => {
        const updateData: UpdateGoalData = { status: 'paused' };
        const response = await apiService.updateGoal(id, updateData);
        return this.mapGoal(response.data);
      },
      this.mapGoal({
        _id: id,
        status: 'paused',
        updatedAt: new Date().toISOString(),
      })
    );
  }

  /**
   * Retomar meta
   */
  static async resumeGoal(id: string): Promise<Goal> {
    return safeApiCall(
      async () => {
        const updateData: UpdateGoalData = { status: 'active' };
        const response = await apiService.updateGoal(id, updateData);
        return this.mapGoal(response.data);
      },
      this.mapGoal({
        _id: id,
        status: 'active',
        updatedAt: new Date().toISOString(),
      })
    );
  }

  /**
   * Buscar metas ativas (quantidade limitada)
   */
  static async getActiveGoals(limit: number = 5): Promise<Goal[]> {
    return safeApiCall(
      async () => {
        const response = await apiService.getGoals('active', 1, limit);
        const goalsData = response.data || [];
        return Array.isArray(goalsData) ? 
          goalsData.map(goal => this.mapGoal(goal)) : [];
      },
      (getMockData('goals') as any[]).slice(0, limit).map(goal => this.mapGoal(goal))
    );
  }

  /**
   * Buscar estatísticas das metas
   */
  static async getGoalStats(): Promise<any> {
    return safeApiCall(
      async () => {
        const response = await apiService.getGoalStats();
        return response.data;
      },
      {
        active: { count: 2, totalTarget: 50000, totalCurrent: 25000 },
        completed: { count: 1, totalTarget: 10000, totalCurrent: 10000 },
        paused: { count: 0, totalTarget: 0, totalCurrent: 0 },
        total: { count: 3, totalTarget: 60000, totalCurrent: 35000, progress: 58.33 },
      }
    );
  }
}