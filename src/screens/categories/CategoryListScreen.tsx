// src/screens/categories/CategoryListScreen.tsx
import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { Card, Loading, EmptyState, Badge } from '../../components/common';
import { CategoryService } from '../../services/CategoryService';
import { Category } from '../../types';
import { COLORS, FONTS, FONT_SIZES, SPACING, BORDER_RADIUS, SHADOWS } from '../../constants';

interface CategoryListScreenProps {
  navigation: any;
}

export const CategoryListScreen: React.FC<CategoryListScreenProps> = ({ navigation }) => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'income' | 'expense' | 'custom'>('all');

  // Carregar categorias
  const loadCategories = useCallback(async () => {
    try {
      const response = await CategoryService.getCategories({ includeDefault: true });
      if (response.success && response.data) {
        setCategories(response.data);
      }
    } catch (error: any) {
      console.error('Erro ao carregar categorias:', error);
      Alert.alert('Erro', 'Não foi possível carregar as categorias');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadCategories();
    }, [loadCategories])
  );

  const handleRefresh = () => {
    setRefreshing(true);
    loadCategories();
  };

  // Filtrar categorias
  const filteredCategories = categories.filter(category => {
    if (selectedFilter === 'all') return true;
    if (selectedFilter === 'custom') return !category.isDefault;
    return category.type === selectedFilter;
  });

  // Navegar para criar categoria
  const handleCreateCategory = () => {
    navigation.navigate('CreateCategory');
  };

  // Navegar para editar categoria
  const handleEditCategory = (category: Category) => {
    if (category.isDefault) {
      Alert.alert('Atenção', 'Categorias padrão não podem ser editadas');
      return;
    }
    navigation.navigate('EditCategory', { categoryId: category._id });
  };

  // Deletar categoria
  const handleDeleteCategory = async (category: Category) => {
    if (category.isDefault) {
      Alert.alert('Atenção', 'Categorias padrão não podem ser deletadas');
      return;
    }

    // Verificar se pode deletar
    const canDeleteResult = await CategoryService.canDeleteCategory(category._id);
    
    if (!canDeleteResult.canDelete) {
      Alert.alert(
        'Não é possível deletar',
        canDeleteResult.reason || 'Esta categoria está sendo utilizada',
        [{ text: 'OK' }]
      );
      return;
    }

    Alert.alert(
      'Confirmar exclusão',
      `Deseja realmente deletar a categoria "${category.name}"?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Deletar',
          style: 'destructive',
          onPress: async () => {
            try {
              await CategoryService.deleteCategory(category._id);
              Alert.alert('Sucesso', 'Categoria deletada com sucesso');
              loadCategories();
            } catch (error: any) {
              Alert.alert('Erro', error.message || 'Erro ao deletar categoria');
            }
          },
        },
      ]
    );
  };

  // Renderizar item de categoria
  const renderCategoryItem = ({ item }: { item: Category }) => (
    <Card style={styles.categoryCard}>
      <TouchableOpacity
        style={styles.categoryContent}
        onPress={() => handleEditCategory(item)}
        activeOpacity={0.7}
      >
        <View style={styles.categoryLeft}>
          <View style={[styles.iconContainer, { backgroundColor: item.color + '20' }]}>
            <Text style={styles.categoryIcon}>{item.icon}</Text>
          </View>
          <View style={styles.categoryInfo}>
            <Text style={styles.categoryName}>{item.name}</Text>
            <View style={styles.categoryMeta}>
              <Badge 
                text={item.type === 'income' ? 'Receita' : 'Despesa'}
                variant={item.type === 'income' ? 'success' : 'error'}
              />
              {item.isDefault && (
                <Badge text="Padrão" variant="neutral" />
              )}
            </View>
            {item.usage && (
              <Text style={styles.usageText}>
                {item.usage.total} uso{item.usage.total !== 1 ? 's' : ''}
              </Text>
            )}
          </View>
        </View>

        {!item.isDefault && (
          <TouchableOpacity
            style={styles.deleteButton}
            onPress={() => handleDeleteCategory(item)}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="trash-outline" size={20} color={COLORS.error} />
          </TouchableOpacity>
        )}
      </TouchableOpacity>
    </Card>
  );

  // Renderizar filtros
  const renderFilters = () => (
    <View style={styles.filtersContainer}>
      <TouchableOpacity
        style={[styles.filterButton, selectedFilter === 'all' && styles.filterButtonActive]}
        onPress={() => setSelectedFilter('all')}
      >
        <Text style={[styles.filterText, selectedFilter === 'all' && styles.filterTextActive]}>
          Todas
        </Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.filterButton, selectedFilter === 'income' && styles.filterButtonActive]}
        onPress={() => setSelectedFilter('income')}
      >
        <Text style={[styles.filterText, selectedFilter === 'income' && styles.filterTextActive]}>
          Receitas
        </Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.filterButton, selectedFilter === 'expense' && styles.filterButtonActive]}
        onPress={() => setSelectedFilter('expense')}
      >
        <Text style={[styles.filterText, selectedFilter === 'expense' && styles.filterTextActive]}>
          Despesas
        </Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.filterButton, selectedFilter === 'custom' && styles.filterButtonActive]}
        onPress={() => setSelectedFilter('custom')}
      >
        <Text style={[styles.filterText, selectedFilter === 'custom' && styles.filterTextActive]}>
          Personalizadas
        </Text>
      </TouchableOpacity>
    </View>
  );

  // Renderizar header com estatísticas
  const renderHeader = () => {
    const totalCategories = categories.length;
    const customCategories = categories.filter((c: Category) => !c.isDefault).length;
    const incomeCategories = categories.filter((c: Category) => c.type === 'income').length;
    const expenseCategories = categories.filter((c: Category) => c.type === 'expense').length;

    return (
      <View style={styles.headerContainer}>
        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{totalCategories}</Text>
            <Text style={styles.statLabel}>Total</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: COLORS.success }]}>{incomeCategories}</Text>
            <Text style={styles.statLabel}>Receitas</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: COLORS.error }]}>{expenseCategories}</Text>
            <Text style={styles.statLabel}>Despesas</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: COLORS.primary }]}>{customCategories}</Text>
            <Text style={styles.statLabel}>Customizadas</Text>
          </View>
        </View>
        {renderFilters()}
      </View>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Categorias</Text>
          <TouchableOpacity style={styles.addButton} onPress={handleCreateCategory}>
            <Ionicons name="add" size={24} color={COLORS.white} />
          </TouchableOpacity>
        </View>
        <Loading />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Categorias</Text>
        <TouchableOpacity style={styles.addButton} onPress={handleCreateCategory}>
          <Ionicons name="add" size={24} color={COLORS.white} />
        </TouchableOpacity>
      </View>

      <FlatList
        data={filteredCategories}
        renderItem={renderCategoryItem}
        keyExtractor={(item) => item._id}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={
          <EmptyState
            icon="pricetag-outline"
            title="Nenhuma categoria encontrada"
            description={
              selectedFilter === 'custom'
                ? 'Crie suas próprias categorias personalizadas!'
                : 'Comece criando sua primeira categoria'
            }
            actionText="Criar Categoria"
            onAction={handleCreateCategory}
          />
        }
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
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
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray200,
  },
  title: {
    fontSize: FONT_SIZES['2xl'],
    fontFamily: FONTS.bold,
    color: COLORS.textPrimary,
  },
  addButton: {
    width: 40,
    height: 40,
    borderRadius: BORDER_RADIUS.full,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    ...SHADOWS.sm,
  },
  listContent: {
    padding: SPACING.md,
  },
  headerContainer: {
    marginBottom: SPACING.md,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    ...SHADOWS.sm,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: FONT_SIZES['2xl'],
    fontFamily: FONTS.bold,
    color: COLORS.textPrimary,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: FONT_SIZES.xs,
    fontFamily: FONTS.regular,
    color: COLORS.textSecondary,
  },
  filtersContainer: {
    flexDirection: 'row',
    gap: SPACING.xs,
  },
  filterButton: {
    flex: 1,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.sm,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.gray200,
    alignItems: 'center',
  },
  filterButtonActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  filterText: {
    fontSize: FONT_SIZES.sm,
    fontFamily: FONTS.medium,
    color: COLORS.textSecondary,
  },
  filterTextActive: {
    color: COLORS.white,
  },
  categoryCard: {
    marginBottom: SPACING.sm,
  },
  categoryContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  categoryLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconContainer: {
    width: 50,
    height: 50,
    borderRadius: BORDER_RADIUS.md,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.sm,
  },
  categoryIcon: {
    fontSize: 24,
  },
  categoryInfo: {
    flex: 1,
  },
  categoryName: {
    fontSize: FONT_SIZES.md,
    fontFamily: FONTS.medium,
    color: COLORS.textPrimary,
    marginBottom: 4,
  },
  categoryMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    marginBottom: 4,
  },
  usageText: {
    fontSize: FONT_SIZES.xs,
    fontFamily: FONTS.regular,
    color: COLORS.textTertiary,
  },
  deleteButton: {
    padding: SPACING.sm,
  },
});