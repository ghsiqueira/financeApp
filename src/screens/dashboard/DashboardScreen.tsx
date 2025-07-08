import React, { useState, useEffect } from 'react'
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  Dimensions,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { LinearGradient } from 'expo-linear-gradient'

import { useTheme } from '../../context/ThemeContext'
import { useAuth } from '../../context/AuthContext'
import { useApi } from '../../hooks/useApi'
import Button from '../../components/common/Button'

const { width } = Dimensions.get('window')

interface DashboardData {
  resumoFinanceiro?: {
    receitas: number
    despesas: number
    saldo: number
    totalTransacoes: number
  }
  transacoesRecentes?: Array<{
    _id: string
    tipo: 'receita' | 'despesa'
    descricao: string
    valor: number
    categoria: string
    data: string
  }>
  orcamentos?: {
    total: number
    excedidos: number
  }
  metas?: {
    total: number
    concluidas: number
  }
  alertas?: Array<{
    tipo: string
    titulo: string
    mensagem: string
  }>
}

export default function DashboardScreen() {
  const { theme } = useTheme()
  const { user } = useAuth()
  const [selectedPeriod, setSelectedPeriod] = useState('mes')
  const [refreshing, setRefreshing] = useState(false)

  const { 
    data: dashboardData, 
    loading, 
    error, 
    refresh 
  } = useApi<{ success: boolean; data: DashboardData }>('/dashboard/overview?periodo=' + selectedPeriod)

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value || 0)
  }

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit'
      })
    } catch {
      return ''
    }
  }

  const getGreeting = () => {
    const hour = new Date().getHours()
    if (hour < 12) return 'Bom dia'
    if (hour < 18) return 'Boa tarde'
    return 'Boa noite'
  }

  const handleRefresh = async () => {
    setRefreshing(true)
    await refresh()
    setRefreshing(false)
  }

  // Dados padrão caso a API não retorne nada
  const defaultData: DashboardData = {
    resumoFinanceiro: {
      receitas: 0,
      despesas: 0,
      saldo: 0,
      totalTransacoes: 0
    },
    transacoesRecentes: [],
    orcamentos: {
      total: 0,
      excedidos: 0
    },
    metas: {
      total: 0,
      concluidas: 0
    },
    alertas: []
  }

  // Usar dados da API ou dados padrão
  const data = dashboardData?.data || defaultData
  const resumo = data.resumoFinanceiro || defaultData.resumoFinanceiro!
  const transacoes = data.transacoesRecentes || []
  const orcamentos = data.orcamentos || defaultData.orcamentos!
  const metas = data.metas || defaultData.metas!

  const QuickActionButton = ({ icon, title, onPress }: {
    icon: keyof typeof Ionicons.glyphMap
    title: string
    onPress: () => void
  }) => (
    <TouchableOpacity style={styles.quickActionButton} onPress={onPress}>
      <Ionicons
        name={icon}
        size={24}
        color={theme.primary}
        style={styles.quickActionIcon}
      />
      <Text style={styles.quickActionText}>{title}</Text>
    </TouchableOpacity>
  )

  const TransactionItem = ({ transaction }: { transaction: any }) => (
    <View style={styles.transactionItem}>
      <View style={styles.transactionIcon}>
        <Ionicons
          name={transaction.tipo === 'receita' ? 'add-circle' : 'remove-circle'}
          size={24}
          color={transaction.tipo === 'receita' ? theme.success : theme.error}
        />
      </View>
      <View style={styles.transactionDetails}>
        <Text style={styles.transactionDescription}>{transaction.descricao}</Text>
        <Text style={styles.transactionInfo}>
          {transaction.categoria} • {formatDate(transaction.data)}
        </Text>
      </View>
      <Text style={[
        styles.transactionAmount,
        { color: transaction.tipo === 'receita' ? theme.success : theme.error }
      ]}>
        {transaction.tipo === 'receita' ? '+' : '-'}{formatCurrency(transaction.valor)}
      </Text>
    </View>
  )

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.background,
    },
    header: {
      paddingHorizontal: 20,
      paddingTop: 20,
      paddingBottom: 16,
    },
    greeting: {
      fontSize: 16,
      color: theme.textSecondary,
    },
    userName: {
      fontSize: 24,
      fontWeight: 'bold',
      color: theme.text,
      marginTop: 4,
    },
    periodSelector: {
      flexDirection: 'row',
      paddingHorizontal: 20,
      marginBottom: 20,
    },
    periodButton: {
      flex: 1,
      paddingVertical: 8,
      paddingHorizontal: 16,
      borderRadius: 8,
      marginHorizontal: 4,
      alignItems: 'center',
    },
    periodButtonActive: {
      backgroundColor: theme.primary,
    },
    periodButtonInactive: {
      backgroundColor: theme.surface,
      borderWidth: 1,
      borderColor: theme.border,
    },
    periodText: {
      fontSize: 14,
      fontWeight: '500',
    },
    periodTextActive: {
      color: '#FFFFFF',
    },
    periodTextInactive: {
      color: theme.text,
    },
    balanceCard: {
      marginHorizontal: 20,
      marginBottom: 24,
      borderRadius: 16,
      padding: 20,
    },
    balanceLabel: {
      fontSize: 14,
      color: '#FFFFFF',
      opacity: 0.9,
      marginBottom: 8,
    },
    balanceAmount: {
      fontSize: 32,
      fontWeight: 'bold',
      color: '#FFFFFF',
      marginBottom: 16,
    },
    balanceRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
    },
    balanceItem: {
      flex: 1,
    },
    balanceItemLabel: {
      fontSize: 12,
      color: '#FFFFFF',
      opacity: 0.8,
      marginBottom: 4,
    },
    balanceItemValue: {
      fontSize: 16,
      fontWeight: '600',
      color: '#FFFFFF',
    },
    quickActionsContainer: {
      flexDirection: 'row',
      paddingHorizontal: 20,
      justifyContent: 'space-between',
      marginBottom: 24,
    },
    quickActionButton: {
      flex: 1,
      backgroundColor: theme.surface,
      borderRadius: 12,
      padding: 16,
      alignItems: 'center',
      marginHorizontal: 6,
      borderWidth: 1,
      borderColor: theme.border,
    },
    quickActionIcon: {
      marginBottom: 8,
    },
    quickActionText: {
      fontSize: 12,
      color: theme.text,
      fontWeight: '500',
      textAlign: 'center',
    },
    statsContainer: {
      flexDirection: 'row',
      paddingHorizontal: 20,
      justifyContent: 'space-between',
      marginBottom: 24,
    },
    statCard: {
      flex: 1,
      backgroundColor: theme.surface,
      borderRadius: 12,
      padding: 16,
      marginHorizontal: 4,
      alignItems: 'center',
      borderWidth: 1,
      borderColor: theme.border,
    },
    statNumber: {
      fontSize: 20,
      fontWeight: 'bold',
      color: theme.text,
      marginBottom: 4,
    },
    statLabel: {
      fontSize: 12,
      color: theme.textSecondary,
      textAlign: 'center',
    },
    section: {
      marginBottom: 24,
    },
    sectionHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 20,
      marginBottom: 16,
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: 'bold',
      color: theme.text,
    },
    seeAllButton: {
      fontSize: 14,
      color: theme.primary,
      fontWeight: '500',
    },
    transactionsList: {
      paddingHorizontal: 20,
    },
    transactionItem: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.surface,
      borderRadius: 12,
      padding: 16,
      marginBottom: 12,
      borderWidth: 1,
      borderColor: theme.border,
    },
    transactionIcon: {
      marginRight: 12,
    },
    transactionDetails: {
      flex: 1,
    },
    transactionDescription: {
      fontSize: 16,
      fontWeight: '500',
      color: theme.text,
      marginBottom: 4,
    },
    transactionInfo: {
      fontSize: 12,
      color: theme.textSecondary,
    },
    transactionAmount: {
      fontSize: 16,
      fontWeight: 'bold',
    },
    emptyState: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: 40,
    },
    emptyStateIcon: {
      marginBottom: 16,
    },
    emptyStateText: {
      fontSize: 18,
      fontWeight: 'bold',
      color: theme.text,
      marginBottom: 8,
      textAlign: 'center',
    },
    emptyStateSubtext: {
      fontSize: 14,
      color: theme.textSecondary,
      textAlign: 'center',
      marginBottom: 24,
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    loadingText: {
      marginTop: 16,
      color: theme.textSecondary,
      fontSize: 16,
    },
  })

  if (loading && !dashboardData) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Ionicons name="reload" size={32} color={theme.primary} />
          <Text style={styles.loadingText}>Carregando dashboard...</Text>
        </View>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.greeting}>{getGreeting()},</Text>
          <Text style={styles.userName}>{user?.name?.split(' ')[0] || 'Usuário'}</Text>
        </View>

        {/* Period Selector */}
        <View style={styles.periodSelector}>
          {[
            { key: 'semana', label: 'Semana' },
            { key: 'mes', label: 'Mês' },
            { key: 'ano', label: 'Ano' },
          ].map((period) => (
            <TouchableOpacity
              key={period.key}
              style={[
                styles.periodButton,
                selectedPeriod === period.key 
                  ? styles.periodButtonActive 
                  : styles.periodButtonInactive
              ]}
              onPress={() => setSelectedPeriod(period.key)}
            >
              <Text style={[
                styles.periodText,
                selectedPeriod === period.key 
                  ? styles.periodTextActive 
                  : styles.periodTextInactive
              ]}>
                {period.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Balance Card */}
        <LinearGradient
          colors={[theme.primary, theme.secondary]}
          style={styles.balanceCard}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <Text style={styles.balanceLabel}>Saldo atual</Text>
          <Text style={styles.balanceAmount}>
            {formatCurrency(resumo.saldo)}
          </Text>
          <View style={styles.balanceRow}>
            <View style={styles.balanceItem}>
              <Text style={styles.balanceItemLabel}>Receitas</Text>
              <Text style={styles.balanceItemValue}>
                {formatCurrency(resumo.receitas)}
              </Text>
            </View>
            <View style={styles.balanceItem}>
              <Text style={styles.balanceItemLabel}>Despesas</Text>
              <Text style={styles.balanceItemValue}>
                {formatCurrency(resumo.despesas)}
              </Text>
            </View>
          </View>
        </LinearGradient>

        {/* Quick Actions */}
        <View style={styles.quickActionsContainer}>
          <QuickActionButton
            icon="add-circle"
            title="Nova Receita"
            onPress={() => console.log('Nova Receita')}
          />
          <QuickActionButton
            icon="remove-circle"
            title="Nova Despesa"
            onPress={() => console.log('Nova Despesa')}
          />
          <QuickActionButton
            icon="bar-chart"
            title="Relatórios"
            onPress={() => console.log('Relatórios')}
          />
        </View>

        {/* Stats */}
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{orcamentos.total}</Text>
            <Text style={styles.statLabel}>Orçamentos Ativos</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{metas.total}</Text>
            <Text style={styles.statLabel}>Metas em Andamento</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{resumo.totalTransacoes}</Text>
            <Text style={styles.statLabel}>Transações</Text>
          </View>
        </View>

        {/* Recent Transactions */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Transações Recentes</Text>
            <TouchableOpacity>
              <Text style={styles.seeAllButton}>Ver todas</Text>
            </TouchableOpacity>
          </View>
          
          <View style={styles.transactionsList}>
            {transacoes.length > 0 ? (
              transacoes.slice(0, 5).map((transaction) => (
                <TransactionItem key={transaction._id} transaction={transaction} />
              ))
            ) : (
              <View style={{ alignItems: 'center', paddingVertical: 32 }}>
                <Ionicons name="document-outline" size={48} color={theme.textSecondary} />
                <Text style={{ color: theme.textSecondary, marginTop: 16 }}>
                  Nenhuma transação ainda
                </Text>
              </View>
            )}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}