// src/services/CategoryService.ts - CÓDIGO COMPLETO
import { API_CONFIG } from '../constants';
import { 
  Category, 
  CreateCategoryData,
  ApiResponse
} from '../types';

interface CategoryFilters {
  type?: 'income' | 'expense';
  includeDefault?: boolean;
  isActive?: boolean;
}

class CategoryServiceClass {
  private baseURL: string;

  constructor() {
    this.baseURL = API_CONFIG.BASE_URL;
  }

  // Função auxiliar para fazer requisições
  private async request<T = any>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;
    
    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    };

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

  // Obter token de autenticação
  private async getAuthToken(): Promise<string | null> {
    try {
      const AsyncStorage = require('@react-native-async-storage/async-storage').default;
      return await AsyncStorage.getItem('@FinanceApp:token');
    } catch (error) {
      return null;
    }
  }

  // Listar categorias
  async getCategories(filters?: CategoryFilters): Promise<ApiResponse<Category[]>> {
    try {
      const queryParams = new URLSearchParams();
      
      if (filters) {
        Object.entries(filters).forEach(([key, value]) => {
          if (value !== undefined && value !== null && value !== '') {
            queryParams.append(key, value.toString());
          }
        });
      }

      const endpoint = `/api/categories${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
      const response = await this.request<{ success: boolean; categories: Category[] }>(endpoint, {
        headers: {
          'Authorization': `Bearer ${await this.getAuthToken()}`,
        },
      });

      return {
        success: true,
        data: response.categories || []
      };
    } catch (error: any) {
      return {
        success: false,
        data: [],
        message: error.message || 'Erro ao carregar categorias'
      };
    }
  }

  // Obter categoria por ID
  async getCategoryById(id: string): Promise<Category> {
    try {
      const response = await this.request<{ success: boolean; category: Category }>(`/api/categories/${id}`, {
        headers: {
          'Authorization': `Bearer ${await this.getAuthToken()}`,
        },
      });

      if (!response.success || !response.category) {
        throw new Error('Categoria não encontrada');
      }

      return response.category;
    } catch (error: any) {
      throw new Error(error.message || 'Erro ao carregar categoria');
    }
  }

  // Criar categoria
  async createCategory(categoryData: CreateCategoryData): Promise<Category> {
    try {
      const response = await this.request<{ success: boolean; category: Category }>('/api/categories', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${await this.getAuthToken()}`,
        },
        body: JSON.stringify(categoryData),
      });

      if (!response.success || !response.category) {
        throw new Error('Erro ao criar categoria');
      }

      return response.category;
    } catch (error: any) {
      throw new Error(error.message || 'Erro ao criar categoria');
    }
  }

  // Atualizar categoria
  async updateCategory(id: string, categoryData: Partial<CreateCategoryData>): Promise<Category> {
    try {
      const response = await this.request<{ success: boolean; category: Category }>(`/api/categories/${id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${await this.getAuthToken()}`,
        },
        body: JSON.stringify(categoryData),
      });

      if (!response.success || !response.category) {
        throw new Error('Erro ao atualizar categoria');
      }

      return response.category;
    } catch (error: any) {
      throw new Error(error.message || 'Erro ao atualizar categoria');
    }
  }

  // Deletar categoria
  async deleteCategory(id: string): Promise<void> {
    try {
      const response = await this.request<{ success: boolean }>(`/api/categories/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${await this.getAuthToken()}`,
        },
      });

      if (!response.success) {
        throw new Error('Erro ao deletar categoria');
      }
    } catch (error: any) {
      throw new Error(error.message || 'Erro ao deletar categoria');
    }
  }

  // Obter categorias de receita
  async getIncomeCategories(): Promise<Category[]> {
    try {
      const response = await this.getCategories({ type: 'income', includeDefault: true });
      return response.data || [];
    } catch (error: any) {
      console.error('Erro ao buscar categorias de receita:', error);
      return [];
    }
  }

  // Obter categorias de despesa
  async getExpenseCategories(): Promise<Category[]> {
    try {
      const response = await this.getCategories({ type: 'expense', includeDefault: true });
      return response.data || [];
    } catch (error: any) {
      console.error('Erro ao buscar categorias de despesa:', error);
      return [];
    }
  }

  // Obter estatísticas de uso das categorias
  async getCategoryStats(): Promise<{
    mostUsed: Category[];
    leastUsed: Category[];
    totalTransactions: number;
  }> {
    try {
      const response = await this.request<{
        success: boolean;
        stats: {
          mostUsed: Category[];
          leastUsed: Category[];
          totalTransactions: number;
        };
      }>('/api/categories/stats', {
        headers: {
          'Authorization': `Bearer ${await this.getAuthToken()}`,
        },
      });

      if (!response.success || !response.stats) {
        throw new Error('Erro ao carregar estatísticas das categorias');
      }

      return response.stats;
    } catch (error: any) {
      console.error('Erro ao buscar estatísticas das categorias:', error);
      return {
        mostUsed: [],
        leastUsed: [],
        totalTransactions: 0,
      };
    }
  }

  // Verificar se categoria pode ser deletada
  async canDeleteCategory(id: string): Promise<{ canDelete: boolean; reason?: string }> {
    try {
      const response = await this.request<{
        success: boolean;
        canDelete: boolean;
        reason?: string;
      }>(`/api/categories/${id}/can-delete`, {
        headers: {
          'Authorization': `Bearer ${await this.getAuthToken()}`,
        },
      });

      if (!response.success) {
        throw new Error('Erro ao verificar categoria');
      }

      return { canDelete: response.canDelete, reason: response.reason };
    } catch (error: any) {
      throw new Error(error.message || 'Erro ao verificar se categoria pode ser deletada');
    }
  }

  // Obter ícones disponíveis
  async getAvailableIcons(): Promise<{ all: string[]; categories: Record<string, string[]> }> {
    try {
      const response = await this.request<{
        success: boolean;
        icons: { all: string[]; categories: Record<string, string[]> };
      }>('/api/categories/icons/available');

      if (!response.success || !response.icons) {
        throw new Error('Erro ao carregar ícones disponíveis');
      }

      return response.icons;
    } catch (error: any) {
      // Fallback com ícones padrão
      console.error('Erro ao buscar ícones disponíveis:', error);
      return {
        all: ['🍔', '🚗', '🏠', '💰', '📚', '🎮', '🛍️', '🏥', '✈️', '💡'],
        categories: {
          expense: ['🍔', '🚗', '🏠', '🛍️', '🏥', '🎮', '📚'],
          income: ['💰', '💼', '📈', '🎯'],
        },
      };
    }
  }

  // Duplicar categoria
  async duplicateCategory(id: string, newName: string): Promise<Category> {
    try {
      const response = await this.request<{ success: boolean; category: Category }>(`/api/categories/${id}/duplicate`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${await this.getAuthToken()}`,
        },
        body: JSON.stringify({ newName }),
      });

      if (!response.success || !response.category) {
        throw new Error('Erro ao duplicar categoria');
      }

      return response.category;
    } catch (error: any) {
      throw new Error(error.message || 'Erro ao duplicar categoria');
    }
  }

  // Mesclar categorias
  async mergeCategories(sourceId: string, targetId: string): Promise<Category> {
    try {
      const response = await this.request<{ success: boolean; category: Category }>('/api/categories/merge', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${await this.getAuthToken()}`,
        },
        body: JSON.stringify({
          sourceId,
          targetId,
        }),
      });

      if (!response.success || !response.category) {
        throw new Error('Erro ao mesclar categorias');
      }

      return response.category;
    } catch (error: any) {
      throw new Error(error.message || 'Erro ao mesclar categorias');
    }
  }

  // Obter gastos por categoria em um período
  async getCategorySpending(
    startDate?: string,
    endDate?: string,
    type?: 'income' | 'expense'
  ): Promise<{
    category: Category;
    amount: number;
    count: number;
    percentage: number;
  }[]> {
    try {
      const queryParams = new URLSearchParams();
      if (startDate) queryParams.append('startDate', startDate);
      if (endDate) queryParams.append('endDate', endDate);
      if (type) queryParams.append('type', type);

      const endpoint = `/api/categories/spending${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
      const response = await this.request<{
        success: boolean;
        spending: {
          category: Category;
          amount: number;
          count: number;
          percentage: number;
        }[];
      }>(endpoint, {
        headers: {
          'Authorization': `Bearer ${await this.getAuthToken()}`,
        },
      });

      if (!response.success || !response.spending) {
        throw new Error('Erro ao carregar gastos por categoria');
      }

      return response.spending;
    } catch (error: any) {
      console.error('Erro ao buscar gastos por categoria:', error);
      return [];
    }
  }

  // Criar categoria padrão se não existir
  async ensureDefaultCategories(): Promise<void> {
    try {
      await this.request('/api/categories/ensure-defaults', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${await this.getAuthToken()}`,
        },
      });
    } catch (error: any) {
      console.error('Erro ao garantir categorias padrão:', error);
    }
  }
}

export const CategoryService = new CategoryServiceClass();