// src/screens/goals/GoalListScreen.tsx - COM TOAST E CONFIRM
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

import { useGoals, useToast, useConfirm } from '../../hooks';
import { Goal } from '../../types';
import { formatCurrency, formatDate } from '../../utils';
import { Card, Loading, ProgressBar, Toast, ConfirmDialog } from '../../components/common';
import { COLORS, FONTS, FONT_SIZES, SPACING, BORDER_RADIUS, SHADOWS } from '../../constants';
import { GoalStackParamList } from '../../navigation/GoalNavigator';

type NavigationProp = NativeStackNavigationProp<GoalStackParamList, 'GoalList'>;

interface Props {
  navigation: NavigationProp;
}

export const GoalListScreen: React.FC<Props> = ({ navigation }) => {
  const { goals, loading, refreshing, error, refresh, deleteGoal } = useGoals();
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'active' | 'completed' | 'paused'>('all');

  // Hooks de feedback
  const { toast, success, error: showError, hideToast } = useToast();
  const { confirm, confirmDelete } = useConfirm();

  // Filtrar metas
  const filteredGoals = goals.filter(goal => {
    if (selectedFilter === 'all') return true;
    return goal.status === selectedFilter;
  });

  const isEmpty = !loading && filteredGoals.length === 0;

  // Deletar meta COM FEEDBACK
  const handleDeleteGoal = (goal: Goal) => {
    const goalName = goal.title || goal.name || 'esta meta';
    confirmDelete(goalName, async () => {
      try {
        await deleteGoal(goal._id);
        success('Meta excluída com sucesso!');
      } catch (err: any) {
        showError(err.message || 'Erro ao excluir meta');
      }
    });
  };

  // Renderizar item da lista
  const renderGoalItem = ({ item }: { item: Goal }) => {
    const progress = item.progress || 0;
    const daysRemaining = item.daysRemaining || 0;

    const getStatusColor = () => {
      if (item.status === 'completed') return COLORS.success;
      if (item.status === 'paused') return COLORS.warning;
      if (daysRemaining < 30 && progress < 50) return COLORS.error;
      return COLORS.primary;
    };

    const getStatusText = () => {
      if (item.status === 'completed') return 'Concluída';
      if (item.status === 'paused') return 'Pausada';
      return `${daysRemaining} dias restantes`;
    };

    return (
      <TouchableOpacity
        style={styles.goalItem}
        onPress={() => navigation.navigate('GoalDetail', { goalId: item._id })}
        activeOpacity={0.7}
      >
        <Card style={styles.goalCard}>
          {/* Header */}
          <View style={styles.goalHeader}>
            <View style={styles.goalInfo}>
              <Text style={styles.goalTitle} numberOfLines={1}>
                {item.title || item.name}
              </Text>
              <Text style={styles.goalCategory} numberOfLines={1}>
                {item.category || 'Sem categoria'}
              </Text>
            </View>
            <View style={styles.goalStatus}>
              <Ionicons
                name={item.status === 'completed' ? 'checkmark-circle' : 'flag'}
                size={24}
                color={getStatusColor()}
              />
            </View>
          </View>

          {/* Valores */}
          <View style={styles.goalValues}>
            <View style={styles.valueItem}>
              <Text style={styles.valueLabel}>Economizado</Text>
              <Text style={[styles.valueAmount, { color: COLORS.success }]}>
                {formatCurrency(item.currentAmount)}
              </Text>
            </View>
            <View style={styles.valueDivider} />
            <View style={styles.valueItem}>
              <Text style={styles.valueLabel}>Meta</Text>
              <Text style={styles.valueAmount}>
                {formatCurrency(item.targetAmount)}
              </Text>
            </View>
          </View>

          {/* Progresso */}
          <View style={styles.progressContainer}>
            <View style={styles.progressHeader}>
              <Text style={styles.progressText}>{progress.toFixed(0)}%</Text>
              <Text style={[styles.statusText, { color: getStatusColor() }]}>
                {getStatusText()}
              </Text>
            </View>
            <ProgressBar
              progress={progress}
              color={getStatusColor()}
              height={8}
              showText={false}
            />
          </View>

          {/* Ações */}
          <View style={styles.actionButtons}>
            <TouchableOpacity
              style={[styles.actionButton, styles.editButton]}
              onPress={() => navigation.navigate('EditGoal', { goalId: item._id })}
            >
              <Ionicons name="create" size={16} color={COLORS.info} />
              <Text style={styles.editButtonText}>Editar</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionButton, styles.shareButton]}
              onPress={() => {
                const goalTitle: string = item.title || item.name || 'Meta';
                navigation.navigate('ShareGoal', { 
                  goalId: item._id, 
                  goalTitle: goalTitle
                });
              }}
            >
              <Ionicons name="share-social" size={16} color={COLORS.primary} />
              <Text style={styles.shareButtonText}>Compartilhar</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionButton, styles.deleteButton]}
              onPress={() => handleDeleteGoal(item)}
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
      {(['all', 'active', 'completed', 'paused'] as const).map(filter => (
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
            {filter === 'all' ? 'Todas' : 
             filter === 'active' ? 'Ativas' : 
             filter === 'completed' ? 'Concluídas' : 'Pausadas'}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  // Estado vazio
  const renderEmptyState = () => (
    <View style={styles.emptyStateContainer}>
      <Ionicons name="flag-outline" size={64} color={COLORS.gray400} />
      <Text style={styles.emptyStateTitle}>Nenhuma meta encontrada</Text>
      <Text style={styles.emptyStateDescription}>
        {selectedFilter === 'all'
          ? 'Comece criando sua primeira meta financeira'
          : `Não há metas ${selectedFilter === 'active' ? 'ativas' : selectedFilter === 'completed' ? 'concluídas' : 'pausadas'} no momento`}
      </Text>
      {selectedFilter === 'all' && (
        <TouchableOpacity
          style={styles.emptyStateButton}
          onPress={() => navigation.navigate('CreateGoal')}
        >
          <Text style={styles.emptyStateButtonText}>Criar Meta</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  // Loading
  if (loading && goals.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Metas</Text>
        </View>
        <Loading text="Carregando metas..." />
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
        <Text style={styles.title}>Metas</Text>
        <View style={styles.headerButtons}>
          <TouchableOpacity
            style={styles.sharedButton}
            onPress={() => navigation.navigate('SharedGoals')}
          >
            <Ionicons name="people" size={24} color={COLORS.primary} />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => navigation.navigate('CreateGoal')}
          >
            <Ionicons name="add" size={24} color={COLORS.white} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Filtros */}
      {renderFilters()}

      {/* Lista */}
      {isEmpty ? (
        renderEmptyState()
      ) : (
        <FlatList
          data={filteredGoals}
          renderItem={renderGoalItem}
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
  headerButtons: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  sharedButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.primary + '15',
    justifyContent: 'center',
    alignItems: 'center',
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
  goalItem: {
    marginBottom: SPACING.md,
  },
  goalCard: {
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
    marginRight: SPACING.sm,
  },
  goalTitle: {
    fontSize: FONT_SIZES.lg,
    fontFamily: FONTS.semibold,
    color: COLORS.textPrimary,
    marginBottom: 4,
  },
  goalCategory: {
    fontSize: FONT_SIZES.sm,
    fontFamily: FONTS.regular,
    color: COLORS.textSecondary,
  },
  goalStatus: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.gray100,
    justifyContent: 'center',
    alignItems: 'center',
  },
  goalValues: {
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
    marginHorizontal: SPACING.sm,
  },
  valueLabel: {
    fontSize: FONT_SIZES.xs,
    fontFamily: FONTS.regular,
    color: COLORS.textSecondary,
    marginBottom: 4,
  },
  valueAmount: {
    fontSize: FONT_SIZES.lg,
    fontFamily: FONTS.bold,
    color: COLORS.textPrimary,
  },
  progressContainer: {
    marginBottom: SPACING.md,
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
  actionButtons: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: COLORS.gray200,
    paddingTop: SPACING.sm,
    marginTop: SPACING.xs,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.md,
    marginHorizontal: 2,
  },
  editButton: {
    backgroundColor: COLORS.info + '15',
  },
  shareButton: {
    backgroundColor: COLORS.primary + '15',
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
  shareButtonText: {
    fontSize: FONT_SIZES.sm,
    fontFamily: FONTS.medium,
    color: COLORS.primary,
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