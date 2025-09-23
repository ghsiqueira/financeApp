// src/screens/budgets/BudgetListScreen.tsx - VERSÃO CORRIGIDA COM NAVEGAÇÃO
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Alert,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { useBudgets } from '../../hooks';
import { Budget } from '../../types';
import { formatCurrency } from '../../utils';
import { EmptyState, Loading, Card, ProgressBar } from '../../components/common';
import { COLORS, FONTS, FONT_SIZES, SPACING, BORDER_RADIUS, SHADOWS } from '../../constants';

// Types de navegação
type BudgetStackParamList = {
  BudgetList: undefined;
  CreateBudget: undefined;
  EditBudget: { budgetId: string };
  BudgetDetail: { budgetId: string };
};

interface BudgetListScreenProps {
  navigation: NativeStackNavigationProp<BudgetStackParamList>;
}

export const BudgetListScreen: React.FC<BudgetListScreenProps> = ({ navigation }) => {
  const { budgets, loading, refreshing, error, refresh, deleteBudget } = useBudgets();
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'active' | 'over' | 'inactive'>('all');

  // Filtrar orçamentos baseado no filtro selecionado
  const filteredBudgets = budgets.filter(budget => {
    switch (selectedFilter) {
      case 'active':
        return budget.isActive;
      case 'over':
        return budget.isOverBudget;
      case 'inactive':
        return !budget.isActive;
      default:
        return true;
    }
  });

  // Calcular progresso do orçamento
  const calculateProgress = (budget: Budget): number => {
    if (budget.monthlyLimit <= 0) return 0;
    return Math.min((budget.spent / budget.monthlyLimit) * 100, 100);
  };

  // Obter cor baseada no status do orçamento
  const getBudgetColor = (budget: Budget) => {
    if (!budget.isActive) return COLORS.gray400;
    if (budget.isOverBudget) return COLORS.error;
    
    const progress = calculateProgress(budget);
    if (progress >= 90) return COLORS.warning;
    if (progress >= 70) return COLORS.warning;
    return COLORS.success;
  };

  // Obter nome da categoria
  const getCategoryName = (budget: Budget): string => {
    if (typeof budget.category === 'string') {
      return budget.category;
    }
    return budget.category?.name || 'Categoria não definida';
  };

  // Confirmar exclusão de orçamento
  const confirmDelete = (budget: Budget) => {
    const categoryName = getCategoryName(budget);
    Alert.alert(
      'Excluir Orçamento',
      `Tem certeza que deseja excluir o orçamento para "${categoryName}"?`,
      [
        {
          text: 'Cancelar',
          style: 'cancel',
        },
        {
          text: 'Excluir',
          style: 'destructive',
          onPress: () => deleteBudget(budget._id),
        },
      ]
    );
  };

  // Navegação
  const handleCreateBudget = () => {
    navigation.navigate('CreateBudget');
  };

  const handleBudgetPress = (budget: Budget) => {
    navigation.navigate('BudgetDetail', { budgetId: budget._id });
  };

  const handleEditBudget = (budget: Budget) => {
    navigation.navigate('EditBudget', { budgetId: budget._id });
  };

  // Renderizar filtros
  const renderFilters = () => {
    const filters = [
      { key: 'all', label: 'Todos', count: budgets.length },
      { key: 'active', label: 'Ativos', count: budgets.filter(b => b.isActive).length },
      { key: 'over', label: 'Excedidos', count: budgets.filter(b => b.isOverBudget).length },
      { key: 'inactive', label: 'Inativos', count: budgets.filter(b => !b.isActive).length },
    ];

    return (
      <View style={styles.filtersContainer}>
        {filters.map((filter) => (
          <TouchableOpacity
            key={filter.key}
            style={[
              styles.filterButton,
              selectedFilter === filter.key && styles.filterButtonActive,
            ]}
            onPress={() => setSelectedFilter(filter.key as any)}
          >
            <Text
              style={[
                styles.filterButtonText,
                selectedFilter === filter.key && styles.filterButtonTextActive,
              ]}
            >
              {filter.label}
            </Text>
            <View
              style={[
                styles.filterCount,
                selectedFilter === filter.key && styles.filterCountActive,
              ]}
            >
              <Text
                style={[
                  styles.filterCountText,
                  selectedFilter === filter.key && styles.filterCountTextActive,
                ]}
              >
                {filter.count}
              </Text>
            </View>
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  // Renderizar resumo no topo
  const renderSummary = () => {
    if (budgets.length === 0) return null;

    const totalLimit = budgets.reduce((sum, b) => sum + (b.monthlyLimit || 0), 0);
    const totalSpent = budgets.reduce((sum, b) => sum + (b.spent || 0), 0);
    const overBudgetCount = budgets.filter(b => b.isOverBudget).length;

    return (
      <Card style={styles.summaryCard}>
        <Text style={styles.summaryTitle}>Resumo do Mês</Text>
        <View style={styles.summaryItems}>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>Total Gasto</Text>
            <Text style={[styles.summaryValue, { color: COLORS.error }]}>
              {formatCurrency(totalSpent)}
            </Text>
          </View>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>Total Limite</Text>
            <Text style={styles.summaryValue}>
              {formatCurrency(totalLimit)}
            </Text>
          </View>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>Excedidos</Text>
            <Text style={[styles.summaryValue, { color: COLORS.error }]}>
              {overBudgetCount}
            </Text>
          </View>
        </View>
      </Card>
    );
  };

  // Renderizar item da lista
  const renderBudgetItem = ({ item: budget }: { item: Budget }) => {
    const progress = calculateProgress(budget);
    const budgetColor = getBudgetColor(budget);
    const remaining = budget.monthlyLimit - budget.spent;
    const categoryName = getCategoryName(budget);

    return (
      <TouchableOpacity
        style={styles.budgetCard}
        onPress={() => handleBudgetPress(budget)}
        activeOpacity={0.7}
      >
        {/* Header do card */}
        <View style={styles.budgetHeader}>
          <View style={styles.budgetTitleContainer}>
            <View style={styles.categoryInfo}>
              <Ionicons 
                name="pricetag" 
                size={20} 
                color={budgetColor} 
                style={styles.categoryIcon}
              />
              <Text style={styles.budgetTitle}>
                {categoryName}
              </Text>
            </View>
            <View style={styles.statusContainer}>
              {!budget.isActive && (
                <View style={[styles.statusBadge, { backgroundColor: COLORS.gray400 + '20' }]}>
                  <Text style={[styles.statusText, { color: COLORS.gray400 }]}>
                    Inativo
                  </Text>
                </View>
              )}
              {budget.isOverBudget && (
                <View style={[styles.statusBadge, { backgroundColor: COLORS.error + '20' }]}>
                  <Text style={[styles.statusText, { color: COLORS.error }]}>
                    Excedido
                  </Text>
                </View>
              )}
            </View>
          </View>
          
          <View style={styles.menuContainer}>
            <TouchableOpacity
              style={styles.menuButton}
              onPress={() => handleEditBudget(budget)}
            >
              <Ionicons name="pencil-outline" size={20} color={COLORS.primary} />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.menuButton}
              onPress={() => confirmDelete(budget)}
            >
              <Ionicons name="trash-outline" size={20} color={COLORS.error} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Valores */}
        <View style={styles.valuesContainer}>
          <View style={styles.valueItem}>
            <Text style={styles.valueLabel}>Gasto</Text>
            <Text style={[styles.valueAmount, { color: budgetColor }]}>
              {formatCurrency(budget.spent)}
            </Text>
          </View>
          <View style={styles.valueDivider} />
          <View style={styles.valueItem}>
            <Text style={styles.valueLabel}>Limite</Text>
            <Text style={styles.valueAmount}>
              {formatCurrency(budget.monthlyLimit)}
            </Text>
          </View>
          <View style={styles.valueDivider} />
          <View style={styles.valueItem}>
            <Text style={styles.valueLabel}>
              {remaining >= 0 ? 'Restante' : 'Excesso'}
            </Text>
            <Text style={[
              styles.valueAmount, 
              { color: remaining >= 0 ? COLORS.success : COLORS.error }
            ]}>
              {formatCurrency(Math.abs(remaining))}
            </Text>
          </View>
        </View>

        {/* Progresso */}
        <View style={styles.progressContainer}>
          <View style={styles.progressInfo}>
            <Text style={styles.progressText}>
              {progress.toFixed(1)}% utilizado
            </Text>
            {budget.isActive && (
              <Text style={[styles.progressStatus, { color: budgetColor }]}>
                {budget.isOverBudget ? 'Orçamento excedido' : 
                 progress >= 90 ? 'Atenção ao limite' :
                 progress >= 70 ? 'Próximo do limite' : 'Dentro do limite'}
              </Text>
            )}
          </View>
          <ProgressBar 
            progress={progress} 
            color={budgetColor} 
            height={8}
            showText={false}
            style={styles.progressBar}
          />
        </View>

        {/* Período */}
        <View style={styles.periodContainer}>
          <Ionicons name="calendar-outline" size={16} color={COLORS.gray600} />
          <Text style={styles.periodText}>
            {getMonthName(budget.month)} {budget.year}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  // Função auxiliar para nome do mês
  const getMonthName = (month: number): string => {
    const months = [
      'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
      'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
    ];
    return months[month - 1] || 'Mês inválido';
  };

  // Renderizar estado vazio
  const renderEmptyState = () => (
    <EmptyState
      icon="pie-chart-outline"
      title="Nenhum orçamento encontrado"
      description={
        selectedFilter === 'all'
          ? 'Comece criando seu primeiro orçamento para controlar seus gastos!'
          : `Não há orçamentos ${
              selectedFilter === 'active' ? 'ativos' : 
              selectedFilter === 'over' ? 'excedidos' : 
              'inativos'
            } no momento.`
      }
      actionText={selectedFilter === 'all' ? 'Criar Orçamento' : undefined}
      onAction={selectedFilter === 'all' ? handleCreateBudget : undefined}
    />
  );

  if (loading && budgets.length === 0) {
    return <Loading text="Carregando orçamentos..." />;
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Orçamentos</Text>
        <TouchableOpacity style={styles.addButton} onPress={handleCreateBudget}>
          <Ionicons name="add" size={24} color={COLORS.white} />
        </TouchableOpacity>
      </View>

      {/* Filtros */}
      {renderFilters()}

      {/* Lista de orçamentos */}
      <FlatList
        data={filteredBudgets}
        renderItem={renderBudgetItem}
        keyExtractor={(item) => item._id}
        contentContainerStyle={[
          styles.listContainer,
          filteredBudgets.length === 0 && styles.listContainerEmpty,
        ]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={refresh}
            colors={[COLORS.primary]}
            tintColor={COLORS.primary}
          />
        }
        ListHeaderComponent={renderSummary}
        ListEmptyComponent={renderEmptyState}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
      />

      {/* Botão flutuante para criar orçamento */}
      {filteredBudgets.length > 0 && (
        <TouchableOpacity style={styles.floatingButton} onPress={handleCreateBudget}>
          <Ionicons name="add" size={28} color={COLORS.white} />
        </TouchableOpacity>
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
  headerTitle: {
    fontSize: FONT_SIZES.xl,
    fontFamily: FONTS.bold,
    color: COLORS.textPrimary,
  },
  addButton: {
    backgroundColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.full,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  filtersContainer: {
    flexDirection: 'row',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    backgroundColor: COLORS.white,
    gap: SPACING.xs,
  },
  filterButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.xs,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: COLORS.gray100,
    gap: SPACING.xs,
  },
  filterButtonActive: {
    backgroundColor: COLORS.primary,
  },
  filterButtonText: {
    fontSize: FONT_SIZES.sm,
    fontFamily: FONTS.medium,
    color: COLORS.gray600,
  },
  filterButtonTextActive: {
    color: COLORS.white,
  },
  filterCount: {
    backgroundColor: COLORS.gray300,
    borderRadius: BORDER_RADIUS.full,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: SPACING.xs,
  },
  filterCountActive: {
    backgroundColor: COLORS.white,
  },
  filterCountText: {
    fontSize: FONT_SIZES.xs,
    fontFamily: FONTS.bold,
    color: COLORS.gray600,
  },
  filterCountTextActive: {
    color: COLORS.primary,
  },
  summaryCard: {
    margin: SPACING.md,
    marginBottom: SPACING.sm,
    padding: SPACING.md,
  },
  summaryTitle: {
    fontSize: FONT_SIZES.lg,
    fontFamily: FONTS.bold,
    color: COLORS.textPrimary,
    marginBottom: SPACING.md,
  },
  summaryItems: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  summaryItem: {
    alignItems: 'center',
    flex: 1,
  },
  summaryLabel: {
    fontSize: FONT_SIZES.xs,
    fontFamily: FONTS.regular,
    color: COLORS.textSecondary,
    marginBottom: SPACING.xs,
    textAlign: 'center',
  },
  summaryValue: {
    fontSize: FONT_SIZES.md,
    fontFamily: FONTS.bold,
    color: COLORS.textPrimary,
  },
  listContainer: {
    paddingHorizontal: SPACING.md,
    paddingBottom: SPACING.xl,
  },
  listContainerEmpty: {
    flex: 1,
  },
  separator: {
    height: SPACING.md,
  },
  budgetCard: {
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
    ...SHADOWS.card,
  },
  budgetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: SPACING.md,
  },
  budgetTitleContainer: {
    flex: 1,
    marginRight: SPACING.sm,
  },
  categoryInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.xs,
  },
  categoryIcon: {
    marginRight: SPACING.xs,
  },
  budgetTitle: {
    fontSize: FONT_SIZES.lg,
    fontFamily: FONTS.bold,
    color: COLORS.textPrimary,
  },
  statusContainer: {
    flexDirection: 'row',
    gap: SPACING.xs,
  },
  statusBadge: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.full,
  },
  statusText: {
    fontSize: FONT_SIZES.xs,
    fontFamily: FONTS.medium,
  },
  menuContainer: {
    flexDirection: 'row',
    gap: SPACING.xs,
  },
  menuButton: {
    padding: SPACING.xs,
  },
  valuesContainer: {
    flexDirection: 'row',
    marginBottom: SPACING.md,
    backgroundColor: COLORS.gray50,
    borderRadius: BORDER_RADIUS.sm,
    padding: SPACING.sm,
  },
  valueItem: {
    flex: 1,
    alignItems: 'center',
  },
  valueLabel: {
    fontSize: FONT_SIZES.xs,
    fontFamily: FONTS.regular,
    color: COLORS.textSecondary,
    marginBottom: SPACING.xs,
  },
  valueAmount: {
    fontSize: FONT_SIZES.sm,
    fontFamily: FONTS.bold,
    color: COLORS.textPrimary,
  },
  valueDivider: {
    width: 1,
    backgroundColor: COLORS.border,
    marginHorizontal: SPACING.sm,
  },
  progressContainer: {
    marginBottom: SPACING.sm,
  },
  progressInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.xs,
  },
  progressText: {
    fontSize: FONT_SIZES.sm,
    fontFamily: FONTS.medium,
    color: COLORS.textPrimary,
  },
  progressStatus: {
    fontSize: FONT_SIZES.xs,
    fontFamily: FONTS.regular,
  },
  progressBar: {
    marginBottom: SPACING.xs,
  },
  periodContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  periodText: {
    fontSize: FONT_SIZES.xs,
    fontFamily: FONTS.regular,
    color: COLORS.gray600,
  },
  floatingButton: {
    position: 'absolute',
    bottom: SPACING.xl,
    right: SPACING.xl,
    backgroundColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.full,
    width: 56,
    height: 56,
    justifyContent: 'center',
    alignItems: 'center',
    ...SHADOWS.lg,
  },
});