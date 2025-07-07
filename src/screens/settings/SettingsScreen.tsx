import React, { useState } from 'react'
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Switch,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'

import { useTheme } from '../../context/ThemeContext'
import { useAuth } from '../../context/AuthContext'

export default function SettingsScreen({ navigation }: any) {
  const { theme, themeMode, setThemeMode, toggleTheme } = useTheme()
  const { user, signOut } = useAuth()

  const [notifications, setNotifications] = useState({
    push: true,
    email: true,
    budget: true,
    goals: true,
  })

  const handleSignOut = () => {
    Alert.alert(
      'Sair da Conta',
      'Tem certeza que deseja sair?',
      [
        { text: 'Cancelar', style: 'cancel' },
        { 
          text: 'Sair', 
          style: 'destructive',
          onPress: () => signOut()
        }
      ]
    )
  }

  const handleDeleteAccount = () => {
    Alert.alert(
      'Excluir Conta',
      'ATENÇÃO: Esta ação é irreversível! Todos os seus dados serão permanentemente excluídos.',
      [
        { text: 'Cancelar', style: 'cancel' },
        { 
          text: 'Excluir', 
          style: 'destructive',
          onPress: () => {
            // TODO: Implementar exclusão de conta
            console.log('Delete account')
          }
        }
      ]
    )
  }

  const SettingItem = ({ 
    icon, 
    title, 
    subtitle, 
    onPress, 
    rightElement,
    showArrow = true,
    danger = false 
  }: {
    icon: keyof typeof Ionicons.glyphMap
    title: string
    subtitle?: string
    onPress?: () => void
    rightElement?: React.ReactNode
    showArrow?: boolean
    danger?: boolean
  }) => (
    <TouchableOpacity 
      style={styles.settingItem} 
      onPress={onPress}
      disabled={!onPress}
    >
      <View style={[
        styles.settingIcon, 
        { backgroundColor: danger ? theme.error + '20' : theme.primary + '20' }
      ]}>
        <Ionicons 
          name={icon} 
          size={20} 
          color={danger ? theme.error : theme.primary} 
        />
      </View>
      
      <View style={styles.settingContent}>
        <Text style={[
          styles.settingTitle, 
          { color: danger ? theme.error : theme.text }
        ]}>
          {title}
        </Text>
        {subtitle && (
          <Text style={styles.settingSubtitle}>{subtitle}</Text>
        )}
      </View>
      
      {rightElement}
      
      {showArrow && !rightElement && (
        <Ionicons 
          name="chevron-forward" 
          size={20} 
          color={theme.textSecondary} 
        />
      )}
    </TouchableOpacity>
  )

  const SectionHeader = ({ title }: { title: string }) => (
    <Text style={styles.sectionHeader}>{title}</Text>
  )

  const ThemeSelector = () => (
    <View style={styles.themeContainer}>
      {[
        { mode: 'light' as const, label: 'Claro', icon: 'sunny' },
        { mode: 'dark' as const, label: 'Escuro', icon: 'moon' },
        { mode: 'system' as const, label: 'Sistema', icon: 'phone-portrait' },
      ].map((option) => (
        <TouchableOpacity
          key={option.mode}
          style={[
            styles.themeOption,
            themeMode === option.mode && styles.themeOptionActive
          ]}
          onPress={() => setThemeMode(option.mode)}
        >
          <Ionicons 
            name={option.icon as any} 
            size={20} 
            color={themeMode === option.mode ? '#FFFFFF' : theme.primary} 
          />
          <Text style={[
            styles.themeOptionText,
            themeMode === option.mode && styles.themeOptionTextActive
          ]}>
            {option.label}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  )

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.background,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 20,
      paddingVertical: 16,
      borderBottomWidth: 1,
      borderBottomColor: theme.border,
    },
    title: {
      fontSize: 24,
      fontWeight: 'bold',
      color: theme.text,
    },
    content: {
      flex: 1,
    },
    userSection: {
      backgroundColor: theme.surface,
      marginHorizontal: 20,
      marginTop: 20,
      borderRadius: 12,
      padding: 20,
      alignItems: 'center',
      borderWidth: 1,
      borderColor: theme.border,
    },
    avatar: {
      width: 80,
      height: 80,
      borderRadius: 40,
      backgroundColor: theme.primary + '20',
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 12,
    },
    avatarText: {
      fontSize: 32,
      fontWeight: 'bold',
      color: theme.primary,
    },
    userName: {
      fontSize: 20,
      fontWeight: 'bold',
      color: theme.text,
      marginBottom: 4,
    },
    userEmail: {
      fontSize: 14,
      color: theme.textSecondary,
    },
    sectionHeader: {
      fontSize: 16,
      fontWeight: '600',
      color: theme.textSecondary,
      marginTop: 32,
      marginBottom: 8,
      marginHorizontal: 20,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    },
    settingItem: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 16,
      paddingHorizontal: 20,
      backgroundColor: theme.surface,
      borderBottomWidth: 1,
      borderBottomColor: theme.border,
    },
    settingIcon: {
      width: 40,
      height: 40,
      borderRadius: 20,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 16,
    },
    settingContent: {
      flex: 1,
    },
    settingTitle: {
      fontSize: 16,
      fontWeight: '500',
      marginBottom: 2,
    },
    settingSubtitle: {
      fontSize: 14,
      color: theme.textSecondary,
    },
    themeContainer: {
      flexDirection: 'row',
      backgroundColor: theme.surface,
      marginHorizontal: 20,
      borderRadius: 12,
      padding: 4,
      marginBottom: 8,
      borderWidth: 1,
      borderColor: theme.border,
    },
    themeOption: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 12,
      borderRadius: 8,
      gap: 8,
    },
    themeOptionActive: {
      backgroundColor: theme.primary,
    },
    themeOptionText: {
      fontSize: 14,
      fontWeight: '500',
      color: theme.text,
    },
    themeOptionTextActive: {
      color: '#FFFFFF',
    },
    version: {
      textAlign: 'center',
      fontSize: 12,
      color: theme.textSecondary,
      marginTop: 20,
      marginBottom: 40,
    },
  })

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Configurações</Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* User Profile Section */}
        <View style={styles.userSection}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {user?.nome?.charAt(0).toUpperCase() || 'U'}
            </Text>
          </View>
          <Text style={styles.userName}>{user?.nome || 'Usuário'}</Text>
          <Text style={styles.userEmail}>{user?.email || 'email@exemplo.com'}</Text>
        </View>

        {/* Account Section */}
        <SectionHeader title="Conta" />
        <View style={{ backgroundColor: theme.surface }}>
          <SettingItem
            icon="person"
            title="Editar Perfil"
            subtitle="Nome, email e outras informações"
            onPress={() => {
              // TODO: Navegar para ProfileScreen
              console.log('Edit profile')
            }}
          />
          <SettingItem
            icon="lock-closed"
            title="Alterar Senha"
            subtitle="Mude sua senha de acesso"
            onPress={() => {
              // TODO: Navegar para ChangePasswordScreen
              console.log('Change password')
            }}
          />
        </View>

        {/* Appearance Section */}
        <SectionHeader title="Aparência" />
        <ThemeSelector />

        {/* Notifications Section */}
        <SectionHeader title="Notificações" />
        <View style={{ backgroundColor: theme.surface }}>
          <SettingItem
            icon="notifications"
            title="Notificações Push"
            subtitle="Receber notificações no dispositivo"
            rightElement={
              <Switch
                value={notifications.push}
                onValueChange={(value) => 
                  setNotifications(prev => ({ ...prev, push: value }))
                }
                trackColor={{ false: theme.border, true: theme.primary + '50' }}
                thumbColor={notifications.push ? theme.primary : theme.textSecondary}
              />
            }
            showArrow={false}
          />
          <SettingItem
            icon="mail"
            title="Notificações por Email"
            subtitle="Receber alertas por email"
            rightElement={
              <Switch
                value={notifications.email}
                onValueChange={(value) => 
                  setNotifications(prev => ({ ...prev, email: value }))
                }
                trackColor={{ false: theme.border, true: theme.primary + '50' }}
                thumbColor={notifications.email ? theme.primary : theme.textSecondary}
              />
            }
            showArrow={false}
          />
          <SettingItem
            icon="wallet"
            title="Alertas de Orçamento"
            subtitle="Avisos quando exceder limites"
            rightElement={
              <Switch
                value={notifications.budget}
                onValueChange={(value) => 
                  setNotifications(prev => ({ ...prev, budget: value }))
                }
                trackColor={{ false: theme.border, true: theme.primary + '50' }}
                thumbColor={notifications.budget ? theme.primary : theme.textSecondary}
              />
            }
            showArrow={false}
          />
          <SettingItem
            icon="trophy"
            title="Alertas de Metas"
            subtitle="Lembretes sobre suas metas"
            rightElement={
              <Switch
                value={notifications.goals}
                onValueChange={(value) => 
                  setNotifications(prev => ({ ...prev, goals: value }))
                }
                trackColor={{ false: theme.border, true: theme.primary + '50' }}
                thumbColor={notifications.goals ? theme.primary : theme.textSecondary}
              />
            }
            showArrow={false}
          />
        </View>

        {/* Data Section */}
        <SectionHeader title="Dados" />
        <View style={{ backgroundColor: theme.surface }}>
          <SettingItem
            icon="download"
            title="Exportar Dados"
            subtitle="Baixar seus dados financeiros"
            onPress={() => {
              // TODO: Implementar exportação
              console.log('Export data')
            }}
          />
          <SettingItem
            icon="cloud-upload"
            title="Importar Dados"
            subtitle="Importar dados de backup"
            onPress={() => {
              // TODO: Implementar importação
              console.log('Import data')
            }}
          />
          <SettingItem
            icon="cloud"
            title="Backup na Nuvem"
            subtitle="Sincronizar com a nuvem"
            onPress={() => {
              // TODO: Implementar backup
              console.log('Cloud backup')
            }}
          />
        </View>

        {/* Support Section */}
        <SectionHeader title="Suporte" />
        <View style={{ backgroundColor: theme.surface }}>
          <SettingItem
            icon="help-circle"
            title="Central de Ajuda"
            subtitle="Tutoriais e perguntas frequentes"
            onPress={() => {
              // TODO: Implementar ajuda
              console.log('Help center')
            }}
          />
          <SettingItem
            icon="chatbubble"
            title="Fale Conosco"
            subtitle="Entre em contato com o suporte"
            onPress={() => {
              // TODO: Implementar contato
              console.log('Contact support')
            }}
          />
          <SettingItem
            icon="star"
            title="Avaliar App"
            subtitle="Deixe sua avaliação na loja"
            onPress={() => {
              // TODO: Implementar avaliação
              console.log('Rate app')
            }}
          />
        </View>

        {/* Account Actions */}
        <SectionHeader title="Conta" />
        <View style={{ backgroundColor: theme.surface }}>
          <SettingItem
            icon="log-out"
            title="Sair da Conta"
            subtitle="Fazer logout do aplicativo"
            onPress={handleSignOut}
            danger={true}
          />
          <SettingItem
            icon="trash"
            title="Excluir Conta"
            subtitle="Remover permanentemente sua conta"
            onPress={handleDeleteAccount}
            danger={true}
          />
        </View>

        {/* Version */}
        <Text style={styles.version}>
          Finance App v1.0.0
        </Text>
      </ScrollView>
    </SafeAreaView>
  )
}