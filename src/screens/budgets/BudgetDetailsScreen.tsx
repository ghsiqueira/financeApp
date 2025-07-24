// src/screens/budgets/BudgetDetailsScreen.tsx
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
import { useApi, useMutation } from '../../hooks/useApi'
import Button from '../../components/common/Button'
import LoadingSpinner from '../../components/common/LoadingSpinner'

// 🆕 IMPORTAR O COMPONENTE DE RENOVAÇÃO
import BudgetRenewalSettings from '../../components/budgets/BudgetRenewalSettings'

const { width } = Dimensions.get('window')

interface Transaction {
  _id: string
  descricao: string
  valor: number
  data: string
  tipo: 'receita' | 'despesa'
  categoria: string
  metodoPagamento?: string
}

interface Budget {
  _id: string
  nome: string
  categoria: string
  valorLimite: number
  valorGasto: number
  periodo: string
  dataInicio: string
  dataFim: string
  status: 'ativo' | 'pausado' | 'finalizado' | 'excedido'
  cor: string
  icone: string
  porcentagemGasta: number
  valorRestante: number
  diasRestantes: number
  renovacaoAutomatica: boolean
  ultimaRenovacao?: string
  configuracoes?: {
    alertas?: {
      ativo: boolean
      porcentagens: number[]
    }
    renovacao?: {
      rollover?: boolean
      ajusteAutomatico?: boolean
      percentualAjuste?: number
      notificarRenovacao?: boolean
    }
  }
  estatisticasRenovacao?: {
    totalRenovacoes: number
    mediaGastosPorPeriodo: number
    melhorPerformance?: {
      porcentagem: number
      periodo: string
    }
    piorPerformance?: {
      porcentagem: number
      periodo: string
    }
  }
  transacoes?: Transaction[]
  historico?: Array<{
    data: string
    acao: string
    valor?: number
    observacao?: string
  }>
}

export default function BudgetDetailsScreen({ navigation, route }: any) {
  const { budgetId } = route.params
  const { theme } = useTheme()
  const [budget, setBudget] = useState<Budget | null>(null)
  const [activeTab, setActiveTab] = useState<'overview' | 'transactions' | 'renewal' | 'history'>('overview')

  const { 
    data: budgetResponse, 
    loading, 
    error, 
    refresh 
  } = useApi<any>(`/budgets/${budgetId}`)

  const { mutate: updateBudget } = useMutation()

  useEffect(() => {
    if (budgetResponse?.data) {
      setBudget(budgetResponse.data)
    }
  }, [budgetResponse])

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

  const getStatusColor = () => {
    if (!budget) return theme.text
    if (budget.status === 'pausado') return theme.textSecondary
    if (budget.porcentagemGasta >= 100) return theme.error
    if (budget.porcentagemGasta >= 80) return theme.warning
    return theme.success
  }

  const getStatusText = () => {
    if (!budget) return ''
    if (budget.status === 'pausado') return 'Pausado'
    if (budget.porcentagemGasta >= 100) return 'Excedido'
    if (budget.porcentagemGasta >= 90) return 'Crítico'
    if (budget.porcentagemGasta >= 80) return 'Atenção'
    return 'No controle'
  }

  const handleBudgetUpdate = (updatedBudget: Budget) => {
    setBudget(updatedBudget)
  }

  const handlePauseBudget = async () => {
    if (!budget) return

    const action = budget.status === 'ativo' ? 'pausar' : 'reativar'
    
    Alert.alert(
      `${action === 'pausar' ? 'Pausar' : 'Reativar'} Orçamento`,
      `Tem certeza que deseja ${action} este orçamento?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        { 
          text: action === 'pausar' ? 'Pausar' : 'Reativar', 
          style: action === 'pausar' ? 'destructive' : 'default',
          onPress: async () => {
            try {
              await updateBudget('put', `/budgets/${budget._id}/${action}`)
              refresh()
            } catch (error: any) {
              Alert.alert('Erro', error.message || `Erro ao ${action} orçamento`)
            }
          }
        }
      ]
    )
  }

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.background,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 20,
      paddingVertical: 16,
      borderBottomWidth: 1,
      borderBottomColor: theme.border,
    },
    backButton: {
      padding: 8,
    },
    headerTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: theme.text,
      flex: 1,
      textAlign: 'center',
      marginRight: 40,
    },
    budgetCard: {
      margin: 20,
      borderRadius: 16,
      overflow: 'hidden',
    },
    budgetGradient: {
      padding: 24,
    },
    budgetHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 16,
    },
    budgetName: {
      fontSize: 24,
      fontWeight: '700',
      color: '#FFFFFF',
      flex: 1,
    },
    budgetIcon: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: 'rgba(255, 255, 255, 0.2)',
      alignItems: 'center',
      justifyContent: 'center',
    },
    progressContainer: {
      marginBottom: 16,
    },
    progressBar: {
      height: 8,
      borderRadius: 4,
    },
    progressLabels: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginTop: 8,
    },
    progressText: {
      fontSize: 14,
      color: '#FFFFFF',
      fontWeight: '600',
    },
    budgetStats: {
      flexDirection: 'row',
      justifyContent: 'space-between',
    },
    statItem: {
      alignItems: 'center',
    },
    statValue: {
      fontSize: 18,
      fontWeight: '700',
      color: '#FFFFFF',
    },
    statLabel: {
      fontSize: 12,
      color: 'rgba(255, 255, 255, 0.8)',
      marginTop: 4,
    },
    tabsContainer: {
      flexDirection: 'row',
      backgroundColor: theme.surface,
      marginHorizontal: 20,
      borderRadius: 12,
      padding: 4,
    },
    tab: {
      flex: 1,
      paddingVertical: 12,
      alignItems: 'center',
      borderRadius: 8,
    },
    activeTab: {
      backgroundColor: theme.primary,
    },
    tabText: {
      fontSize: 12,
      fontWeight: '600',
      color: theme.textSecondary,
    },
    activeTabText: {
      color: '#FFFFFF',
    },
    content: {
      flex: 1,
    },
    // Estilos para aba Overview
    overviewSection: {
      margin: 20,
      backgroundColor: theme.surface,
      borderRadius: 12,
      padding: 16,
    },
    sectionTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: theme.text,
      marginBottom: 12,
    },
    infoRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      paddingVertical: 8,
      borderBottomWidth: 1,
      borderBottomColor: theme.border,
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
    statusBadge: {
      paddingHorizontal: 12,
      paddingVertical: 4,
      borderRadius: 12,
      alignSelf: 'flex-start',
    },
    statusText: {
      fontSize: 12,
      fontWeight: '600',
      color: '#FFFFFF',
    },
    // Estilos para transações
    transactionItem: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 16,
      backgroundColor: theme.surface,
      marginHorizontal: 20,
      marginBottom: 8,
      borderRadius: 12,
    },
    transactionIcon: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: theme.primary + '20',
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 12,
    },
    transactionDetails: {
      flex: 1,
    },
    transactionDescription: {
      fontSize: 14,
      fontWeight: '600',
      color: theme.text,
    },
    transactionDate: {
      fontSize: 12,
      color: theme.textSecondary,
      marginTop: 2,
    },
    transactionValue: {
      fontSize: 16,
      fontWeight: '700',
      color: theme.error,
    },
    // Estilos para histórico
    historyItem: {
      padding: 16,
      backgroundColor: theme.surface,
      marginHorizontal: 20,
      marginBottom: 8,
      borderRadius: 12,
    },
    historyAction: {
      fontSize: 14,
      fontWeight: '600',
      color: theme.text,
    },
    historyDate: {
      fontSize: 12,
      color: theme.textSecondary,
      marginTop: 4,
    },
    historyObservation: {
      fontSize: 12,
      color: theme.textSecondary,
      marginTop: 4,
      fontStyle: 'italic',
    },
    actionButtons: {
      flexDirection: 'row',
      gap: 12,
      margin: 20,
    },
    button: {
      flex: 1,
    },
    emptyState: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      padding: 40,
    },
    emptyIcon: {
      marginBottom: 16,
    },
    emptyTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: theme.text,
      marginBottom: 8,
    },
    emptyDescription: {
      fontSize: 14,
      color: theme.textSecondary,
      textAlign: 'center',
    },
  })

  if (loading && !budget) {
    return (
      <SafeAreaView style={styles.container}>
        <LoadingSpinner />
      </SafeAreaView>
    )
  }

  if (error || !budget) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.emptyState}>
          <Ionicons name="alert-circle" size={64} color={theme.error} style={styles.emptyIcon} />
          <Text style={styles.emptyTitle}>Erro ao carregar orçamento</Text>
          <Text style={styles.emptyDescription}>
            {error || 'Orçamento não encontrado'}
          </Text>
          <Button
            title="Tentar novamente"
            onPress={refresh}
            style={{ marginTop: 20 }}
          />
        </View>
      </SafeAreaView>
    )
  }

  const renderOverview = () => (
    <ScrollView
      style={styles.content}
      refreshControl={<RefreshControl refreshing={loading} onRefresh={refresh} />}
    >
      <View style={styles.overviewSection}>
        <Text style={styles.sectionTitle}>Informações Gerais</Text>
        
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Período</Text>
          <Text style={styles.infoValue}>{budget.periodo}</Text>
        </View>
        
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Data Início</Text>
          <Text style={styles.infoValue}>{formatDate(budget.dataInicio)}</Text>
        </View>
        
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Data Fim</Text>
          <Text style={styles.infoValue}>{formatDate(budget.dataFim)}</Text>
        </View>
        
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Dias Restantes</Text>
          <Text style={styles.infoValue}>{budget.diasRestantes} dias</Text>
        </View>
        
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Status</Text>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor() }]}>
            <Text style={styles.statusText}>{getStatusText()}</Text>
          </View>
        </View>

        {budget.ultimaRenovacao && (
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Última Renovação</Text>
            <Text style={styles.infoValue}>{formatDate(budget.ultimaRenovacao)}</Text>
          </View>
        )}
      </View>

      {/* Estatísticas de Renovação */}
      {budget.estatisticasRenovacao && budget.estatisticasRenovacao.totalRenovacoes > 0 && (
        <View style={styles.overviewSection}>
          <Text style={styles.sectionTitle}>📊 Histórico de Performance</Text>
          
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Total de Renovações</Text>
            <Text style={styles.infoValue}>{budget.estatisticasRenovacao.totalRenovacoes}</Text>
          </View>
          
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Média de Gastos</Text>
            <Text style={styles.infoValue}>
              {formatCurrency(budget.estatisticasRenovacao.mediaGastosPorPeriodo)}
            </Text>
          </View>
          
          {budget.estatisticasRenovacao.melhorPerformance && (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Melhor Performance</Text>
              <Text style={[styles.infoValue, { color: theme.success }]}>
                {budget.estatisticasRenovacao.melhorPerformance.porcentagem}%
              </Text>
            </View>
          )}
          
          {budget.estatisticasRenovacao.piorPerformance && (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Maior Gasto</Text>
              <Text style={[styles.infoValue, { color: theme.warning }]}>
                {budget.estatisticasRenovacao.piorPerformance.porcentagem}%
              </Text>
            </View>
          )}
        </View>
      )}
    </ScrollView>
  )

  const renderTransactions = () => (
    <ScrollView
      style={styles.content}
      refreshControl={<RefreshControl refreshing={loading} onRefresh={refresh} />}
    >
      {budget.transacoes && budget.transacoes.length > 0 ? (
        budget.transacoes.map((transaction) => (
          <View key={transaction._id} style={styles.transactionItem}>
            <View style={styles.transactionIcon}>
              <Ionicons 
                name={transaction.tipo === 'receita' ? 'add' : 'remove'} 
                size={20} 
                color={theme.primary} 
              />
            </View>
            <View style={styles.transactionDetails}>
              <Text style={styles.transactionDescription}>{transaction.descricao}</Text>
              <Text style={styles.transactionDate}>{formatDate(transaction.data)}</Text>
              {transaction.metodoPagamento && (
                <Text style={styles.transactionDate}>{transaction.metodoPagamento}</Text>
              )}
            </View>
            <Text style={[
              styles.transactionValue,
              { color: transaction.tipo === 'receita' ? theme.success : theme.error }
            ]}>
              {transaction.tipo === 'receita' ? '+' : '-'}{formatCurrency(transaction.valor)}
            </Text>
          </View>
        ))
      ) : (
        <View style={styles.emptyState}>
          <Ionicons name="receipt-outline" size={64} color={theme.textSecondary} style={styles.emptyIcon} />
          <Text style={styles.emptyTitle}>Nenhuma transação</Text>
          <Text style={styles.emptyDescription}>
            Ainda não há transações vinculadas a este orçamento
          </Text>
        </View>
      )}
    </ScrollView>
  )

  // 🆕 RENDERIZAR ABA DE RENOVAÇÃO
  const renderRenewal = () => (
    <ScrollView
      style={styles.content}
      refreshControl={<RefreshControl refreshing={loading} onRefresh={refresh} />}
    >
      <BudgetRenewalSettings 
        budget={budget} 
        onUpdate={handleBudgetUpdate} 
      />
    </ScrollView>
  )

  const renderHistory = () => (
    <ScrollView
      style={styles.content}
      refreshControl={<RefreshControl refreshing={loading} onRefresh={refresh} />}
    >
      {budget.historico && budget.historico.length > 0 ? (
        budget.historico
          .sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime())
          .map((item, index) => (
            <View key={index} style={styles.historyItem}>
              <Text style={styles.historyAction}>
                {getActionText(item.acao)}
                {item.valor && ` - ${formatCurrency(item.valor)}`}
              </Text>
              <Text style={styles.historyDate}>{formatDate(item.data)}</Text>
              {item.observacao && (
                <Text style={styles.historyObservation}>{item.observacao}</Text>
              )}
            </View>
          ))
      ) : (
        <View style={styles.emptyState}>
          <Ionicons name="time-outline" size={64} color={theme.textSecondary} style={styles.emptyIcon} />
          <Text style={styles.emptyTitle}>Nenhum histórico</Text>
          <Text style={styles.emptyDescription}>
            O histórico de ações aparecerá aqui
          </Text>
        </View>
      )}
    </ScrollView>
  )

  const getActionText = (action: string) => {
    const actions: Record<string, string> = {
      'criado': '🆕 Orçamento criado',
      'editado': '✏️ Orçamento editado',
      'pausado': '⏸️ Orçamento pausado',
      'reativado': '▶️ Orçamento reativado',
      'renovado': '🔄 Renovação automática',
      'renovado_manual': '🔄 Renovação manual',
      'finalizado': '🏁 Orçamento finalizado',
      'limite_alterado': '💰 Limite alterado',
      'configuracao_alterada': '⚙️ Configurações alteradas',
      'renovacao_ativada': '🔄 Renovação automática ativada',
      'renovacao_desativada': '🔄 Renovação automática desativada',
    }
    return actions[action] || action
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'overview':
        return renderOverview()
      case 'transactions':
        return renderTransactions()
      case 'renewal': // 🆕 NOVA ABA
        return renderRenewal()
      case 'history':
        return renderHistory()
      default:
        return renderOverview()
    }
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
      </View>

      {/* Budget Card */}
      <View style={styles.budgetCard}>
        <LinearGradient
          colors={[budget.cor, budget.cor + 'CC']}
          style={styles.budgetGradient}
        >
          <View style={styles.budgetHeader}>
            <Text style={styles.budgetName}>{budget.nome}</Text>
            <View style={styles.budgetIcon}>
              <Ionicons name={budget.icone as any} size={24} color="#FFFFFF" />
            </View>
          </View>

          <View style={styles.progressContainer}>
            <ProgressBar
              progress={Math.min(budget.porcentagemGasta / 100, 1)}
              color="#FFFFFF"
              style={styles.progressBar}
            />
            <View style={styles.progressLabels}>
              <Text style={styles.progressText}>{budget.porcentagemGasta}% usado</Text>
              <Text style={styles.progressText}>
                {formatCurrency(budget.valorGasto)} / {formatCurrency(budget.valorLimite)}
              </Text>
            </View>
          </View>

          <View style={styles.budgetStats}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{formatCurrency(budget.valorRestante)}</Text>
              <Text style={styles.statLabel}>Restante</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{budget.diasRestantes}</Text>
              <Text style={styles.statLabel}>Dias</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>
                {budget.renovacaoAutomatica ? '🔄 Auto' : '❌ Manual'}
              </Text>
              <Text style={styles.statLabel}>Renovação</Text>
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
        
        {/* 🆕 NOVA ABA DE RENOVAÇÃO */}
        <TouchableOpacity
          style={[styles.tab, activeTab === 'renewal' && styles.activeTab]}
          onPress={() => setActiveTab('renewal')}
        >
          <Text style={[styles.tabText, activeTab === 'renewal' && styles.activeTabText]}>
            Renovação
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
      {renderContent()}

      {/* Action Buttons */}
      <View style={styles.actionButtons}>
        <Button
          title={budget.status === 'ativo' ? 'Pausar' : 'Reativar'}
          onPress={handlePauseBudget}
          variant="secondary"
          style={styles.button}
        />
        <Button
          title="Editar"
          onPress={() => navigation.navigate('AddBudget', { budget })}
          style={styles.button}
        />
      </View>
    </SafeAreaView>
  )
}