// src/screens/budgets/BudgetDetailScreen.tsx - VERSÃO CORRIGIDA COM NAVEGAÇÃO
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Share,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';

import {
  ProgressBar,
  CurrencyInput,
  CustomAlert,
  Card,
  Loading,
  Button,
} from '../../components/common';
import { BudgetService } from '../../services/BudgetService';
import { Budget } from '../../types';
import { COLORS, FONTS, FONT_SIZES, SPACING, BORDER_RADIUS, SHADOWS } from '../../constants';
import { formatCurrency } from '../../utils';

type BudgetStackParamList = {
  BudgetList: undefined;
  CreateBudget: undefined;
  EditBudget: { budgetId: string };
  BudgetDetail: { budgetId: string };
};

type BudgetDetailScreenNavigationProp = NativeStackNavigationProp<BudgetStackParamList, 'BudgetDetail'>;
type BudgetDetailScreenRouteProp = RouteProp<BudgetStackParamList, 'BudgetDetail'>;

interface Props {
  navigation: BudgetDetailScreenNavigationProp;
  route: BudgetDetailScreenRouteProp;
}

export const BudgetDetailScreen: React.FC<Props> = ({ navigation, route }) => {
  const { budgetId } = route.params;
  
  const [budget, setBudget] = useState<Budget | null>(null);
  const [loading, setLoading] = useState(true);
  const [showAdjustLimitModal, setShowAdjustLimitModal] = useState(false);
  const [newLimit, setNewLimit] = useState('');
  const [adjustingLimit, setAdjustingLimit] = useState(false);

  useEffect(() => {
    if (budgetId && budgetId !== 'undefined') {
      loadBudget();
    } else {
      Alert.alert('Erro', 'ID do orçamento inválido');
      navigation.goBack();
    }
  }, [budgetId]);

  // Recarregar quando voltar da tela de edição
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      if (budget && budgetId && budgetId !== 'undefined') {
        loadBudget();
      }
    });
    return unsubscribe;
  }, [navigation, budget, budgetId]);

  // Carregar detalhes do orçamento
  const loadBudget = async () => {
    try {
      setLoading(true);
      console.log('Carregando orçamento com ID:', budgetId);
      
      const response = await BudgetService.getBudget(budgetId);
      console.log('Resposta getBudget:', response);
      
      if (response.success && response.data) {
        console.log('Orçamento carregado:', response.data);
        setBudget(response.data);
      } else {
        console.log('Orçamento não encontrado na resposta');
        Alert.alert('Erro', response.message || 'Orçamento não encontrado');
        navigation.goBack();
      }
    } catch (error: any) {
      console.log('Erro ao carregar orçamento:', error);
      Alert.alert('Erro', error.message || 'Erro ao carregar orçamento');
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

  // Ajustar limite do orçamento
  const handleAdjustLimit = async () => {
    if (!budget || !newLimit) return;

    try {
      setAdjustingLimit(true);
      
      const limitValue = parseFloat(newLimit.replace(/[^\d,]/g, '').replace(',', '.'));
      if (isNaN(limitValue) || limitValue <= 0) {
        Alert.alert('Erro', 'Digite um valor válido');
        return;
      }

      console.log('Ajustando limite:', limitValue, 'para budget._id:', budget._id);
      const response = await BudgetService.adjustBudgetLimit(budget._id, limitValue);
      
      if (response.success && response.data) {
        console.log('Limite ajustado com sucesso:', response.data);
        setBudget(response.data);
        setNewLimit('');
        setShowAdjustLimitModal(false);
        Alert.alert('Sucesso', 'Limite ajustado com sucesso!');
      } else {
        console.log('Erro na resposta:', response.message);
        Alert.alert('Erro', response.message || 'Erro ao ajustar limite');
      }
    } catch (error: any) {
      console.log('Erro ao ajustar limite:', error);
      Alert.alert('Erro', error.message || 'Erro ao ajustar limite');
    } finally {
      setAdjustingLimit(false);
    }
  };

  // Ativar/Desativar orçamento
  const handleToggleStatus = async () => {
    if (!budget) return;

    try {
      const action = budget.isActive ? 'desativar' : 'ativar';
      
      Alert.alert(
        `${action.charAt(0).toUpperCase() + action.slice(1)} Orçamento`,
        `Tem certeza que deseja ${action} este orçamento?`,
        [
          { text: 'Cancelar', style: 'cancel' },
          {
            text: action.charAt(0).toUpperCase() + action.slice(1),
            onPress: async () => {
              try {
                const response = await BudgetService.updateBudget(budget._id, {
                  isActive: !budget.isActive
                });
                
                if (response.success && response.data) {
                  setBudget(response.data);
                  Alert.alert('Sucesso', `Orçamento ${action}do com sucesso!`);
                }
              } catch (error: any) {
                Alert.alert('Erro', error.message || `Erro ao ${action} orçamento`);
              }
            }
          }
        ]
      );
    } catch (error: any) {
      Alert.alert('Erro', error.message || 'Erro ao alterar status do orçamento');
    }
  };

  // Compartilhar orçamento
  const handleShare = async () => {
    if (!budget) return;

    const progress = calculateProgress();
    const categoryName = getCategoryName();
    const remaining = budget.monthlyLimit - budget.spent;
    
    const shareText = `💰 Orçamento: ${categoryName}\n📊 ${formatCurrency(budget.spent)} de ${formatCurrency(budget.monthlyLimit)}\n📈 ${progress.toFixed(1)}% utilizado\n${remaining >= 0 ? `💵 Restante: ${formatCurrency(remaining)}` : `🚨 Excedido em: ${formatCurrency(Math.abs(remaining))}`}`;

    try {
      await Share.share({
        message: shareText,
        title: 'Meu Orçamento',
      });
    } catch (error) {
      console.log('Erro ao compartilhar:', error);
    }
  };

  // Excluir orçamento
  const handleDelete = () => {
    if (!budget) return;

    const categoryName = getCategoryName();

    Alert.alert(
      'Excluir Orçamento',
      `Tem certeza que deseja excluir o orçamento "${categoryName}"?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        { 
          text: 'Excluir', 
          style: 'destructive',
          onPress: async () => {
            try {
              const response = await BudgetService.deleteBudget(budget._id);
              if (response.success) {
                Alert.alert('Sucesso', 'Orçamento excluído com sucesso!');
                navigation.goBack();
              } else {
                Alert.alert('Erro', response.message || 'Erro ao excluir orçamento');
              }
            } catch (error: any) {
              Alert.alert('Erro', error.message || 'Erro ao excluir orçamento');
            }
          }
        },
      ]
    );
  };

  // Calcular progresso
  const calculateProgress = (): number => {
    if (!budget || budget.monthlyLimit <= 0) return 0;
    return Math.min((budget.spent / budget.monthlyLimit) * 100, 100);
  };

  // Obter nome da categoria
  const getCategoryName = (): string => {
    if (!budget) return 'Categoria não definida';
    if (typeof budget.category === 'string') {
      return budget.category;
    }
    return budget.category?.name || 'Categoria não definida';
  };

  // Obter cor do status
  const getStatusColor = () => {
    if (!budget) return COLORS.gray400;
    if (!budget.isActive) return COLORS.gray400;
    if (budget.isOverBudget) return COLORS.error;
    
    const progress = calculateProgress();
    if (progress >= 90) return COLORS.warning;
    if (progress >= 70) return COLORS.warning;
    return COLORS.success;
  };

  // Obter texto do status
  const getStatusText = () => {
    if (!budget) return 'Indefinido';
    if (!budget.isActive) return 'Inativo';
    if (budget.isOverBudget) return 'Excedido';
    
    const progress = calculateProgress();
    if (progress >= 90) return 'Atenção ao limite';
    if (progress >= 70) return 'Próximo do limite';
    return 'Dentro do limite';
  };

  // Obter nome do mês
  const getMonthName = (month: number): string => {
    const months = [
      'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
      'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
    ];
    return months[month - 1] || 'Mês inválido';
  };

  if (loading) {
    return <Loading text="Carregando orçamento..." />;
  }

  if (!budget) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Orçamento não encontrado</Text>
        </View>
      </SafeAreaView>
    );
  }

  const progress = calculateProgress();
  const remaining = budget.monthlyLimit - budget.spent;
  const categoryName = getCategoryName();

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={COLORS.textPrimary} />
        </TouchableOpacity>
        
        <View style={styles.headerActions}>
          <TouchableOpacity onPress={handleShare} style={styles.headerButton}>
            <Ionicons name="share-outline" size={24} color={COLORS.textPrimary} />
          </TouchableOpacity>
          
          <TouchableOpacity 
            onPress={() => navigation.navigate('EditBudget', { budgetId: budget._id })}
            style={styles.headerButton}
          >
            <Ionicons name="create-outline" size={24} color={COLORS.textPrimary} />
          </TouchableOpacity>
          
          <TouchableOpacity onPress={handleDelete} style={styles.headerButton}>
            <Ionicons name="trash-outline" size={24} color={COLORS.error} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Informações principais */}
        <Card style={styles.mainCard}>
          <View style={styles.titleContainer}>
            <View style={styles.titleInfo}>
              <Text style={styles.budgetTitle}>{budget.name}</Text>
              <Text style={styles.categoryName}>{categoryName}</Text>
            </View>
            <View style={[styles.statusBadge, { backgroundColor: getStatusColor() + '20' }]}>
              <Text style={[styles.statusText, { color: getStatusColor() }]}>
                {getStatusText()}
              </Text>
            </View>
          </View>
        </Card>

        {/* Progresso */}
        <Card style={styles.progressCard}>
          <Text style={styles.sectionTitle}>Utilização</Text>
          
          <View style={styles.progressInfo}>
            <Text style={styles.spentAmount}>{formatCurrency(budget.spent)}</Text>
            <Text style={styles.limitAmount}>de {formatCurrency(budget.monthlyLimit)}</Text>
          </View>

          <ProgressBar 
            progress={progress} 
            color={getStatusColor()} 
            height={12}
            showText={false}
            style={styles.progressBar}
          />
          
          <Text style={styles.progressPercentage}>{progress.toFixed(1)}% utilizado</Text>
        </Card>

        {/* Valores */}
        <Card style={styles.valuesCard}>
          <Text style={styles.sectionTitle}>Resumo</Text>
          
          <View style={styles.valuesContainer}>
            <View style={styles.valueItem}>
              <View style={styles.valueHeader}>
                <Ionicons name="trending-up" size={20} color={COLORS.error} />
                <Text style={styles.valueLabel}>Gasto</Text>
              </View>
              <Text style={[styles.valueAmount, { color: COLORS.error }]}>
                {formatCurrency(budget.spent)}
              </Text>
            </View>

            <View style={styles.valueItem}>
              <View style={styles.valueHeader}>
                <Ionicons name="flag" size={20} color={COLORS.primary} />
                <Text style={styles.valueLabel}>Limite</Text>
              </View>
              <Text style={styles.valueAmount}>
                {formatCurrency(budget.monthlyLimit)}
              </Text>
            </View>

            <View style={styles.valueItem}>
              <View style={styles.valueHeader}>
                <Ionicons 
                  name={remaining >= 0 ? "checkmark-circle" : "alert-circle"} 
                  size={20} 
                  color={remaining >= 0 ? COLORS.success : COLORS.error} 
                />
                <Text style={styles.valueLabel}>
                  {remaining >= 0 ? 'Restante' : 'Excesso'}
                </Text>
              </View>
              <Text style={[
                styles.valueAmount, 
                { color: remaining >= 0 ? COLORS.success : COLORS.error }
              ]}>
                {formatCurrency(Math.abs(remaining))}
              </Text>
            </View>
          </View>
        </Card>

        {/* Período */}
        <Card style={styles.periodCard}>
          <Text style={styles.sectionTitle}>Período</Text>
          
          <View style={styles.periodInfo}>
            <View style={styles.periodItem}>
              <Ionicons name="calendar" size={20} color={COLORS.primary} />
              <Text style={styles.periodText}>
                {getMonthName(budget.month)} {budget.year}
              </Text>
            </View>
          </View>
        </Card>

        {/* Ações */}
        <Card style={styles.actionsCard}>
          <Text style={styles.sectionTitle}>Ações</Text>
          
          <View style={styles.actionsContainer}>
            <Button
              title="Ajustar Limite"
              onPress={() => {
                setNewLimit(formatCurrency(budget.monthlyLimit));
                setShowAdjustLimitModal(true);
              }}
              style={styles.actionButton}
              variant="primary"
            />
            
            <Button
              title={budget.isActive ? 'Desativar' : 'Ativar'}
              onPress={handleToggleStatus}
              style={styles.actionButton}
              variant={budget.isActive ? 'outline' : 'primary'}
            />
          </View>
        </Card>
      </ScrollView>

      {/* Modal para ajustar limite */}
      <CustomAlert
        visible={showAdjustLimitModal}
        title="Ajustar Limite"
        onConfirm={handleAdjustLimit}
        onCancel={() => {
          setShowAdjustLimitModal(false);
          setNewLimit('');
        }}
        confirmText="Ajustar"
        cancelText="Cancelar"
        loading={adjustingLimit}
      >
        <CurrencyInput
          label="Novo limite mensal"
          placeholder="R$ 0,00"
          value={newLimit}
          onChangeText={setNewLimit}
          autoFocus
        />
      </CustomAlert>
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
    borderBottomColor: COLORS.border,
  },
  headerActions: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  headerButton: {
    padding: SPACING.xs,
  },
  content: {
    flex: 1,
    padding: SPACING.lg,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.lg,
  },
  errorText: {
    fontSize: FONT_SIZES.lg,
    fontFamily: FONTS.regular,
    color: COLORS.error,
    textAlign: 'center',
  },
  mainCard: {
    marginBottom: SPACING.md,
  },
  titleContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  titleInfo: {
    flex: 1,
    marginRight: SPACING.sm,
  },
  budgetTitle: {
    fontSize: FONT_SIZES.xl,
    fontFamily: FONTS.bold,
    color: COLORS.textPrimary,
    marginBottom: SPACING.xs,
  },
  categoryName: {
    fontSize: FONT_SIZES.md,
    fontFamily: FONTS.regular,
    color: COLORS.textSecondary,
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
  progressCard: {
    marginBottom: SPACING.md,
  },
  sectionTitle: {
    fontSize: FONT_SIZES.lg,
    fontFamily: FONTS.bold,
    color: COLORS.textPrimary,
    marginBottom: SPACING.md,
  },
  progressInfo: {
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  spentAmount: {
    fontSize: FONT_SIZES.xxl,
    fontFamily: FONTS.bold,
    color: COLORS.primary,
  },
  limitAmount: {
    fontSize: FONT_SIZES.lg,
    fontFamily: FONTS.regular,
    color: COLORS.textSecondary,
    marginTop: SPACING.xs,
  },
  progressBar: {
    marginVertical: SPACING.md,
  },
  progressPercentage: {
    fontSize: FONT_SIZES.md,
    fontFamily: FONTS.bold,
    color: COLORS.primary,
    textAlign: 'center',
  },
  valuesCard: {
    marginBottom: SPACING.md,
  },
  valuesContainer: {
    gap: SPACING.md,
  },
  valueItem: {
    backgroundColor: COLORS.gray50,
    borderRadius: BORDER_RADIUS.sm,
    padding: SPACING.md,
  },
  valueHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.sm,
    gap: SPACING.xs,
  },
  valueLabel: {
    fontSize: FONT_SIZES.sm,
    fontFamily: FONTS.medium,
    color: COLORS.textSecondary,
  },
  valueAmount: {
    fontSize: FONT_SIZES.lg,
    fontFamily: FONTS.bold,
    color: COLORS.textPrimary,
  },
  periodCard: {
    marginBottom: SPACING.md,
  },
  periodInfo: {
    gap: SPACING.md,
  },
  periodItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  periodText: {
    fontSize: FONT_SIZES.md,
    fontFamily: FONTS.medium,
    color: COLORS.textPrimary,
  },
  actionsCard: {
    marginBottom: SPACING.xl,
  },
  actionsContainer: {
    gap: SPACING.sm,
  },
  actionButton: {
    flex: 1,
  },
});