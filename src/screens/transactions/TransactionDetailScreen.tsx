// src/screens/transactions/TransactionDetailScreen.tsx - VERSÃO CORRIGIDA
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';

import { TransactionService } from '../../services/TransactionService';
import { Transaction } from '../../types';
import { formatCurrency, formatDate } from '../../utils';
import { Loading, Card } from '../../components/common';
import { COLORS, FONTS, FONT_SIZES, SPACING, BORDER_RADIUS, SHADOWS } from '../../constants';

type TransactionStackParamList = {
  TransactionDetails: { transactionId: string };
  EditTransaction: { transactionId: string };
};

interface TransactionDetailScreenProps {
  navigation: NativeStackNavigationProp<TransactionStackParamList>;
  route: RouteProp<TransactionStackParamList, 'TransactionDetails'>;
}

export const TransactionDetailScreen: React.FC<TransactionDetailScreenProps> = ({ 
  navigation, 
  route 
}) => {
  const { transactionId } = route.params;
  const [transaction, setTransaction] = useState<Transaction | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    console.log('🔍 TransactionDetailScreen - Parâmetros recebidos:', { transactionId });
    
    if (!transactionId || transactionId === 'undefined' || transactionId === 'null') {
      console.error('❌ ID da transação inválido:', transactionId);
      Alert.alert('Erro', 'ID da transação inválido', [
        { text: 'OK', onPress: () => navigation.goBack() }
      ]);
      return;
    }
    
    loadTransaction();
  }, [transactionId]);

  const loadTransaction = async () => {
    try {
      console.log('📡 Carregando transação com ID:', transactionId);
      setLoading(true);
      setError(null);
      
      const response = await TransactionService.getTransaction(transactionId);
      console.log('📊 Resposta do getTransaction:', JSON.stringify(response, null, 2));
      
      if (response.success && response.data) {
        console.log('✅ Transação carregada com sucesso:', response.data);
        setTransaction(response.data);
      } else {
        console.error('❌ Erro na resposta:', response.message);
        setError(response.message || 'Transação não encontrada');
        Alert.alert('Erro', 'Transação não encontrada', [
          { text: 'OK', onPress: () => navigation.goBack() }
        ]);
      }
    } catch (error: any) {
      console.error('❌ Erro ao carregar transação:', error);
      setError(error.message || 'Erro ao carregar transação');
      Alert.alert('Erro', error.message || 'Erro ao carregar transação', [
        { text: 'OK', onPress: () => navigation.goBack() }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = () => {
    if (!transaction) {
      Alert.alert('Erro', 'Transação não carregada');
      return;
    }

    console.log('✏️ Editando transação:', transaction._id || transaction.id);
    
    // Usar _id primeiro, depois id como fallback
    const idToUse = transaction._id || transaction.id;
    
    if (!idToUse) {
      Alert.alert('Erro', 'ID da transação não encontrado');
      return;
    }
    
    navigation.navigate('EditTransaction', { transactionId: idToUse });
  };

  const handleDelete = () => {
    if (!transaction) {
      Alert.alert('Erro', 'Transação não carregada');
      return;
    }

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
              const idToUse = transaction._id || transaction.id;
              console.log('🗑️ Deletando transação:', idToUse);
              
              await TransactionService.deleteTransaction(idToUse);
              Alert.alert('Sucesso', 'Transação excluída com sucesso!', [
                { text: 'OK', onPress: () => navigation.goBack() }
              ]);
            } catch (error: any) {
              console.error('❌ Erro ao excluir transação:', error);
              Alert.alert('Erro', error.message || 'Erro ao excluir transação');
            }
          },
        },
      ]
    );
  };

  // Função para obter nome da categoria de forma segura
  const getCategoryName = (): string => {
    if (!transaction?.category) return 'Sem categoria';
    
    if (typeof transaction.category === 'string') {
      return transaction.category || 'Sem categoria';
    }
    
    if (typeof transaction.category === 'object') {
      return transaction.category.name || 'Sem categoria';
    }
    
    return 'Sem categoria';
  };

  // Função para obter ícone da categoria de forma segura
  const getCategoryIcon = (): string => {
    if (!transaction?.category) return '📝';
    
    if (typeof transaction.category === 'object') {
      return transaction.category.icon || '📝';
    }
    
    return '📝';
  };

  const getBudgetInfo = (): { hasBudget: false } | { 
    hasBudget: true; 
    budgetName: string; 
    spent: number; 
    limit: number; 
    isOverBudget: boolean; 
    remaining: number; 
  } => {
    if (!transaction) return { hasBudget: false };
    
    if (transaction.budgetId && typeof transaction.budgetId === 'object') {
      const spent = transaction.budgetId.spent || 0;
      const limit = transaction.budgetId.monthlyLimit || 0;
      const remaining = limit - spent;
      
      return {
        hasBudget: true,
        budgetName: transaction.budgetId.name || 'Orçamento',
        spent,
        limit,
        isOverBudget: transaction.budgetId.isOverBudget || false,
        remaining,
      };
    }
    return { hasBudget: false };
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color={COLORS.white} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Detalhes da Transação</Text>
          <View style={styles.headerActions} />
        </View>
        <Loading />
      </SafeAreaView>
    );
  }

  if (error || !transaction) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color={COLORS.white} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Detalhes da Transação</Text>
          <View style={styles.headerActions} />
        </View>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>
            {error || 'Transação não encontrada'}
          </Text>
          <TouchableOpacity style={styles.retryButton} onPress={loadTransaction}>
            <Text style={styles.retryButtonText}>Tentar novamente</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const budgetInfo = getBudgetInfo();

  // Log para debug - remover em produção
  console.log('🎯 Dados da transação para exibição:', {
    amount: transaction.amount,
    description: transaction.description,
    category: transaction.category,
    type: transaction.type
  });

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={COLORS.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Detalhes da Transação</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity style={styles.headerButton} onPress={handleEdit}>
            <Ionicons name="create-outline" size={24} color={COLORS.white} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.headerButton} onPress={handleDelete}>
            <Ionicons name="trash-outline" size={24} color={COLORS.white} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Card Principal - Valor e Tipo */}
        <Card style={styles.mainCard}>
          <View style={styles.transactionMainInfo}>
            <View style={[
              styles.typeIconLarge,
              { backgroundColor: transaction.type === 'income' ? COLORS.success + '20' : COLORS.error + '20' }
            ]}>
              <Ionicons
                name={transaction.type === 'income' ? 'arrow-up' : 'arrow-down'}
                size={32}
                color={transaction.type === 'income' ? COLORS.success : COLORS.error}
              />
            </View>
            
            <Text style={styles.transactionType}>
              {transaction.type === 'income' ? 'Receita' : 'Despesa'}
            </Text>
            
            <Text style={[
              styles.transactionAmountLarge,
              { color: transaction.type === 'income' ? COLORS.success : COLORS.error }
            ]}>
              {transaction.type === 'income' ? '+' : '-'} {formatCurrency(transaction.amount || 0)}
            </Text>

            <Text style={styles.transactionDescription}>
              {transaction.description || 'Sem descrição'}
            </Text>

            {transaction.isRecurring && (
              <View style={styles.recurringBadgeLarge}>
                <Ionicons name="refresh" size={16} color={COLORS.info} />
                <Text style={styles.recurringTextLarge}>Transação Recorrente</Text>
              </View>
            )}
          </View>
        </Card>

        {/* Card de Informações Detalhadas */}
        <Card style={styles.detailCard}>
          <Text style={styles.sectionTitle}>Informações</Text>
          
          {/* Categoria */}
          <View style={styles.detailRow}>
            <View style={styles.detailIcon}>
              <Text style={styles.categoryEmoji}>
                {getCategoryIcon()}
              </Text>
            </View>
            <View style={styles.detailContent}>
              <Text style={styles.detailLabel}>Categoria</Text>
              <Text style={styles.detailValue}>
                {getCategoryName()}
              </Text>
            </View>
          </View>

          {/* Data */}
          <View style={styles.detailRow}>
            <View style={styles.detailIcon}>
              <Ionicons name="calendar-outline" size={20} color={COLORS.primary} />
            </View>
            <View style={styles.detailContent}>
              <Text style={styles.detailLabel}>Data da transação</Text>
              <Text style={styles.detailValue}>
                {new Date(transaction.date).toLocaleDateString('pt-BR', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                  weekday: 'long'
                })}
              </Text>
            </View>
          </View>

          {/* Observações */}
          {transaction.notes && (
            <View style={styles.detailRow}>
              <View style={styles.detailIcon}>
                <Ionicons name="chatbubble-outline" size={20} color={COLORS.primary} />
              </View>
              <View style={styles.detailContent}>
                <Text style={styles.detailLabel}>Observações</Text>
                <Text style={styles.detailValue}>{transaction.notes}</Text>
              </View>
            </View>
          )}
        </Card>

        {/* Card do Orçamento - se existir */}
        {budgetInfo.hasBudget && (
          <Card style={styles.budgetCard}>
            <View style={styles.budgetHeader}>
              <View style={styles.budgetIconContainer}>
                <Ionicons name="wallet" size={24} color={COLORS.primary} />
              </View>
              <View style={styles.budgetTitleContainer}>
                <Text style={styles.budgetTitle}>Orçamento Associado</Text>
                <Text style={styles.budgetName}>{budgetInfo.budgetName}</Text>
              </View>
              {budgetInfo.isOverBudget && (
                <View style={styles.overBudgetBadge}>
                  <Text style={styles.overBudgetText}>Excedido</Text>
                </View>
              )}
            </View>

            <View style={styles.budgetProgress}>
              <View style={styles.budgetValues}>
                <View style={styles.budgetValueItem}>
                  <Text style={styles.budgetValueLabel}>Gasto</Text>
                  <Text style={[styles.budgetValueAmount, { color: COLORS.error }]}>
                    {formatCurrency(budgetInfo.spent)}
                  </Text>
                </View>
                <View style={styles.budgetValueItem}>
                  <Text style={styles.budgetValueLabel}>Limite</Text>
                  <Text style={styles.budgetValueAmount}>
                    {formatCurrency(budgetInfo.limit)}
                  </Text>
                </View>
                <View style={styles.budgetValueItem}>
                  <Text style={styles.budgetValueLabel}>
                    {budgetInfo.remaining >= 0 ? 'Restante' : 'Excesso'}
                  </Text>
                  <Text style={[
                    styles.budgetValueAmount,
                    { color: budgetInfo.remaining >= 0 ? COLORS.success : COLORS.error }
                  ]}>
                    {formatCurrency(Math.abs(budgetInfo.remaining))}
                  </Text>
                </View>
              </View>

              <View style={styles.progressBarSection}>
                <View style={styles.progressInfo}>
                  <Text style={styles.progressLabel}>
                    {((budgetInfo.spent / budgetInfo.limit) * 100).toFixed(1)}% utilizado
                  </Text>
                </View>
                <View style={styles.progressBarContainer}>
                  <View 
                    style={[
                      styles.progressBar,
                      { 
                        width: `${Math.min((budgetInfo.spent / budgetInfo.limit) * 100, 100)}%`,
                        backgroundColor: budgetInfo.isOverBudget ? COLORS.error : COLORS.primary
                      }
                    ]} 
                  />
                </View>
              </View>
            </View>
          </Card>
        )}

        {/* Card de Metadados */}
        <Card style={styles.metaCard}>
          <Text style={styles.sectionTitle}>Informações do Sistema</Text>
          
          <View style={styles.detailRow}>
            <View style={styles.detailIcon}>
              <Ionicons name="time-outline" size={20} color={COLORS.gray500} />
            </View>
            <View style={styles.detailContent}>
              <Text style={styles.detailLabel}>Criado em</Text>
              <Text style={styles.detailValue}>
                {new Date(transaction.createdAt || transaction.date).toLocaleString('pt-BR')}
              </Text>
            </View>
          </View>

          {transaction.updatedAt && transaction.updatedAt !== transaction.createdAt && (
            <View style={styles.detailRow}>
              <View style={styles.detailIcon}>
                <Ionicons name="pencil-outline" size={20} color={COLORS.gray500} />
              </View>
              <View style={styles.detailContent}>
                <Text style={styles.detailLabel}>Última modificação</Text>
                <Text style={styles.detailValue}>
                  {new Date(transaction.updatedAt).toLocaleString('pt-BR')}
                </Text>
              </View>
            </View>
          )}

          {/* Debug info - remover em produção */}
          <View style={styles.detailRow}>
            <View style={styles.detailIcon}>
              <Ionicons name="code-outline" size={20} color={COLORS.gray500} />
            </View>
            <View style={styles.detailContent}>
              <Text style={styles.detailLabel}>ID da Transação</Text>
              <Text style={styles.detailValue}>
                {transaction._id || transaction.id || 'Não encontrado'}
              </Text>
            </View>
          </View>
        </Card>
      </ScrollView>

      {/* Botões de Ação Fixos */}
      <View style={styles.actionBar}>
        <TouchableOpacity style={styles.editButton} onPress={handleEdit}>
          <Ionicons name="create" size={20} color={COLORS.white} />
          <Text style={styles.actionButtonText}>Editar</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.deleteButton} onPress={handleDelete}>
          <Ionicons name="trash" size={20} color={COLORS.white} />
          <Text style={styles.actionButtonText}>Excluir</Text>
        </TouchableOpacity>
      </View>
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
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    backgroundColor: COLORS.primary,
    ...SHADOWS.sm,
  },
  headerTitle: {
    fontSize: FONT_SIZES.lg,
    fontFamily: FONTS.bold,
    color: COLORS.white,
    flex: 1,
    textAlign: 'center',
  },
  headerActions: {
    flexDirection: 'row',
  },
  headerButton: {
    padding: SPACING.xs,
    marginLeft: SPACING.sm,
  },
  content: {
    flex: 1,
    padding: SPACING.md,
  },
  
  // Card Principal
  mainCard: {
    marginBottom: SPACING.md,
    alignItems: 'center',
    padding: SPACING.xl,
  },
  transactionMainInfo: {
    alignItems: 'center',
  },
  typeIconLarge: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  transactionType: {
    fontSize: FONT_SIZES.md,
    fontFamily: FONTS.medium,
    color: COLORS.gray600,
    marginBottom: SPACING.xs,
  },
  transactionAmountLarge: {
    fontSize: 32,
    fontFamily: FONTS.bold,
    marginBottom: SPACING.md,
  },
  transactionDescription: {
    fontSize: FONT_SIZES.lg,
    fontFamily: FONTS.bold,
    color: COLORS.gray900,
    textAlign: 'center',
    marginBottom: SPACING.sm,
  },
  recurringBadgeLarge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.info + '20',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.full,
    marginTop: SPACING.sm,
  },
  recurringTextLarge: {
    fontSize: FONT_SIZES.sm,
    fontFamily: FONTS.medium,
    color: COLORS.info,
    marginLeft: SPACING.xs,
  },

  // Cards de Detalhes
  detailCard: {
    marginBottom: SPACING.md,
    padding: SPACING.lg,
  },
  sectionTitle: {
    fontSize: FONT_SIZES.lg,
    fontFamily: FONTS.bold,
    color: COLORS.gray900,
    marginBottom: SPACING.lg,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: SPACING.lg,
  },
  detailIcon: {
    width: 40,
    height: 40,
    backgroundColor: COLORS.primary + '10',
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
  },
  categoryEmoji: {
    fontSize: 20,
  },
  detailContent: {
    flex: 1,
    justifyContent: 'center',
  },
  detailLabel: {
    fontSize: FONT_SIZES.sm,
    fontFamily: FONTS.medium,
    color: COLORS.gray600,
    marginBottom: 2,
  },
  detailValue: {
    fontSize: FONT_SIZES.md,
    fontFamily: FONTS.regular,
    color: COLORS.gray900,
    lineHeight: 22,
  },

  // Card do Orçamento
  budgetCard: {
    marginBottom: SPACING.md,
    padding: SPACING.lg,
  },
  budgetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  budgetIconContainer: {
    width: 50,
    height: 50,
    backgroundColor: COLORS.primary + '20',
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
  },
  budgetTitleContainer: {
    flex: 1,
  },
  budgetTitle: {
    fontSize: FONT_SIZES.sm,
    fontFamily: FONTS.medium,
    color: COLORS.gray600,
    marginBottom: 2,
  },
  budgetName: {
    fontSize: FONT_SIZES.md,
    fontFamily: FONTS.bold,
    color: COLORS.gray900,
  },
  overBudgetBadge: {
    backgroundColor: COLORS.error + '20',
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
    borderRadius: BORDER_RADIUS.sm,
  },
  overBudgetText: {
    fontSize: FONT_SIZES.xs,
    fontFamily: FONTS.bold,
    color: COLORS.error,
  },
  budgetProgress: {
    marginTop: SPACING.md,
  },
  budgetValues: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: SPACING.md,
  },
  budgetValueItem: {
    alignItems: 'center',
    flex: 1,
  },
  budgetValueLabel: {
    fontSize: FONT_SIZES.xs,
    fontFamily: FONTS.medium,
    color: COLORS.gray600,
    marginBottom: 4,
  },
  budgetValueAmount: {
    fontSize: FONT_SIZES.md,
    fontFamily: FONTS.bold,
    color: COLORS.gray900,
  },
  progressBarSection: {
    marginTop: SPACING.sm,
  },
  progressInfo: {
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  progressLabel: {
    fontSize: FONT_SIZES.sm,
    fontFamily: FONTS.medium,
    color: COLORS.gray700,
  },
  progressBarContainer: {
    height: 8,
    backgroundColor: COLORS.gray200,
    borderRadius: BORDER_RADIUS.sm,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    borderRadius: BORDER_RADIUS.sm,
  },

  // Card de Metadados
  metaCard: {
    marginBottom: SPACING.xl,
    padding: SPACING.lg,
  },

  // Botões de Ação
  actionBar: {
    flexDirection: 'row',
    padding: SPACING.md,
    backgroundColor: COLORS.white,
    borderTopWidth: 1,
    borderTopColor: COLORS.gray200,
    ...SHADOWS.sm,
  },
  editButton: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    paddingVertical: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    marginRight: SPACING.sm,
  },
  deleteButton: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.error,
    paddingVertical: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    marginLeft: SPACING.sm,
  },
  actionButtonText: {
    fontSize: FONT_SIZES.md,
    fontFamily: FONTS.bold,
    color: COLORS.white,
    marginLeft: SPACING.xs,
  },
  
  // Estados de erro
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.xl,
  },
  errorText: {
    fontSize: FONT_SIZES.lg,
    fontFamily: FONTS.medium,
    color: COLORS.gray600,
    textAlign: 'center',
    marginBottom: SPACING.lg,
  },
  retryButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
  },
  retryButtonText: {
    fontSize: FONT_SIZES.md,
    fontFamily: FONTS.bold,
    color: COLORS.white,
  },
});