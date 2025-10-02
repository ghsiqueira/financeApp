// src/hooks/index.ts - HOOKS COMPLETOS CORRIGIDOS
import { useState, useEffect, useCallback, useRef } from 'react';
import { Alert } from 'react-native';
import { TransactionService } from '../services/TransactionService';
import { GoalService, GoalsResponse } from '../services/GoalService';
import { BudgetService } from '../services/BudgetService';
import { CategoryService } from '../services/CategoryService';
import { 
  Transaction, 
  Goal, 
  Budget, 
  Category, 
  TransactionFilters, 
  PaginatedResponse 
} from '../types';

// Hook para gerenciar transações
export const useTransactions = (filters?: TransactionFilters) => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasNextPage, setHasNextPage] = useState(true);
  const [pagination, setPagination] = useState({
    current: 1,
    pages: 1,
    total: 0,
  });

  const currentFilters = useRef(filters);
  const currentPage = useRef(1);

  const loadTransactions = useCallback(async (page: number = 1, append: boolean = false) => {
    try {
      if (page === 1) {
        setLoading(true);
        setError(null);
      } else {
        setLoadingMore(true);
      }

      const response = await TransactionService.getTransactions({
        ...currentFilters.current,
        page,
        limit: 20,
      });

      if (response.success && response.data) {
        if (append && page > 1) {
          setTransactions(prev => [...prev, ...response.data!]);
        } else {
          setTransactions(response.data);
        }

        setPagination(response.pagination);
        setHasNextPage(page < response.pagination.pages);
        currentPage.current = page;
      }
    } catch (err: any) {
      setError(err.message || 'Erro ao carregar transações');
      if (page === 1) {
        setTransactions([]);
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
      setLoadingMore(false);
    }
  }, []);

  const refresh = useCallback(() => {
    setRefreshing(true);
    currentPage.current = 1;
    loadTransactions(1, false);
  }, [loadTransactions]);

  const loadMore = useCallback(() => {
    if (!loadingMore && hasNextPage) {
      const nextPage = currentPage.current + 1;
      loadTransactions(nextPage, true);
    }
  }, [loadTransactions, loadingMore, hasNextPage]);

  const updateFilters = useCallback((newFilters: TransactionFilters) => {
    currentFilters.current = newFilters;
    currentPage.current = 1;
    loadTransactions(1, false);
  }, [loadTransactions]);

  const deleteTransaction = useCallback(async (id: string) => {
    try {
      const response = await TransactionService.deleteTransaction(id);
      if (response.success) {
        setTransactions(prev => prev.filter(t => t._id !== id));
      }
    } catch (err: any) {
      Alert.alert('Erro', err.message || 'Erro ao deletar transação');
    }
  }, []);

  const duplicateTransaction = useCallback(async (id: string) => {
    try {
      const response = await TransactionService.duplicateTransaction(id);
      if (response.success && response.data) {
        setTransactions(prev => [response.data!, ...prev]);
      }
    } catch (err: any) {
      Alert.alert('Erro', err.message || 'Erro ao duplicar transação');
    }
  }, []);

  useEffect(() => {
    loadTransactions();
  }, [loadTransactions]);

  return {
    transactions,
    loading,
    refreshing,
    loadingMore,
    error,
    hasNextPage,
    pagination,
    refresh,
    loadMore,
    updateFilters,
    deleteTransaction,
    duplicateTransaction,
  };
};

// Hook para gerenciar metas - CORRIGIDO COM DEBUG
export const useGoals = () => {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadGoals = useCallback(async () => {
    try {
      console.log('🔵 useGoals: Iniciando carregamento...');
      setLoading(true);
      setError(null);
      
      console.log('🔵 useGoals: Chamando GoalService.getGoals()...');
      const response: GoalsResponse = await GoalService.getGoals();
      
      console.log('🔵 useGoals: Resposta recebida:', response);
      console.log('🔵 useGoals: response.success:', response.success);
      console.log('🔵 useGoals: response.data:', response.data);
      console.log('🔵 useGoals: response.data length:', response.data?.length);
      
      if (response.success && response.data) {
        console.log('✅ useGoals: Metas carregadas com sucesso:', response.data.length, 'metas');
        setGoals(response.data);
      } else if (!response.success) {
        console.log('❌ useGoals: Falha na resposta:', response.message);
        setError(response.message || 'Erro ao carregar metas');
        setGoals([]);
      }
    } catch (err: any) {
      console.log('💥 useGoals: Erro capturado:', err);
      console.log('💥 useGoals: Error message:', err.message);
      setError(err.message || 'Erro ao carregar metas');
      setGoals([]);
    } finally {
      console.log('🔵 useGoals: Finalizando carregamento...');
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  const refresh = useCallback(() => {
    console.log('🔄 useGoals: Refresh iniciado');
    setRefreshing(true);
    loadGoals();
  }, [loadGoals]);

  const addToGoal = useCallback(async (id: string, amount: number) => {
    try {
      const response = await GoalService.addToGoal(id, amount);
      if (response.success && response.data) {
        setGoals(prev => prev.map(g => g._id === id ? response.data! : g));
      }
    } catch (err: any) {
      Alert.alert('Erro', err.message || 'Erro ao adicionar valor à meta');
    }
  }, []);

  const pauseGoal = useCallback(async (id: string) => {
    try {
      const response = await GoalService.pauseGoal(id);
      if (response.success && response.data) {
        setGoals(prev => prev.map(g => g._id === id ? response.data! : g));
      }
    } catch (err: any) {
      Alert.alert('Erro', err.message || 'Erro ao pausar meta');
    }
  }, []);

  const resumeGoal = useCallback(async (id: string) => {
    try {
      const response = await GoalService.resumeGoal(id);
      if (response.success && response.data) {
        setGoals(prev => prev.map(g => g._id === id ? response.data! : g));
      }
    } catch (err: any) {
      Alert.alert('Erro', err.message || 'Erro ao reativar meta');
    }
  }, []);

  const deleteGoal = useCallback(async (id: string) => {
    try {
      console.log('🗑️ useGoals: Deletando meta:', id);
      const response = await GoalService.deleteGoal(id);
      if (response.success) {
        setGoals(prev => prev.filter(g => g._id !== id));
        console.log('✅ useGoals: Meta deletada com sucesso');
      }
    } catch (err: any) {
      console.log('❌ useGoals: Erro ao deletar:', err.message);
      Alert.alert('Erro', err.message || 'Erro ao deletar meta');
    }
  }, []);

  useEffect(() => {
    console.log('🎯 useGoals: useEffect executado - carregando metas...');
    loadGoals();
  }, [loadGoals]);

  // Log do estado atual
  useEffect(() => {
    console.log('📊 useGoals: Estado atual:');
    console.log('  - goals.length:', goals.length);
    console.log('  - loading:', loading);
    console.log('  - error:', error);
    console.log('  - refreshing:', refreshing);
  }, [goals, loading, error, refreshing]);

  return {
    goals,
    loading,
    refreshing,
    error,
    refresh,
    addToGoal,
    pauseGoal,
    resumeGoal,
    deleteGoal,
  };
};

// Hook para gerenciar orçamentos - CORRIGIDO
export const useBudgets = () => {
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadBudgets = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await BudgetService.getBudgets();
      
      if (response.success && response.data) {
        setBudgets(response.data);
      }
    } catch (err: any) {
      setError(err.message || 'Erro ao carregar orçamentos');
      setBudgets([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  const refresh = useCallback(() => {
    setRefreshing(true);
    loadBudgets();
  }, [loadBudgets]);

  const adjustBudgetLimit = useCallback(async (id: string, newLimit: number) => {
    try {
      const response = await BudgetService.adjustBudgetLimit(id, newLimit);
      if (response.success && response.data) {
        setBudgets(prev => prev.map(b => b._id === id ? response.data! : b));
      }
    } catch (err: any) {
      Alert.alert('Erro', err.message || 'Erro ao ajustar limite do orçamento');
    }
  }, []);

  const deleteBudget = useCallback(async (id: string) => {
    try {
      const response = await BudgetService.deleteBudget(id);
      if (response.success) {
        setBudgets(prev => prev.filter(b => b._id !== id));
      }
    } catch (err: any) {
      Alert.alert('Erro', err.message || 'Erro ao deletar orçamento');
    }
  }, []);

  useEffect(() => {
    loadBudgets();
  }, [loadBudgets]);

  return {
    budgets,
    loading,
    refreshing,
    error,
    refresh,
    adjustBudgetLimit,
    deleteBudget,
  };
};

// Hook para gerenciar categorias
export const useCategories = (type?: 'income' | 'expense') => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadCategories = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await CategoryService.getCategories({ type, includeDefault: true });
      
      if (response.success && response.data) {
        setCategories(response.data);
      }
    } catch (err: any) {
      setError(err.message || 'Erro ao carregar categorias');
      setCategories([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [type]);

  const refresh = useCallback(() => {
    setRefreshing(true);
    loadCategories();
  }, [loadCategories]);

  const deleteCategory = useCallback(async (id: string) => {
    try {
      await CategoryService.deleteCategory(id);
      setCategories(prev => prev.filter(c => c._id !== id));
    } catch (err: any) {
      Alert.alert('Erro', err.message || 'Erro ao deletar categoria');
    }
  }, []);

  useEffect(() => {
    loadCategories();
  }, [loadCategories]);

  return {
    categories,
    loading,
    refreshing,
    error,
    refresh,
    deleteCategory,
  };
};

// Hook para debounce
export const useDebounce = <T>(value: T, delay: number): T => {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
};

// Hook para gerenciar estado de loading
export const useAsyncOperation = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const execute = useCallback(async <T>(
    operation: () => Promise<T>,
    onSuccess?: (result: T) => void,
    onError?: (error: Error) => void
  ): Promise<T | null> => {
    try {
      setLoading(true);
      setError(null);
      const result = await operation();
      onSuccess?.(result);
      return result;
    } catch (err: any) {
      const errorMessage = err.message || 'Erro inesperado';
      setError(errorMessage);
      onError?.(err);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const reset = useCallback(() => {
    setLoading(false);
    setError(null);
  }, []);

  return {
    loading,
    error,
    execute,
    reset,
  };
};

// Hook para formatação de moeda
export const useCurrency = () => {
  const formatCurrency = useCallback((value: number): string => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  }, []);

  const parseCurrency = useCallback((value: string): number => {
    const numericValue = value.replace(/[^\d,]/g, '').replace(',', '.');
    return parseFloat(numericValue) || 0;
  }, []);

  const formatCurrencyInput = useCallback((value: string): string => {
    const numericValue = value.replace(/\D/g, '');
    const floatValue = parseInt(numericValue) / 100;
    return floatValue.toLocaleString('pt-BR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  }, []);

  return {
    formatCurrency,
    parseCurrency,
    formatCurrencyInput,
  };
};

// Hook para formatação de data
export const useDate = () => {
  const formatDate = useCallback((date: string | Date, format: 'short' | 'long' | 'full' = 'short'): string => {
    const d = new Date(date);
    
    switch (format) {
      case 'short':
        return d.toLocaleDateString('pt-BR');
      case 'long':
        return d.toLocaleDateString('pt-BR', {
          day: '2-digit',
          month: 'long',
          year: 'numeric',
        });
      case 'full':
        return d.toLocaleDateString('pt-BR', {
          weekday: 'long',
          day: '2-digit',
          month: 'long',
          year: 'numeric',
        });
      default:
        return d.toLocaleDateString('pt-BR');
    }
  }, []);

  const formatDateTime = useCallback((date: string | Date): string => {
    const d = new Date(date);
    return `${d.toLocaleDateString('pt-BR')} ${d.toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
    })}`;
  }, []);

  const getRelativeTime = useCallback((date: string | Date): string => {
    const d = new Date(date);
    const now = new Date();
    const diffInMs = now.getTime() - d.getTime();
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

    if (diffInDays === 0) {
      return 'Hoje';
    } else if (diffInDays === 1) {
      return 'Ontem';
    } else if (diffInDays < 7) {
      return `${diffInDays} dias atrás`;
    } else if (diffInDays < 30) {
      const weeks = Math.floor(diffInDays / 7);
      return `${weeks} semana${weeks > 1 ? 's' : ''} atrás`;
    } else if (diffInDays < 365) {
      const months = Math.floor(diffInDays / 30);
      return `${months} mês${months > 1 ? 'es' : ''} atrás`;
    } else {
      const years = Math.floor(diffInDays / 365);
      return `${years} ano${years > 1 ? 's' : ''} atrás`;
    }
  }, []);

  return {
    formatDate,
    formatDateTime,
    getRelativeTime,
  };
};

// Hook para gerenciar estado de formulário
export const useForm = <T extends Record<string, any>>(
  initialValues: T,
  validationRules?: Partial<Record<keyof T, (value: any) => string | undefined>>
) => {
  const [values, setValues] = useState<T>(initialValues);
  const [errors, setErrors] = useState<Partial<Record<keyof T, string>>>({});
  const [touched, setTouched] = useState<Partial<Record<keyof T, boolean>>>({});

  const setValue = useCallback((field: keyof T, value: any) => {
    setValues(prev => ({ ...prev, [field]: value }));
    
    // Limpar erro quando o campo for alterado
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  }, [errors]);

  const setFieldTouched = useCallback((field: keyof T, isTouched: boolean = true) => {
    setTouched(prev => ({ ...prev, [field]: isTouched }));
  }, []);

  const validate = useCallback((): boolean => {
    if (!validationRules) return true;

    const newErrors: Partial<Record<keyof T, string>> = {};
    let isValid = true;

    Object.entries(validationRules).forEach(([field, rule]) => {
      if (rule) {
        const error = rule(values[field as keyof T]);
        if (error) {
          newErrors[field as keyof T] = error;
          isValid = false;
        }
      }
    });

    setErrors(newErrors);
    return isValid;
  }, [values, validationRules]);

  const reset = useCallback(() => {
    setValues(initialValues);
    setErrors({});
    setTouched({});
  }, [initialValues]);

  return {
    values,
    errors,
    touched,
    setValue,
    setFieldTouched,
    validate,
    reset,
    isValid: Object.keys(errors).length === 0,
  };
};

// Hook useToast
export const useToast = () => {
  const [toast, setToast] = useState<{
    visible: boolean;
    message: string;
    type: 'success' | 'error' | 'warning' | 'info';
    action?: { label: string; onPress: () => void };
  }>({
    visible: false,
    message: '',
    type: 'info',
  });

  const showToast = useCallback((
    message: string,
    type: 'success' | 'error' | 'warning' | 'info' = 'info',
    action?: { label: string; onPress: () => void }
  ) => {
    setToast({ visible: true, message, type, action });
  }, []);

  const hideToast = useCallback(() => {
    setToast(prev => ({ ...prev, visible: false }));
  }, []);

  const success = useCallback((message: string, action?: { label: string; onPress: () => void }) => {
    showToast(message, 'success', action);
  }, [showToast]);

  const error = useCallback((message: string, action?: { label: string; onPress: () => void }) => {
    showToast(message, 'error', action);
  }, [showToast]);

  const warning = useCallback((message: string, action?: { label: string; onPress: () => void }) => {
    showToast(message, 'warning', action);
  }, [showToast]);

  const info = useCallback((message: string, action?: { label: string; onPress: () => void }) => {
    showToast(message, 'info', action);
  }, [showToast]);

  return { toast, showToast, hideToast, success, error, warning, info };
};

// Hook useConfirm
export const useConfirm = () => {
  const [confirm, setConfirm] = useState<{
    visible: boolean;
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    type?: 'danger' | 'warning' | 'info';
    onConfirm: () => void;
    onCancel: () => void;
  }>({
    visible: false,
    title: '',
    message: '',
    type: 'danger',
    onConfirm: () => {},
    onCancel: () => {},
  });

  const showConfirm = useCallback((options: {
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    type?: 'danger' | 'warning' | 'info';
    onConfirm: () => void;
    onCancel?: () => void;
  }) => {
    setConfirm({
      visible: true,
      title: options.title,
      message: options.message,
      confirmText: options.confirmText,
      cancelText: options.cancelText,
      type: options.type || 'danger',
      onConfirm: () => {
        options.onConfirm();
        hideConfirm();
      },
      onCancel: () => {
        options.onCancel?.();
        hideConfirm();
      },
    });
  }, []);

  const hideConfirm = useCallback(() => {
    setConfirm(prev => ({ ...prev, visible: false }));
  }, []);

  const confirmDelete = useCallback((
    itemName: string,
    onConfirm: () => void
  ) => {
    showConfirm({
      title: 'Excluir item',
      message: `Tem certeza que deseja excluir "${itemName}"? Esta ação não pode ser desfeita.`,
      confirmText: 'Excluir',
      cancelText: 'Cancelar',
      type: 'danger',
      onConfirm,
    });
  }, [showConfirm]);

  return { confirm, showConfirm, hideConfirm, confirmDelete };
};