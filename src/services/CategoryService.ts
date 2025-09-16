// src/services/CategoryService.ts
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_CONFIG } from '../constants';
import { 
  Category, 
  CreateCategoryData, 
  ApiResponse, 
  PaginatedResponse 
} from '../types';

class CategoryServiceClass {
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

  // Criar categoria personalizada
  async createCategory(categoryData: CreateCategoryData): Promise<Category> {
    try {
      const response = await this.request<{ success: boolean; category: Category }>('/api/categories', {
        method: 'POST',
        body: JSON.stringify(categoryData),
      });

      if (!response.success) {
        throw new Error('Erro ao criar categoria');
      }

      return response.category;
    } catch (error: any) {
      throw new Error(error.message || 'Erro ao criar categoria');
    }
  }

  // Listar categorias
  async getCategories(filters?: { 
    type?: 'income' | 'expense';
    includeDefault?: boolean;
    page?: number;
    limit?: number;
  }): Promise<PaginatedResponse<Category[]>> {
    try {
      const queryParams = new URLSearchParams();
      
      if (filters) {
        Object.entries(filters).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            queryParams.append(key, String(value));
          }
        });
      }

      const endpoint = `/api/categories${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
      const response = await this.request<PaginatedResponse<Category[]>>(endpoint);

      return response;
    } catch (error: any) {
      throw new Error(error.message || 'Erro ao carregar categorias');
    }
  }

  // Obter categoria por ID
  async getCategoryById(id: string): Promise<Category> {
    try {
      const response = await this.request<{ success: boolean; category: Category }>(`/api/categories/${id}`);

      if (!response.success) {
        throw new Error('Categoria não encontrada');
      }

      return response.category;
    } catch (error: any) {
      throw new Error(error.message || 'Erro ao carregar categoria');
    }
  }

  // Atualizar categoria
  async updateCategory(id: string, categoryData: Partial<CreateCategoryData>): Promise<Category> {
    try {
      const response = await this.request<{ success: boolean; category: Category }>(`/api/categories/${id}`, {
        method: 'PUT',
        body: JSON.stringify(categoryData),
      });

      if (!response.success) {
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
      const response = await this.request<ApiResponse>(`/api/categories/${id}`, {
        method: 'DELETE',
      });

      if (!response.success) {
        throw new Error('Erro ao deletar categoria');
      }
    } catch (error: any) {
      throw new Error(error.message || 'Erro ao deletar categoria');
    }
  }

  // Obter categorias mais usadas
  async getMostUsedCategories(limit: number = 10, type?: 'income' | 'expense'): Promise<Category[]> {
    try {
      const queryParams = new URLSearchParams();
      queryParams.append('limit', limit.toString());
      if (type) {
        queryParams.append('type', type);
      }

      const response = await this.request<{ success: boolean; categories: Category[] }>(`/api/categories/most-used?${queryParams.toString()}`);

      if (!response.success) {
        throw new Error('Erro ao carregar categorias mais usadas');
      }

      return response.categories;
    } catch (error: any) {
      throw new Error(error.message || 'Erro ao carregar categorias mais usadas');
    }
  }

  // Verificar se categoria pode ser deletada
  async canDeleteCategory(id: string): Promise<{ canDelete: boolean; reason?: string; usage: { transactions: number; budgets: number } }> {
    try {
      const response = await this.request<{
        success: boolean;
        canDelete: boolean;
        reason?: string;
        usage: { transactions: number; budgets: number };
      }>(`/api/categories/${id}/usage`);

      if (!response.success) {
        throw new Error('Erro ao verificar categoria');
      }

      return {
        canDelete: response.canDelete,
        reason: response.reason,
        usage: response.usage
      };
    } catch (error: any) {
      throw new Error(error.message || 'Erro ao verificar se categoria pode ser deletada');
    }
  }

  // Obter estatísticas de gastos por categoria
  async getCategorySpendingStats(filters?: {
    startDate?: string;
    endDate?: string;
    type?: 'income' | 'expense';
  }): Promise<{
    category: Category;
    totalAmount: number;
    transactionCount: number;
    percentage: number;
    averageAmount: number;
  }[]> {
    try {
      const queryParams = new URLSearchParams();
      
      if (filters) {
        Object.entries(filters).forEach(([key, value]) => {
          if (value !== undefined && value !== null && value !== '') {
            queryParams.append(key, value.toString());
          }
        });
      }

      const response = await this.request<{
        success: boolean;
        stats: {
          category: Category;
          totalAmount: number;
          transactionCount: number;
          percentage: number;
          averageAmount: number;
        }[];
      }>(`/api/categories/spending-stats${queryParams.toString() ? `?${queryParams.toString()}` : ''}`);

      if (!response.success) {
        throw new Error('Erro ao carregar estatísticas');
      }

      return response.stats;
    } catch (error: any) {
      throw new Error(error.message || 'Erro ao carregar estatísticas por categoria');
    }
  }

  // Duplicar categoria
  async duplicateCategory(id: string, newName: string): Promise<Category> {
    try {
      const response = await this.request<{ success: boolean; category: Category }>(`/api/categories/${id}/duplicate`, {
        method: 'POST',
        body: JSON.stringify({ newName }),
      });

      if (!response.success) {
        throw new Error('Erro ao duplicar categoria');
      }

      return response.category;
    } catch (error: any) {
      throw new Error(error.message || 'Erro ao duplicar categoria');
    }
  }

  // Obter sugestões de categorias baseadas em descrição
  async suggestCategory(description: string, type: 'income' | 'expense'): Promise<Category[]> {
    try {
      const response = await this.request<{ success: boolean; suggestions: Category[] }>('/api/categories/suggest', {
        method: 'POST',
        body: JSON.stringify({ description, type }),
      });

      if (!response.success) {
        throw new Error('Erro ao obter sugestões');
      }

      return response.suggestions;
    } catch (error: any) {
      throw new Error(error.message || 'Erro ao obter sugestões de categoria');
    }
  }

  // Mesclar categorias
  async mergeCategories(sourceId: string, targetId: string): Promise<{ 
    mergedTransactions: number; 
    mergedBudgets: number; 
    targetCategory: Category; 
  }> {
    try {
      const response = await this.request<{
        success: boolean;
        mergedTransactions: number;
        mergedBudgets: number;
        targetCategory: Category;
      }>('/api/categories/merge', {
        method: 'POST',
        body: JSON.stringify({ sourceId, targetId }),
      });

      if (!response.success) {
        throw new Error('Erro ao mesclar categorias');
      }

      return {
        mergedTransactions: response.mergedTransactions,
        mergedBudgets: response.mergedBudgets,
        targetCategory: response.targetCategory,
      };
    } catch (error: any) {
      throw new Error(error.message || 'Erro ao mesclar categorias');
    }
  }

  // Exportar categorias
  async exportCategories(format: 'csv' | 'excel' = 'csv'): Promise<string> {
    try {
      const response = await this.request<{ success: boolean; downloadUrl: string }>(`/api/categories/export?format=${format}`);

      if (!response.success) {
        throw new Error('Erro ao exportar categorias');
      }

      return response.downloadUrl;
    } catch (error: any) {
      throw new Error(error.message || 'Erro ao exportar categorias');
    }
  }

  // Importar categorias
  async importCategories(file: FormData): Promise<{ imported: number; skipped: number; errors: string[] }> {
    try {
      const token = await this.getAuthToken();
      const url = `${this.baseURL}/api/categories/import`;
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          ...(token && { 'Authorization': `Bearer ${token}` }),
        },
        body: file,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Erro na importação');
      }

      return data;
    } catch (error: any) {
      throw new Error(error.message || 'Erro ao importar categorias');
    }
  }

  // Restaurar categorias padrão
  async restoreDefaultCategories(): Promise<{ restored: number; categories: Category[] }> {
    try {
      const response = await this.request<{
        success: boolean;
        restored: number;
        categories: Category[];
      }>('/api/categories/restore-defaults', {
        method: 'POST',
      });

      if (!response.success) {
        throw new Error('Erro ao restaurar categorias padrão');
      }

      return {
        restored: response.restored,
        categories: response.categories,
      };
    } catch (error: any) {
      throw new Error(error.message || 'Erro ao restaurar categorias padrão');
    }
  }

  // Reordenar categorias
  async reorderCategories(categoryIds: string[]): Promise<void> {
    try {
      const response = await this.request<ApiResponse>('/api/categories/reorder', {
        method: 'POST',
        body: JSON.stringify({ categoryIds }),
      });

      if (!response.success) {
        throw new Error('Erro ao reordenar categorias');
      }
    } catch (error: any) {
      throw new Error(error.message || 'Erro ao reordenar categorias');
    }
  }
}

export const CategoryService = new CategoryServiceClass();