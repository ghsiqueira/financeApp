// src/screens/profile/ProfileScreen.tsx
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
  Switch,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

// Importações do projeto
import { useAuth } from '../../contexts/AuthContext';
import { Card, Loading } from '../../components/common';
import { COLORS, FONTS, FONT_SIZES, SPACING, BORDER_RADIUS, SHADOWS } from '../../constants';

interface MenuOption {
  title: string;
  icon: string;
  onPress: () => void;
  showArrow?: boolean;
  rightComponent?: React.ReactNode;
  color?: string;
}

interface UserStats {
  totalTransactions: number;
  totalGoals: number;
  totalBudgets: number;
  memberSince: string;
}

export const ProfileScreen: React.FC = () => {
  const navigation = useNavigation();
  const { user, logout } = useAuth();
  const [loading, setLoading] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [biometricEnabled, setBiometricEnabled] = useState(false);
  const [darkModeEnabled, setDarkModeEnabled] = useState(false);

  // Estatísticas do usuário (simuladas)
  const [userStats, setUserStats] = useState<UserStats>({
    totalTransactions: 0,
    totalGoals: 0,
    totalBudgets: 0,
    memberSince: new Date().toLocaleDateString('pt-BR'),
  });

  useEffect(() => {
    loadUserStats();
  }, []);

  const loadUserStats = async () => {
    // Simular carregamento de estatísticas
    // Em um app real, isso viria de uma API
    setUserStats({
      totalTransactions: 142,
      totalGoals: 5,
      totalBudgets: 8,
      memberSince: '01/01/2024',
    });
  };

  const handleLogout = () => {
    Alert.alert(
      'Sair da Conta',
      'Tem certeza que deseja sair?',
      [
        {
          text: 'Cancelar',
          style: 'cancel',
        },
        {
          text: 'Sair',
          style: 'destructive',
          onPress: () => {
            Alert.alert(
              'Confirmação Final',
              'Digite "EXCLUIR" para confirmar a exclusão da conta:',
              [
                { text: 'Cancelar', style: 'cancel' },
                {
                  text: 'Confirmar',
                  style: 'destructive',
                  onPress: () => {
                    // Aqui seria implementada a exclusão da conta
                    Alert.alert('Conta excluída', 'Sua conta foi excluída com sucesso.');
                  },
                },
              ]
            );
          },
        },
      ]
    );
  };

  const handleNotificationToggle = (value: boolean) => {
    setNotificationsEnabled(value);
    // Aqui seria implementada a lógica para ativar/desativar notificações
  };

  const handleBiometricToggle = (value: boolean) => {
    setBiometricEnabled(value);
    // Aqui seria implementada a lógica para ativar/desativar biometria
  };

  const handleDarkModeToggle = (value: boolean) => {
    setDarkModeEnabled(value);
    // Aqui seria implementada a lógica para tema escuro
  };

  const handleEditProfile = () => {
    navigation.navigate('EditProfile' as never);
  };

  const handleChangePassword = () => {
    Alert.alert('Alterar Senha', 'Funcionalidade em desenvolvimento');
  };

  const handleExportData = () => {
    Alert.alert(
      'Exportar Dados',
      'Escolha o formato para exportar seus dados:',
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'PDF', onPress: () => Alert.alert('Exportando...', 'Exportação em PDF iniciada') },
        { text: 'CSV', onPress: () => Alert.alert('Exportando...', 'Exportação em CSV iniciada') },
      ]
    );
  };

  const handleBackupData = () => {
    Alert.alert('Backup', 'Backup dos dados realizado com sucesso!');
  };

  const handleSupport = () => {
    Alert.alert('Suporte', 'Entre em contato: suporte@financeapp.com');
  };

  const handleAbout = () => {
    Alert.alert(
      'Sobre o App',
      'Finance App v1.0.0\n\nAplicativo para controle financeiro pessoal.\n\n© 2024 Finance App'
    );
  };

  const handlePrivacyPolicy = () => {
    Alert.alert('Política de Privacidade', 'Funcionalidade em desenvolvimento');
  };

  const handleTermsOfService = () => {
    Alert.alert('Termos de Uso', 'Funcionalidade em desenvolvimento');
  };

  // Renderizar informações do usuário
  const renderUserInfo = () => (
    <Card style={styles.userCard}>
      <View style={styles.userHeader}>
        <View style={styles.avatarContainer}>
          <View style={styles.avatar}>
            <Ionicons name="person" size={40} color={COLORS.white} />
          </View>
          <TouchableOpacity style={styles.editAvatarButton}>
            <Ionicons name="camera" size={16} color={COLORS.white} />
          </TouchableOpacity>
        </View>
        <View style={styles.userDetails}>
          <Text style={styles.userName}>{user?.name || 'Usuário'}</Text>
          <Text style={styles.userEmail}>{user?.email || 'usuario@email.com'}</Text>
          <Text style={styles.memberSince}>Membro desde {userStats.memberSince}</Text>
        </View>
        <TouchableOpacity style={styles.editButton} onPress={handleEditProfile}>
          <Ionicons name="pencil" size={20} color={COLORS.primary} />
        </TouchableOpacity>
      </View>
    </Card>
  );

  // Renderizar estatísticas do usuário
  const renderUserStats = () => (
    <Card style={styles.statsCard}>
      <Text style={styles.statsTitle}>Suas Estatísticas</Text>
      <View style={styles.statsGrid}>
        <View style={styles.statItem}>
          <View style={[styles.statIcon, { backgroundColor: COLORS.primary + '20' }]}>
            <Ionicons name="receipt" size={24} color={COLORS.primary} />
          </View>
          <Text style={styles.statNumber}>{userStats.totalTransactions}</Text>
          <Text style={styles.statLabel}>Transações</Text>
        </View>
        <View style={styles.statItem}>
          <View style={[styles.statIcon, { backgroundColor: COLORS.success + '20' }]}>
            <Ionicons name="flag" size={24} color={COLORS.success} />
          </View>
          <Text style={styles.statNumber}>{userStats.totalGoals}</Text>
          <Text style={styles.statLabel}>Metas</Text>
        </View>
        <View style={styles.statItem}>
          <View style={[styles.statIcon, { backgroundColor: COLORS.warning + '20' }]}>
            <Ionicons name="wallet" size={24} color={COLORS.warning} />
          </View>
          <Text style={styles.statNumber}>{userStats.totalBudgets}</Text>
          <Text style={styles.statLabel}>Orçamentos</Text>
        </View>
      </View>
    </Card>
  );

  // Renderizar seção de menu
  const renderMenuSection = (title: string, options: MenuOption[]) => (
    <View style={styles.menuSection}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <Card style={styles.menuCard}>
        {options.map((option, index) => (
          <TouchableOpacity
            key={option.title}
            style={[
              styles.menuItem,
              index < options.length - 1 && styles.menuItemBorder,
            ]}
            onPress={option.onPress}
          >
            <View style={styles.menuItemLeft}>
              <Ionicons
                name={option.icon as any}
                size={24}
                color={option.color || COLORS.textPrimary}
              />
              <Text
                style={[
                  styles.menuItemText,
                  option.color && { color: option.color },
                ]}
              >
                {option.title}
              </Text>
            </View>
            <View style={styles.menuItemRight}>
              {option.rightComponent}
              {option.showArrow !== false && (
                <Ionicons name="chevron-forward" size={20} color={COLORS.gray400} />
              )}
            </View>
          </TouchableOpacity>
        ))}
      </Card>
    </View>
  );

  const accountOptions: MenuOption[] = [
    {
      title: 'Editar Perfil',
      icon: 'person-outline',
      onPress: handleEditProfile,
    },
    {
      title: 'Alterar Senha',
      icon: 'lock-closed-outline',
      onPress: handleChangePassword,
    },
    {
      title: 'Notificações',
      icon: 'notifications-outline',
      onPress: () => {},
      showArrow: false,
      rightComponent: (
        <Switch
          value={notificationsEnabled}
          onValueChange={handleNotificationToggle}
          trackColor={{ false: COLORS.gray300, true: COLORS.primary + '40' }}
          thumbColor={notificationsEnabled ? COLORS.primary : COLORS.gray400}
        />
      ),
    },
    {
      title: 'Autenticação Biométrica',
      icon: 'finger-print-outline',
      onPress: () => {},
      showArrow: false,
      rightComponent: (
        <Switch
          value={biometricEnabled}
          onValueChange={handleBiometricToggle}
          trackColor={{ false: COLORS.gray300, true: COLORS.primary + '40' }}
          thumbColor={biometricEnabled ? COLORS.primary : COLORS.gray400}
        />
      ),
    },
  ];

  const dataOptions: MenuOption[] = [
    {
      title: 'Exportar Dados',
      icon: 'download-outline',
      onPress: handleExportData,
    },
    {
      title: 'Backup de Dados',
      icon: 'cloud-upload-outline',
      onPress: handleBackupData,
    },
  ];

  const supportOptions: MenuOption[] = [
    {
      title: 'Central de Ajuda',
      icon: 'help-circle-outline',
      onPress: handleSupport,
    },
    {
      title: 'Sobre o App',
      icon: 'information-circle-outline',
      onPress: handleAbout,
    },
    {
      title: 'Política de Privacidade',
      icon: 'shield-checkmark-outline',
      onPress: handlePrivacyPolicy,
    },
    {
      title: 'Termos de Uso',
      icon: 'document-text-outline',
      onPress: handleTermsOfService,
    },
  ];

  const handleDeleteAccount = () => {
    Alert.alert(
      'Excluir Conta',
      'Esta ação é irreversível. Todos os seus dados serão perdidos permanentemente.',
      [
        {
          text: 'Cancelar',
          style: 'cancel',
        },
        {
          text: 'Excluir',
          style: 'destructive',
          onPress: () => {
            // Aqui seria implementada a exclusão da conta
            Alert.alert('Conta excluída', 'Sua conta foi excluída com sucesso.');
          },
        },
      ]
    );
  }


  const dangerOptions: MenuOption[] = [
    {
      title: 'Sair da Conta',
      icon: 'log-out-outline',
      onPress: handleLogout,
      color: COLORS.error,
    },
    {
      title: 'Excluir Conta',
      icon: 'trash-outline',
      onPress: handleDeleteAccount,
      color: COLORS.error,
    },
  ];

  if (loading) {
    return <Loading text="Carregando perfil..." />;
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Perfil</Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {renderUserInfo()}
        {renderUserStats()}
        {renderMenuSection('Conta', accountOptions)}
        {renderMenuSection('Dados', dataOptions)}
        {renderMenuSection('Suporte', supportOptions)}
        {renderMenuSection('Zona de Perigo', dangerOptions)}
        
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
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    backgroundColor: COLORS.white,
    ...SHADOWS.sm,
  },
  headerTitle: {
    fontSize: FONT_SIZES.xl,
    fontFamily: FONTS.bold,
    color: COLORS.textPrimary,
  },
  content: {
    flex: 1,
    padding: SPACING.md,
  },
  userCard: {
    marginBottom: SPACING.md,
    padding: SPACING.md,
  },
  userHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarContainer: {
    position: 'relative',
    marginRight: SPACING.md,
  },
  avatar: {
    width: 70,
    height: 70,
    borderRadius: BORDER_RADIUS.full,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  editAvatarButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 24,
    height: 24,
    borderRadius: BORDER_RADIUS.full,
    backgroundColor: COLORS.secondary,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: COLORS.white,
  },
  userDetails: {
    flex: 1,
  },
  userName: {
    fontSize: FONT_SIZES.lg,
    fontFamily: FONTS.bold,
    color: COLORS.textPrimary,
    marginBottom: SPACING.xs,
  },
  userEmail: {
    fontSize: FONT_SIZES.md,
    fontFamily: FONTS.regular,
    color: COLORS.textSecondary,
    marginBottom: SPACING.xs,
  },
  memberSince: {
    fontSize: FONT_SIZES.sm,
    fontFamily: FONTS.regular,
    color: COLORS.textSecondary,
  },
  editButton: {
    padding: SPACING.sm,
  },
  statsCard: {
    marginBottom: SPACING.md,
    padding: SPACING.md,
  },
  statsTitle: {
    fontSize: FONT_SIZES.lg,
    fontFamily: FONTS.bold,
    color: COLORS.textPrimary,
    marginBottom: SPACING.md,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statIcon: {
    width: 48,
    height: 48,
    borderRadius: BORDER_RADIUS.full,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  statNumber: {
    fontSize: FONT_SIZES.xl,
    fontFamily: FONTS.bold,
    color: COLORS.textPrimary,
    marginBottom: SPACING.xs,
  },
  statLabel: {
    fontSize: FONT_SIZES.sm,
    fontFamily: FONTS.regular,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  menuSection: {
    marginBottom: SPACING.lg,
  },
  sectionTitle: {
    fontSize: FONT_SIZES.lg,
    fontFamily: FONTS.bold,
    color: COLORS.textPrimary,
    marginBottom: SPACING.sm,
  },
  menuCard: {
    padding: 0,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.md,
  },
  menuItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray200,
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  menuItemText: {
    fontSize: FONT_SIZES.md,
    fontFamily: FONTS.medium,
    color: COLORS.textPrimary,
    marginLeft: SPACING.md,
  },
  menuItemRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  bottomSpacing: {
    height: SPACING.xl,
  },
});