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

const PERIOD_TYPES = [
  { id: 'semanal', label: 'Semanal', icon: 'calendar' },
  { id: 'mensal', label: 'Mensal', icon: 'calendar' },
  { id: 'trimestral', label: 'Trimestral', icon: 'calendar' },
  { id: 'anual', label: 'Anual', icon: 'calendar' },
  { id: 'personalizado', label: 'Personalizado', icon: 'settings' },
]

const BUDGET_COLORS = [
  '#FF3B30', '#FF9500', '#FFCC02', '#34C759', '#30D158',
  '#007AFF', '#5856D6', '#AF52DE', '#FF2D92', '#8E8E93'
]

export default function AddBudgetScreen({ navigation, route }: any) {
  const { theme } = useTheme()
  const editingBudget = route?.params?.budget
  const isEditing = !!editingBudget

  const [formData, setFormData] = useState({
    nome: '',
    categoria: '',
    valorLimite: '',
    periodo: 'mensal' as 'semanal' | 'mensal' | 'trimestral' | 'anual' | 'personalizado',
    dataInicio: new Date(),
    dataFim: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 dias depois
    cor: BUDGET_COLORS[0],
    icone: 'wallet',
    renovacaoAutomatica: true,
    alertas: {
      ativo: true,
      porcentagens: [50, 80, 90, 100],
    },
    descricao: '',
  })

  const [showStartDatePicker, setShowStartDatePicker] = useState(false)
  const [showEndDatePicker, setShowEndDatePicker] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  // Buscar categorias de despesa - CORRIGIDO para acessar .data
  const { data: categoriesResponse } = useApi<any>('/categories?tipo=despesa')
  const categories = categoriesResponse?.data || []

  const { mutate: saveBudget, loading: saving } = useMutation()

  // Carregar dados se estiver editando
  useEffect(() => {
    if (editingBudget) {
      setFormData({
        ...formData,
        nome: editingBudget.nome,
        categoria: editingBudget.categoria,
        valorLimite: editingBudget.valorLimite.toString(),
        periodo: editingBudget.periodo,
        dataInicio: new Date(editingBudget.dataInicio),
        dataFim: new Date(editingBudget.dataFim),
        cor: editingBudget.cor,
        icone: editingBudget.icone,
        renovacaoAutomatica: editingBudget.renovacaoAutomatica,
        alertas: editingBudget.alertas || formData.alertas,
        descricao: editingBudget.descricao || '',
      })
    }
  }, [editingBudget])

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.nome.trim()) {
      newErrors.nome = 'Nome é obrigatório'
    }

    if (!formData.valorLimite || parseFloat(formData.valorLimite) <= 0) {
      newErrors.valorLimite = 'Valor deve ser maior que zero'
    }

    if (!formData.categoria) {
      newErrors.categoria = 'Selecione uma categoria'
    }

    if (formData.periodo === 'personalizado') {
      if (formData.dataFim <= formData.dataInicio) {
        newErrors.dataFim = 'Data fim deve ser posterior à data início'
      }
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSave = async () => {
    if (!validateForm()) return

    try {
      const budgetData = {
        ...formData,
        valorLimite: parseFloat(formData.valorLimite),
        dataInicio: formData.dataInicio.toISOString(),
        dataFim: formData.dataFim.toISOString(),
      }

      if (isEditing) {
        await saveBudget('put', `/budgets/${editingBudget._id}`, budgetData)
      } else {
        await saveBudget('post', '/budgets', budgetData)
      }

      Alert.alert(
        'Sucesso',
        `Orçamento ${isEditing ? 'atualizado' : 'criado'} com sucesso!`,
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      )
    } catch (error: any) {
      Alert.alert('Erro', error.message || 'Erro ao salvar orçamento')
    }
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

  const calculateEndDate = (periodo: string, startDate: Date) => {
    const date = new Date(startDate)
    switch (periodo) {
      case 'semanal':
        date.setDate(date.getDate() + 7)
        break
      case 'mensal':
        date.setMonth(date.getMonth() + 1)
        break
      case 'trimestral':
        date.setMonth(date.getMonth() + 3)
        break
      case 'anual':
        date.setFullYear(date.getFullYear() + 1)
        break
      default:
        return date
    }
    return date
  }

  useEffect(() => {
    if (formData.periodo !== 'personalizado') {
      const newEndDate = calculateEndDate(formData.periodo, formData.dataInicio)
      setFormData((prev: typeof formData) => ({ ...prev, dataFim: newEndDate }))
    }
  }, [formData.periodo, formData.dataInicio])

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
      paddingVertical: 20,
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
    inputContainer: {
      marginBottom: 16,
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
    periodOptions: {
      gap: 8,
    },
    periodOption: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 12,
      paddingHorizontal: 16,
      backgroundColor: theme.surface,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: theme.border,
    },
    periodOptionActive: {
      borderColor: theme.primary,
      backgroundColor: theme.primary + '10',
    },
    periodOptionText: {
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
    dateButton: {
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
    dateText: {
      fontSize: 14,
      color: theme.text,
    },
    colorContainer: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 12,
    },
    colorOption: {
      width: 40,
      height: 40,
      borderRadius: 20,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 3,
      borderColor: 'transparent',
    },
    colorOptionActive: {
      borderColor: theme.primary,
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
    alertContainer: {
      marginTop: 12,
    },
    alertOption: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 8,
      paddingHorizontal: 12,
      backgroundColor: theme.surface,
      borderRadius: 8,
      marginBottom: 4,
    },
    alertText: {
      marginLeft: 8,
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
          {isEditing ? 'Editar Orçamento' : 'Novo Orçamento'}
        </Text>
      </View>

      <KeyboardAvoidingView 
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Nome */}
          <View style={styles.inputContainer}>
            <Input
              label="Nome do Orçamento"
              value={formData.nome}
              onChangeText={(text) => setFormData({ ...formData, nome: text })}
              placeholder="Ex: Alimentação"
              error={errors.nome}
            />
          </View>

          {/* Valor Limite */}
          <View style={styles.inputContainer}>
            <Input
              label="Valor Limite"
              value={formData.valorLimite}
              onChangeText={(text) => setFormData({ ...formData, valorLimite: text })}
              placeholder="0,00"
              keyboardType="numeric"
              error={errors.valorLimite}
            />
          </View>

          {/* Categoria */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Categoria</Text>
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.categoryScroll}
            >
              {Array.isArray(categories) && categories.map((category: Category) => (
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

          {/* Período */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Período</Text>
            <View style={styles.periodOptions}>
              {PERIOD_TYPES.map((period) => (
                <TouchableOpacity
                  key={period.id}
                  style={[
                    styles.periodOption,
                    formData.periodo === period.id && styles.periodOptionActive
                  ]}
                  onPress={() => 
                    setFormData({ 
                      ...formData, 
                      periodo: period.id as any 
                    })
                  }
                >
                  <Ionicons 
                    name={formData.periodo === period.id ? "radio-button-on" : "radio-button-off"} 
                    size={20} 
                    color={theme.primary} 
                  />
                  <Text style={styles.periodOptionText}>{period.label}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Datas personalizadas */}
            {formData.periodo === 'personalizado' && (
              <View style={styles.dateRangeContainer}>
                <TouchableOpacity
                  style={styles.dateButton}
                  onPress={() => setShowStartDatePicker(true)}
                >
                  <Ionicons name="calendar" size={16} color={theme.text} />
                  <Text style={styles.dateText}>
                    Início: {formatDate(formData.dataInicio)}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.dateButton}
                  onPress={() => setShowEndDatePicker(true)}
                >
                  <Ionicons name="calendar" size={16} color={theme.text} />
                  <Text style={styles.dateText}>
                    Fim: {formatDate(formData.dataFim)}
                  </Text>
                </TouchableOpacity>
              </View>
            )}
            {errors.dataFim && <Text style={styles.errorText}>{errors.dataFim}</Text>}
          </View>

          {/* Cor */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Cor</Text>
            <View style={styles.colorContainer}>
              {BUDGET_COLORS.map((color) => (
                <TouchableOpacity
                  key={color}
                  style={[
                    styles.colorOption,
                    { backgroundColor: color },
                    formData.cor === color && styles.colorOptionActive
                  ]}
                  onPress={() => setFormData({ ...formData, cor: color })}
                >
                  {formData.cor === color && (
                    <Ionicons name="checkmark" size={20} color="#FFFFFF" />
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Renovação Automática */}
          <View style={styles.section}>
            <View style={styles.switchContainer}>
              <Text style={styles.switchLabel}>Renovação Automática</Text>
              <Switch
                value={formData.renovacaoAutomatica}
                onValueChange={(value) => 
                  setFormData({ ...formData, renovacaoAutomatica: value })
                }
                trackColor={{ false: theme.border, true: theme.primary + '50' }}
                thumbColor={formData.renovacaoAutomatica ? theme.primary : '#f4f3f4'}
              />
            </View>
          </View>

          {/* Alertas */}
          <View style={styles.section}>
            <View style={styles.switchContainer}>
              <Text style={styles.switchLabel}>Alertas de Limite</Text>
              <Switch
                value={formData.alertas.ativo}
                onValueChange={(value) => 
                  setFormData({ 
                    ...formData, 
                    alertas: { ...formData.alertas, ativo: value } 
                  })
                }
                trackColor={{ false: theme.border, true: theme.primary + '50' }}
                thumbColor={formData.alertas.ativo ? theme.primary : '#f4f3f4'}
              />
            </View>

            {formData.alertas.ativo && (
              <View style={styles.alertContainer}>
                <Text style={styles.sectionTitle}>Notificar quando atingir:</Text>
                {[50, 80, 90, 100].map((percentage) => (
                  <TouchableOpacity
                    key={percentage}
                    style={styles.alertOption}
                    onPress={() => {
                      const newPercentages = formData.alertas.porcentagens.includes(percentage)
                        ? formData.alertas.porcentagens.filter((p: number) => p !== percentage)
                        : [...formData.alertas.porcentagens, percentage]
                      setFormData({
                        ...formData,
                        alertas: { ...formData.alertas, porcentagens: newPercentages }
                      })
                    }}
                  >
                    <Ionicons 
                      name={formData.alertas.porcentagens.includes(percentage) ? "checkbox" : "square-outline"} 
                      size={20} 
                      color={theme.primary} 
                    />
                    <Text style={styles.alertText}>{percentage}% do limite</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>

          {/* Descrição */}
          <View style={styles.inputContainer}>
            <Input
              label="Descrição (Opcional)"
              value={formData.descricao}
              onChangeText={(text) => setFormData({ ...formData, descricao: text })}
              placeholder="Descrição do orçamento..."
              multiline
              numberOfLines={3}
            />
          </View>
        </ScrollView>

        {/* Botão Salvar */}
        <View style={styles.saveButton}>
          <Button
            title={isEditing ? 'Atualizar Orçamento' : 'Criar Orçamento'}
            onPress={handleSave}
            loading={saving}
          />
        </View>
      </KeyboardAvoidingView>

      {/* Date Pickers */}
      {showStartDatePicker && (
        <DateTimePicker
          value={formData.dataInicio}
          mode="date"
          display="default"
          onChange={(event, selectedDate) => {
            setShowStartDatePicker(false)
            if (selectedDate) {
              setFormData({ ...formData, dataInicio: selectedDate })
            }
          }}
        />
      )}

      {showEndDatePicker && (
        <DateTimePicker
          value={formData.dataFim}
          mode="date"
          display="default"
          onChange={(event, selectedDate) => {
            setShowEndDatePicker(false)
            if (selectedDate) {
              setFormData({ ...formData, dataFim: selectedDate })
            }
          }}
        />
      )}
    </SafeAreaView>
  )
}