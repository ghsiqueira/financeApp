// src/screens/main/HomeScreen.tsx - SEM BOTÃO DE TEMA (só no Profile)
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
import { useTheme } from '../../contexts/ThemeContext';
import { TransactionService } from '../../services/TransactionService';
import { GoalService } from '../../services/GoalService';
import { BudgetService } from '../../services/BudgetService';
import { 
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
  const { theme, isDarkMode, toggleTheme } = useTheme();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [summary, setSummary] = useState<FinancialSummary | null>(null);
  const [recentTransactions, setRecentTransactions] = useState<Transaction[]>([]);
  const [activeGoals, setActiveGoals] = useState<Goal[]>([]);
  const [currentBudgets, setCurrentBudgets] = useState<Budget[]>([]);

  const formatCurrency = (value: number | undefined | null): string => {
    if (value === null || value === undefined || isNaN(Number(value))) {
      return 'R$ 0,00';
    }
    
    const numericValue = Number(value);
    
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(numericValue);
  };

  const handleSeeAllTransactions = () => {
    navigation.navigate('Transactions', {
      screen: 'TransactionList'
    });
  };

  const handleCreateTransaction = () => {
    navigation.navigate('Transactions', { 
      screen: 'CreateTransaction' 
    });
  };

  const handleViewTransaction = (transactionId: string) => {
    navigation.navigate('Transactions', {
      screen: 'TransactionDetails',
      params: { transactionId }
    });
  };

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      console.log('🔄 Carregando dados do HomeScreen...');
      
      const [summaryData, transactions, goals, budgets] = await Promise.all([
        TransactionService.getFinancialSummary(),
        TransactionService.getRecentTransactions(5),
        GoalService.getActiveGoals(3),
        BudgetService.getCurrentBudgets(3),
      ]);

      console.log('📊 Dados recebidos:', {
        summary: summaryData,
        transactions: transactions?.length,
        goals: goals?.length,
        budgets: budgets?.length
      });

      const safeSummary = summaryData || {
        income: 0,
        expense: 0,
        incomeCount: 0,
        expenseCount: 0,
        balance: 0,
      };

      const validatedSummary = {
        income: isNaN(Number(safeSummary.income)) ? 0 : Number(safeSummary.income),
        expense: isNaN(Number(safeSummary.expense)) ? 0 : Number(safeSummary.expense),
        incomeCount: isNaN(Number(safeSummary.incomeCount)) ? 0 : Number(safeSummary.incomeCount),
        expenseCount: isNaN(Number(safeSummary.expenseCount)) ? 0 : Number(safeSummary.expenseCount),
        balance: 0,
      };

      validatedSummary.balance = validatedSummary.income - validatedSummary.expense;

      setSummary(validatedSummary);
      setRecentTransactions(transactions || []);
      setActiveGoals(goals || []);
      setCurrentBudgets(budgets || []);
    } catch (error: any) {
      console.error('❌ Erro ao carregar dados:', error);
      Alert.alert('Erro', 'Não foi possível carregar os dados. Tente novamente.');
      
      setSummary({
        income: 0,
        expense: 0,
        incomeCount: 0,
        expenseCount: 0,
        balance: 0,
      });
      setRecentTransactions([]);
      setActiveGoals([]);
      setCurrentBudgets([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadData();
  }, [loadData]);

  const getBalanceColor = (balance: number): string => {
    if (balance > 0) return theme.success;
    if (balance < 0) return theme.error;
    return theme.textSecondary;
  };

  // Estilos dinâmicos baseados no tema
  const dynamicStyles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.background,
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: SPACING.md,
      paddingVertical: SPACING.lg,
      backgroundColor: theme.primary,
    },
    greeting: {
      fontSize: FONT_SIZES.xl,
      fontFamily: FONTS.bold,
      color: theme.white,
    },
    subtitle: {
      fontSize: FONT_SIZES.md,
      fontFamily: FONTS.regular,
      color: theme.white,
      opacity: 0.9,
      marginTop: SPACING.xs,
    },
    avatar: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: theme.primaryDark,
      justifyContent: 'center',
      alignItems: 'center',
    },
    summaryTitle: {
      fontSize: FONT_SIZES.lg,
      fontFamily: FONTS.bold,
      color: theme.textPrimary,
    },
    balanceLabel: {
      fontSize: FONT_SIZES.sm,
      fontFamily: FONTS.regular,
      color: theme.textSecondary,
      marginBottom: SPACING.xs,
    },
    summaryItemLabel: {
      fontSize: FONT_SIZES.xs,
      fontFamily: FONTS.regular,
      color: theme.textSecondary,
    },
    summaryItemCount: {
      fontSize: FONT_SIZES.xs,
      fontFamily: FONTS.regular,
      color: theme.textTertiary,
    },
    sectionTitle: {
      fontSize: FONT_SIZES.lg,
      fontFamily: FONTS.bold,
      color: theme.textPrimary,
    },
    seeAllText: {
      fontSize: FONT_SIZES.sm,
      fontFamily: FONTS.medium,
      color: theme.primary,
    },
    quickActionLabel: {
      fontSize: FONT_SIZES.xs,
      fontFamily: FONTS.medium,
      color: theme.textSecondary,
      textAlign: 'center',
    },
    transactionDescription: {
      fontSize: FONT_SIZES.md,
      fontFamily: FONTS.medium,
      color: theme.textPrimary,
    },
    transactionCategory: {
      fontSize: FONT_SIZES.sm,
      fontFamily: FONTS.regular,
      color: theme.textSecondary,
      marginTop: 2,
    },
    transactionDate: {
      fontSize: FONT_SIZES.xs,
      fontFamily: FONTS.regular,
      color: theme.textTertiary,
      marginTop: 2,
    },
    goalTitle: {
      fontSize: FONT_SIZES.md,
      fontFamily: FONTS.medium,
      color: theme.textPrimary,
      flex: 1,
      marginRight: SPACING.sm,
    },
    goalAmount: {
      fontSize: FONT_SIZES.sm,
      fontFamily: FONTS.medium,
      color: theme.textPrimary,
    },
    goalDays: {
      fontSize: FONT_SIZES.sm,
      fontFamily: FONTS.regular,
      color: theme.textSecondary,
    },
    budgetName: {
      fontSize: FONT_SIZES.md,
      fontFamily: FONTS.medium,
      color: theme.textPrimary,
      flex: 1,
      marginRight: SPACING.sm,
    },
    budgetAmount: {
      fontSize: FONT_SIZES.sm,
      fontFamily: FONTS.medium,
      color: theme.textPrimary,
    },
    progressBar: {
      height: 8,
      backgroundColor: theme.border,
      borderRadius: BORDER_RADIUS.full,
      overflow: 'hidden',
    },
    progressFill: {
      height: '100%',
      backgroundColor: theme.primary,
    },
  });

  const renderSummaryCard = () => {
    if (!summary) return null;

    return (
      <Card style={styles.summaryCard}>
        <View style={styles.summaryHeader}>
          <Text style={dynamicStyles.summaryTitle}>Resumo do Mês</Text>
          <TouchableOpacity onPress={() => navigation.navigate('Reports')}>
            <Ionicons name="analytics-outline" size={24} color={theme.primary} />
          </TouchableOpacity>
        </View>

        <View style={styles.balanceContainer}>
          <Text style={dynamicStyles.balanceLabel}>Saldo Atual</Text>
          <Text style={[
            styles.balanceValue,
            { color: getBalanceColor(summary.balance) }
          ]}>
            {formatCurrency(summary.balance)}
          </Text>
        </View>

        <View style={styles.summaryRow}>
          <View style={styles.summaryItem}>
            <View style={[styles.summaryIcon, { backgroundColor: theme.success + '20' }]}>
              <Ionicons name="arrow-up" size={20} color={theme.success} />
            </View>
            <View style={styles.summaryDetails}>
              <Text style={dynamicStyles.summaryItemLabel}>Receitas</Text>
              <Text style={[styles.summaryItemValue, { color: theme.success }]}>
                {formatCurrency(summary.income)}
              </Text>
              <Text style={dynamicStyles.summaryItemCount}>
                {summary.incomeCount} transações
              </Text>
            </View>
          </View>

          <View style={styles.summaryItem}>
            <View style={[styles.summaryIcon, { backgroundColor: theme.error + '20' }]}>
              <Ionicons name="arrow-down" size={20} color={theme.error} />
            </View>
            <View style={styles.summaryDetails}>
              <Text style={dynamicStyles.summaryItemLabel}>Despesas</Text>
              <Text style={[styles.summaryItemValue, { color: theme.error }]}>
                {formatCurrency(summary.expense)}
              </Text>
              <Text style={dynamicStyles.summaryItemCount}>
                {summary.expenseCount} transações
              </Text>
            </View>
          </View>
        </View>
      </Card>
    );
  };

  const renderQuickActions = () => {
    const actions = [
      {
        icon: 'add-circle',
        label: 'Nova Transação',
        color: theme.primary,
        onPress: handleCreateTransaction,
      },
      {
        icon: 'flag',
        label: 'Nova Meta',
        color: theme.secondary,
        onPress: () => navigation.navigate('Goals', { screen: 'CreateGoal' }),
      },
      {
        icon: 'pie-chart',
        label: 'Orçamento',
        color: theme.warning,
        onPress: () => navigation.navigate('Budgets', { screen: 'CreateBudget' }),
      },
      {
        icon: 'trending-up',
        label: 'Projeções',
        color: theme.info,
        onPress: () => navigation.navigate('Projections'),
      },
      {
        icon: 'analytics',
        label: 'Relatórios',
        color: theme.success,
        onPress: () => navigation.navigate('Reports'),
      },
    ];

    return (
      <View style={styles.quickActionsContainer}>
        <Text style={dynamicStyles.sectionTitle}>Ações Rápidas</Text>
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
              <Text style={dynamicStyles.quickActionLabel}>{action.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    );
  };

  const renderRecentTransactions = () => {
    return (
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={dynamicStyles.sectionTitle}>Transações Recentes</Text>
          <TouchableOpacity onPress={handleSeeAllTransactions}>
            <Text style={dynamicStyles.seeAllText}>Ver todas</Text>
          </TouchableOpacity>
        </View>

        {recentTransactions.length === 0 ? (
          <Card>
            <EmptyState
              icon="receipt-outline"
              title="Nenhuma transação"
              description="Comece criando sua primeira transação"
              actionText="Criar Transação"
              onAction={handleCreateTransaction}
            />
          </Card>
        ) : (
          recentTransactions.map((transaction) => (
            <Card key={transaction._id} style={styles.transactionCard}>
              <TouchableOpacity
                style={styles.transactionItem}
                onPress={() => handleViewTransaction(transaction._id)}
              >
                <View style={styles.transactionLeft}>
                  <View style={[
                    styles.transactionIcon,
                    { backgroundColor: transaction.type === 'income' ? theme.success + '20' : theme.error + '20' }
                  ]}>
                    <Ionicons
                      name={transaction.type === 'income' ? 'arrow-up' : 'arrow-down'}
                      size={20}
                      color={transaction.type === 'income' ? theme.success : theme.error}
                    />
                  </View>
                  <View style={styles.transactionDetails}>
                    <Text style={dynamicStyles.transactionDescription}>
                      {transaction.description}
                    </Text>
                    <Text style={dynamicStyles.transactionCategory}>
                      {transaction.category?.name || 'Sem categoria'}
                    </Text>
                    <Text style={dynamicStyles.transactionDate}>
                      {new Date(transaction.date).toLocaleDateString('pt-BR')}
                    </Text>
                  </View>
                </View>
                <Text style={[
                  styles.transactionAmount,
                  { color: transaction.type === 'income' ? theme.success : theme.error }
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

  const renderActiveGoals = () => {
    return (
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={dynamicStyles.sectionTitle}>Metas Ativas</Text>
          <TouchableOpacity onPress={() => navigation.navigate('Goals')}>
            <Text style={dynamicStyles.seeAllText}>Ver todas</Text>
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
                  screen: 'GoalDetail',
                  params: { goalId: goal._id }
                })}
              >
                <View style={styles.goalHeader}>
                  <Text style={dynamicStyles.goalTitle}>{goal.title}</Text>
                  <Badge text={`${Math.round(goal.progress || 0)}%`} variant="info" />
                </View>
                
                <View style={styles.goalProgress}>
                  <View style={dynamicStyles.progressBar}>
                    <View style={[
                      dynamicStyles.progressFill,
                      { width: `${Math.min(goal.progress || 0, 100)}%` }
                    ]} />
                  </View>
                </View>

                <View style={styles.goalFooter}>
                  <Text style={dynamicStyles.goalAmount}>
                    {formatCurrency(goal.currentAmount)} / {formatCurrency(goal.targetAmount)}
                  </Text>
                  <Text style={dynamicStyles.goalDays}>
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

  const renderCurrentBudgets = () => {
    return (
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={dynamicStyles.sectionTitle}>Orçamentos do Mês</Text>
          <TouchableOpacity onPress={() => navigation.navigate('Budgets')}>
            <Text style={dynamicStyles.seeAllText}>Ver todos</Text>
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
                  <Text style={dynamicStyles.budgetName}>{budget.name}</Text>
                  <Badge 
                    text={budget.isOverBudget ? 'Excedido' : 'Normal'}
                    variant={budget.isOverBudget ? 'error' : 'success'}
                  />
                </View>

                <View style={styles.budgetProgress}>
                  <View style={dynamicStyles.progressBar}>
                    <View style={[
                      dynamicStyles.progressFill,
                      { 
                        width: `${Math.min(budget.usage || 0, 100)}%`,
                        backgroundColor: budget.isOverBudget ? theme.error : theme.primary
                      }
                    ]} />
                  </View>
                </View>

                <View style={styles.budgetFooter}>
                  <Text style={dynamicStyles.budgetAmount}>
                    {formatCurrency(budget.spent)} / {formatCurrency(budget.monthlyLimit)}
                  </Text>
                  <Text style={[
                    styles.budgetRemaining,
                    { color: budget.isOverBudget ? theme.error : theme.success }
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
      <SafeAreaView style={dynamicStyles.container}>
        <Loading text="Carregando painel..." />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={dynamicStyles.container}>
      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[theme.primary]}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        <View style={dynamicStyles.header}>
          <View>
            <Text style={dynamicStyles.greeting}>Olá, {user?.name?.split(' ')[0] || 'Usuário'}!</Text>
            <Text style={dynamicStyles.subtitle}>Como estão suas finanças hoje?</Text>
          </View>
          <View style={styles.headerActions}>
            <TouchableOpacity
              onPress={toggleTheme}
              style={dynamicStyles.avatar}
            >
              <Ionicons
                name={isDarkMode ? "sunny" : "moon"}
                size={24}
                color={theme.white}
              />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => navigation.navigate('Profile')}
              style={dynamicStyles.avatar}
            >
              <Ionicons name="person" size={24} color={theme.white} />
            </TouchableOpacity>
          </View>
        </View>

        {renderSummaryCard()}
        {renderQuickActions()}
        {renderRecentTransactions()}
        {renderActiveGoals()}
        {renderCurrentBudgets()}

        <View style={styles.bottomSpacing} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
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
  balanceContainer: {
    alignItems: 'center',
    marginBottom: SPACING.lg,
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
  summaryItemValue: {
    fontSize: FONT_SIZES.lg,
    fontFamily: FONTS.bold,
    marginVertical: 2,
  },
  quickActionsContainer: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.lg,
  },
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
  },
  quickAction: {
    alignItems: 'center',
    width: '18%',
    marginBottom: SPACING.md,
  },
  quickActionIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.sm,
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
  goalProgress: {
    marginBottom: SPACING.sm,
  },
  goalFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
  budgetProgress: {
    marginBottom: SPACING.sm,
  },
  budgetFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  budgetRemaining: {
    fontSize: FONT_SIZES.sm,
    fontFamily: FONTS.regular,
  },
  bottomSpacing: {
    height: SPACING['2xl'],
  },
});