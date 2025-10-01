// src/screens/reports/ReportsScreen.tsx - VERSÃO CORRIGIDA (SEM LOOP)
import React, { useState, useEffect, useMemo } from 'react';
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

import { useTransactions, useBudgets, useGoals } from '../../hooks';
import { Transaction, Budget, Goal } from '../../types';
import { formatCurrency, getStartOfMonth, getEndOfMonth } from '../../utils';
import { Card, Loading } from '../../components/common';
import { PieChart, LineChart, BarChart } from '../../components/charts';
import { COLORS, FONTS, FONT_SIZES, SPACING, BORDER_RADIUS, SHADOWS } from '../../constants';

const { width } = Dimensions.get('window');

interface PeriodFilter {
  key: string;
  label: string;
  startDate: Date;
  endDate: Date;
}

interface CategoryData {
  label: string;
  value: number;
  color: string;
  percentage: number;
  count: number;
}

interface MonthlyData {
  label: string;
  value: number;
  secondValue: number;
}

const CATEGORY_COLORS = [
  COLORS.primary,
  COLORS.secondary,
  COLORS.success,
  COLORS.warning,
  COLORS.error,
  COLORS.info,
  '#9333EA', // purple
  '#EC4899', // pink
  '#F59E0B', // amber
  '#14B8A6', // teal
];

export const ReportsScreen: React.FC = () => {
  const [selectedPeriod, setSelectedPeriod] = useState('thisMonth');
  const [refreshing, setRefreshing] = useState(false);

  const { transactions, loading: transactionsLoading, refresh: refreshTransactions } = useTransactions();
  const { budgets, loading: budgetsLoading } = useBudgets();
  const { goals, loading: goalsLoading } = useGoals();

  const loading = transactionsLoading || budgetsLoading || goalsLoading;

  // Períodos disponíveis
  const periods: PeriodFilter[] = useMemo(() => [
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
      key: 'last6Months',
      label: 'Últimos 6 Meses',
      startDate: new Date(new Date().setMonth(new Date().getMonth() - 6)),
      endDate: new Date(),
    },
    {
      key: 'thisYear',
      label: 'Este Ano',
      startDate: new Date(new Date().getFullYear(), 0, 1),
      endDate: new Date(),
    },
  ], []);

  const currentPeriod = periods.find(p => p.key === selectedPeriod) || periods[0];

  // ✅ FIX: Usar useMemo ao invés de useCallback para evitar loop
  // Filtrar transações por período
  const filteredTransactions = useMemo(() => {
    return transactions.filter(t => {
      const transactionDate = new Date(t.date);
      return transactionDate >= currentPeriod.startDate && transactionDate <= currentPeriod.endDate;
    });
  }, [transactions, currentPeriod.startDate, currentPeriod.endDate]);

  // ✅ FIX: Calcular dados por categoria usando useMemo
  const categoryData = useMemo((): CategoryData[] => {
    const filtered = filteredTransactions.filter(t => t.type === 'expense');
    
    if (filtered.length === 0) {
      return [];
    }

    // Agrupar por categoria
    const categoryMap = new Map<string, { amount: number; count: number }>();
    
    filtered.forEach(t => {
      const categoryName = typeof t.category === 'string' 
        ? t.category 
        : (t.category?.name || 'Sem categoria');
      
      const existing = categoryMap.get(categoryName);
      
      if (existing) {
        existing.amount += t.amount;
        existing.count += 1;
      } else {
        categoryMap.set(categoryName, {
          amount: t.amount,
          count: 1,
        });
      }
    });

    // Calcular total e percentuais
    const total = Array.from(categoryMap.values()).reduce((sum, cat) => sum + cat.amount, 0);
    
    return Array.from(categoryMap.entries())
      .map(([label, data], index) => ({
        label,
        value: data.amount,
        count: data.count,
        percentage: (data.amount / total) * 100,
        color: CATEGORY_COLORS[index % CATEGORY_COLORS.length],
      }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 8); // Top 8 categorias
  }, [filteredTransactions]);

  // ✅ FIX: Calcular evolução mensal usando useMemo
  const monthlyData = useMemo((): MonthlyData[] => {
    if (filteredTransactions.length === 0) {
      return [];
    }

    // Agrupar por mês
    const monthlyMap = new Map<string, { income: number; expense: number }>();
    
    filteredTransactions.forEach(t => {
      const date = new Date(t.date);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      
      const existing = monthlyMap.get(monthKey);
      
      if (existing) {
        if (t.type === 'income') {
          existing.income += t.amount;
        } else {
          existing.expense += t.amount;
        }
      } else {
        monthlyMap.set(monthKey, {
          income: t.type === 'income' ? t.amount : 0,
          expense: t.type === 'expense' ? t.amount : 0,
        });
      }
    });

    // Converter para array e ordenar
    const sortedEntries = Array.from(monthlyMap.entries()).sort((a, b) => a[0].localeCompare(b[0]));
    
    return sortedEntries.map(([key, values]) => {
      const [year, month] = key.split('-');
      const date = new Date(parseInt(year), parseInt(month) - 1);
      const label = date.toLocaleDateString('pt-BR', { month: 'short' });
      
      return {
        label: label.charAt(0).toUpperCase() + label.slice(1, 3),
        value: values.income,
        secondValue: values.expense,
      };
    }).slice(-6); // Últimos 6 meses
  }, [filteredTransactions]);

  // Refresh
  const handleRefresh = async () => {
    setRefreshing(true);
    await refreshTransactions();
    setRefreshing(false);
  };

  // ✅ FIX: Calcular resumo financeiro usando useMemo
  const summary = useMemo(() => {
    const income = filteredTransactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);
    
    const expense = filteredTransactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);
    
    return {
      income,
      expense,
      balance: income - expense,
      incomeCount: filteredTransactions.filter(t => t.type === 'income').length,
      expenseCount: filteredTransactions.filter(t => t.type === 'expense').length,
    };
  }, [filteredTransactions]);

  // ✅ FIX: Calcular estatísticas de metas usando useMemo
  const goalStats = useMemo(() => {
    const activeGoals = goals.filter(g => g.status === 'active');
    const completedGoals = goals.filter(g => g.status === 'completed');
    
    const totalSaved = goals.reduce((sum, g) => sum + g.currentAmount, 0);
    const totalTarget = goals.reduce((sum, g) => sum + g.targetAmount, 0);
    const avgProgress = goals.length > 0
      ? goals.reduce((sum, g) => sum + (g.progress || 0), 0) / goals.length
      : 0;

    return {
      activeCount: activeGoals.length,
      completedCount: completedGoals.length,
      totalSaved,
      totalTarget,
      avgProgress,
    };
  }, [goals]);

  // ✅ FIX: Calcular estatísticas de orçamentos usando useMemo
  const budgetStats = useMemo(() => {
    const activeBudgets = budgets.filter(b => b.isActive);
    const overBudget = activeBudgets.filter(b => b.spent > b.monthlyLimit);
    
    const totalBudget = activeBudgets.reduce((sum, b) => sum + b.monthlyLimit, 0);
    const totalSpent = activeBudgets.reduce((sum, b) => sum + b.spent, 0);
    const avgUtilization = totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0;

    return {
      activeCount: activeBudgets.length,
      overBudgetCount: overBudget.length,
      totalBudget,
      totalSpent,
      avgUtilization,
    };
  }, [budgets]);

  // Renderizar seletor de período
  const renderPeriodSelector = () => (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={styles.periodSelector}
      contentContainerStyle={styles.periodSelectorContent}
    >
      {periods.map(period => (
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
  );

  // Renderizar resumo financeiro
  const renderFinancialSummary = () => (
    <Card style={styles.summaryCard}>
      <Text style={styles.cardTitle}>Resumo do Período</Text>
      
      <View style={styles.summaryGrid}>
        <View style={[styles.summaryItem, { marginRight: SPACING.sm }]}>
          <View style={[styles.summaryIcon, { backgroundColor: COLORS.success + '20' }]}>
            <Ionicons name="arrow-down" size={20} color={COLORS.success} />
          </View>
          <View style={styles.summaryContent}>
            <Text style={styles.summaryLabel}>Receitas</Text>
            <Text style={[styles.summaryValue, { color: COLORS.success }]}>
              {formatCurrency(summary.income)}
            </Text>
            <Text style={styles.summaryCount}>{summary.incomeCount} transações</Text>
          </View>
        </View>

        <View style={styles.summaryItem}>
          <View style={[styles.summaryIcon, { backgroundColor: COLORS.error + '20' }]}>
            <Ionicons name="arrow-up" size={20} color={COLORS.error} />
          </View>
          <View style={styles.summaryContent}>
            <Text style={styles.summaryLabel}>Despesas</Text>
            <Text style={[styles.summaryValue, { color: COLORS.error }]}>
              {formatCurrency(summary.expense)}
            </Text>
            <Text style={styles.summaryCount}>{summary.expenseCount} transações</Text>
          </View>
        </View>
      </View>

      <View style={styles.balanceContainer}>
        <Text style={styles.balanceLabel}>Saldo do Período</Text>
        <Text style={[
          styles.balanceValue,
          { color: summary.balance >= 0 ? COLORS.success : COLORS.error }
        ]}>
          {formatCurrency(summary.balance)}
        </Text>
      </View>
    </Card>
  );

  // Renderizar gráfico de despesas por categoria
  const renderCategoryChart = () => (
    <Card style={styles.chartCard}>
      <Text style={styles.cardTitle}>Despesas por Categoria</Text>
      {categoryData.length > 0 ? (
        <>
          <PieChart
            data={categoryData}
            showLabels={true}
            showLegend={true}
          />
          <View style={styles.categoryDetails}>
            <Text style={styles.categoryDetailsTitle}>Top 3 Categorias</Text>
            {categoryData.slice(0, 3).map((cat, index) => (
              <View key={index} style={styles.categoryDetailItem}>
                <View style={styles.categoryDetailLeft}>
                  <View style={[styles.categoryDot, { backgroundColor: cat.color }]} />
                  <Text style={styles.categoryDetailLabel}>{cat.label}</Text>
                </View>
                <View style={styles.categoryDetailRight}>
                  <Text style={styles.categoryDetailValue}>
                    {formatCurrency(cat.value)}
                  </Text>
                  <Text style={styles.categoryDetailCount}>
                    {cat.count} {cat.count === 1 ? 'transação' : 'transações'}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        </>
      ) : (
        <View style={styles.noDataContainer}>
          <Ionicons name="pie-chart-outline" size={48} color={COLORS.gray400} />
          <Text style={styles.noDataText}>Sem despesas no período</Text>
        </View>
      )}
    </Card>
  );

  // Renderizar evolução mensal
  const renderMonthlyTrend = () => (
    <Card style={styles.chartCard}>
      <Text style={styles.cardTitle}>Evolução Mensal</Text>
      {monthlyData.length > 0 ? (
        <>
          <LineChart
            data={monthlyData}
            color={COLORS.success}
            secondColor={COLORS.error}
            showDots={true}
            showGradient={true}
            formatValue={(v) => formatCurrency(v)}
          />
          <View style={styles.trendInsights}>
            <View style={styles.trendInsight}>
              <Ionicons 
                name={monthlyData[monthlyData.length - 1].value > monthlyData[0].value ? "trending-up" : "trending-down"} 
                size={20} 
                color={monthlyData[monthlyData.length - 1].value > monthlyData[0].value ? COLORS.success : COLORS.error}
              />
              <Text style={styles.trendInsightText}>
                Receitas {monthlyData[monthlyData.length - 1].value > monthlyData[0].value ? 'aumentaram' : 'diminuíram'} no período
              </Text>
            </View>
          </View>
        </>
      ) : (
        <View style={styles.noDataContainer}>
          <Ionicons name="analytics-outline" size={48} color={COLORS.gray400} />
          <Text style={styles.noDataText}>Sem dados suficientes</Text>
        </View>
      )}
    </Card>
  );

  // Renderizar comparativo de gastos (BarChart)
  const renderSpendingComparison = () => {
    // Preparar dados das top categorias
    const topCategories = categoryData.slice(0, 5);
    
    if (topCategories.length === 0) return null;

    return (
      <Card style={styles.chartCard}>
        <Text style={styles.cardTitle}>Comparativo de Gastos</Text>
        <BarChart
          data={topCategories.map(cat => ({
            label: cat.label.length > 10 ? cat.label.substring(0, 10) : cat.label,
            value: cat.value,
            color: cat.color,
          }))}
          showValues={true}
          showGradient={true}
          formatValue={(v) => `R$ ${(v / 1000).toFixed(1)}k`}
        />
      </Card>
    );
  };

  // Renderizar progresso das metas
  const renderGoalProgress = () => (
    <Card style={styles.statsCard}>
      <View style={styles.statsHeader}>
        <Ionicons name="flag" size={24} color={COLORS.primary} style={{ marginRight: SPACING.sm }} />
        <Text style={styles.cardTitle}>Metas Financeiras</Text>
      </View>
      
      <View style={styles.statsGrid}>
        <View style={[styles.statItem, { marginRight: SPACING.sm }]}>
          <Text style={styles.statValue}>{goalStats.activeCount}</Text>
          <Text style={styles.statLabel}>Ativas</Text>
        </View>
        <View style={[styles.statItem, { marginRight: SPACING.sm }]}>
          <Text style={[styles.statValue, { color: COLORS.success }]}>
            {goalStats.completedCount}
          </Text>
          <Text style={styles.statLabel}>Concluídas</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={[styles.statValue, { color: COLORS.primary }]}>
            {goalStats.avgProgress.toFixed(0)}%
          </Text>
          <Text style={styles.statLabel}>Progresso Médio</Text>
        </View>
      </View>

      <View style={styles.statsDetails}>
        <View style={styles.statsDetailRow}>
          <Text style={styles.statsDetailLabel}>Total Economizado</Text>
          <Text style={[styles.statsDetailValue, { color: COLORS.success }]}>
            {formatCurrency(goalStats.totalSaved)}
          </Text>
        </View>
        <View style={styles.statsDetailRow}>
          <Text style={styles.statsDetailLabel}>Meta Total</Text>
          <Text style={styles.statsDetailValue}>
            {formatCurrency(goalStats.totalTarget)}
          </Text>
        </View>
      </View>
    </Card>
  );

  // Renderizar status dos orçamentos
  const renderBudgetStatus = () => (
    <Card style={styles.statsCard}>
      <View style={styles.statsHeader}>
        <Ionicons name="wallet" size={24} color={COLORS.secondary} style={{ marginRight: SPACING.sm }} />
        <Text style={styles.cardTitle}>Orçamentos</Text>
      </View>
      
      <View style={styles.statsGrid}>
        <View style={[styles.statItem, { marginRight: SPACING.sm }]}>
          <Text style={styles.statValue}>{budgetStats.activeCount}</Text>
          <Text style={styles.statLabel}>Ativos</Text>
        </View>
        <View style={[styles.statItem, { marginRight: SPACING.sm }]}>
          <Text style={[styles.statValue, { color: COLORS.error }]}>
            {budgetStats.overBudgetCount}
          </Text>
          <Text style={styles.statLabel}>Excedidos</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={[
            styles.statValue,
            { color: budgetStats.avgUtilization > 90 ? COLORS.error : 
                     budgetStats.avgUtilization > 70 ? COLORS.warning : COLORS.success }
          ]}>
            {budgetStats.avgUtilization.toFixed(0)}%
          </Text>
          <Text style={styles.statLabel}>Utilização Média</Text>
        </View>
      </View>

      <View style={styles.statsDetails}>
        <View style={styles.statsDetailRow}>
          <Text style={styles.statsDetailLabel}>Total Orçado</Text>
          <Text style={styles.statsDetailValue}>
            {formatCurrency(budgetStats.totalBudget)}
          </Text>
        </View>
        <View style={styles.statsDetailRow}>
          <Text style={styles.statsDetailLabel}>Total Gasto</Text>
          <Text style={[
            styles.statsDetailValue,
            { color: budgetStats.totalSpent > budgetStats.totalBudget ? COLORS.error : COLORS.textPrimary }
          ]}>
            {formatCurrency(budgetStats.totalSpent)}
          </Text>
        </View>
      </View>
    </Card>
  );

  // Loading state
  if (loading && transactions.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Relatórios</Text>
        </View>
        <Loading text="Carregando relatórios..." />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
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
        {renderCategoryChart()}
        {renderMonthlyTrend()}
        {renderSpendingComparison()}
        {renderGoalProgress()}
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
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray200,
    paddingVertical: SPACING.sm,
    paddingBottom: SPACING.md,
  },
  periodSelectorContent: {
    paddingHorizontal: SPACING.md,
  },
  periodButton: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: COLORS.gray100,
    marginRight: SPACING.xs,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  periodButtonActive: {
    backgroundColor: COLORS.primary,
  },
  periodButtonText: {
    fontSize: FONT_SIZES.xs,
    fontFamily: FONTS.medium,
    color: COLORS.textSecondary,
  },
  periodButtonTextActive: {
    color: COLORS.white,
  },
  content: {
    flex: 1,
  },
  summaryCard: {
    margin: SPACING.md,
  },
  cardTitle: {
    fontSize: FONT_SIZES.lg,
    fontFamily: FONTS.bold,
    color: COLORS.textPrimary,
    marginBottom: SPACING.md,
  },
  summaryGrid: {
    flexDirection: 'row',
    marginBottom: SPACING.md,
  },
  summaryItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  summaryIcon: {
    width: 40,
    height: 40,
    borderRadius: BORDER_RADIUS.md,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.sm,
  },
  summaryContent: {
    flex: 1,
  },
  summaryLabel: {
    fontSize: FONT_SIZES.xs,
    fontFamily: FONTS.regular,
    color: COLORS.textSecondary,
    marginBottom: 2,
  },
  summaryValue: {
    fontSize: FONT_SIZES.md,
    fontFamily: FONTS.bold,
    marginBottom: 2,
  },
  summaryCount: {
    fontSize: FONT_SIZES.xs,
    fontFamily: FONTS.regular,
    color: COLORS.textTertiary,
  },
  balanceContainer: {
    paddingTop: SPACING.md,
    borderTopWidth: 1,
    borderTopColor: COLORS.gray200,
    alignItems: 'center',
  },
  balanceLabel: {
    fontSize: FONT_SIZES.sm,
    fontFamily: FONTS.medium,
    color: COLORS.textSecondary,
    marginBottom: SPACING.xs,
  },
  balanceValue: {
    fontSize: FONT_SIZES.xxl,
    fontFamily: FONTS.bold,
  },
  chartCard: {
    margin: SPACING.md,
    marginTop: 0,
  },
  categoryDetails: {
    marginTop: SPACING.lg,
    paddingTop: SPACING.md,
    borderTopWidth: 1,
    borderTopColor: COLORS.gray200,
  },
  categoryDetailsTitle: {
    fontSize: FONT_SIZES.md,
    fontFamily: FONTS.semibold,
    color: COLORS.textPrimary,
    marginBottom: SPACING.sm,
  },
  categoryDetailItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: SPACING.sm,
  },
  categoryDetailLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  categoryDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: SPACING.sm,
  },
  categoryDetailLabel: {
    fontSize: FONT_SIZES.sm,
    fontFamily: FONTS.regular,
    color: COLORS.textPrimary,
  },
  categoryDetailRight: {
    alignItems: 'flex-end',
  },
  categoryDetailValue: {
    fontSize: FONT_SIZES.md,
    fontFamily: FONTS.semibold,
    color: COLORS.textPrimary,
  },
  categoryDetailCount: {
    fontSize: FONT_SIZES.xs,
    fontFamily: FONTS.regular,
    color: COLORS.textTertiary,
  },
  noDataContainer: {
    paddingVertical: SPACING.xl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  noDataText: {
    fontSize: FONT_SIZES.md,
    fontFamily: FONTS.regular,
    color: COLORS.textTertiary,
    marginTop: SPACING.sm,
  },
  trendInsights: {
    marginTop: SPACING.md,
    paddingTop: SPACING.md,
    borderTopWidth: 1,
    borderTopColor: COLORS.gray200,
  },
  trendInsight: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.xs,
  },
  trendInsightText: {
    fontSize: FONT_SIZES.sm,
    fontFamily: FONTS.regular,
    color: COLORS.textSecondary,
    marginLeft: SPACING.sm,
  },
  statsCard: {
    margin: SPACING.md,
    marginTop: 0,
  },
  statsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  statsGrid: {
    flexDirection: 'row',
    marginBottom: SPACING.md,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
    padding: SPACING.sm,
    backgroundColor: COLORS.gray50,
    borderRadius: BORDER_RADIUS.md,
  },
  statValue: {
    fontSize: FONT_SIZES.xl,
    fontFamily: FONTS.bold,
    color: COLORS.textPrimary,
    marginBottom: SPACING.xs,
  },
  statLabel: {
    fontSize: FONT_SIZES.xs,
    fontFamily: FONTS.regular,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  statsDetails: {
    marginTop: SPACING.sm,
  },
  statsDetailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: SPACING.xs,
    marginBottom: SPACING.xs,
  },
  statsDetailLabel: {
    fontSize: FONT_SIZES.sm,
    fontFamily: FONTS.regular,
    color: COLORS.textSecondary,
  },
  statsDetailValue: {
    fontSize: FONT_SIZES.md,
    fontFamily: FONTS.semibold,
    color: COLORS.textPrimary,
  },
  bottomSpacing: {
    height: SPACING.xl,
  },
});