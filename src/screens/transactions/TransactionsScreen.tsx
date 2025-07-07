import React, { useState, useCallback } from 'react'
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Alert,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { useFocusEffect } from '@react-navigation/native'

import { useTheme } from '../../context/ThemeContext'
import { usePagination } from '../../hooks/useApi'
import Button from '../../components/common/Button'
import LoadingSpinner from '../../components/common/LoadingSpinner'

interface Transaction {
  _id: string
  tipo: 'receita' | 'despesa'
  descricao: string
  valor: number
  categoria: string
  metodoPagamento: string
  data: string
  observacoes?: string
  tags?: string[]
}

interface TransactionsData {
  transacoes: Transaction[]
  resumo: {
    totalReceitas: number
    totalDespesas: number
    saldo: number
    totalTransacoes: number
  }
}

export default function TransactionsScreen() {
  const { theme } = useTheme()
  const [selectedFilter, setSelectedFilter] = useState<'todos' | 'receita' | 'despesa'>('todos')
  const [searchTerm, setSearchTerm] = useState('')

  const {
    data: transactionsData,
    loading,
    error,
    hasMore,
    loadMore,
    refresh
  } = useApi<TransactionsData>('/transactions')

  // Recarregar quando a tela ganhar foco
  useFocusEffect(
    useCallback(() => {
      refresh()
    }, [])
  )

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
      year: '2-digit'
    })
  }

  const handleDeleteTransaction = (id: string) => {
    Alert.alert(
      'Excluir Transação',
      'Tem certeza que deseja excluir esta transação?',
      [
        { text: 'Cancelar', style: 'cancel' },
        { 
          text: 'Excluir', 
          style: 'destructive',
          onPress: async () => {
            // TODO: Implementar delete
            console.log('Delete transaction:', id)
          }
        }
      ]
    )
  }

  const TransactionItem = ({ item }: { item: Transaction }) => (
    <TouchableOpacity 
      style={styles.transactionItem}
      onPress={() => {
        // TODO: Navegar para detalhes/edição
        console.log('Edit transaction:', item._id)
      }}
    >
      <View style={[
        styles.transactionIcon,
        { backgroundColor: item.tipo === 'receita' ? theme.success + '20' : theme.error + '20' }
      ]}>
        <Ionicons 
          name={item.tipo === 'receita' ? 'arrow-up' : 'arrow-down'} 
          size={20} 
          color={item.tipo === 'receita' ? theme.success : theme.error} 
        />
      </View>
      
      <View style={styles.transactionDetails}>
        <Text style={styles.transactionDescription}>{item.descricao}</Text>
        <Text style={styles.transactionInfo}>
          {item.categoria} • {item.metodoPagamento} • {formatDate(item.data)}
        </Text>
        {item.observacoes && (
          <Text style={styles.transactionNotes} numberOfLines={1}>
            {item.observacoes}
          </Text>
        )}
      </View>
      
      <View style={styles.transactionRight}>
        <Text style={[
          styles.transactionAmount,
          { color: item.tipo === 'receita' ? theme.success : theme.error }
        ]}>
          {item.tipo === 'receita' ? '+' : '-'}{formatCurrency(item.valor)}
        </Text>
        
        <TouchableOpacity 
          style={styles.deleteButton}
          onPress={() => handleDeleteTransaction(item._id)}
        >
          <Ionicons name="trash-outline" size={16} color={theme.error} />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  )

  const FilterButton = ({ 
    filter, 
    label, 
    icon 
  }: { 
    filter: typeof selectedFilter
    label: string
    icon: keyof typeof Ionicons.glyphMap
  }) => (
    <TouchableOpacity
      style={[
        styles.filterButton,
        selectedFilter === filter && styles.filterButtonActive
      ]}
      onPress={() => setSelectedFilter(filter)}
    >
      <Ionicons 
        name={icon} 
        size={16} 
        color={selectedFilter === filter ? '#FFFFFF' : theme.textSecondary} 
      />
      <Text style={[
        styles.filterButtonText,
        selectedFilter === filter && styles.filterButtonTextActive
      ]}>
        {label}
      </Text>
    </TouchableOpacity>
  )

  const SummaryCard = () => {
    if (!transactionsData?.resumo) return null

    return (
      <View style={styles.summaryCard}>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryLabel}>Receitas</Text>
          <Text style={[styles.summaryValue, { color: theme.success }]}>
            {formatCurrency(transactionsData.resumo.totalReceitas)}
          </Text>
        </View>
        
        <View style={styles.summaryDivider} />
        
        <View style={styles.summaryItem}>
          <Text style={styles.summaryLabel}>Despesas</Text>
          <Text style={[styles.summaryValue, { color: theme.error }]}>
            {formatCurrency(transactionsData.resumo.totalDespesas)}
          </Text>
        </View>
        
        <View style={styles.summaryDivider} />
        
        <View style={styles.summaryItem}>
          <Text style={styles.summaryLabel}>Saldo</Text>
          <Text style={[
            styles.summaryValue,
            { color: transactionsData.resumo.saldo >= 0 ? theme.success : theme.error }
          ]}>
            {formatCurrency(transactionsData.resumo.saldo)}
          </Text>
        </View>
      </View>
    )
  }

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
    },
    title: {
      fontSize: 24,
      fontWeight: 'bold',
      color: theme.text,
    },
    addButton: {
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: theme.primary,
      alignItems: 'center',
      justifyContent: 'center',
    },
    summaryCard: {
      flexDirection: 'row',
      backgroundColor: theme.surface,
      marginHorizontal: 20,
      marginBottom: 20,
      borderRadius: 12,
      padding: 16,
      borderWidth: 1,
      borderColor: theme.border,
    },
    summaryItem: {
      flex: 1,
      alignItems: 'center',
    },
    summaryLabel: {
      fontSize: 12,
      color: theme.textSecondary,
      marginBottom: 4,
    },
    summaryValue: {
      fontSize: 16,
      fontWeight: 'bold',
    },
    summaryDivider: {
      width: 1,
      backgroundColor: theme.border,
      marginHorizontal: 12,
    },
    filtersContainer: {
      flexDirection: 'row',
      paddingHorizontal: 20,
      marginBottom: 20,
      gap: 8,
    },
    filterButton: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: 20,
      backgroundColor: theme.surface,
      borderWidth: 1,
      borderColor: theme.border,
      gap: 6,
    },
    filterButtonActive: {
      backgroundColor: theme.primary,
      borderColor: theme.primary,
    },
    filterButtonText: {
      fontSize: 14,
      color: theme.textSecondary,
      fontWeight: '500',
    },
    filterButtonTextActive: {
      color: '#FFFFFF',
    },
    transactionItem: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.surface,
      marginHorizontal: 20,
      marginBottom: 8,
      borderRadius: 12,
      padding: 16,
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
      fontWeight: '600',
      color: theme.text,
      marginBottom: 4,
    },
    transactionInfo: {
      fontSize: 12,
      color: theme.textSecondary,
    },
    transactionNotes: {
      fontSize: 12,
      color: theme.textSecondary,
      fontStyle: 'italic',
      marginTop: 2,
    },
    transactionRight: {
      alignItems: 'flex-end',
      gap: 8,
    },
    transactionAmount: {
      fontSize: 16,
      fontWeight: 'bold',
    },
    deleteButton: {
      padding: 4,
    },
    emptyState: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 40,
    },
    emptyStateIcon: {
      marginBottom: 16,
    },
    emptyStateText: {
      fontSize: 18,
      fontWeight: '600',
      color: theme.text,
      textAlign: 'center',
      marginBottom: 8,
    },
    emptyStateSubtext: {
      fontSize: 14,
      color: theme.textSecondary,
      textAlign: 'center',
      marginBottom: 24,
      lineHeight: 20,
    },
    loadingContainer: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
    },
  })

  if (loading && !transactionsData) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <LoadingSpinner />
          <Text style={{ color: theme.textSecondary, marginTop: 16 }}>
            Carregando transações...
          </Text>
        </View>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Transações</Text>
        <TouchableOpacity 
          style={styles.addButton}
          onPress={() => {
            // TODO: Navegar para AddTransactionScreen
            console.log('Add transaction')
          }}
        >
          <Ionicons name="add" size={24} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      {/* Summary Card */}
      <SummaryCard />

      {/* Filters */}
      <View style={styles.filtersContainer}>
        <FilterButton filter="todos" label="Todos" icon="list" />
        <FilterButton filter="receita" label="Receitas" icon="arrow-up" />
        <FilterButton filter="despesa" label="Despesas" icon="arrow-down" />
      </View>

      {/* Transaction List */}
      {transactionsData?.transacoes?.length === 0 ? (
        <View style={styles.emptyState}>
          <View style={styles.emptyStateIcon}>
            <Ionicons name="receipt-outline" size={64} color={theme.textSecondary} />
          </View>
          <Text style={styles.emptyStateText}>Nenhuma transação ainda</Text>
          <Text style={styles.emptyStateSubtext}>
            Comece adicionando sua primeira receita ou despesa para acompanhar suas finanças
          </Text>
          <Button
            title="Adicionar Transação"
            onPress={() => {
              // TODO: Navegar para AddTransactionScreen
              console.log('Add first transaction')
            }}
          />
        </View>
      ) : (
        <FlatList
          data={transactionsData?.transacoes || []}
          keyExtractor={(item) => item._id}
          renderItem={({ item }) => <TransactionItem item={item} />}
          refreshControl={
            <RefreshControl refreshing={loading} onRefresh={refresh} />
          }
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 20 }}
        />
      )}
    </SafeAreaView>
  )
}