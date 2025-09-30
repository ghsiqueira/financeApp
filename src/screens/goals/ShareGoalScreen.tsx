// src/screens/goals/ShareGoalScreen.tsx
import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { Card, Button, Loading, Badge } from '../../components/common';
import { GoalShareService } from '../../services/GoalShareService';
import type { GoalShare } from '../../services/GoalShareService';
import { COLORS, FONTS, FONT_SIZES, SPACING, BORDER_RADIUS, SHADOWS } from '../../constants';

interface ShareGoalScreenProps {
  navigation: any;
  route: {
    params: {
      goalId: string;
      goalTitle: string;
    };
  };
}

export const ShareGoalScreen: React.FC<ShareGoalScreenProps> = ({ navigation, route }) => {
  const { goalId, goalTitle } = route.params;
  const [email, setEmail] = useState('');
  const [selectedRole, setSelectedRole] = useState<'viewer' | 'contributor' | 'co-owner'>('contributor');
  const [shares, setShares] = useState<GoalShare[]>([]);
  const [loading, setLoading] = useState(true);
  const [inviting, setInviting] = useState(false);

  const goalShareService = new GoalShareService();

  // Carregar compartilhamentos
  const loadShares = useCallback(async () => {
    try {
      setLoading(true);
      const response = await goalShareService.getGoalShares(goalId);
      if (response.success && response.data) {
        setShares(response.data);
      }
    } catch (error: any) {
      console.error('Erro ao carregar compartilhamentos:', error);
    } finally {
      setLoading(false);
    }
  }, [goalId]);

  useFocusEffect(
    useCallback(() => {
      loadShares();
    }, [loadShares])
  );

  // Enviar convite
  const handleInvite = async () => {
    if (!email.trim()) {
      Alert.alert('Atenção', 'Digite um e-mail');
      return;
    }

    // Validar email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      Alert.alert('Atenção', 'Digite um e-mail válido');
      return;
    }

    setInviting(true);
    try {
      const response = await goalShareService.shareGoal(goalId, email, selectedRole);
      
      if (response.success) {
        Alert.alert('Sucesso', 'Convite enviado com sucesso!');
        setEmail('');
        loadShares();
      } else {
        Alert.alert('Erro', response.message || 'Não foi possível enviar o convite');
      }
    } catch (error: any) {
      Alert.alert('Erro', error.message || 'Erro ao enviar convite');
    } finally {
      setInviting(false);
    }
  };

  // Remover compartilhamento
  const handleRemoveShare = (share: GoalShare) => {
    Alert.alert(
      'Remover acesso',
      `Deseja remover o acesso de ${share.sharedWith.name}?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Remover',
          style: 'destructive',
          onPress: async () => {
            try {
              const response = await goalShareService.removeShare(share._id);
              if (response.success) {
                Alert.alert('Sucesso', 'Acesso removido');
                loadShares();
              }
            } catch (error: any) {
              Alert.alert('Erro', 'Não foi possível remover o acesso');
            }
          },
        },
      ]
    );
  };

  // Alterar role
  const handleChangeRole = (share: GoalShare) => {
    Alert.alert(
      'Alterar Permissão',
      `Escolha o nível de acesso para ${share.sharedWith.name}:`,
      [
        {
          text: 'Visualizador',
          onPress: () => updateRole(share._id, 'viewer'),
        },
        {
          text: 'Contribuidor',
          onPress: () => updateRole(share._id, 'contributor'),
        },
        {
          text: 'Co-proprietário',
          onPress: () => updateRole(share._id, 'co-owner'),
        },
        { text: 'Cancelar', style: 'cancel' },
      ]
    );
  };

  const updateRole = async (shareId: string, role: 'viewer' | 'contributor' | 'co-owner') => {
    try {
      const response = await goalShareService.updateRole(shareId, role);
      if (response.success) {
        Alert.alert('Sucesso', 'Permissão atualizada');
        loadShares();
      }
    } catch (error: any) {
      Alert.alert('Erro', 'Não foi possível atualizar a permissão');
    }
  };

  // Descrições dos roles
  const getRoleDescription = (role: string) => {
    switch (role) {
      case 'viewer':
        return 'Pode apenas visualizar';
      case 'contributor':
        return 'Pode visualizar e contribuir';
      case 'co-owner':
        return 'Pode editar e gerenciar';
      default:
        return '';
    }
  };

  const getRoleBadgeVariant = (role: string): 'neutral' | 'success' | 'warning' | 'error' | 'info' => {
    switch (role) {
      case 'viewer':
        return 'neutral';
      case 'contributor':
        return 'info';
      case 'co-owner':
        return 'success';
      default:
        return 'neutral';
    }
  };

  // Renderizar item de compartilhamento
  const renderShareItem = ({ item }: { item: GoalShare }) => (
    <Card style={styles.shareCard}>
      <View style={styles.shareHeader}>
        <View style={styles.userInfo}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {item.sharedWith.name.charAt(0).toUpperCase()}
            </Text>
          </View>
          <View style={styles.userDetails}>
            <Text style={styles.userName}>{item.sharedWith.name}</Text>
            <Text style={styles.userEmail}>{item.sharedWith.email}</Text>
          </View>
        </View>
        <TouchableOpacity
          style={styles.removeButton}
          onPress={() => handleRemoveShare(item)}
        >
          <Ionicons name="close-circle" size={24} color={COLORS.error} />
        </TouchableOpacity>
      </View>

      <View style={styles.shareInfo}>
        <TouchableOpacity
          style={styles.roleContainer}
          onPress={() => handleChangeRole(item)}
        >
          <Badge text={item.role} variant={getRoleBadgeVariant(item.role)} />
          <Text style={styles.roleDescription}>{getRoleDescription(item.role)}</Text>
          <Ionicons name="chevron-down" size={16} color={COLORS.textSecondary} />
        </TouchableOpacity>

        <Badge
          text={item.status === 'pending' ? 'Pendente' : 'Ativo'}
          variant={item.status === 'pending' ? 'warning' : 'success'}
        />
      </View>

      {item.contribution > 0 && (
        <View style={styles.contributionInfo}>
          <Ionicons name="cash-outline" size={16} color={COLORS.success} />
          <Text style={styles.contributionText}>
            Contribuiu: R$ {item.contribution.toFixed(2)}
          </Text>
        </View>
      )}
    </Card>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={COLORS.textPrimary} />
        </TouchableOpacity>
        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitle}>Compartilhar Meta</Text>
          <Text style={styles.headerSubtitle}>{goalTitle}</Text>
        </View>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Formulário de convite */}
        <Card style={styles.inviteCard}>
          <Text style={styles.sectionTitle}>Convidar Pessoa</Text>
          
          <TextInput
            style={styles.input}
            placeholder="E-mail da pessoa"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
          />

          <Text style={styles.label}>Nível de Acesso</Text>
          <View style={styles.roleButtons}>
            <TouchableOpacity
              style={[
                styles.roleButton,
                selectedRole === 'viewer' && styles.roleButtonActive,
              ]}
              onPress={() => setSelectedRole('viewer')}
            >
              <Ionicons
                name="eye-outline"
                size={20}
                color={selectedRole === 'viewer' ? COLORS.white : COLORS.textSecondary}
              />
              <Text
                style={[
                  styles.roleButtonText,
                  selectedRole === 'viewer' && styles.roleButtonTextActive,
                ]}
              >
                Visualizador
              </Text>
              <Text
                style={[
                  styles.roleButtonDesc,
                  selectedRole === 'viewer' && styles.roleButtonDescActive,
                ]}
              >
                Apenas vê
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.roleButton,
                selectedRole === 'contributor' && styles.roleButtonActive,
              ]}
              onPress={() => setSelectedRole('contributor')}
            >
              <Ionicons
                name="add-circle-outline"
                size={20}
                color={selectedRole === 'contributor' ? COLORS.white : COLORS.textSecondary}
              />
              <Text
                style={[
                  styles.roleButtonText,
                  selectedRole === 'contributor' && styles.roleButtonTextActive,
                ]}
              >
                Contribuidor
              </Text>
              <Text
                style={[
                  styles.roleButtonDesc,
                  selectedRole === 'contributor' && styles.roleButtonDescActive,
                ]}
              >
                Vê e contribui
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.roleButton,
                selectedRole === 'co-owner' && styles.roleButtonActive,
              ]}
              onPress={() => setSelectedRole('co-owner')}
            >
              <Ionicons
                name="create-outline"
                size={20}
                color={selectedRole === 'co-owner' ? COLORS.white : COLORS.textSecondary}
              />
              <Text
                style={[
                  styles.roleButtonText,
                  selectedRole === 'co-owner' && styles.roleButtonTextActive,
                ]}
              >
                Co-dono
              </Text>
              <Text
                style={[
                  styles.roleButtonDesc,
                  selectedRole === 'co-owner' && styles.roleButtonDescActive,
                ]}
              >
                Controle total
              </Text>
            </TouchableOpacity>
          </View>

          <Button
            title="Enviar Convite"
            onPress={handleInvite}
            loading={inviting}
          />
        </Card>

        {/* Lista de pessoas com acesso */}
        <View style={styles.sharesSection}>
          <Text style={styles.sectionTitle}>
            Pessoas com Acesso ({shares.length})
          </Text>

          {loading ? (
            <Loading />
          ) : shares.length === 0 ? (
            <Card>
              <View style={styles.emptyState}>
                <Ionicons name="people-outline" size={48} color={COLORS.textTertiary} />
                <Text style={styles.emptyStateText}>
                  Nenhuma pessoa adicionada ainda
                </Text>
                <Text style={styles.emptyStateSubtext}>
                  Convide pessoas para compartilhar esta meta
                </Text>
              </View>
            </Card>
          ) : (
            <FlatList
              data={shares}
              renderItem={renderShareItem}
              keyExtractor={(item) => item._id}
              scrollEnabled={false}
            />
          )}
        </View>

        <View style={styles.bottomSpacing} />
      </ScrollView>
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
  headerTitleContainer: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: FONT_SIZES.lg,
    fontFamily: FONTS.bold,
    color: COLORS.textPrimary,
  },
  headerSubtitle: {
    fontSize: FONT_SIZES.sm,
    fontFamily: FONTS.regular,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  content: {
    flex: 1,
    padding: SPACING.md,
  },
  inviteCard: {
    marginBottom: SPACING.lg,
  },
  sectionTitle: {
    fontSize: FONT_SIZES.lg,
    fontFamily: FONTS.bold,
    color: COLORS.textPrimary,
    marginBottom: SPACING.md,
  },
  input: {
    borderWidth: 1,
    borderColor: COLORS.gray200,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    fontSize: FONT_SIZES.md,
    fontFamily: FONTS.regular,
    color: COLORS.textPrimary,
    backgroundColor: COLORS.white,
    marginBottom: SPACING.md,
  },
  label: {
    fontSize: FONT_SIZES.sm,
    fontFamily: FONTS.medium,
    color: COLORS.textSecondary,
    marginBottom: SPACING.sm,
  },
  roleButtons: {
    flexDirection: 'row',
    gap: SPACING.sm,
    marginBottom: SPACING.md,
  },
  roleButton: {
    flex: 1,
    padding: SPACING.sm,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 2,
    borderColor: COLORS.gray200,
    backgroundColor: COLORS.white,
    alignItems: 'center',
  },
  roleButtonActive: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primary,
  },
  roleButtonText: {
    fontSize: FONT_SIZES.xs,
    fontFamily: FONTS.bold,
    color: COLORS.textPrimary,
    marginTop: 4,
  },
  roleButtonTextActive: {
    color: COLORS.white,
  },
  roleButtonDesc: {
    fontSize: FONT_SIZES.xs,
    fontFamily: FONTS.regular,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  roleButtonDescActive: {
    color: COLORS.white,
    opacity: 0.9,
  },
  sharesSection: {
    marginTop: SPACING.md,
  },
  shareCard: {
    marginBottom: SPACING.sm,
  },
  shareHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: BORDER_RADIUS.full,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.sm,
  },
  avatarText: {
    fontSize: FONT_SIZES.xl,
    fontFamily: FONTS.bold,
    color: COLORS.white,
  },
  userDetails: {
    flex: 1,
  },
  userName: {
    fontSize: FONT_SIZES.md,
    fontFamily: FONTS.bold,
    color: COLORS.textPrimary,
    marginBottom: 2,
  },
  userEmail: {
    fontSize: FONT_SIZES.sm,
    fontFamily: FONTS.regular,
    color: COLORS.textSecondary,
  },
  removeButton: {
    padding: SPACING.xs,
  },
  shareInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: SPACING.sm,
    borderTopWidth: 1,
    borderTopColor: COLORS.gray200,
  },
  roleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  roleDescription: {
    fontSize: FONT_SIZES.xs,
    fontFamily: FONTS.regular,
    color: COLORS.textSecondary,
    marginLeft: SPACING.xs,
  },
  contributionInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: SPACING.sm,
    padding: SPACING.sm,
    backgroundColor: COLORS.success + '10',
    borderRadius: BORDER_RADIUS.sm,
    gap: SPACING.xs,
  },
  contributionText: {
    fontSize: FONT_SIZES.sm,
    fontFamily: FONTS.medium,
    color: COLORS.success,
  },
  emptyState: {
    alignItems: 'center',
    padding: SPACING.xl,
  },
  emptyStateText: {
    fontSize: FONT_SIZES.md,
    fontFamily: FONTS.bold,
    color: COLORS.textPrimary,
    marginTop: SPACING.sm,
  },
  emptyStateSubtext: {
    fontSize: FONT_SIZES.sm,
    fontFamily: FONTS.regular,
    color: COLORS.textSecondary,
    marginTop: SPACING.xs,
    textAlign: 'center',
  },
  bottomSpacing: {
    height: SPACING.xl,
  },
});