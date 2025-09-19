// src/hooks/useTransactions.ts - VERSÃO CORRIGIDA
import { useState, useEffect, useCallback } from 'react';
import { Alert } from 'react-native';
import { TransactionService } from '../services/TransactionService';
import { Transaction, TransactionFilters, CreateTransactionData } from '../types';

// Interface para o estado do hook
interface UseTransactionsState {
  transactions: Transaction[];
  loading: boolean;
  error: string | null;
  pagination: {
    current: number;
    pages: number;
    total: number;
  };
}

// Estado inicial
const initialState: UseTransactionsState = {
  transactions: [],
  loading: false,
  error: null,
  pagination: {
    current: 1,
    pages: 0,
    total: 0,
  },
};

export const useTransactions = (initialFilters?: TransactionFilters) => {
  const [state, setState] = useState<UseTransactionsState>(initialState);
  const [filters, setFilters] = useState<TransactionFilters>(initialFilters || {});

  // Função para buscar transações - CORRIGIDA
  const fetchTransactions = useCallback(async (newFilters?: TransactionFilters, append = false) => {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }));

      const filtersToUse = newFilters || filters;
      console.log('🔍 Buscando transações com filtros:', filtersToUse);
      
      // Usar TransactionService em vez de apiService diretamente
      const response = await TransactionService.getTransactions(filtersToUse);
      
      console.log('📊 Resposta recebida:', response);

      if (response.success && response.data) {
        // response.data já é um array de Transaction[] processado pelo TransactionService
        const transactions = Array.isArray(response.data) ? response.data : [];
        
        setState(prev => ({
          ...prev,
          transactions: append ? [...prev.transactions, ...transactions] : transactions,
          pagination: response.pagination || prev.pagination,
          loading: false,
          error: null,
        }));
      } else {
        setState(prev => ({
          ...prev,
          loading: false,
          error: response.message || 'Erro ao carregar transações',
        }));
      }
    } catch (error: any) {
      console.error('❌ Erro ao buscar transações:', error);
      setState(prev => ({
        ...prev,
        loading: false,
        error: error.message || 'Erro ao carregar transações',
      }));
    }
  }, [filters]);

  // Função para criar transação
  const createTransaction = useCallback(async (data: CreateTransactionData) => {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }));

      const response = await TransactionService.createTransaction(data);

      if (response.success && response.data) {
        const newTransaction = response.data;
        
        setState(prev => ({
          ...prev,
          transactions: [newTransaction, ...prev.transactions],
          loading: false,
          error: null,
        }));

        return newTransaction;
      } else {
        throw new Error(response.message || 'Erro ao criar transação');
      }
    } catch (error: any) {
      setState(prev => ({
        ...prev,
        loading: false,
        error: error.message || 'Erro ao criar transação',
      }));
      throw error;
    }
  }, []);

  // Função para atualizar transação
  const updateTransaction = useCallback(async (id: string, data: Partial<CreateTransactionData>) => {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }));

      const response = await TransactionService.updateTransaction(id, data);

      if (response.success && response.data) {
        const updatedTransaction = response.data;
        
        setState(prev => ({
          ...prev,
          transactions: prev.transactions.map(transaction =>
            transaction.id === id ? updatedTransaction : transaction
          ),
          loading: false,
          error: null,
        }));

        return updatedTransaction;
      } else {
        throw new Error(response.message || 'Erro ao atualizar transação');
      }
    } catch (error: any) {
      setState(prev => ({
        ...prev,
        loading: false,
        error: error.message || 'Erro ao atualizar transação',
      }));
      throw error;
    }
  }, []);

  // Função para deletar transação
  const deleteTransaction = useCallback(async (id: string) => {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }));

      const response = await TransactionService.deleteTransaction(id);

      if (response.success) {
        setState(prev => ({
          ...prev,
          transactions: prev.transactions.filter(transaction => transaction.id !== id),
          loading: false,
          error: null,
        }));

        return true;
      } else {
        throw new Error(response.message || 'Erro ao deletar transação');
      }
    } catch (error: any) {
      setState(prev => ({
        ...prev,
        loading: false,
        error: error.message || 'Erro ao deletar transação',
      }));
      throw error;
    }
  }, []);

  // Função para carregar mais transações (paginação)
  const loadMore = useCallback(() => {
    if (state.pagination.current < state.pagination.pages && !state.loading) {
      const nextPage = state.pagination.current + 1;
      fetchTransactions({ ...filters, page: nextPage }, true);
    }
  }, [state.pagination, state.loading, filters, fetchTransactions]);

  // Função para recarregar transações
  const refresh = useCallback(() => {
    fetchTransactions({ ...filters, page: 1 }, false);
  }, [filters, fetchTransactions]);

  // Função para aplicar filtros
  const applyFilters = useCallback((newFilters: TransactionFilters) => {
    setFilters(newFilters);
    fetchTransactions({ ...newFilters, page: 1 }, false);
  }, [fetchTransactions]);

  // Função para limpar filtros
  const clearFilters = useCallback(() => {
    const clearedFilters = { page: 1, limit: 20 };
    setFilters(clearedFilters);
    fetchTransactions(clearedFilters, false);
  }, [fetchTransactions]);

  // Carregar transações na inicialização
  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  // Função para mostrar alerta de erro
  const showError = useCallback((message: string) => {
    Alert.alert('Erro', message);
  }, []);

  return {
    // Estado
    transactions: state.transactions,
    loading: state.loading,
    error: state.error,
    pagination: state.pagination,
    filters,

    // Ações
    fetchTransactions,
    createTransaction,
    updateTransaction,
    deleteTransaction,
    loadMore,
    refresh,
    applyFilters,
    clearFilters,
    showError,

    // Estados derivados
    hasMore: state.pagination.current < state.pagination.pages,
    isEmpty: state.transactions.length === 0 && !state.loading,
    hasError: !!state.error,
  };
};