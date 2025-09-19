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
} from '../../components/common';
import { Card, Loading, Button } from '../../components/common/index';
import { GoalService } from '../../services/GoalService';
import { Goal } from '../../types';
import { COLORS, FONTS, FONT_SIZES, SPACING } from '../../constants';
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

      const newCurrentAmount = goal.currentAmount + valueToAdd;
      
      await GoalService.updateGoal(goalId, {
        currentAmount: newCurrentAmount,
      });

      // Recarregar meta
      await loadGoal();
      
      setShowAddValueModal(false);
      setAddValue('');
      
      // Verificar se a meta foi concluída
      if (newCurrentAmount >= goal.targetAmount) {
        Alert.alert(
          '🎉 Parabéns!',
          'Você atingiu sua meta! Continue assim!',
          [{ text: 'Ok' }]
        );
      }
    } catch (error: any) {
      Alert.alert('Erro', error.message || 'Erro ao adicionar valor');
    } finally {
      setAddingValue(false);
    }
  };

  // Compartilhar meta
  const handleShare = async () => {
    if (!goal) return;

    const progress = Math.min((goal.currentAmount / goal.targetAmount) * 100, 100);
    const message = `🎯 Minha meta: ${goal.title}\n\n💰 Progresso: ${formatCurrency(goal.currentAmount)} de ${formatCurrency(goal.targetAmount)} (${progress.toFixed(0)}%)\n\n📅 Meta para: ${formatDate(goal.targetDate)}\n\n#FinanceApp #MetasFinanceiras`;

    try {
      await Share.share({
        message,
        title: 'Compartilhar Meta',
      });
    } catch (error) {
      console.error('Erro ao compartilhar:', error);
    }
  };

  // Deletar meta
  const handleDelete = () => {
    Alert.alert(
      'Excluir Meta',
      `Tem certeza que deseja excluir a meta "${goal?.title}"?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Excluir',
          style: 'destructive',
          onPress: async () => {
            try {
              await GoalService.deleteGoal(goalId);
              Alert.alert('Sucesso', 'Meta excluída com sucesso!');
              navigation.goBack();
            } catch (error: any) {
              Alert.alert('Erro', error.message || 'Erro ao excluir meta');
            }
          },
        },
      ]
    );
  };

  if (loading) {
    return <Loading text="Carregando meta..." />;
  }

  if (!goal) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Meta não encontrada</Text>
          <Button title="Voltar" onPress={() => navigation.goBack()} />
        </View>
      </SafeAreaView>
    );
  }

  const progress = Math.min((goal.currentAmount / goal.targetAmount) * 100, 100);
  const remainingAmount = Math.max(goal.targetAmount - goal.currentAmount, 0);
  const isCompleted = goal.status === 'completed' || goal.currentAmount >= goal.targetAmount;
  const daysLeft = Math.ceil(
    (new Date(goal.targetDate || goal.endDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header personalizado */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.headerButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color={COLORS.textPrimary} />
        </TouchableOpacity>
        
        <View style={styles.headerActions}>
          <TouchableOpacity
            style={styles.headerButton}
            onPress={handleShare}
          >
            <Ionicons name="share-outline" size={24} color={COLORS.textPrimary} />
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.headerButton}
            onPress={() => navigation.navigate('EditGoal', { goalId })}
          >
            <Ionicons name="create-outline" size={24} color={COLORS.textPrimary} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Card principal da meta */}
        <Card style={styles.mainCard}>
          <View style={styles.goalHeader}>
            <Text style={styles.goalTitle}>{goal.title}</Text>
            {goal.category && (
              <View style={styles.categoryBadge}>
                <Text style={styles.categoryText}>{goal.category}</Text>
              </View>
            )}
          </View>

          {goal.description && (
            <Text style={styles.goalDescription}>{goal.description}</Text>
          )}

          <View style={styles.statusContainer}>
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
                {isCompleted ? '✅ Concluída' : 
                 daysLeft < 0 ? '⏰ Vencida' : 
                 daysLeft === 0 ? '🔥 Último dia' : `⏳ ${daysLeft} dias restantes`}
              </Text>
            </View>
          </View>
        </Card>

        {/* Card de progresso */}
        <Card style={styles.progressCard}>
          <Text style={styles.cardTitle}>Progresso da Meta</Text>
          
          <View style={styles.progressInfo}>
            <View style={styles.progressValues}>
              <Text style={styles.currentValue}>
                {formatCurrency(goal.currentAmount)}
              </Text>
              <Text style={styles.targetValue}>
                de {formatCurrency(goal.targetAmount)}
              </Text>
            </View>
            
            <Text style={styles.progressPercentage}>
              {progress.toFixed(1)}%
            </Text>
          </View>

          <ProgressBar
            progress={progress}
            color={isCompleted ? COLORS.success : COLORS.primary}
            backgroundColor={COLORS.gray200}
            style={styles.progressBar}
          />

          {!isCompleted && (
            <View style={styles.remainingInfo}>
              <Text style={styles.remainingText}>
                Faltam {formatCurrency(remainingAmount)} para atingir sua meta
              </Text>
            </View>
          )}
        </Card>

        {/* Card de informações */}
        <Card style={styles.infoCard}>
          <Text style={styles.cardTitle}>Informações</Text>
          
          <View style={styles.infoList}>
            <View style={styles.infoItem}>
              <View style={styles.infoIcon}>
                <Ionicons name="calendar-outline" size={20} color={COLORS.primary} />
              </View>
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Data da Meta</Text>
                <Text style={styles.infoValue}>{formatDate(goal.targetDate || goal.endDate)}</Text>
              </View>
            </View>

            <View style={styles.infoItem}>
              <View style={styles.infoIcon}>
                <Ionicons name="time-outline" size={20} color={COLORS.primary} />
              </View>
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Criada em</Text>
                <Text style={styles.infoValue}>{formatDate(goal.createdAt)}</Text>
              </View>
            </View>

            {goal.updatedAt !== goal.createdAt && (
              <View style={styles.infoItem}>
                <View style={styles.infoIcon}>
                  <Ionicons name="refresh-outline" size={20} color={COLORS.primary} />
                </View>
                <View style={styles.infoContent}>
                  <Text style={styles.infoLabel}>Última atualização</Text>
                  <Text style={styles.infoValue}>{formatDate(goal.updatedAt)}</Text>
                </View>
              </View>
            )}
          </View>
        </Card>

        {/* Estatísticas adicionais */}
        {!isCompleted && daysLeft > 0 && (
          <Card style={styles.statsCard}>
            <Text style={styles.cardTitle}>Estatísticas</Text>
            
            <View style={styles.statsList}>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>
                  {formatCurrency(remainingAmount / daysLeft)}
                </Text>
                <Text style={styles.statLabel}>Por dia restante</Text>
              </View>
              
              <View style={styles.statItem}>
                <Text style={styles.statValue}>
                  {formatCurrency((remainingAmount / daysLeft) * 7)}
                </Text>
                <Text style={styles.statLabel}>Por semana</Text>
              </View>
              
              <View style={styles.statItem}>
                <Text style={styles.statValue}>
                  {formatCurrency((remainingAmount / daysLeft) * 30)}
                </Text>
                <Text style={styles.statLabel}>Por mês</Text>
              </View>
            </View>
          </Card>
        )}

        {/* Botão de excluir */}
        <View style={styles.dangerZone}>
          <TouchableOpacity
            style={styles.deleteButton}
            onPress={handleDelete}
          >
            <Ionicons name="trash-outline" size={20} color={COLORS.error} />
            <Text style={styles.deleteButtonText}>Excluir Meta</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Botão flutuante para adicionar valor */}
      {!isCompleted && (
        <TouchableOpacity
          style={styles.fab}
          onPress={() => setShowAddValueModal(true)}
        >
          <Ionicons name="add" size={24} color={COLORS.white} />
        </TouchableOpacity>
      )}

      {/* Modal para adicionar valor */}
      <CustomAlert
        visible={showAddValueModal}
        title="Adicionar Valor"
        type="info"
        onConfirm={handleAddValue}
        onCancel={() => {
          setShowAddValueModal(false);
          setAddValue('');
        }}
        confirmText="Adicionar"
        cancelText="Cancelar"
        loading={addingValue}
      >
        <View style={styles.modalContent}>
          <Text style={styles.modalText}>
            Quanto você quer adicionar à sua meta?
          </Text>
          <CurrencyInput
            placeholder="R$ 0,00"
            value={addValue}
            onChangeText={setAddValue}
            autoFocus
          />
        </View>
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
  headerButton: {
    padding: SPACING.sm,
    borderRadius: 8,
  },
  headerActions: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  content: {
    flex: 1,
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.md,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
  },
  errorText: {
    fontSize: FONT_SIZES.lg,
    fontFamily: FONTS.regular,
    color: COLORS.textSecondary,
    marginBottom: SPACING.lg,
  },
  mainCard: {
    marginBottom: SPACING.md,
    padding: SPACING.lg,
  },
  goalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: SPACING.md,
  },
  goalTitle: {
    flex: 1,
    fontSize: FONT_SIZES.xl,
    fontFamily: FONTS.bold,
    color: COLORS.textPrimary,
    marginRight: SPACING.md,
  },
  categoryBadge: {
    backgroundColor: COLORS.primary10,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: 16,
  },
  categoryText: {
    fontSize: FONT_SIZES.xs,
    fontFamily: FONTS.medium,
    color: COLORS.primary,
  },
  goalDescription: {
    fontSize: FONT_SIZES.base,
    fontFamily: FONTS.regular,
    color: COLORS.textSecondary,
    lineHeight: 22,
    marginBottom: SPACING.md,
  },
  statusContainer: {
    alignItems: 'flex-start',
  },
  statusBadge: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: 20,
  },
  statusText: {
    fontSize: FONT_SIZES.sm,
    fontFamily: FONTS.bold,
  },
  progressCard: {
    marginBottom: SPACING.md,
    padding: SPACING.lg,
  },
  cardTitle: {
    fontSize: FONT_SIZES.lg,
    fontFamily: FONTS.bold,
    color: COLORS.textPrimary,
    marginBottom: SPACING.md,
  },
  progressInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginBottom: SPACING.sm,
  },
  progressValues: {
    flex: 1,
  },
  currentValue: {
    fontSize: FONT_SIZES.xl,
    fontFamily: FONTS.bold,
    color: COLORS.primary,
  },
  targetValue: {
    fontSize: FONT_SIZES.sm,
    fontFamily: FONTS.regular,
    color: COLORS.textSecondary,
  },
  progressPercentage: {
    fontSize: FONT_SIZES.lg,
    fontFamily: FONTS.bold,
    color: COLORS.primary,
  },
  progressBar: {
    height: 12,
    borderRadius: 6,
    marginBottom: SPACING.sm,
  },
  remainingInfo: {
    backgroundColor: COLORS.backgroundSecondary,
    padding: SPACING.sm,
    borderRadius: 8,
  },
  remainingText: {
    fontSize: FONT_SIZES.sm,
    fontFamily: FONTS.medium,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  infoCard: {
    marginBottom: SPACING.md,
    padding: SPACING.lg,
  },
  infoList: {
    gap: SPACING.md,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  infoIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.primary10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
  },
  infoContent: {
    flex: 1,
  },
  infoLabel: {
    fontSize: FONT_SIZES.sm,
    fontFamily: FONTS.regular,
    color: COLORS.textSecondary,
    marginBottom: SPACING.xs,
  },
  infoValue: {
    fontSize: FONT_SIZES.base,
    fontFamily: FONTS.medium,
    color: COLORS.textPrimary,
  },
  statsCard: {
    marginBottom: SPACING.md,
    padding: SPACING.lg,
  },
  statsList: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
    padding: SPACING.sm,
  },
  statValue: {
    fontSize: FONT_SIZES.lg,
    fontFamily: FONTS.bold,
    color: COLORS.primary,
    marginBottom: SPACING.xs,
  },
  statLabel: {
    fontSize: FONT_SIZES.xs,
    fontFamily: FONTS.regular,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  dangerZone: {
    marginBottom: SPACING.xl,
    paddingTop: SPACING.lg,
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.error,
    borderRadius: 8,
    gap: SPACING.sm,
  },
  deleteButtonText: {
    fontSize: FONT_SIZES.base,
    fontFamily: FONTS.medium,
    color: COLORS.error,
  },
  fab: {
    position: 'absolute',
    bottom: SPACING.xl,
    right: SPACING.lg,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: COLORS.black,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 8,
  },
  modalContent: {
    paddingVertical: SPACING.md,
  },
  modalText: {
    fontSize: FONT_SIZES.base,
    fontFamily: FONTS.regular,
    color: COLORS.textPrimary,
    textAlign: 'center',
    marginBottom: SPACING.md,
  },
});