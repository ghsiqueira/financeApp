// src/screens/reports/ReportsScreen.tsx
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

// Importações do projeto
import { useTransactions, useBudgets, useGoals } from '../../hooks';
import { Transaction, Budget, Goal } from '../../types';
import { formatCurrency, formatDate, getStartOfMonth, getEndOfMonth } from '../../utils';
import { Card, Loading, EmptyState } from '../../components/common';
import { COLORS, FONTS, FONT_SIZES, SPACING, BORDER_RADIUS, SHADOWS } from '../../constants';

const { width } = Dimensions.get('window');

interface PeriodFilter {
  key: string;
  label: string;
  startDate: Date;
  endDate: Date;
}

interface CategoryData {
  category: string;
  amount: number;
  percentage: number;
  color: string;
}

interface MonthlyData {
  month: string;
  income: number;
  expenses: number;
  balance: number;
}

export const ReportsScreen: React.FC = () => {
  const [selectedPeriod, setSelectedPeriod] = useState('thisMonth');
  const [refreshing, setRefreshing] = useState(false);

  const { transactions, loading: transactionsLoading, refresh: refreshTransactions } = useTransactions();
  const { budgets, loading: budgetsLoading } = useBudgets();
  const { goals, loading: goalsLoading } = useGoals();

  const loading = transactionsLoading || budgetsLoading || goalsLoading;

  // Períodos disponíveis
  const periods: PeriodFilter[] = [
    {
      key: 'thisMonth',
      label: 'Este Mês',
      startDate: getStartOfMonth(),
      endDate: getEndOfMonth(),
    },
    {
      key: 'lastMonth',
      label: 'Mês Passado',
      startDate: getStartOfMonth(new Date(new Date().setMonth(new Date().getMonth() - 1))),
      endDate: getEndOfMonth(new Date(new Date().setMonth(new Date().getMonth() - 1))),
    },
    {
      key: 'last3Months',
      label: 'Últimos 3 Meses',
      startDate: new Date(new Date().setMonth(new Date().getMonth() - 3)),
      endDate: new Date(),
    },
    {
      key: 'thisYear',
      label: 'Este Ano',
      startDate: new Date(new Date().getFullYear(), 0, 1),
      endDate: new Date(),
    },
  ];

  const currentPeriod = periods.find(p => p.key === selectedPeriod) || periods[0];

  // Filtrar transações por período
  const filteredTransactions = transactions.filter(transaction => {
    const transactionDate = new Date(transaction.date);
    return transactionDate >= currentPeriod.startDate && transactionDate <= currentPeriod.endDate;
  });

  // Calcular estatísticas gerais
  const calculateGeneralStats = () => {
    const income = filteredTransactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);

    const expenses = filteredTransactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);

    const balance = income - expenses;

    const transactionCount = filteredTransactions.length;
    const avgTransaction = transactionCount > 0 ? (income + expenses) / transactionCount : 0;

    return {
      income,
      expenses,
      balance,
      transactionCount,
      avgTransaction,
    };
  };

  // Calcular dados por categoria
  const calculateCategoryData = (): CategoryData[] => {
    const categoryTotals: { [key: string]: number } = {};
    const expenseTransactions = filteredTransactions.filter(t => t.type === 'expense');

    expenseTransactions.forEach(transaction => {
      const categoryKey = typeof transaction.category === 'string' ? transaction.category : String(transaction.category);
      categoryTotals[categoryKey] = (categoryTotals[categoryKey] || 0) + transaction.amount;
    });

    const totalExpenses = Object.values(categoryTotals).reduce((sum, amount) => sum + amount, 0);

    const colors = [
      COLORS.primary,
      COLORS.secondary,
      COLORS.success,
      COLORS.warning,
      COLORS.error,
      COLORS.info,
      '#8B5CF6',
      '#F59E0B',
      '#10B981',
      '#EF4444',
    ];

    return Object.entries(categoryTotals)
      .map(([category, amount], index) => ({
        category,
        amount,
        percentage: totalExpenses > 0 ? (amount / totalExpenses) * 100 : 0,
        color: colors[index % colors.length],
      }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 6); // Top 6 categorias
  };

  // Calcular dados mensais (para gráfico de tendência)
  const calculateMonthlyData = (): MonthlyData[] => {
    const monthlyData: { [key: string]: { income: number; expenses: number } } = {};

    filteredTransactions.forEach(transaction => {
      const monthKey = new Date(transaction.date).toLocaleDateString('pt-BR', { 
        year: 'numeric', 
        month: '2-digit' 
      });

      if (!monthlyData[monthKey]) {
        monthlyData[monthKey] = { income: 0, expenses: 0 };
      }

      if (transaction.type === 'income') {
        monthlyData[monthKey].income += transaction.amount;
      } else if (transaction.type === 'expense') {
        monthlyData[monthKey].expenses += transaction.amount;
      }
    });

    return Object.entries(monthlyData)
      .map(([month, data]) => ({
        month,
        income: data.income,
        expenses: data.expenses,
        balance: data.income - data.expenses,
      }))
      .sort((a, b) => a.month.localeCompare(b.month))
      .slice(-6); // Últimos 6 meses
  };

  // Calcular progresso das metas
  const calculateGoalsProgress = () => {
    const activeGoals = goals.filter(goal => goal.status === 'active');
    const completedGoals = goals.filter(goal => goal.status === 'completed');
    
    const totalGoalsValue = activeGoals.reduce((sum, goal) => sum + goal.targetAmount, 0);
    const totalSaved = activeGoals.reduce((sum, goal) => sum + goal.currentAmount, 0);
    
    const avgProgress = activeGoals.length > 0 
      ? activeGoals.reduce((sum, goal) => sum + ((goal.currentAmount / goal.targetAmount) * 100), 0) / activeGoals.length
      : 0;

    return {
      activeGoalsCount: activeGoals.length,
      completedGoalsCount: completedGoals.length,
      totalGoalsValue,
      totalSaved,
      avgProgress,
    };
  };

  // Calcular status dos orçamentos
  const calculateBudgetStatus = () => {
    const activeBudgets = budgets.filter(budget => budget.isActive);
    const overBudgetCount = activeBudgets.filter(budget => budget.isOverBudget).length;
    
    const totalBudgetLimit = activeBudgets.reduce((sum, budget) => sum + budget.monthlyLimit, 0);
    const totalSpent = activeBudgets.reduce((sum, budget) => sum + budget.spent, 0);
    
    const avgUtilization = totalBudgetLimit > 0 ? (totalSpent / totalBudgetLimit) * 100 : 0;

    return {
      activeBudgetsCount: activeBudgets.length,
      overBudgetCount,
      totalBudgetLimit,
      totalSpent,
      avgUtilization,
    };
  };

  const generalStats = calculateGeneralStats();
  const categoryData = calculateCategoryData();
  const monthlyData = calculateMonthlyData();
  const goalsProgress = calculateGoalsProgress();
  const budgetStatus = calculateBudgetStatus();

  // Refresh dos dados
  const handleRefresh = async () => {
    setRefreshing(true);
    await refreshTransactions();
    setRefreshing(false);
  };

  // Renderizar seletor de período
  const renderPeriodSelector = () => (
    <View style={styles.periodSelector}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        {periods.map((period) => (
          <TouchableOpacity
            key={period.key}
            style={[
              styles.periodButton,
              selectedPeriod === period.key && styles.periodButtonActive,
            ]}
            onPress={() => setSelectedPeriod(period.key)}
          >
            <Text
              style={[
                styles.periodButtonText,
                selectedPeriod === period.key && styles.periodButtonTextActive,
              ]}
            >
              {period.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );

  // Renderizar resumo financeiro
  const renderFinancialSummary = () => (
    <Card style={styles.summaryCard}>
      <Text style={styles.cardTitle}>Resumo Financeiro</Text>
      <View style={styles.summaryGrid}>
        <View style={styles.summaryItem}>
          <View style={[styles.summaryIcon, { backgroundColor: COLORS.success + '20' }]}>
            <Ionicons name="trending-up" size={24} color={COLORS.success} />
          </View>
          <Text style={styles.summaryLabel}>Receitas</Text>
          <Text style={[styles.summaryValue, { color: COLORS.success }]}>
            {formatCurrency(generalStats.income)}
          </Text>
        </View>

        <View style={styles.summaryItem}>
          <View style={[styles.summaryIcon, { backgroundColor: COLORS.error + '20' }]}>
            <Ionicons name="trending-down" size={24} color={COLORS.error} />
          </View>
          <Text style={styles.summaryLabel}>Despesas</Text>
          <Text style={[styles.summaryValue, { color: COLORS.error }]}>
            {formatCurrency(generalStats.expenses)}
          </Text>
        </View>

        <View style={styles.summaryItem}>
          <View style={[styles.summaryIcon, { 
            backgroundColor: generalStats.balance >= 0 ? COLORS.primary + '20' : COLORS.warning + '20' 
          }]}>
            <Ionicons 
              name={generalStats.balance >= 0 ? "wallet" : "warning"} 
              size={24} 
              color={generalStats.balance >= 0 ? COLORS.primary : COLORS.warning} 
            />
          </View>
          <Text style={styles.summaryLabel}>Saldo</Text>
          <Text style={[
            styles.summaryValue, 
            { color: generalStats.balance >= 0 ? COLORS.primary : COLORS.warning }
          ]}>
            {formatCurrency(generalStats.balance)}
          </Text>
        </View>

        <View style={styles.summaryItem}>
          <View style={[styles.summaryIcon, { backgroundColor: COLORS.info + '20' }]}>
            <Ionicons name="stats-chart" size={24} color={COLORS.info} />
          </View>
          <Text style={styles.summaryLabel}>Transações</Text>
          <Text style={[styles.summaryValue, { color: COLORS.info }]}>
            {generalStats.transactionCount}
          </Text>
        </View>
      </View>
    </Card>
  );

  // Renderizar gastos por categoria
  const renderCategoryExpenses = () => (
    <Card style={styles.categoryCard}>
      <Text style={styles.cardTitle}>Gastos por Categoria</Text>
      {categoryData.length > 0 ? (
        <View style={styles.categoryList}>
          {categoryData.map((item, index) => (
            <View key={item.category} style={styles.categoryItem}>
              <View style={styles.categoryInfo}>
                <View style={[styles.categoryColor, { backgroundColor: item.color }]} />
                <Text style={styles.categoryName}>{item.category}</Text>
              </View>
              <View style={styles.categoryValues}>
                <Text style={styles.categoryAmount}>{formatCurrency(item.amount)}</Text>
                <Text style={styles.categoryPercentage}>{item.percentage.toFixed(1)}%</Text>
              </View>
              <View style={styles.categoryProgressBar}>
                <View
                  style={[
                    styles.categoryProgress,
                    {
                      width: `${item.percentage}%`,
                      backgroundColor: item.color,
                    },
                  ]}
                />
              </View>
            </View>
          ))}
        </View>
      ) : (
        <View style={styles.noDataContainer}>
          <Ionicons name="pie-chart-outline" size={48} color={COLORS.gray400} />
          <Text style={styles.noDataText}>Nenhum gasto registrado no período</Text>
        </View>
      )}
    </Card>
  );

  // Renderizar tendência mensal
  const renderMonthlyTrend = () => (
    <Card style={styles.trendCard}>
      <Text style={styles.cardTitle}>Tendência Mensal</Text>
      {monthlyData.length > 0 ? (
        <>
          <View style={styles.trendChart}>
            {monthlyData.map((item, index) => {
              const maxValue = Math.max(
                ...monthlyData.map(d => Math.max(d.income, d.expenses))
              );
              const incomeHeight = maxValue > 0 ? (item.income / maxValue) * 100 : 0;
              const expenseHeight = maxValue > 0 ? (item.expenses / maxValue) * 100 : 0;

              return (
                <View key={item.month} style={styles.trendItem}>
                  <View style={styles.trendBars}>
                    <View
                      style={[
                        styles.trendBar,
                        styles.incomeBar,
                        { height: `${incomeHeight}%` },
                      ]}
                    />
                    <View
                      style={[
                        styles.trendBar,
                        styles.expenseBar,
                        { height: `${expenseHeight}%` },
                      ]}
                    />
                  </View>
                  <Text style={styles.trendMonth}>{item.month}</Text>
                </View>
              );
            })}
          </View>
          
          <View style={styles.trendLegend}>
            <View style={styles.legendItem}>
              <View style={[styles.legendColor, { backgroundColor: COLORS.success }]} />
              <Text style={styles.legendText}>Receitas</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendColor, { backgroundColor: COLORS.error }]} />
              <Text style={styles.legendText}>Despesas</Text>
            </View>
          </View>
        </>
      ) : (
        <View style={styles.noDataContainer}>
          <Ionicons name="trending-up-outline" size={48} color={COLORS.gray400} />
          <Text style={styles.noDataText}>Dados insuficientes para tendência</Text>
        </View>
      )}
    </Card>
  );

  // Renderizar progresso das metas
  const renderGoalsProgress = () => (
    <Card style={styles.goalsCard}>
      <Text style={styles.cardTitle}>Progresso das Metas</Text>
      <View style={styles.goalsStats}>
        <View style={styles.goalsStat}>
          <Text style={styles.goalsStatNumber}>{goalsProgress.activeGoalsCount}</Text>
          <Text style={styles.goalsStatLabel}>Metas Ativas</Text>
        </View>
        <View style={styles.goalsStat}>
          <Text style={styles.goalsStatNumber}>{goalsProgress.completedGoalsCount}</Text>
          <Text style={styles.goalsStatLabel}>Concluídas</Text>
        </View>
        <View style={styles.goalsStat}>
          <Text style={styles.goalsStatNumber}>{goalsProgress.avgProgress.toFixed(1)}%</Text>
          <Text style={styles.goalsStatLabel}>Progresso Médio</Text>
        </View>
      </View>
      <View style={styles.goalsValues}>
        <View style={styles.goalsValueItem}>
          <Text style={styles.goalsValueLabel}>Total Economizado</Text>
          <Text style={[styles.goalsValueAmount, { color: COLORS.success }]}>
            {formatCurrency(goalsProgress.totalSaved)}
          </Text>
        </View>
        <View style={styles.goalsValueItem}>
          <Text style={styles.goalsValueLabel}>Meta Total</Text>
          <Text style={styles.goalsValueAmount}>
            {formatCurrency(goalsProgress.totalGoalsValue)}
          </Text>
        </View>
      </View>
    </Card>
  );

  // Renderizar status dos orçamentos
  const renderBudgetStatus = () => (
    <Card style={styles.budgetCard}>
      <Text style={styles.cardTitle}>Status dos Orçamentos</Text>
      <View style={styles.budgetStats}>
        <View style={styles.budgetStat}>
          <Text style={styles.budgetStatNumber}>{budgetStatus.activeBudgetsCount}</Text>
          <Text style={styles.budgetStatLabel}>Orçamentos Ativos</Text>
        </View>
        <View style={styles.budgetStat}>
          <Text style={[styles.budgetStatNumber, { color: COLORS.error }]}>
            {budgetStatus.overBudgetCount}
          </Text>
          <Text style={styles.budgetStatLabel}>Excedidos</Text>
        </View>
        <View style={styles.budgetStat}>
          <Text style={[
            styles.budgetStatNumber,
            { color: budgetStatus.avgUtilization > 90 ? COLORS.error : 
                     budgetStatus.avgUtilization > 70 ? COLORS.warning : COLORS.success }
          ]}>
            {budgetStatus.avgUtilization.toFixed(1)}%
          </Text>
          <Text style={styles.budgetStatLabel}>Utilização Média</Text>
        </View>
      </View>
      <View style={styles.budgetValues}>
        <View style={styles.budgetValueItem}>
          <Text style={styles.budgetValueLabel}>Total Gasto</Text>
          <Text style={[styles.budgetValueAmount, { color: COLORS.error }]}>
            {formatCurrency(budgetStatus.totalSpent)}
          </Text>
        </View>
        <View style={styles.budgetValueItem}>
          <Text style={styles.budgetValueLabel}>Limite Total</Text>
          <Text style={styles.budgetValueAmount}>
            {formatCurrency(budgetStatus.totalBudgetLimit)}
          </Text>
        </View>
      </View>
    </Card>
  );

  if (loading && transactions.length === 0) {
    return <Loading text="Carregando relatórios..." />;
  }

  if (transactions.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Relatórios</Text>
        </View>
        <EmptyState
          icon="analytics-outline"
          title="Nenhum dado disponível"
          description="Comece adicionando transações para ver seus relatórios financeiros aqui!"
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Relatórios</Text>
        <TouchableOpacity style={styles.refreshButton} onPress={handleRefresh}>
          <Ionicons name="refresh" size={24} color={COLORS.primary} />
        </TouchableOpacity>
      </View>

      {/* Seletor de período */}
      {renderPeriodSelector()}

      {/* Conteúdo scrollável */}
      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={[COLORS.primary]}
            tintColor={COLORS.primary}
          />
        }
      >
        {renderFinancialSummary()}
        {renderCategoryExpenses()}
        {renderMonthlyTrend()}
        {renderGoalsProgress()}
        {renderBudgetStatus()}
        
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    backgroundColor: COLORS.white,
    ...SHADOWS.sm,
  },
  headerTitle: {
    fontSize: FONT_SIZES.xl,
    fontFamily: FONTS.bold,
    color: COLORS.textPrimary,
  },
  refreshButton: {
    padding: SPACING.xs,
  },
  periodSelector: {
    backgroundColor: COLORS.white,
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray200,
  },
  periodButton: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    marginHorizontal: SPACING.xs,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: COLORS.gray100,
  },
  periodButtonActive: {
    backgroundColor: COLORS.primary,
  },
  periodButtonText: {
    fontSize: FONT_SIZES.sm,
    fontFamily: FONTS.medium,
    color: COLORS.gray600,
  },
  periodButtonTextActive: {
    color: COLORS.white,
  },
  content: {
    flex: 1,
    padding: SPACING.md,
  },
  cardTitle: {
    fontSize: FONT_SIZES.lg,
    fontFamily: FONTS.bold,
    color: COLORS.textPrimary,
    marginBottom: SPACING.md,
  },
  summaryCard: {
    marginBottom: SPACING.md,
    padding: SPACING.md,
  },
  summaryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  summaryItem: {
    width: '48%',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  summaryIcon: {
    width: 48,
    height: 48,
    borderRadius: BORDER_RADIUS.full,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.xs,
  },
  summaryLabel: {
    fontSize: FONT_SIZES.sm,
    fontFamily: FONTS.regular,
    color: COLORS.textSecondary,
    marginBottom: SPACING.xs,
  },
  summaryValue: {
    fontSize: FONT_SIZES.lg,
    fontFamily: FONTS.bold,
  },
  categoryCard: {
    marginBottom: SPACING.md,
    padding: SPACING.md,
  },
  categoryList: {
    gap: SPACING.md,
  },
  categoryItem: {
    gap: SPACING.xs,
  },
  categoryInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  categoryColor: {
    width: 12,
    height: 12,
    borderRadius: BORDER_RADIUS.full,
    marginRight: SPACING.sm,
  },
  categoryName: {
    flex: 1,
    fontSize: FONT_SIZES.md,
    fontFamily: FONTS.medium,
    color: COLORS.textPrimary,
  },
  categoryValues: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  categoryAmount: {
    fontSize: FONT_SIZES.sm,
    fontFamily: FONTS.bold,
    color: COLORS.textPrimary,
  },
  categoryPercentage: {
    fontSize: FONT_SIZES.sm,
    fontFamily: FONTS.regular,
    color: COLORS.textSecondary,
  },
  categoryProgressBar: {
    height: 4,
    backgroundColor: COLORS.gray200,
    borderRadius: BORDER_RADIUS.full,
    overflow: 'hidden',
  },
  categoryProgress: {
    height: '100%',
    borderRadius: BORDER_RADIUS.full,
  },
  trendCard: {
    marginBottom: SPACING.md,
    padding: SPACING.md,
  },
  trendChart: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    height: 120,
    marginBottom: SPACING.md,
  },
  trendItem: {
    flex: 1,
    alignItems: 'center',
    marginHorizontal: 2,
  },
  trendBars: {
    flex: 1,
    width: '100%',
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'center',
    gap: 2,
  },
  trendBar: {
    width: 8,
    borderRadius: 2,
    minHeight: 4,
  },
  incomeBar: {
    backgroundColor: COLORS.success,
  },
  expenseBar: {
    backgroundColor: COLORS.error,
  },
  trendMonth: {
    fontSize: FONT_SIZES.xs,
    fontFamily: FONTS.regular,
    color: COLORS.textSecondary,
    marginTop: SPACING.xs,
    textAlign: 'center',
  },
  trendLegend: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: SPACING.lg,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  legendColor: {
    width: 12,
    height: 12,
    borderRadius: BORDER_RADIUS.full,
  },
  legendText: {
    fontSize: FONT_SIZES.sm,
    fontFamily: FONTS.regular,
    color: COLORS.textSecondary,
  },
  goalsCard: {
    marginBottom: SPACING.md,
    padding: SPACING.md,
  },
  goalsStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: SPACING.md,
  },
  goalsStat: {
    alignItems: 'center',
    flex: 1,
  },
  goalsStatNumber: {
    fontSize: FONT_SIZES.xl,
    fontFamily: FONTS.bold,
    color: COLORS.primary,
  },
  goalsStatLabel: {
    fontSize: FONT_SIZES.xs,
    fontFamily: FONTS.regular,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  goalsValues: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: SPACING.md,
    borderTopWidth: 1,
    borderTopColor: COLORS.gray200,
  },
  goalsValueItem: {
    alignItems: 'center',
    flex: 1,
  },
  goalsValueLabel: {
    fontSize: FONT_SIZES.sm,
    fontFamily: FONTS.regular,
    color: COLORS.textSecondary,
    marginBottom: SPACING.xs,
  },
  goalsValueAmount: {
    fontSize: FONT_SIZES.md,
    fontFamily: FONTS.bold,
    color: COLORS.textPrimary,
  },
  budgetCard: {
    marginBottom: SPACING.md,
    padding: SPACING.md,
  },
  budgetStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: SPACING.md,
  },
  budgetStat: {
    alignItems: 'center',
    flex: 1,
  },
  budgetStatNumber: {
    fontSize: FONT_SIZES.xl,
    fontFamily: FONTS.bold,
    color: COLORS.primary,
  },
  budgetStatLabel: {
    fontSize: FONT_SIZES.xs,
    fontFamily: FONTS.regular,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  budgetValues: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: SPACING.md,
    borderTopWidth: 1,
    borderTopColor: COLORS.gray200,
  },
  budgetValueItem: {
    alignItems: 'center',
    flex: 1,
  },
  budgetValueLabel: {
    fontSize: FONT_SIZES.sm,
    fontFamily: FONTS.regular,
    color: COLORS.textSecondary,
    marginBottom: SPACING.xs,
  },
  budgetValueAmount: {
    fontSize: FONT_SIZES.md,
    fontFamily: FONTS.bold,
    color: COLORS.textPrimary,
  },
  noDataContainer: {
    alignItems: 'center',
    paddingVertical: SPACING.xl,
    gap: SPACING.sm,
  },
  noDataText: {
    fontSize: FONT_SIZES.sm,
    fontFamily: FONTS.regular,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  bottomSpacing: {
    height: SPACING.xl,
  },
});