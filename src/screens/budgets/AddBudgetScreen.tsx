// src/screens/budgets/AddBudgetScreen.tsx - NAVEGAÇÃO MELHORADA
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
  FlatList,
  TextInput,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import DateTimePicker from '@react-native-community/datetimepicker'

import { useTheme } from '../../context/ThemeContext'
import { useBudgets } from '../../hooks/useBudgets'
import { useCategories, Category } from '../../hooks/useCategories'
import Button from '../../components/common/Button'

const PERIOD_TYPES = [
  { id: 'semanal', label: 'Semanal', icon: 'calendar', description: '7 dias' },
  { id: 'mensal', label: 'Mensal', icon: 'calendar', description: '30 dias' },
  { id: 'trimestral', label: 'Trimestral', icon: 'calendar', description: '3 meses' },
  { id: 'anual', label: 'Anual', icon: 'calendar', description: '12 meses' },
  { id: 'personalizado', label: 'Personalizado', icon: 'settings', description: 'Escolher datas' },
]

const BUDGET_COLORS = [
  { color: '#FF3B30', name: 'Vermelho' },
  { color: '#FF9500', name: 'Laranja' },
  { color: '#FFCC02', name: 'Amarelo' },
  { color: '#34C759', name: 'Verde' },
  { color: '#30D158', name: 'Verde Claro' },
  { color: '#007AFF', name: 'Azul' },
  { color: '#5856D6', name: 'Roxo' },
  { color: '#AF52DE', name: 'Violeta' },
  { color: '#FF2D92', name: 'Rosa' },
  { color: '#8E8E93', name: 'Cinza' },
]

const BUDGET_ICONS = [
  'wallet', 'card', 'cash', 'home', 'car', 'restaurant', 'airplane',
  'medical', 'school', 'shirt', 'game-controller', 'gift', 'build',
  'fitness', 'library', 'musical-notes', 'tv', 'phone-portrait'
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
    dataFim: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    cor: BUDGET_COLORS[0].color,
    icone: 'wallet',
    renovacaoAutomatica: true,
    alertas: {
      ativo: true,
      porcentagens: [50, 80, 90, 100],
      email: true,
      push: true,
    },
    descricao: '',
  })

  const [showStartDatePicker, setShowStartDatePicker] = useState(false)
  const [showEndDatePicker, setShowEndDatePicker] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const { categories, loading: categoriesLoading } = useCategories('despesa')
  const { createBudget, updateBudget, loading: saving } = useBudgets()

  // Carregar dados se estiver editando
  useEffect(() => {
    if (editingBudget) {
      setFormData({
        nome: editingBudget.nome || '',
        categoria: editingBudget.categoria || '',
        valorLimite: editingBudget.valorLimite?.toString() || '',
        periodo: editingBudget.periodo || 'mensal',
        dataInicio: new Date(editingBudget.dataInicio),
        dataFim: new Date(editingBudget.dataFim),
        cor: editingBudget.cor || BUDGET_COLORS[0].color,
        icone: editingBudget.icone || 'wallet',
        renovacaoAutomatica: editingBudget.renovacaoAutomatica ?? true,
        alertas: {
          ativo: editingBudget.configuracoes?.alertas?.ativo ?? true,
          porcentagens: editingBudget.configuracoes?.alertas?.porcentagens || [50, 80, 90, 100],
          email: editingBudget.configuracoes?.alertas?.email ?? true,
          push: editingBudget.configuracoes?.alertas?.push ?? true,
        },
        descricao: editingBudget.descricao || '',
      })
    }
  }, [editingBudget])

  // Atualizar datas quando período mudar
  useEffect(() => {
    if (formData.periodo !== 'personalizado') {
      const inicio = new Date()
      let fim = new Date()

      switch (formData.periodo) {
        case 'semanal':
          fim.setDate(inicio.getDate() + 7)
          break
        case 'mensal':
          fim.setMonth(inicio.getMonth() + 1)
          break
        case 'trimestral':
          fim.setMonth(inicio.getMonth() + 3)
          break
        case 'anual':
          fim.setFullYear(inicio.getFullYear() + 1)
          break
      }

      setFormData(prev => ({
        ...prev,
        dataInicio: inicio,
        dataFim: fim
      }))
    }
  }, [formData.periodo])

  // Funções auxiliares
  const formatCurrency = (value: string) => {
    const numValue = parseFloat(value.replace(/[^\d,]/g, '').replace(',', '.'))
    if (isNaN(numValue)) return ''
    
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(numValue)
  }

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.nome.trim()) {
      newErrors.nome = 'Nome é obrigatório'
    }

    if (!formData.categoria) {
      newErrors.categoria = 'Categoria é obrigatória'
    }

    if (!formData.valorLimite || parseFloat(formData.valorLimite) <= 0) {
      newErrors.valorLimite = 'Valor limite deve ser maior que zero'
    }

    if (formData.dataFim <= formData.dataInicio) {
      newErrors.dataFim = 'Data fim deve ser posterior à data início'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSave = async () => {
    if (!validateForm()) {
      Alert.alert('Erro', 'Por favor, corrija os campos destacados')
      return
    }

    try {
      const budgetData = {
        ...formData,
        valorLimite: parseFloat(formData.valorLimite),
        dataInicio: formData.dataInicio.toISOString(),
        dataFim: formData.dataFim.toISOString(),
        configuracoes: {
          alertas: formData.alertas,
          renovacao: {
            rollover: false,
            ajusteAutomatico: false,
            percentualAjuste: 0,
            notificarRenovacao: true,
          }
        }
      }

      if (isEditing) {
        await updateBudget(editingBudget._id, budgetData)
        Alert.alert('Sucesso', 'Orçamento atualizado com sucesso!')
      } else {
        await createBudget(budgetData)
        Alert.alert('Sucesso', 'Orçamento criado com sucesso!')
      }

      navigation.goBack()
    } catch (error: any) {
      Alert.alert('Erro', error.message || 'Erro ao salvar orçamento')
    }
  }

  // 📁 COMPONENTE DE SELEÇÃO DE CATEGORIA MELHORADO
  const CategorySelector = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>📁 Categoria</Text>
      <Text style={styles.sectionDescription}>
        Escolha a categoria para este orçamento
      </Text>
      
      {categoriesLoading ? (
        <Text style={styles.loadingText}>Carregando categorias...</Text>
      ) : (
        <FlatList
          data={categories}
          keyExtractor={(item) => item._id}
          horizontal={true}
          showsHorizontalScrollIndicator={false}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[
                styles.categoryItem,
                formData.categoria === item._id && styles.categoryItemSelected
              ]}
              onPress={() => setFormData(prev => ({ ...prev, categoria: item._id }))}
              activeOpacity={0.7}
            >
              <View style={[styles.categoryIcon, { backgroundColor: item.cor }]}>
                <Ionicons name={item.icone as any} size={20} color="#FFFFFF" />
              </View>
              <Text style={[
                styles.categoryName,
                formData.categoria === item._id && styles.categoryNameSelected
              ]}>
                {item.nome}
              </Text>
              {formData.categoria === item._id && (
                <Ionicons name="checkmark-circle" size={16} color={theme.primary} />
              )}
            </TouchableOpacity>
          )}
          contentContainerStyle={styles.categoriesContainer}
          style={styles.categoriesScroll}
          scrollEnabled={true}
          bounces={true}
          decelerationRate="normal"
        />
      )}
      
      {errors.categoria && (
        <Text style={styles.errorText}>{errors.categoria}</Text>
      )}
    </View>
  )

  // 📅 COMPONENTE DE SELEÇÃO DE PERÍODO MELHORADO
  const PeriodSelector = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>📅 Período</Text>
      <Text style={styles.sectionDescription}>
        Defina o período de duração do orçamento
      </Text>
      
      <FlatList
        data={PERIOD_TYPES}
        keyExtractor={(item) => item.id}
        horizontal={true}
        showsHorizontalScrollIndicator={false}
        renderItem={({ item: period }) => (
          <TouchableOpacity
            style={[
              styles.periodItem,
              formData.periodo === period.id && styles.periodItemSelected
            ]}
            onPress={() => setFormData(prev => ({ ...prev, periodo: period.id as any }))}
            activeOpacity={0.7}
          >
            <Ionicons 
              name={period.icon as any} 
              size={20} 
              color={formData.periodo === period.id ? theme.primary : theme.textSecondary} 
            />
            <Text style={[
              styles.periodLabel,
              formData.periodo === period.id && styles.periodLabelSelected
            ]}>
              {period.label}
            </Text>
            <Text style={styles.periodDescription}>{period.description}</Text>
          </TouchableOpacity>
        )}
        contentContainerStyle={styles.periodContainer}
        style={styles.periodScroll}
        scrollEnabled={true}
        bounces={true}
        decelerationRate="normal"
      />
    </View>
  )

  const DateSelector = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>📆 Datas</Text>
      
      <View style={styles.dateRow}>
        <View style={styles.dateItem}>
          <Text style={styles.dateLabel}>Data Início</Text>
          <TouchableOpacity
            style={styles.dateButton}
            onPress={() => setShowStartDatePicker(true)}
          >
            <Ionicons name="calendar-outline" size={20} color={theme.primary} />
            <Text style={styles.dateText}>
              {formData.dataInicio.toLocaleDateString('pt-BR')}
            </Text>
          </TouchableOpacity>
        </View>
        
        <View style={styles.dateItem}>
          <Text style={styles.dateLabel}>Data Fim</Text>
          <TouchableOpacity
            style={styles.dateButton}
            onPress={() => setShowEndDatePicker(true)}
            disabled={formData.periodo !== 'personalizado'}
          >
            <Ionicons name="calendar-outline" size={20} color={theme.primary} />
            <Text style={[
              styles.dateText,
              formData.periodo !== 'personalizado' && styles.dateTextDisabled
            ]}>
              {formData.dataFim.toLocaleDateString('pt-BR')}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
      
      {formData.periodo !== 'personalizado' && (
        <Text style={styles.dateNote}>
          💡 Data fim é calculada automaticamente baseada no período selecionado
        </Text>
      )}
      
      {errors.dataFim && (
        <Text style={styles.errorText}>{errors.dataFim}</Text>
      )}
    </View>
  )

  // 🎨 COMPONENTE DE CORES E ÍCONES MELHORADO
  const ColorSelector = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>🎨 Cor e Ícone</Text>
      <Text style={styles.sectionDescription}>
        Personalize a aparência do seu orçamento
      </Text>
      
      <View style={styles.customizationContainer}>
        {/* Seleção de Cores */}
        <View style={styles.colorSection}>
          <Text style={styles.subsectionTitle}>Cor</Text>
          <FlatList
            data={BUDGET_COLORS}
            keyExtractor={(item) => item.color}
            horizontal={true}
            showsHorizontalScrollIndicator={false}
            renderItem={({ item: colorItem }) => (
              <TouchableOpacity
                style={[
                  styles.colorItem,
                  { backgroundColor: colorItem.color },
                  formData.cor === colorItem.color && styles.colorItemSelected
                ]}
                onPress={() => setFormData(prev => ({ ...prev, cor: colorItem.color }))}
                activeOpacity={0.8}
              >
                {formData.cor === colorItem.color && (
                  <Ionicons name="checkmark" size={16} color="#FFFFFF" />
                )}
              </TouchableOpacity>
            )}
            contentContainerStyle={styles.colorsContainer}
            style={styles.colorsScroll}
            scrollEnabled={true}
            bounces={true}
            decelerationRate="normal"
          />
        </View>
        
        {/* Seleção de Ícones */}
        <View style={styles.iconSection}>
          <Text style={styles.subsectionTitle}>Ícone</Text>
          <FlatList
            data={BUDGET_ICONS}
            keyExtractor={(item) => item}
            horizontal={true}
            showsHorizontalScrollIndicator={false}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[
                  styles.iconItem,
                  formData.icone === item && styles.iconItemSelected
                ]}
                onPress={() => setFormData(prev => ({ ...prev, icone: item }))}
                activeOpacity={0.7}
              >
                <Ionicons 
                  name={item as any} 
                  size={20} 
                  color={formData.icone === item ? '#FFFFFF' : theme.textSecondary} 
                />
              </TouchableOpacity>
            )}
            contentContainerStyle={styles.iconsContainer}
            style={styles.iconsScroll}
            scrollEnabled={true}
            bounces={true}
            decelerationRate="normal"
          />
        </View>
      </View>
    </View>
  )

  const SettingsSection = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>⚙️ Configurações</Text>
      
      <View style={styles.settingItem}>
        <View style={styles.settingInfo}>
          <Text style={styles.settingLabel}>Renovação Automática</Text>
          <Text style={styles.settingDescription}>
            Renovar automaticamente quando o período terminar
          </Text>
        </View>
        <Switch
          value={formData.renovacaoAutomatica}
          onValueChange={(value) => setFormData(prev => ({ ...prev, renovacaoAutomatica: value }))}
          trackColor={{ false: theme.border, true: theme.primary + '40' }}
          thumbColor={formData.renovacaoAutomatica ? theme.primary : theme.textSecondary}
        />
      </View>
      
      <View style={styles.settingItem}>
        <View style={styles.settingInfo}>
          <Text style={styles.settingLabel}>Alertas</Text>
          <Text style={styles.settingDescription}>
            Receber notificações quando atingir limites
          </Text>
        </View>
        <Switch
          value={formData.alertas.ativo}
          onValueChange={(value) => setFormData(prev => ({ 
            ...prev, 
            alertas: { ...prev.alertas, ativo: value }
          }))}
          trackColor={{ false: theme.border, true: theme.primary + '40' }}
          thumbColor={formData.alertas.ativo ? theme.primary : theme.textSecondary}
        />
      </View>
      
      {formData.alertas.ativo && (
        <View style={styles.alertsConfig}>
          <Text style={styles.subsectionTitle}>Alertar quando atingir:</Text>
          <View style={styles.alertPercentages}>
            {[50, 70, 80, 90, 100].map((percentage) => (
              <TouchableOpacity
                key={percentage}
                style={[
                  styles.percentageButton,
                  formData.alertas.porcentagens.includes(percentage) && styles.percentageButtonSelected
                ]}
                onPress={() => {
                  const porcentagens = formData.alertas.porcentagens.includes(percentage)
                    ? formData.alertas.porcentagens.filter(p => p !== percentage)
                    : [...formData.alertas.porcentagens, percentage].sort((a, b) => a - b)
                  
                  setFormData(prev => ({
                    ...prev,
                    alertas: { ...prev.alertas, porcentagens }
                  }))
                }}
              >
                <Text style={[
                  styles.percentageText,
                  formData.alertas.porcentagens.includes(percentage) && styles.percentageTextSelected
                ]}>
                  {percentage}%
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}
    </View>
  )

  const PreviewCard = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>👁️ Pré-visualização</Text>
      
      <View style={styles.previewCard}>
        <View style={[styles.previewGradient, { backgroundColor: formData.cor }]}>
          <View style={styles.previewHeader}>
            <View style={styles.previewIconContainer}>
              <Ionicons name={formData.icone as any} size={20} color="#FFFFFF" />
            </View>
            <View style={styles.previewInfo}>
              <Text style={styles.previewName}>
                {formData.nome || 'Nome do Orçamento'}
              </Text>
              <Text style={styles.previewCategory}>
                {formData.categoria 
                  ? categories.find(c => c._id === formData.categoria)?.nome || 'Categoria'
                  : 'Selecione uma categoria'
                }
              </Text>
            </View>
          </View>
          
          <View style={styles.previewBody}>
            <Text style={styles.previewValue}>
              {formData.valorLimite ? formatCurrency(formData.valorLimite) : 'R$ 0,00'}
            </Text>
            <Text style={styles.previewPeriod}>
              {PERIOD_TYPES.find(p => p.id === formData.periodo)?.label || 'Período'}
            </Text>
            <Text style={styles.previewDates}>
              {formData.dataInicio.toLocaleDateString('pt-BR')} - {formData.dataFim.toLocaleDateString('pt-BR')}
            </Text>
          </View>
        </View>
      </View>
    </View>
  )

  // 🎨 ESTILOS MELHORADOS COM SCROLL OTIMIZADO
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
      fontSize: 20,
      fontWeight: 'bold',
      color: theme.text,
    },
    backButton: {
      padding: 4,
    },
    saveButton: {
      backgroundColor: theme.primary,
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderRadius: 20,
    },
    saveButtonText: {
      color: '#FFFFFF',
      fontWeight: '600',
      fontSize: 14,
    },
    scrollContent: {
      padding: 20,
    },
    
    // Sections
    section: {
      marginBottom: 28,
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: 'bold',
      color: theme.text,
      marginBottom: 8,
    },
    sectionDescription: {
      fontSize: 14,
      color: theme.textSecondary,
      marginBottom: 16,
      lineHeight: 20,
    },
    subsectionTitle: {
      fontSize: 14,
      fontWeight: '600',
      color: theme.text,
      marginBottom: 12,
    },
    
    // Basic Info
    inputGroup: {
      marginBottom: 20,
    },
    inputLabel: {
      fontSize: 14,
      fontWeight: '600',
      color: theme.text,
      marginBottom: 8,
    },
    inputWithIcon: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.surface,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: theme.border,
      paddingHorizontal: 16,
    },
    inputIcon: {
      marginRight: 12,
    },
    textInput: {
      flex: 1,
      paddingVertical: 16,
      fontSize: 16,
      color: theme.text,
    },
    textArea: {
      height: 80,
      textAlignVertical: 'top',
    },
    
    // 📁 CATEGORIES COM SCROLL MELHORADO
    loadingText: {
      fontSize: 14,
      color: theme.textSecondary,
      textAlign: 'center',
      padding: 20,
    },
    categoriesScroll: {
      maxHeight: 120,
      marginVertical: 4,
    },
    categoriesContainer: {
      paddingHorizontal: 8,
      paddingVertical: 4,
      alignItems: 'center',
    },
    categoryItem: {
      alignItems: 'center',
      padding: 12,
      marginHorizontal: 8,
      borderRadius: 12,
      backgroundColor: theme.surface,
      borderWidth: 1,
      borderColor: theme.border,
      minWidth: 80,
      maxWidth: 90,
    },
    categoryItemSelected: {
      borderColor: theme.primary,
      backgroundColor: theme.primary + '10',
    },
    categoryIcon: {
      width: 36,
      height: 36,
      borderRadius: 18,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 8,
    },
    categoryName: {
      fontSize: 11,
      color: theme.text,
      textAlign: 'center',
      fontWeight: '500',
      marginBottom: 4,
    },
    categoryNameSelected: {
      color: theme.primary,
      fontWeight: '600',
    },
    
    // 📅 PERIOD COM SCROLL MELHORADO
    periodScroll: {
      maxHeight: 100,
      marginVertical: 4,
    },
    periodContainer: {
      paddingHorizontal: 8,
      paddingVertical: 4,
      alignItems: 'center',
    },
    periodItem: {
      alignItems: 'center',
      padding: 12,
      marginHorizontal: 8,
      borderRadius: 12,
      backgroundColor: theme.surface,
      borderWidth: 1,
      borderColor: theme.border,
      minWidth: 85,
      maxWidth: 100,
    },
    periodItemSelected: {
      borderColor: theme.primary,
      backgroundColor: theme.primary + '10',
    },
    periodLabel: {
      fontSize: 12,
      fontWeight: '600',
      color: theme.text,
      marginTop: 6,
      marginBottom: 2,
      textAlign: 'center',
    },
    periodLabelSelected: {
      color: theme.primary,
    },
    periodDescription: {
      fontSize: 10,
      color: theme.textSecondary,
      textAlign: 'center',
    },
    
    // Dates
    dateRow: {
      flexDirection: 'row',
      gap: 16,
    },
    dateItem: {
      flex: 1,
    },
    dateLabel: {
      fontSize: 14,
      fontWeight: '600',
      color: theme.text,
      marginBottom: 8,
    },
    dateButton: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.surface,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: theme.border,
      paddingHorizontal: 16,
      paddingVertical: 12,
      gap: 12,
    },
    dateText: {
      fontSize: 14,
      color: theme.text,
      fontWeight: '500',
    },
    dateTextDisabled: {
      color: theme.textSecondary,
    },
    dateNote: {
      fontSize: 12,
      color: theme.textSecondary,
      marginTop: 8,
      fontStyle: 'italic',
    },
    
    // 🎨 CUSTOMIZATION COM SCROLL MELHORADO
    customizationContainer: {
      gap: 20,
    },
    colorSection: {},
    colorsScroll: {
      maxHeight: 60,
      marginVertical: 4,
    },
    colorsContainer: {
      paddingHorizontal: 8,
      paddingVertical: 4,
      alignItems: 'center',
    },
    colorItem: {
      width: 36,
      height: 36,
      borderRadius: 18,
      justifyContent: 'center',
      alignItems: 'center',
      marginHorizontal: 8,
      borderWidth: 2,
      borderColor: 'transparent',
    },
    colorItemSelected: {
      borderColor: '#FFFFFF',
      elevation: 3,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.3,
      shadowRadius: 3,
    },
    iconSection: {},
    iconsScroll: {
      maxHeight: 60,
      marginVertical: 4,
    },
    iconsContainer: {
      paddingHorizontal: 8,
      paddingVertical: 4,
      alignItems: 'center',
    },
    iconItem: {
      width: 40,
      height: 40,
      borderRadius: 20,
      justifyContent: 'center',
      alignItems: 'center',
      marginHorizontal: 6,
      backgroundColor: theme.surface,
      borderWidth: 1,
      borderColor: theme.border,
    },
    iconItemSelected: {
      backgroundColor: theme.primary,
      borderColor: theme.primary,
    },
    
    // Settings
    settingItem: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: 16,
      borderBottomWidth: 1,
      borderBottomColor: theme.border,
    },
    settingInfo: {
      flex: 1,
      marginRight: 16,
    },
    settingLabel: {
      fontSize: 16,
      fontWeight: '600',
      color: theme.text,
      marginBottom: 4,
    },
    settingDescription: {
      fontSize: 14,
      color: theme.textSecondary,
      lineHeight: 18,
    },
    alertsConfig: {
      marginTop: 16,
      padding: 16,
      backgroundColor: theme.surface,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: theme.border,
    },
    alertPercentages: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
    },
    percentageButton: {
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderRadius: 20,
      backgroundColor: theme.background,
      borderWidth: 1,
      borderColor: theme.border,
    },
    percentageButtonSelected: {
      backgroundColor: theme.primary,
      borderColor: theme.primary,
    },
    percentageText: {
      fontSize: 14,
      color: theme.text,
      fontWeight: '500',
    },
    percentageTextSelected: {
      color: '#FFFFFF',
    },
    
    // Preview
    previewCard: {
      borderRadius: 16,
      overflow: 'hidden',
      elevation: 4,
      shadowColor: theme.shadow,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
    },
    previewGradient: {
      padding: 20,
    },
    previewHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 16,
    },
    previewIconContainer: {
      backgroundColor: 'rgba(255, 255, 255, 0.2)',
      borderRadius: 12,
      width: 32,
      height: 32,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 12,
    },
    previewInfo: {
      flex: 1,
    },
    previewName: {
      fontSize: 16,
      fontWeight: 'bold',
      color: '#FFFFFF',
      marginBottom: 2,
    },
    previewCategory: {
      fontSize: 12,
      color: '#FFFFFF',
      opacity: 0.9,
    },
    previewBody: {
      gap: 4,
    },
    previewValue: {
      fontSize: 20,
      fontWeight: 'bold',
      color: '#FFFFFF',
    },
    previewPeriod: {
      fontSize: 14,
      color: '#FFFFFF',
      opacity: 0.9,
    },
    previewDates: {
      fontSize: 12,
      color: '#FFFFFF',
      opacity: 0.8,
    },
    
    // Error
    errorText: {
      fontSize: 12,
      color: theme.error,
      marginTop: 4,
    },
  })

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
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
        
        <TouchableOpacity 
          style={styles.saveButton}
          onPress={handleSave}
          disabled={saving}
        >
          <Text style={styles.saveButtonText}>
            {saving ? 'Salvando...' : 'Salvar'}
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView 
        style={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        scrollEnabled={true}
        bounces={true}
        contentInsetAdjustmentBehavior="automatic"
        scrollEventThrottle={16}
        removeClippedSubviews={false}
        keyboardDismissMode="on-drag"
      >
        {/* Informações Básicas */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📝 Informações Básicas</Text>
          
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Nome do Orçamento *</Text>
            <View style={styles.inputWithIcon}>
              <Ionicons name="text-outline" size={20} color={theme.textSecondary} style={styles.inputIcon} />
              <TextInput
                value={formData.nome}
                onChangeText={(text) => setFormData(prev => ({ ...prev, nome: text }))}
                placeholder="Ex: Alimentação, Transporte..."
                style={styles.textInput}
                placeholderTextColor={theme.textSecondary}
              />
            </View>
            {errors.nome && <Text style={styles.errorText}>{errors.nome}</Text>}
          </View>
          
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Valor Limite *</Text>
            <View style={styles.inputWithIcon}>
              <Ionicons name="cash-outline" size={20} color={theme.textSecondary} style={styles.inputIcon} />
              <TextInput
                value={formData.valorLimite}
                onChangeText={(text) => setFormData(prev => ({ ...prev, valorLimite: text }))}
                placeholder="0,00"
                keyboardType="numeric"
                style={styles.textInput}
                placeholderTextColor={theme.textSecondary}
              />
            </View>
            {errors.valorLimite && <Text style={styles.errorText}>{errors.valorLimite}</Text>}
          </View>
          
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Descrição (Opcional)</Text>
            <View style={styles.inputWithIcon}>
              <Ionicons name="document-text-outline" size={20} color={theme.textSecondary} style={styles.inputIcon} />
              <TextInput
                value={formData.descricao}
                onChangeText={(text) => setFormData(prev => ({ ...prev, descricao: text }))}
                placeholder="Observações sobre este orçamento..."
                multiline
                style={[styles.textInput, styles.textArea]}
                placeholderTextColor={theme.textSecondary}
              />
            </View>
          </View>
        </View>

        <CategorySelector />
        <PeriodSelector />
        <DateSelector />
        <ColorSelector />
        <SettingsSection />
        <PreviewCard />
      </ScrollView>

      {/* Date Pickers */}
      {showStartDatePicker && (
        <DateTimePicker
          value={formData.dataInicio}
          mode="date"
          display="default"
          onChange={(event, selectedDate) => {
            setShowStartDatePicker(false)
            if (selectedDate) {
              setFormData(prev => ({ ...prev, dataInicio: selectedDate }))
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
              setFormData(prev => ({ ...prev, dataFim: selectedDate }))
            }
          }}
        />
      )}
    </KeyboardAvoidingView>
  )
}