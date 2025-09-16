// src/hooks/index.ts
import { useState, useEffect, useCallback, useRef } from 'react';
import { Alert } from 'react-native';
import { TransactionService } from '../services/TransactionService';
import { GoalService, GoalsResponse } from '../services/GoalService'; // Importar GoalsResponse corrigida
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
      await TransactionService.deleteTransaction(id);
      setTransactions(prev => prev.filter(t => t._id !== id));
    } catch (err: any) {
      Alert.alert('Erro', err.message || 'Erro ao deletar transação');
    }
  }, []);

  const duplicateTransaction = useCallback(async (id: string) => {
    try {
      const newTransaction = await TransactionService.duplicateTransaction(id);
      setTransactions(prev => [newTransaction, ...prev]);
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

// Hook para gerenciar metas
export const useGoals = () => {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadGoals = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response: GoalsResponse = await GoalService.getGoals(); // Usar tipo correto
      
      if (response.success && response.data) {
        setGoals(response.data);
      } else if (!response.success) {
        setError(response.message || 'Erro ao carregar metas');
        setGoals([]);
      }
    } catch (err: any) {
      setError(err.message || 'Erro ao carregar metas');
      setGoals([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  const refresh = useCallback(() => {
    setRefreshing(true);
    loadGoals();
  }, [loadGoals]);

  const addToGoal = useCallback(async (id: string, amount: number) => {
    try {
      const updatedGoal = await GoalService.addToGoal(id, amount);
      setGoals(prev => prev.map(g => g._id === id ? updatedGoal : g));
    } catch (err: any) {
      Alert.alert('Erro', err.message || 'Erro ao adicionar valor à meta');
    }
  }, []);

  const pauseGoal = useCallback(async (id: string) => {
    try {
      const updatedGoal = await GoalService.pauseGoal(id);
      setGoals(prev => prev.map(g => g._id === id ? updatedGoal : g));
    } catch (err: any) {
      Alert.alert('Erro', err.message || 'Erro ao pausar meta');
    }
  }, []);

  const resumeGoal = useCallback(async (id: string) => {
    try {
      const updatedGoal = await GoalService.resumeGoal(id);
      setGoals(prev => prev.map(g => g._id === id ? updatedGoal : g));
    } catch (err: any) {
      Alert.alert('Erro', err.message || 'Erro ao reativar meta');
    }
  }, []);

  const deleteGoal = useCallback(async (id: string) => {
    try {
      await GoalService.deleteGoal(id);
      setGoals(prev => prev.filter(g => g._id !== id));
    } catch (err: any) {
      Alert.alert('Erro', err.message || 'Erro ao deletar meta');
    }
  }, []);

  useEffect(() => {
    loadGoals();
  }, [loadGoals]);

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

// Hook para gerenciar orçamentos
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
      const updatedBudget = await BudgetService.adjustBudgetLimit(id, newLimit);
      setBudgets(prev => prev.map(b => b._id === id ? updatedBudget : b));
    } catch (err: any) {
      Alert.alert('Erro', err.message || 'Erro ao ajustar limite do orçamento');
    }
  }, []);

  const deleteBudget = useCallback(async (id: string) => {
    try {
      await BudgetService.deleteBudget(id);
      setBudgets(prev => prev.filter(b => b._id !== id));
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