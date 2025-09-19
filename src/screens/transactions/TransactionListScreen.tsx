// src/screens/transactions/TransactionListScreen.tsx - VERSÃO COMPLETA COM DEBUG
import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';

import { useTransactions } from '../../hooks/useTransactions';
import { TransactionService } from '../../services/TransactionService';
import apiService from '../../services/api';
import { Loading, Card } from '../../components/common';
import { COLORS, FONTS, FONT_SIZES, SPACING } from '../../constants';
import { Transaction } from '../../types';

interface TransactionListScreenProps {
  navigation: any;
}

// Função para formatar currency
const formatCurrency = (value: number): string => {
  if (isNaN(value) || value === null || value === undefined) {
    return 'R$ 0,00';
  }
  
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
};

// Função para formatar data
const formatDate = (dateString: string): string => {
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  } catch {
    return 'Data inválida';
  }
};

export const TransactionListScreen: React.FC<TransactionListScreenProps> = ({ navigation }) => {
  const {
    transactions,
    loading,
    error,
    fetchTransactions,
    deleteTransaction,
    refresh,
    loadMore,
    hasMore,
    isEmpty,
    pagination,
  } = useTransactions();

  // State local para controlar o refresh
  const [refreshing, setRefreshing] = useState(false);

  // FUNÇÃO DE DEBUG TEMPORÁRIA
  const debugAPI = async () => {
    console.log('=== INICIANDO DEBUG COMPLETO ===');
    
    try {
      // 1. Teste direto do apiService
      console.log('1. Testando apiService.getTransactions...');
      const apiResponse = await apiService.getTransactions({});
      console.log('📡 Resposta do apiService:', JSON.stringify(apiResponse, null, 2));

      // 2. Teste do TransactionService
      console.log('2. Testando TransactionService.getTransactions...');
      const serviceResponse = await TransactionService.getTransactions({});
      console.log('🔧 Resposta do TransactionService:', JSON.stringify(serviceResponse, null, 2));

      // 3. Teste de transações recentes
      console.log('3. Testando TransactionService.getRecentTransactions...');
      const recentResponse = await TransactionService.getRecentTransactions(5);
      console.log('📋 Transações recentes:', JSON.stringify(recentResponse, null, 2));

      // 4. Verificar estado atual do hook
      console.log('4. Estado atual do hook:');
      console.log('- transactions:', transactions.length, transactions);
      console.log('- loading:', loading);
      console.log('- error:', error);
      console.log('- pagination:', pagination);
      console.log('- isEmpty:', isEmpty);
      console.log('- hasMore:', hasMore);

      // 5. Testar criação de transação
      console.log('5. Testando criação de transação...');
      const testTransaction = {
        description: 'Teste Debug',
        amount: 100,
        type: 'expense' as const,
        category: 'test',
        date: new Date().toISOString(),
        isRecurring: false,
      };
      
      const createResponse = await TransactionService.createTransaction(testTransaction);
      console.log('➕ Resposta da criação:', JSON.stringify(createResponse, null, 2));

    } catch (err: any) {
      console.error('❌ Erro no debug:', err);
      Alert.alert('Erro no Debug', err.message);
    }
    
    console.log('=== FIM DEBUG ===');
  };

  // Carregar transações quando a tela recebe foco
  useFocusEffect(
    useCallback(() => {
      console.log('🔄 TransactionListScreen ganhou foco, carregando transações...');
      fetchTransactions();
    }, [fetchTransactions])
  );

  // Função para refresh
  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      console.log('🔃 Fazendo refresh das transações...');
      await refresh();
    } finally {
      setRefreshing(false);
    }
  };

  // Função para deletar transação
  const handleDeleteTransaction = (transaction: Transaction) => {
    Alert.alert(
      'Confirmar Exclusão',
      `Deseja realmente excluir a transação "${transaction.description}"?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Excluir',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteTransaction(transaction.id);
              Alert.alert('Sucesso', 'Transação excluída com sucesso!');
            } catch (error: any) {
              Alert.alert('Erro', error.message);
            }
          },
        },
      ]
    );
  };

  // Função para navegar para detalhes
  const handleViewTransaction = (transaction: Transaction) => {
    navigation.navigate('TransactionDetails', { transactionId: transaction.id });
  };

  // Função para navegar para edição
  const handleEditTransaction = (transaction: Transaction) => {
    navigation.navigate('EditTransaction', { transactionId: transaction.id });
  };

  // Renderizar item da lista
  const renderTransactionItem = ({ item }: { item: Transaction }) => (
    <TouchableOpacity
      style={styles.transactionItem}
      onPress={() => handleViewTransaction(item)}
      activeOpacity={0.7}
    >
      <Card style={styles.transactionCard}>
        <View style={styles.transactionHeader}>
          <View style={styles.transactionInfo}>
            <View style={[
              styles.categoryIcon,
              { backgroundColor: item.type === 'income' ? COLORS.success + '20' : COLORS.error + '20' }
            ]}>
              <Ionicons
                name={item.type === 'income' ? 'arrow-up' : 'arrow-down'}
                size={24}
                color={item.type === 'income' ? COLORS.success : COLORS.error}
              />
            </View>
            <View style={styles.transactionDetails}>
              <Text style={styles.transactionDescription} numberOfLines={1}>
                {item.description}
              </Text>
              <Text style={styles.transactionCategory} numberOfLines={1}>
                {item.category?.name || 'Sem categoria'}
              </Text>
              <Text style={styles.transactionDate}>
                {formatDate(item.date)}
              </Text>
            </View>
          </View>
          
          <View style={styles.transactionAmount}>
            <Text
              style={[
                styles.amountText,
                { color: item.type === 'income' ? COLORS.success : COLORS.error }
              ]}
            >
              {item.type === 'income' ? '+' : '-'} {formatCurrency(item.amount)}
            </Text>
            
            {item.isRecurring && (
              <View style={styles.recurringBadge}>
                <Ionicons name="refresh" size={12} color={COLORS.info} />
                <Text style={styles.recurringText}>Recorrente</Text>
              </View>
            )}
          </View>
        </View>

        {/* Botões de ação */}
        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={[styles.actionButton, styles.editButton]}
            onPress={() => handleEditTransaction(item)}
          >
            <Ionicons name="create" size={16} color={COLORS.info} />
            <Text style={styles.editButtonText}>Editar</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, styles.deleteButton]}
            onPress={() => handleDeleteTransaction(item)}
          >
            <Ionicons name="trash" size={16} color={COLORS.error} />
            <Text style={styles.deleteButtonText}>Excluir</Text>
          </TouchableOpacity>
        </View>
      </Card>
    </TouchableOpacity>
  );

  // Renderizar estado vazio
  const renderEmptyState = () => (
    <View style={styles.emptyStateContainer}>
      <View style={styles.emptyStateIcon}>
        <Ionicons name="document" size={64} color={COLORS.gray400} />
      </View>
      <Text style={styles.emptyStateTitle}>Nenhuma transação encontrada</Text>
      <Text style={styles.emptyStateDescription}>
        Comece criando sua primeira transação
      </Text>
      <TouchableOpacity
        style={styles.emptyStateButton}
        onPress={() => navigation.navigate('CreateTransaction')}
      >
        <Text style={styles.emptyStateButtonText}>Criar Transação</Text>
      </TouchableOpacity>
    </View>
  );

  // Renderizar footer para carregamento
  const renderFooter = () => {
    if (!loading || transactions.length === 0) return null;
    
    return (
      <View style={styles.footerLoader}>
        <Loading size="small" />
      </View>
    );
  };

  // Renderizar erro
  const renderError = () => {
    if (!error) return null;

    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity
          style={styles.retryButton}
          onPress={() => fetchTransactions()}
        >
          <Text style={styles.retryText}>Tentar Novamente</Text>
        </TouchableOpacity>
      </View>
    );
  };

  // Se está carregando e não tem transações
  if (loading && transactions.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Transações</Text>
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => navigation.navigate('CreateTransaction')}
          >
            <Ionicons name="add" size={24} color={COLORS.white} />
          </TouchableOpacity>
        </View>
        <Loading text="Carregando transações..." />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Transações</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => navigation.navigate('CreateTransaction')}
        >
          <Ionicons name="add" size={24} color={COLORS.white} />
        </TouchableOpacity>
      </View>

      {/* BOTÃO DE DEBUG TEMPORÁRIO - REMOVER DEPOIS */}
      <TouchableOpacity
        style={styles.debugButton}
        onPress={debugAPI}
      >
        <Text style={styles.debugButtonText}>
          DEBUG: Testar API
        </Text>
      </TouchableOpacity>

      {/* Info do estado atual */}
      <View style={styles.debugInfo}>
        <Text style={styles.debugText}>
          Transações: {transactions.length} | Loading: {loading ? 'SIM' : 'NÃO'} | Error: {error || 'NENHUM'}
        </Text>
      </View>

      {/* Erro */}
      {renderError()}

      {/* Lista de transações ou estado vazio */}
      {isEmpty && !loading ? (
        renderEmptyState()
      ) : (
        <FlatList
          data={transactions}
          keyExtractor={(item) => item.id || item._id}
          renderItem={renderTransactionItem}
          contentContainerStyle={styles.listContainer}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              colors={[COLORS.primary]}
            />
          }
          onEndReached={() => {
            if (hasMore && !loading) {
              loadMore();
            }
          }}
          onEndReachedThreshold={0.1}
          ListFooterComponent={renderFooter}
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    backgroundColor: COLORS.primary,
  },
  title: {
    fontSize: FONT_SIZES.xl,
    fontFamily: FONTS.bold,
    color: COLORS.white,
  },
  addButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.primaryDark,
    justifyContent: 'center',
    alignItems: 'center',
  },
  debugButton: {
    backgroundColor: 'red',
    padding: 10,
    margin: 10,
    borderRadius: 5,
    alignItems: 'center',
  },
  debugButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  debugInfo: {
    backgroundColor: 'yellow',
    padding: 8,
    marginHorizontal: 10,
    borderRadius: 5,
  },
  debugText: {
    color: 'black',
    fontSize: 12,
    textAlign: 'center',
  },
  listContainer: {
    padding: SPACING.md,
  },
  transactionItem: {
    marginBottom: SPACING.md,
  },
  transactionCard: {
    padding: SPACING.md,
  },
  transactionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: SPACING.sm,
  },
  transactionInfo: {
    flexDirection: 'row',
    flex: 1,
    alignItems: 'center',
  },
  categoryIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
  },
  transactionDetails: {
    flex: 1,
  },
  transactionDescription: {
    fontSize: FONT_SIZES.md,
    fontFamily: FONTS.medium,
    color: COLORS.textPrimary,
    marginBottom: 2,
  },
  transactionCategory: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    marginBottom: 2,
  },
  transactionDate: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textHint,
  },
  transactionAmount: {
    alignItems: 'flex-end',
  },
  amountText: {
    fontSize: FONT_SIZES.lg,
    fontFamily: FONTS.bold,
    marginBottom: SPACING.xs,
  },
  recurringBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.infoLight,
    paddingHorizontal: SPACING.xs,
    paddingVertical: 2,
    borderRadius: 12,
  },
  recurringText: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.info,
    marginLeft: 2,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: SPACING.sm,
    paddingTop: SPACING.sm,
    borderTopWidth: 1,
    borderTopColor: COLORS.gray200,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: 6,
    marginLeft: SPACING.sm,
  },
  editButton: {
    backgroundColor: COLORS.infoLight,
  },
  editButtonText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.info,
    marginLeft: 4,
  },
  deleteButton: {
    backgroundColor: COLORS.errorLight,
  },
  deleteButtonText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.error,
    marginLeft: 4,
  },
  footerLoader: {
    paddingVertical: SPACING.md,
    alignItems: 'center',
  },
  errorContainer: {
    backgroundColor: COLORS.errorLight,
    padding: SPACING.md,
    margin: SPACING.md,
    borderRadius: 8,
    alignItems: 'center',
  },
  errorText: {
    color: COLORS.error,
    fontSize: FONT_SIZES.sm,
    textAlign: 'center',
    marginBottom: SPACING.sm,
  },
  retryButton: {
    backgroundColor: COLORS.error,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: 6,
  },
  retryText: {
    color: COLORS.white,
    fontSize: FONT_SIZES.sm,
    fontFamily: FONTS.medium,
  },
  emptyStateContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: SPACING.xl,
  },
  emptyStateIcon: {
    marginBottom: SPACING.md,
  },
  emptyStateTitle: {
    fontSize: FONT_SIZES.xl,
    fontFamily: FONTS.bold,
    color: COLORS.textPrimary,
    textAlign: 'center',
    marginBottom: SPACING.sm,
  },
  emptyStateDescription: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: SPACING.xl,
  },
  emptyStateButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    borderRadius: 8,
  },
  emptyStateButtonText: {
    color: COLORS.white,
    fontSize: FONT_SIZES.md,
    fontFamily: FONTS.medium,
  },
});