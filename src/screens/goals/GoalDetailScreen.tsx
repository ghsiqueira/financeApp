// src/screens/goals/GoalDetailScreen.tsx - COMPLETO COM COMPARTILHAMENTO
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  TextInput,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Card, Button, Loading } from '../../components/common';
import { GoalService } from '../../services/GoalService';
import { Goal } from '../../types';
import { formatCurrency, formatDate } from '../../utils';
import { COLORS, FONTS, FONT_SIZES, SPACING, BORDER_RADIUS, SHADOWS } from '../../constants';

interface GoalDetailScreenProps {
  navigation: any;
  route: {
    params: {
      goalId: string;
    };
  };
}

export const GoalDetailScreen: React.FC<GoalDetailScreenProps> = ({ navigation, route }) => {
  const { goalId } = route.params;
  const [goal, setGoal] = useState<Goal | null>(null);
  const [loading, setLoading] = useState(true);
  const [addModalVisible, setAddModalVisible] = useState(false);
  const [amountToAdd, setAmountToAdd] = useState('');

  useEffect(() => {
    loadGoal();
  }, [goalId]);

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
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível carregar a meta');
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

  const handleAddAmount = async () => {
    if (!goal) return;

    const amount = parseFloat(amountToAdd.replace(',', '.'));
    if (isNaN(amount) || amount <= 0) {
      Alert.alert('Atenção', 'Digite um valor válido');
      return;
    }

    try {
      const response = await GoalService.addToGoal(goal._id, amount);
      if (response.success) {
        Alert.alert('Sucesso', response.message || 'Valor adicionado com sucesso!');
        setAddModalVisible(false);
        setAmountToAdd('');
        loadGoal();
      } else {
        Alert.alert('Erro', response.message || 'Não foi possível adicionar o valor');
      }
    } catch (error: any) {
      Alert.alert('Erro', error.message || 'Erro ao adicionar valor');
    }
  };

  const handlePauseGoal = async () => {
    if (!goal) return;

    Alert.alert(
      'Pausar Meta',
      'Deseja pausar esta meta?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Pausar',
          onPress: async () => {
            try {
              const response = await GoalService.pauseGoal(goal._id);
              if (response.success) {
                Alert.alert('Sucesso', 'Meta pausada');
                loadGoal();
              }
            } catch (error) {
              Alert.alert('Erro', 'Não foi possível pausar a meta');
            }
          },
        },
      ]
    );
  };

  const handleResumeGoal = async () => {
    if (!goal) return;

    try {
      const response = await GoalService.resumeGoal(goal._id);
      if (response.success) {
        Alert.alert('Sucesso', 'Meta reativada');
        loadGoal();
      }
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível reativar a meta');
    }
  };

  const handleDeleteGoal = async () => {
    if (!goal) return;

    Alert.alert(
      'Excluir Meta',
      'Tem certeza que deseja excluir esta meta? Esta ação não pode ser desfeita.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Excluir',
          style: 'destructive',
          onPress: async () => {
            try {
              const response = await GoalService.deleteGoal(goal._id);
              if (response.success) {
                Alert.alert('Sucesso', 'Meta excluída');
                navigation.goBack();
              }
            } catch (error) {
              Alert.alert('Erro', 'Não foi possível excluir a meta');
            }
          },
        },
      ]
    );
  };

  // NOVA FUNÇÃO: Navegar para compartilhar meta
  const handleShareGoal = () => {
    if (!goal) return;
    navigation.navigate('ShareGoal', {
      goalId: goal._id,
      goalTitle: goal.title,
    });
  };

  const getStatusColor = () => {
    if (!goal) return COLORS.gray400;
    switch (goal.status) {
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

  const getStatusText = () => {
    if (!goal) return '';
    switch (goal.status) {
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

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <Loading />
      </SafeAreaView>
    );
  }

  if (!goal) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Meta não encontrada</Text>
        </View>
      </SafeAreaView>
    );
  }

  const progress = (goal.currentAmount / goal.targetAmount) * 100;
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
          {/* BOTÃO DE COMPARTILHAR */}
          <TouchableOpacity onPress={handleShareGoal} style={styles.headerButton}>
            <Ionicons name="share-social-outline" size={24} color={COLORS.primary} />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => navigation.navigate('EditGoal', { goalId: goal._id })}
            style={styles.headerButton}
          >
            <Ionicons name="create-outline" size={24} color={COLORS.textPrimary} />
          </TouchableOpacity>

          <TouchableOpacity onPress={handleDeleteGoal} style={styles.headerButton}>
            <Ionicons name="trash-outline" size={24} color={COLORS.error} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Card Principal */}
        <Card style={styles.mainCard}>
          <View style={styles.titleContainer}>
            <Text style={styles.goalTitle}>{goal.title}</Text>
            <View style={[styles.statusBadge, { backgroundColor: getStatusColor() + '20' }]}>
              <Text style={[styles.statusText, { color: getStatusColor() }]}>
                {getStatusText()}
              </Text>
            </View>
          </View>

          {goal.description && (
            <Text style={styles.description}>{goal.description}</Text>
          )}

          {/* Progresso */}
          <View style={styles.progressSection}>
            <View style={styles.progressHeader}>
              <Text style={styles.progressLabel}>Progresso</Text>
              <Text style={styles.progressPercentage}>{progress.toFixed(1)}%</Text>
            </View>

            <View style={styles.progressBarContainer}>
              <View
                style={[
                  styles.progressBar,
                  {
                    width: `${Math.min(progress, 100)}%`,
                    backgroundColor: isCompleted ? COLORS.success : getStatusColor(),
                  },
                ]}
              />
            </View>

            <View style={styles.amountRow}>
              <Text style={styles.currentAmount}>
                {formatCurrency(goal.currentAmount)}
              </Text>
              <Text style={styles.targetAmount}>
                de {formatCurrency(goal.targetAmount)}
              </Text>
            </View>
          </View>
        </Card>

        {/* Informações */}
        <Card style={styles.infoCard}>
          <Text style={styles.cardTitle}>Informações</Text>

          <View style={styles.infoRow}>
            <View style={styles.infoItem}>
              <Ionicons name="calendar-outline" size={20} color={COLORS.primary} />
              <Text style={styles.infoLabel}>Data Início</Text>
            </View>
            <Text style={styles.infoValue}>
              {formatDate(new Date(goal.startDate))}
            </Text>
          </View>

          <View style={styles.infoRow}>
            <View style={styles.infoItem}>
              <Ionicons name="calendar-outline" size={20} color={COLORS.primary} />
              <Text style={styles.infoLabel}>Data Fim</Text>
            </View>
            <Text style={styles.infoValue}>
              {formatDate(new Date(goal.endDate))}
            </Text>
          </View>

          {!isCompleted && (
            <View style={styles.infoRow}>
              <View style={styles.infoItem}>
                <Ionicons name="time-outline" size={20} color={COLORS.primary} />
                <Text style={styles.infoLabel}>Dias Restantes</Text>
              </View>
              <Text style={styles.infoValue}>{goal.daysRemaining || 0} dias</Text>
            </View>
          )}

          {!isCompleted && (
            <View style={styles.infoRow}>
              <View style={styles.infoItem}>
                <Ionicons name="cash-outline" size={20} color={COLORS.primary} />
                <Text style={styles.infoLabel}>Meta Mensal</Text>
              </View>
              <Text style={styles.infoValue}>
                {formatCurrency(goal.monthlyTargetRemaining || 0)}
              </Text>
            </View>
          )}

          {goal.category && (
            <View style={styles.infoRow}>
              <View style={styles.infoItem}>
                <Ionicons name="pricetag-outline" size={20} color={COLORS.primary} />
                <Text style={styles.infoLabel}>Categoria</Text>
              </View>
              <Text style={styles.infoValue}>{goal.category}</Text>
            </View>
          )}
        </Card>

        {/* Ações */}
        {!isCompleted && (
          <Card style={styles.actionsCard}>
            <Button
              title="Adicionar Valor"
              onPress={() => setAddModalVisible(true)}
              variant="primary"
            />

            {isPaused ? (
              <Button
                title="Reativar Meta"
                onPress={handleResumeGoal}
                variant="secondary"
              />
            ) : (
              <Button
                title="Pausar Meta"
                onPress={handlePauseGoal}
                variant="outline"
              />
            )}
          </Card>
        )}
      </ScrollView>

      {/* Modal Adicionar Valor */}
      <Modal
        visible={addModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setAddModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Adicionar Valor</Text>

            <TextInput
              style={styles.input}
              placeholder="0,00"
              keyboardType="decimal-pad"
              value={amountToAdd}
              onChangeText={setAmountToAdd}
            />

            <View style={styles.modalButtons}>
              <Button
                title="Cancelar"
                onPress={() => {
                  setAddModalVisible(false);
                  setAmountToAdd('');
                }}
                variant="outline"
              />
              <Button title="Adicionar" onPress={handleAddAmount} />
            </View>
          </View>
        </View>
      </Modal>
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
    ...SHADOWS.sm,
  },
  headerActions: {
    flexDirection: 'row',
    gap: SPACING.md,
  },
  headerButton: {
    padding: SPACING.xs,
  },
  content: {
    flex: 1,
    padding: SPACING.md,
  },
  mainCard: {
    marginBottom: SPACING.md,
  },
  titleContainer: {
    marginBottom: SPACING.md,
  },
  goalTitle: {
    fontSize: FONT_SIZES['2xl'],
    fontFamily: FONTS.bold,
    color: COLORS.textPrimary,
    marginBottom: SPACING.sm,
  },
  statusBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.full,
  },
  statusText: {
    fontSize: FONT_SIZES.sm,
    fontFamily: FONTS.medium,
  },
  description: {
    fontSize: FONT_SIZES.md,
    fontFamily: FONTS.regular,
    color: COLORS.textSecondary,
    lineHeight: 22,
    marginBottom: SPACING.lg,
  },
  progressSection: {
    marginTop: SPACING.md,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  progressLabel: {
    fontSize: FONT_SIZES.md,
    fontFamily: FONTS.medium,
    color: COLORS.textPrimary,
  },
  progressPercentage: {
    fontSize: FONT_SIZES.xl,
    fontFamily: FONTS.bold,
    color: COLORS.primary,
  },
  progressBarContainer: {
    height: 12,
    backgroundColor: COLORS.gray200,
    borderRadius: BORDER_RADIUS.full,
    overflow: 'hidden',
    marginBottom: SPACING.sm,
  },
  progressBar: {
    height: '100%',
    borderRadius: BORDER_RADIUS.full,
  },
  amountRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  currentAmount: {
    fontSize: FONT_SIZES.xl,
    fontFamily: FONTS.bold,
    color: COLORS.textPrimary,
  },
  targetAmount: {
    fontSize: FONT_SIZES.md,
    fontFamily: FONTS.regular,
    color: COLORS.textSecondary,
  },
  infoCard: {
    marginBottom: SPACING.md,
  },
  cardTitle: {
    fontSize: FONT_SIZES.lg,
    fontFamily: FONTS.bold,
    color: COLORS.textPrimary,
    marginBottom: SPACING.md,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray200,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  infoLabel: {
    fontSize: FONT_SIZES.md,
    fontFamily: FONTS.regular,
    color: COLORS.textSecondary,
  },
  infoValue: {
    fontSize: FONT_SIZES.md,
    fontFamily: FONTS.medium,
    color: COLORS.textPrimary,
  },
  actionsCard: {
    gap: SPACING.sm,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.md,
  },
  modalContent: {
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.xl,
    width: '100%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: FONT_SIZES.xl,
    fontFamily: FONTS.bold,
    color: COLORS.textPrimary,
    marginBottom: SPACING.lg,
    textAlign: 'center',
  },
  input: {
    borderWidth: 1,
    borderColor: COLORS.gray200,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    fontSize: FONT_SIZES.xl,
    fontFamily: FONTS.bold,
    textAlign: 'center',
    marginBottom: SPACING.lg,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    fontSize: FONT_SIZES.lg,
    fontFamily: FONTS.medium,
    color: COLORS.error,
  },
});