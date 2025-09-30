// src/screens/goals/SharedGoalsScreen.tsx
import React, { useState, useCallback } from 'react';
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
import { Card, Loading, EmptyState, Badge } from '../../components/common';
import { GoalShareService } from '../../services/GoalShareService';
import type { GoalShare } from '../../services/GoalShareService';
import { COLORS, FONTS, FONT_SIZES, SPACING, BORDER_RADIUS, SHADOWS } from '../../constants';

interface SharedGoalsScreenProps {
  navigation: any;
}

export const SharedGoalsScreen: React.FC<SharedGoalsScreenProps> = ({ navigation }) => {
  const [pendingInvites, setPendingInvites] = useState<GoalShare[]>([]);
  const [sharedGoals, setSharedGoals] = useState<GoalShare[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedTab, setSelectedTab] = useState<'invites' | 'shared'>('invites');

  const goalShareService = new GoalShareService();

  // Carregar dados
  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [invitesResponse, sharedResponse] = await Promise.all([
        goalShareService.getPendingInvites(),
        goalShareService.getSharedGoals(),
      ]);

      if (invitesResponse.success && invitesResponse.data) {
        setPendingInvites(invitesResponse.data);
      }

      if (sharedResponse.success && sharedResponse.data) {
        setSharedGoals(sharedResponse.data);
      }
    } catch (error: any) {
      console.error('Erro ao carregar dados:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  const handleRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  // Aceitar convite
  const handleAcceptInvite = async (invite: GoalShare) => {
    try {
      const response = await goalShareService.acceptInvite(invite._id);
      if (response.success) {
        Alert.alert('Sucesso', 'Convite aceito! Agora você tem acesso à meta.');
        loadData();
      } else {
        Alert.alert('Erro', response.message || 'Não foi possível aceitar o convite');
      }
    } catch (error: any) {
      Alert.alert('Erro', 'Erro ao aceitar convite');
    }
  };

  // Rejeitar convite
  const handleRejectInvite = async (invite: GoalShare) => {
    Alert.alert(
      'Rejeitar Convite',
      `Deseja rejeitar o convite de ${invite.owner.name}?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Rejeitar',
          style: 'destructive',
          onPress: async () => {
            try {
              const response = await goalShareService.rejectInvite(invite._id);
              if (response.success) {
                Alert.alert('Convite rejeitado');
                loadData();
              }
            } catch (error: any) {
              Alert.alert('Erro', 'Erro ao rejeitar convite');
            }
          },
        },
      ]
    );
  };

  // Navegar para detalhes da meta compartilhada
  const handleViewSharedGoal = (share: GoalShare) => {
    navigation.navigate('GoalDetail', { goalId: share.goal._id });
  };

  // Formatar moeda
  const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  // Calcular progresso
  const calculateProgress = (current: number, target: number): number => {
    return Math.min((current / target) * 100, 100);
  };

  // Renderizar convite pendente
  const renderInviteItem = ({ item }: { item: GoalShare }) => (
    <Card style={styles.inviteCard}>
      <View style={styles.inviteHeader}>
        <View style={styles.inviteInfo}>
          <View style={styles.ownerAvatar}>
            <Text style={styles.ownerAvatarText}>
              {item.owner.name.charAt(0).toUpperCase()}
            </Text>
          </View>
          <View style={styles.inviteDetails}>
            <Text style={styles.inviteFrom}>
              <Text style={styles.ownerName}>{item.owner.name}</Text> convidou você
            </Text>
            <Text style={styles.goalTitle}>{item.goal.title}</Text>
          </View>
        </View>
        <Badge
          text={
            item.role === 'viewer' ? 'Visualizar' :
            item.role === 'contributor' ? 'Contribuir' :
            'Co-dono'
          }
          variant={
            item.role === 'viewer' ? 'neutral' :
            item.role === 'contributor' ? 'info' :
            'success'
          }
        />
      </View>

      <View style={styles.goalInfo}>
        <View style={styles.goalStat}>
          <Text style={styles.goalStatLabel}>Meta</Text>
          <Text style={styles.goalStatValue}>
            {formatCurrency(item.goal.targetAmount)}
          </Text>
        </View>
        <View style={styles.goalStat}>
          <Text style={styles.goalStatLabel}>Atual</Text>
          <Text style={styles.goalStatValue}>
            {formatCurrency(item.goal.currentAmount)}
          </Text>
        </View>
        <View style={styles.goalStat}>
          <Text style={styles.goalStatLabel}>Progresso</Text>
          <Text style={styles.goalStatValue}>
            {calculateProgress(item.goal.currentAmount, item.goal.targetAmount).toFixed(0)}%
          </Text>
        </View>
      </View>

      <View style={styles.inviteActions}>
        <TouchableOpacity
          style={[styles.actionButton, styles.rejectButton]}
          onPress={() => handleRejectInvite(item)}
        >
          <Ionicons name="close" size={20} color={COLORS.error} />
          <Text style={[styles.actionButtonText, { color: COLORS.error }]}>
            Rejeitar
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionButton, styles.acceptButton]}
          onPress={() => handleAcceptInvite(item)}
        >
          <Ionicons name="checkmark" size={20} color={COLORS.white} />
          <Text style={[styles.actionButtonText, { color: COLORS.white }]}>
            Aceitar
          </Text>
        </TouchableOpacity>
      </View>
    </Card>
  );

  // Renderizar meta compartilhada
  const renderSharedItem = ({ item }: { item: GoalShare }) => {
    const progress = calculateProgress(item.goal.currentAmount, item.goal.targetAmount);

    return (
      <Card style={styles.sharedCard}>
        <TouchableOpacity
          onPress={() => handleViewSharedGoal(item)}
          activeOpacity={0.7}
        >
          <View style={styles.sharedHeader}>
            <View style={styles.sharedInfo}>
              <Text style={styles.sharedGoalTitle}>{item.goal.title}</Text>
              <View style={styles.ownerInfo}>
                <Ionicons name="person-outline" size={14} color={COLORS.textSecondary} />
                <Text style={styles.ownerInfoText}>
                  Meta de {item.owner.name}
                </Text>
              </View>
            </View>
            <Badge
              text={
                item.role === 'viewer' ? 'Visualizar' :
                item.role === 'contributor' ? 'Contribuir' :
                'Co-dono'
              }
              variant={
                item.role === 'viewer' ? 'neutral' :
                item.role === 'contributor' ? 'info' :
                'success'
              }
            />
          </View>

          <View style={styles.progressContainer}>
            <View style={styles.progressBar}>
              <View
                style={[styles.progressFill, { width: `${Math.min(progress, 100)}%` }]}
              />
            </View>
            <Text style={styles.progressText}>{progress.toFixed(0)}%</Text>
          </View>

          <View style={styles.sharedAmounts}>
            <View style={styles.amountItem}>
              <Text style={styles.amountLabel}>Atual</Text>
              <Text style={styles.amountValue}>
                {formatCurrency(item.goal.currentAmount)}
              </Text>
            </View>
            <View style={styles.amountItem}>
              <Text style={styles.amountLabel}>Meta</Text>
              <Text style={styles.amountValue}>
                {formatCurrency(item.goal.targetAmount)}
              </Text>
            </View>
          </View>

          {item.contribution > 0 && (
            <View style={styles.contributionBadge}>
              <Ionicons name="cash-outline" size={14} color={COLORS.success} />
              <Text style={styles.contributionText}>
                Você contribuiu: {formatCurrency(item.contribution)}
              </Text>
            </View>
          )}
        </TouchableOpacity>
      </Card>
    );
  };

  // Renderizar tabs
  const renderTabs = () => (
    <View style={styles.tabsContainer}>
      <TouchableOpacity
        style={[styles.tab, selectedTab === 'invites' && styles.tabActive]}
        onPress={() => setSelectedTab('invites')}
      >
        <Text style={[styles.tabText, selectedTab === 'invites' && styles.tabTextActive]}>
          Convites
        </Text>
        {pendingInvites.length > 0 && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{pendingInvites.length}</Text>
          </View>
        )}
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.tab, selectedTab === 'shared' && styles.tabActive]}
        onPress={() => setSelectedTab('shared')}
      >
        <Text style={[styles.tabText, selectedTab === 'shared' && styles.tabTextActive]}>
          Metas Compartilhadas
        </Text>
        {sharedGoals.length > 0 && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{sharedGoals.length}</Text>
          </View>
        )}
      </TouchableOpacity>
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={COLORS.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Metas Compartilhadas</Text>
          <View style={{ width: 40 }} />
        </View>
        <Loading />
      </SafeAreaView>
    );
  }

  const currentData = selectedTab === 'invites' ? pendingInvites : sharedGoals;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={COLORS.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Metas Compartilhadas</Text>
        <View style={{ width: 40 }} />
      </View>

      {renderTabs()}

      <FlatList
        data={currentData}
        renderItem={selectedTab === 'invites' ? renderInviteItem : renderSharedItem}
        keyExtractor={(item) => item._id}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
        ListEmptyComponent={
          <EmptyState
            icon={selectedTab === 'invites' ? 'mail-outline' : 'people-outline'}
            title={
              selectedTab === 'invites'
                ? 'Nenhum convite pendente'
                : 'Nenhuma meta compartilhada'
            }
            description={
              selectedTab === 'invites'
                ? 'Você não tem convites de metas no momento'
                : 'Nenhuma meta foi compartilhada com você ainda'
            }
          />
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
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray200,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: FONT_SIZES.lg,
    fontFamily: FONTS.bold,
    color: COLORS.textPrimary,
  },
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray200,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.md,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
    gap: SPACING.xs,
  },
  tabActive: {
    borderBottomColor: COLORS.primary,
  },
  tabText: {
    fontSize: FONT_SIZES.sm,
    fontFamily: FONTS.medium,
    color: COLORS.textSecondary,
  },
  tabTextActive: {
    color: COLORS.primary,
  },
  badge: {
    minWidth: 20,
    height: 20,
    borderRadius: BORDER_RADIUS.full,
    backgroundColor: COLORS.error,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
  },
  badgeText: {
    fontSize: FONT_SIZES.xs,
    fontFamily: FONTS.bold,
    color: COLORS.white,
  },
  listContent: {
    padding: SPACING.md,
  },
  inviteCard: {
    marginBottom: SPACING.md,
  },
  inviteHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: SPACING.md,
  },
  inviteInfo: {
    flexDirection: 'row',
    flex: 1,
    marginRight: SPACING.sm,
  },
  ownerAvatar: {
    width: 48,
    height: 48,
    borderRadius: BORDER_RADIUS.full,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.sm,
  },
  ownerAvatarText: {
    fontSize: FONT_SIZES.xl,
    fontFamily: FONTS.bold,
    color: COLORS.white,
  },
  inviteDetails: {
    flex: 1,
  },
  inviteFrom: {
    fontSize: FONT_SIZES.sm,
    fontFamily: FONTS.regular,
    color: COLORS.textSecondary,
    marginBottom: 4,
  },
  ownerName: {
    fontFamily: FONTS.bold,
    color: COLORS.textPrimary,
  },
  goalTitle: {
    fontSize: FONT_SIZES.md,
    fontFamily: FONTS.bold,
    color: COLORS.textPrimary,
  },
  goalInfo: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: SPACING.sm,
    marginBottom: SPACING.md,
    backgroundColor: COLORS.background,
    borderRadius: BORDER_RADIUS.md,
  },
  goalStat: {
    alignItems: 'center',
  },
  goalStatLabel: {
    fontSize: FONT_SIZES.xs,
    fontFamily: FONTS.regular,
    color: COLORS.textSecondary,
    marginBottom: 4,
  },
  goalStatValue: {
    fontSize: FONT_SIZES.md,
    fontFamily: FONTS.bold,
    color: COLORS.textPrimary,
  },
  inviteActions: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.md,
    gap: SPACING.xs,
  },
  rejectButton: {
    backgroundColor: COLORS.error + '10',
    borderWidth: 1,
    borderColor: COLORS.error,
  },
  acceptButton: {
    backgroundColor: COLORS.success,
  },
  actionButtonText: {
    fontSize: FONT_SIZES.sm,
    fontFamily: FONTS.bold,
  },
  sharedCard: {
    marginBottom: SPACING.md,
  },
  sharedHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: SPACING.sm,
  },
  sharedInfo: {
    flex: 1,
    marginRight: SPACING.sm,
  },
  sharedGoalTitle: {
    fontSize: FONT_SIZES.md,
    fontFamily: FONTS.bold,
    color: COLORS.textPrimary,
    marginBottom: 4,
  },
  ownerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  ownerInfoText: {
    fontSize: FONT_SIZES.xs,
    fontFamily: FONTS.regular,
    color: COLORS.textSecondary,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginBottom: SPACING.sm,
  },
  progressBar: {
    flex: 1,
    height: 8,
    backgroundColor: COLORS.gray200,
    borderRadius: BORDER_RADIUS.full,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: COLORS.success,
  },
  progressText: {
    fontSize: FONT_SIZES.sm,
    fontFamily: FONTS.bold,
    color: COLORS.textPrimary,
    minWidth: 40,
    textAlign: 'right',
  },
  sharedAmounts: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: SPACING.sm,
    borderTopWidth: 1,
    borderTopColor: COLORS.gray200,
  },
  amountItem: {
    alignItems: 'center',
  },
  amountLabel: {
    fontSize: FONT_SIZES.xs,
    fontFamily: FONTS.regular,
    color: COLORS.textSecondary,
    marginBottom: 4,
  },
  amountValue: {
    fontSize: FONT_SIZES.md,
    fontFamily: FONTS.bold,
    color: COLORS.textPrimary,
  },
  contributionBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: SPACING.sm,
    padding: SPACING.sm,
    backgroundColor: COLORS.success + '10',
    borderRadius: BORDER_RADIUS.sm,
    gap: SPACING.xs,
  },
  contributionText: {
    fontSize: FONT_SIZES.xs,
    fontFamily: FONTS.medium,
    color: COLORS.success,
  },
});