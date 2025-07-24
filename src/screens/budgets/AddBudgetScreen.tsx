// src/screens/budgets/AddBudgetScreen.tsx - Corrigido final
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
  descricao?: string
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

  // 🔧 CORREÇÃO PRINCIPAL: API corrigida
  const { 
    data: categoriesResponse, 
    loading: categoriesLoading, 
    error: categoriesError,
    refresh: refreshCategories 
  } = useApi<any>('/categories?tipo=despesa')

  // 🔧 PROCESSAMENTO CORRETO DOS DADOS
  const categories = React.useMemo(() => {
    console.log('=== CATEGORIES DEBUG ===')
    console.log('Raw response:', categoriesResponse)
    console.log('Loading:', categoriesLoading)
    console.log('Error:', categoriesError)

    // Se estiver carregando ou houver erro, retornar array vazio
    if (categoriesLoading || categoriesError) {
      console.log('Loading or error state, returning empty array')
      return []
    }

    // Se não há resposta ainda
    if (!categoriesResponse) {
      console.log('No response yet')
      return []
    }

    // Verificar se é uma resposta de sucesso
    if (categoriesResponse.success === false) {
      console.log('Response not successful:', categoriesResponse)
      return []
    }

    // A API mock que criamos retorna os dados diretamente em 'data'
    let categoriesData = null

    // Tentar diferentes estruturas de resposta
    if (categoriesResponse.data && Array.isArray(categoriesResponse.data)) {
      // Formato: { success: true, data: [...] }
      categoriesData = categoriesResponse.data
      console.log('Found categories in data property:', categoriesData.length)
    } else if (Array.isArray(categoriesResponse)) {
      // Formato direto: [...]
      categoriesData = categoriesResponse
      console.log('Found categories as direct array:', categoriesData.length)
    } else if (categoriesResponse.categorias && Array.isArray(categoriesResponse.categorias)) {
      // Formato: { categorias: [...] }
      categoriesData = categoriesResponse.categorias
      console.log('Found categories in categorias property:', categoriesData.length)
    } else {
      console.log('Could not find categories array in response structure')
      console.log('Response keys:', Object.keys(categoriesResponse || {}))
      return []
    }

    // Filtrar apenas categorias de despesa
    const despesaCategories = categoriesData.filter((cat: Category) => 
      cat.tipo === 'despesa' || cat.tipo === 'ambos'
    )

    console.log('Filtered despesa categories:', despesaCategories.length)
    console.log('Categories:', despesaCategories.map((c: { nome: any }) => c.nome))
    console.log('=======================')

    return despesaCategories
  }, [categoriesResponse, categoriesLoading, categoriesError])

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

  // Atualizar datas automaticamente quando mudar período
  useEffect(() => {
    if (formData.periodo !== 'personalizado') {
      const agora = new Date()
      let novaDataFim = new Date(agora)
      
      switch (formData.periodo) {
        case 'semanal':
          novaDataFim.setDate(novaDataFim.getDate() + 7)
          break
        case 'mensal':
          novaDataFim.setMonth(novaDataFim.getMonth() + 1)
          break
        case 'trimestral':
          novaDataFim.setMonth(novaDataFim.getMonth() + 3)
          break
        case 'anual':
          novaDataFim.setFullYear(novaDataFim.getFullYear() + 1)
          break
      }
      
      setFormData(prev => ({
        ...prev,
        dataInicio: agora,
        dataFim: novaDataFim
      }))
    }
  }, [formData.periodo])

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
      Alert.alert(
        'Erro',
        error.message || `Erro ao ${isEditing ? 'atualizar' : 'criar'} orçamento`
      )
    }
  }

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('pt-BR')
  }

  const formatCurrency = (value: string) => {
    const numericValue = value.replace(/[^\d]/g, '')
    const formattedValue = (parseInt(numericValue) / 100).toLocaleString('pt-BR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })
    return formattedValue === 'NaN' ? '0,00' : formattedValue
  }

  const handleValueChange = (value: string) => {
    const numericValue = value.replace(/[^\d]/g, '')
    setFormData({ ...formData, valorLimite: numericValue })
  }

  // 🔧 FUNÇÃO PARA TESTAR A API
  const testCategoriesAPI = async () => {
    try {
      console.log('🧪 Testando API de categorias...')
      
      // Testar URLs diferentes
      const urls = [
        '/categories?tipo=despesa',
        '/categories',
        '/api/categories?tipo=despesa',
        '/api/categories'
      ]

      for (const url of urls) {
        try {
          console.log(`Testando: ${url}`)
          const response = await fetch(`http://localhost:5001${url}`)
          const data = await response.json()
          console.log(`✅ ${url}:`, data)
        } catch (error) {
          console.log(`❌ ${url}:`, error)
        }
      }
    } catch (error) {
      console.error('Erro no teste:', error)
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
    backButton: {
      padding: 8,
    },
    title: {
      fontSize: 18,
      fontWeight: '600',
      color: theme.text,
      flex: 1,
      textAlign: 'center',
      marginRight: 40,
    },
    content: {
      flex: 1,
    },
    inputContainer: {
      margin: 20,
      marginBottom: 0,
    },
    section: {
      margin: 20,
      marginBottom: 0,
    },
    sectionTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: theme.text,
      marginBottom: 12,
    },
    // Debug container
    debugContainer: {
      backgroundColor: theme.error + '20',
      margin: 20,
      padding: 16,
      borderRadius: 8,
      borderLeftWidth: 4,
      borderLeftColor: theme.error,
    },
    debugTitle: {
      fontSize: 14,
      fontWeight: '600',
      color: theme.error,
      marginBottom: 8,
    },
    debugText: {
      fontSize: 12,
      color: theme.error,
      marginBottom: 4,
    },
    testButton: {
      backgroundColor: theme.primary,
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderRadius: 8,
      marginTop: 8,
    },
    testButtonText: {
      color: '#FFFFFF',
      fontSize: 12,
      fontWeight: '600',
    },
    // Categorias
    categoriesContainer: {
      minHeight: 120,
    },
    categoryScroll: {
      paddingRight: 20,
    },
    categoryItem: {
      alignItems: 'center',
      justifyContent: 'center',
      width: 80,
      height: 80,
      borderRadius: 12,
      backgroundColor: theme.surface,
      borderWidth: 2,
      borderColor: 'transparent',
      marginRight: 12,
    },
    categoryItemActive: {
      borderColor: theme.primary,
      backgroundColor: theme.primary + '20',
    },
    categoryText: {
      fontSize: 10,
      color: theme.text,
      textAlign: 'center',
      marginTop: 4,
    },
    loadingText: {
      fontSize: 14,
      color: theme.textSecondary,
      textAlign: 'center',
      padding: 20,
    },
    errorContainer: {
      padding: 20,
      alignItems: 'center',
    },
    errorText: {
      fontSize: 14,
      color: theme.error,
      textAlign: 'center',
      marginBottom: 12,
    },
    retryButton: {
      paddingHorizontal: 16,
      paddingVertical: 8,
      backgroundColor: theme.primary,
      borderRadius: 8,
    },
    retryButtonText: {
      color: '#FFFFFF',
      fontSize: 14,
      fontWeight: '600',
    },
    // Período
    periodContainer: {
      gap: 8,
    },
    periodOption: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 12,
      paddingHorizontal: 16,
      backgroundColor: theme.surface,
      borderRadius: 8,
      gap: 12,
    },
    periodOptionText: {
      fontSize: 16,
      color: theme.text,
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
      paddingVertical: 14,
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
    errorTextInput: {
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
          {/* 🔧 DEBUG INFO (remover em produção) */}
          <View style={styles.debugContainer}>
            <Text style={styles.debugTitle}>🔧 Debug - Categories API</Text>
            <Text style={styles.debugText}>Loading: {categoriesLoading ? 'true' : 'false'}</Text>
            <Text style={styles.debugText}>Error: {categoriesError || 'none'}</Text>
            <Text style={styles.debugText}>Response: {categoriesResponse ? 'received' : 'none'}</Text>
            <Text style={styles.debugText}>Categories Count: {categories.length}</Text>
            <Text style={styles.debugText}>
              Categories: {categories.map((c: { nome: any }) => c.nome).join(', ') || 'none'}
            </Text>
            <TouchableOpacity style={styles.testButton} onPress={testCategoriesAPI}>
              <Text style={styles.testButtonText}>Testar API</Text>
            </TouchableOpacity>
          </View>

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
              value={formatCurrency(formData.valorLimite)}
              onChangeText={handleValueChange}
              placeholder="0,00"
              keyboardType="numeric"
              error={errors.valorLimite}
            />
          </View>

          {/* Categoria */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Categoria</Text>
            
            <View style={styles.categoriesContainer}>
              {categoriesLoading ? (
                <Text style={styles.loadingText}>⏳ Carregando categorias...</Text>
              ) : categoriesError ? (
                <View style={styles.errorContainer}>
                  <Text style={styles.errorText}>
                    ❌ Erro ao carregar categorias: {categoriesError}
                  </Text>
                  <TouchableOpacity 
                    style={styles.retryButton}
                    onPress={refreshCategories}
                  >
                    <Text style={styles.retryButtonText}>Tentar novamente</Text>
                  </TouchableOpacity>
                </View>
              ) : !Array.isArray(categories) || categories.length === 0 ? (
                <View style={styles.errorContainer}>
                  <Text style={styles.errorText}>
                    📭 Nenhuma categoria de despesa encontrada
                  </Text>
                  <Text style={styles.errorText}>
                    Verifique se o servidor está rodando e se as categorias foram criadas.
                  </Text>
                  <TouchableOpacity 
                    style={styles.retryButton}
                    onPress={refreshCategories}
                  >
                    <Text style={styles.retryButtonText}>Recarregar</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <ScrollView 
                  horizontal 
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.categoryScroll}
                >
                  {categories.map((category: Category) => (
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
                        color={formData.categoria === category._id ? theme.primary : category.cor} 
                      />
                      <Text 
                        style={[
                          styles.categoryText,
                          { color: formData.categoria === category._id ? theme.primary : theme.text }
                        ]}
                        numberOfLines={2}
                      >
                        {category.nome}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              )}
            </View>
            {errors.categoria && <Text style={styles.errorTextInput}>{errors.categoria}</Text>}
          </View>

          {/* Período */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Período</Text>
            <View style={styles.periodContainer}>
              {PERIOD_TYPES.map((period) => (
                <TouchableOpacity
                  key={period.id}
                  style={styles.periodOption}
                  onPress={() => setFormData({ ...formData, periodo: period.id as any })}
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
            {errors.dataFim && <Text style={styles.errorTextInput}>{errors.dataFim}</Text>}
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
                thumbColor={formData.renovacaoAutomatica ? theme.primary : theme.textSecondary}
              />
            </View>
            
            {formData.renovacaoAutomatica && (
              <View style={styles.alertContainer}>
                <View style={styles.alertOption}>
                  <Ionicons name="information-circle" size={16} color={theme.primary} />
                  <Text style={styles.alertText}>
                    O orçamento será renovado automaticamente no próximo período
                  </Text>
                </View>
              </View>
            )}
          </View>

          {/* Alertas */}
          <View style={styles.section}>
            <View style={styles.switchContainer}>
              <Text style={styles.switchLabel}>Alertas</Text>
              <Switch
                value={formData.alertas.ativo}
                onValueChange={(value) => 
                  setFormData({ 
                    ...formData, 
                    alertas: { ...formData.alertas, ativo: value } 
                  })
                }
                trackColor={{ false: theme.border, true: theme.primary + '50' }}
                thumbColor={formData.alertas.ativo ? theme.primary : theme.textSecondary}
              />
            </View>

            {formData.alertas.ativo && (
              <View style={styles.alertContainer}>
                <Text style={styles.sectionTitle}>Porcentagens de Alerta</Text>
                {formData.alertas.porcentagens.map((percentage) => (
                  <View key={percentage} style={styles.alertOption}>
                    <Ionicons name="notifications" size={16} color={theme.primary} />
                    <Text style={styles.alertText}>{percentage}% do limite</Text>
                  </View>
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
              placeholder="Adicione uma descrição..."
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
            disabled={saving || categoriesLoading}
          />
        </View>

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
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}