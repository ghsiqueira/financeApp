// src/services/GoalShareService.ts
import apiService from './api';
import { ServiceResponse } from '../types';

export interface GoalShare {
  _id: string;
  goal: {
    _id: string;
    title: string;
    targetAmount: number;
    currentAmount: number;
    targetDate: string;
  };
  owner: {
    _id: string;
    name: string;
    email: string;
  };
  sharedWith: {
    _id: string;
    name: string;
    email: string;
  };
  role: 'viewer' | 'contributor' | 'co-owner';
  status: 'pending' | 'accepted' | 'rejected';
  permissions: {
    canAddAmount: boolean;
    canEdit: boolean;
    canDelete: boolean;
    canInviteOthers: boolean;
  };
  contribution: number;
  inviteToken?: string;
  createdAt: string;
  acceptedAt?: string;
}

export class GoalShareService {
  /**
   * Compartilhar meta com outro usuário
   */
  async shareGoal(
    goalId: string,
    email: string,
    role: 'viewer' | 'contributor' | 'co-owner' = 'contributor'
  ): Promise<ServiceResponse<GoalShare>> {
    try {
      const response = await apiService.getApiInstance().post(`/goals/${goalId}/share`, {
        email,
        role,
      });

      return {
        success: true,
        data: response.data.data || response.data,
        message: response.data.message || 'Convite enviado com sucesso',
      };
    } catch (error: any) {
      return {
        success: false,
        message: error.response?.data?.message || error.message || 'Erro ao compartilhar meta',
      };
    }
  }

  /**
   * Buscar compartilhamentos de uma meta
   */
  async getGoalShares(goalId: string): Promise<ServiceResponse<GoalShare[]>> {
    try {
      const response = await apiService.getApiInstance().get(`/goals/${goalId}/shares`);

      return {
        success: true,
        data: response.data.data || response.data || [],
      };
    } catch (error: any) {
      return {
        success: false,
        data: [],
        message: error.response?.data?.message || error.message || 'Erro ao buscar compartilhamentos',
      };
    }
  }

  /**
   * Buscar convites pendentes do usuário
   */
  async getPendingInvites(): Promise<ServiceResponse<GoalShare[]>> {
    try {
      const response = await apiService.getApiInstance().get('/goal-shares/pending');

      return {
        success: true,
        data: response.data.data || response.data || [],
      };
    } catch (error: any) {
      return {
        success: false,
        data: [],
        message: error.response?.data?.message || error.message || 'Erro ao buscar convites',
      };
    }
  }

  /**
   * Buscar metas compartilhadas com o usuário (aceitas)
   */
  async getSharedGoals(): Promise<ServiceResponse<GoalShare[]>> {
    try {
      const response = await apiService.getApiInstance().get('/goal-shares/accepted');

      return {
        success: true,
        data: response.data.data || response.data || [],
      };
    } catch (error: any) {
      return {
        success: false,
        data: [],
        message: error.response?.data?.message || error.message || 'Erro ao buscar metas compartilhadas',
      };
    }
  }

  /**
   * Aceitar convite de compartilhamento
   */
  async acceptInvite(shareId: string): Promise<ServiceResponse<GoalShare>> {
    try {
      const response = await apiService.getApiInstance().post(`/goal-shares/${shareId}/accept`);

      return {
        success: true,
        data: response.data.data || response.data,
        message: response.data.message || 'Convite aceito com sucesso',
      };
    } catch (error: any) {
      return {
        success: false,
        message: error.response?.data?.message || error.message || 'Erro ao aceitar convite',
      };
    }
  }

  /**
   * Rejeitar convite de compartilhamento
   */
  async rejectInvite(shareId: string): Promise<ServiceResponse<void>> {
    try {
      const response = await apiService.getApiInstance().post(`/goal-shares/${shareId}/reject`);

      return {
        success: true,
        message: response.data.message || 'Convite rejeitado',
      };
    } catch (error: any) {
      return {
        success: false,
        message: error.response?.data?.message || error.message || 'Erro ao rejeitar convite',
      };
    }
  }

  /**
   * Remover compartilhamento
   */
  async removeShare(shareId: string): Promise<ServiceResponse<void>> {
    try {
      const response = await apiService.getApiInstance().delete(`/goal-shares/${shareId}`);

      return {
        success: true,
        message: response.data.message || 'Compartilhamento removido',
      };
    } catch (error: any) {
      return {
        success: false,
        message: error.response?.data?.message || error.message || 'Erro ao remover compartilhamento',
      };
    }
  }

  /**
   * Atualizar role de um compartilhamento
   */
  async updateRole(
    shareId: string,
    role: 'viewer' | 'contributor' | 'co-owner'
  ): Promise<ServiceResponse<GoalShare>> {
    try {
      const response = await apiService.getApiInstance().patch(`/goal-shares/${shareId}/role`, {
        role,
      });

      return {
        success: true,
        data: response.data.data || response.data,
        message: response.data.message || 'Permissão atualizada',
      };
    } catch (error: any) {
      return {
        success: false,
        message: error.response?.data?.message || error.message || 'Erro ao atualizar permissão',
      };
    }
  }

  /**
   * Verificar permissões do usuário em uma meta
   */
  async getUserPermissions(goalId: string): Promise<ServiceResponse<{
    isOwner: boolean;
    role?: 'viewer' | 'contributor' | 'co-owner' | 'owner';
    permissions?: {
      canAddAmount: boolean;
      canEdit: boolean;
      canDelete: boolean;
      canInviteOthers: boolean;
    };
  }>> {
    try {
      const response = await apiService.getApiInstance().get(`/goals/${goalId}/permissions`);

      return {
        success: true,
        data: response.data.data || response.data,
      };
    } catch (error: any) {
      return {
        success: false,
        message: error.response?.data?.message || error.message || 'Erro ao verificar permissões',
      };
    }
  }
}