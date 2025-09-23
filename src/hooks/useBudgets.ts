// src/hooks/useBudgets.ts - VERSÃO COM DEBUG PARA IDENTIFICAR PROBLEMA
import { useState, useEffect, useCallback } from 'react';
import { Alert } from 'react-native';
import { BudgetService } from '../services/BudgetService';
import { Budget } from '../types';

interface UseBudgetsReturn {
  budgets: Budget[];
  loading: boolean;
  refreshing: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  deleteBudget: (id: string) => Promise<void>;
  adjustBudgetLimit: (id: string, newLimit: number) => Promise<void>;
}

export const useBudgets = (): UseBudgetsReturn => {
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Carregar orçamentos
  const loadBudgets = useCallback(async (isRefreshing = false) => {
    try {
      console.log('🔄 useBudgets.loadBudgets - Iniciando carregamento, isRefreshing:', isRefreshing);
      
      if (isRefreshing) {
        setRefreshing(true);
        console.log('♻️ Modo refresh ativado');
      } else {
        setLoading(true);
        console.log('⏳ Modo loading ativado');
      }
      
      setError(null);
      
      console.log('📞 Chamando BudgetService.getBudgets...');
      const response = await BudgetService.getBudgets();
      console.log('📡 useBudgets - Resposta do BudgetService:', response);
      
      if (response.success) {
        console.log('✅ Resposta bem-sucedida');
        console.log('📊 Orçamentos recebidos:', response.data);
        console.log('📊 Quantidade de orçamentos:', response.data.length);
        
        setBudgets(response.data);
        console.log('💾 Estado budgets atualizado');
      } else {
        console.log('❌ Resposta com erro:', response.message);
        setError(response.message || 'Erro ao carregar orçamentos');
        setBudgets([]); // Limpar lista em caso de erro
      }
    } catch (err: any) {
      console.error('❌ Erro capturado no useBudgets:', err);
      console.error('❌ Stack trace:', err.stack);
      setError(err.message || 'Erro ao carregar orçamentos');
      setBudgets([]); // Limpar lista em caso de erro
    } finally {
      console.log('🏁 Finalizando carregamento...');
      setLoading(false);
      setRefreshing(false);
      console.log('🏁 Estados finais: loading=false, refreshing=false');
    }
  }, []);

  // Refresh dos orçamentos
  const refresh = useCallback(async () => {
    console.log('♻️ useBudgets.refresh - Iniciando refresh...');
    await loadBudgets(true);
  }, [loadBudgets]);

  // Deletar orçamento
  const deleteBudget = useCallback(async (id: string) => {
    try {
      console.log('🗑️ useBudgets.deleteBudget - ID:', id);
      
      const response = await BudgetService.deleteBudget(id);
      console.log('📡 Resposta da exclusão:', response);
      
      if (response.success) {
        console.log('✅ Orçamento excluído com sucesso');
        setBudgets(prev => {
          const updated = prev.filter(budget => budget._id !== id);
          console.log('📊 Lista atualizada após exclusão:', updated.length, 'itens');
          return updated;
        });
        Alert.alert('Sucesso', 'Orçamento excluído com sucesso!');
      } else {
        console.log('❌ Erro na exclusão:', response.message);
        Alert.alert('Erro', response.message || 'Erro ao excluir orçamento');
      }
    } catch (err: any) {
      console.error('❌ Erro ao deletar orçamento:', err);
      Alert.alert('Erro', err.message || 'Erro ao excluir orçamento');
    }
  }, []);

  // Ajustar limite do orçamento
  const adjustBudgetLimit = useCallback(async (id: string, newLimit: number) => {
    try {
      console.log('💰 useBudgets.adjustBudgetLimit - ID:', id, 'Novo limite:', newLimit);
      
      const response = await BudgetService.adjustBudgetLimit(id, newLimit);
      console.log('📡 Resposta do ajuste de limite:', response);
      
      if (response.success && response.data) {
        console.log('✅ Limite ajustado com sucesso');
        setBudgets(prev => {
          const updated = prev.map(budget => 
            budget._id === id ? response.data! : budget
          );
          console.log('📊 Lista atualizada após ajuste de limite');
          return updated;
        });
        Alert.alert('Sucesso', 'Limite ajustado com sucesso!');
      } else {
        console.log('❌ Erro no ajuste de limite:', response.message);
        Alert.alert('Erro', response.message || 'Erro ao ajustar limite');
      }
    } catch (err: any) {
      console.error('❌ Erro ao ajustar limite:', err);
      Alert.alert('Erro', err.message || 'Erro ao ajustar limite');
    }
  }, []);

  // Carregar orçamentos ao montar o componente
  useEffect(() => {
    console.log('🎯 useBudgets - useEffect disparado, carregando orçamentos...');
    loadBudgets();
  }, [loadBudgets]);

  // Log do estado atual sempre que mudar
  useEffect(() => {
    console.log('📊 useBudgets - Estado atual:');
    console.log('  - budgets.length:', budgets.length);
    console.log('  - loading:', loading);
    console.log('  - refreshing:', refreshing);
    console.log('  - error:', error);
    
    if (budgets.length > 0) {
      console.log('  - primeiros orçamentos:', budgets.slice(0, 2));
    }
  }, [budgets, loading, refreshing, error]);

  return {
    budgets,
    loading,
    refreshing,
    error,
    refresh,
    deleteBudget,
    adjustBudgetLimit,
  };
};