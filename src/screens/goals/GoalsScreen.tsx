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

interface Goal {
  _id: string
  titulo: string
  descricao?: string
  valorAlvo: number
  valorAtual: number
  dataInicio: string
  dataLimite: string
  prioridade: 'baixa' | 'media' | 'alta'
  categoria: string
  status: 'ativa' | 'pausada' | 'concluida' | 'cancelada'
  cor: string
  icone: string
  porcentagemConcluida: number
  valorRestante: number
  diasRestantes: number
  valorMensalNecessario: number
  valorDiarioNecessario: number
}

interface GoalsData {
  metas: Goal[]
  estatisticas: {
    total: number
    concluidas: number
    ativas: number
    valorTotalAlvo: number
    valorTotalAtual: number
    porcentagemGeralConcluida: number
  }
}

export default function GoalsScreen({ navigation }: any) {
  const { theme } = useTheme()
  const [selectedFilter, setSelectedFilter] = useState<'todas' | 'ativas' | 'concluidas'>('ativas')

  const { 
    data: goalsDataResponse, 
    loading, 
    error, 
    refresh 
  } = useApi<any>('/goals')

  const goalsData = goalsDataResponse?.data || null

  const { mutate: updateGoal } = useMutation()

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

  const handleAddContribution = (goalId: string) => {
    Alert.prompt(
      'Adicionar Contribuição',
      'Digite o valor da contribuição:',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Adicionar',
          onPress: async (value) => {
            if (value && !isNaN(parseFloat(value))) {
              try {
                await updateGoal('post', `/goals/${goalId}/contribute`, {
                  valor: parseFloat(value),
                  observacoes: 'Contribuição manual'
                })
                refresh()
              } catch (error: any) {
                Alert.alert('Erro', error.message || 'Erro ao adicionar contribuição')
              }
            }
          }
        }
      ],
      'plain-text',
      '',
      'numeric'
    )
  }

  const handlePauseGoal = async (goalId: string) => {
    try {
      await updateGoal('put', `/goals/${goalId}/status`, { status: 'pausada' })
      refresh()
    } catch (error: any) {
      Alert.alert('Erro', error.message || 'Erro ao pausar meta')
    }
  }

  const handleReactivateGoal = async (goalId: string) => {
    try {
      await updateGoal('put', `/goals/${goalId}/status`, { status: 'ativa' })
      refresh()
    } catch (error: any) {
      Alert.alert('Erro', error.message || 'Erro ao reativar meta')
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'alta': return '#FF3B30'
      case 'media': return '#FF9500'
      case 'baixa': return '#34C759'
      default: return theme.textSecondary
    }
  }

  const getDaysUntilDeadline = (deadline: string) => {
    const days = Math.ceil((new Date(deadline).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
    return Math.max(0, days)
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

  const GoalCard = ({ goal }: { goal: Goal }) => {
    const isCompleted = goal.porcentagemConcluida >= 100
    const isOverdue = goal.diasRestantes === 0 && !isCompleted
    
    return (
      <View style={[styles.goalCard, { borderLeftColor: goal.cor }]}>
        <View style={styles.goalHeader}>
          <View style={styles.goalTitleContainer}>
            <View style={[styles.goalIcon, { backgroundColor: goal.cor + '20' }]}>
              <Ionicons name={goal.icone as any} size={20} color={goal.cor} />
            </View>
            <View style={styles.goalTitleText}>
              <Text style={styles.goalTitle}>{goal.titulo}</Text>
              <View style={styles.goalMeta}>
                <Text style={styles.goalCategory}>{goal.categoria}</Text>
                <View style={[styles.priorityBadge, { backgroundColor: getPriorityColor(goal.prioridade) + '20' }]}>
                  <Text style={[styles.priorityText, { color: getPriorityColor(goal.prioridade) }]}>
                    {goal.prioridade}
                  </Text>
                </View>
              </View>
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
                    text: 'Adicionar Contribuição', 
                    onPress: () => handleAddContribution(goal._id) 
                  },
                  { 
                    text: goal.status === 'ativa' ? 'Pausar' : 'Reativar',
                    onPress: () => goal.status === 'ativa' 
                      ? handlePauseGoal(goal._id) 
                      : handleReactivateGoal(goal._id)
                  },
                  { 
                    text: 'Editar', 
                    onPress: () => navigation.navigate('AddGoal', { goal }) 
                  },
                ]
              )
            }}
          >
            <Ionicons name="ellipsis-vertical" size={20} color={theme.textSecondary} />
          </TouchableOpacity>
        </View>

        {goal.descricao && (
          <Text style={styles.goalDescription} numberOfLines={2}>
            {goal.descricao}
          </Text>
        )}

        <View style={styles.goalProgress}>
          <View style={styles.goalValues}>
            <Text style={styles.currentValue}>
              {formatCurrency(goal.valorAtual)}
            </Text>
            <Text style={styles.targetValue}>
              de {formatCurrency(goal.valorAlvo)}
            </Text>
          </View>
          
          <ProgressBar progress={goal.porcentagemConcluida} color={goal.cor} />
          
          <View style={styles.goalStats}>
            <Text style={styles.progressPercentage}>
              {goal.porcentagemConcluida}% concluído
            </Text>
            <Text style={styles.remainingValue}>
              Falta: {formatCurrency(goal.valorRestante)}
            </Text>
          </View>
        </View>

        <View style={styles.goalFooter}>
          <View style={styles.timeInfo}>
            <Ionicons 
              name="time" 
              size={16} 
              color={isOverdue ? theme.error : theme.textSecondary} 
            />
            <Text style={[
              styles.timeText,
              { color: isOverdue ? theme.error : theme.textSecondary }
            ]}>
              {isOverdue 
                ? 'Prazo vencido' 
                : goal.diasRestantes === 0 
                  ? 'Vence hoje' 
                  : `${goal.diasRestantes} dias restantes`
              }
            </Text>
          </View>

          {!isCompleted && goal.valorMensalNecessario > 0 && (
            <View style={styles.suggestionInfo}>
              <Text style={styles.suggestionText}>
                {formatCurrency(goal.valorMensalNecessario)}/mês
              </Text>
            </View>
          )}
        </View>

        {isCompleted && (
          <View style={styles.completedBadge}>
            <Ionicons name="checkmark-circle" size={16} color={theme.success} />
            <Text style={styles.completedText}>Meta Concluída! 🎉</Text>
          </View>
        )}

        {goal.status === 'pausada' && (
          <View style={styles.pausedBadge}>
            <Ionicons name="pause-circle" size={16} color={theme.warning} />
            <Text style={styles.pausedText}>Pausada</Text>
          </View>
        )}
      </View>
    )
  }

  const SummaryCard = () => {
    if (!goalsData?.estatisticas) return null

    const stats = goalsData.estatisticas

    return (
      <LinearGradient
        colors={[theme.primary, theme.secondary]}
        style={styles.summaryCard}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={styles.summaryHeader}>
          <Text style={styles.summaryTitle}>Resumo das Metas</Text>
          <Text style={styles.summaryProgress}>
            {stats.porcentagemGeralConcluida}% do total
          </Text>
        </View>

        <View style={styles.summaryRow}>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryValue}>{stats.total}</Text>
            <Text style={styles.summaryLabel}>Total</Text>
          </View>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryValue}>{stats.ativas}</Text>
            <Text style={styles.summaryLabel}>Ativas</Text>
          </View>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryValue}>{stats.concluidas}</Text>
            <Text style={styles.summaryLabel}>Concluídas</Text>
          </View>
        </View>

        <View style={styles.summaryTotalRow}>
          <Text style={styles.summaryTotalLabel}>Valor Total das Metas</Text>
          <Text style={styles.summaryTotalValue}>
            {formatCurrency(stats.valorTotalAlvo)}
          </Text>
        </View>
      </LinearGradient>
    )
  }

  const FilterButton = ({ 
    filter, 
    label, 
    count 
  }: { 
    filter: typeof selectedFilter
    label: string
    count: number
  }) => (
    <TouchableOpacity
      style={[
        styles.filterButton,
        selectedFilter === filter && styles.filterButtonActive
      ]}
      onPress={() => setSelectedFilter(filter)}
    >
      <Text style={[
        styles.filterButtonText,
        selectedFilter === filter && styles.filterButtonTextActive
      ]}>
        {label} ({count})
      </Text>
    </TouchableOpacity>
  )

  const filteredGoals = goalsData?.metas?.filter((goal: Goal) => {
    switch (selectedFilter) {
      case 'ativas':
        return goal.status === 'ativa'
      case 'concluidas':
        return goal.status === 'concluida'
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
    summaryProgress: {
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
      fontSize: 24,
      fontWeight: 'bold',
      color: '#FFFFFF',
    },
    summaryLabel: {
      fontSize: 12,
      color: 'rgba(255, 255, 255, 0.8)',
      marginTop: 2,
    },
    summaryTotalRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingTop: 16,
      borderTopWidth: 1,
      borderTopColor: 'rgba(255, 255, 255, 0.2)',
    },
    summaryTotalLabel: {
      fontSize: 14,
      color: 'rgba(255, 255, 255, 0.8)',
    },
    summaryTotalValue: {
      fontSize: 16,
      fontWeight: 'bold',
      color: '#FFFFFF',
    },
    filtersContainer: {
      flexDirection: 'row',
      paddingHorizontal: 20,
      marginBottom: 20,
      gap: 8,
    },
    filterButton: {
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderRadius: 20,
      backgroundColor: theme.surface,
      borderWidth: 1,
      borderColor: theme.border,
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
    goalCard: {
      backgroundColor: theme.surface,
      marginHorizontal: 20,
      marginBottom: 16,
      borderRadius: 12,
      padding: 16,
      borderLeftWidth: 4,
      borderWidth: 1,
      borderColor: theme.border,
    },
    goalHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: 12,
    },
    goalTitleContainer: {
      flexDirection: 'row',
      flex: 1,
    },
    goalIcon: {
      width: 40,
      height: 40,
      borderRadius: 20,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 12,
    },
    goalTitleText: {
      flex: 1,
    },
    goalTitle: {
      fontSize: 16,
      fontWeight: 'bold',
      color: theme.text,
      marginBottom: 4,
    },
    goalMeta: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    goalCategory: {
      fontSize: 12,
      color: theme.textSecondary,
    },
    priorityBadge: {
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: 8,
    },
    priorityText: {
      fontSize: 10,
      fontWeight: '600',
      textTransform: 'uppercase',
    },
    menuButton: {
      padding: 4,
    },
    goalDescription: {
      fontSize: 14,
      color: theme.textSecondary,
      marginBottom: 16,
      lineHeight: 20,
    },
    goalProgress: {
      marginBottom: 12,
    },
    goalValues: {
      flexDirection: 'row',
      alignItems: 'baseline',
      marginBottom: 8,
      gap: 4,
    },
    currentValue: {
      fontSize: 20,
      fontWeight: 'bold',
      color: theme.text,
    },
    targetValue: {
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
    goalStats: {
      flexDirection: 'row',
      justifyContent: 'space-between',
    },
    progressPercentage: {
      fontSize: 12,
      fontWeight: '600',
      color: theme.text,
    },
    remainingValue: {
      fontSize: 12,
      color: theme.textSecondary,
    },
    goalFooter: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    timeInfo: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
    },
    timeText: {
      fontSize: 12,
    },
    suggestionInfo: {
      alignItems: 'flex-end',
    },
    suggestionText: {
      fontSize: 12,
      fontWeight: '600',
      color: theme.primary,
    },
    completedBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: 12,
      paddingVertical: 8,
      backgroundColor: theme.success + '10',
      borderRadius: 8,
      gap: 6,
    },
    completedText: {
      fontSize: 14,
      fontWeight: '600',
      color: theme.success,
    },
    pausedBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: 12,
      paddingVertical: 8,
      backgroundColor: theme.warning + '10',
      borderRadius: 8,
      gap: 6,
    },
    pausedText: {
      fontSize: 14,
      fontWeight: '600',
      color: theme.warning,
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

  if (loading && !goalsData) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.emptyState}>
          <Text style={{ color: theme.textSecondary }}>Carregando metas...</Text>
        </View>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Metas</Text>
        <TouchableOpacity 
          style={styles.addButton}
          onPress={() => {
            navigation.navigate('AddGoal')
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
          filter="todas" 
          label="Todas" 
          count={goalsData?.metas?.length || 0} 
        />
        <FilterButton 
          filter="ativas" 
          label="Ativas" 
          count={goalsData?.estatisticas?.ativas || 0} 
        />
        <FilterButton 
          filter="concluidas" 
          label="Concluídas" 
          count={goalsData?.estatisticas?.concluidas || 0} 
        />
      </View>

      {/* Goals List */}
      {filteredGoals.length === 0 ? (
        <View style={styles.emptyState}>
          <View style={styles.emptyStateIcon}>
            <Ionicons name="trophy-outline" size={64} color={theme.textSecondary} />
          </View>
          <Text style={styles.emptyStateText}>
            {selectedFilter === 'todas' 
              ? 'Nenhuma meta criada ainda' 
              : `Nenhuma meta ${selectedFilter === 'ativas' ? 'ativa' : 'concluída'}`
            }
          </Text>
          <Text style={styles.emptyStateSubtext}>
            {selectedFilter === 'todas'
              ? 'Defina suas metas financeiras e acompanhe seu progresso'
              : selectedFilter === 'ativas'
                ? 'Crie uma nova meta ou reative uma meta pausada'
                : 'Continue trabalhando em suas metas ativas!'
            }
          </Text>
          {selectedFilter === 'todas' && (
            <Button
              title="Criar Primeira Meta"
              onPress={() => {
                navigation.navigate('AddGoal')
              }}
            />
          )}
        </View>
      ) : (
        <FlatList
          data={filteredGoals}
          keyExtractor={(item) => item._id}
          renderItem={({ item }) => <GoalCard goal={item} />}
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