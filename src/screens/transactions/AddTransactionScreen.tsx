import React, { useState, useEffect } from 'react'
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Switch,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import DateTimePicker from '@react-native-community/datetimepicker'

import { useTheme } from '../../context/ThemeContext'
import { useMutation, useApi } from '../../hooks/useApi'
import Button from '../../components/common/Button'
import Input from '../../components/common/Input'

interface Category {
  _id: string
  nome: string
  tipo: 'receita' | 'despesa' | 'ambos'
  icone: string
  cor: string
}

interface Budget {
  _id: string
  nome: string
  categoria: string
  valorLimite: number
  valorGasto: number
  valorRestante: number
}

const PAYMENT_METHODS = [
  { id: 'dinheiro', label: 'Dinheiro', icon: 'cash' },
  { id: 'cartao_debito', label: 'Cartão Débito', icon: 'card' },
  { id: 'cartao_credito', label: 'Cartão Crédito', icon: 'card' },
  { id: 'pix', label: 'PIX', icon: 'phone-portrait' },
  { id: 'transferencia', label: 'Transferência', icon: 'swap-horizontal' },
  { id: 'boleto', label: 'Boleto', icon: 'document-text' },
]

const RECURRENCE_TYPES = [
  { id: 'diario', label: 'Diário', icon: 'calendar' },
  { id: 'semanal', label: 'Semanal', icon: 'calendar' },
  { id: 'mensal', label: 'Mensal', icon: 'calendar' },
  { id: 'personalizado', label: 'Personalizado', icon: 'settings' },
]

export default function AddTransactionScreen({ navigation, route }: any) {
  const { theme } = useTheme()
  const editingTransaction = route?.params?.transaction
  const isEditing = !!editingTransaction

  const [formData, setFormData] = useState({
    tipo: 'despesa' as 'receita' | 'despesa',
    descricao: '',
    valor: '',
    categoria: '',
    metodoPagamento: 'dinheiro',
    data: new Date(),
    observacoes: '',
    orcamentoId: '',
    tags: [] as string[],
    recorrente: {
      ativo: false,
      tipo: 'mensal' as 'diario' | 'semanal' | 'mensal' | 'personalizado',
      dataInicio: new Date(),
      dataFim: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 ano depois
      intervalo: 1,
    }
  })

  const [showDatePicker, setShowDatePicker] = useState(false)
  const [showStartDatePicker, setShowStartDatePicker] = useState(false)
  const [showEndDatePicker, setShowEndDatePicker] = useState(false)
  const [tagInput, setTagInput] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})

  // Buscar categorias - CORRIGIDO para acessar .data com debug
  const { data: categoriesResponse } = useApi('/categories')
  
  // Debug: ver o que está sendo retornado
  console.log('📊 Categories Response:', categoriesResponse)
  
  // Extrair categorias de forma segura
  let categories = []
  if (categoriesResponse) {
    if (Array.isArray(categoriesResponse)) {
      // Se já é um array diretamente
      categories = categoriesResponse
    } else if (categoriesResponse.data && Array.isArray(categoriesResponse.data)) {
      // Se está dentro de .data
      categories = categoriesResponse.data
    } else if (categoriesResponse.success && Array.isArray(categoriesResponse.data)) {
      // Se tem success e data
      categories = categoriesResponse.data
    }
  }
  
  console.log('📊 Categories Final:', categories)
  
  // Buscar orçamentos ativos (apenas para despesas) - CORRIGIDO para acessar .data
  const { data: budgetsResponse } = useApi(
    formData.tipo === 'despesa' ? '/budgets?status=ativo' : null
  )
  
  // Extrair orçamentos de forma segura
  let budgets = []
  if (budgetsResponse) {
    if (Array.isArray(budgetsResponse)) {
      budgets = budgetsResponse
    } else if (budgetsResponse.data && Array.isArray(budgetsResponse.data)) {
      budgets = budgetsResponse.data
    } else if (budgetsResponse.success && Array.isArray(budgetsResponse.data)) {
      budgets = budgetsResponse.data
    }
  }

  const { mutate: saveTransaction, loading: saving } = useMutation()

  // Carregar dados se estiver editando
  useEffect(() => {
    if (editingTransaction) {
      setFormData({
        ...formData,
        tipo: editingTransaction.tipo,
        descricao: editingTransaction.descricao,
        valor: editingTransaction.valor.toString(),
        categoria: editingTransaction.categoria,
        metodoPagamento: editingTransaction.metodoPagamento,
        data: new Date(editingTransaction.data),
        observacoes: editingTransaction.observacoes || '',
        orcamentoId: editingTransaction.orcamentoId || '',
        tags: editingTransaction.tags || [],
        recorrente: editingTransaction.recorrente || formData.recorrente,
      })
    }
  }, [editingTransaction])

  const filteredCategories = Array.isArray(categories) ? categories.filter((cat: Category) => 
    cat.tipo === formData.tipo || cat.tipo === 'ambos'
  ) : []

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.descricao.trim()) {
      newErrors.descricao = 'Descrição é obrigatória'
    }

    if (!formData.valor || parseFloat(formData.valor) <= 0) {
      newErrors.valor = 'Valor deve ser maior que zero'
    }

    if (!formData.categoria) {
      newErrors.categoria = 'Selecione uma categoria'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSave = async () => {
    if (!validateForm()) return

    try {
      const transactionData = {
        ...formData,
        valor: parseFloat(formData.valor),
        data: formData.data.toISOString(),
        recorrente: formData.recorrente.ativo ? {
          ...formData.recorrente,
          dataInicio: formData.recorrente.dataInicio.toISOString(),
          dataFim: formData.recorrente.dataFim.toISOString(),
        } : undefined,
      }

      if (isEditing) {
        await saveTransaction('put', `/transactions/${editingTransaction._id}`, transactionData)
      } else {
        await saveTransaction('post', '/transactions', transactionData)
      }

      Alert.alert(
        'Sucesso',
        `Transação ${isEditing ? 'atualizada' : 'criada'} com sucesso!`,
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      )
    } catch (error: any) {
      Alert.alert('Erro', error.message || 'Erro ao salvar transação')
    }
  }

  const addTag = () => {
    if (tagInput.trim() && !formData.tags.includes(tagInput.trim())) {
      setFormData({
        ...formData,
        tags: [...formData.tags, tagInput.trim()]
      })
      setTagInput('')
    }
  }

  const removeTag = (tagToRemove: string) => {
    setFormData({
      ...formData,
      tags: formData.tags.filter(tag => tag !== tagToRemove)
    })
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value)
  }

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('pt-BR')
  }

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.background,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 20,
      paddingVertical: 16,
      borderBottomWidth: 1,
      borderBottomColor: theme.border,
    },
    backButton: {
      marginRight: 16,
    },
    title: {
      fontSize: 20,
      fontWeight: 'bold',
      color: theme.text,
    },
    content: {
      flex: 1,
      paddingHorizontal: 20,
    },
    typeSelector: {
      flexDirection: 'row',
      marginVertical: 20,
      gap: 12,
    },
    typeButton: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 16,
      borderRadius: 12,
      backgroundColor: theme.surface,
      borderWidth: 2,
      borderColor: theme.border,
      gap: 8,
    },
    typeButtonActiveIncome: {
      backgroundColor: theme.success,
      borderColor: theme.success,
    },
    typeButtonActiveExpense: {
      backgroundColor: theme.error,
      borderColor: theme.error,
    },
    typeButtonText: {
      fontSize: 16,
      fontWeight: '600',
      color: theme.text,
    },
    typeButtonTextActive: {
      color: '#FFFFFF',
    },
    section: {
      marginBottom: 24,
    },
    sectionTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: theme.text,
      marginBottom: 12,
    },
    categoryScroll: {
      marginHorizontal: -20,
      paddingHorizontal: 20,
    },
    categoryItem: {
      alignItems: 'center',
      paddingVertical: 12,
      paddingHorizontal: 16,
      marginRight: 12,
      borderRadius: 12,
      backgroundColor: theme.surface,
      borderWidth: 2,
      borderColor: theme.border,
      minWidth: 80,
    },
    categoryItemActive: {
      backgroundColor: theme.primary,
      borderColor: theme.primary,
    },
    categoryText: {
      fontSize: 12,
      color: theme.text,
      textAlign: 'center',
      marginTop: 4,
    },
    categoryTextActive: {
      color: '#FFFFFF',
    },
    paymentScroll: {
      marginHorizontal: -20,
      paddingHorizontal: 20,
    },
    paymentItem: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 8,
      paddingHorizontal: 12,
      marginRight: 8,
      borderRadius: 20,
      backgroundColor: theme.surface,
      borderWidth: 1,
      borderColor: theme.border,
      gap: 6,
    },
    paymentItemActive: {
      backgroundColor: theme.primary,
      borderColor: theme.primary,
    },
    paymentText: {
      fontSize: 14,
      color: theme.text,
    },
    paymentTextActive: {
      color: '#FFFFFF',
    },
    inputContainer: {
      marginBottom: 16,
    },
    dateContainer: {
      marginBottom: 16,
    },
    dateButton: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 12,
      paddingHorizontal: 14,
      backgroundColor: theme.surface,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: theme.border,
      gap: 12,
    },
    dateText: {
      fontSize: 16,
      color: theme.text,
    },
    tagInputContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    tagInput: {
      flex: 1,
    },
    addTagButton: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: theme.surface,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: theme.border,
    },
    tagsContainer: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      marginTop: 12,
      gap: 8,
    },
    tag: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.primary + '20',
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 16,
      gap: 6,
    },
    tagText: {
      fontSize: 14,
      color: theme.primary,
      fontWeight: '500',
    },
    budgetSection: {
      marginBottom: 24,
    },
    budgetOption: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 12,
      paddingHorizontal: 16,
      backgroundColor: theme.surface,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: theme.border,
      marginBottom: 8,
    },
    budgetOptionActive: {
      borderColor: theme.primary,
      backgroundColor: theme.primary + '10',
    },
    budgetOptionText: {
      flex: 1,
      marginLeft: 12,
    },
    budgetName: {
      fontSize: 16,
      fontWeight: '500',
      color: theme.text,
    },
    budgetInfo: {
      fontSize: 12,
      color: theme.textSecondary,
      marginTop: 2,
    },
    recurrentSection: {
      marginBottom: 24,
    },
    switchContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: 8,
    },
    switchLabel: {
      fontSize: 16,
      color: theme.text,
    },
    recurrentOptions: {
      marginTop: 12,
    },
    recurrentOption: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 12,
      paddingHorizontal: 16,
      backgroundColor: theme.surface,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: theme.border,
      marginBottom: 8,
    },
    recurrentOptionActive: {
      borderColor: theme.primary,
      backgroundColor: theme.primary + '10',
    },
    recurrentOptionText: {
      marginLeft: 12,
      fontSize: 16,
      color: theme.text,
      flex: 1,
    },
    dateRangeContainer: {
      flexDirection: 'row',
      gap: 12,
      marginTop: 12,
    },
    dateRangeButton: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 12,
      paddingHorizontal: 14,
      backgroundColor: theme.surface,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: theme.border,
      gap: 8,
    },
    dateRangeText: {
      fontSize: 14,
      color: theme.text,
    },
    saveButton: {
      margin: 20,
      marginBottom: 40,
    },
    errorText: {
      fontSize: 12,
      color: theme.error,
      marginTop: 4,
    },
  })

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
        <Text style={styles.title}>
          {isEditing ? 'Editar Transação' : 'Nova Transação'}
        </Text>
      </View>

      <KeyboardAvoidingView 
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Tipo de Transação */}
          <View style={styles.typeSelector}>
            <TouchableOpacity
              style={[
                styles.typeButton,
                formData.tipo === 'receita' && styles.typeButtonActiveIncome
              ]}
              onPress={() => setFormData({ ...formData, tipo: 'receita', categoria: '', orcamentoId: '' })}
            >
              <Ionicons 
                name="arrow-up" 
                size={20} 
                color={formData.tipo === 'receita' ? '#FFFFFF' : theme.text} 
              />
              <Text style={[
                styles.typeButtonText,
                formData.tipo === 'receita' && styles.typeButtonTextActive
              ]}>
                Receita
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.typeButton,
                formData.tipo === 'despesa' && styles.typeButtonActiveExpense
              ]}
              onPress={() => setFormData({ ...formData, tipo: 'despesa', categoria: '' })}
            >
              <Ionicons 
                name="arrow-down" 
                size={20} 
                color={formData.tipo === 'despesa' ? '#FFFFFF' : theme.text} 
              />
              <Text style={[
                styles.typeButtonText,
                formData.tipo === 'despesa' && styles.typeButtonTextActive
              ]}>
                Despesa
              </Text>
            </TouchableOpacity>
          </View>

          {/* Descrição */}
          <View style={styles.inputContainer}>
            <Input
              label="Descrição"
              value={formData.descricao}
              onChangeText={(text) => setFormData({ ...formData, descricao: text })}
              placeholder="Ex: Almoço no restaurante"
              error={errors.descricao}
            />
          </View>

          {/* Valor */}
          <View style={styles.inputContainer}>
            <Input
              label="Valor"
              value={formData.valor}
              onChangeText={(text) => setFormData({ ...formData, valor: text })}
              placeholder="0,00"
              keyboardType="numeric"
              error={errors.valor}
            />
          </View>

          {/* Categorias */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              Categoria {formData.tipo === 'receita' ? 'de Receita' : 'de Despesa'}
            </Text>
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.categoryScroll}
            >
              {filteredCategories.map((category: Category) => (
                <TouchableOpacity
                  key={category._id}
                  style={[
                    styles.categoryItem,
                    formData.categoria === category._id && styles.categoryItemActive
                  ]}
                  onPress={() => setFormData({ ...formData, categoria: category._id })}
                >
                  <Ionicons 
                    name={category.icone as any} 
                    size={24} 
                    color={formData.categoria === category._id ? '#FFFFFF' : category.cor} 
                  />
                  <Text style={[
                    styles.categoryText,
                    formData.categoria === category._id && styles.categoryTextActive
                  ]}>
                    {category.nome}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            {errors.categoria && <Text style={styles.errorText}>{errors.categoria}</Text>}
          </View>

          {/* Método de Pagamento */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Método de Pagamento</Text>
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.paymentScroll}
            >
              {PAYMENT_METHODS.map((method) => (
                <TouchableOpacity
                  key={method.id}
                  style={[
                    styles.paymentItem,
                    formData.metodoPagamento === method.id && styles.paymentItemActive
                  ]}
                  onPress={() => setFormData({ ...formData, metodoPagamento: method.id })}
                >
                  <Ionicons 
                    name={method.icon as any} 
                    size={16} 
                    color={formData.metodoPagamento === method.id ? '#FFFFFF' : theme.text} 
                  />
                  <Text style={[
                    styles.paymentText,
                    formData.metodoPagamento === method.id && styles.paymentTextActive
                  ]}>
                    {method.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          {/* Data */}
          <View style={styles.dateContainer}>
            <Text style={styles.sectionTitle}>Data</Text>
            <TouchableOpacity
              style={styles.dateButton}
              onPress={() => setShowDatePicker(true)}
            >
              <Ionicons name="calendar" size={20} color={theme.text} />
              <Text style={styles.dateText}>{formatDate(formData.data)}</Text>
            </TouchableOpacity>
          </View>

          {/* Orçamento (apenas para despesas) */}
          {formData.tipo === 'despesa' && Array.isArray(budgets) && budgets.length > 0 && (
            <View style={styles.budgetSection}>
              <Text style={styles.sectionTitle}>Orçamento (Opcional)</Text>
              <TouchableOpacity
                style={[
                  styles.budgetOption,
                  !formData.orcamentoId && styles.budgetOptionActive
                ]}
                onPress={() => setFormData({ ...formData, orcamentoId: '' })}
              >
                <Ionicons 
                  name={!formData.orcamentoId ? "radio-button-on" : "radio-button-off"} 
                  size={20} 
                  color={theme.primary} 
                />
                <View style={styles.budgetOptionText}>
                  <Text style={styles.budgetName}>Não utilizar orçamento</Text>
                </View>
              </TouchableOpacity>
              {Array.isArray(budgets) && budgets.map((budget: Budget) => (
                <TouchableOpacity
                  key={budget._id}
                  style={[
                    styles.budgetOption,
                    formData.orcamentoId === budget._id && styles.budgetOptionActive
                  ]}
                  onPress={() => setFormData({ ...formData, orcamentoId: budget._id })}
                >
                  <Ionicons 
                    name={formData.orcamentoId === budget._id ? "radio-button-on" : "radio-button-off"} 
                    size={20} 
                    color={theme.primary} 
                  />
                  <View style={styles.budgetOptionText}>
                    <Text style={styles.budgetName}>{budget.nome}</Text>
                    <Text style={styles.budgetInfo}>
                      Restante: {formatCurrency(budget.valorRestante)}
                    </Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          )}

          {/* Transação Recorrente */}
          <View style={styles.recurrentSection}>
            <View style={styles.switchContainer}>
              <Text style={styles.switchLabel}>Transação Recorrente</Text>
              <Switch
                value={formData.recorrente.ativo}
                onValueChange={(value) => 
                  setFormData({ 
                    ...formData, 
                    recorrente: { ...formData.recorrente, ativo: value } 
                  })
                }
                trackColor={{ false: theme.border, true: theme.primary + '50' }}
                thumbColor={formData.recorrente.ativo ? theme.primary : '#f4f3f4'}
              />
            </View>

            {formData.recorrente.ativo && (
              <View style={styles.recurrentOptions}>
                <Text style={styles.sectionTitle}>Frequência</Text>
                {RECURRENCE_TYPES.map((type) => (
                  <TouchableOpacity
                    key={type.id}
                    style={[
                      styles.recurrentOption,
                      formData.recorrente.tipo === type.id && styles.recurrentOptionActive
                    ]}
                    onPress={() => 
                      setFormData({ 
                        ...formData, 
                        recorrente: { ...formData.recorrente, tipo: type.id as any } 
                      })
                    }
                  >
                    <Ionicons 
                      name={formData.recorrente.tipo === type.id ? "radio-button-on" : "radio-button-off"} 
                      size={20} 
                      color={theme.primary} 
                    />
                    <Text style={styles.recurrentOptionText}>{type.label}</Text>
                  </TouchableOpacity>
                ))}

                {formData.recorrente.tipo === 'personalizado' && (
                  <View style={styles.dateRangeContainer}>
                    <TouchableOpacity
                      style={styles.dateRangeButton}
                      onPress={() => setShowStartDatePicker(true)}
                    >
                      <Ionicons name="calendar" size={16} color={theme.text} />
                      <Text style={styles.dateRangeText}>
                        Início: {formatDate(formData.recorrente.dataInicio)}
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.dateRangeButton}
                      onPress={() => setShowEndDatePicker(true)}
                    >
                      <Ionicons name="calendar" size={16} color={theme.text} />
                      <Text style={styles.dateRangeText}>
                        Fim: {formatDate(formData.recorrente.dataFim)}
                      </Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            )}
          </View>

          {/* Tags */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Tags (Opcional)</Text>
            <View style={styles.tagInputContainer}>
              <Input
                style={styles.tagInput}
                value={tagInput}
                onChangeText={setTagInput}
                placeholder="Adicionar tag"
                onSubmitEditing={addTag}
              />
              <TouchableOpacity style={styles.addTagButton} onPress={addTag}>
                <Ionicons name="add" size={20} color={theme.text} />
              </TouchableOpacity>
            </View>
            {formData.tags.length > 0 && (
              <View style={styles.tagsContainer}>
                {formData.tags.map((tag, index) => (
                  <View key={index} style={styles.tag}>
                    <Text style={styles.tagText}>{tag}</Text>
                    <TouchableOpacity onPress={() => removeTag(tag)}>
                      <Ionicons name="close" size={16} color={theme.primary} />
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            )}
          </View>

          {/* Observações */}
          <View style={styles.inputContainer}>
            <Input
              label="Observações (Opcional)"
              value={formData.observacoes}
              onChangeText={(text) => setFormData({ ...formData, observacoes: text })}
              placeholder="Observações adicionais..."
              multiline
              numberOfLines={3}
            />
          </View>
        </ScrollView>

        {/* Botão Salvar */}
        <View style={styles.saveButton}>
          <Button
            title={isEditing ? 'Atualizar Transação' : 'Salvar Transação'}
            onPress={handleSave}
            loading={saving}
          />
        </View>
      </KeyboardAvoidingView>

      {/* Date Pickers */}
      {showDatePicker && (
        <DateTimePicker
          value={formData.data}
          mode="date"
          display="default"
          onChange={(event, selectedDate) => {
            setShowDatePicker(false)
            if (selectedDate) {
              setFormData({ ...formData, data: selectedDate })
            }
          }}
        />
      )}

      {showStartDatePicker && (
        <DateTimePicker
          value={formData.recorrente.dataInicio}
          mode="date"
          display="default"
          onChange={(event, selectedDate) => {
            setShowStartDatePicker(false)
            if (selectedDate) {
              setFormData({ 
                ...formData, 
                recorrente: { ...formData.recorrente, dataInicio: selectedDate }
              })
            }
          }}
        />
      )}

      {showEndDatePicker && (
        <DateTimePicker
          value={formData.recorrente.dataFim}
          mode="date"
          display="default"
          onChange={(event, selectedDate) => {
            setShowEndDatePicker(false)
            if (selectedDate) {
              setFormData({ 
                ...formData, 
                recorrente: { ...formData.recorrente, dataFim: selectedDate }
              })
            }
          }}
        />
      )}
    </SafeAreaView>
  )
}