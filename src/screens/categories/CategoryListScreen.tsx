// src/screens/categories/CategoryListScreen.tsx - COM TOAST E CONFIRM
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

import { useCategories, useToast, useConfirm } from '../../hooks';
import { Category } from '../../types';
import { Card, Loading, Toast, ConfirmDialog, Badge } from '../../components/common';
import { COLORS, FONTS, FONT_SIZES, SPACING, BORDER_RADIUS, SHADOWS } from '../../constants';
import { CategoryStackParamList } from '../../navigation/CategoryNavigator';

type NavigationProp = NativeStackNavigationProp<CategoryStackParamList, 'CategoryList'>;

interface Props {
  navigation: NavigationProp;
}

export const CategoryListScreen: React.FC<Props> = ({ navigation }) => {
  const { categories, loading, refreshing, error, refresh, deleteCategory } = useCategories();
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'income' | 'expense' | 'custom'>('all');

  // Hooks de feedback
  const { toast, success, error: showError, hideToast, warning } = useToast();
  const { confirm, showConfirm } = useConfirm();

  // Filtrar categorias
  const filteredCategories = categories.filter(category => {
    if (selectedFilter === 'all') return true;
    if (selectedFilter === 'income') return category.type === 'income';
    if (selectedFilter === 'expense') return category.type === 'expense';
    if (selectedFilter === 'custom') return !category.isDefault;
    return true;
  });

  const isEmpty = !loading && filteredCategories.length === 0;

  // Deletar categoria COM VALIDAÇÃO
  const handleDeleteCategory = async (category: Category) => {
    // Verificar se é categoria padrão
    if (category.isDefault) {
      warning('Categorias padrão não podem ser excluídas');
      return;
    }

    // Verificar se está em uso
    const usageTotal = (category.usage?.transactions || 0) + (category.usage?.budgets || 0);
    
    if (usageTotal > 0) {
      showConfirm({
        title: 'Categoria em uso',
        message: `Esta categoria está sendo usada em ${usageTotal} ${usageTotal === 1 ? 'item' : 'itens'}. Se excluir, ${usageTotal === 1 ? 'ele ficará' : 'eles ficarão'} sem categoria. Deseja continuar?`,
        confirmText: 'Excluir mesmo assim',
        cancelText: 'Cancelar',
        type: 'warning',
        onConfirm: async () => {
          try {
            await deleteCategory(category._id);
            success('Categoria excluída com sucesso!');
          } catch (err: any) {
            showError(err.message || 'Erro ao excluir categoria');
          }
        },
      });
    } else {
      showConfirm({
        title: 'Excluir categoria',
        message: `Tem certeza que deseja excluir "${category.name}"?`,
        confirmText: 'Excluir',
        cancelText: 'Cancelar',
        type: 'danger',
        onConfirm: async () => {
          try {
            await deleteCategory(category._id);
            success('Categoria excluída com sucesso!');
          } catch (err: any) {
            showError(err.message || 'Erro ao excluir categoria');
          }
        },
      });
    }
  };

  // Renderizar item da lista
  const renderCategoryItem = ({ item }: { item: Category }) => {
    const usageTotal = (item.usage?.transactions || 0) + (item.usage?.budgets || 0);

    return (
      <TouchableOpacity
        style={styles.categoryItem}
        onPress={() => !item.isDefault && navigation.navigate('EditCategory', { categoryId: item._id })}
        activeOpacity={item.isDefault ? 1 : 0.7}
      >
        <Card style={styles.categoryCard}>
          {/* Header */}
          <View style={styles.categoryHeader}>
            <View style={[styles.categoryIcon, { backgroundColor: item.color + '20' }]}>
              <Text style={styles.categoryEmoji}>{item.icon}</Text>
            </View>
            
            <View style={styles.categoryInfo}>
              <View style={styles.categoryTitleRow}>
                <Text style={styles.categoryName} numberOfLines={1}>
                  {item.name}
                </Text>
                {item.isDefault && (
                  <Badge text="Padrão" variant="info" size="sm" />
                )}
              </View>
              
              <View style={styles.categoryMetaRow}>
                <Badge 
                  text={item.type === 'income' ? 'Receita' : 'Despesa'} 
                  variant={item.type === 'income' ? 'success' : 'neutral'}
                  size="sm"
                />
                {usageTotal > 0 && (
                  <Text style={styles.usageText}>
                    {usageTotal} {usageTotal === 1 ? 'uso' : 'usos'}
                  </Text>
                )}
              </View>
            </View>

            {!item.isDefault && (
              <View style={styles.categoryActions}>
                <TouchableOpacity
                  style={styles.iconButton}
                  onPress={() => navigation.navigate('EditCategory', { categoryId: item._id })}
                >
                  <Ionicons name="create" size={20} color={COLORS.info} />
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.iconButton}
                  onPress={() => handleDeleteCategory(item)}
                >
                  <Ionicons name="trash" size={20} color={COLORS.error} />
                </TouchableOpacity>
              </View>
            )}
          </View>

          {/* Detalhes de uso */}
          {usageTotal > 0 && (
            <View style={styles.usageDetails}>
              {item.usage && item.usage.transactions > 0 && (
                <View style={styles.usageItem}>
                  <Ionicons name="swap-horizontal" size={14} color={COLORS.textSecondary} />
                  <Text style={styles.usageDetailText}>
                    {item.usage.transactions} {item.usage.transactions === 1 ? 'transação' : 'transações'}
                  </Text>
                </View>
              )}
              {item.usage && item.usage.budgets > 0 && (
                <View style={styles.usageItem}>
                  <Ionicons name="wallet" size={14} color={COLORS.textSecondary} />
                  <Text style={styles.usageDetailText}>
                    {item.usage.budgets} {item.usage.budgets === 1 ? 'orçamento' : 'orçamentos'}
                  </Text>
                </View>
              )}
            </View>
          )}
        </Card>
      </TouchableOpacity>
    );
  };

  // Renderizar filtros
  const renderFilters = () => (
    <View style={styles.filterContainer}>
      {(['all', 'income', 'expense', 'custom'] as const).map(filter => (
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
             filter === 'income' ? 'Receitas' : 
             filter === 'expense' ? 'Despesas' : 'Personalizadas'}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  // Resumo
  const renderSummary = () => {
    const income = categories.filter(c => c.type === 'income').length;
    const expense = categories.filter(c => c.type === 'expense').length;
    const total = income + expense; // ← Calcular baseado na soma real
    const custom = categories.filter(c => !c.isDefault).length;

    return (
      <View style={styles.summaryContainer}>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryValue}>{total}</Text>
          <Text style={styles.summaryLabel}>Total</Text>
        </View>
        <View style={styles.summaryItem}>
          <Text style={[styles.summaryValue, { color: COLORS.success }]}>{income}</Text>
          <Text style={styles.summaryLabel}>Receitas</Text>
        </View>
        <View style={styles.summaryItem}>
          <Text style={[styles.summaryValue, { color: COLORS.error }]}>{expense}</Text>
          <Text style={styles.summaryLabel}>Despesas</Text>
        </View>
        <View style={styles.summaryItem}>
          <Text style={[styles.summaryValue, { color: COLORS.primary }]}>{custom}</Text>
          <Text style={styles.summaryLabel}>Personalizadas</Text>
        </View>
      </View>
    );
  };

  // Estado vazio
  const renderEmptyState = () => (
    <View style={styles.emptyStateContainer}>
      <Ionicons name="pricetag-outline" size={64} color={COLORS.gray400} />
      <Text style={styles.emptyStateTitle}>Nenhuma categoria encontrada</Text>
      <Text style={styles.emptyStateDescription}>
        {selectedFilter === 'all'
          ? 'Crie categorias personalizadas para organizar melhor suas finanças'
          : `Não há categorias ${selectedFilter === 'custom' ? 'personalizadas' : selectedFilter === 'income' ? 'de receita' : 'de despesa'} no momento`}
      </Text>
      <TouchableOpacity
        style={styles.emptyStateButton}
        onPress={() => navigation.navigate('CreateCategory')}
      >
        <Text style={styles.emptyStateButtonText}>Criar Categoria</Text>
      </TouchableOpacity>
    </View>
  );

  // Loading
  if (loading && categories.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Categorias</Text>
        </View>
        <Loading text="Carregando categorias..." />
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
        <Text style={styles.title}>Categorias</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => navigation.navigate('CreateCategory')}
        >
          <Ionicons name="add" size={24} color={COLORS.white} />
        </TouchableOpacity>
      </View>

      {/* Resumo */}
      {renderSummary()}

      {/* Filtros */}
      {renderFilters()}

      {/* Lista */}
      {isEmpty ? (
        renderEmptyState()
      ) : (
        <FlatList
          data={filteredCategories}
          renderItem={renderCategoryItem}
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
  summaryContainer: {
    flexDirection: 'row',
    backgroundColor: COLORS.white,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray200,
  },
  summaryItem: {
    flex: 1,
    alignItems: 'center',
  },
  summaryValue: {
    fontSize: FONT_SIZES.xl,
    fontFamily: FONTS.bold,
    color: COLORS.textPrimary,
    marginBottom: 4,
  },
  summaryLabel: {
    fontSize: FONT_SIZES.xs,
    fontFamily: FONTS.regular,
    color: COLORS.textSecondary,
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
  categoryItem: {
    marginBottom: SPACING.md,
  },
  categoryCard: {
    padding: SPACING.md,
  },
  categoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  categoryIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.sm,
  },
  categoryEmoji: {
    fontSize: 24,
  },
  categoryInfo: {
    flex: 1,
  },
  categoryTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  categoryName: {
    fontSize: FONT_SIZES.lg,
    fontFamily: FONTS.semibold,
    color: COLORS.textPrimary,
    marginRight: SPACING.xs,
  },
  categoryMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  usageText: {
    fontSize: FONT_SIZES.xs,
    fontFamily: FONTS.regular,
    color: COLORS.textTertiary,
  },
  categoryActions: {
    flexDirection: 'row',
    gap: SPACING.xs,
  },
  iconButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.gray100,
    justifyContent: 'center',
    alignItems: 'center',
  },
  usageDetails: {
    flexDirection: 'row',
    marginTop: SPACING.sm,
    paddingTop: SPACING.sm,
    borderTopWidth: 1,
    borderTopColor: COLORS.gray200,
    gap: SPACING.md,
  },
  usageItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  usageDetailText: {
    fontSize: FONT_SIZES.xs,
    fontFamily: FONTS.regular,
    color: COLORS.textSecondary,
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