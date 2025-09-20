// src/screens/goals/GoalDetailScreen.tsx
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
import { GoalService } from '../../services/GoalService';
import { Goal } from '../../types';
import { COLORS, FONTS, FONT_SIZES, SPACING, BORDER_RADIUS, SHADOWS } from '../../constants';
import { formatCurrency, formatDate } from '../../utils';

type GoalStackParamList = {
  GoalList: undefined;
  CreateGoal: undefined;
  EditGoal: { goalId: string };
  GoalDetails: { goalId: string };
};

type GoalDetailScreenNavigationProp = NativeStackNavigationProp<GoalStackParamList, 'GoalDetails'>;
type GoalDetailScreenRouteProp = RouteProp<GoalStackParamList, 'GoalDetails'>;

interface Props {
  navigation: GoalDetailScreenNavigationProp;
  route: GoalDetailScreenRouteProp;
}

export const GoalDetailScreen: React.FC<Props> = ({ navigation, route }) => {
  const { goalId } = route.params;
  
  const [goal, setGoal] = useState<Goal | null>(null);
  const [loading, setLoading] = useState(true);
  const [showAddValueModal, setShowAddValueModal] = useState(false);
  const [addValue, setAddValue] = useState('');
  const [addingValue, setAddingValue] = useState(false);

  useEffect(() => {
    loadGoal();
  }, [goalId]);

  // Carregar detalhes da meta
  const loadGoal = async () => {
    try {
      setLoading(true);
      const response = await GoalService.getGoal(goalId);
      
      if (response.success && response.data) {
        setGoal(response.data);
      } else {
        Alert.alert('Erro', 'Meta não encontrada');
        navigation.goBack();
      }
    } catch (error: any) {
      Alert.alert('Erro', error.message || 'Erro ao carregar meta');
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

  // Adicionar valor à meta
  const handleAddValue = async () => {
    if (!goal || !addValue) return;

    try {
      setAddingValue(true);
      
      const valueToAdd = parseFloat(addValue.replace(/[^\d,]/g, '').replace(',', '.'));
      if (isNaN(valueToAdd) || valueToAdd <= 0) {
        Alert.alert('Erro', 'Digite um valor válido');
        return;
      }

      const response = await GoalService.addToGoal(goal._id, valueToAdd);
      
      if (response.success && response.data) {
        setGoal(response.data);
        setAddValue('');
        setShowAddValueModal(false);
        Alert.alert('Sucesso', 'Valor adicionado com sucesso!');
      } else {
        Alert.alert('Erro', response.message || 'Erro ao adicionar valor');
      }
    } catch (error: any) {
      Alert.alert('Erro', error.message || 'Erro ao adicionar valor');
    } finally {
      setAddingValue(false);
    }
  };

  // Pausar/Reativar meta
  const handleTogglePause = async () => {
    if (!goal) return;

    try {
      const response = goal.status === 'paused' 
        ? await GoalService.resumeGoal(goal._id)
        : await GoalService.pauseGoal(goal._id);
      
      if (response.success && response.data) {
        setGoal(response.data);
        Alert.alert('Sucesso', goal.status === 'paused' ? 'Meta reativada!' : 'Meta pausada!');
      }
    } catch (error: any) {
      Alert.alert('Erro', error.message || 'Erro ao alterar status da meta');
    }
  };

  // Compartilhar meta
  const handleShare = async () => {
    if (!goal) return;

    const progress = calculateProgress();
    const shareText = `🎯 Meta: ${goal.title}\n💰 ${formatCurrency(goal.currentAmount)} de ${formatCurrency(goal.targetAmount)}\n📊 ${progress.toFixed(1)}% concluído\n📅 Prazo: ${formatDate(new Date(goal.targetDate || goal.endDate))}`;

    try {
      await Share.share({
        message: shareText,
        title: 'Minha Meta Financeira',
      });
    } catch (error) {
      console.log('Erro ao compartilhar:', error);
    }
  };

  // Excluir meta
  const handleDelete = () => {
    if (!goal) return;

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
              const response = await GoalService.deleteGoal(goal._id);
              if (response.success) {
                Alert.alert('Sucesso', 'Meta excluída com sucesso!');
                navigation.goBack();
              } else {
                Alert.alert('Erro', response.message || 'Erro ao excluir meta');
              }
            } catch (error: any) {
              Alert.alert('Erro', error.message || 'Erro ao excluir meta');
            }
          }
        },
      ]
    );
  };

  // Calcular progresso
  const calculateProgress = (): number => {
    if (!goal || goal.targetAmount <= 0) return 0;
    return Math.min((goal.currentAmount / goal.targetAmount) * 100, 100);
  };

  // Calcular valor mensal necessário
  const calculateMonthlyTarget = (): number => {
    if (!goal) return 0;
    const remainingAmount = Math.max(0, goal.targetAmount - goal.currentAmount);
    const daysRemaining = goal.daysRemaining || 0;
    
    if (daysRemaining <= 0 || goal.status === 'completed') return 0;
    
    const remainingMonths = Math.max(1, Math.ceil(daysRemaining / 30));
    return remainingAmount / remainingMonths;
  };

  // Obter cor do status
  const getStatusColor = () => {
    if (!goal) return COLORS.gray400;
    switch (goal.status) {
      case 'completed': return COLORS.success;
      case 'paused': return COLORS.warning;
      case 'active': return COLORS.primary;
      default: return COLORS.gray400;
    }
  };

  if (loading) {
    return <Loading text="Carregando meta..." />;
  }

  if (!goal) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.errorText}>Meta não encontrada</Text>
      </SafeAreaView>
    );
  }

  const progress = calculateProgress();
  const monthlyTarget = calculateMonthlyTarget();
  const isCompleted = goal.status === 'completed';
  const isPaused = goal.status === 'paused';

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
            onPress={() => navigation.navigate('EditGoal', { goalId: goal._id })}
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
            <Text style={styles.goalTitle}>{goal.title}</Text>
            <View style={[styles.statusBadge, { backgroundColor: getStatusColor() + '20' }]}>
              <Text style={[styles.statusText, { color: getStatusColor() }]}>
                {goal.status === 'completed' ? 'Concluída' : 
                 goal.status === 'paused' ? 'Pausada' : 'Ativa'}
              </Text>
            </View>
          </View>

          {goal.description && (
            <Text style={styles.description}>{goal.description}</Text>
          )}

          {goal.category && (
            <View style={styles.categoryContainer}>
              <Ionicons name="pricetag" size={16} color={COLORS.primary} />
              <Text style={styles.categoryText}>{goal.category}</Text>
            </View>
          )}
        </Card>

        {/* Progresso */}
        <Card style={styles.progressCard}>
          <Text style={styles.sectionTitle}>Progresso</Text>
          
          <View style={styles.progressInfo}>
            <Text style={styles.currentAmount}>{formatCurrency(goal.currentAmount)}</Text>
            <Text style={styles.targetAmount}>de {formatCurrency(goal.targetAmount)}</Text>
          </View>

          <ProgressBar 
            progress={progress} 
            color={getStatusColor()} 
            height={12}
            showText={false}
            style={styles.progressBar}
          />
          
          <Text style={styles.progressPercentage}>{progress.toFixed(1)}% concluído</Text>
        </Card>

        {/* Valor mensal necessário */}
        {!isCompleted && monthlyTarget > 0 && (
          <Card style={styles.monthlyCard}>
            <View style={styles.monthlyHeader}>
              <Ionicons name="calendar" size={20} color={COLORS.primary} />
              <Text style={styles.sectionTitle}>Valor Mensal</Text>
            </View>
            <Text style={styles.monthlyAmount}>
              {formatCurrency(monthlyTarget)}
            </Text>
            <Text style={styles.monthlyDescription}>
              Economize por mês para atingir sua meta no prazo
            </Text>
          </Card>
        )}

        {/* Informações de prazo */}
        <Card style={styles.dateCard}>
          <Text style={styles.sectionTitle}>Prazo</Text>
          
          <View style={styles.dateInfo}>
            <View style={styles.dateItem}>
              <Text style={styles.dateLabel}>Data final</Text>
              <Text style={styles.dateValue}>
                {formatDate(new Date(goal.targetDate || goal.endDate))}
              </Text>
            </View>
            
            {goal.daysRemaining && goal.daysRemaining > 0 && !isCompleted && (
              <View style={styles.dateItem}>
                <Text style={styles.dateLabel}>Dias restantes</Text>
                <Text style={[styles.dateValue, { color: COLORS.primary }]}>
                  {goal.daysRemaining} dias
                </Text>
              </View>
            )}
          </View>
        </Card>

        {/* Ações */}
        {!isCompleted && (
          <Card style={styles.actionsCard}>
            <Text style={styles.sectionTitle}>Ações</Text>
            
            <View style={styles.actionsContainer}>
              <Button
                title="Adicionar Valor"
                onPress={() => setShowAddValueModal(true)}
                style={styles.actionButton}
                variant="primary"
              />
              
              <Button
                title={isPaused ? 'Reativar' : 'Pausar'}
                onPress={handleTogglePause}
                style={styles.actionButton}
                variant={isPaused ? 'primary' : 'outline'}
              />
            </View>
          </Card>
        )}
      </ScrollView>

      {/* Modal para adicionar valor */}
      <CustomAlert
        visible={showAddValueModal}
        title="Adicionar Valor"
        onConfirm={handleAddValue}
        onCancel={() => {
          setShowAddValueModal(false);
          setAddValue('');
        }}
        confirmText="Adicionar"
        cancelText="Cancelar"
        loading={addingValue}
      >
        <CurrencyInput
          label="Valor a adicionar"
          placeholder="R$ 0,00"
          value={addValue}
          onChangeText={setAddValue}
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
  mainCard: {
    marginBottom: SPACING.md,
  },
  titleContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: SPACING.sm,
  },
  goalTitle: {
    flex: 1,
    fontSize: FONT_SIZES.xl,
    fontFamily: FONTS.bold,
    color: COLORS.textPrimary,
    marginRight: SPACING.sm,
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
  description: {
    fontSize: FONT_SIZES.md,
    fontFamily: FONTS.regular,
    color: COLORS.textSecondary,
    lineHeight: 22,
    marginBottom: SPACING.sm,
  },
  categoryContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  categoryText: {
    fontSize: FONT_SIZES.sm,
    fontFamily: FONTS.medium,
    color: COLORS.primary,
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
  currentAmount: {
    fontSize: FONT_SIZES.xxl,
    fontFamily: FONTS.bold,
    color: COLORS.primary,
  },
  targetAmount: {
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
  monthlyCard: {
    marginBottom: SPACING.md,
    backgroundColor: COLORS.primary + '08',
    borderLeftWidth: 4,
    borderLeftColor: COLORS.primary,
  },
  monthlyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginBottom: SPACING.md,
  },
  monthlyAmount: {
    fontSize: FONT_SIZES.xl,
    fontFamily: FONTS.bold,
    color: COLORS.primary,
    textAlign: 'center',
    marginBottom: SPACING.xs,
  },
  monthlyDescription: {
    fontSize: FONT_SIZES.sm,
    fontFamily: FONTS.regular,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  dateCard: {
    marginBottom: SPACING.md,
  },
  dateInfo: {
    gap: SPACING.md,
  },
  dateItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dateLabel: {
    fontSize: FONT_SIZES.md,
    fontFamily: FONTS.regular,
    color: COLORS.textSecondary,
  },
  dateValue: {
    fontSize: FONT_SIZES.md,
    fontFamily: FONTS.bold,
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
  errorText: {
    fontSize: FONT_SIZES.lg,
    fontFamily: FONTS.regular,
    color: COLORS.error,
    textAlign: 'center',
    marginTop: SPACING.xl,
  },
});