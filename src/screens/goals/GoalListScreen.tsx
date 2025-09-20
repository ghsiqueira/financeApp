// src/screens/goals/GoalListScreen.tsx - VERSÃO COMPLETA COM VALOR MENSAL
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
import { useNavigation } from '@react-navigation/native';

// Importações do projeto
import { useGoals } from '../../hooks';
import { Goal } from '../../types';
import { formatCurrency, formatDate } from '../../utils';
import { EmptyState, Loading } from '../../components/common';
import { COLORS, FONTS, FONT_SIZES, SPACING, BORDER_RADIUS, SHADOWS } from '../../constants';

export const GoalListScreen: React.FC = () => {
  const navigation = useNavigation();
  const { goals, loading, refreshing, error, refresh, deleteGoal } = useGoals();
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'active' | 'completed' | 'paused'>('all');

  // Filtrar metas baseado no filtro selecionado
  const filteredGoals = goals.filter(goal => {
    switch (selectedFilter) {
      case 'active':
        return goal.status === 'active';
      case 'completed':
        return goal.status === 'completed';
      case 'paused':
        return goal.status === 'paused';
      default:
        return true;
    }
  });

  // Calcular progresso da meta
  const calculateProgress = (goal: Goal): number => {
    if (goal.targetAmount <= 0) return 0;
    return Math.min((goal.currentAmount / goal.targetAmount) * 100, 100);
  };

  // Obter cor do status
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return COLORS.success;
      case 'paused':
        return COLORS.warning;
      case 'active':
        return COLORS.primary;
      default:
        return COLORS.gray400;
    }
  };

  // Obter texto do status
  const getStatusText = (status: string) => {
    switch (status) {
      case 'completed':
        return 'Concluída';
      case 'paused':
        return 'Pausada';
      case 'active':
        return 'Ativa';
      default:
        return 'Indefinido';
    }
  };

  // Confirmar exclusão de meta
  const confirmDelete = (goal: Goal) => {
    Alert.alert(
      'Excluir Meta',
      `Tem certeza que deseja excluir a meta "${goal.title}"?`,
      [
        {
          text: 'Cancelar',
          style: 'cancel',
        },
        {
          text: 'Excluir',
          style: 'destructive',
          onPress: () => deleteGoal(goal._id),
        },
      ]
    );
  };

  // Navegação para criar nova meta
  const handleCreateGoal = () => {
    (navigation as any).navigate('CreateGoal');
  };

  // Navegação para detalhes da meta
  const handleGoalPress = (goal: Goal) => {
    (navigation as any).navigate('GoalDetail', { goalId: goal._id });
  };

  // Renderizar filtros
  const renderFilters = () => {
    const filters = [
      { key: 'all', label: 'Todas', count: goals.length },
      { key: 'active', label: 'Ativas', count: goals.filter(g => g.status === 'active').length },
      { key: 'completed', label: 'Concluídas', count: goals.filter(g => g.status === 'completed').length },
      { key: 'paused', label: 'Pausadas', count: goals.filter(g => g.status === 'paused').length },
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

  // Renderizar item da lista - ATUALIZADO COM VALOR MENSAL
  const renderGoalItem = ({ item: goal }: { item: Goal }) => {
    const progress = calculateProgress(goal);
    const statusColor = getStatusColor(goal.status);
    const isCompleted = goal.status === 'completed';
    const daysRemaining = goal.daysRemaining || 0;
    
    // Calcular valor mensal necessário
    const calculateMonthlyTarget = (goal: Goal): number => {
      const remainingAmount = Math.max(0, goal.targetAmount - goal.currentAmount);
      const remainingDays = daysRemaining;
      
      if (remainingDays <= 0 || isCompleted) return 0;
      
      const remainingMonths = Math.max(1, Math.ceil(remainingDays / 30));
      return remainingAmount / remainingMonths;
    };
    
    const monthlyTarget = calculateMonthlyTarget(goal);

    return (
      <TouchableOpacity
        style={styles.goalCard}
        onPress={() => handleGoalPress(goal)}
        activeOpacity={0.7}
      >
        {/* Header do card */}
        <View style={styles.goalHeader}>
          <View style={styles.goalTitleContainer}>
            <Text style={styles.goalTitle} numberOfLines={2}>
              {goal.title}
            </Text>
            <View style={[styles.statusBadge, { backgroundColor: statusColor + '20' }]}>
              <Text style={[styles.statusText, { color: statusColor }]}>
                {getStatusText(goal.status)}
              </Text>
            </View>
          </View>
          <TouchableOpacity
            style={styles.menuButton}
            onPress={() => confirmDelete(goal)}
          >
            <Ionicons name="trash-outline" size={20} color={COLORS.error} />
          </TouchableOpacity>
        </View>

        {/* Descrição */}
        {goal.description && (
          <Text style={styles.goalDescription} numberOfLines={2}>
            {goal.description}
          </Text>
        )}

        {/* Valor mensal necessário - NOVO */}
        {!isCompleted && monthlyTarget > 0 && (
          <View style={styles.monthlyTargetContainer}>
            <View style={styles.monthlyTargetInfo}>
              <Ionicons name="calendar" size={16} color={COLORS.primary} />
              <Text style={styles.monthlyTargetText}>
                Economizar por mês: {formatCurrency(monthlyTarget)}
              </Text>
            </View>
          </View>
        )}

        {/* Progresso */}
        <View style={styles.progressContainer}>
          <View style={styles.progressInfo}>
            <Text style={styles.progressText}>
              {formatCurrency(goal.currentAmount)} de {formatCurrency(goal.targetAmount)}
            </Text>
            <Text style={styles.progressPercentage}>
              {progress.toFixed(1)}%
            </Text>
          </View>
          <View style={styles.progressBarContainer}>
            <View
              style={[
                styles.progressBar,
                {
                  width: `${progress}%`,
                  backgroundColor: isCompleted ? COLORS.success : statusColor,
                },
              ]}
            />
          </View>
        </View>

        {/* Informações adicionais */}
        <View style={styles.goalFooter}>
          <View style={styles.goalInfo}>
            <Ionicons name="calendar-outline" size={16} color={COLORS.gray600} />
            <Text style={styles.goalInfoText}>
              {goal.targetDate ? formatDate(new Date(goal.targetDate)) : 'Sem prazo'}
            </Text>
          </View>
          {daysRemaining > 0 && !isCompleted && (
            <View style={styles.goalInfo}>
              <Ionicons name="time-outline" size={16} color={COLORS.gray600} />
              <Text style={styles.goalInfoText}>
                {daysRemaining} dias restantes
              </Text>
            </View>
          )}
          {goal.category && (
            <View style={styles.goalInfo}>
              <Ionicons name="pricetag-outline" size={16} color={COLORS.gray600} />
              <Text style={styles.goalInfoText}>
                {goal.category}
              </Text>
            </View>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  // Renderizar estado vazio
  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="flag-outline" size={80} color={COLORS.gray400} />
      <Text style={styles.emptyTitle}>Nenhuma meta encontrada</Text>
      <Text style={styles.emptyDescription}>
        {selectedFilter === 'all'
          ? 'Comece criando sua primeira meta financeira!'
          : `Não há metas ${selectedFilter === 'active' ? 'ativas' : selectedFilter === 'completed' ? 'concluídas' : 'pausadas'} no momento.`}
      </Text>
      {selectedFilter === 'all' && (
        <TouchableOpacity style={styles.createButton} onPress={handleCreateGoal}>
          <Text style={styles.createButtonText}>Criar Meta</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Minhas Metas</Text>
        <TouchableOpacity style={styles.addButton} onPress={handleCreateGoal}>
          <Ionicons name="add" size={24} color={COLORS.white} />
        </TouchableOpacity>
      </View>

      {/* Filtros */}
      {renderFilters()}

      {/* Lista de metas */}
      <FlatList
        data={filteredGoals}
        renderItem={renderGoalItem}
        keyExtractor={(item) => item._id}
        contentContainerStyle={[
          styles.listContainer,
          filteredGoals.length === 0 && styles.listContainerEmpty,
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
        ListEmptyComponent={renderEmptyState}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
      />

      {/* Botão flutuante para criar meta */}
      {filteredGoals.length > 0 && (
        <TouchableOpacity style={styles.floatingButton} onPress={handleCreateGoal}>
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
  listContainer: {
    padding: SPACING.md,
  },
  listContainerEmpty: {
    flex: 1,
  },
  separator: {
    height: SPACING.md,
  },
  goalCard: {
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
    ...SHADOWS.card,
  },
  goalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: SPACING.sm,
  },
  goalTitleContainer: {
    flex: 1,
    marginRight: SPACING.sm,
  },
  goalTitle: {
    fontSize: FONT_SIZES.lg,
    fontFamily: FONTS.bold,
    color: COLORS.textPrimary,
    marginBottom: SPACING.xs,
  },
  statusBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.full,
  },
  statusText: {
    fontSize: FONT_SIZES.xs,
    fontFamily: FONTS.medium,
  },
  menuButton: {
    padding: SPACING.xs,
  },
  goalDescription: {
    fontSize: FONT_SIZES.sm,
    fontFamily: FONTS.regular,
    color: COLORS.textSecondary,
    marginBottom: SPACING.md,
    lineHeight: 20,
  },
  // NOVOS ESTILOS para valor mensal
  monthlyTargetContainer: {
    marginBottom: SPACING.sm,
    padding: SPACING.sm,
    backgroundColor: COLORS.primary + '08',
    borderRadius: BORDER_RADIUS.sm,
    borderLeftWidth: 3,
    borderLeftColor: COLORS.primary,
  },
  monthlyTargetInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  monthlyTargetText: {
    fontSize: FONT_SIZES.sm,
    fontFamily: FONTS.bold,
    color: COLORS.primary,
    flex: 1,
  },
  // Estilos existentes continuam...
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
    color: COLORS.primary,
  },
  progressBarContainer: {
    height: 8,
    backgroundColor: COLORS.gray200,
    borderRadius: BORDER_RADIUS.full,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    borderRadius: BORDER_RADIUS.full,
  },
  goalFooter: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.md,
  },
  goalInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  goalInfoText: {
    fontSize: FONT_SIZES.xs,
    fontFamily: FONTS.regular,
    color: COLORS.gray600,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: SPACING.xl,
  },
  emptyTitle: {
    fontSize: FONT_SIZES.xl,
    fontFamily: FONTS.bold,
    color: COLORS.textPrimary,
    marginTop: SPACING.lg,
    marginBottom: SPACING.sm,
  },
  emptyDescription: {
    fontSize: FONT_SIZES.md,
    fontFamily: FONTS.regular,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: SPACING.xl,
  },
  createButton: {
    backgroundColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.md,
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.md,
  },
  createButtonText: {
    fontSize: FONT_SIZES.md,
    fontFamily: FONTS.bold,
    color: COLORS.white,
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