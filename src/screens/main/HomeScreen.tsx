import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  Dimensions,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { Card, Loading, Badge, EmptyState } from '../../components/common';
import { useAuth } from '../../contexts/AuthContext';
import { TransactionService } from '../../services/TransactionService';
import { GoalService } from '../../services/GoalService';
import { BudgetService } from '../../services/BudgetService';
import { 
  COLORS, 
  FONTS, 
  FONT_SIZES, 
  SPACING, 
  BORDER_RADIUS,
  SHADOWS 
} from '../../constants';
import { 
  Transaction, 
  Goal, 
  Budget, 
  FinancialSummary 
} from '../../types';

const { width } = Dimensions.get('window');

interface HomeScreenProps {
  navigation: any;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({ navigation }) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [summary, setSummary] = useState<FinancialSummary | null>(null);
  const [recentTransactions, setRecentTransactions] = useState<Transaction[]>([]);
  const [activeGoals, setActiveGoals] = useState<Goal[]>([]);
  const [currentBudgets, setCurrentBudgets] = useState<Budget[]>([]);

  // Carregar dados iniciais
  const loadData = useCallback(async () => {
    try {
      const [summaryData, transactions, goals, budgets] = await Promise.all([
        TransactionService.getFinancialSummary(),
        TransactionService.getRecentTransactions(5),
        GoalService.getActiveGoals(3),
        BudgetService.getCurrentBudgets(3),
      ]);

      setSummary(summaryData);
      setRecentTransactions(transactions);
      setActiveGoals(goals);
      setCurrentBudgets(budgets);
    } catch (error: any) {
      console.error('Erro ao carregar dados:', error);
      Alert.alert('Erro', 'Não foi possível carregar os dados. Tente novamente.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  // Carregar dados ao focar na tela
  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  // Função de refresh
  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadData();
  }, [loadData]);

  // Função para formatar valor monetário
  const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  // Função para obter cor do saldo
  const getBalanceColor = (balance: number): string => {
    if (balance > 0) return COLORS.success;
    if (balance < 0) return COLORS.error;
    return COLORS.textSecondary;
  };

  // Renderizar cartão de resumo
  const renderSummaryCard = () => {
    if (!summary) return null;

    return (
      <Card style={styles.summaryCard}>
        <View style={styles.summaryHeader}>
          <Text style={styles.summaryTitle}>Resumo do Mês</Text>
          <TouchableOpacity onPress={() => navigation.navigate('Reports')}>
            <Ionicons name="analytics-outline" size={24} color={COLORS.primary} />
          </TouchableOpacity>
        </View>

        <View style={styles.balanceContainer}>
          <Text style={styles.balanceLabel}>Saldo Atual</Text>
          <Text style={[
            styles.balanceValue,
            { color: getBalanceColor(summary.balance) }
          ]}>
            {formatCurrency(summary.balance)}
          </Text>
        </View>

        <View style={styles.summaryRow}>
          <View style={styles.summaryItem}>
            <View style={[styles.summaryIcon, { backgroundColor: COLORS.success10 }]}>
              <Ionicons name="arrow-up" size={20} color={COLORS.success} />
            </View>
            <View style={styles.summaryDetails}>
              <Text style={styles.summaryItemLabel}>Receitas</Text>
              <Text style={[styles.summaryItemValue, { color: COLORS.success }]}>
                {formatCurrency(summary.income)}
              </Text>
              <Text style={styles.summaryItemCount}>
                {summary.incomeCount} transações
              </Text>
            </View>
          </View>

          <View style={styles.summaryItem}>
            <View style={[styles.summaryIcon, { backgroundColor: COLORS.error10 }]}>
              <Ionicons name="arrow-down" size={20} color={COLORS.error} />
            </View>
            <View style={styles.summaryDetails}>
              <Text style={styles.summaryItemLabel}>Despesas</Text>
              <Text style={[styles.summaryItemValue, { color: COLORS.error }]}>
                {formatCurrency(summary.expense)}
              </Text>
              <Text style={styles.summaryItemCount}>
                {summary.expenseCount} transações
              </Text>
            </View>
          </View>
        </View>
      </Card>
    );
  };

  // Renderizar ações rápidas
  const renderQuickActions = () => {
    const actions = [
      {
        icon: 'add-circle',
        label: 'Nova Transação',
        color: COLORS.primary,
        onPress: () => navigation.navigate('Transactions', { screen: 'CreateTransaction' }),
      },
      {
        icon: 'flag',
        label: 'Nova Meta',
        color: COLORS.secondary,
        onPress: () => navigation.navigate('Goals', { screen: 'CreateGoal' }),
      },
      {
        icon: 'pie-chart',
        label: 'Orçamento',
        color: COLORS.warning,
        onPress: () => navigation.navigate('Budgets', { screen: 'CreateBudget' }),
      },
      {
        icon: 'analytics',
        label: 'Relatórios',
        color: COLORS.info,
        onPress: () => navigation.navigate('Reports'),
      },
    ];

    return (
      <View style={styles.quickActionsContainer}>
        <Text style={styles.sectionTitle}>Ações Rápidas</Text>
        <View style={styles.quickActions}>
          {actions.map((action, index) => (
            <TouchableOpacity
              key={index}
              style={styles.quickAction}
              onPress={action.onPress}
            >
              <View style={[styles.quickActionIcon, { backgroundColor: `${action.color}20` }]}>
                <Ionicons name={action.icon as any} size={24} color={action.color} />
              </View>
              <Text style={styles.quickActionLabel}>{action.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    );
  };

  // Renderizar transações recentes
  const renderRecentTransactions = () => {
    return (
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Transações Recentes</Text>
          <TouchableOpacity onPress={() => navigation.navigate('Transactions')}>
            <Text style={styles.seeAllText}>Ver todas</Text>
          </TouchableOpacity>
        </View>

        {recentTransactions.length === 0 ? (
          <Card>
            <EmptyState
              icon="receipt-outline"
              title="Nenhuma transação"
              description="Comece criando sua primeira transação"
              actionText="Criar Transação"
              onAction={() => navigation.navigate('Transactions', { screen: 'CreateTransaction' })}
            />
          </Card>
        ) : (
          recentTransactions.map((transaction) => (
            <Card key={transaction._id} style={styles.transactionCard}>
              <TouchableOpacity
                style={styles.transactionItem}
                onPress={() => navigation.navigate('Transactions', {
                  screen: 'TransactionDetails',
                  params: { transactionId: transaction._id }
                })}
              >
                <View style={styles.transactionLeft}>
                  <View style={[
                    styles.transactionIcon,
                    { backgroundColor: transaction.type === 'income' ? COLORS.success10 : COLORS.error10 }
                  ]}>
                    <Ionicons
                      name={transaction.type === 'income' ? 'arrow-up' : 'arrow-down'}
                      size={20}
                      color={transaction.type === 'income' ? COLORS.success : COLORS.error}
                    />
                  </View>
                  <View style={styles.transactionDetails}>
                    <Text style={styles.transactionDescription}>
                      {transaction.description}
                    </Text>
                    <Text style={styles.transactionCategory}>
                      {transaction.category.name}
                    </Text>
                    <Text style={styles.transactionDate}>
                      {new Date(transaction.date).toLocaleDateString('pt-BR')}
                    </Text>
                  </View>
                </View>
                <Text style={[
                  styles.transactionAmount,
                  { color: transaction.type === 'income' ? COLORS.success : COLORS.error }
                ]}>
                  {transaction.type === 'expense' ? '- ' : '+ '}
                  {formatCurrency(transaction.amount)}
                </Text>
              </TouchableOpacity>
            </Card>
          ))
        )}
      </View>
    );
  };

  // Renderizar metas ativas
  const renderActiveGoals = () => {
    return (
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Metas Ativas</Text>
          <TouchableOpacity onPress={() => navigation.navigate('Goals')}>
            <Text style={styles.seeAllText}>Ver todas</Text>
          </TouchableOpacity>
        </View>

        {activeGoals.length === 0 ? (
          <Card>
            <EmptyState
              icon="flag-outline"
              title="Nenhuma meta ativa"
              description="Defina metas para organizar suas finanças"
              actionText="Criar Meta"
              onAction={() => navigation.navigate('Goals', { screen: 'CreateGoal' })}
            />
          </Card>
        ) : (
          activeGoals.map((goal) => (
            <Card key={goal._id} style={styles.goalCard}>
              <TouchableOpacity
                onPress={() => navigation.navigate('Goals', {
                  screen: 'GoalDetails',
                  params: { goalId: goal._id }
                })}
              >
                <View style={styles.goalHeader}>
                  <Text style={styles.goalTitle}>{goal.title}</Text>
                  <Badge text={`${goal.progress || 0}%`} variant="info" />
                </View>
                
                <View style={styles.goalProgress}>
                  <View style={styles.progressBar}>
                    <View style={[
                      styles.progressFill,
                      { width: `${Math.min(goal.progress || 0, 100)}%` }
                    ]} />
                  </View>
                </View>

                <View style={styles.goalFooter}>
                  <Text style={styles.goalAmount}>
                    {formatCurrency(goal.currentAmount)} / {formatCurrency(goal.targetAmount)}
                  </Text>
                  <Text style={styles.goalDays}>
                    {goal.daysRemaining || 0} dias restantes
                  </Text>
                </View>
              </TouchableOpacity>
            </Card>
          ))
        )}
      </View>
    );
  };

  // Renderizar orçamentos atuais
  const renderCurrentBudgets = () => {
    return (
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Orçamentos do Mês</Text>
          <TouchableOpacity onPress={() => navigation.navigate('Budgets')}>
            <Text style={styles.seeAllText}>Ver todos</Text>
          </TouchableOpacity>
        </View>

        {currentBudgets.length === 0 ? (
          <Card>
            <EmptyState
              icon="pie-chart-outline"
              title="Nenhum orçamento definido"
              description="Controle seus gastos com orçamentos"
              actionText="Criar Orçamento"
              onAction={() => navigation.navigate('Budgets', { screen: 'CreateBudget' })}
            />
          </Card>
        ) : (
          currentBudgets.map((budget) => (
            <Card key={budget._id} style={styles.budgetCard}>
              <TouchableOpacity
                onPress={() => navigation.navigate('Budgets', {
                  screen: 'BudgetDetails',
                  params: { budgetId: budget._id }
                })}
              >
                <View style={styles.budgetHeader}>
                  <Text style={styles.budgetName}>{budget.name}</Text>
                  <Badge 
                    text={budget.isOverBudget ? 'Excedido' : 'Normal'}
                    variant={budget.isOverBudget ? 'error' : 'success'}
                  />
                </View>

                <View style={styles.budgetProgress}>
                  <View style={styles.progressBar}>
                    <View style={[
                      styles.progressFill,
                      { 
                        width: `${Math.min(budget.usage || 0, 100)}%`,
                        backgroundColor: budget.isOverBudget ? COLORS.error : COLORS.primary
                      }
                    ]} />
                  </View>
                </View>

                <View style={styles.budgetFooter}>
                  <Text style={styles.budgetAmount}>
                    {formatCurrency(budget.spent)} / {formatCurrency(budget.monthlyLimit)}
                  </Text>
                  <Text style={[
                    styles.budgetRemaining,
                    { color: budget.isOverBudget ? COLORS.error : COLORS.success }
                  ]}>
                    {budget.isOverBudget 
                      ? `Excesso: ${formatCurrency(budget.overage || 0)}`
                      : `Restante: ${formatCurrency(budget.remaining || 0)}`
                    }
                  </Text>
                </View>
              </TouchableOpacity>
            </Card>
          ))
        )}
      </View>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <Loading text="Carregando painel..." />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[COLORS.primary]}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Olá, {user?.name?.split(' ')[0] || 'Usuário'}!</Text>
            <Text style={styles.subtitle}>Como estão suas finanças hoje?</Text>
          </View>
          <TouchableOpacity onPress={() => navigation.navigate('Profile')}>
            <View style={styles.avatar}>
              <Ionicons name="person" size={24} color={COLORS.white} />
            </View>
          </TouchableOpacity>
        </View>

        {/* Resumo financeiro */}
        {renderSummaryCard()}

        {/* Ações rápidas */}
        {renderQuickActions()}

        {/* Transações recentes */}
        {renderRecentTransactions()}

        {/* Metas ativas */}
        {renderActiveGoals()}

        {/* Orçamentos atuais */}
        {renderCurrentBudgets()}

        {/* Espaçamento final */}
        <View style={styles.bottomSpacing} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.lg,
    backgroundColor: COLORS.primary,
  },
  greeting: {
    fontSize: FONT_SIZES.xl,
    fontFamily: FONTS.bold,
    color: COLORS.white,
  },
  subtitle: {
    fontSize: FONT_SIZES.md,
    fontFamily: FONTS.regular,
    color: COLORS.white,
    opacity: 0.9,
    marginTop: SPACING.xs,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.primaryDark,
    justifyContent: 'center',
    alignItems: 'center',
  },
  summaryCard: {
    marginHorizontal: SPACING.md,
    marginTop: -SPACING.lg,
    ...SHADOWS.lg,
  },
  summaryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  summaryTitle: {
    fontSize: FONT_SIZES.lg,
    fontFamily: FONTS.bold,
    color: COLORS.textPrimary,
  },
  balanceContainer: {
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  balanceLabel: {
    fontSize: FONT_SIZES.sm,
    fontFamily: FONTS.regular,
    color: COLORS.textSecondary,
    marginBottom: SPACING.xs,
  },
  balanceValue: {
    fontSize: FONT_SIZES['3xl'],
    fontFamily: FONTS.bold,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  summaryItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: SPACING.xs,
  },
  summaryIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.sm,
  },
  summaryDetails: {
    flex: 1,
  },
  summaryItemLabel: {
    fontSize: FONT_SIZES.xs,
    fontFamily: FONTS.regular,
    color: COLORS.textSecondary,
  },
  summaryItemValue: {
    fontSize: FONT_SIZES.lg,
    fontFamily: FONTS.bold,
    marginVertical: 2,
  },
  summaryItemCount: {
    fontSize: FONT_SIZES.xs,
    fontFamily: FONTS.regular,
    color: COLORS.textTertiary,
  },
  quickActionsContainer: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.lg,
  },
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  quickAction: {
    alignItems: 'center',
    flex: 1,
    marginHorizontal: SPACING.xs,
  },
  quickActionIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  quickActionLabel: {
    fontSize: FONT_SIZES.xs,
    fontFamily: FONTS.medium,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  section: {
    paddingHorizontal: SPACING.md,
    marginBottom: SPACING.lg,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  sectionTitle: {
    fontSize: FONT_SIZES.lg,
    fontFamily: FONTS.bold,
    color: COLORS.textPrimary,
  },
  seeAllText: {
    fontSize: FONT_SIZES.sm,
    fontFamily: FONTS.medium,
    color: COLORS.primary,
  },
  transactionCard: {
    marginBottom: SPACING.sm,
  },
  transactionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  transactionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  transactionIcon: {
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
    fontFamily: FONTS.medium,
    color: COLORS.textPrimary,
  },
  transactionCategory: {
    fontSize: FONT_SIZES.sm,
    fontFamily: FONTS.regular,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  transactionDate: {
    fontSize: FONT_SIZES.xs,
    fontFamily: FONTS.regular,
    color: COLORS.textTertiary,
    marginTop: 2,
  },
  transactionAmount: {
    fontSize: FONT_SIZES.lg,
    fontFamily: FONTS.bold,
  },
  goalCard: {
    marginBottom: SPACING.sm,
  },
  goalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  goalTitle: {
    fontSize: FONT_SIZES.md,
    fontFamily: FONTS.medium,
    color: COLORS.textPrimary,
    flex: 1,
    marginRight: SPACING.sm,
  },
  goalProgress: {
    marginBottom: SPACING.sm,
  },
  progressBar: {
    height: 8,
    backgroundColor: COLORS.gray200,
    borderRadius: BORDER_RADIUS.full,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: COLORS.primary,
  },
  goalFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  goalAmount: {
    fontSize: FONT_SIZES.sm,
    fontFamily: FONTS.medium,
    color: COLORS.textPrimary,
  },
  goalDays: {
    fontSize: FONT_SIZES.sm,
    fontFamily: FONTS.regular,
    color: COLORS.textSecondary,
  },
  budgetCard: {
    marginBottom: SPACING.sm,
  },
  budgetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  budgetName: {
    fontSize: FONT_SIZES.md,
    fontFamily: FONTS.medium,
    color: COLORS.textPrimary,
    flex: 1,
    marginRight: SPACING.sm,
  },
  budgetProgress: {
    marginBottom: SPACING.sm,
  },
  budgetFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  budgetAmount: {
    fontSize: FONT_SIZES.sm,
    fontFamily: FONTS.medium,
    color: COLORS.textPrimary,
  },
  budgetRemaining: {
    fontSize: FONT_SIZES.sm,
    fontFamily: FONTS.regular,
  },
  bottomSpacing: {
    height: SPACING['2xl'],
  },
});
