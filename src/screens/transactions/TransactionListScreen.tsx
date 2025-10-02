// src/screens/transactions/TransactionListScreen.tsx - COM TOAST E CONFIRM
import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { useTransactions, useToast, useConfirm } from '../../hooks';
import { Transaction } from '../../types';
import { formatCurrency, formatDate } from '../../utils';
import { Card, Loading, Toast, ConfirmDialog } from '../../components/common';
import { COLORS, FONTS, FONT_SIZES, SPACING, BORDER_RADIUS, SHADOWS } from '../../constants';
import { TransactionStackParamList } from '../../navigation/TransactionNavigator';

type NavigationProp = NativeStackNavigationProp<TransactionStackParamList, 'TransactionList'>;

interface Props {
  navigation: NavigationProp;
}

export const TransactionListScreen: React.FC<Props> = ({ navigation }) => {
  const { transactions, loading, error, refresh, deleteTransaction } = useTransactions();
  const [refreshing, setRefreshing] = useState(false);

  // Hooks de feedback
  const { toast, success, error: showError, hideToast } = useToast();
  const { confirm, confirmDelete } = useConfirm();

  const isEmpty = !loading && transactions.length === 0;

  // Função para refresh
  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await refresh();
    } finally {
      setRefreshing(false);
    }
  };

  // Função para deletar transação COM FEEDBACK
  const handleDeleteTransaction = (transaction: Transaction) => {
    confirmDelete(transaction.description, async () => {
      try {
        await deleteTransaction(transaction._id);
        success('Transação excluída com sucesso!', {
          label: 'Desfazer',
          onPress: () => {
            // Aqui você poderia implementar lógica de desfazer
            showError('Função desfazer em desenvolvimento');
          },
        });
      } catch (err: any) {
        showError(err.message || 'Erro ao excluir transação');
      }
    });
  };

  // Renderizar item da lista
  const renderTransactionItem = ({ item }: { item: Transaction }) => {
    const categoryName = typeof item.category === 'string' 
      ? item.category 
      : (item.category?.name || 'Sem categoria');

    // Extrair informações do orçamento se houver
    const budgetInfo = item.budgetId && typeof item.budgetId === 'object' ? {
      name: item.budgetId.name || 'Orçamento',
      spent: item.budgetId.spent || 0,
      limit: item.budgetId.monthlyLimit || 0,
      isOverBudget: (item.budgetId.spent || 0) > (item.budgetId.monthlyLimit || 0),
    } : null;

    return (
      <TouchableOpacity
        style={styles.transactionItem}
        onPress={() => navigation.navigate('TransactionDetails', { transactionId: item._id })}
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
                {/* Linha 1: Nome da transação - Valor */}
                <View style={styles.transactionRow}>
                  <Text style={styles.transactionDescription} numberOfLines={1}>
                    {item.description}
                  </Text>
                  <Text
                    style={[
                      styles.amountText,
                      { color: item.type === 'income' ? COLORS.success : COLORS.error }
                    ]}
                  >
                    {item.type === 'income' ? '+' : '-'} {formatCurrency(item.amount)}
                  </Text>
                </View>

                {/* Linha 2: Categoria - Nome do orçamento */}
                <View style={styles.transactionRow}>
                  <Text style={styles.transactionCategory} numberOfLines={1}>
                    {categoryName}
                  </Text>
                  {budgetInfo && item.type === 'expense' && (
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
                        {budgetInfo.name}
                      </Text>
                    </View>
                  )}
                </View>

                {/* Linha 3: Data - Quanto do orçamento */}
                <View style={styles.transactionRow}>
                  <View style={styles.dateContainer}>
                    <Text style={styles.transactionDate}>
                      {formatDate(item.date)}
                    </Text>
                    {item.isRecurring && (
                      <View style={styles.recurringBadge}>
                        <Ionicons name="refresh" size={10} color={COLORS.info} />
                      </View>
                    )}
                  </View>
                  <View style={styles.budgetProgressContainer}>
                    {budgetInfo && item.type === 'expense' && (
                      <>
                        <Text style={styles.budgetProgressText}>
                          {formatCurrency(budgetInfo.spent)} / {formatCurrency(budgetInfo.limit)}
                        </Text>
                        {/* Barra de progresso do orçamento */}
                        <View style={styles.budgetProgressBar}>
                          <View 
                            style={[
                              styles.budgetProgressBar,
                              { 
                                width: `${Math.min((budgetInfo.spent / budgetInfo.limit) * 100, 100)}%`,
                                backgroundColor: budgetInfo.isOverBudget ? COLORS.error : COLORS.primary
                              }
                            ]} 
                          />
                        </View>
                      </>
                    )}
                  </View>
                </View>
              </View>
            </View>
          </View>

          <View style={styles.actionButtons}>
            <TouchableOpacity
              style={[styles.actionButton, styles.editButton]}
              onPress={() => navigation.navigate('EditTransaction', { transactionId: item._id })}
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

  // Loading state
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
      {/* Toast */}
      <Toast
        visible={toast.visible}
        message={toast.message}
        type={toast.type}
        onHide={hideToast}
        action={toast.action}
      />

      {/* Confirm Dialog */}
      <ConfirmDialog
        visible={confirm.visible}
        title={confirm.title}
        message={confirm.message}
        confirmText={confirm.confirmText}
        cancelText={confirm.cancelText}
        type={confirm.type}
        onConfirm={confirm.onConfirm}
        onCancel={confirm.onCancel}
      />

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

      {/* Lista */}
      {isEmpty ? (
        renderEmptyState()
      ) : (
        <FlatList
          data={transactions}
          renderItem={renderTransactionItem}
          keyExtractor={(item) => item._id}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              colors={[COLORS.primary]}
              tintColor={COLORS.primary}
            />
          }
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
    paddingVertical: SPACING.sm,
    backgroundColor: COLORS.white,
    ...SHADOWS.sm,
  },
  title: {
    fontSize: FONT_SIZES.xl,
    fontFamily: FONTS.bold,
    color: COLORS.textPrimary,
  },
  addButton: {
    backgroundColor: COLORS.primary,
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
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
    marginBottom: SPACING.md,
  },
  transactionInfo: {
    flexDirection: 'row',
    flex: 1,
  },
  categoryIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.sm,
  },
  transactionDetails: {
    flex: 1,
  },
  transactionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  transactionDescription: {
    fontSize: FONT_SIZES.md,
    fontFamily: FONTS.semibold,
    color: COLORS.textPrimary,
    flex: 1,
    marginRight: SPACING.sm,
  },
  amountText: {
    fontSize: FONT_SIZES.lg,
    fontFamily: FONTS.bold,
  },
  transactionCategory: {
    fontSize: FONT_SIZES.sm,
    fontFamily: FONTS.regular,
    color: COLORS.textSecondary,
    flex: 1,
    marginRight: SPACING.sm,
  },
  dateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  transactionDate: {
    fontSize: FONT_SIZES.xs,
    fontFamily: FONTS.regular,
    color: COLORS.textTertiary,
    marginRight: SPACING.xs,
  },
  recurringBadge: {
    backgroundColor: COLORS.info + '15',
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderRadius: BORDER_RADIUS.sm,
  },
  recurringText: {
    fontSize: FONT_SIZES.xs,
    fontFamily: FONTS.medium,
    color: COLORS.info,
    marginLeft: 4,
  },
  budgetInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  budgetText: {
    fontSize: FONT_SIZES.sm,
    fontFamily: FONTS.semibold,
    marginLeft: 4,
  },
  budgetProgressContainer: {
    alignItems: 'flex-end',
  },
  budgetProgressText: {
    fontSize: FONT_SIZES.xs,
    fontFamily: FONTS.medium,
    color: COLORS.textSecondary,
    marginBottom: 4,
  },
  budgetProgressBar: {
    width: 140,
    height: 4,
    backgroundColor: COLORS.gray200,
    borderRadius: 2,
    overflow: 'hidden',
  },
  actionButtons: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: COLORS.gray200,
    paddingTop: SPACING.sm,
    marginTop: SPACING.xs,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.md,
    marginHorizontal: 4,
  },
  editButton: {
    backgroundColor: COLORS.info + '15',
  },
  deleteButton: {
    backgroundColor: COLORS.error + '15',
  },
  editButtonText: {
    fontSize: FONT_SIZES.sm,
    fontFamily: FONTS.medium,
    color: COLORS.info,
    marginLeft: 4,
  },
  deleteButtonText: {
    fontSize: FONT_SIZES.sm,
    fontFamily: FONTS.medium,
    color: COLORS.error,
    marginLeft: 4,
  },
  emptyStateContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.xl,
  },
  emptyStateIcon: {
    marginBottom: SPACING.lg,
  },
  emptyStateTitle: {
    fontSize: FONT_SIZES.xl,
    fontFamily: FONTS.bold,
    color: COLORS.textPrimary,
    marginBottom: SPACING.sm,
    textAlign: 'center',
  },
  emptyStateDescription: {
    fontSize: FONT_SIZES.md,
    fontFamily: FONTS.regular,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: SPACING.xl,
  },
  emptyStateButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.md,
    borderRadius: BORDER_RADIUS.lg,
  },
  emptyStateButtonText: {
    fontSize: FONT_SIZES.md,
    fontFamily: FONTS.semibold,
    color: COLORS.white,
  },
});