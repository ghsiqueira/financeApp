// src/screens/goals/GoalListScreen.tsx
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
  Card, 
  EmptyState, 
  Loading, 
  FloatingActionButton,
  ProgressBar,
  Button
} from '../../components/common';
import { GoalService, Goal } from '../../services/GoalService';
import { COLORS, FONTS, FONT_SIZES, SPACING } from '../../constants';
import { formatCurrency, formatDate } from '../../utils';

type GoalStackParamList = {
  GoalList: undefined;
  CreateGoal: undefined;
  EditGoal: { goalId: string };
  GoalDetails: { goalId: string };
};

type GoalListScreenNavigationProp = NativeStackNavigationProp<GoalStackParamList, 'GoalList'>;
type GoalListScreenRouteProp = RouteProp<GoalStackParamList, 'GoalList'>;

interface Props {
  navigation: GoalListScreenNavigationProp;
  route: GoalListScreenRouteProp;
}

export const GoalListScreen: React.FC<Props> = ({ navigation }) => {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<'all' | 'active' | 'completed'>('all');

  // Carregar metas
  const loadGoals = async (showLoading = true) => {
    try {
      if (showLoading) setLoading(true);
      
      const response = await GoalService.getGoals(1, 50, {
        status: filter === 'all' ? undefined : filter,
      });
      
      if (response.success) {
        setGoals(response.data);
      } else {
        Alert.alert('Erro', response.message || 'Não foi possível carregar as metas');
      }
    } catch (error: any) {
      Alert.alert('Erro', error.message || 'Erro ao carregar metas');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Recarregar ao focar na tela
  useFocusEffect(
    useCallback(() => {
      loadGoals();
    }, [filter])
  );

  // Pull to refresh
  const onRefresh = () => {
    setRefreshing(true);
    loadGoals(false);
  };

  // Deletar meta
  const handleDeleteGoal = (goal: Goal) => {
    Alert.alert(
      'Excluir Meta',
      `Tem certeza que deseja excluir a meta "${goal.title}"?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Excluir',
          style: 'destructive',
          onPress: async () => {
            try {
              await GoalService.deleteGoal(goal.id);
              await loadGoals(false);
              Alert.alert('Sucesso', 'Meta excluída com sucesso!');
            } catch (error: any) {
              Alert.alert('Erro', error.message || 'Erro ao excluir meta');
            }
          },
        },
      ]
    );
  };

  // Calcular progresso da meta
  const calculateProgress = (goal: Goal): number => {
    if (goal.targetAmount <= 0) return 0;
    return Math.min((goal.currentAmount / goal.targetAmount) * 100, 100);
  };

  // Renderizar filtros
  const renderFilters = () => {
    const filters = [
      { key: 'all', label: 'Todas', count: goals.length },
      { key: 'active', label: 'Ativas', count: goals.filter(g => g.status === 'active').length },
      { key: 'completed', label: 'Concluídas', count: goals.filter(g => g.status === 'completed').length },
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
  const renderGoalItem = ({ item: goal }: { item: Goal }) => {
    const progress = calculateProgress(goal);
    const isCompleted = goal.status === 'completed';
    const daysLeft = Math.ceil(
      (new Date(goal.targetDate || goal.endDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
    );

    return (
      <Card style={styles.goalCard}>
        <TouchableOpacity
          style={styles.goalItem}
          onPress={() => navigation.navigate('GoalDetails', { goalId: goal.id })}
          activeOpacity={0.7}
        >
          {/* Header da meta */}
          <View style={styles.goalHeader}>
            <View style={styles.goalInfo}>
              <Text style={styles.goalTitle} numberOfLines={1}>
                {goal.title}
              </Text>
              {goal.category && (
                <Text style={styles.goalCategory} numberOfLines={1}>
                  {goal.category}
                </Text>
              )}
            </View>
            
            <View style={styles.goalStatus}>
              <View style={[
                styles.statusBadge,
                {
                  backgroundColor: isCompleted ? COLORS.success10 : 
                                  daysLeft < 0 ? COLORS.error10 : COLORS.primary10
                }
              ]}>
                <Text style={[
                  styles.statusText,
                  {
                    color: isCompleted ? COLORS.success : 
                          daysLeft < 0 ? COLORS.error : COLORS.primary
                  }
                ]}>
                  {isCompleted ? 'Concluída' : 
                   daysLeft < 0 ? 'Vencida' : 
                   daysLeft === 0 ? 'Hoje' : `${daysLeft}d`}
                </Text>
              </View>
            </View>
          </View>

          {/* Progresso */}
          <View style={styles.progressContainer}>
            <View style={styles.progressInfo}>
              <Text style={styles.progressText}>
                {formatCurrency(goal.currentAmount)} de {formatCurrency(goal.targetAmount)}
              </Text>
              <Text style={styles.progressPercentage}>
                {progress.toFixed(0)}%
              </Text>
            </View>
            
            <ProgressBar
              progress={progress}
              color={isCompleted ? COLORS.success : COLORS.primary}
              backgroundColor={COLORS.gray200}
              style={styles.progressBar}
            />
          </View>

          {/* Data alvo */}
          <Text style={styles.targetDate}>
            Meta para: {formatDate(goal.targetDate || goal.endDate)}
          </Text>

          {/* Ações */}
          <View style={styles.goalActions}>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => navigation.navigate('EditGoal', { goalId: goal.id })}
            >
              <Ionicons name="create" size={16} color={COLORS.info} />
              <Text style={styles.actionButtonText}>Editar</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionButton, styles.deleteButton]}
              onPress={() => handleDeleteGoal(goal)}
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
    return <Loading text="Carregando metas..." />;
  }

  const filteredGoals = goals.filter(goal => {
    if (filter === 'all') return true;
    return goal.status === filter;
  });

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Metas Financeiras</Text>
        <Text style={styles.subtitle}>
          Organize e acompanhe seus objetivos
        </Text>
      </View>

      {renderFilters()}

      <FlatList
        data={filteredGoals}
        renderItem={renderGoalItem}
        keyExtractor={(item) => item.id}
        style={styles.list}
        contentContainerStyle={[
          styles.listContent,
          filteredGoals.length === 0 && styles.emptyListContent,
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
            icon="flag-outline"
            title="Nenhuma meta encontrada"
            description={
              filter === 'all'
                ? 'Comece criando sua primeira meta financeira'
                : `Você não tem metas ${filter === 'active' ? 'ativas' : 'concluídas'}`
            }
            actionText={filter === 'all' ? 'Criar Meta' : undefined}
            onAction={filter === 'all' ? () => navigation.navigate('CreateGoal') : undefined}
          />
        }
      />

      <FloatingActionButton
        icon="add"
        onPress={() => navigation.navigate('CreateGoal')}
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
  goalCard: {
    marginBottom: SPACING.md,
  },
  goalItem: {
    padding: SPACING.md,
  },
  goalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: SPACING.md,
  },
  goalInfo: {
    flex: 1,
    marginRight: SPACING.md,
  },
  goalTitle: {
    fontSize: FONT_SIZES.lg,
    fontFamily: FONTS.bold,
    color: COLORS.textPrimary,
    marginBottom: SPACING.xs,
  },
  goalCategory: {
    fontSize: FONT_SIZES.sm,
    fontFamily: FONTS.regular,
    color: COLORS.textSecondary,
  },
  goalStatus: {
    alignItems: 'flex-end',
  },
  statusBadge: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: 12,
  },
  statusText: {
    fontSize: FONT_SIZES.xs,
    fontFamily: FONTS.medium,
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
    color: COLORS.primary,
  },
  progressBar: {
    height: 8,
    borderRadius: 4,
  },
  targetDate: {
    fontSize: FONT_SIZES.xs,
    fontFamily: FONTS.regular,
    color: COLORS.textSecondary,
    marginBottom: SPACING.md,
  },
  goalActions: {
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