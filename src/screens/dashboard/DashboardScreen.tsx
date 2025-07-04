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
  resumoFinanceiro: {
    receitas: number
    despesas: number
    saldo: number
    totalTransacoes: number
  }
  transacoesRecentes: Array<{
    _id: string
    tipo: 'receita' | 'despesa'
    descricao: string
    valor: number
    categoria: string
    data: string
  }>
  orcamentos: {
    total: number
    excedidos: number
  }
  metas: {
    total: number
    concluidas: number
  }
  alertas: Array<{
    tipo: string
    titulo: string
    mensagem: string
  }>
}

export default function DashboardScreen() {
  const { theme } = useTheme()
  const { user } = useAuth()
  const [selectedPeriod, setSelectedPeriod] = useState('mes')

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
    }).format(value)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit'
    })
  }

  const getGreeting = () => {
    const hour = new Date().getHours()
    if (hour < 12) return 'Bom dia'
    if (hour < 18) return 'Boa tarde'
    return 'Boa noite'
  }

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
      marginBottom: 4,
    },
    userName: {
      fontSize: 24,
      fontWeight: 'bold',
      color: theme.text,
    },
    periodSelector: {
      flexDirection: 'row',
      marginVertical: 20,
      paddingHorizontal: 20,
    },
    periodButton: {
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderRadius: 20,
      marginRight: 12,
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
      color: theme.textSecondary,
    },
    balanceCard: {
      marginHorizontal: 20,
      borderRadius: 16,
      padding: 24,
      marginBottom: 24,
    },
    balanceLabel: {
      fontSize: 16,
      color: 'rgba(255, 255, 255, 0.8)',
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
      alignItems: 'center',
    },
    balanceItemLabel: {
      fontSize: 12,
      color: 'rgba(255, 255, 255, 0.7)',
      marginBottom: 4,
    },
    balanceItemValue: {
      fontSize: 16,
      fontWeight: '600',
      color: '#FFFFFF',
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
    transactionItem: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.surface,
      borderRadius: 12,
      padding: 16,
      marginHorizontal: 20,
      marginBottom: 8,
      borderWidth: 1,
      borderColor: theme.border,
    },
    transactionIcon: {
      width: 40,
      height: 40,
      borderRadius: 20,
      alignItems: 'center',
      justifyContent: 'center',
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
      alignItems: 'center',
      padding: 40,
    },
    emptyStateIcon: {
      marginBottom: 16,
    },
    emptyStateText: {
      fontSize: 16,
      color: theme.textSecondary,
      textAlign: 'center',
      marginBottom: 8,
    },
    emptyStateSubtext: {
      fontSize: 14,
      color: theme.textSecondary,
      textAlign: 'center',
      marginBottom: 24,
    },
  })

  const QuickActionButton = ({ icon, title, onPress }: {
    icon: keyof typeof Ionicons.glyphMap
    title: string
    onPress: () => void
  }) => (
    <TouchableOpacity style={styles.quickActionButton} onPress={onPress}>
      <View style={styles.quickActionIcon}>
        <Ionicons name={icon} size={24} color={theme.primary} />
      </View>
      <Text style={styles.quickActionText}>{title}</Text>
    </TouchableOpacity>
  )

  const TransactionItem = ({ transaction }: { transaction: DashboardData['transacoesRecentes'][0] }) => (
    <View style={styles.transactionItem}>
      <View style={[
        styles.transactionIcon,
        { backgroundColor: transaction.tipo === 'receita' ? theme.success + '20' : theme.error + '20' }
      ]}>
        <Ionicons 
          name={transaction.tipo === 'receita' ? 'arrow-up' : 'arrow-down'} 
          size={20} 
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

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <Ionicons name="reload" size={32} color={theme.primary} />
          <Text style={{ marginTop: 16, color: theme.textSecondary }}>Carregando...</Text>
        </View>
      </SafeAreaView>
    )
  }

  if (error || !dashboardData?.data) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.emptyState}>
          <View style={styles.emptyStateIcon}>
            <Ionicons name="alert-circle" size={48} color={theme.error} />
          </View>
          <Text style={styles.emptyStateText}>Erro ao carregar dados</Text>
          <Text style={styles.emptyStateSubtext}>
            Verifique sua conexão e tente novamente
          </Text>
          <Button title="Tentar novamente" onPress={refresh} />
        </View>
      </SafeAreaView>
    )
  }

  const data = dashboardData.data

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={refresh} />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.greeting}>{getGreeting()},</Text>
          <Text style={styles.userName}>{user?.nome?.split(' ')[0] || 'Usuário'}</Text>
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
            {formatCurrency(data.resumoFinanceiro.saldo)}
          </Text>
          <View style={styles.balanceRow}>
            <View style={styles.balanceItem}>
              <Text style={styles.balanceItemLabel}>Receitas</Text>
              <Text style={styles.balanceItemValue}>
                {formatCurrency(data.resumoFinanceiro.receitas)}
              </Text>
            </View>
            <View style={styles.balanceItem}>
              <Text style={styles.balanceItemLabel}>Despesas</Text>
              <Text style={styles.balanceItemValue}>
                {formatCurrency(data.resumoFinanceiro.despesas)}
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
            <Text style={styles.statNumber}>{data.orcamentos.total}</Text>
            <Text style={styles.statLabel}>Orçamentos Ativos</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{data.metas.total}</Text>
            <Text style={styles.statLabel}>Metas em Andamento</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{data.resumoFinanceiro.totalTransacoes}</Text>
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
          
          {data.transacoesRecentes.length > 0 ? (
            data.transacoesRecentes.slice(0, 5).map((transaction) => (
              <TransactionItem key={transaction._id} transaction={transaction} />
            ))
          ) : (
            <View style={styles.emptyState}>
              <View style={styles.emptyStateIcon}>
                <Ionicons name="receipt-outline" size={48} color={theme.textSecondary} />
              </View>
              <Text style={styles.emptyStateText}>Nenhuma transação ainda</Text>
              <Text style={styles.emptyStateSubtext}>
                Adicione sua primeira transação para começar
              </Text>
              <Button title="Adicionar Transação" onPress={() => {}} />
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}