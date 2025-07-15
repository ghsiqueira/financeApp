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
  Modal,
  ScrollView,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { LinearGradient } from 'expo-linear-gradient'
import { useFocusEffect } from '@react-navigation/native'

import { useTheme } from '../../context/ThemeContext'
import { useApi, useMutation } from '../../hooks/useApi'
import Button from '../../components/common/Button'
import LoadingSpinner from '../../components/common/LoadingSpinner'
import Input from '../../components/common/Input'

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
  transacoes?: Array<{
    _id: string
    descricao: string
    valor: number
    data: string
  }>
  historico?: Array<{
    mes: string
    valorGasto: number
    valorLimite: number
    porcentagemGasta: number
  }>
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
    economiaTotal: number
    mediaMensal: number
  }
  estatisticas: {
    categoriasMaisGastas: Array<{
      categoria: string
      valor: number
      porcentagem: number
    }>
    tendenciaMensal: Array<{
      mes: string
      valor: number
    }>
    eficienciaOrcamentos: number
  }
}

interface Category {
  _id: string
  nome: string
  icone: string
  cor: string
}

export default function BudgetsScreen({ navigation }: any) {
  const { theme } = useTheme()
  const [selectedFilter, setSelectedFilter] = useState<'ativos' | 'excedidos' | 'pausados' | 'todos'>('ativos')
  const [showDetailsModal, setShowDetailsModal] = useState(false)
  const [selectedBudget, setSelectedBudget] = useState<Budget | null>(null)
  const [showQuickEditModal, setShowQuickEditModal] = useState(false)
  const [quickEditValue, setQuickEditValue] = useState('')
  const [showStatsModal, setShowStatsModal] = useState(false)

  const { 
    data: budgetsDataResponse, 
    loading, 
    error, 
    refresh 
  } = useApi<any>('/budgets')

  const budgetsData = budgetsDataResponse?.data || null

  const { data: categoriesResponse } = useApi<any>('/categories?tipo=despesa')
  const categories = categoriesResponse?.data || []

  const { mutate: updateBudget, loading: updating } = useMutation()

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
      year: 'numeric'
    })
  }

  const getStatusColor = (budget: Budget) => {
    if (budget.status === 'pausado') return theme.textSecondary
    if (budget.porcentagemGasta >= 100) return theme.error
    if (budget.porcentagemGasta >= 80) return theme.warning
    return theme.success
  }

  const getStatusText = (budget: Budget) => {
    if (budget.status === 'pausado') return 'Pausado'
    if (budget.porcentagemGasta >= 100) return 'Excedido'
    if (budget.porcentagemGasta >= 90) return 'Crítico'
    if (budget.porcentagemGasta >= 80) return 'Atenção'
    return 'No controle'
  }

  const getStatusIcon = (budget: Budget) => {
    if (budget.status === 'pausado') return 'pause-circle'
    if (budget.porcentagemGasta >= 100) return 'alert-circle'
    if (budget.porcentagemGasta >= 80) return 'warning'
    return 'checkmark-circle'
  }

  const getDaysRemainingColor = (days: number) => {
    if (days <= 3) return theme.error
    if (days <= 7) return theme.warning
    return theme.textSecondary
  }

  const handlePauseBudget = async (budgetId: string, currentStatus: string) => {
    const action = currentStatus === 'ativo' ? 'pausar' : 'reativar'
    
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
              await updateBudget('put', `/budgets/${budgetId}/${action}`)
              refresh()
            } catch (error: any) {
              Alert.alert('Erro', error.message || `Erro ao ${action} orçamento`)
            }
          }
        }
      ]
    )
  }

  const handleDeleteBudget = async (budgetId: string) => {
    Alert.alert(
      'Excluir Orçamento',
      'Tem certeza que deseja excluir este orçamento? Esta ação não pode ser desfeita.',
      [
        { text: 'Cancelar', style: 'cancel' },
        { 
          text: 'Excluir', 
          style: 'destructive',
          onPress: async () => {
            try {
              await updateBudget('delete', `/budgets/${budgetId}`)
              refresh()
            } catch (error: any) {
              Alert.alert('Erro', error.message || 'Erro ao excluir orçamento')
            }
          }
        }
      ]
    )
  }

  const handleQuickEdit = async () => {
    if (!selectedBudget || !quickEditValue) return

    try {
      await updateBudget('put', `/budgets/${selectedBudget._id}`, { valorLimite: parseFloat(quickEditValue) })
      setShowQuickEditModal(false)
      setQuickEditValue('')
      setSelectedBudget(null)
      refresh()
    } catch (error: any) {
      Alert.alert('Erro', error.message || 'Erro ao atualizar orçamento')
    }
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
            try {
              await updateBudget('post', `/budgets/${budgetId}/renew`)
              refresh()
            } catch (error: any) {
              Alert.alert('Erro', error.message || 'Erro ao renovar orçamento')
            }
          }
        }
      ]
    )
  }

  const getCategoryName = (categoryId: string) => {
    const category = categories?.find((cat: Category) => cat._id === categoryId)
    return category?.nome || 'Categoria'
  }

  const getCategoryIcon = (categoryId: string) => {
    const category = categories?.find((cat: Category) => cat._id === categoryId)
    return category?.icone || 'wallet'
  }

  const SummaryCard = () => (
    <View style={styles.summaryCard}>
      <LinearGradient
        colors={[theme.primary, theme.primary + '80']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.summaryGradient}
      >
        <View style={styles.summaryHeader}>
          <Text style={styles.summaryTitle}>Resumo dos Orçamentos</Text>
          <TouchableOpacity 
            style={styles.statsButton}
            onPress={() => setShowStatsModal(true)}
          >
            <Ionicons name="stats-chart" size={20} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
        
        <View style={styles.summaryContent}>
          <View style={styles.summaryRow}>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>Total Limite</Text>
              <Text style={styles.summaryValue}>
                {formatCurrency(budgetsData?.resumo?.totalLimite || 0)}
              </Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>Total Gasto</Text>
              <Text style={styles.summaryValue}>
                {formatCurrency(budgetsData?.resumo?.totalGasto || 0)}
              </Text>
            </View>
          </View>
          
          <View style={styles.summaryRow}>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>Restante</Text>
              <Text style={styles.summaryValue}>
                {formatCurrency(budgetsData?.resumo?.totalRestante || 0)}
              </Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>Economia</Text>
              <Text style={styles.summaryValue}>
                {formatCurrency(budgetsData?.resumo?.economiaTotal || 0)}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.summaryAlerts}>
          {(budgetsData?.resumo?.excedidos || 0) > 0 && (
            <View style={styles.alertItem}>
              <Ionicons name="alert-circle" size={16} color="#FFFFFF" />
              <Text style={styles.alertText}>
                {budgetsData?.resumo?.excedidos} excedido(s)
              </Text>
            </View>
          )}
          {(budgetsData?.resumo?.vencendoEm7Dias || 0) > 0 && (
            <View style={styles.alertItem}>
              <Ionicons name="time" size={16} color="#FFFFFF" />
              <Text style={styles.alertText}>
                {budgetsData?.resumo?.vencendoEm7Dias} vencendo em 7 dias
              </Text>
            </View>
          )}
        </View>
      </LinearGradient>
    </View>
  )

  const FilterButton = ({ filter, label, icon, count }: { 
    filter: typeof selectedFilter, 
    label: string, 
    icon: string,
    count?: number 
  }) => (
    <TouchableOpacity
      style={[
        styles.filterButton,
        selectedFilter === filter && styles.filterButtonActive
      ]}
      onPress={() => setSelectedFilter(filter)}
    >
      <Ionicons 
        name={icon as any} 
        size={16} 
        color={selectedFilter === filter ? '#FFFFFF' : theme.textSecondary} 
      />
      <Text style={[
        styles.filterButtonText,
        selectedFilter === filter && styles.filterButtonTextActive
      ]}>
        {label}
      </Text>
      {count !== undefined && count > 0 && (
        <View style={[
          styles.filterBadge,
          { backgroundColor: selectedFilter === filter ? '#FFFFFF' : theme.primary }
        ]}>
          <Text style={[
            styles.filterBadgeText,
            { color: selectedFilter === filter ? theme.primary : '#FFFFFF' }
          ]}>
            {count}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  )

  const BudgetItem = ({ item }: { item: Budget }) => (
    <TouchableOpacity 
      style={[
        styles.budgetItem,
        item.status === 'pausado' && styles.budgetItemPaused
      ]}
      onPress={() => {
        setSelectedBudget(item)
        setShowDetailsModal(true)
      }}
    >
      <View style={styles.budgetHeader}>
        <View style={[styles.budgetIcon, { backgroundColor: item.cor + '20' }]}>
          <Ionicons 
            name={getCategoryIcon(item.categoria) as any} 
            size={24} 
            color={item.cor} 
          />
        </View>
        
        <View style={styles.budgetInfo}>
          <View style={styles.budgetTitleRow}>
            <Text style={styles.budgetName}>{item.nome}</Text>
            <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item) + '20' }]}>
              <Ionicons 
                name={getStatusIcon(item) as any} 
                size={12} 
                color={getStatusColor(item)} 
              />
              <Text style={[styles.statusText, { color: getStatusColor(item) }]}>
                {getStatusText(item)}
              </Text>
            </View>
          </View>
          <Text style={styles.budgetCategory}>{getCategoryName(item.categoria)}</Text>
          <Text style={styles.budgetPeriod}>
            {item.periodo} • {formatDate(item.dataInicio)} - {formatDate(item.dataFim)}
          </Text>
        </View>
        
        <View style={styles.budgetActions}>
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => {
              setSelectedBudget(item)
              setQuickEditValue(item.valorLimite.toString())
              setShowQuickEditModal(true)
            }}
          >
            <Ionicons name="pencil" size={16} color={theme.textSecondary} />
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => handlePauseBudget(item._id, item.status)}
          >
            <Ionicons 
              name={item.status === 'ativo' ? 'pause' : 'play'} 
              size={16} 
              color={theme.textSecondary} 
            />
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => handleDeleteBudget(item._id)}
          >
            <Ionicons name="trash-outline" size={16} color={theme.error} />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.budgetProgress}>
        <View style={styles.progressHeader}>
          <Text style={styles.progressText}>
            {formatCurrency(item.valorGasto)} de {formatCurrency(item.valorLimite)}
          </Text>
          <Text style={[styles.percentageText, { color: getStatusColor(item) }]}>
            {item.porcentagemGasta.toFixed(0)}%
          </Text>
        </View>
        
        <View style={styles.progressBarContainer}>
          <View style={[styles.progressBar, { backgroundColor: theme.border }]}>
            <View 
              style={[
                styles.progressFill,
                { 
                  width: `${Math.min(item.porcentagemGasta, 100)}%`,
                  backgroundColor: getStatusColor(item)
                }
              ]} 
            />
          </View>
        </View>
      </View>

      <View style={styles.budgetFooter}>
        <View style={styles.budgetStats}>
          <View style={styles.statItem}>
            <Ionicons name="wallet" size={14} color={theme.textSecondary} />
            <Text style={styles.statText}>
              Restante: {formatCurrency(item.valorRestante)}
            </Text>
          </View>
          
          <View style={styles.statItem}>
            <Ionicons 
              name="time" 
              size={14} 
              color={getDaysRemainingColor(item.diasRestantes)} 
            />
            <Text style={[
              styles.statText,
              { color: getDaysRemainingColor(item.diasRestantes) }
            ]}>
              {item.diasRestantes > 0 ? `${item.diasRestantes} dias` : 'Vencido'}
            </Text>
          </View>
        </View>

        {item.diasRestantes <= 0 && item.renovacaoAutomatica && (
          <TouchableOpacity 
            style={styles.renewButton}
            onPress={() => handleRenewBudget(item._id)}
          >
            <Ionicons name="refresh" size={14} color={theme.primary} />
            <Text style={styles.renewButtonText}>Renovar</Text>
          </TouchableOpacity>
        )}
      </View>
    </TouchableOpacity>
  )

  const BudgetDetailsModal = () => (
    <Modal
      visible={showDetailsModal}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={() => setShowDetailsModal(false)}
    >
      <SafeAreaView style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <TouchableOpacity onPress={() => setShowDetailsModal(false)}>
            <Ionicons name="close" size={24} color={theme.text} />
          </TouchableOpacity>
          <Text style={styles.modalTitle}>Detalhes do Orçamento</Text>
          <TouchableOpacity 
            onPress={() => {
              setShowDetailsModal(false)
              navigation.navigate('AddBudget', { budget: selectedBudget })
            }}
          >
            <Ionicons name="pencil" size={24} color={theme.primary} />
          </TouchableOpacity>
        </View>

        {selectedBudget && (
          <ScrollView style={styles.modalContent}>
            <View style={styles.detailCard}>
              <View style={styles.detailHeader}>
                <View style={[styles.detailIcon, { backgroundColor: selectedBudget.cor + '20' }]}>
                  <Ionicons 
                    name={getCategoryIcon(selectedBudget.categoria) as any} 
                    size={32} 
                    color={selectedBudget.cor} 
                  />
                </View>
                <View style={styles.detailInfo}>
                  <Text style={styles.detailTitle}>{selectedBudget.nome}</Text>
                  <Text style={styles.detailSubtitle}>{getCategoryName(selectedBudget.categoria)}</Text>
                </View>
              </View>

              <View style={styles.detailProgress}>
                <View style={styles.progressBarContainer}>
                  <View style={[styles.progressBar, { backgroundColor: theme.border }]}>
                    <View 
                      style={[
                        styles.progressFill,
                        { 
                          width: `${Math.min(selectedBudget.porcentagemGasta, 100)}%`,
                          backgroundColor: getStatusColor(selectedBudget)
                        }
                      ]} 
                    />
                  </View>
                </View>
                <Text style={styles.detailProgressText}>
                  {selectedBudget.porcentagemGasta.toFixed(1)}% utilizado
                </Text>
              </View>

              <View style={styles.detailStats}>
                <View style={styles.detailStatItem}>
                  <Text style={styles.detailStatLabel}>Limite</Text>
                  <Text style={styles.detailStatValue}>
                    {formatCurrency(selectedBudget.valorLimite)}
                  </Text>
                </View>
                <View style={styles.detailStatItem}>
                  <Text style={styles.detailStatLabel}>Gasto</Text>
                  <Text style={[styles.detailStatValue, { color: theme.error }]}>
                    {formatCurrency(selectedBudget.valorGasto)}
                  </Text>
                </View>
                <View style={styles.detailStatItem}>
                  <Text style={styles.detailStatLabel}>Restante</Text>
                  <Text style={[styles.detailStatValue, { color: theme.success }]}>
                    {formatCurrency(selectedBudget.valorRestante)}
                  </Text>
                </View>
              </View>
            </View>

            {/* Transações recentes */}
            {selectedBudget.transacoes && selectedBudget.transacoes.length > 0 && (
              <View style={styles.detailCard}>
                <Text style={styles.detailSectionTitle}>Transações Recentes</Text>
                {selectedBudget.transacoes.slice(0, 5).map((transaction, index) => (
                  <View key={index} style={styles.transactionItem}>
                    <View style={styles.transactionInfo}>
                      <Text style={styles.transactionDescription}>
                        {transaction.descricao}
                      </Text>
                      <Text style={styles.transactionDate}>
                        {formatDate(transaction.data)}
                      </Text>
                    </View>
                    <Text style={styles.transactionValue}>
                      -{formatCurrency(transaction.valor)}
                    </Text>
                  </View>
                ))}
              </View>
            )}

            {/* Histórico */}
            {selectedBudget.historico && selectedBudget.historico.length > 0 && (
              <View style={styles.detailCard}>
                <Text style={styles.detailSectionTitle}>Histórico Mensal</Text>
                {selectedBudget.historico.map((month, index) => (
                  <View key={index} style={styles.historyItem}>
                    <Text style={styles.historyMonth}>{month.mes}</Text>
                    <View style={styles.historyProgress}>
                      <View style={[styles.progressBar, { backgroundColor: theme.border }]}>
                        <View 
                          style={[
                            styles.progressFill,
                            { 
                              width: `${Math.min(month.porcentagemGasta, 100)}%`,
                              backgroundColor: month.porcentagemGasta >= 100 ? theme.error : theme.primary
                            }
                          ]} 
                        />
                      </View>
                    </View>
                    <Text style={styles.historyValue}>
                      {formatCurrency(month.valorGasto)} / {formatCurrency(month.valorLimite)}
                    </Text>
                  </View>
                ))}
              </View>
            )}
          </ScrollView>
        )}
      </SafeAreaView>
    </Modal>
  )

  const QuickEditModal = () => (
    <Modal
      visible={showQuickEditModal}
      animationType="slide"
      presentationStyle="formSheet"
      onRequestClose={() => setShowQuickEditModal(false)}
    >
      <SafeAreaView style={styles.quickEditContainer}>
        <View style={styles.quickEditHeader}>
          <TouchableOpacity onPress={() => setShowQuickEditModal(false)}>
            <Text style={styles.quickEditCancel}>Cancelar</Text>
          </TouchableOpacity>
          <Text style={styles.quickEditTitle}>Editar Limite</Text>
          <TouchableOpacity onPress={handleQuickEdit} disabled={updating}>
            <Text style={[styles.quickEditSave, { opacity: updating ? 0.5 : 1 }]}>
              Salvar
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.quickEditContent}>
          <Text style={styles.quickEditLabel}>
            Novo limite para "{selectedBudget?.nome}"
          </Text>
          <Input
            value={quickEditValue}
            onChangeText={setQuickEditValue}
            placeholder="0,00"
            keyboardType="numeric"
            autoFocus
          />
        </View>
      </SafeAreaView>
    </Modal>
  )

  const StatsModal = () => (
    <Modal
      visible={showStatsModal}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={() => setShowStatsModal(false)}
    >
      <SafeAreaView style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <TouchableOpacity onPress={() => setShowStatsModal(false)}>
            <Ionicons name="close" size={24} color={theme.text} />
          </TouchableOpacity>
          <Text style={styles.modalTitle}>Estatísticas</Text>
          <View style={{ width: 24 }} />
        </View>

        <ScrollView style={styles.modalContent}>
          <View style={styles.statsCard}>
            <Text style={styles.statsTitle}>Eficiência dos Orçamentos</Text>
            <Text style={styles.statsValue}>
              {(budgetsData?.estatisticas?.eficienciaOrcamentos || 0).toFixed(1)}%
            </Text>
            <Text style={styles.statsDescription}>
              Porcentagem de orçamentos que ficaram dentro do limite
            </Text>
          </View>

          <View style={styles.statsCard}>
            <Text style={styles.statsTitle}>Categorias Mais Gastas</Text>
            {budgetsData?.estatisticas?.categoriasMaisGastas?.map((cat: any, index: number) => (
              <View key={index} style={styles.categoryStatItem}>
                <Text style={styles.categoryStatName}>{cat.categoria}</Text>
                <View style={styles.categoryStatBar}>
                  <View 
                    style={[
                      styles.categoryStatFill,
                      { width: `${cat.porcentagem}%`, backgroundColor: theme.primary }
                    ]} 
                  />
                </View>
                <Text style={styles.categoryStatValue}>{formatCurrency(cat.valor)}</Text>
              </View>
            ))}
          </View>

          <View style={styles.statsCard}>
            <Text style={styles.statsTitle}>Média Mensal</Text>
            <Text style={styles.statsValue}>
              {formatCurrency(budgetsData?.resumo?.mediaMensal || 0)}
            </Text>
            <Text style={styles.statsDescription}>
              Valor médio gasto por mês nos últimos 6 meses
            </Text>
          </View>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  )

  const filteredBudgets = budgetsData?.orcamentos?.filter((budget: Budget) => {
    switch (selectedFilter) {
      case 'ativos':
        return budget.status === 'ativo'
      case 'excedidos':
        return budget.porcentagemGasta >= 100
      case 'pausados':
        return budget.status === 'pausado'
      default:
        return true
    }
  }) || []

  const getFilterCount = (filter: string) => {
    switch (filter) {
      case 'excedidos':
        return budgetsData?.resumo?.excedidos || 0
      case 'pausados':
        return budgetsData?.orcamentos?.filter((b: Budget) => b.status === 'pausado').length || 0
      default:
        return undefined
    }
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
    title: {
      fontSize: 24,
      fontWeight: 'bold',
      color: theme.text,
    },
    addButton: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: theme.primary,
      alignItems: 'center',
      justifyContent: 'center',
    },
    summaryCard: {
      marginHorizontal: 20,
      marginVertical: 16,
      borderRadius: 16,
      overflow: 'hidden',
      elevation: 4,
      shadowColor: theme.shadow,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
    },
    summaryGradient: {
      padding: 20,
    },
    summaryHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 16,
    },
    summaryTitle: {
      fontSize: 18,
      fontWeight: 'bold',
      color: '#FFFFFF',
    },
    statsButton: {
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: 'rgba(255, 255, 255, 0.2)',
      alignItems: 'center',
      justifyContent: 'center',
    },
    summaryContent: {
      marginBottom: 16,
    },
    summaryRow: {
      flexDirection: 'row',
      marginBottom: 12,
    },
    summaryItem: {
      flex: 1,
      alignItems: 'center',
    },
    summaryLabel: {
      fontSize: 12,
      color: 'rgba(255, 255, 255, 0.8)',
      marginBottom: 4,
    },
    summaryValue: {
      fontSize: 16,
      fontWeight: 'bold',
      color: '#FFFFFF',
    },
    summaryAlerts: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
    },
    alertItem: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: 'rgba(255, 255, 255, 0.15)',
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 12,
      gap: 4,
    },
    alertText: {
      fontSize: 12,
      color: '#FFFFFF',
    },
    filtersContainer: {
      flexDirection: 'row',
      paddingHorizontal: 20,
      marginBottom: 16,
      gap: 8,
    },
    filterButton: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 8,
      paddingHorizontal: 12,
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
    filterBadge: {
      minWidth: 20,
      height: 20,
      borderRadius: 10,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 6,
    },
    filterBadgeText: {
      fontSize: 12,
      fontWeight: 'bold',
    },
    budgetItem: {
      backgroundColor: theme.surface,
      marginHorizontal: 20,
      marginBottom: 12,
      borderRadius: 12,
      padding: 16,
      borderWidth: 1,
      borderColor: theme.border,
    },
    budgetItemPaused: {
      opacity: 0.7,
    },
    budgetHeader: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      marginBottom: 12,
    },
    budgetIcon: {
      width: 48,
      height: 48,
      borderRadius: 24,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 12,
    },
    budgetInfo: {
      flex: 1,
    },
    budgetTitleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 4,
    },
    budgetName: {
      fontSize: 16,
      fontWeight: '600',
      color: theme.text,
      flex: 1,
    },
    statusBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 12,
      gap: 4,
    },
    statusText: {
      fontSize: 12,
      fontWeight: '600',
    },
    budgetCategory: {
      fontSize: 14,
      color: theme.textSecondary,
      marginBottom: 2,
    },
    budgetPeriod: {
      fontSize: 12,
      color: theme.textSecondary,
    },
    budgetActions: {
      flexDirection: 'row',
      gap: 8,
      marginLeft: 12,
    },
    actionButton: {
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: theme.background,
      alignItems: 'center',
      justifyContent: 'center',
    },
    budgetProgress: {
      marginBottom: 12,
    },
    progressHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 8,
    },
    progressText: {
      fontSize: 14,
      color: theme.text,
      fontWeight: '500',
    },
    percentageText: {
      fontSize: 14,
      fontWeight: 'bold',
    },
    progressBarContainer: {
      marginBottom: 4,
    },
    progressBar: {
      height: 8,
      borderRadius: 4,
      overflow: 'hidden',
    },
    progressFill: {
      height: '100%',
      borderRadius: 4,
    },
    budgetFooter: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    budgetStats: {
      flex: 1,
      gap: 4,
    },
    statItem: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    statText: {
      fontSize: 12,
      color: theme.textSecondary,
    },
    renewButton: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.primary + '20',
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 16,
      gap: 4,
    },
    renewButtonText: {
      fontSize: 12,
      color: theme.primary,
      fontWeight: '600',
    },
    modalContainer: {
      flex: 1,
      backgroundColor: theme.background,
    },
    modalHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 20,
      paddingVertical: 16,
      borderBottomWidth: 1,
      borderBottomColor: theme.border,
    },
    modalTitle: {
      fontSize: 18,
      fontWeight: 'bold',
      color: theme.text,
    },
    modalContent: {
      flex: 1,
      padding: 20,
    },
    detailCard: {
      backgroundColor: theme.surface,
      borderRadius: 12,
      padding: 16,
      marginBottom: 16,
      borderWidth: 1,
      borderColor: theme.border,
    },
    detailHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 16,
    },
    detailIcon: {
      width: 56,
      height: 56,
      borderRadius: 28,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 16,
    },
    detailInfo: {
      flex: 1,
    },
    detailTitle: {
      fontSize: 20,
      fontWeight: 'bold',
      color: theme.text,
      marginBottom: 4,
    },
    detailSubtitle: {
      fontSize: 16,
      color: theme.textSecondary,
    },
    detailProgress: {
      marginBottom: 16,
    },
    detailProgressText: {
      fontSize: 14,
      color: theme.text,
      textAlign: 'center',
      marginTop: 8,
    },
    detailStats: {
      flexDirection: 'row',
      justifyContent: 'space-around',
    },
    detailStatItem: {
      alignItems: 'center',
    },
    detailStatLabel: {
      fontSize: 12,
      color: theme.textSecondary,
      marginBottom: 4,
    },
    detailStatValue: {
      fontSize: 16,
      fontWeight: 'bold',
      color: theme.text,
    },
    detailSectionTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: theme.text,
      marginBottom: 12,
    },
    transactionItem: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 8,
      borderBottomWidth: 1,
      borderBottomColor: theme.border,
    },
    transactionInfo: {
      flex: 1,
    },
    transactionDescription: {
      fontSize: 14,
      color: theme.text,
      fontWeight: '500',
    },
    transactionDate: {
      fontSize: 12,
      color: theme.textSecondary,
    },
    transactionValue: {
      fontSize: 14,
      color: theme.error,
      fontWeight: '600',
    },
    historyItem: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 8,
      gap: 12,
    },
    historyMonth: {
      fontSize: 12,
      color: theme.textSecondary,
      minWidth: 60,
    },
    historyProgress: {
      flex: 1,
    },
    historyValue: {
      fontSize: 12,
      color: theme.text,
      minWidth: 120,
      textAlign: 'right',
    },
    quickEditContainer: {
      flex: 1,
      backgroundColor: theme.background,
    },
    quickEditHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 20,
      paddingVertical: 16,
      borderBottomWidth: 1,
      borderBottomColor: theme.border,
    },
    quickEditCancel: {
      fontSize: 16,
      color: theme.textSecondary,
    },
    quickEditTitle: {
      fontSize: 18,
      fontWeight: 'bold',
      color: theme.text,
    },
    quickEditSave: {
      fontSize: 16,
      color: theme.primary,
      fontWeight: '600',
    },
    quickEditContent: {
      padding: 20,
    },
    quickEditLabel: {
      fontSize: 16,
      color: theme.text,
      marginBottom: 16,
    },
    statsCard: {
      backgroundColor: theme.surface,
      borderRadius: 12,
      padding: 16,
      marginBottom: 16,
      borderWidth: 1,
      borderColor: theme.border,
    },
    statsTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: theme.text,
      marginBottom: 8,
    },
    statsValue: {
      fontSize: 24,
      fontWeight: 'bold',
      color: theme.primary,
      marginBottom: 4,
    },
    statsDescription: {
      fontSize: 14,
      color: theme.textSecondary,
    },
    categoryStatItem: {
      marginBottom: 12,
    },
    categoryStatName: {
      fontSize: 14,
      color: theme.text,
      marginBottom: 4,
    },
    categoryStatBar: {
      height: 6,
      backgroundColor: theme.border,
      borderRadius: 3,
      marginBottom: 4,
    },
    categoryStatFill: {
      height: '100%',
      borderRadius: 3,
    },
    categoryStatValue: {
      fontSize: 12,
      color: theme.textSecondary,
      textAlign: 'right',
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

  if (loading && !budgetsData) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <LoadingSpinner />
          <Text style={{ color: theme.textSecondary, marginTop: 16 }}>
            Carregando orçamentos...
          </Text>
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
            navigation.navigate('AddBudget')
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
          icon="checkmark-circle" 
        />
        <FilterButton 
          filter="excedidos" 
          label="Excedidos" 
          icon="alert-circle" 
          count={getFilterCount('excedidos')}
        />
        <FilterButton 
          filter="pausados" 
          label="Pausados" 
          icon="pause-circle" 
          count={getFilterCount('pausados')}
        />
        <FilterButton 
          filter="todos" 
          label="Todos" 
          icon="list" 
        />
      </View>

      {/* Budget List */}
      {filteredBudgets.length === 0 ? (
        <View style={styles.emptyState}>
          <View style={styles.emptyStateIcon}>
            <Ionicons name="wallet-outline" size={64} color={theme.textSecondary} />
          </View>
          <Text style={styles.emptyStateText}>
            {selectedFilter === 'todos' ? 'Nenhum orçamento ainda' : `Nenhum orçamento ${selectedFilter}`}
          </Text>
          <Text style={styles.emptyStateSubtext}>
            {selectedFilter === 'todos' 
              ? 'Crie orçamentos para controlar melhor seus gastos por categoria'
              : `Não há orçamentos ${selectedFilter} no momento`
            }
          </Text>
          {selectedFilter === 'todos' && (
            <Button
              title="Criar Orçamento"
              onPress={() => {
                navigation.navigate('AddBudget')
              }}
            />
          )}
        </View>
      ) : (
        <FlatList
          data={filteredBudgets}
          keyExtractor={(item) => item._id}
          renderItem={({ item }) => <BudgetItem item={item} />}
          refreshControl={
            <RefreshControl refreshing={loading} onRefresh={refresh} />
          }
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 20 }}
        />
      )}

      {/* Modals */}
      <BudgetDetailsModal />
      <QuickEditModal />
      <StatsModal />
    </SafeAreaView>
  )
}