// src/screens/transactions/TransactionListScreen.tsx - VERSÃO COMPLETA ATUALIZADA
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
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { useTransactions } from '../../hooks/useTransactions';
import { TransactionService } from '../../services/TransactionService';
import apiService from '../../services/api';
import { Loading, Card } from '../../components/common';
import { COLORS, FONTS, FONT_SIZES, SPACING, BORDER_RADIUS, SHADOWS } from '../../constants';
import { Transaction } from '../../types';

// Types para navegação
type TransactionStackParamList = {
  TransactionList: undefined;
  CreateTransaction: undefined;
  EditTransaction: { transactionId: string };
  TransactionDetails: { transactionId: string };
};

interface TransactionListScreenProps {
  navigation: NativeStackNavigationProp<TransactionStackParamList>;
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
              await deleteTransaction(transaction._id); // ✅ CORRIGIDO - usar _id
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
    navigation.navigate('TransactionDetails', { transactionId: transaction._id });
  };

  // Função para navegar para edição
  const handleEditTransaction = (transaction: Transaction) => {
    navigation.navigate('EditTransaction', { transactionId: transaction._id });
  };

  // Renderizar item da lista - VERSÃO MELHORADA COM BUDGET
  const renderTransactionItem = ({ item }: { item: Transaction }) => {
    const getBudgetInfo = () => {
      // Se a transação tem budget associado
      if (item.budgetId && typeof item.budgetId === 'object') {
        return {
          hasBudget: true,
          budgetName: item.budgetId.name || 'Orçamento',
          categoryName: item.budgetId.category?.name || item.category?.name || 'Sem categoria',
          isOverBudget: item.budgetId.isOverBudget || false,
          spent: item.budgetId.spent || 0,
          limit: item.budgetId.monthlyLimit || 0,
        };
      }
      return {
        hasBudget: false,
        categoryName: item.category?.name || 'Sem categoria',
      };
    };

    const budgetInfo = getBudgetInfo();

    return (
      <TouchableOpacity
        style={styles.transactionItem}
        onPress={() => handleViewTransaction(item)}
        activeOpacity={0.7}
      >
        <Card style={styles.transactionCard}>
          <View style={styles.transactionHeader}>
            <View style={styles.transactionInfo}>
              {/* Ícone da categoria/tipo */}
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
                
                {/* Categoria */}
                <Text style={styles.transactionCategory} numberOfLines={1}>
                  {budgetInfo.categoryName}
                </Text>
                
                {/* NOVA SEÇÃO: Informação do orçamento se existir */}
                {budgetInfo.hasBudget && (
                  <View style={styles.budgetInfo}>
                    <Ionicons 
                      name="wallet-outline" 
                      size={12} 
                      color={budgetInfo.isOverBudget ? COLORS.error : COLORS.primary} 
                    />
                    <Text style={[
                      styles.budgetText,
                      { color: budgetInfo.isOverBudget ? COLORS.error : COLORS.primary }
                    ]} numberOfLines={1}>
                      {budgetInfo.budgetName}
                    </Text>
                    {budgetInfo.isOverBudget && (
                      <View style={styles.overBudgetBadge}>
                        <Text style={styles.overBudgetText}>Excedido</Text>
                      </View>
                    )}
                  </View>
                )}
                
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
              
              {/* NOVA SEÇÃO: Badges e progresso do orçamento */}
              <View style={styles.badges}>
                {item.isRecurring && (
                  <View style={styles.recurringBadge}>
                    <Ionicons name="refresh" size={12} color={COLORS.info} />
                    <Text style={styles.recurringText}>Recorrente</Text>
                  </View>
                )}
                
                {/* Mostrar progresso do orçamento se aplicável */}
                {budgetInfo.hasBudget && item.type === 'expense' && (
                  <View style={styles.budgetProgress}>
                    <Text style={styles.budgetProgressText}>
                      {formatCurrency(budgetInfo.spent || 0)} / {formatCurrency(budgetInfo.limit || 0)}
                    </Text>
                    <View style={styles.progressBarContainer}>
                      <View 
                        style={[
                          styles.progressBar,
                          { 
                            width: `${Math.min(((budgetInfo.spent || 0) / (budgetInfo.limit || 1)) * 100, 100)}%`,
                            backgroundColor: budgetInfo.isOverBudget ? COLORS.error : COLORS.primary
                          }
                        ]} 
                      />
                    </View>
                  </View>
                )}
              </View>
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
  };

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
    ...SHADOWS.sm,
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
  listContainer: {
    padding: SPACING.md,
  },
  
  // Estilos dos itens de transação
  transactionItem: {
    marginBottom: SPACING.sm,
  },
  transactionCard: {
    padding: SPACING.md,
  },
  transactionHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: SPACING.sm,
  },
  transactionInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  categoryIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.sm,
  },
  transactionDetails: {
    flex: 1,
  },
  transactionDescription: {
    fontSize: FONT_SIZES.md,
    fontFamily: FONTS.bold,
    color: COLORS.gray900,
    marginBottom: 2,
  },
  transactionCategory: {
    fontSize: FONT_SIZES.sm,
    fontFamily: FONTS.medium,
    color: COLORS.gray600,
    marginBottom: 2,
  },
  transactionDate: {
    fontSize: FONT_SIZES.xs,
    fontFamily: FONTS.regular,
    color: COLORS.gray500,
  },
  transactionAmount: {
    alignItems: 'flex-end',
  },
  amountText: {
    fontSize: FONT_SIZES.lg,
    fontFamily: FONTS.bold,
  },

  // NOVOS ESTILOS PARA INFORMAÇÕES DO ORÇAMENTO
  budgetInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
    marginBottom: 2,
  },
  budgetText: {
    fontSize: FONT_SIZES.xs,
    fontFamily: FONTS.medium,
    marginLeft: 4,
    flex: 1,
  },
  overBudgetBadge: {
    backgroundColor: COLORS.error + '20',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: BORDER_RADIUS.sm,
    marginLeft: 4,
  },
  overBudgetText: {
    fontSize: FONT_SIZES.xs,
    fontFamily: FONTS.bold,
    color: COLORS.error,
  },
  
  // Badges e progresso
  badges: {
    alignItems: 'flex-end',
    marginTop: 4,
  },
  recurringBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.info + '20',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: BORDER_RADIUS.sm,
    marginBottom: 4,
  },
  recurringText: {
    fontSize: FONT_SIZES.xs,
    fontFamily: FONTS.medium,
    color: COLORS.info,
    marginLeft: 2,
  },
  budgetProgress: {
    alignItems: 'flex-end',
    marginTop: 4,
  },
  budgetProgressText: {
    fontSize: FONT_SIZES.xs,
    fontFamily: FONTS.medium,
    color: COLORS.gray600,
  },
  progressBarContainer: {
    width: 60,
    height: 3,
    backgroundColor: COLORS.gray200,
    borderRadius: BORDER_RADIUS.sm,
    marginTop: 2,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    borderRadius: BORDER_RADIUS.sm,
  },

  // Botões de ação
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
    paddingVertical: SPACING.xs,
    paddingHorizontal: SPACING.sm,
    borderRadius: BORDER_RADIUS.sm,
    marginLeft: SPACING.sm,
  },
  editButton: {
    backgroundColor: COLORS.info + '20',
  },
  editButtonText: {
    fontSize: FONT_SIZES.sm,
    fontFamily: FONTS.medium,
    color: COLORS.info,
    marginLeft: 4,
  },
  deleteButton: {
    backgroundColor: COLORS.error + '20',
  },
  deleteButtonText: {
    fontSize: FONT_SIZES.sm,
    fontFamily: FONTS.medium,
    color: COLORS.error,
    marginLeft: 4,
  },

  // Estados vazios e erros
  emptyStateContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: SPACING.xl,
  },
  emptyStateIcon: {
    marginBottom: SPACING.lg,
  },
  emptyStateTitle: {
    fontSize: FONT_SIZES.lg,
    fontFamily: FONTS.bold,
    color: COLORS.gray700,
    textAlign: 'center',
    marginBottom: SPACING.sm,
  },
  emptyStateDescription: {
    fontSize: FONT_SIZES.md,
    fontFamily: FONTS.regular,
    color: COLORS.gray500,
    textAlign: 'center',
    marginBottom: SPACING.lg,
  },
  emptyStateButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
  },
  emptyStateButtonText: {
    fontSize: FONT_SIZES.md,
    fontFamily: FONTS.bold,
    color: COLORS.white,
  },
  footerLoader: {
    paddingVertical: SPACING.lg,
    alignItems: 'center',
  },
  errorContainer: {
    backgroundColor: COLORS.error + '10',
    padding: SPACING.md,
    margin: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.error + '30',
  },
  errorText: {
    fontSize: FONT_SIZES.sm,
    fontFamily: FONTS.medium,
    color: COLORS.error,
    textAlign: 'center',
    marginBottom: SPACING.sm,
  },
  retryButton: {
    backgroundColor: COLORS.error,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.sm,
    alignSelf: 'center',
  },
  retryText: {
    fontSize: FONT_SIZES.sm,
    fontFamily: FONTS.bold,
    color: COLORS.white,
  },
});