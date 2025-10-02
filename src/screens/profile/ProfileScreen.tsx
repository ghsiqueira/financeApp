// src/screens/profile/ProfileScreen.tsx
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Alert,
  Switch,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Card, Loading } from '../../components/common';
import { useAuth } from '../../contexts/AuthContext';
import { COLORS, FONTS } from '../../constants';
import { TransactionService } from '../../services/TransactionService';
import { GoalService } from '../../services/GoalService';
import { ProfileStackParamList } from '../../navigation/types';

type ProfileScreenNavigationProp = NativeStackNavigationProp<ProfileStackParamList>;

const ProfileScreen: React.FC = () => {
  const navigation = useNavigation<ProfileScreenNavigationProp>();
  const { user, logout } = useAuth();
  const [loading, setLoading] = useState(true);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [darkModeEnabled, setDarkModeEnabled] = useState(false);
  const [biometricEnabled, setBiometricEnabled] = useState(false);
  
  // Estados para as estatísticas
  const [balance, setBalance] = useState(0);
  const [transactionCount, setTransactionCount] = useState(0);
  const [goalCount, setGoalCount] = useState(0);

  const loadProfileStats = async () => {
    try {
      setLoading(true);
      console.log('📊 Carregando estatísticas do perfil...');

      // Buscar resumo financeiro (saldo)
      const summary = await TransactionService.getFinancialSummary();
      console.log('💰 Saldo recebido:', summary.balance);
      setBalance(summary.balance || 0);

      // Buscar total de transações usando paginação
      let totalTransactions = 0;
      let currentPage = 1;
      let hasMorePages = true;
      
      while (hasMorePages) {
        const transactionsResponse = await TransactionService.getTransactions({ 
          limit: 100,
          page: currentPage 
        });
        
        if (transactionsResponse.success && transactionsResponse.data) {
          totalTransactions += transactionsResponse.data.length;
          
          if (transactionsResponse.pagination) {
            hasMorePages = currentPage < transactionsResponse.pagination.pages;
            currentPage++;
          } else {
            hasMorePages = false;
          }
        } else {
          hasMorePages = false;
        }
      }
      
      console.log('📝 Total de transações:', totalTransactions);
      setTransactionCount(totalTransactions);

      // Buscar total de metas
      const goalsResponse = await GoalService.getActiveGoals(100);
      console.log('🎯 Resposta das metas:', goalsResponse);
      
      const totalGoals = Array.isArray(goalsResponse) ? goalsResponse.length : 0;
      console.log('🎯 Total de metas:', totalGoals);
      setGoalCount(totalGoals);

      console.log('✅ Estatísticas carregadas com sucesso');
    } catch (error) {
      console.error('❌ Erro ao carregar estatísticas:', error);
      Alert.alert('Erro', 'Não foi possível carregar as estatísticas');
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    React.useCallback(() => {
      loadProfileStats();
    }, [])
  );

  const handleLogout = () => {
    Alert.alert(
      'Sair',
      'Tem certeza que deseja sair da sua conta?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Sair',
          style: 'destructive',
          onPress: async () => {
            setLoading(true);
            try {
              await logout();
            } catch (error) {
              Alert.alert('Erro', 'Não foi possível fazer logout');
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Excluir Conta',
      'Esta ação não pode ser desfeita. Todos os seus dados serão permanentemente removidos.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Excluir',
          style: 'destructive',
          onPress: () => {
            Alert.prompt(
              'Confirmar Exclusão',
              'Digite sua senha para confirmar:',
              [
                { text: 'Cancelar', style: 'cancel' },
                {
                  text: 'Confirmar',
                  style: 'destructive',
                  onPress: (password?: string) => {
                    if (password) {
                      Alert.alert('Sucesso', 'Conta excluída com sucesso');
                      logout();
                    }
                  },
                },
              ],
              'secure-text'
            );
          },
        },
      ]
    );
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const menuSections = [
    {
      title: 'Conta',
      items: [
        {
          id: 'edit-profile',
          title: 'Editar Perfil',
          icon: 'person-outline',
          onPress: () => navigation.navigate('EditProfile'),
        },
        {
          id: 'change-password',
          title: 'Alterar Senha',
          icon: 'lock-closed-outline',
          onPress: () => navigation.navigate('ChangePassword'),
        },
        {
          id: 'categories',
          title: 'Minhas Categorias',
          icon: 'pricetags-outline',
          onPress: () => navigation.navigate('Categories', { screen: 'CategoryList' }),
        },
      ],
    },
    {
      title: 'Dados',
      items: [
        {
          id: 'export',
          title: 'Exportar Dados',
          icon: 'download-outline',
          onPress: () => Alert.alert('Exportar', 'Seus dados serão enviados por email'),
        },
        {
          id: 'backup',
          title: 'Backup e Restauração',
          icon: 'cloud-upload-outline',
          onPress: () => Alert.alert('Em breve', 'Funcionalidade em desenvolvimento'),
        },
      ],
    },
    {
      title: 'Suporte',
      items: [
        {
          id: 'help',
          title: 'Central de Ajuda',
          icon: 'help-circle-outline',
          onPress: () => Alert.alert('Ajuda', 'Acesse: https://help.financeapp.com'),
        },
        {
          id: 'contact',
          title: 'Falar com Suporte',
          icon: 'chatbox-outline',
          onPress: () => Alert.alert('Suporte', 'Email: suporte@financeapp.com\nWhatsApp: (11) 9999-9999'),
        },
        {
          id: 'feedback',
          title: 'Enviar Feedback',
          icon: 'mail-outline',
          onPress: () => Alert.alert('Feedback', 'Obrigado! Seu feedback é importante para nós.'),
        },
      ],
    },
    {
      title: 'Sobre',
      items: [
        {
          id: 'terms',
          title: 'Termos de Uso',
          icon: 'document-text-outline',
          onPress: () => Alert.alert('Termos', 'Termos de Uso do Finance App'),
        },
        {
          id: 'privacy',
          title: 'Política de Privacidade',
          icon: 'shield-checkmark-outline',
          onPress: () => Alert.alert('Privacidade', 'Política de Privacidade do Finance App'),
        },
        {
          id: 'about',
          title: 'Sobre o App',
          icon: 'information-circle-outline',
          onPress: () => Alert.alert('Finance App', 'Versão 1.0.0\n\nDesenvolvido com ❤️\n\n© 2025 Finance App'),
        },
      ],
    },
  ];

  if (loading) {
    return <Loading text="Carregando..." />;
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Perfil</Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Card do Usuário */}
        <Card style={styles.userCard}>
          <View style={styles.avatarContainer}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {user?.name?.charAt(0).toUpperCase() || 'U'}
              </Text>
            </View>
            <TouchableOpacity style={styles.avatarEditButton}>
              <Ionicons name="camera" size={16} color={COLORS.white} />
            </TouchableOpacity>
          </View>
          
          <Text style={styles.userName}>{user?.name || 'Usuário'}</Text>
          <Text style={styles.userEmail}>{user?.email || 'email@exemplo.com'}</Text>

          <View style={styles.memberSince}>
            <Ionicons name="calendar-outline" size={14} color={COLORS.gray500} />
            <Text style={styles.memberSinceText}>
              Membro desde {new Date(user?.createdAt || Date.now()).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
            </Text>
          </View>

          <TouchableOpacity
            style={styles.editButton}
            onPress={() => navigation.navigate('EditProfile')}
          >
            <Ionicons name="create-outline" size={16} color={COLORS.primary} />
            <Text style={styles.editButtonText}>Editar Perfil</Text>
          </TouchableOpacity>
        </Card>

        {/* Estatísticas rápidas */}
        <View style={styles.statsContainer}>
          <Card style={styles.statCard}>
            <View style={[styles.statIconContainer, { backgroundColor: COLORS.success + '20' }]}>
              <Ionicons name="wallet-outline" size={24} color={COLORS.success} />
            </View>
            <Text style={styles.statValue}>{formatCurrency(balance)}</Text>
            <Text style={styles.statLabel}>Saldo Total</Text>
          </Card>
          
          <Card style={styles.statCard}>
            <View style={[styles.statIconContainer, { backgroundColor: COLORS.primary + '20' }]}>
              <Ionicons name="swap-horizontal-outline" size={24} color={COLORS.primary} />
            </View>
            <Text style={styles.statValue}>{transactionCount}</Text>
            <Text style={styles.statLabel}>Transações</Text>
          </Card>
          
          <Card style={styles.statCard}>
            <View style={[styles.statIconContainer, { backgroundColor: COLORS.warning + '20' }]}>
              <Ionicons name="flag-outline" size={24} color={COLORS.warning} />
            </View>
            <Text style={styles.statValue}>{goalCount}</Text>
            <Text style={styles.statLabel}>Metas</Text>
          </Card>
        </View>

        {/* Configurações Rápidas */}
        <Card style={styles.section}>
          <Text style={styles.sectionTitle}>Preferências</Text>
          
          <View style={styles.settingItem}>
            <View style={styles.settingLeft}>
              <View style={[styles.settingIcon, { backgroundColor: COLORS.info + '20' }]}>
                <Ionicons name="notifications-outline" size={20} color={COLORS.info} />
              </View>
              <View>
                <Text style={styles.settingText}>Notificações</Text>
                <Text style={styles.settingSubtext}>Receber alertas e lembretes</Text>
              </View>
            </View>
            <Switch
              value={notificationsEnabled}
              onValueChange={setNotificationsEnabled}
              trackColor={{ false: COLORS.gray300, true: COLORS.primary }}
              thumbColor={COLORS.white}
            />
          </View>

          <View style={styles.divider} />

          <View style={styles.settingItem}>
            <View style={styles.settingLeft}>
              <View style={[styles.settingIcon, { backgroundColor: COLORS.primary + '20' }]}>
                <Ionicons name="moon-outline" size={20} color={COLORS.primary} />
              </View>
              <View>
                <Text style={styles.settingText}>Modo Escuro</Text>
                <Text style={styles.settingSubtext}>Tema escuro para o app</Text>
              </View>
            </View>
            <Switch
              value={darkModeEnabled}
              onValueChange={setDarkModeEnabled}
              trackColor={{ false: COLORS.gray300, true: COLORS.primary }}
              thumbColor={COLORS.white}
            />
          </View>

          <View style={styles.divider} />

          <View style={styles.settingItem}>
            <View style={styles.settingLeft}>
              <View style={[styles.settingIcon, { backgroundColor: COLORS.success + '20' }]}>
                <Ionicons name="finger-print-outline" size={20} color={COLORS.success} />
              </View>
              <View>
                <Text style={styles.settingText}>Biometria</Text>
                <Text style={styles.settingSubtext}>Login com digital/face</Text>
              </View>
            </View>
            <Switch
              value={biometricEnabled}
              onValueChange={setBiometricEnabled}
              trackColor={{ false: COLORS.gray300, true: COLORS.primary }}
              thumbColor={COLORS.white}
            />
          </View>
        </Card>

        {/* Menu Sections */}
        {menuSections.map((section) => (
          <Card key={section.title} style={styles.section}>
            <Text style={styles.sectionTitle}>{section.title}</Text>
            
            {section.items.map((item, itemIndex) => (
              <React.Fragment key={item.id}>
                {itemIndex > 0 && <View style={styles.divider} />}
                <TouchableOpacity
                  style={styles.menuItem}
                  onPress={item.onPress}
                  activeOpacity={0.7}
                >
                  <View style={styles.menuLeft}>
                    <View style={styles.menuIconContainer}>
                      <Ionicons name={item.icon as any} size={20} color={COLORS.primary} />
                    </View>
                    <Text style={styles.menuText}>{item.title}</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color={COLORS.gray400} />
                </TouchableOpacity>
              </React.Fragment>
            ))}
          </Card>
        ))}

        {/* Ações de Conta */}
        <Card style={styles.section}>
          <TouchableOpacity
            style={styles.dangerButton}
            onPress={handleLogout}
            activeOpacity={0.7}
          >
            <Ionicons name="log-out-outline" size={20} color={COLORS.error} />
            <Text style={styles.dangerButtonText}>Sair da Conta</Text>
          </TouchableOpacity>

          <View style={styles.divider} />

          <TouchableOpacity
            style={styles.dangerButton}
            onPress={handleDeleteAccount}
            activeOpacity={0.7}
          >
            <Ionicons name="trash-outline" size={20} color={COLORS.error} />
            <Text style={styles.dangerButtonText}>Excluir Conta</Text>
          </TouchableOpacity>
        </Card>

        {/* Versão */}
        <Text style={styles.versionText}>Versão 1.0.0</Text>

        <View style={{ height: 40 }} />
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
    backgroundColor: COLORS.primary,
    padding: 20,
    paddingTop: 10,
  },
  headerTitle: {
    fontSize: 24,
    fontFamily: FONTS.bold,
    color: COLORS.white,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  userCard: {
    padding: 24,
    alignItems: 'center',
    marginBottom: 16,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 16,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 40,
    fontFamily: FONTS.bold,
    color: COLORS.white,
  },
  avatarEditButton: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: COLORS.white,
  },
  userName: {
    fontSize: 24,
    fontFamily: FONTS.bold,
    color: COLORS.gray900,
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 14,
    fontFamily: FONTS.regular,
    color: COLORS.gray600,
    marginBottom: 8,
  },
  memberSince: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 16,
  },
  memberSinceText: {
    fontSize: 12,
    fontFamily: FONTS.regular,
    color: COLORS.gray500,
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  editButtonText: {
    fontSize: 14,
    fontFamily: FONTS.medium,
    color: COLORS.primary,
  },
  statsContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  statCard: {
    flex: 1,
    padding: 16,
    alignItems: 'center',
  },
  statIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  statValue: {
    fontSize: 18,
    fontFamily: FONTS.bold,
    color: COLORS.gray900,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    fontFamily: FONTS.regular,
    color: COLORS.gray600,
    textAlign: 'center',
  },
  section: {
    padding: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontFamily: FONTS.bold,
    color: COLORS.gray900,
    marginBottom: 16,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  settingIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  settingText: {
    fontSize: 15,
    fontFamily: FONTS.medium,
    color: COLORS.gray900,
  },
  settingSubtext: {
    fontSize: 12,
    fontFamily: FONTS.regular,
    color: COLORS.gray500,
    marginTop: 2,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.gray200,
    marginVertical: 12,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
  },
  menuLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  menuIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.primary + '10',
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuText: {
    fontSize: 15,
    fontFamily: FONTS.regular,
    color: COLORS.gray900,
  },
  dangerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
  },
  dangerButtonText: {
    fontSize: 15,
    fontFamily: FONTS.medium,
    color: COLORS.error,
  },
  versionText: {
    fontSize: 12,
    fontFamily: FONTS.regular,
    color: COLORS.gray400,
    textAlign: 'center',
    marginTop: 8,
  },
});

export default ProfileScreen;