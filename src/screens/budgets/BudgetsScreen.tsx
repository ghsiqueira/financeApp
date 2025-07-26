// src/screens/budgets/BudgetsScreen.tsx - LAYOUT MELHORADO
import React, { useState } from 'react'
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

import { useTheme } from '../../context/ThemeContext'
import { useBudgets, Budget } from '../../hooks/useBudgets'
import { useCategories } from '../../hooks/useCategories'
import Button from '../../components/common/Button'
import LoadingSpinner from '../../components/common/LoadingSpinner'
import Input from '../../components/common/Input'

const { width } = Dimensions.get('window')

export default function BudgetsScreen({ navigation }: any) {
  const { theme } = useTheme()
  const [selectedFilter, setSelectedFilter] = useState<'ativos' | 'excedidos' | 'pausados' | 'todos'>('todos')
  const [showDetailsModal, setShowDetailsModal] = useState(false)
  const [showQuickEditModal, setShowQuickEditModal] = useState(false)
  const [selectedBudget, setSelectedBudget] = useState<Budget | null>(null)
  const [quickEditValue, setQuickEditValue] = useState('')
  const [quickEditType, setQuickEditType] = useState<'limite' | 'gasto'>('limite')

  // Hook personalizado para orçamentos
  const {
    budgets,
    summary,
    loading,
    error,
    refresh,
    pauseBudget,
    reactivateBudget,
    deleteBudget,
    updateBudget,
    filterBudgets
  } = useBudgets({ autoRefresh: false })

  const { categories } = useCategories('despesa')

  // Filtrar orçamentos
  const filteredBudgets = filterBudgets(selectedFilter)

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

  const getCategoryName = (categoryId: string) => {
    const category = categories.find(cat => cat._id === categoryId)
    return category?.nome || categoryId
  }

  const getFilterCount = (filter: string) => {
    switch (filter) {
      case 'excedidos':
        return summary.excedidos
      case 'pausados':
        return budgets.filter(b => b.status === 'pausado').length
      case 'ativos':
        return budgets.filter(b => b.status === 'ativo').length
      default:
        return 0
    }
  }

  const getStatusColor = (status: string, porcentagem: number) => {
    if (status === 'pausado') return theme.textSecondary
    if (porcentagem >= 100) return theme.error
    if (porcentagem >= 80) return theme.warning
    return theme.success
  }

  const getStatusIcon = (status: string, porcentagem: number) => {
    if (status === 'pausado') return 'pause-circle'
    if (porcentagem >= 100) return 'alert-circle'
    if (porcentagem >= 80) return 'warning'
    return 'checkmark-circle'
  }

  const getProgressColor = (porcentagem: number) => {
    if (porcentagem >= 100) return '#F44336'
    if (porcentagem >= 80) return '#FF9800'
    if (porcentagem >= 60) return '#FFC107'
    return '#4CAF50'
  }

  // Ações dos orçamentos
  const handleToggleBudget = async (budget: Budget) => {
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

  const handleDeleteBudget = async (budget: Budget) => {
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
      const value = parseFloat(quickEditValue.replace(/[^\d,]/g, '').replace(',', '.'))
      
      if (isNaN(value) || value <= 0) {
        Alert.alert('Erro', 'Por favor, insira um valor válido')
        return
      }

      const updates = quickEditType === 'limite' 
        ? { valorLimite: value }
        : { valorGasto: value }

      await updateBudget(selectedBudget._id, updates)
      
      setShowQuickEditModal(false)
      setQuickEditValue('')
      Alert.alert('Sucesso', `${quickEditType === 'limite' ? 'Limite' : 'Valor gasto'} atualizado com sucesso!`)
      
    } catch (error: any) {
      Alert.alert('Erro', error.message || 'Erro ao atualizar orçamento')
    }
  }

  // 📊 COMPONENTE DE RESUMO COMPACTO
  const SummaryCard = () => (
    <View style={styles.summaryCard}>
      <LinearGradient
        colors={[theme.primary, theme.primary + 'CC']}
        style={styles.summaryGradient}
      >
        <View style={styles.summaryHeader}>
          <View style={styles.summaryTitleRow}>
            <Ionicons name="wallet" size={20} color="#FFFFFF" />
            <Text style={styles.summaryTitle}>Resumo</Text>
          </View>
          <Text style={styles.summarySubtitle}>
            {budgets.length} orçamento{budgets.length !== 1 ? 's' : ''}
          </Text>
        </View>
        
        <View style={styles.summaryStats}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{formatCurrency(summary.totalLimite)}</Text>
            <Text style={styles.statLabel}>Orçado</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{formatCurrency(summary.totalGasto)}</Text>
            <Text style={styles.statLabel}>Gasto</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={[
              styles.statValue, 
              { color: summary.totalRestante >= 0 ? '#4CAF50' : '#F44336' }
            ]}>
              {formatCurrency(summary.totalRestante)}
            </Text>
            <Text style={styles.statLabel}>Restante</Text>
          </View>
        </View>

        {summary.totalLimite > 0 && (
          <View style={styles.summaryProgress}>
            <View style={styles.progressRow}>
              <Text style={styles.progressLabel}>Progresso Geral</Text>
              <Text style={styles.progressPercent}>
                {((summary.totalGasto / summary.totalLimite) * 100).toFixed(1)}%
              </Text>
            </View>
            <ProgressBar
              progress={Math.min(summary.totalGasto / summary.totalLimite, 1)}
              color={getProgressColor((summary.totalGasto / summary.totalLimite) * 100)}
              style={styles.progressBar}
            />
          </View>
        )}
      </LinearGradient>
    </View>
  )

  const FilterButton = ({ filter, label, icon, count }: any) => (
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
      {count !== undefined && count > 0 && (
        <View style={[
          styles.filterBadge,
          selectedFilter === filter && styles.filterBadgeActive
        ]}>
          <Text style={[
            styles.filterBadgeText,
            selectedFilter === filter && styles.filterBadgeTextActive
          ]}>
            {count}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  )

  // 💳 COMPONENTE DE ITEM DE ORÇAMENTO MELHORADO
  const BudgetItem = ({ budget }: { budget: Budget }) => (
    <View style={styles.budgetItem}>
      <LinearGradient
        colors={[budget.cor || theme.primary, (budget.cor || theme.primary) + 'CC']}
        style={styles.budgetGradient}
      >
        <TouchableOpacity
          style={styles.budgetContent}
          onPress={() => {
            setSelectedBudget(budget)
            setShowDetailsModal(true)
          }}
          activeOpacity={0.8}
        >
          <View style={styles.budgetHeader}>
            <View style={styles.budgetMainInfo}>
              <View style={styles.budgetIconContainer}>
                <Ionicons name={budget.icone as any} size={16} color="#FFFFFF" />
              </View>
              <View style={styles.budgetTitleInfo}>
                <Text style={styles.budgetName}>{budget.nome}</Text>
                <Text style={styles.budgetCategory}>{getCategoryName(budget.categoria)}</Text>
              </View>
            </View>
            
            <View style={styles.budgetStatusBadge}>
              <Ionicons 
                name={getStatusIcon(budget.status, budget.porcentagemGasta)} 
                size={14} 
                color="#FFFFFF" 
              />
            </View>
          </View>

          <View style={styles.budgetBody}>
            <View style={styles.progressContainer}>
              <View style={styles.progressHeader}>
                <Text style={styles.progressLabel}>Progresso</Text>
                <Text style={styles.progressValue}>
                  {budget.porcentagemGasta.toFixed(1)}%
                </Text>
              </View>
              <ProgressBar
                progress={Math.min(budget.porcentagemGasta / 100, 1)}
                color={getProgressColor(budget.porcentagemGasta)}
                style={styles.budgetProgressBar}
              />
            </View>

            <View style={styles.budgetValues}>
              <View style={styles.valueRow}>
                <Text style={styles.valueLabel}>Gasto:</Text>
                <Text style={styles.valueAmount}>{formatCurrency(budget.valorGasto)}</Text>
              </View>
              <View style={styles.valueRow}>
                <Text style={styles.valueLabel}>Limite:</Text>
                <Text style={styles.valueAmount}>{formatCurrency(budget.valorLimite)}</Text>
              </View>
              <View style={styles.valueRow}>
                <Text style={styles.valueLabel}>Restante:</Text>
                <Text style={[
                  styles.valueAmount,
                  { color: budget.valorRestante >= 0 ? '#4CAF50' : '#F44336' }
                ]}>
                  {formatCurrency(budget.valorRestante)}
                </Text>
              </View>
            </View>

            <View style={styles.budgetFooter}>
              <View style={styles.footerInfo}>
                <Ionicons name="calendar-outline" size={12} color="#FFFFFF" />
                <Text style={styles.footerText}>{budget.periodo}</Text>
              </View>
              <View style={styles.footerInfo}>
                <Ionicons name="time-outline" size={12} color="#FFFFFF" />
                <Text style={styles.footerText}>
                  {budget.diasRestantes > 0 ? `${budget.diasRestantes}d` : 'Vencido'}
                </Text>
              </View>
            </View>
          </View>
        </TouchableOpacity>

        {/* Botões de Ação Rápida */}
        <View style={styles.quickActions}>
          <TouchableOpacity
            style={styles.quickActionButton}
            onPress={() => navigation.navigate('AddBudget', { budget })}
          >
            <Ionicons name="create-outline" size={14} color="#FFFFFF" />
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.quickActionButton}
            onPress={() => {
              setSelectedBudget(budget)
              setQuickEditType('limite')
              setQuickEditValue(budget.valorLimite.toString())
              setShowQuickEditModal(true)
            }}
          >
            <Ionicons name="cash-outline" size={14} color="#FFFFFF" />
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.quickActionButton}
            onPress={() => handleToggleBudget(budget)}
          >
            <Ionicons 
              name={budget.status === 'ativo' ? 'pause-outline' : 'play-outline'} 
              size={14} 
              color="#FFFFFF" 
            />
          </TouchableOpacity>
        </View>
      </LinearGradient>
    </View>
  )

  // Modal de Detalhes (mesmo código anterior)
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
            <Ionicons name="create-outline" size={24} color={theme.primary} />
          </TouchableOpacity>
        </View>

        {selectedBudget && (
          <ScrollView style={styles.modalContent}>
            {/* Card Principal */}
            <View style={styles.detailsCard}>
              <LinearGradient
                colors={[selectedBudget.cor || theme.primary, (selectedBudget.cor || theme.primary) + 'DD']}
                style={styles.detailsGradient}
              >
                <View style={styles.detailsHeader}>
                  <View style={styles.detailsIconContainer}>
                    <Ionicons name={selectedBudget.icone as any} size={24} color="#FFFFFF" />
                  </View>
                  <View style={styles.detailsHeaderInfo}>
                    <Text style={styles.detailsName}>{selectedBudget.nome}</Text>
                    <Text style={styles.detailsCategory}>
                      {getCategoryName(selectedBudget.categoria)}
                    </Text>
                  </View>
                  <View style={[
                    styles.detailsStatusBadge,
                    { backgroundColor: getStatusColor(selectedBudget.status, selectedBudget.porcentagemGasta) }
                  ]}>
                    <Text style={styles.detailsStatusText}>
                      {selectedBudget.status.toUpperCase()}
                    </Text>
                  </View>
                </View>

                <View style={styles.detailsProgress}>
                  <View style={styles.progressInfo}>
                    <Text style={styles.progressLabel}>Progresso do Orçamento</Text>
                    <Text style={styles.progressValue}>
                      {selectedBudget.porcentagemGasta.toFixed(1)}%
                    </Text>
                  </View>
                  <ProgressBar
                    progress={Math.min(selectedBudget.porcentagemGasta / 100, 1)}
                    color={getProgressColor(selectedBudget.porcentagemGasta)}
                    style={styles.detailsProgressBar}
                  />
                </View>
              </LinearGradient>
            </View>

            {/* Informações Financeiras */}
            <View style={styles.modalSection}>
              <Text style={styles.modalSectionTitle}>💰 Informações Financeiras</Text>
              
              <View style={styles.financialGrid}>
                <TouchableOpacity 
                  style={styles.financialItem}
                  onPress={() => {
                    setQuickEditType('gasto')
                    setQuickEditValue(selectedBudget.valorGasto.toString())
                    setShowQuickEditModal(true)
                  }}
                >
                  <Text style={styles.financialLabel}>Valor Gasto</Text>
                  <Text style={styles.financialValue}>{formatCurrency(selectedBudget.valorGasto)}</Text>
                  <Ionicons name="create-outline" size={16} color={theme.textSecondary} />
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={styles.financialItem}
                  onPress={() => {
                    setQuickEditType('limite')
                    setQuickEditValue(selectedBudget.valorLimite.toString())
                    setShowQuickEditModal(true)
                  }}
                >
                  <Text style={styles.financialLabel}>Limite</Text>
                  <Text style={styles.financialValue}>{formatCurrency(selectedBudget.valorLimite)}</Text>
                  <Ionicons name="create-outline" size={16} color={theme.textSecondary} />
                </TouchableOpacity>
                
                <View style={styles.financialItem}>
                  <Text style={styles.financialLabel}>Restante</Text>
                  <Text style={[
                    styles.financialValue,
                    { color: selectedBudget.valorRestante >= 0 ? theme.success : theme.error }
                  ]}>
                    {formatCurrency(selectedBudget.valorRestante)}
                  </Text>
                </View>
                
                <View style={styles.financialItem}>
                  <Text style={styles.financialLabel}>Porcentagem</Text>
                  <Text style={[
                    styles.financialValue,
                    { color: getProgressColor(selectedBudget.porcentagemGasta) }
                  ]}>
                    {selectedBudget.porcentagemGasta.toFixed(1)}%
                  </Text>
                </View>
              </View>
            </View>

            {/* Informações de Período */}
            <View style={styles.modalSection}>
              <Text style={styles.modalSectionTitle}>📅 Período e Configurações</Text>
              
              <View style={styles.infoGrid}>
                <View style={styles.infoItem}>
                  <Text style={styles.infoLabel}>Período</Text>
                  <Text style={styles.infoValue}>{selectedBudget.periodo}</Text>
                </View>
                
                <View style={styles.infoItem}>
                  <Text style={styles.infoLabel}>Data Início</Text>
                  <Text style={styles.infoValue}>{formatDate(selectedBudget.dataInicio)}</Text>
                </View>
                
                <View style={styles.infoItem}>
                  <Text style={styles.infoLabel}>Data Fim</Text>
                  <Text style={styles.infoValue}>{formatDate(selectedBudget.dataFim)}</Text>
                </View>
                
                <View style={styles.infoItem}>
                  <Text style={styles.infoLabel}>Dias Restantes</Text>
                  <Text style={[
                    styles.infoValue,
                    { color: selectedBudget.diasRestantes <= 7 ? theme.warning : theme.text }
                  ]}>
                    {selectedBudget.diasRestantes > 0 ? `${selectedBudget.diasRestantes} dias` : 'Vencido'}
                  </Text>
                </View>
                
                <View style={styles.infoItem}>
                  <Text style={styles.infoLabel}>Renovação Automática</Text>
                  <Text style={styles.infoValue}>
                    {selectedBudget.renovacaoAutomatica ? '✅ Sim' : '❌ Não'}
                  </Text>
                </View>
              </View>
            </View>

            {/* Ações */}
            <View style={styles.modalActions}>
              <Button
                title="Editar Orçamento"
                onPress={() => {
                  setShowDetailsModal(false)
                  navigation.navigate('AddBudget', { budget: selectedBudget })
                }}
                style={styles.modalButton}
              />
              
              <Button
                title={selectedBudget.status === 'ativo' ? 'Pausar Orçamento' : 'Reativar Orçamento'}
                onPress={() => {
                  setShowDetailsModal(false)
                  handleToggleBudget(selectedBudget)
                }}
                variant="secondary"
                style={styles.modalButton}
              />
              
              <Button
                title="Excluir Orçamento"
                onPress={() => {
                  setShowDetailsModal(false)
                  handleDeleteBudget(selectedBudget)
                }}
                variant="danger"
                style={styles.modalButton}
              />
            </View>
          </ScrollView>
        )}
      </SafeAreaView>
    </Modal>
  )

  // Modal de Edição Rápida
  const QuickEditModal = () => (
    <Modal
      visible={showQuickEditModal}
      animationType="slide"
      transparent={true}
      onRequestClose={() => setShowQuickEditModal(false)}
    >
      <View style={styles.quickEditOverlay}>
        <View style={styles.quickEditModal}>
          <View style={styles.quickEditHeader}>
            <Text style={styles.quickEditTitle}>
              Editar {quickEditType === 'limite' ? 'Limite' : 'Valor Gasto'}
            </Text>
            <TouchableOpacity onPress={() => setShowQuickEditModal(false)}>
              <Ionicons name="close" size={24} color={theme.text} />
            </TouchableOpacity>
          </View>
          
          <View style={styles.quickEditContent}>
            <Text style={styles.quickEditLabel}>
              {quickEditType === 'limite' ? 'Novo limite do orçamento' : 'Valor atual gasto'}
            </Text>
            
            <Input
              value={quickEditValue}
              onChangeText={setQuickEditValue}
              placeholder="0,00"
              keyboardType="numeric"
              style={styles.quickEditInput}
            />
            
            <View style={styles.quickEditActions}>
              <Button
                title="Cancelar"
                onPress={() => setShowQuickEditModal(false)}
                variant="secondary"
                style={styles.quickEditButton}
              />
              
              <Button
                title="Salvar"
                onPress={handleQuickEdit}
                style={styles.quickEditButton}
              />
            </View>
          </View>
        </View>
      </View>
    </Modal>
  )

  // 🎨 ESTILOS MELHORADOS
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
    title: {
      fontSize: 24,
      fontWeight: 'bold',
      color: theme.text,
    },
    addButton: {
      backgroundColor: theme.primary,
      borderRadius: 20,
      width: 40,
      height: 40,
      justifyContent: 'center',
      alignItems: 'center',
      elevation: 2,
      shadowColor: theme.shadow,
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.2,
      shadowRadius: 2,
    },
    
    // 📊 SUMMARY CARD COMPACTO
    summaryCard: {
      marginHorizontal: 16,
      marginVertical: 12,
      borderRadius: 12,
      overflow: 'hidden',
      elevation: 3,
      shadowColor: theme.shadow,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
    },
    summaryGradient: {
      padding: 16,
    },
    summaryHeader: {
      marginBottom: 12,
    },
    summaryTitleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 4,
    },
    summaryTitle: {
      fontSize: 16,
      fontWeight: 'bold',
      color: '#FFFFFF',
      marginLeft: 8,
    },
    summarySubtitle: {
      fontSize: 12,
      color: '#FFFFFF',
      opacity: 0.9,
    },
    summaryStats: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 12,
    },
    statItem: {
      flex: 1,
      alignItems: 'center',
    },
    statDivider: {
      width: 1,
      height: 24,
      backgroundColor: 'rgba(255, 255, 255, 0.3)',
      marginHorizontal: 8,
    },
    statValue: {
      fontSize: 14,
      fontWeight: 'bold',
      color: '#FFFFFF',
      marginBottom: 2,
    },
    statLabel: {
      fontSize: 10,
      color: '#FFFFFF',
      opacity: 0.9,
    },
    summaryProgress: {
      marginTop: 4,
    },
    progressRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 6,
    },
    progressLabel: {
      fontSize: 11,
      color: '#FFFFFF',
      opacity: 0.9,
    },
    progressPercent: {
      fontSize: 11,
      fontWeight: 'bold',
      color: '#FFFFFF',
    },
    progressBar: {
      height: 6,
      borderRadius: 3,
      backgroundColor: 'rgba(255, 255, 255, 0.3)',
    },
    
    // Filters
    filtersContainer: {
      flexDirection: 'row',
      paddingHorizontal: 16,
      paddingVertical: 10,
      backgroundColor: theme.surface,
    },
    filterButton: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 10,
      paddingVertical: 6,
      marginRight: 8,
      borderRadius: 16,
      backgroundColor: theme.background,
      borderWidth: 1,
      borderColor: theme.border,
    },
    filterButtonActive: {
      backgroundColor: theme.primary,
      borderColor: theme.primary,
    },
    filterButtonText: {
      fontSize: 11,
      color: theme.textSecondary,
      marginLeft: 4,
      fontWeight: '500',
    },
    filterButtonTextActive: {
      color: '#FFFFFF',
    },
    filterBadge: {
      backgroundColor: theme.textSecondary,
      borderRadius: 8,
      paddingHorizontal: 4,
      paddingVertical: 1,
      marginLeft: 4,
      minWidth: 16,
      alignItems: 'center',
    },
    filterBadgeActive: {
      backgroundColor: '#FFFFFF',
    },
    filterBadgeText: {
      fontSize: 9,
      color: '#FFFFFF',
      fontWeight: 'bold',
    },
    filterBadgeTextActive: {
      color: theme.primary,
    },
    
    // 💳 BUDGET ITEMS MELHORADOS
    budgetItem: {
      marginHorizontal: 16,
      marginVertical: 6,
      borderRadius: 12,
      overflow: 'hidden',
      elevation: 2,
      shadowColor: theme.shadow,
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.1,
      shadowRadius: 3,
    },
    budgetGradient: {
      padding: 14,
    },
    budgetContent: {
      marginBottom: 10,
    },
    budgetHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 12,
    },
    budgetMainInfo: {
      flexDirection: 'row',
      alignItems: 'center',
      flex: 1,
    },
    budgetIconContainer: {
      backgroundColor: 'rgba(255, 255, 255, 0.2)',
      borderRadius: 8,
      width: 24,
      height: 24,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 10,
    },
    budgetTitleInfo: {
      flex: 1,
    },
    budgetName: {
      fontSize: 14,
      fontWeight: 'bold',
      color: '#FFFFFF',
      marginBottom: 2,
    },
    budgetCategory: {
      fontSize: 11,
      color: '#FFFFFF',
      opacity: 0.9,
    },
    budgetStatusBadge: {
      backgroundColor: 'rgba(255, 255, 255, 0.2)',
      borderRadius: 10,
      width: 20,
      height: 20,
      justifyContent: 'center',
      alignItems: 'center',
    },
    budgetBody: {
      gap: 8,
    },
    progressContainer: {
      gap: 4,
    },
    progressHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    progressValue: {
      fontSize: 11,
      fontWeight: 'bold',
      color: '#FFFFFF',
    },
    budgetProgressBar: {
      height: 4,
      borderRadius: 2,
      backgroundColor: 'rgba(255, 255, 255, 0.3)',
    },
    budgetValues: {
      gap: 3,
    },
    valueRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    valueLabel: {
      fontSize: 11,
      color: '#FFFFFF',
      opacity: 0.9,
    },
    valueAmount: {
      fontSize: 11,
      fontWeight: '600',
      color: '#FFFFFF',
    },
    budgetFooter: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingTop: 6,
      borderTopWidth: 1,
      borderTopColor: 'rgba(255, 255, 255, 0.2)',
    },
    footerInfo: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 3,
    },
    footerText: {
      fontSize: 10,
      color: '#FFFFFF',
      opacity: 0.9,
    },
    quickActions: {
      flexDirection: 'row',
      justifyContent: 'flex-end',
      gap: 6,
    },
    quickActionButton: {
      backgroundColor: 'rgba(255, 255, 255, 0.2)',
      borderRadius: 12,
      width: 24,
      height: 24,
      justifyContent: 'center',
      alignItems: 'center',
    },
    
    // Modal Styles (mantidos iguais)
    modalContainer: {
      flex: 1,
      backgroundColor: theme.background,
    },
    modalHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 20,
      paddingVertical: 16,
      borderBottomWidth: 1,
      borderBottomColor: theme.border,
      backgroundColor: theme.surface,
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
    
    // Details Card
    detailsCard: {
      borderRadius: 16,
      overflow: 'hidden',
      marginBottom: 24,
      elevation: 4,
      shadowColor: theme.shadow,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
    },
    detailsGradient: {
      padding: 20,
    },
    detailsHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 20,
    },
    detailsIconContainer: {
      backgroundColor: 'rgba(255, 255, 255, 0.2)',
      borderRadius: 16,
      width: 40,
      height: 40,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 16,
    },
    detailsHeaderInfo: {
      flex: 1,
    },
    detailsName: {
      fontSize: 20,
      fontWeight: 'bold',
      color: '#FFFFFF',
      marginBottom: 4,
    },
    detailsCategory: {
      fontSize: 14,
      color: '#FFFFFF',
      opacity: 0.9,
    },
    detailsStatusBadge: {
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 12,
    },
    detailsStatusText: {
      fontSize: 12,
      fontWeight: 'bold',
      color: '#FFFFFF',
    },
    detailsProgress: {
      gap: 8,
    },
    detailsProgressBar: {
      height: 8,
      borderRadius: 4,
      backgroundColor: 'rgba(255, 255, 255, 0.3)',
    },
    
    // Modal Sections
    modalSection: {
      marginBottom: 24,
    },
    modalSectionTitle: {
      fontSize: 16,
      fontWeight: 'bold',
      color: theme.text,
      marginBottom: 16,
    },
    financialGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 12,
    },
    financialItem: {
      backgroundColor: theme.surface,
      borderRadius: 12,
      padding: 16,
      width: (width - 64) / 2,
      borderWidth: 1,
      borderColor: theme.border,
    },
    financialLabel: {
      fontSize: 12,
      color: theme.textSecondary,
      marginBottom: 4,
    },
    financialValue: {
      fontSize: 16,
      fontWeight: 'bold',
      color: theme.text,
      marginBottom: 8,
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
    modalActions: {
      gap: 12,
      paddingBottom: 20,
    },
    modalButton: {
      marginHorizontal: 0,
    },
    
    // Quick Edit Modal
    quickEditOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      justifyContent: 'center',
      alignItems: 'center',
      padding: 20,
    },
    quickEditModal: {
      backgroundColor: theme.surface,
      borderRadius: 16,
      width: '100%',
      maxWidth: 400,
      elevation: 8,
      shadowColor: theme.shadow,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 8,
    },
    quickEditHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: 20,
      borderBottomWidth: 1,
      borderBottomColor: theme.border,
    },
    quickEditTitle: {
      fontSize: 16,
      fontWeight: 'bold',
      color: theme.text,
    },
    quickEditContent: {
      padding: 20,
    },
    quickEditLabel: {
      fontSize: 14,
      color: theme.textSecondary,
      marginBottom: 12,
    },
    quickEditInput: {
      marginBottom: 20,
    },
    quickEditActions: {
      flexDirection: 'row',
      gap: 12,
    },
    quickEditButton: {
      flex: 1,
      marginHorizontal: 0,
    },
    
    // Empty and Loading States
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
      borderRadius: 12,
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
    progressInfo: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
  })

  // Estados de loading e erro
  if (loading && budgets.length === 0) {
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

      {/* Error */}
      {error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>
            ❌ {error}
          </Text>
          <Button
            title="Tentar Novamente"
            onPress={refresh}
            variant="secondary"
            style={styles.retryButton}
          />
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
              refreshing={loading} 
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
    </SafeAreaView>
  )
}