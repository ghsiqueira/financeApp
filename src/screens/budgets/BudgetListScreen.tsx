// src/screens/budgets/BudgetListScreen.tsx - VERSÃO CORRIGIDA COMPLETA
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
      `Tem certeza que deseja excluir o orçamento "${budget.name}" para "${categoryName}"?`,
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
            {filter.count > 0 && (
              <View style={[
                styles.filterBadge,
                selectedFilter === filter.key && styles.filterBadgeActive,
              ]}>
                <Text style={[
                  styles.filterBadgeText,
                  selectedFilter === filter.key && styles.filterBadgeTextActive,
                ]}>
                  {filter.count}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  // Renderizar item do orçamento
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
        {/* Header */}
        <View style={styles.budgetHeader}>
          <View style={styles.budgetInfo}>
            <View style={styles.titleContainer}>
              <Text style={styles.budgetName} numberOfLines={1}>
                {budget.name}
              </Text>
              <Text style={styles.categoryName} numberOfLines={1}>
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

  // Header com resumo
  const renderHeader = () => (
    <View style={styles.headerContainer}>
      <View style={styles.summaryContainer}>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryLabel}>Orçamentos</Text>
          <Text style={styles.summaryValue}>{budgets.length}</Text>
        </View>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryLabel}>Ativos</Text>
          <Text style={[styles.summaryValue, { color: COLORS.success }]}>
            {budgets.filter(b => b.isActive).length}
          </Text>
        </View>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryLabel}>Excedidos</Text>
          <Text style={[styles.summaryValue, { color: COLORS.error }]}>
            {budgets.filter(b => b.isOverBudget).length}
          </Text>
        </View>
      </View>
      {renderFilters()}
    </View>
  );

  // Loading state
  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Orçamentos</Text>
          <TouchableOpacity
            style={styles.addButton}
            onPress={handleCreateBudget}
          >
            <Ionicons name="add" size={24} color={COLORS.white} />
          </TouchableOpacity>
        </View>
        <Loading />
      </SafeAreaView>
    );
  }

  // Error state
  if (error && budgets.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Orçamentos</Text>
          <TouchableOpacity
            style={styles.addButton}
            onPress={handleCreateBudget}
          >
            <Ionicons name="add" size={24} color={COLORS.white} />
          </TouchableOpacity>
        </View>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={64} color={COLORS.error} />
          <Text style={styles.errorTitle}>Erro ao carregar orçamentos</Text>
          <Text style={styles.errorMessage}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={refresh}>
            <Text style={styles.retryButtonText}>Tentar novamente</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Orçamentos</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={handleCreateBudget}
        >
          <Ionicons name="add" size={24} color={COLORS.white} />
        </TouchableOpacity>
      </View>

      {/* Lista */}
      <FlatList
        data={filteredBudgets}
        renderItem={renderBudgetItem}
        keyExtractor={(item) => item._id}
        ListHeaderComponent={budgets.length > 0 ? renderHeader : undefined}
        ListEmptyComponent={renderEmptyState}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={refresh}
            colors={[COLORS.primary]}
            tintColor={COLORS.primary}
          />
        }
        contentContainerStyle={[
          styles.listContainer,
          filteredBudgets.length === 0 && styles.emptyContainer
        ]}
        showsVerticalScrollIndicator={false}
      />
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
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray100,
    ...SHADOWS.sm,
  },
  title: {
    fontSize: FONT_SIZES.xl,
    fontFamily: FONTS.bold,
    color: COLORS.gray900,
  },
  addButton: {
    backgroundColor: COLORS.primary,
    width: 44,
    height: 44,
    borderRadius: BORDER_RADIUS.full,
    justifyContent: 'center',
    alignItems: 'center',
    ...SHADOWS.md,
  },
  listContainer: {
    padding: SPACING.md,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  headerContainer: {
    marginBottom: SPACING.lg,
  },
  summaryContainer: {
    flexDirection: 'row',
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    marginBottom: SPACING.md,
    ...SHADOWS.sm,
  },
  summaryItem: {
    flex: 1,
    alignItems: 'center',
  },
  summaryLabel: {
    fontSize: FONT_SIZES.sm,
    fontFamily: FONTS.medium,
    color: COLORS.gray600,
    marginBottom: SPACING.xs,
  },
  summaryValue: {
    fontSize: FONT_SIZES.xl,
    fontFamily: FONTS.bold,
    color: COLORS.gray900,
  },
  filtersContainer: {
    flexDirection: 'row',
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.xs,
    ...SHADOWS.sm,
  },
  filterButton: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.xs,
    borderRadius: BORDER_RADIUS.md,
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
  filterBadge: {
    backgroundColor: COLORS.gray100,
    borderRadius: BORDER_RADIUS.full,
    paddingHorizontal: SPACING.xs,
    paddingVertical: 2,
    marginLeft: SPACING.xs,
    minWidth: 20,
    alignItems: 'center',
  },
  filterBadgeActive: {
    backgroundColor: COLORS.white,
  },
  filterBadgeText: {
    fontSize: FONT_SIZES.xs,
    fontFamily: FONTS.bold,
    color: COLORS.gray600,
  },
  filterBadgeTextActive: {
    color: COLORS.primary,
  },
  budgetCard: {
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    marginBottom: SPACING.md,
    ...SHADOWS.sm,
  },
  budgetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: SPACING.md,
  },
  budgetInfo: {
    flex: 1,
  },
  titleContainer: {
    marginBottom: SPACING.xs,
  },
  budgetName: {
    fontSize: FONT_SIZES.lg,
    fontFamily: FONTS.bold,
    color: COLORS.gray900,
    marginBottom: 2,
  },
  categoryName: {
    fontSize: FONT_SIZES.sm,
    fontFamily: FONTS.medium,
    color: COLORS.gray600,
  },
  statusContainer: {
    flexDirection: 'row',
    marginTop: SPACING.xs,
  },
  statusBadge: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
    borderRadius: BORDER_RADIUS.sm,
    marginRight: SPACING.xs,
  },
  statusText: {
    fontSize: FONT_SIZES.xs,
    fontFamily: FONTS.bold,
  },
  menuContainer: {
    flexDirection: 'row',
  },
  menuButton: {
    padding: SPACING.sm,
    marginLeft: SPACING.xs,
  },
  valuesContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  valueItem: {
    flex: 1,
    alignItems: 'center',
  },
  valueDivider: {
    width: 1,
    height: 30,
    backgroundColor: COLORS.gray200,
    marginHorizontal: SPACING.sm,
  },
  valueLabel: {
    fontSize: FONT_SIZES.xs,
    fontFamily: FONTS.medium,
    color: COLORS.gray600,
    marginBottom: 4,
  },
  valueAmount: {
    fontSize: FONT_SIZES.md,
    fontFamily: FONTS.bold,
    color: COLORS.gray900,
  },
  progressContainer: {
    marginBottom: SPACING.md,
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
    color: COLORS.gray700,
  },
  progressStatus: {
    fontSize: FONT_SIZES.xs,
    fontFamily: FONTS.medium,
  },
  progressBar: {
    borderRadius: BORDER_RADIUS.sm,
  },
  periodContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  periodText: {
    fontSize: FONT_SIZES.sm,
    fontFamily: FONTS.medium,
    color: COLORS.gray600,
    marginLeft: SPACING.xs,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.xl,
  },
  errorTitle: {
    fontSize: FONT_SIZES.lg,
    fontFamily: FONTS.bold,
    color: COLORS.error,
    marginTop: SPACING.md,
    marginBottom: SPACING.sm,
  },
  errorMessage: {
    fontSize: FONT_SIZES.md,
    fontFamily: FONTS.regular,
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