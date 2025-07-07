import React, { useState, useCallback } from 'react'
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Alert,
  Dimensions,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { LinearGradient } from 'expo-linear-gradient'
import { useFocusEffect } from '@react-navigation/native'

import { useTheme } from '../../context/ThemeContext'
import { useApi, useMutation } from '../../hooks/useApi'
import Button from '../../components/common/Button'

const { width } = Dimensions.get('window')

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
  configuracoes: {
    alertas: {
      ativo: boolean
      porcentagens: number[]
    }
  }
}

interface BudgetsData {
  orcamentos: Budget[]
  resumo: {
    totalLimite: number
    totalGasto: number
    totalRestante: number
    excedidos: number
    emAlerta: number
    vencendoEm7Dias: number
  }
}

export default function BudgetsScreen() {
  const { theme } = useTheme()
  const [selectedFilter, setSelectedFilter] = useState<'ativos' | 'excedidos' | 'todos'>('ativos')

  const { 
    data: budgetsData, 
    loading, 
    error, 
    refresh 
  } = useApi<BudgetsData>('/budgets')

  const { mutate: updateBudget } = useMutation()

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

  const getStatusColor = (budget: Budget) => {
    if (budget.porcentagemGasta >= 100) return theme.error
    if (budget.porcentagemGasta >= 80) return theme.warning
    return theme.success
  }

  const getStatusText = (budget: Budget) => {
    if (budget.porcentagemGasta >= 100) return 'Excedido'
    if (budget.porcentagemGasta >= 80) return 'Quase no limite'
    return 'No controle'
  }

  const handlePauseBudget = async (budgetId: string) => {
    Alert.alert(
      'Pausar Orçamento',
      'Tem certeza que deseja pausar este orçamento?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Pausar',
          onPress: async () => {
            await updateBudget('post', `/budgets/${budgetId}/pause`, {}, {
              onSuccess: () => refresh(),
              onError: (error) => Alert.alert('Erro', error)
            })
          }
        }
      ]
    )
  }

  const handleReactivateBudget = async (budgetId: string) => {
    await updateBudget('post', `/budgets/${budgetId}/reactivate`, {}, {
      onSuccess: () => refresh(),
      onError: (error) => Alert.alert('Erro', error)
    })
  }

  const handleRenewBudget = async (budgetId: string) => {
    Alert.alert(
      'Renovar Orçamento',
      'Deseja renovar este orçamento para o próximo período?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Renovar',
          onPress: async () => {
            await updateBudget('post', `/budgets/${budgetId}/renew`, {}, {
              onSuccess: () => {
                refresh()
                Alert.alert('Sucesso', 'Orçamento renovado com sucesso!')
              },
              onError: (error) => Alert.alert('Erro', error)
            })
          }
        }
      ]
    )
  }

  const ProgressBar = ({ progress, color }: { progress: number, color: string }) => (
    <View style={[styles.progressBarContainer, { backgroundColor: color + '20' }]}>
      <View 
        style={[
          styles.progressBarFill, 
          { 
            width: `${Math.min(progress, 100)}%`,
            backgroundColor: color 
          }
        ]} 
      />
    </View>
  )

  const BudgetCard = ({ budget }: { budget: Budget }) => {
    const statusColor = getStatusColor(budget)
    const isOverdue = budget.diasRestantes === 0 && budget.status === 'ativo'
    const isExceeded = budget.porcentagemGasta >= 100

    return (
      <View style={[styles.budgetCard, { borderLeftColor: budget.cor }]}>
        <View style={styles.budgetHeader}>
          <View style={styles.budgetTitleContainer}>
            <View style={[styles.budgetIcon, { backgroundColor: budget.cor + '20' }]}>
              <Ionicons name={budget.icone as any} size={20} color={budget.cor} />
            </View>
            <View style={styles.budgetTitleText}>
              <Text style={styles.budgetTitle}>{budget.nome}</Text>
              <Text style={styles.budgetCategory}>{budget.categoria}</Text>
            </View>
          </View>
          
          <TouchableOpacity
            style={styles.menuButton}
            onPress={() => {
              Alert.alert(
                'Ações',
                'O que deseja fazer?',
                [
                  { text: 'Cancelar', style: 'cancel' },
                  { 
                    text: 'Editar', 
                    onPress: () => console.log('Edit budget') 
                  },
                  { 
                    text: budget.status === 'ativo' ? 'Pausar' : 'Reativar',
                    onPress: () => budget.status === 'ativo' 
                      ? handlePauseBudget(budget._id) 
                      : handleReactivateBudget(budget._id)
                  },
                  { 
                    text: 'Renovar',
                    onPress: () => handleRenewBudget(budget._id)
                  },
                ]
              )
            }}
          >
            <Ionicons name="ellipsis-vertical" size={20} color={theme.textSecondary} />
          </TouchableOpacity>
        </View>

        <View style={styles.budgetProgress}>
          <View style={styles.budgetValues}>
            <Text style={styles.spentValue}>
              {formatCurrency(budget.valorGasto)}
            </Text>
            <Text style={styles.limitValue}>
              de {formatCurrency(budget.valorLimite)}
            </Text>
          </View>
          
          <ProgressBar progress={budget.porcentagemGasta} color={statusColor} />
          
          <View style={styles.budgetStats}>
            <Text style={[styles.progressPercentage, { color: statusColor }]}>
              {budget.porcentagemGasta}% usado
            </Text>
            <Text style={styles.remainingValue}>
              Restam: {formatCurrency(budget.valorRestante)}
            </Text>
          </View>
        </View>

        <View style={styles.budgetFooter}>
          <View style={styles.statusInfo}>
            <View style={[styles.statusIndicator, { backgroundColor: statusColor }]} />
            <Text style={[styles.statusText, { color: statusColor }]}>
              {getStatusText(budget)}
            </Text>
          </View>

          <View style={styles.timeInfo}>
            <Ionicons 
              name="time" 
              size={14} 
              color={isOverdue ? theme.error : theme.textSecondary} 
            />
            <Text style={[
              styles.timeText,
              { color: isOverdue ? theme.error : theme.textSecondary }
            ]}>
              {isOverdue 
                ? 'Vencido' 
                : budget.diasRestantes === 0 
                  ? 'Vence hoje' 
                  : `${budget.diasRestantes} dias restantes`
              }
            </Text>
          </View>
        </View>

        {budget.status === 'pausado' && (
          <View style={styles.pausedBadge}>
            <Ionicons name="pause-circle" size={16} color={theme.warning} />
            <Text style={styles.pausedText}>Pausado</Text>
          </View>
        )}

        {isExceeded && (
          <View style={styles.exceededBadge}>
            <Ionicons name="warning" size={16} color={theme.error} />
            <Text style={styles.exceededText}>Orçamento Excedido!</Text>
          </View>
        )}

        {budget.renovacaoAutomatica && (
          <View style={styles.autoRenewBadge}>
            <Ionicons name="repeat" size={12} color={theme.info} />
            <Text style={styles.autoRenewText}>Renovação automática</Text>
          </View>
        )}
      </View>
    )
  }

  const SummaryCard = () => {
    if (!budgetsData?.resumo) return null

    const summary = budgetsData.resumo
    const eficiencia = summary.totalLimite > 0 
      ? ((summary.totalLimite - summary.totalGasto) / summary.totalLimite) * 100 
      : 0

    return (
      <LinearGradient
        colors={[theme.primary, theme.secondary]}
        style={styles.summaryCard}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={styles.summaryHeader}>
          <Text style={styles.summaryTitle}>Resumo dos Orçamentos</Text>
          <Text style={styles.summaryEfficiency}>
            {eficiencia.toFixed(0)}% de eficiência
          </Text>
        </View>

        <View style={styles.summaryRow}>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryValue}>{formatCurrency(summary.totalLimite)}</Text>
            <Text style={styles.summaryLabel}>Total Orçado</Text>
          </View>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryValue}>{formatCurrency(summary.totalGasto)}</Text>
            <Text style={styles.summaryLabel}>Total Gasto</Text>
          </View>
        </View>

        <View style={styles.summaryAlerts}>
          <View style={styles.alertItem}>
            <Ionicons name="warning" size={16} color="rgba(255, 255, 255, 0.8)" />
            <Text style={styles.alertText}>{summary.excedidos} excedidos</Text>
          </View>
          <View style={styles.alertItem}>
            <Ionicons name="alert-circle" size={16} color="rgba(255, 255, 255, 0.8)" />
            <Text style={styles.alertText}>{summary.emAlerta} em alerta</Text>
          </View>
          <View style={styles.alertItem}>
            <Ionicons name="time" size={16} color="rgba(255, 255, 255, 0.8)" />
            <Text style={styles.alertText}>{summary.vencendoEm7Dias} vencendo</Text>
          </View>
        </View>
      </LinearGradient>
    )
  }

  const FilterButton = ({ 
    filter, 
    label, 
    count,
    icon 
  }: { 
    filter: typeof selectedFilter
    label: string
    count: number
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
        {label} ({count})
      </Text>
    </TouchableOpacity>
  )

  const filteredBudgets = budgetsData?.orcamentos?.filter(budget => {
    switch (selectedFilter) {
      case 'ativos':
        return budget.status === 'ativo'
      case 'excedidos':
        return budget.porcentagemGasta >= 100
      default:
        return true
    }
  }) || []

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
      marginHorizontal: 20,
      marginBottom: 20,
      borderRadius: 16,
      padding: 20,
    },
    summaryHeader: {
      marginBottom: 16,
    },
    summaryTitle: {
      fontSize: 18,
      fontWeight: 'bold',
      color: '#FFFFFF',
      marginBottom: 4,
    },
    summaryEfficiency: {
      fontSize: 14,
      color: 'rgba(255, 255, 255, 0.8)',
    },
    summaryRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: 16,
    },
    summaryItem: {
      alignItems: 'center',
    },
    summaryValue: {
      fontSize: 18,
      fontWeight: 'bold',
      color: '#FFFFFF',
    },
    summaryLabel: {
      fontSize: 12,
      color: 'rgba(255, 255, 255, 0.8)',
      marginTop: 2,
    },
    summaryAlerts: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      paddingTop: 16,
      borderTopWidth: 1,
      borderTopColor: 'rgba(255, 255, 255, 0.2)',
    },
    alertItem: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
    },
    alertText: {
      fontSize: 12,
      color: 'rgba(255, 255, 255, 0.8)',
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
    budgetCard: {
      backgroundColor: theme.surface,
      marginHorizontal: 20,
      marginBottom: 16,
      borderRadius: 12,
      padding: 16,
      borderLeftWidth: 4,
      borderWidth: 1,
      borderColor: theme.border,
    },
    budgetHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: 12,
    },
    budgetTitleContainer: {
      flexDirection: 'row',
      flex: 1,
    },
    budgetIcon: {
      width: 40,
      height: 40,
      borderRadius: 20,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 12,
    },
    budgetTitleText: {
      flex: 1,
    },
    budgetTitle: {
      fontSize: 16,
      fontWeight: 'bold',
      color: theme.text,
      marginBottom: 2,
    },
    budgetCategory: {
      fontSize: 12,
      color: theme.textSecondary,
    },
    menuButton: {
      padding: 4,
    },
    budgetProgress: {
      marginBottom: 12,
    },
    budgetValues: {
      flexDirection: 'row',
      alignItems: 'baseline',
      marginBottom: 8,
      gap: 4,
    },
    spentValue: {
      fontSize: 20,
      fontWeight: 'bold',
      color: theme.text,
    },
    limitValue: {
      fontSize: 14,
      color: theme.textSecondary,
    },
    progressBarContainer: {
      height: 8,
      borderRadius: 4,
      marginBottom: 8,
    },
    progressBarFill: {
      height: '100%',
      borderRadius: 4,
    },
    budgetStats: {
      flexDirection: 'row',
      justifyContent: 'space-between',
    },
    progressPercentage: {
      fontSize: 12,
      fontWeight: '600',
    },
    remainingValue: {
      fontSize: 12,
      color: theme.textSecondary,
    },
    budgetFooter: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    statusInfo: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    statusIndicator: {
      width: 8,
      height: 8,
      borderRadius: 4,
    },
    statusText: {
      fontSize: 12,
      fontWeight: '600',
    },
    timeInfo: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
    },
    timeText: {
      fontSize: 12,
    },
    pausedBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: 12,
      paddingVertical: 6,
      backgroundColor: theme.warning + '10',
      borderRadius: 6,
      gap: 4,
    },
    pausedText: {
      fontSize: 12,
      fontWeight: '600',
      color: theme.warning,
    },
    exceededBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: 12,
      paddingVertical: 6,
      backgroundColor: theme.error + '10',
      borderRadius: 6,
      gap: 4,
    },
    exceededText: {
      fontSize: 12,
      fontWeight: '600',
      color: theme.error,
    },
    autoRenewBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: 8,
      paddingVertical: 4,
      gap: 4,
    },
    autoRenewText: {
      fontSize: 11,
      color: theme.info,
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
  })

  if (loading && !budgetsData) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.emptyState}>
          <Text style={{ color: theme.textSecondary }}>Carregando orçamentos...</Text>
        </View>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Orçamentos</Text>
        <TouchableOpacity 
          style={styles.addButton}
          onPress={() => {
            // TODO: Navegar para AddBudgetScreen
            console.log('Add budget')
          }}
        >
          <Ionicons name="add" size={24} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      {/* Summary Card */}
      <SummaryCard />

      {/* Filters */}
      <View style={styles.filtersContainer}>
        <FilterButton 
          filter="ativos" 
          label="Ativos" 
          count={budgetsData?.orcamentos?.filter(b => b.status === 'ativo').length || 0}
          icon="checkmark-circle"
        />
        <FilterButton 
          filter="excedidos" 
          label="Excedidos" 
          count={budgetsData?.orcamentos?.filter(b => b.porcentagemGasta >= 100).length || 0}
          icon="warning"
        />
        <FilterButton 
          filter="todos" 
          label="Todos" 
          count={budgetsData?.orcamentos?.length || 0}
          icon="list"
        />
      </View>

      {/* Budgets List */}
      {filteredBudgets.length === 0 ? (
        <View style={styles.emptyState}>
          <View style={styles.emptyStateIcon}>
            <Ionicons name="wallet-outline" size={64} color={theme.textSecondary} />
          </View>
          <Text style={styles.emptyStateText}>
            {selectedFilter === 'ativos' 
              ? 'Nenhum orçamento ativo' 
              : selectedFilter === 'excedidos'
                ? 'Nenhum orçamento excedido'
                : 'Nenhum orçamento criado ainda'
            }
          </Text>
          <Text style={styles.emptyStateSubtext}>
            {selectedFilter === 'todos'
              ? 'Crie orçamentos para controlar seus gastos por categoria'
              : selectedFilter === 'ativos'
                ? 'Crie um novo orçamento ou reative um orçamento pausado'
                : 'Mantenha seus gastos dentro dos limites planejados!'
            }
          </Text>
          {selectedFilter === 'todos' && (
            <Button
              title="Criar Primeiro Orçamento"
              onPress={() => {
                // TODO: Navegar para AddBudgetScreen
                console.log('Create first budget')
              }}
            />
          )}
        </View>
      ) : (
        <FlatList
          data={filteredBudgets}
          keyExtractor={(item) => item._id}
          renderItem={({ item }) => <BudgetCard budget={item} />}
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