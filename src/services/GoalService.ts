// src/services/GoalService.ts
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_CONFIG } from '../constants';
import { 
  Goal, 
  CreateGoalData, 
  ApiResponse, 
  PaginatedResponse,
  GoalStats 
} from '../types';

class GoalServiceClass {
  private baseURL: string;

  constructor() {
    this.baseURL = API_CONFIG.BASE_URL;
  }

  // Função auxiliar para obter token
  private async getAuthToken(): Promise<string | null> {
    try {
      return await AsyncStorage.getItem('@FinanceApp:token');
    } catch (error) {
      console.error('Erro ao obter token:', error);
      return null;
    }
  }

  // Função auxiliar para fazer requisições autenticadas
  private async request<T = any>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const token = await this.getAuthToken();
    const url = `${this.baseURL}${endpoint}`;
    
    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` }),
        ...options.headers,
      },
      ...options,
    };

    // Criar AbortController para timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), API_CONFIG.TIMEOUT);
    config.signal = controller.signal;

    try {
      const response = await fetch(url, config);
      clearTimeout(timeoutId);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || `HTTP ${response.status}`);
      }

      return data;
    } catch (error: any) {
      if (error.name === 'AbortError') {
        throw new Error('Tempo limite da requisição excedido');
      }
      throw error;
    }
  }

  // Criar meta
  async createGoal(goalData: CreateGoalData): Promise<Goal> {
    try {
      const response = await this.request<{ success: boolean; goal: Goal }>('/api/goals', {
        method: 'POST',
        body: JSON.stringify(goalData),
      });

      if (!response.success) {
        throw new Error('Erro ao criar meta');
      }

      return response.goal;
    } catch (error: any) {
      throw new Error(error.message || 'Erro ao criar meta');
    }
  }

  // Listar metas
  async getGoals(filters?: { 
    status?: 'active' | 'completed' | 'paused';
    page?: number;
    limit?: number;
  }): Promise<PaginatedResponse<Goal[]>> {
    try {
      const queryParams = new URLSearchParams();
      
      if (filters) {
        Object.entries(filters).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            queryParams.append(key, String(value));
          }
        });
      }

      const endpoint = `/api/goals${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
      const response = await this.request<PaginatedResponse<Goal[]>>(endpoint);

      return response;
    } catch (error: any) {
      throw new Error(error.message || 'Erro ao carregar metas');
    }
  }

  // Obter meta por ID
  async getGoalById(id: string): Promise<Goal> {
    try {
      const response = await this.request<{ success: boolean; goal: Goal }>(`/api/goals/${id}`);

      if (!response.success) {
        throw new Error('Meta não encontrada');
      }

      return response.goal;
    } catch (error: any) {
      throw new Error(error.message || 'Erro ao carregar meta');
    }
  }

  // Atualizar meta
  async updateGoal(id: string, goalData: Partial<CreateGoalData>): Promise<Goal> {
    try {
      const response = await this.request<{ success: boolean; goal: Goal }>(`/api/goals/${id}`, {
        method: 'PUT',
        body: JSON.stringify(goalData),
      });

      if (!response.success) {
        throw new Error('Erro ao atualizar meta');
      }

      return response.goal;
    } catch (error: any) {
      throw new Error(error.message || 'Erro ao atualizar meta');
    }
  }

  // Deletar meta
  async deleteGoal(id: string): Promise<void> {
    try {
      const response = await this.request<ApiResponse>(`/api/goals/${id}`, {
        method: 'DELETE',
      });

      if (!response.success) {
        throw new Error('Erro ao deletar meta');
      }
    }
  }

  // Adicionar valor à meta
  async addToGoal(id: string, amount: number): Promise<Goal> {
    try {
      const response = await this.request<{ success: boolean; goal: Goal }>(`/api/goals/${id}/add`, {
        method: 'POST',
        body: JSON.stringify({ amount }),
      });

      if (!response.success) {
        throw new Error('Erro ao adicionar valor à meta');
      }

      return response.goal;
    } catch (error: any) {
      throw new Error(error.message || 'Erro ao adicionar valor à meta');
    }
  }

  // Remover valor da meta
  async removeFromGoal(id: string, amount: number): Promise<Goal> {
    try {
      const response = await this.request<{ success: boolean; goal: Goal }>(`/api/goals/${id}/remove`, {
        method: 'POST',
        body: JSON.stringify({ amount }),
      });

      if (!response.success) {
        throw new Error('Erro ao remover valor da meta');
      }

      return response.goal;
    } catch (error: any) {
      throw new Error(error.message || 'Erro ao remover valor da meta');
    }
  }

  // Pausar meta
  async pauseGoal(id: string): Promise<Goal> {
    try {
      const response = await this.request<{ success: boolean; goal: Goal }>(`/api/goals/${id}/pause`, {
        method: 'POST',
      });

      if (!response.success) {
        throw new Error('Erro ao pausar meta');
      }

      return response.goal;
    } catch (error: any) {
      throw new Error(error.message || 'Erro ao pausar meta');
    }
  }

  // Reativar meta
  async resumeGoal(id: string): Promise<Goal> {
    try {
      const response = await this.request<{ success: boolean; goal: Goal }>(`/api/goals/${id}/resume`, {
        method: 'POST',
      });

      if (!response.success) {
        throw new Error('Erro ao reativar meta');
      }

      return response.goal;
    } catch (error: any) {
      throw new Error(error.message || 'Erro ao reativar meta');
    }
  }

  // Marcar meta como concluída
  async completeGoal(id: string): Promise<Goal> {
    try {
      const response = await this.request<{ success: boolean; goal: Goal }>(`/api/goals/${id}/complete`, {
        method: 'POST',
      });

      if (!response.success) {
        throw new Error('Erro ao completar meta');
      }

      return response.goal;
    } catch (error: any) {
      throw new Error(error.message || 'Erro ao completar meta');
    }
  }

  // Obter metas ativas (para dashboard)
  async getActiveGoals(limit: number = 10): Promise<Goal[]> {
    try {
      const response = await this.request<{ success: boolean; goals: Goal[] }>(`/api/goals/active?limit=${limit}`);

      if (!response.success) {
        throw new Error('Erro ao carregar metas ativas');
      }

      return response.goals;
    } catch (error: any) {
      throw new Error(error.message || 'Erro ao carregar metas ativas');
    }
  }

  // Obter estatísticas das metas
  async getGoalStats(): Promise<GoalStats> {
    try {
      const response = await this.request<{ success: boolean; stats: GoalStats }>('/api/goals/stats/overview');

      if (!response.success) {
        throw new Error('Erro ao carregar estatísticas');
      }

      return response.stats;
    } catch (error: any) {
      throw new Error(error.message || 'Erro ao carregar estatísticas das metas');
    }
  }

  // Calcular projeção de meta
  async calculateGoalProjection(id: string): Promise<{
    projectedCompletionDate: string;
    monthlyTargetAdjusted: number;
    isOnTrack: boolean;
    recommendedMonthlyAmount: number;
  }> {
    try {
      const response = await this.request<{
        success: boolean;
        projection: {
          projectedCompletionDate: string;
          monthlyTargetAdjusted: number;
          isOnTrack: boolean;
          recommendedMonthlyAmount: number;
        };
      }>(`/api/goals/${id}/projection`);

      if (!response.success) {
        throw new Error('Erro ao calcular projeção');
      }

      return response.projection;
    } catch (error: any) {
      throw new Error(error.message || 'Erro ao calcular projeção da meta');
    }
  }

  // Duplicar meta
  async duplicateGoal(id: string, newTitle: string): Promise<Goal> {
    try {
      const response = await this.request<{ success: boolean; goal: Goal }>(`/api/goals/${id}/duplicate`, {
        method: 'POST',
        body: JSON.stringify({ newTitle }),
      });

      if (!response.success) {
        throw new Error('Erro ao duplicar meta');
      }

      return response.goal;
    } catch (error: any) {
      throw new Error(error.message || 'Erro ao duplicar meta');
    }
  }

  // Obter histórico de progresso da meta
  async getGoalHistory(id: string): Promise<{
    date: string;
    amount: number;
    type: 'add' | 'remove';
    description?: string;
  }[]> {
    try {
      const response = await this.request<{
        success: boolean;
        history: {
          date: string;
          amount: number;
          type: 'add' | 'remove';
          description?: string;
        }[];
      }>(`/api/goals/${id}/history`);

      if (!response.success) {
        throw new Error('Erro ao carregar histórico');
      }

      return response.history;
    } catch (error: any) {
      throw new Error(error.message || 'Erro ao carregar histórico da meta');
    }
  }

  // Exportar metas
  async exportGoals(format: 'csv' | 'excel' = 'csv'): Promise<string> {
    try {
      const response = await this.request<{ success: boolean; downloadUrl: string }>(`/api/goals/export?format=${format}`);

      if (!response.success) {
        throw new Error('Erro ao exportar metas');
      }

      return response.downloadUrl;
    } catch (error: any) {
      throw new Error(error.message || 'Erro ao exportar metas');
    }
  }

  // Verificar se meta pode ser deletada
  async canDeleteGoal(id: string): Promise<{ canDelete: boolean; reason?: string }> {
    try {
      const response = await this.request<{
        success: boolean;
        canDelete: boolean;
        reason?: string;
      }>(`/api/goals/${id}/can-delete`);

      if (!response.success) {
        throw new Error('Erro ao verificar meta');
      }

      return { canDelete: response.canDelete, reason: response.reason };
    } catch (error: any) {
      throw new Error(error.message || 'Erro ao verificar se meta pode ser deletada');
    }
  }

  // Obter metas por período
  async getGoalsByPeriod(startDate: string, endDate: string): Promise<Goal[]> {
    try {
      const response = await this.request<{ success: boolean; goals: Goal[] }>(`/api/goals/period?startDate=${startDate}&endDate=${endDate}`);

      if (!response.success) {
        throw new Error('Erro ao carregar metas do período');
      }

      return response.goals;
    } catch (error: any) {
      throw new Error(error.message || 'Erro ao carregar metas do período');
    }
  }

  // Recalcular meta baseado em novo prazo
  async recalculateGoal(id: string, newEndDate: string): Promise<{
    newMonthlyTarget: number;
    adjustedTargetAmount?: number;
  }> {
    try {
      const response = await this.request<{
        success: boolean;
        newMonthlyTarget: number;
        adjustedTargetAmount?: number;
      }>(`/api/goals/${id}/recalculate`, {
        method: 'POST',
        body: JSON.stringify({ newEndDate }),
      });

      if (!response.success) {
        throw new Error('Erro ao recalcular meta');
      }

      return {
        newMonthlyTarget: response.newMonthlyTarget,
        adjustedTargetAmount: response.adjustedTargetAmount,
      };
    } catch (error: any) {
      throw new Error(error.message || 'Erro ao recalcular meta');
    }
  }
}

export const GoalService = new GoalServiceClass();