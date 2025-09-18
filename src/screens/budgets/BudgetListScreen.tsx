// src/screens/budgets/BudgetListScreen.tsx
import React, { useState, useEffect, useCallback } from 'react';
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
import { RouteProp } from '@react-navigation/native';

import { 
  ProgressBar,
  FloatingActionButton,
} from '../../components/common';
import { Card, Loading, EmptyState } from '../../components/common/BasicComponents';
import { Badge } from '../../components/common/Badge';
import { BudgetService, Budget } from '../../services/BudgetService';
import { COLORS, FONTS, FONT_SIZES, SPACING } from '../../constants';
import { formatCurrency } from '../../utils';

type BudgetStackParamList = {
  BudgetList: undefined;
  CreateBudget: undefined;
  EditBudget: { budgetId: string };
  BudgetDetails: { budgetId: string };
};

type BudgetListScreenNavigationProp = NativeStackNavigationProp<BudgetStackParamList, 'BudgetList'>;
type BudgetListScreenRouteProp = RouteProp<BudgetStackParamList, 'BudgetList'>;

interface Props {
  navigation: BudgetListScreenNavigationProp;
  route: BudgetListScreenRouteProp;
}

export const BudgetListScreen: React.FC<Props> = ({ navigation }) => {
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<'all' | 'active' | 'exceeded'>('all');

  // Carregar orçamentos
  const loadBudgets = async (showLoading = true) => {
    try {
      if (showLoading) setLoading(true);
      
      const response = await BudgetService.getBudgets(1, 50);
      
      if (response.success) {
        setBudgets(response.data);
      } else {
        Alert.alert('Erro', response.message || 'Não foi possível carregar os orçamentos');
      }
    } catch (error: any) {
      Alert.alert('Erro', error.message || 'Erro ao carregar orçamentos');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Recarregar ao focar na tela
  useFocusEffect(
    useCallback(() => {
      loadBudgets();
    }, [])
  );

  // Pull to refresh
  const onRefresh = () => {
    setRefreshing(true);
    loadBudgets(false);
  };

  // Deletar orçamento
  const handleDeleteBudget = (budget: Budget) => {
    Alert.alert(
      'Excluir Orçamento',
      `Tem certeza que deseja excluir o orçamento de "${budget.category?.name || budget.name}"?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Excluir',
          style: 'destructive',
          onPress: async () => {
            try {
              await BudgetService.deleteBudget(budget.id);
              await loadBudgets(false);
              Alert.alert('Sucesso', 'Orçamento excluído com sucesso!');
            } catch (error: any) {
              Alert.alert('Erro', error.message || 'Erro ao excluir orçamento');
            }
          },
        },
      ]
    );
  };

  // Calcular progresso do orçamento
  const calculateProgress = (budget: Budget): number => {
    if (budget.monthlyLimit <= 0) return 0;
    return Math.min((budget.spent / budget.monthlyLimit) * 100, 100);
  };

  // Obter status do orçamento
  const getBudgetStatus = (budget: Budget): 'safe' | 'warning' | 'danger' => {
    const progress = calculateProgress(budget);
    if (progress >= 100) return 'danger';
    if (progress >= 80) return 'warning';
    return 'safe';
  };

  // Renderizar filtros
  const renderFilters = () => {
    const filters = [
      { key: 'all', label: 'Todos', count: budgets.length },
      { 
        key: 'active', 
        label: 'Ativos', 
        count: budgets.filter(b => calculateProgress(b) < 100).length 
      },
      { 
        key: 'exceeded', 
        label: 'Excedidos', 
        count: budgets.filter(b => calculateProgress(b) >= 100).length 
      },
    ];

    return (
      <View style={styles.filtersContainer}>
        {filters.map((filterItem) => (
          <TouchableOpacity
            key={filterItem.key}
            style={[
              styles.filterButton,
              filter === filterItem.key && styles.activeFilterButton,
            ]}
            onPress={() => setFilter(filterItem.key as any)}
          >
            <Text
              style={[
                styles.filterText,
                filter === filterItem.key && styles.activeFilterText,
              ]}
            >
              {filterItem.label} ({filterItem.count})
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  // Renderizar item da lista
  const renderBudgetItem = ({ item: budget }: { item: Budget }) => {
    const progress = calculateProgress(budget);
    const status = getBudgetStatus(budget);
    const remainingAmount = Math.max(budget.monthlyLimit - budget.spent, 0);
    const isExceeded = budget.spent > budget.monthlyLimit;

    return (
      <Card style={styles.budgetCard}>
        <TouchableOpacity
          style={styles.budgetItem}
          onPress={() => navigation.navigate('BudgetDetails', { budgetId: budget.id })}
          activeOpacity={0.7}
        >
          {/* Header do orçamento */}
          <View style={styles.budgetHeader}>
            <View style={styles.budgetInfo}>
              <Text style={styles.budgetName} numberOfLines={1}>
                {budget.name}
              </Text>
              <Text style={styles.budgetCategory} numberOfLines={1}>
                {budget.category?.name || 'Sem categoria'}
              </Text>
            </View>
            
            <View style={styles.budgetStatus}>
              <Badge
                text={isExceeded ? 'Excedido' : 'Ativo'}
                variant={status === 'danger' ? 'error' : status === 'warning' ? 'warning' : 'success'}
                size="sm"
              />
            </View>
          </View>

          {/* Progresso */}
          <View style={styles.progressContainer}>
            <View style={styles.progressInfo}>
              <Text style={styles.progressText}>
                {formatCurrency(budget.spent)} de {formatCurrency(budget.monthlyLimit)}
              </Text>
              <Text style={[
                styles.progressPercentage,
                { color: status === 'danger' ? COLORS.error : status === 'warning' ? COLORS.warning : COLORS.success }
              ]}>
                {progress.toFixed(0)}%
              </Text>
            </View>
            
            <ProgressBar
              progress={progress}
              color={status === 'danger' ? COLORS.error : status === 'warning' ? COLORS.warning : COLORS.success}
              backgroundColor={COLORS.gray200}
              style={styles.progressBar}
            />
          </View>

          {/* Valor restante */}
          {!isExceeded ? (
            <Text style={styles.remainingAmount}>
              Restante: {formatCurrency(remainingAmount)}
            </Text>
          ) : (
            <Text style={styles.exceededAmount}>
              Excedido em: {formatCurrency(budget.spent - budget.monthlyLimit)}
            </Text>
          )}

          {/* Período */}
          <Text style={styles.budgetPeriod}>
            {budget.month}/{budget.year}
          </Text>

          {/* Ações */}
          <View style={styles.budgetActions}>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => navigation.navigate('EditBudget', { budgetId: budget.id })}
            >
              <Ionicons name="create" size={16} color={COLORS.info} />
              <Text style={styles.actionButtonText}>Editar</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionButton, styles.deleteButton]}
              onPress={() => handleDeleteBudget(budget)}
            >
              <Ionicons name="trash" size={16} color={COLORS.error} />
              <Text style={[styles.actionButtonText, styles.deleteButtonText]}>
                Excluir
              </Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Card>
    );
  };

  if (loading) {
    return <Loading text="Carregando orçamentos..." />;
  }

  const filteredBudgets = budgets.filter(budget => {
    if (filter === 'all') return true;
    if (filter === 'active') return calculateProgress(budget) < 100;
    if (filter === 'exceeded') return calculateProgress(budget) >= 100;
    return true;
  });

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Orçamentos</Text>
        <Text style={styles.subtitle}>
          Controle seus gastos mensais
        </Text>
      </View>

      {renderFilters()}

      <FlatList
        data={filteredBudgets}
        renderItem={renderBudgetItem}
        keyExtractor={(item) => item.id}
        style={styles.list}
        contentContainerStyle={[
          styles.listContent,
          filteredBudgets.length === 0 && styles.emptyListContent,
        ]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={COLORS.primary}
          />
        }
        ListEmptyComponent={
          <EmptyState
            title="Nenhum orçamento encontrado"
            description={
              filter === 'all'
                ? 'Comece criando seu primeiro orçamento'
                : `Você não tem orçamentos ${filter === 'active' ? 'ativos' : 'excedidos'}`
            }
            actionText={filter === 'all' ? 'Criar Orçamento' : undefined}
            onAction={filter === 'all' ? () => navigation.navigate('CreateBudget') : undefined}
          />
        }
      />

      <FloatingActionButton
        icon="add"
        onPress={() => navigation.navigate('CreateBudget')}
        style={styles.fab}
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
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
  },
  title: {
    fontSize: FONT_SIZES.xl,
    fontFamily: FONTS.bold,
    color: COLORS.textPrimary,
    marginBottom: SPACING.xs,
  },
  subtitle: {
    fontSize: FONT_SIZES.sm,
    fontFamily: FONTS.regular,
    color: COLORS.textSecondary,
  },
  filtersContainer: {
    flexDirection: 'row',
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.md,
    gap: SPACING.sm,
  },
  filterButton: {
    flex: 1,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    borderRadius: 8,
    backgroundColor: COLORS.gray100,
    alignItems: 'center',
  },
  activeFilterButton: {
    backgroundColor: COLORS.primary,
  },
  filterText: {
    fontSize: FONT_SIZES.sm,
    fontFamily: FONTS.medium,
    color: COLORS.textSecondary,
  },
  activeFilterText: {
    color: COLORS.white,
  },
  list: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.xl,
  },
  emptyListContent: {
    flex: 1,
    justifyContent: 'center',
  },
  budgetCard: {
    marginBottom: SPACING.md,
  },
  budgetItem: {
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
    marginRight: SPACING.md,
  },
  budgetName: {
    fontSize: FONT_SIZES.lg,
    fontFamily: FONTS.bold,
    color: COLORS.textPrimary,
    marginBottom: SPACING.xs,
  },
  budgetCategory: {
    fontSize: FONT_SIZES.sm,
    fontFamily: FONTS.regular,
    color: COLORS.textSecondary,
  },
  budgetStatus: {
    alignItems: 'flex-end',
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
    color: COLORS.textPrimary,
  },
  progressPercentage: {
    fontSize: FONT_SIZES.sm,
    fontFamily: FONTS.bold,
  },
  progressBar: {
    height: 8,
    borderRadius: 4,
  },
  remainingAmount: {
    fontSize: FONT_SIZES.xs,
    fontFamily: FONTS.regular,
    color: COLORS.success,
    marginBottom: SPACING.sm,
  },
  exceededAmount: {
    fontSize: FONT_SIZES.xs,
    fontFamily: FONTS.regular,
    color: COLORS.error,
    marginBottom: SPACING.sm,
  },
  budgetPeriod: {
    fontSize: FONT_SIZES.xs,
    fontFamily: FONTS.regular,
    color: COLORS.textSecondary,
    marginBottom: SPACING.md,
  },
  budgetActions: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    borderRadius: 8,
    backgroundColor: COLORS.gray100,
    gap: SPACING.xs,
  },
  deleteButton: {
    backgroundColor: COLORS.error10,
  },
  actionButtonText: {
    fontSize: FONT_SIZES.sm,
    fontFamily: FONTS.medium,
    color: COLORS.info,
  },
  deleteButtonText: {
    color: COLORS.error,
  },
  fab: {
    position: 'absolute',
    bottom: SPACING.xl,
    right: SPACING.lg,
  },
});