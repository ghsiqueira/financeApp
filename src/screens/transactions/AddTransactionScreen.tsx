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
}

const PAYMENT_METHODS = [
  { id: 'dinheiro', label: 'Dinheiro', icon: 'cash' },
  { id: 'cartao_debito', label: 'Cartão Débito', icon: 'card' },
  { id: 'cartao_credito', label: 'Cartão Crédito', icon: 'card' },
  { id: 'pix', label: 'PIX', icon: 'phone-portrait' },
  { id: 'transferencia', label: 'Transferência', icon: 'swap-horizontal' },
  { id: 'boleto', label: 'Boleto', icon: 'document-text' },
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
      tipo: 'mensal' as 'diario' | 'semanal' | 'mensal' | 'anual',
      intervalo: 1,
    }
  })

  const [showDatePicker, setShowDatePicker] = useState(false)
  const [tagInput, setTagInput] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})

  // Buscar categorias
  const { data: categories } = useApi<Category[]>('/categories')
  
  // Buscar orçamentos ativos (apenas para despesas)
  const { data: budgets } = useApi<Budget[]>(
    formData.tipo === 'despesa' ? '/budgets?ativo=true' : null
  )

  // Mutation para criar/editar transação
  const { mutate: saveTransaction, loading: saving } = useMutation()

  // Preencher dados se estiver editando
  useEffect(() => {
    if (editingTransaction) {
      setFormData({
        ...editingTransaction,
        data: new Date(editingTransaction.data),
        valor: editingTransaction.valor.toString(),
      })
    }
  }, [editingTransaction])

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.descricao.trim()) {
      newErrors.descricao = 'Descrição é obrigatória'
    }

    if (!formData.valor.trim()) {
      newErrors.valor = 'Valor é obrigatório'
    } else if (isNaN(parseFloat(formData.valor)) || parseFloat(formData.valor) <= 0) {
      newErrors.valor = 'Valor deve ser maior que zero'
    }

    if (!formData.categoria) {
      newErrors.categoria = 'Categoria é obrigatória'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSave = async () => {
    if (!validateForm()) return

    const transactionData = {
      ...formData,
      valor: parseFloat(formData.valor),
      tags: formData.tags.filter(tag => tag.trim() !== ''),
    }

    try {
      const method = isEditing ? 'patch' : 'post'
      const url = isEditing ? `/transactions/${editingTransaction._id}` : '/transactions'
      
      await saveTransaction(method, url, transactionData, {
        onSuccess: () => {
          Alert.alert(
            'Sucesso',
            `Transação ${isEditing ? 'atualizada' : 'criada'} com sucesso!`,
            [{ text: 'OK', onPress: () => navigation.goBack() }]
          )
        },
        onError: (error) => {
          Alert.alert('Erro', error)
        }
      })
    } catch (error) {
      console.error('Erro ao salvar transação:', error)
    }
  }

  const addTag = () => {
    if (tagInput.trim() && !formData.tags.includes(tagInput.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, tagInput.trim()]
      }))
      setTagInput('')
    }
  }

  const removeTag = (tagToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }))
  }

  const TypeSelector = () => (
    <View style={styles.typeSelector}>
      <TouchableOpacity
        style={[
          styles.typeButton,
          formData.tipo === 'receita' && styles.typeButtonActiveIncome
        ]}
        onPress={() => setFormData(prev => ({ ...prev, tipo: 'receita', orcamentoId: '' }))}
      >
        <Ionicons 
          name="arrow-up" 
          size={20} 
          color={formData.tipo === 'receita' ? '#FFFFFF' : theme.success} 
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
        onPress={() => setFormData(prev => ({ ...prev, tipo: 'despesa' }))}
      >
        <Ionicons 
          name="arrow-down" 
          size={20} 
          color={formData.tipo === 'despesa' ? '#FFFFFF' : theme.error} 
        />
        <Text style={[
          styles.typeButtonText,
          formData.tipo === 'despesa' && styles.typeButtonTextActive
        ]}>
          Despesa
        </Text>
      </TouchableOpacity>
    </View>
  )

  const CategorySelector = () => {
    const filteredCategories = categories?.filter(cat => 
      cat.tipo === formData.tipo || cat.tipo === 'ambos'
    ) || []

    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Categoria</Text>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          style={styles.categoryScroll}
        >
          {filteredCategories.map((category) => (
            <TouchableOpacity
              key={category._id}
              style={[
                styles.categoryItem,
                formData.categoria === category.nome && styles.categoryItemActive,
                { borderColor: category.cor }
              ]}
              onPress={() => setFormData(prev => ({ ...prev, categoria: category.nome }))}
            >
              <Ionicons 
                name={category.icone as any} 
                size={24} 
                color={formData.categoria === category.nome ? '#FFFFFF' : category.cor} 
              />
              <Text style={[
                styles.categoryText,
                formData.categoria === category.nome && styles.categoryTextActive
              ]}>
                {category.nome}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
        {errors.categoria && <Text style={styles.errorText}>{errors.categoria}</Text>}
      </View>
    )
  }

  const PaymentMethodSelector = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Método de Pagamento</Text>
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        style={styles.paymentScroll}
      >
        {PAYMENT_METHODS.map((method) => (
          <TouchableOpacity
            key={method.id}
            style={[
              styles.paymentItem,
              formData.metodoPagamento === method.id && styles.paymentItemActive
            ]}
            onPress={() => setFormData(prev => ({ ...prev, metodoPagamento: method.id }))}
          >
            <Ionicons 
              name={method.icon as any} 
              size={20} 
              color={formData.metodoPagamento === method.id ? '#FFFFFF' : theme.primary} 
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
  )

  const TagsSection = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Tags</Text>
      
      <View style={styles.tagInputContainer}>
        <Input
          placeholder="Digite uma tag"
          value={tagInput}
          onChangeText={setTagInput}
          onSubmitEditing={addTag}
          style={styles.tagInput}
        />
        <TouchableOpacity style={styles.addTagButton} onPress={addTag}>
          <Ionicons name="add" size={20} color={theme.primary} />
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
  )

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
      minWidth: 80,
    },
    categoryItemActive: {
      backgroundColor: theme.primary,
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
      paddingLeft: 16,
    },
    recurrentOption: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 8,
    },
    recurrentOptionText: {
      marginLeft: 12,
      fontSize: 16,
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
        <ScrollView 
          style={styles.content}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Type Selector */}
          <TypeSelector />

          {/* Basic Info */}
          <View style={styles.inputContainer}>
            <Input
              label="Descrição"
              placeholder="Ex: Almoço no restaurante"
              value={formData.descricao}
              onChangeText={(text) => setFormData(prev => ({ ...prev, descricao: text }))}
              error={errors.descricao}
              required
            />
          </View>

          <View style={styles.inputContainer}>
            <Input
              label="Valor"
              placeholder="0,00"
              value={formData.valor}
              onChangeText={(text) => setFormData(prev => ({ ...prev, valor: text }))}
              keyboardType="numeric"
              leftIcon="attach-outline"
              error={errors.valor}
              required
            />
          </View>

          {/* Date Picker */}
          <View style={styles.dateContainer}>
            <Text style={styles.sectionTitle}>Data</Text>
            <TouchableOpacity 
              style={styles.dateButton}
              onPress={() => setShowDatePicker(true)}
            >
              <Ionicons name="calendar" size={20} color={theme.primary} />
              <Text style={styles.dateText}>
                {formData.data.toLocaleDateString('pt-BR')}
              </Text>
            </TouchableOpacity>
          </View>

          {showDatePicker && (
            <DateTimePicker
              value={formData.data}
              mode="date"
              display="default"
              onChange={(event, selectedDate) => {
                setShowDatePicker(false)
                if (selectedDate) {
                  setFormData(prev => ({ ...prev, data: selectedDate }))
                }
              }}
            />
          )}

          {/* Category Selector */}
          <CategorySelector />

          {/* Payment Method */}
          <PaymentMethodSelector />

          {/* Budget Selection (only for expenses) */}
          {formData.tipo === 'despesa' && budgets && budgets.length > 0 && (
            <View style={styles.budgetSection}>
              <Text style={styles.sectionTitle}>Orçamento (Opcional)</Text>
              
              <TouchableOpacity
                style={[
                  styles.budgetOption,
                  !formData.orcamentoId && styles.budgetOptionActive
                ]}
                onPress={() => setFormData(prev => ({ ...prev, orcamentoId: '' }))}
              >
                <Ionicons 
                  name={!formData.orcamentoId ? "radio-button-on" : "radio-button-off"} 
                  size={20} 
                  color={theme.primary} 
                />
                <View style={styles.budgetOptionText}>
                  <Text style={styles.budgetName}>Sem orçamento</Text>
                </View>
              </TouchableOpacity>

              {budgets.map((budget) => (
                <TouchableOpacity
                  key={budget._id}
                  style={[
                    styles.budgetOption,
                    formData.orcamentoId === budget._id && styles.budgetOptionActive
                  ]}
                  onPress={() => setFormData(prev => ({ ...prev, orcamentoId: budget._id }))}
                >
                  <Ionicons 
                    name={formData.orcamentoId === budget._id ? "radio-button-on" : "radio-button-off"} 
                    size={20} 
                    color={theme.primary} 
                  />
                  <View style={styles.budgetOptionText}>
                    <Text style={styles.budgetName}>{budget.nome}</Text>
                    <Text style={styles.budgetInfo}>
                      Usado: R$ {budget.valorGasto.toFixed(2)} de R$ {budget.valorLimite.toFixed(2)}
                    </Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          )}

          {/* Tags */}
          <TagsSection />

          {/* Observations */}
          <View style={styles.inputContainer}>
            <Input
              label="Observações (Opcional)"
              placeholder="Detalhes adicionais sobre a transação"
              value={formData.observacoes}
              onChangeText={(text) => setFormData(prev => ({ ...prev, observacoes: text }))}
              multiline
              numberOfLines={3}
            />
          </View>

          {/* Recurrent Transaction */}
          <View style={styles.recurrentSection}>
            <View style={styles.switchContainer}>
              <Text style={styles.switchLabel}>Transação Recorrente</Text>
              <TouchableOpacity
                onPress={() => setFormData(prev => ({ 
                  ...prev, 
                  recorrente: { ...prev.recorrente, ativo: !prev.recorrente.ativo }
                }))}
              >
                <Ionicons 
                  name={formData.recorrente.ativo ? "toggle" : "toggle-outline"} 
                  size={32} 
                  color={formData.recorrente.ativo ? theme.primary : theme.textSecondary} 
                />
              </TouchableOpacity>
            </View>

            {formData.recorrente.ativo && (
              <View style={styles.recurrentOptions}>
                {[
                  { value: 'semanal', label: 'Semanal' },
                  { value: 'mensal', label: 'Mensal' },
                  { value: 'anual', label: 'Anual' },
                ].map((option) => (
                  <TouchableOpacity
                    key={option.value}
                    style={styles.recurrentOption}
                    onPress={() => setFormData(prev => ({ 
                      ...prev, 
                      recorrente: { ...prev.recorrente, tipo: option.value as any }
                    }))}
                  >
                    <Ionicons 
                      name={formData.recorrente.tipo === option.value ? "radio-button-on" : "radio-button-off"} 
                      size={20} 
                      color={theme.primary} 
                    />
                    <Text style={styles.recurrentOptionText}>{option.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>
        </ScrollView>

        {/* Save Button */}
        <Button
          title={isEditing ? 'Atualizar Transação' : 'Salvar Transação'}
          onPress={handleSave}
          loading={saving}
          style={styles.saveButton}
          fullWidth
        />
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}