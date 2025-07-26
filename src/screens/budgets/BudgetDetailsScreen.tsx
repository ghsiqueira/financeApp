// src/screens/budgets/BudgetDetailsScreen.tsx - TELA DE DETALHES COMPLETA
import React, { useState, useEffect } from 'react'
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  RefreshControl,
  Dimensions,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { LinearGradient } from 'expo-linear-gradient'
import { ProgressBar } from 'react-native-paper'

import { useTheme } from '../../context/ThemeContext'
import { useBudgets, Budget } from '../../hooks/useBudgets'
import { useCategories } from '../../hooks/useCategories'
import Button from '../../components/common/Button'
import LoadingSpinner from '../../components/common/LoadingSpinner'

const { width } = Dimensions.get('window')

export default function BudgetDetailsScreen({ navigation, route }: any) {
  const { theme } = useTheme()
  const { budget: routeBudget } = route.params
  const [budget, setBudget] = useState<Budget>(routeBudget)
  const [activeTab, setActiveTab] = useState<'overview' | 'transactions' | 'history'>('overview')

  const { 
    getBudgetById, 
    pauseBudget, 
    reactivateBudget, 
    deleteBudget,
    refresh,
    loading 
  } = useBudgets()
  const { categories } = useCategories('despesa')

  // Atualizar dados do orçamento
  useEffect(() => {
    const updatedBudget = getBudgetById(budget._id)
    if (updatedBudget) {
      setBudget(updatedBudget)
    }
  }, [getBudgetById, budget._id])

  // Funções auxiliares
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    })
  }

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getCategoryName = (categoryId: string) => {
    const category = categories.find(cat => cat._id === categoryId)
    return category?.nome || categoryId
  }

  const getStatusColor = (status: string, porcentagem: number) => {
    if (status === 'pausado') return theme.textSecondary
    if (porcentagem >= 100) return theme.error
    if (porcentagem >= 80) return theme.warning
    return theme.success
  }

  const getProgressColor = (porcentagem: number) => {
    if (porcentagem >= 100) return '#F44336'
    if (porcentagem >= 80) return '#FF9800'
    if (porcentagem >= 60) return '#FFC107'
    return '#4CAF50'
  }

  const getDaysRemainingColor = (days: number) => {
    if (days <= 3) return theme.error
    if (days <= 7) return theme.warning
    return theme.success
  }

  // Ações
  const handleToggleBudget = async () => {
    const action = budget.status === 'ativo' ? 'pausar' : 'reativar'
    
    Alert.alert(
      `${action === 'pausar' ? 'Pausar' : 'Reativar'} Orçamento`,
      `Tem certeza que deseja ${action} o orçamento "${budget.nome}"?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        { 
          text: action === 'pausar' ? 'Pausar' : 'Reativar', 
          style: action === 'pausar' ? 'destructive' : 'default',
          onPress: async () => {
            try {
              if (action === 'pausar') {
                await pauseBudget(budget._id)
              } else {
                await reactivateBudget(budget._id)
              }
              Alert.alert('Sucesso', `Orçamento ${action === 'pausar' ? 'pausado' : 'reativado'} com sucesso!`)
            } catch (error: any) {
              Alert.alert('Erro', error.message || `Erro ao ${action} orçamento`)
            }
          }
        }
      ]
    )
  }

  const handleDeleteBudget = async () => {
    Alert.alert(
      'Excluir Orçamento',
      `Tem certeza que deseja excluir o orçamento "${budget.nome}"?\n\nEsta ação não pode ser desfeita.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        { 
          text: 'Excluir', 
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteBudget(budget._id)
              Alert.alert('Sucesso', 'Orçamento excluído com sucesso!')
              navigation.goBack()
            } catch (error: any) {
              Alert.alert('Erro', error.message || 'Erro ao excluir orçamento')
            }
          }
        }
      ]
    )
  }

  // Componentes de conteúdo
  const renderOverview = () => (
    <View style={styles.tabContent}>
      {/* Estatísticas Principais */}
      <View style={styles.statsGrid}>
        <View style={styles.statCard}>
          <View style={styles.statIcon}>
            <Ionicons name="cash-outline" size={24} color={theme.primary} />
          </View>
          <Text style={styles.statValue}>{formatCurrency(budget.valorGasto)}</Text>
          <Text style={styles.statLabel}>Valor Gasto</Text>
        </View>
        
        <View style={styles.statCard}>
          <View style={styles.statIcon}>
            <Ionicons name="wallet-outline" size={24} color={theme.primary} />
          </View>
          <Text style={styles.statValue}>{formatCurrency(budget.valorLimite)}</Text>
          <Text style={styles.statLabel}>Limite</Text>
        </View>
        
        <View style={styles.statCard}>
          <View style={styles.statIcon}>
            <Ionicons name="trending-down-outline" size={24} color={
              budget.valorRestante >= 0 ? theme.success : theme.error
            } />
          </View>
          <Text style={[
            styles.statValue,
            { color: budget.valorRestante >= 0 ? theme.success : theme.error }
          ]}>
            {formatCurrency(budget.valorRestante)}
          </Text>
          <Text style={styles.statLabel}>Restante</Text>
        </View>
        
        <View style={styles.statCard}>
          <View style={styles.statIcon}>
            <Ionicons name="time-outline" size={24} color={
              getDaysRemainingColor(budget.diasRestantes)
            } />
          </View>
          <Text style={[
            styles.statValue,
            { color: getDaysRemainingColor(budget.diasRestantes) }
          ]}>
            {budget.diasRestantes > 0 ? budget.diasRestantes : 0}
          </Text>
          <Text style={styles.statLabel}>Dias Restantes</Text>
        </View>
      </View>

      {/* Informações Detalhadas */}
      <View style={styles.infoSection}>
        <Text style={styles.sectionTitle}>📋 Informações Gerais</Text>
        
        <View style={styles.infoGrid}>
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>Categoria</Text>
            <Text style={styles.infoValue}>{getCategoryName(budget.categoria)}</Text>
          </View>
          
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>Período</Text>
            <Text style={styles.infoValue}>{budget.periodo}</Text>
          </View>
          
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>Data Início</Text>
            <Text style={styles.infoValue}>{formatDate(budget.dataInicio)}</Text>
          </View>
          
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>Data Fim</Text>
            <Text style={styles.infoValue}>{formatDate(budget.dataFim)}</Text>
          </View>
          
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>Status</Text>
            <View style={styles.statusContainer}>
              <View style={[
                styles.statusDot,
                { backgroundColor: getStatusColor(budget.status, budget.porcentagemGasta) }
              ]} />
              <Text style={[
                styles.infoValue,
                { color: getStatusColor(budget.status, budget.porcentagemGasta) }
              ]}>
                {budget.status.charAt(0).toUpperCase() + budget.status.slice(1)}
              </Text>
            </View>
          </View>
          
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>Renovação Automática</Text>
            <Text style={styles.infoValue}>
              {budget.renovacaoAutomatica ? '✅ Ativa' : '❌ Inativa'}
            </Text>
          </View>
        </View>
      </View>

      {/* Configurações de Alertas */}
      {budget.configuracoes?.alertas && (
        <View style={styles.infoSection}>
          <Text style={styles.sectionTitle}>🔔 Configurações de Alertas</Text>
          
          <View style={styles.alertsInfo}>
            <View style={styles.alertStatus}>
              <Text style={styles.alertLabel}>Status dos Alertas:</Text>
              <Text style={[
                styles.alertValue,
                { color: budget.configuracoes.alertas.ativo ? theme.success : theme.error }
              ]}>
                {budget.configuracoes.alertas.ativo ? 'Ativo' : 'Inativo'}
              </Text>
            </View>
            
            {budget.configuracoes.alertas.ativo && (
              <View style={styles.alertPercentages}>
                <Text style={styles.alertLabel}>Alertar em:</Text>
                <View style={styles.percentagesList}>
                  {budget.configuracoes.alertas.porcentagens.map((percentage, index) => (
                    <View key={percentage} style={styles.percentageChip}>
                      <Text style={styles.percentageText}>{percentage}%</Text>
                    </View>
                  ))}
                </View>
              </View>
            )}
          </View>
        </View>
      )}

      {/* Descrição */}
      {budget.descricao && (
        <View style={styles.infoSection}>
          <Text style={styles.sectionTitle}>📝 Descrição</Text>
          <Text style={styles.descriptionText}>{budget.descricao}</Text>
        </View>
      )}
    </View>
  )

  const renderTransactions = () => (
    <View style={styles.tabContent}>
      {budget.transacoes && budget.transacoes.length > 0 ? (
        <View>
          <Text style={styles.sectionTitle}>💳 Transações Relacionadas</Text>
          
          <View style={styles.transactionsList}>
            {budget.transacoes.map((transacao, index) => (
              <View key={index} style={styles.transactionItem}>
                <View style={styles.transactionIcon}>
                  <Ionicons 
                    name={transacao.tipo === 'receita' ? 'arrow-up' : 'arrow-down'} 
                    size={20} 
                    color={transacao.tipo === 'receita' ? theme.success : theme.error} 
                  />
                </View>
                
                <View style={styles.transactionInfo}>
                  <Text style={styles.transactionDescription}>{transacao.descricao}</Text>
                  <View style={styles.transactionMeta}>
                    <Text style={styles.transactionDate}>{formatDate(transacao.data)}</Text>
                    {transacao.metodoPagamento && (
                      <Text style={styles.transactionMethod}>{transacao.metodoPagamento}</Text>
                    )}
                  </View>
                </View>
                
                <Text style={[
                  styles.transactionValue,
                  { color: transacao.tipo === 'receita' ? theme.success : theme.error }
                ]}>
                  {transacao.tipo === 'receita' ? '+' : '-'}{formatCurrency(transacao.valor)}
                </Text>
              </View>
            ))}
          </View>
        </View>
      ) : (
        <View style={styles.emptyState}>
          <Ionicons name="receipt-outline" size={64} color={theme.textSecondary} />
          <Text style={styles.emptyTitle}>Nenhuma transação</Text>
          <Text style={styles.emptyDescription}>
            As transações relacionadas a esta categoria aparecerão aqui
          </Text>
        </View>
      )}
    </View>
  )

  const renderHistory = () => (
    <View style={styles.tabContent}>
      {budget.historico && budget.historico.length > 0 ? (
        <View>
          <Text style={styles.sectionTitle}>📚 Histórico de Ações</Text>
          
          <View style={styles.historyList}>
            {budget.historico.map((item, index) => (
              <View key={index} style={styles.historyItem}>
                <View style={styles.historyIcon}>
                  <Ionicons 
                    name={getHistoryIcon(item.acao)} 
                    size={20} 
                    color={theme.primary} 
                  />
                </View>
                
                <View style={styles.historyInfo}>
                  <Text style={styles.historyAction}>{getHistoryDescription(item.acao)}</Text>
                  <Text style={styles.historyDate}>{formatDateTime(item.data)}</Text>
                  {item.observacao && (
                    <Text style={styles.historyObservation}>{item.observacao}</Text>
                  )}
                  {item.valor && (
                    <Text style={styles.historyValue}>{formatCurrency(item.valor)}</Text>
                  )}
                </View>
              </View>
            ))}
          </View>
        </View>
      ) : (
        <View style={styles.emptyState}>
          <Ionicons name="time-outline" size={64} color={theme.textSecondary} />
          <Text style={styles.emptyTitle}>Nenhum histórico</Text>
          <Text style={styles.emptyDescription}>
            O histórico de alterações do orçamento aparecerá aqui
          </Text>
        </View>
      )}
    </View>
  )

  const getHistoryIcon = (action: string) => {
    const icons: Record<string, keyof typeof Ionicons.glyphMap> = {
      'criado': 'add-circle',
      'editado': 'create',
      'pausado': 'pause-circle',
      'reativado': 'play-circle',
      'finalizado': 'checkmark-circle',
      'limite_alterado': 'cash',
      'configuracao_alterada': 'settings',
      'renovacao_ativada': 'refresh-circle',
      'renovacao_desativada': 'refresh-circle',
    }
    return icons[action] || 'information-circle'
  }

  const getHistoryDescription = (action: string) => {
    const descriptions: Record<string, string> = {
      'criado': '🎉 Orçamento criado',
      'editado': '✏️ Orçamento editado',
      'pausado': '⏸️ Orçamento pausado',
      'reativado': '▶️ Orçamento reativado',
      'finalizado': '🏁 Orçamento finalizado',
      'limite_alterado': '💰 Limite alterado',
      'configuracao_alterada': '⚙️ Configurações alteradas',
      'renovacao_ativada': '🔄 Renovação automática ativada',
      'renovacao_desativada': '🔄 Renovação automática desativada',
    }
    return descriptions[action] || action
  }

  // Estilos
  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.background,
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 20,
      paddingVertical: 16,
      backgroundColor: theme.surface,
      borderBottomWidth: 1,
      borderBottomColor: theme.border,
    },
    backButton: {
      padding: 4,
    },
    headerTitle: {
      fontSize: 18,
      fontWeight: 'bold',
      color: theme.text,
    },
    moreButton: {
      padding: 4,
    },
    
    // Budget Card
    budgetCard: {
      margin: 20,
      borderRadius: 16,
      overflow: 'hidden',
      elevation: 4,
      shadowColor: theme.shadow,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
    },
    budgetGradient: {
      padding: 20,
    },
    budgetHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 20,
    },
    budgetIconContainer: {
      backgroundColor: 'rgba(255, 255, 255, 0.2)',
      borderRadius: 16,
      width: 48,
      height: 48,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 16,
    },
    budgetHeaderInfo: {
      flex: 1,
    },
    budgetName: {
      fontSize: 20,
      fontWeight: 'bold',
      color: '#FFFFFF',
      marginBottom: 4,
    },
    budgetCategory: {
      fontSize: 14,
      color: '#FFFFFF',
      opacity: 0.9,
    },
    budgetStatusBadge: {
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 12,
    },
    budgetStatusText: {
      fontSize: 12,
      fontWeight: 'bold',
      color: '#FFFFFF',
    },
    progressContainer: {
      marginBottom: 16,
    },
    progressInfo: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 8,
    },
    progressLabel: {
      fontSize: 14,
      color: '#FFFFFF',
      opacity: 0.9,
    },
    progressValue: {
      fontSize: 14,
      fontWeight: 'bold',
      color: '#FFFFFF',
    },
    progressBar: {
      height: 8,
      borderRadius: 4,
      backgroundColor: 'rgba(255, 255, 255, 0.3)',
    },
    budgetValues: {
      flexDirection: 'row',
      justifyContent: 'space-between',
    },
    budgetValueItem: {
      alignItems: 'center',
    },
    budgetValueAmount: {
      fontSize: 16,
      fontWeight: 'bold',
      color: '#FFFFFF',
    },
    budgetValueLabel: {
      fontSize: 12,
      color: '#FFFFFF',
      opacity: 0.9,
      marginTop: 2,
    },
    
    // Tabs
    tabsContainer: {
      flexDirection: 'row',
      backgroundColor: theme.surface,
      borderBottomWidth: 1,
      borderBottomColor: theme.border,
    },
    tab: {
      flex: 1,
      paddingVertical: 16,
      paddingHorizontal: 12,
      alignItems: 'center',
    },
    activeTab: {
      borderBottomWidth: 2,
      borderBottomColor: theme.primary,
    },
    tabText: {
      fontSize: 14,
      color: theme.textSecondary,
      fontWeight: '500',
    },
    activeTabText: {
      color: theme.primary,
      fontWeight: '600',
    },
    
    // Tab Content
    tabContent: {
      flex: 1,
      padding: 20,
    },
    
    // Stats Grid
    statsGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 16,
      marginBottom: 24,
    },
    statCard: {
      backgroundColor: theme.surface,
      borderRadius: 12,
      padding: 16,
      width: (width - 56) / 2,
      alignItems: 'center',
      borderWidth: 1,
      borderColor: theme.border,
    },
    statIcon: {
      marginBottom: 8,
    },
    statValue: {
      fontSize: 18,
      fontWeight: 'bold',
      color: theme.text,
      marginBottom: 4,
    },
    statLabel: {
      fontSize: 12,
      color: theme.textSecondary,
      textAlign: 'center',
    },
    
    // Info Section
    infoSection: {
      marginBottom: 24,
    },
    sectionTitle: {
      fontSize: 16,
      fontWeight: 'bold',
      color: theme.text,
      marginBottom: 16,
    },
    infoGrid: {
      gap: 12,
    },
    infoItem: {
      backgroundColor: theme.surface,
      borderRadius: 12,
      padding: 16,
      borderWidth: 1,
      borderColor: theme.border,
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    infoLabel: {
      fontSize: 14,
      color: theme.textSecondary,
    },
    infoValue: {
      fontSize: 14,
      fontWeight: '600',
      color: theme.text,
    },
    statusContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    statusDot: {
      width: 8,
      height: 8,
      borderRadius: 4,
    },
    
    // Alerts
    alertsInfo: {
      backgroundColor: theme.surface,
      borderRadius: 12,
      padding: 16,
      borderWidth: 1,
      borderColor: theme.border,
    },
    alertStatus: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 12,
    },
    alertLabel: {
      fontSize: 14,
      color: theme.textSecondary,
    },
    alertValue: {
      fontSize: 14,
      fontWeight: '600',
    },
    alertPercentages: {
      gap: 8,
    },
    percentagesList: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
    },
    percentageChip: {
      backgroundColor: theme.primary + '20',
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: theme.primary + '40',
    },
    percentageText: {
      fontSize: 12,
      color: theme.primary,
      fontWeight: '600',
    },
    
    // Description
    descriptionText: {
      fontSize: 14,
      color: theme.text,
      lineHeight: 20,
      backgroundColor: theme.surface,
      borderRadius: 12,
      padding: 16,
      borderWidth: 1,
      borderColor: theme.border,
    },
    
    // Transactions
    transactionsList: {
      gap: 12,
    },
    transactionItem: {
      backgroundColor: theme.surface,
      borderRadius: 12,
      padding: 16,
      borderWidth: 1,
      borderColor: theme.border,
      flexDirection: 'row',
      alignItems: 'center',
    },
    transactionIcon: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: theme.background,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 12,
    },
    transactionInfo: {
      flex: 1,
    },
    transactionDescription: {
      fontSize: 14,
      fontWeight: '600',
      color: theme.text,
      marginBottom: 4,
    },
    transactionMeta: {
      flexDirection: 'row',
      gap: 12,
    },
    transactionDate: {
      fontSize: 12,
      color: theme.textSecondary,
    },
    transactionMethod: {
      fontSize: 12,
      color: theme.textSecondary,
    },
    transactionValue: {
      fontSize: 16,
      fontWeight: 'bold',
    },
    
    // History
    historyList: {
      gap: 12,
    },
    historyItem: {
      backgroundColor: theme.surface,
      borderRadius: 12,
      padding: 16,
      borderWidth: 1,
      borderColor: theme.border,
      flexDirection: 'row',
      alignItems: 'flex-start',
    },
    historyIcon: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: theme.primary + '20',
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 12,
    },
    historyInfo: {
      flex: 1,
    },
    historyAction: {
      fontSize: 14,
      fontWeight: '600',
      color: theme.text,
      marginBottom: 4,
    },
    historyDate: {
      fontSize: 12,
      color: theme.textSecondary,
      marginBottom: 4,
    },
    historyObservation: {
      fontSize: 12,
      color: theme.text,
      fontStyle: 'italic',
      marginBottom: 4,
    },
    historyValue: {
      fontSize: 12,
      color: theme.primary,
      fontWeight: '600',
    },
    
    // Actions
    actionsContainer: {
      flexDirection: 'row',
      gap: 12,
      padding: 20,
      backgroundColor: theme.surface,
      borderTopWidth: 1,
      borderTopColor: theme.border,
    },
    actionButton: {
      flex: 1,
      marginHorizontal: 0,
    },
    
    // Empty States
    emptyState: {
      alignItems: 'center',
      justifyContent: 'center',
      padding: 40,
    },
    emptyTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: theme.text,
      marginTop: 16,
      marginBottom: 8,
    },
    emptyDescription: {
      fontSize: 14,
      color: theme.textSecondary,
      textAlign: 'center',
      lineHeight: 20,
    },
    
    // Loading
    loadingContainer: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
    },
  })

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <LoadingSpinner />
          <Text style={{ color: theme.textSecondary, marginTop: 16 }}>
            Carregando detalhes...
          </Text>
        </View>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color={theme.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Detalhes do Orçamento</Text>
        <TouchableOpacity 
          style={styles.moreButton}
          onPress={() => navigation.navigate('AddBudget', { budget })}
        >
          <Ionicons name="create-outline" size={24} color={theme.primary} />
        </TouchableOpacity>
      </View>

      {/* Budget Card */}
      <View style={styles.budgetCard}>
        <LinearGradient
          colors={[budget.cor, budget.cor + 'DD']}
          style={styles.budgetGradient}
        >
          <View style={styles.budgetHeader}>
            <View style={styles.budgetIconContainer}>
              <Ionicons name={budget.icone as any} size={24} color="#FFFFFF" />
            </View>
            <View style={styles.budgetHeaderInfo}>
              <Text style={styles.budgetName}>{budget.nome}</Text>
              <Text style={styles.budgetCategory}>{getCategoryName(budget.categoria)}</Text>
            </View>
            <View style={[
              styles.budgetStatusBadge,
              { backgroundColor: getStatusColor(budget.status, budget.porcentagemGasta) }
            ]}>
              <Text style={styles.budgetStatusText}>
                {budget.status.toUpperCase()}
              </Text>
            </View>
          </View>

          <View style={styles.progressContainer}>
            <View style={styles.progressInfo}>
              <Text style={styles.progressLabel}>Progresso do Orçamento</Text>
              <Text style={styles.progressValue}>
                {budget.porcentagemGasta.toFixed(1)}%
              </Text>
            </View>
            <ProgressBar
              progress={Math.min(budget.porcentagemGasta / 100, 1)}
              color={getProgressColor(budget.porcentagemGasta)}
              style={styles.progressBar}
            />
          </View>

          <View style={styles.budgetValues}>
            <View style={styles.budgetValueItem}>
              <Text style={styles.budgetValueAmount}>{formatCurrency(budget.valorGasto)}</Text>
              <Text style={styles.budgetValueLabel}>Gasto</Text>
            </View>
            <View style={styles.budgetValueItem}>
              <Text style={styles.budgetValueAmount}>{formatCurrency(budget.valorLimite)}</Text>
              <Text style={styles.budgetValueLabel}>Limite</Text>
            </View>
            <View style={styles.budgetValueItem}>
              <Text style={[
                styles.budgetValueAmount,
                { color: budget.valorRestante >= 0 ? '#4CAF50' : '#F44336' }
              ]}>
                {formatCurrency(budget.valorRestante)}
              </Text>
              <Text style={styles.budgetValueLabel}>Restante</Text>
            </View>
          </View>
        </LinearGradient>
      </View>

      {/* Tabs */}
      <View style={styles.tabsContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'overview' && styles.activeTab]}
          onPress={() => setActiveTab('overview')}
        >
          <Text style={[styles.tabText, activeTab === 'overview' && styles.activeTabText]}>
            Visão Geral
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.tab, activeTab === 'transactions' && styles.activeTab]}
          onPress={() => setActiveTab('transactions')}
        >
          <Text style={[styles.tabText, activeTab === 'transactions' && styles.activeTabText]}>
            Transações
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.tab, activeTab === 'history' && styles.activeTab]}
          onPress={() => setActiveTab('history')}
        >
          <Text style={[styles.tabText, activeTab === 'history' && styles.activeTabText]}>
            Histórico
          </Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      <ScrollView 
        style={{ flex: 1 }}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={refresh} />
        }
      >
        {activeTab === 'overview' && renderOverview()}
        {activeTab === 'transactions' && renderTransactions()}
        {activeTab === 'history' && renderHistory()}
      </ScrollView>

      {/* Action Buttons */}
      <View style={styles.actionsContainer}>
        <Button
          title={budget.status === 'ativo' ? 'Pausar' : 'Reativar'}
          onPress={handleToggleBudget}
          variant="secondary"
          style={styles.actionButton}
        />
        
        <Button
          title="Editar"
          onPress={() => navigation.navigate('AddBudget', { budget })}
          style={styles.actionButton}
        />
        
        <Button
          title="Excluir"
          onPress={handleDeleteBudget}
          variant="danger"
          style={styles.actionButton}
        />
      </View>
    </SafeAreaView>
  )
}