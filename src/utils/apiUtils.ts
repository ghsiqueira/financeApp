// src/utils/apiUtils.ts
import { Alert } from 'react-native';

/**
 * Função para lidar com erros de parsing JSON
 */
export const handleJsonParseError = (error: any): string => {
  if (error.message && error.message.includes('JSON Parse error')) {
    return 'Erro de comunicação com o servidor. Verifique sua conexão.';
  }
  
  if (error.message && error.message.includes('Network request failed')) {
    return 'Erro de rede. Verifique sua conexão com a internet.';
  }
  
  return error.message || 'Erro desconhecido';
};

/**
 * Função para validar resposta da API
 */
export const validateApiResponse = (response: any): boolean => {
  // Se a resposta é HTML (página de erro), não é uma resposta válida da API
  if (typeof response === 'string' && response.includes('<html>')) {
    throw new Error('Servidor retornou página HTML em vez de JSON. Verifique se a API está funcionando.');
  }
  
  return true;
};

/**
 * Função para fazer requisições com tratamento de erro melhorado
 */
export const safeApiCall = async <T>(
  apiCall: () => Promise<T>,
  fallbackData?: T
): Promise<T> => {
  try {
    const result = await apiCall();
    return result;
  } catch (error: any) {
    console.error('Erro na API:', error);
    
    const errorMessage = handleJsonParseError(error);
    
    // Se temos dados de fallback, usar eles em caso de erro
    if (fallbackData !== undefined) {
      console.log('Usando dados de fallback devido ao erro:', errorMessage);
      return fallbackData;
    }
    
    throw new Error(errorMessage);
  }
};

/**
 * Função para verificar se a API está online
 */
export const checkApiHealth = async (): Promise<boolean> => {
  try {
    // Fazer uma requisição simples para verificar se a API responde
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);
    
    const response = await fetch('http://10.0.2.2:5000/api/health', {
      method: 'GET',
      signal: controller.signal,
    });
    
    clearTimeout(timeoutId);
    return response.ok;
  } catch (error) {
    console.error('API não está respondendo:', error);
    return false;
  }
};

/**
 * Dados mockados para quando a API não estiver disponível
 */
export const getMockData = () => ({
  goals: [
    {
      _id: 'mock-goal-1',
      id: 'mock-goal-1',
      title: 'Viagem para Europa',
      description: 'Economizar para viagem de férias',
      targetAmount: 15000,
      currentAmount: 5000,
      targetDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(),
      endDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(),
      startDate: new Date().toISOString(),
      category: 'Viagem',
      status: 'active' as const,
      userId: 'mock-user',
      monthlyTarget: 3333,
      name: 'Viagem para Europa',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      _id: 'mock-goal-2',
      id: 'mock-goal-2',
      title: 'Casa Própria',
      description: 'Juntar entrada para financiamento',
      targetAmount: 50000,
      currentAmount: 12000,
      targetDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
      endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
      startDate: new Date().toISOString(),
      category: 'Casa própria',
      status: 'active' as const,
      userId: 'mock-user',
      monthlyTarget: 4167,
      name: 'Casa Própria',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
  ],
  
  budgets: [
    {
      _id: 'mock-budget-1',
      id: 'mock-budget-1',
      name: 'Alimentação',
      monthlyLimit: 800,
      amount: 800,
      limit: 800,
      spent: 450,
      month: new Date().getMonth() + 1,
      year: new Date().getFullYear(),
      isActive: true,
      userId: 'mock-user',
      category: {
        _id: 'mock-cat-1',
        id: 'mock-cat-1',
        name: 'Alimentação',
        icon: '🍔',
        color: '#FF6B6B',
        type: 'expense' as const,
        isDefault: true,
        createdAt: new Date().toISOString(),
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      _id: 'mock-budget-2',
      id: 'mock-budget-2',
      name: 'Transporte',
      monthlyLimit: 300,
      amount: 300,
      limit: 300,
      spent: 180,
      month: new Date().getMonth() + 1,
      year: new Date().getFullYear(),
      isActive: true,
      userId: 'mock-user',
      category: {
        _id: 'mock-cat-2',
        id: 'mock-cat-2',
        name: 'Transporte',
        icon: '🚗',
        color: '#4ECDC4',
        type: 'expense' as const,
        isDefault: true,
        createdAt: new Date().toISOString(),
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
  ],
  
  transactions: [
    {
      _id: 'mock-trans-1',
      id: 'mock-trans-1',
      description: 'Supermercado',
      amount: 120.50,
      type: 'expense' as const,
      date: new Date().toISOString(),
      userId: 'mock-user',
      isRecurring: false,
      category: {
        _id: 'mock-cat-1',
        id: 'mock-cat-1',
        name: 'Alimentação',
        icon: '🍔',
        color: '#FF6B6B',
        type: 'expense' as const,
        isDefault: true,
        createdAt: new Date().toISOString(),
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
  ]
});