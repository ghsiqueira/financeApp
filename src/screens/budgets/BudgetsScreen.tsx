// src/screens/budgets/BudgetsScreen.tsx - Completo e atualizado
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
import { ProgressBar } from 'react-native-paper'
import { useFocusEffect } from '@react-navigation/native'

import { useTheme } from '../../context/ThemeContext'
import { useApi, useMutation } from '../../hooks/useApi'
import Button from '../../components/common/Button'
import LoadingSpinner from '../../components/common/LoadingSpinner'
import Input from '../../components/common/Input'

const { width } = Dimensions.get('window')

interface Category {
  _id: string
  nome: string
  icone: string
  cor: string
  tipo: 'receita' | 'despesa'
  descricao?: string
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
    alertas: {
      ativo: boolean
      porcentagens: number[]
      email: boolean
      push: boolean
    }
    renovacao: {
      rollover: boolean
      ajusteAutomatico: boolean
      percentualAjuste: number
      notificarRenovacao: boolean
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
  historico?: Array<{
    data: string
    acao: string
    valor?: number
    observacao?: string
    usuarioId?: string
  }>
  transacoes?: Array<{
    _id: string
    descricao: string
    valor: number
    data: string
    tipo: 'receita' | 'despesa'
    categoria: string
    metodoPagamento?: string
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
    comRenovacaoAutomatica: number
    economiaTotal?: number
    mediaMensal?: number
  }
  estatisticas?: {
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

export default function BudgetsScreen({ navigation }: any) {
  const { theme } = useTheme()
  const [selectedFilter, setSelectedFilter] = useState<'ativos' | 'excedidos' | 'pausados' | 'todos'>('ativos')
  const [showDetailsModal, setShowDetailsModal] = useState(false)
  const [selectedBudget, setSelectedBudget] = useState<Budget | null>(null)
  const [showQuickEditModal, setShowQuickEditModal] = useState(false)
  const [quickEditValue, setQuickEditValue] = useState('')
  const [showStatsModal, setShowStatsModal] = useState(false)

  // 🔧 BUSCAR DADOS
  const { 
    data: budgetsResponse, 
    loading: budgetsLoading, 
    error: budgetsError, 
    refresh: refreshBudgets 
  } = useApi<any>('/budgets')

  const { 
    data: categoriesResponse, 
    loading: categoriesLoading, 
    error: categoriesError,
    refresh: refreshCategories 
  } = useApi<any>('/categories?tipo=despesa')

  // 🔧 PROCESSAR DADOS COM SEGURANÇA
  const budgetsData: BudgetsData | null = React.useMemo(() => {
    if (budgetsResponse?.success && budgetsResponse?.data) {
      return budgetsResponse.data
    }
    return null
  }, [budgetsResponse])

  const categories: Category[] = React.useMemo(() => {
     if (categoriesResponse?.success && categoriesResponse?.data) {
       return Array.isArray(categoriesResponse.data.data) ? categoriesResponse.data.data : []
     }
     return []
  }, [categoriesResponse]);

  const { mutate: updateBudget, loading: updating } = useMutation()

  console.log('Categoriesasa:', categories);

  // 🔧 REFRESH GERAL
  const refresh = useCallback(() => {
    refreshBudgets()
    refreshCategories()
  }, [refreshBudgets, refreshCategories])

  useFocusEffect(
    useCallback(() => {
      refresh()
    }, [refresh])
  )

  // 🔧 DEBUG: Log para verificar dados (remover em produção)
  React.useEffect(() => {
    console.log('=== DEBUG BUDGETS SCREEN ===')
    console.log('budgetsResponse:', budgetsResponse)
    console.log('budgetsData:', budgetsData)
    console.log('categoriesResponse:', categoriesResponse)
    console.log('categories:', categories)
    console.log('budgetsLoading:', budgetsLoading)
    console.log('categoriesLoading:', categoriesLoading)
    console.log('budgetsError:', budgetsError)
    console.log('categoriesError:', categoriesError)
    console.log('=============================')
  }, [budgetsResponse, budgetsData, categoriesResponse, categories, budgetsLoading, categoriesLoading, budgetsError, categoriesError])

  // 🔧 FUNÇÕES AUXILIARES
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
    if (!Array.isArray(categories) || categories.length === 0) {
      return 'Categoria'
    }
    
    const category = categories.find((cat: Category) => cat._id === categoryId)
    return category?.nome || 'Categoria'
  }

  const getCategoryIcon = (categoryId: string) => {
    if (!Array.isArray(categories) || categories.length === 0) {
      return 'wallet'
    }
    
    const category = categories.find((cat: Category) => cat._id === categoryId)
    return category?.icone || 'wallet'
  }

  const getCategoryColor = (categoryId: string) => {
    if (!Array.isArray(categories) || categories.length === 0) {
      return theme.primary
    }
    
    const category = categories.find((cat: Category) => cat._id === categoryId)
    return category?.cor || theme.primary
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

  // 🔧 FILTRAR ORÇAMENTOS
  const filteredBudgets = React.useMemo(() => {
    if (!budgetsData?.orcamentos) return []

    return budgetsData.orcamentos.filter(budget => {
      switch (selectedFilter) {
        case 'ativos':
          return budget.status === 'ativo'
        case 'excedidos':
          return budget.porcentagemGasta >= 100
        case 'pausados':
          return budget.status === 'pausado'
        case 'todos':
        default:
          return true
      }
    })
  }, [budgetsData, selectedFilter])

  const getFilterCount = (filter: string) => {
    if (!budgetsData?.orcamentos) return 0

    switch (filter) {
      case 'excedidos':
        return budgetsData.resumo.excedidos
      case 'pausados':
        return budgetsData.orcamentos.filter(b => b.status === 'pausado').length
      case 'ativos':
        return budgetsData.orcamentos.filter(b => b.status === 'ativo').length
      default:
        return 0
    }
  }

  // 🔧 AÇÕES DOS ORÇAMENTOS
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
              Alert.alert('Sucesso', `Orçamento ${action === 'pausar' ? 'pausado' : 'reativado'} com sucesso!`)
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
              setShowDetailsModal(false)
              setSelectedBudget(null)
              refresh()
              Alert.alert('Sucesso', 'Orçamento excluído com sucesso!')
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
      const novoValor = parseFloat(quickEditValue.replace(/[^\d,]/g, '').replace(',', '.'))
      
      if (isNaN(novoValor) || novoValor <= 0) {
        Alert.alert('Erro', 'Por favor, insira um valor válido')
        return
      }

      await updateBudget('put', `/budgets/${selectedBudget._id}`, { 
        valorLimite: novoValor 
      })
      
      setShowQuickEditModal(false)
      setQuickEditValue('')
      setSelectedBudget(null)
      refresh()
      Alert.alert('Sucesso', 'Limite do orçamento atualizado com sucesso!')
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
              await updateBudget('post', `/budgets/renewal/${budgetId}/renew-now`)
              refresh()
              Alert.alert('Sucesso', 'Orçamento renovado com sucesso!')
            } catch (error: any) {
              Alert.alert('Erro', error.message || 'Erro ao renovar orçamento')
            }
          }
        }
      ]
    )
  }

  // 🔧 COMPONENTES
  const FilterButton = ({ filter, label, icon, count }: {
    filter: string
    label: string
    icon: string
    count?: number
  }) => (
    <TouchableOpacity
      style={[
        styles.filterButton,
        selectedFilter === filter && styles.filterButtonActive
      ]}
      onPress={() => setSelectedFilter(filter as any)}
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
          { backgroundColor: selectedFilter === filter ? 'rgba(255,255,255,0.3)' : theme.error }
        ]}>
          <Text style={[
            styles.filterBadgeText,
            { color: '#FFFFFF' }
          ]}>
            {count}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  )

  const SummaryCard = () => {
    if (!budgetsData?.resumo) return null

    return (
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
              <Ionicons name="bar-chart" size={16} color="#FFFFFF" />
            </TouchableOpacity>
          </View>

          <View style={styles.summaryContent}>
            <View style={styles.summaryRow}>
              <View style={styles.summaryItem}>
                <Text style={styles.summaryLabel}>Total Limite</Text>
                <Text style={styles.summaryValue}>
                  {formatCurrency(budgetsData.resumo.totalLimite)}
                </Text>
              </View>
              <View style={styles.summaryItem}>
                <Text style={styles.summaryLabel}>Total Gasto</Text>
                <Text style={styles.summaryValue}>
                  {formatCurrency(budgetsData.resumo.totalGasto)}
                </Text>
              </View>
            </View>

            <View style={styles.summaryRow}>
              <View style={styles.summaryItem}>
                <Text style={styles.summaryLabel}>Restante</Text>
                <Text style={styles.summaryValue}>
                  {formatCurrency(budgetsData.resumo.totalRestante)}
                </Text>
              </View>
              <View style={styles.summaryItem}>
                <Text style={styles.summaryLabel}>Renovação Auto</Text>
                <Text style={styles.summaryValue}>
                  {budgetsData.resumo.comRenovacaoAutomatica}
                </Text>
              </View>
            </View>
          </View>

          {(budgetsData.resumo.excedidos > 0 || budgetsData.resumo.emAlerta > 0 || budgetsData.resumo.vencendoEm7Dias > 0) && (
            <View style={styles.summaryAlerts}>
              {budgetsData.resumo.excedidos > 0 && (
                <View style={styles.alertItem}>
                  <Ionicons name="alert-circle" size={12} color="#FFFFFF" />
                  <Text style={styles.alertText}>
                    {budgetsData.resumo.excedidos} excedido{budgetsData.resumo.excedidos > 1 ? 's' : ''}
                  </Text>
                </View>
              )}
              {budgetsData.resumo.emAlerta > 0 && (
                <View style={styles.alertItem}>
                  <Ionicons name="warning" size={12} color="#FFFFFF" />
                  <Text style={styles.alertText}>
                    {budgetsData.resumo.emAlerta} em alerta
                  </Text>
                </View>
              )}
              {budgetsData.resumo.vencendoEm7Dias > 0 && (
                <View style={styles.alertItem}>
                  <Ionicons name="time" size={12} color="#FFFFFF" />
                  <Text style={styles.alertText}>
                    {budgetsData.resumo.vencendoEm7Dias} vencendo
                  </Text>
                </View>
              )}
            </View>
          )}
        </LinearGradient>
      </View>
    )
  }

  const BudgetItem = ({ budget }: { budget: Budget }) => (
    <TouchableOpacity
      style={[
        styles.budgetItem,
        budget.status === 'pausado' && styles.budgetItemPaused
      ]}
      onPress={() => {
        setSelectedBudget(budget)
        setShowDetailsModal(true)
      }}
    >
      <View style={styles.budgetHeader}>
        <View style={styles.budgetInfo}>
          <Text style={styles.budgetName}>{budget.nome}</Text>
          <Text style={styles.budgetCategory}>
            {getCategoryName(budget.categoria)}
          </Text>
        </View>
        
        <View style={styles.budgetActions}>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(budget) }]}>
            <Ionicons 
              name={getStatusIcon(budget) as any} 
              size={12} 
              color="#FFFFFF" 
            />
            <Text style={styles.statusText}>{getStatusText(budget)}</Text>
          </View>
          
          <View style={[styles.budgetIcon, { backgroundColor: getCategoryColor(budget.categoria) + '20' }]}>
            <Ionicons 
              name={getCategoryIcon(budget.categoria) as any} 
              size={24} 
              color={getCategoryColor(budget.categoria)} 
            />
          </View>
        </View>
      </View>

      <View style={styles.budgetProgress}>
        <ProgressBar
          progress={Math.min(budget.porcentagemGasta / 100, 1)}
          color={budget.porcentagemGasta >= 100 ? theme.error : 
                 budget.porcentagemGasta >= 80 ? theme.warning : theme.success}
          style={styles.progressBar}
        />
        
        <View style={styles.progressLabels}>
          <Text style={styles.progressText}>
            {budget.porcentagemGasta}% usado
          </Text>
          <Text style={[styles.progressText, { color: getDaysRemainingColor(budget.diasRestantes) }]}>
            {budget.diasRestantes} dias
          </Text>
        </View>
      </View>

      <View style={styles.budgetValues}>
        <View style={styles.valueItem}>
          <Text style={styles.valueLabel}>Gasto</Text>
          <Text style={[styles.valueAmount, { color: theme.error }]}>
            {formatCurrency(budget.valorGasto)}
          </Text>
        </View>
        
        <View style={styles.valueItem}>
          <Text style={styles.valueLabel}>Limite</Text>
          <Text style={styles.valueAmount}>
            {formatCurrency(budget.valorLimite)}
          </Text>
        </View>
        
        <View style={styles.valueItem}>
          <Text style={styles.valueLabel}>Restante</Text>
          <Text style={[styles.valueAmount, { color: budget.valorRestante > 0 ? theme.success : theme.error }]}>
            {formatCurrency(budget.valorRestante)}
          </Text>
        </View>
      </View>

      <View style={styles.budgetFooter}>
        <Text style={styles.periodText}>
          {formatDate(budget.dataInicio)} - {formatDate(budget.dataFim)}
        </Text>
        
        <View style={styles.budgetTags}>
          {budget.renovacaoAutomatica && (
            <View style={styles.tag}>
              <Ionicons name="refresh" size={10} color={theme.primary} />
              <Text style={styles.tagText}>Auto</Text>
            </View>
          )}
          
          <View style={styles.tag}>
            <Text style={styles.tagText}>{budget.periodo}</Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  )

  // Modal de Detalhes do Orçamento
  const BudgetDetailsModal = () => (
    <Modal
      visible={showDetailsModal}
      transparent={true}
      animationType="slide"
      onRequestClose={() => setShowDetailsModal(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          {selectedBudget && (
            <>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>{selectedBudget.nome}</Text>
                <TouchableOpacity
                  style={styles.closeButton}
                  onPress={() => setShowDetailsModal(false)}
                >
                  <Ionicons name="close" size={24} color={theme.text} />
                </TouchableOpacity>
              </View>

              <ScrollView showsVerticalScrollIndicator={false}>
                {/* Informações Básicas */}
                <View style={styles.modalSection}>
                  <Text style={styles.modalSectionTitle}>📊 Informações Gerais</Text>
                  
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Categoria:</Text>
                    <Text style={styles.infoValue}>{getCategoryName(selectedBudget.categoria)}</Text>
                  </View>
                  
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Período:</Text>
                    <Text style={styles.infoValue}>{selectedBudget.periodo}</Text>
                  </View>
                  
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Status:</Text>
                    <Text style={[styles.infoValue, { color: getStatusColor(selectedBudget) }]}>
                      {getStatusText(selectedBudget)}
                    </Text>
                  </View>
                  
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Renovação Automática:</Text>
                    <Text style={styles.infoValue}>
                      {selectedBudget.renovacaoAutomatica ? '✅ Ativada' : '❌ Desativada'}
                    </Text>
                  </View>

                  {selectedBudget.ultimaRenovacao && (
                    <View style={styles.infoRow}>
                      <Text style={styles.infoLabel}>Última Renovação:</Text>
                      <Text style={styles.infoValue}>
                        {formatDateTime(selectedBudget.ultimaRenovacao)}
                      </Text>
                    </View>
                  )}
                </View>

                {/* Estatísticas de Renovação */}
                {selectedBudget.estatisticasRenovacao && selectedBudget.estatisticasRenovacao.totalRenovacoes > 0 && (
                  <View style={styles.modalSection}>
                    <Text style={styles.modalSectionTitle}>🔄 Histórico de Renovações</Text>
                    
                    <View style={styles.infoRow}>
                      <Text style={styles.infoLabel}>Total de Renovações:</Text>
                      <Text style={styles.infoValue}>{selectedBudget.estatisticasRenovacao.totalRenovacoes}</Text>
                    </View>
                    
                    <View style={styles.infoRow}>
                      <Text style={styles.infoLabel}>Média de Gastos:</Text>
                      <Text style={styles.infoValue}>
                        {formatCurrency(selectedBudget.estatisticasRenovacao.mediaGastosPorPeriodo)}
                      </Text>
                    </View>
                    
                    {selectedBudget.estatisticasRenovacao.melhorPerformance && (
                      <View style={styles.infoRow}>
                        <Text style={styles.infoLabel}>Melhor Performance:</Text>
                        <Text style={[styles.infoValue, { color: theme.success }]}>
                          {selectedBudget.estatisticasRenovacao.melhorPerformance.porcentagem}%
                        </Text>
                      </View>
                    )}
                  </View>
                )}

                {/* Ações */}
                <View style={styles.modalSection}>
                  <Text style={styles.modalSectionTitle}>⚙️ Ações</Text>
                  
                  <View style={styles.actionButtons}>
                    <Button
                      title="Editar"
                      onPress={() => {
                        setShowDetailsModal(false)
                        navigation.navigate('AddBudget', { budget: selectedBudget })
                      }}
                      style={styles.actionButton}
                    />
                    
                    <Button
                      title="Editar Limite"
                      onPress={() => {
                        setShowDetailsModal(false)
                        setQuickEditValue(selectedBudget.valorLimite.toString())
                        setShowQuickEditModal(true)
                      }}
                      variant="secondary"
                      style={styles.actionButton}
                    />
                  </View>

                  <View style={styles.actionButtons}>
                    <Button
                      title={selectedBudget.status === 'ativo' ? 'Pausar' : 'Reativar'}
                      onPress={() => {
                        setShowDetailsModal(false)
                        handlePauseBudget(selectedBudget._id, selectedBudget.status)
                      }}
                      variant="secondary"
                      style={styles.actionButton}
                    />
                    
                    {selectedBudget.renovacaoAutomatica && (
                      <Button
                        title="Renovar Agora"
                        onPress={() => {
                          setShowDetailsModal(false)
                          handleRenewBudget(selectedBudget._id)
                        }}
                        style={styles.actionButton}
                      />
                    )}
                  </View>

                  <Button
                    title="Excluir Orçamento"
                    onPress={() => handleDeleteBudget(selectedBudget._id)}
                    variant="secondary"
                    style={{ ...styles.actionButton, backgroundColor: theme.error, marginTop: 12, width: '100%' }}
                  />
                </View>
              </ScrollView>
            </>
          )}
        </View>
      </View>
    </Modal>
  )

  // Modal de Edição Rápida
  const QuickEditModal = () => (
    <Modal
      visible={showQuickEditModal}
      transparent={true}
      animationType="fade"
      onRequestClose={() => setShowQuickEditModal(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={[styles.modalContent, { height: 'auto' }]}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Editar Limite</Text>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setShowQuickEditModal(false)}
            >
              <Ionicons name="close" size={24} color={theme.text} />
            </TouchableOpacity>
          </View>

          <View style={styles.modalSection}>
            <Input
              label="Novo Valor Limite"
              value={quickEditValue}
              onChangeText={setQuickEditValue}
              placeholder="0,00"
              keyboardType="numeric"
            />
          </View>

          <View style={styles.actionButtons}>
            <Button
              title="Cancelar"
              onPress={() => setShowQuickEditModal(false)}
              variant="secondary"
              style={styles.actionButton}
            />
            <Button
              title="Salvar"
              onPress={handleQuickEdit}
              loading={updating}
              style={styles.actionButton}
            />
          </View>
        </View>
      </View>
    </Modal>
  )

  // Modal de Estatísticas
  const StatsModal = () => (
    <Modal
      visible={showStatsModal}
      transparent={true}
      animationType="slide"
      onRequestClose={() => setShowStatsModal(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>📊 Estatísticas Detalhadas</Text>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setShowStatsModal(false)}
            >
              <Ionicons name="close" size={24} color={theme.text} />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            {budgetsData?.resumo && (
              <View style={styles.modalSection}>
                <Text style={styles.modalSectionTitle}>💰 Resumo Financeiro</Text>
                
                <View style={styles.statsGrid}>
                  <View style={styles.statCard}>
                    <Text style={styles.statValue}>{formatCurrency(budgetsData.resumo.totalLimite)}</Text>
                    <Text style={styles.statLabel}>Total Limite</Text>
                  </View>
                  
                  <View style={styles.statCard}>
                    <Text style={[styles.statValue, { color: theme.error }]}>
                      {formatCurrency(budgetsData.resumo.totalGasto)}
                    </Text>
                    <Text style={styles.statLabel}>Total Gasto</Text>
                  </View>
                  
                  <View style={styles.statCard}>
                    <Text style={[styles.statValue, { color: theme.success }]}>
                      {formatCurrency(budgetsData.resumo.totalRestante)}
                    </Text>
                    <Text style={styles.statLabel}>Total Restante</Text>
                  </View>
                  
                  <View style={styles.statCard}>
                    <Text style={styles.statValue}>
                      {budgetsData.resumo.totalLimite > 0 
                        ? Math.round((budgetsData.resumo.totalGasto / budgetsData.resumo.totalLimite) * 100)
                        : 0}%
                    </Text>
                    <Text style={styles.statLabel}>% Utilizado</Text>
                  </View>
                </View>
              </View>
            )}

            {budgetsData?.orcamentos && (
              <View style={styles.modalSection}>
                <Text style={styles.modalSectionTitle}>📋 Orçamentos por Status</Text>
                
                <View style={styles.statusStats}>
                  <View style={styles.statusStatItem}>
                    <View style={[styles.statusIndicator, { backgroundColor: theme.success }]} />
                    <Text style={styles.statusStatLabel}>Ativos</Text>
                    <Text style={styles.statusStatValue}>
                      {budgetsData.orcamentos.filter(b => b.status === 'ativo').length}
                    </Text>
                  </View>
                  
                  <View style={styles.statusStatItem}>
                    <View style={[styles.statusIndicator, { backgroundColor: theme.error }]} />
                    <Text style={styles.statusStatLabel}>Excedidos</Text>
                    <Text style={styles.statusStatValue}>{budgetsData.resumo.excedidos}</Text>
                  </View>
                  
                  <View style={styles.statusStatItem}>
                    <View style={[styles.statusIndicator, { backgroundColor: theme.warning }]} />
                    <Text style={styles.statusStatLabel}>Em Alerta</Text>
                    <Text style={styles.statusStatValue}>{budgetsData.resumo.emAlerta}</Text>
                  </View>
                  
                  <View style={styles.statusStatItem}>
                    <View style={[styles.statusIndicator, { backgroundColor: theme.textSecondary }]} />
                    <Text style={styles.statusStatLabel}>Pausados</Text>
                    <Text style={styles.statusStatValue}>
                      {budgetsData.orcamentos.filter(b => b.status === 'pausado').length}
                    </Text>
                  </View>
                </View>
              </View>
            )}

            <View style={styles.modalSection}>
              <Text style={styles.modalSectionTitle}>🔄 Renovação Automática</Text>
              
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Com Renovação Automática:</Text>
                <Text style={styles.infoValue}>
                  {budgetsData?.resumo.comRenovacaoAutomatica || 0} orçamentos
                </Text>
              </View>
              
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Vencendo em 7 dias:</Text>
                <Text style={[styles.infoValue, { color: theme.warning }]}>
                  {budgetsData?.resumo.vencendoEm7Dias || 0} orçamentos
                </Text>
              </View>
            </View>

            {/* Categorias mais utilizadas */}
            {categories.length > 0 && budgetsData?.orcamentos && (
              <View style={styles.modalSection}>
                <Text style={styles.modalSectionTitle}>📊 Categorias Mais Utilizadas</Text>
                
                {categories.slice(0, 5).map((category, index) => {
                  const orcamentosCategoria = budgetsData.orcamentos.filter(b => b.categoria === category._id)
                  const totalGastoCategoria = orcamentosCategoria.reduce((sum, b) => sum + b.valorGasto, 0)
                  
                  if (totalGastoCategoria === 0) return null
                  
                  return (
                    <View key={category._id} style={styles.categoryStatItem}>
                      <View style={styles.categoryStatLeft}>
                        <View style={[styles.categoryIcon, { backgroundColor: category.cor + '20' }]}>
                          <Ionicons name={category.icone as any} size={16} color={category.cor} />
                        </View>
                        <Text style={styles.categoryStatName}>{category.nome}</Text>
                      </View>
                      <Text style={styles.categoryStatValue}>{formatCurrency(totalGastoCategoria)}</Text>
                    </View>
                  )
                })}
              </View>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  )

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
      fontWeight: '700',
      color: theme.text,
    },
    addButton: {
      backgroundColor: theme.primary,
      width: 40,
      height: 40,
      borderRadius: 20,
      alignItems: 'center',
      justifyContent: 'center',
    },
    // Summary Card
    summaryCard: {
      margin: 20,
      borderRadius: 16,
      overflow: 'hidden',
    },
    summaryGradient: {
      padding: 20,
    },
    summaryHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
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
    // Filters
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
    // Budget Item
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
      justifyContent: 'space-between',
      marginBottom: 12,
    },
    budgetInfo: {
      flex: 1,
    },
    budgetName: {
      fontSize: 16,
      fontWeight: '600',
      color: theme.text,
      marginBottom: 2,
    },
    budgetCategory: {
      fontSize: 12,
      color: theme.textSecondary,
    },
    budgetActions: {
      alignItems: 'flex-end',
      gap: 8,
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
      fontSize: 10,
      color: '#FFFFFF',
      fontWeight: '600',
    },
    budgetIcon: {
      width: 32,
      height: 32,
      borderRadius: 16,
      alignItems: 'center',
      justifyContent: 'center',
    },
    budgetProgress: {
      marginBottom: 12,
    },
    progressBar: {
      height: 6,
      borderRadius: 3,
    },
    progressLabels: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginTop: 6,
    },
    progressText: {
      fontSize: 12,
      color: theme.textSecondary,
    },
    budgetValues: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: 12,
    },
    valueItem: {
      alignItems: 'center',
    },
    valueLabel: {
      fontSize: 10,
      color: theme.textSecondary,
      marginBottom: 2,
    },
    valueAmount: {
      fontSize: 14,
      fontWeight: '600',
      color: theme.text,
    },
    budgetFooter: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingTop: 12,
      borderTopWidth: 1,
      borderTopColor: theme.border,
    },
    periodText: {
      fontSize: 11,
      color: theme.textSecondary,
    },
    budgetTags: {
      flexDirection: 'row',
      gap: 6,
    },
    tag: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.primary + '20',
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: 8,
      gap: 2,
    },
    tagText: {
      fontSize: 10,
      color: theme.primary,
      fontWeight: '500',
    },
    // Modals
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    modalContent: {
      backgroundColor: theme.surface,
      borderRadius: 12,
      padding: 20,
      width: '90%',
      maxHeight: '80%',
    },
    modalHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 20,
    },
    modalTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: theme.text,
    },
    closeButton: {
      padding: 8,
    },
    modalSection: {
      marginBottom: 24,
    },
    modalSectionTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: theme.text,
      marginBottom: 12,
    },
    infoRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
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
    actionButtons: {
      flexDirection: 'row',
      gap: 12,
      marginBottom: 12,
    },
    actionButton: {
      flex: 1,
    },
    // Stats Modal
    statsGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 12,
    },
    statCard: {
      flex: 1,
      minWidth: '45%',
      backgroundColor: theme.background,
      padding: 16,
      borderRadius: 8,
      alignItems: 'center',
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
    statusStats: {
      gap: 12,
    },
    statusStatItem: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 8,
    },
    statusIndicator: {
      width: 12,
      height: 12,
      borderRadius: 6,
      marginRight: 12,
    },
    statusStatLabel: {
      flex: 1,
      fontSize: 14,
      color: theme.text,
    },
    statusStatValue: {
      fontSize: 14,
      fontWeight: '600',
      color: theme.text,
    },
    categoryStatItem: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: 8,
      borderBottomWidth: 1,
      borderBottomColor: theme.border,
    },
    categoryStatLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      flex: 1,
    },
    categoryIcon: {
      width: 32,
      height: 32,
      borderRadius: 16,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 12,
    },
    categoryStatName: {
      fontSize: 14,
      color: theme.text,
      flex: 1,
    },
    categoryStatValue: {
      fontSize: 14,
      fontWeight: '600',
      color: theme.text,
    },
    // States
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
      textAlign: 'center',
    },
    emptyDescription: {
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
    errorContainer: {
      backgroundColor: theme.error + '20',
      margin: 20,
      padding: 16,
      borderRadius: 8,
      borderLeftWidth: 4,
      borderLeftColor: theme.error,
    },
    errorText: {
      fontSize: 14,
      color: theme.error,
      marginBottom: 8,
    },
    retryButton: {
      marginTop: 8,
    },
  })

  // 🔧 ESTADOS DE LOADING E ERRO
  if (budgetsLoading && !budgetsData) {
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
          onPress={() => navigation.navigate('AddBudget')}
        >
          <Ionicons name="add" size={24} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      {/* Errors */}
      {budgetsError && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>
            ❌ Erro ao carregar orçamentos: {budgetsError}
          </Text>
          <Button
            title="Tentar Novamente"
            onPress={refresh}
            variant="secondary"
            style={styles.retryButton}
          />
        </View>
      )}

      {categoriesError && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>
            ⚠️ Erro ao carregar categorias: {categoriesError}
          </Text>
          <Text style={styles.errorText}>
            As categorias podem não aparecer corretamente nos orçamentos.
          </Text>
        </View>
      )}

      {/* Summary Card */}
      <SummaryCard />

      {/* Filters */}
      <View style={styles.filtersContainer}>
        <FilterButton 
          filter="ativos" 
          label="Ativos" 
          icon="checkmark-circle" 
          count={getFilterCount('ativos')}
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
          <View style={styles.emptyIcon}>
            <Ionicons name="wallet-outline" size={64} color={theme.textSecondary} />
          </View>
          <Text style={styles.emptyTitle}>
            {selectedFilter === 'todos' ? 'Nenhum orçamento ainda' : `Nenhum orçamento ${selectedFilter}`}
          </Text>
          <Text style={styles.emptyDescription}>
            {selectedFilter === 'todos' 
              ? 'Comece criando seu primeiro orçamento para controlar melhor seus gastos'
              : `Não há orçamentos ${selectedFilter} no momento`
            }
          </Text>
          {selectedFilter === 'todos' && (
            <Button
              title="Criar Primeiro Orçamento"
              onPress={() => navigation.navigate('AddBudget')}
            />
          )}
        </View>
      ) : (
        <FlatList
          data={filteredBudgets}
          keyExtractor={(item) => item._id}
          renderItem={({ item }) => <BudgetItem budget={item} />}
          refreshControl={
            <RefreshControl 
              refreshing={budgetsLoading || categoriesLoading} 
              onRefresh={refresh} 
            />
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