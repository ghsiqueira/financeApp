// src/screens/budgets/BudgetListScreen.tsx - COM TOAST E CONFIRM
import React, { useState } from 'react';
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
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { useBudgets, useToast, useConfirm } from '../../hooks';
import { Budget } from '../../types';
import { formatCurrency } from '../../utils';
import { Card, Loading, ProgressBar, Toast, ConfirmDialog } from '../../components/common';
import { COLORS, FONTS, FONT_SIZES, SPACING, BORDER_RADIUS, SHADOWS } from '../../constants';
import { BudgetStackParamList } from '../../navigation/BudgetNavigator';

type NavigationProp = NativeStackNavigationProp<BudgetStackParamList, 'BudgetList'>;

interface Props {
  navigation: NavigationProp;
}

export const BudgetListScreen: React.FC<Props> = ({ navigation }) => {
  const { budgets, loading, refreshing, error, refresh, deleteBudget } = useBudgets();
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'active' | 'over' | 'inactive'>('all');

  // Hooks de feedback
  const { toast, success, error: showError, hideToast } = useToast();
  const { confirm, confirmDelete } = useConfirm();

  // Filtrar orçamentos
  const filteredBudgets = budgets.filter(budget => {
    if (selectedFilter === 'all') return true;
    if (selectedFilter === 'active') return budget.isActive && budget.spent <= budget.monthlyLimit;
    if (selectedFilter === 'over') return budget.isActive && budget.spent > budget.monthlyLimit;
    if (selectedFilter === 'inactive') return !budget.isActive;
    return true;
  });

  const isEmpty = !loading && filteredBudgets.length === 0;

  // Deletar orçamento COM FEEDBACK
  const handleDeleteBudget = (budget: Budget) => {
    confirmDelete(budget.name, async () => {
      try {
        await deleteBudget(budget._id);
        success('Orçamento excluído com sucesso!');
      } catch (err: any) {
        showError(err.message || 'Erro ao excluir orçamento');
      }
    });
  };

  // Renderizar item da lista
  const renderBudgetItem = ({ item }: { item: Budget }) => {
    const progress = item.monthlyLimit > 0 ? (item.spent / item.monthlyLimit) * 100 : 0;
    const remaining = Math.max(0, item.monthlyLimit - item.spent);
    const isOverBudget = item.spent > item.monthlyLimit;

    const getBudgetColor = () => {
      if (isOverBudget) return COLORS.error;
      if (progress >= 90) return COLORS.warning;
      if (progress >= 70) return COLORS.info;
      return COLORS.success;
    };

    const categoryName = typeof item.category === 'string' 
      ? item.category 
      : (item.category?.name || 'Sem categoria');

    const getMonthName = (month: number): string => {
      const months = [
        'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
        'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
      ];
      return months[month - 1] || 'Mês';
    };

    return (
      <TouchableOpacity
        style={styles.budgetItem}
        onPress={() => navigation.navigate('BudgetDetail', { budgetId: item._id })}
        activeOpacity={0.7}
      >
        <Card style={styles.budgetCard}>
          {/* Header */}
          <View style={styles.budgetHeader}>
            <View style={styles.budgetInfo}>
              <Text style={styles.budgetName} numberOfLines={1}>
                {item.name}
              </Text>
              <Text style={styles.budgetCategory} numberOfLines={1}>
                {categoryName}
              </Text>
            </View>
            <View style={[styles.budgetStatus, { backgroundColor: getBudgetColor() + '15' }]}>
              <Ionicons
                name={isOverBudget ? 'alert-circle' : 'wallet'}
                size={24}
                color={getBudgetColor()}
              />
            </View>
          </View>

          {/* Valores */}
          <View style={styles.budgetValues}>
            <View style={styles.valueItem}>
              <Text style={styles.valueLabel}>Gasto</Text>
              <Text style={[styles.valueAmount, { color: isOverBudget ? COLORS.error : COLORS.textPrimary }]}>
                {formatCurrency(item.spent)}
              </Text>
            </View>
            <View style={styles.valueDivider} />
            <View style={styles.valueItem}>
              <Text style={styles.valueLabel}>Limite</Text>
              <Text style={styles.valueAmount}>
                {formatCurrency(item.monthlyLimit)}
              </Text>
            </View>
            <View style={styles.valueDivider} />
            <View style={styles.valueItem}>
              <Text style={styles.valueLabel}>Restante</Text>
              <Text style={[styles.valueAmount, { color: remaining > 0 ? COLORS.success : COLORS.error }]}>
                {formatCurrency(remaining)}
              </Text>
            </View>
          </View>

          {/* Progresso */}
          <View style={styles.progressContainer}>
            <View style={styles.progressHeader}>
              <Text style={styles.progressText}>{progress.toFixed(0)}%</Text>
              <Text style={[styles.statusText, { color: getBudgetColor() }]}>
                {isOverBudget ? 'Excedido' : 
                 progress >= 90 ? 'Atenção' :
                 progress >= 70 ? 'Próximo do limite' : 'Dentro do limite'}
              </Text>
            </View>
            <ProgressBar
              progress={progress}
              color={getBudgetColor()}
              height={8}
              showText={false}
            />
          </View>

          {/* Período */}
          <View style={styles.periodContainer}>
            <Ionicons name="calendar-outline" size={14} color={COLORS.textSecondary} />
            <Text style={styles.periodText}>
              {getMonthName(item.month)} {item.year}
            </Text>
          </View>

          {/* Ações */}
          <View style={styles.actionButtons}>
            <TouchableOpacity
              style={[styles.actionButton, styles.editButton]}
              onPress={() => navigation.navigate('EditBudget', { budgetId: item._id })}
            >
              <Ionicons name="create" size={16} color={COLORS.info} />
              <Text style={styles.editButtonText}>Editar</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionButton, styles.deleteButton]}
              onPress={() => handleDeleteBudget(item)}
            >
              <Ionicons name="trash" size={16} color={COLORS.error} />
              <Text style={styles.deleteButtonText}>Excluir</Text>
            </TouchableOpacity>
          </View>
        </Card>
      </TouchableOpacity>
    );
  };

  // Renderizar filtros
  const renderFilters = () => (
    <View style={styles.filterContainer}>
      {(['all', 'active', 'over', 'inactive'] as const).map(filter => (
        <TouchableOpacity
          key={filter}
          style={[
            styles.filterButton,
            selectedFilter === filter && styles.filterButtonActive,
          ]}
          onPress={() => setSelectedFilter(filter)}
        >
          <Text
            style={[
              styles.filterText,
              selectedFilter === filter && styles.filterTextActive,
            ]}
          >
            {filter === 'all' ? 'Todos' : 
             filter === 'active' ? 'Ativos' : 
             filter === 'over' ? 'Excedidos' : 'Inativos'}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  // Estado vazio
  const renderEmptyState = () => (
    <View style={styles.emptyStateContainer}>
      <Ionicons name="wallet-outline" size={64} color={COLORS.gray400} />
      <Text style={styles.emptyStateTitle}>Nenhum orçamento encontrado</Text>
      <Text style={styles.emptyStateDescription}>
        {selectedFilter === 'all'
          ? 'Comece criando seu primeiro orçamento para controlar seus gastos'
          : `Não há orçamentos ${selectedFilter === 'active' ? 'ativos' : selectedFilter === 'over' ? 'excedidos' : 'inativos'} no momento`}
      </Text>
      {selectedFilter === 'all' && (
        <TouchableOpacity
          style={styles.emptyStateButton}
          onPress={() => navigation.navigate('CreateBudget')}
        >
          <Text style={styles.emptyStateButtonText}>Criar Orçamento</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  // Loading
  if (loading && budgets.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Orçamentos</Text>
        </View>
        <Loading text="Carregando orçamentos..." />
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
        <Text style={styles.title}>Orçamentos</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => navigation.navigate('CreateBudget')}
        >
          <Ionicons name="add" size={24} color={COLORS.white} />
        </TouchableOpacity>
      </View>

      {/* Filtros */}
      {renderFilters()}

      {/* Lista */}
      {isEmpty ? (
        renderEmptyState()
      ) : (
        <FlatList
          data={filteredBudgets}
          renderItem={renderBudgetItem}
          keyExtractor={(item) => item._id}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={refresh}
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
  filterContainer: {
    flexDirection: 'row',
    padding: SPACING.md,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray200,
  },
  filterButton: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: COLORS.gray100,
    marginRight: SPACING.xs,
  },
  filterButtonActive: {
    backgroundColor: COLORS.primary,
  },
  filterText: {
    fontSize: FONT_SIZES.sm,
    fontFamily: FONTS.medium,
    color: COLORS.textSecondary,
  },
  filterTextActive: {
    color: COLORS.white,
  },
  listContent: {
    padding: SPACING.md,
  },
  budgetItem: {
    marginBottom: SPACING.md,
  },
  budgetCard: {
    padding: SPACING.md,
  },
  budgetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: SPACING.md,
  },
  budgetInfo: {
    flex: 1,
    marginRight: SPACING.sm,
  },
  budgetName: {
    fontSize: FONT_SIZES.lg,
    fontFamily: FONTS.semibold,
    color: COLORS.textPrimary,
    marginBottom: 4,
  },
  budgetCategory: {
    fontSize: FONT_SIZES.sm,
    fontFamily: FONTS.regular,
    color: COLORS.textSecondary,
  },
  budgetStatus: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  budgetValues: {
    flexDirection: 'row',
    marginBottom: SPACING.md,
    backgroundColor: COLORS.gray50,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.sm,
  },
  valueItem: {
    flex: 1,
    alignItems: 'center',
  },
  valueDivider: {
    width: 1,
    backgroundColor: COLORS.gray300,
    marginHorizontal: SPACING.xs,
  },
  valueLabel: {
    fontSize: FONT_SIZES.xs,
    fontFamily: FONTS.regular,
    color: COLORS.textSecondary,
    marginBottom: 4,
  },
  valueAmount: {
    fontSize: FONT_SIZES.md,
    fontFamily: FONTS.bold,
    color: COLORS.textPrimary,
  },
  progressContainer: {
    marginBottom: SPACING.sm,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: SPACING.xs,
  },
  progressText: {
    fontSize: FONT_SIZES.sm,
    fontFamily: FONTS.semibold,
    color: COLORS.textPrimary,
  },
  statusText: {
    fontSize: FONT_SIZES.xs,
    fontFamily: FONTS.medium,
  },
  periodContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  periodText: {
    fontSize: FONT_SIZES.xs,
    fontFamily: FONTS.regular,
    color: COLORS.textSecondary,
    marginLeft: 4,
  },
  actionButtons: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: COLORS.gray200,
    paddingTop: SPACING.sm,
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
  emptyStateTitle: {
    fontSize: FONT_SIZES.xl,
    fontFamily: FONTS.bold,
    color: COLORS.textPrimary,
    marginTop: SPACING.lg,
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