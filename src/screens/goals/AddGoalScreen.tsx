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
import { useMutation } from '../../hooks/useApi'
import Button from '../../components/common/Button'
import Input from '../../components/common/Input'

const GOAL_CATEGORIES = [
  { id: 'emergencia', label: 'Emergência', icon: 'shield', color: '#FF3B30' },
  { id: 'viagem', label: 'Viagem', icon: 'airplane', color: '#007AFF' },
  { id: 'casa', label: 'Casa', icon: 'home', color: '#34C759' },
  { id: 'educacao', label: 'Educação', icon: 'school', color: '#FF9500' },
  { id: 'aposentadoria', label: 'Aposentadoria', icon: 'time', color: '#5856D6' },
  { id: 'investimento', label: 'Investimento', icon: 'trending-up', color: '#30D158' },
  { id: 'saude', label: 'Saúde', icon: 'heart', color: '#FF2D92' },
  { id: 'outro', label: 'Outro', icon: 'ellipsis-horizontal', color: '#8E8E93' },
]

const PRIORITY_LEVELS = [
  { id: 'baixa', label: 'Baixa', color: '#34C759' },
  { id: 'media', label: 'Média', color: '#FF9500' },
  { id: 'alta', label: 'Alta', color: '#FF3B30' },
]

const GOAL_ICONS = [
  'trophy', 'target', 'star', 'rocket', 'diamond', 'gift',
  'home', 'car', 'airplane', 'heart', 'school', 'briefcase'
]

export default function AddGoalScreen({ navigation, route }: any) {
  const { theme } = useTheme()
  const editingGoal = route?.params?.goal
  const isEditing = !!editingGoal

  const [formData, setFormData] = useState({
    titulo: '',
    descricao: '',
    valorAlvo: '',
    categoria: 'emergencia',
    prioridade: 'media' as 'baixa' | 'media' | 'alta',
    dataLimite: new Date(new Date().setMonth(new Date().getMonth() + 6)), // 6 meses por padrão
    cor: '#007AFF',
    icone: 'trophy',
    configuracoes: {
      lembretes: {
        ativo: true,
        frequencia: 'semanal' as 'diario' | 'semanal' | 'mensal',
      }
    }
  })

  const [showDatePicker, setShowDatePicker] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  // Mutation para criar/editar meta
  const { mutate: saveGoal, loading: saving } = useMutation()

  // Preencher dados se estiver editando
  useEffect(() => {
    if (editingGoal) {
      setFormData({
        ...editingGoal,
        dataLimite: new Date(editingGoal.dataLimite),
        valorAlvo: editingGoal.valorAlvo.toString(),
      })
    }
  }, [editingGoal])

  // Atualizar cor quando categoria muda
  useEffect(() => {
    const selectedCategory = GOAL_CATEGORIES.find(cat => cat.id === formData.categoria)
    if (selectedCategory && !isEditing) {
      setFormData(prev => ({ 
        ...prev, 
        cor: selectedCategory.color,
        icone: selectedCategory.icon 
      }))
    }
  }, [formData.categoria, isEditing])

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.titulo.trim()) {
      newErrors.titulo = 'Título é obrigatório'
    }

    if (!formData.valorAlvo.trim()) {
      newErrors.valorAlvo = 'Valor da meta é obrigatório'
    } else if (isNaN(parseFloat(formData.valorAlvo)) || parseFloat(formData.valorAlvo) <= 0) {
      newErrors.valorAlvo = 'Valor deve ser maior que zero'
    }

    if (formData.dataLimite <= new Date()) {
      newErrors.dataLimite = 'Data deve ser futura'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const calculateMonthlyAmount = () => {
    const valor = parseFloat(formData.valorAlvo) || 0
    const hoje = new Date()
    const mesesRestantes = Math.max(1, Math.ceil(
      (formData.dataLimite.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24 * 30)
    ))
    return valor / mesesRestantes
  }

  const calculateDailyAmount = () => {
    const valor = parseFloat(formData.valorAlvo) || 0
    const hoje = new Date()
    const diasRestantes = Math.max(1, Math.ceil(
      (formData.dataLimite.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24)
    ))
    return valor / diasRestantes
  }

  const handleSave = async () => {
    if (!validateForm()) return

    const goalData = {
      ...formData,
      valorAlvo: parseFloat(formData.valorAlvo),
    }

    try {
      const method = isEditing ? 'patch' : 'post'
      const url = isEditing ? `/goals/${editingGoal._id}` : '/goals'
      
      await saveGoal(method, url, goalData, {
        onSuccess: () => {
          Alert.alert(
            'Sucesso',
            `Meta ${isEditing ? 'atualizada' : 'criada'} com sucesso!`,
            [{ text: 'OK', onPress: () => navigation.goBack() }]
          )
        },
        onError: (error) => {
          Alert.alert('Erro', error)
        }
      })
    } catch (error) {
      console.error('Erro ao salvar meta:', error)
    }
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value)
  }

  const CategorySelector = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Categoria</Text>
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        style={styles.categoryScroll}
      >
        {GOAL_CATEGORIES.map((category) => (
          <TouchableOpacity
            key={category.id}
            style={[
              styles.categoryItem,
              formData.categoria === category.id && styles.categoryItemActive,
              { borderColor: category.color }
            ]}
            onPress={() => setFormData(prev => ({ ...prev, categoria: category.id }))}
          >
            <Ionicons 
              name={category.icon as any} 
              size={24} 
              color={formData.categoria === category.id ? '#FFFFFF' : category.color} 
            />
            <Text style={[
              styles.categoryText,
              formData.categoria === category.id && styles.categoryTextActive
            ]}>
              {category.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  )

  const PrioritySelector = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Prioridade</Text>
      <View style={styles.priorityContainer}>
        {PRIORITY_LEVELS.map((priority) => (
          <TouchableOpacity
            key={priority.id}
            style={[
              styles.priorityItem,
              formData.prioridade === priority.id && { 
                backgroundColor: priority.color,
                borderColor: priority.color 
              }
            ]}
            onPress={() => setFormData(prev => ({ ...prev, prioridade: priority.id as any }))}
          >
            <Text style={[
              styles.priorityText,
              formData.prioridade === priority.id && styles.priorityTextActive
            ]}>
              {priority.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  )

  const IconSelector = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Ícone</Text>
      <View style={styles.iconContainer}>
        {GOAL_ICONS.map((icon) => (
          <TouchableOpacity
            key={icon}
            style={[
              styles.iconItem,
              formData.icone === icon && { backgroundColor: formData.cor }
            ]}
            onPress={() => setFormData(prev => ({ ...prev, icone: icon }))}
          >
            <Ionicons 
              name={icon as any} 
              size={24} 
              color={formData.icone === icon ? '#FFFFFF' : formData.cor} 
            />
          </TouchableOpacity>
        ))}
      </View>
    </View>
  )

  const SuggestionCard = () => {
    const monthlyAmount = calculateMonthlyAmount()
    const dailyAmount = calculateDailyAmount()

    if (!formData.valorAlvo || monthlyAmount === 0) return null

    return (
      <View style={[styles.suggestionCard, { borderColor: formData.cor }]}>
        <View style={styles.suggestionHeader}>
          <Ionicons name="bulb" size={20} color={formData.cor} />
          <Text style={styles.suggestionTitle}>Sugestão para atingir sua meta</Text>
        </View>
        
        <View style={styles.suggestionContent}>
          <View style={styles.suggestionItem}>
            <Text style={styles.suggestionLabel}>Por mês:</Text>
            <Text style={[styles.suggestionValue, { color: formData.cor }]}>
              {formatCurrency(monthlyAmount)}
            </Text>
          </View>
          <View style={styles.suggestionItem}>
            <Text style={styles.suggestionLabel}>Por dia:</Text>
            <Text style={[styles.suggestionValue, { color: formData.cor }]}>
              {formatCurrency(dailyAmount)}
            </Text>
          </View>
        </View>
      </View>
    )
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
    priorityContainer: {
      flexDirection: 'row',
      gap: 12,
    },
    priorityItem: {
      flex: 1,
      paddingVertical: 12,
      paddingHorizontal: 16,
      borderRadius: 12,
      backgroundColor: theme.surface,
      borderWidth: 2,
      borderColor: theme.border,
      alignItems: 'center',
    },
    priorityText: {
      fontSize: 14,
      fontWeight: '600',
      color: theme.text,
    },
    priorityTextActive: {
      color: '#FFFFFF',
    },
    iconContainer: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 12,
    },
    iconItem: {
      width: 48,
      height: 48,
      borderRadius: 24,
      backgroundColor: theme.surface,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 2,
      borderColor: theme.border,
    },
    colorContainer: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 12,
    },
    colorItem: {
      width: 40,
      height: 40,
      borderRadius: 20,
      borderWidth: 3,
      borderColor: 'transparent',
    },
    colorItemActive: {
      borderColor: theme.text,
    },
    suggestionCard: {
      backgroundColor: theme.surface,
      borderRadius: 12,
      padding: 16,
      marginBottom: 24,
      borderWidth: 1,
    },
    suggestionHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 12,
      gap: 8,
    },
    suggestionTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: theme.text,
    },
    suggestionContent: {
      gap: 8,
    },
    suggestionItem: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    suggestionLabel: {
      fontSize: 14,
      color: theme.textSecondary,
    },
    suggestionValue: {
      fontSize: 16,
      fontWeight: 'bold',
    },
    reminderSection: {
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
    reminderOptions: {
      marginTop: 12,
      paddingLeft: 16,
    },
    reminderOption: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 8,
    },
    reminderOptionText: {
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
          {isEditing ? 'Editar Meta' : 'Nova Meta'}
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
          {/* Basic Info */}
          <View style={styles.inputContainer}>
            <Input
              label="Título da Meta"
              placeholder="Ex: Reserva de emergência"
              value={formData.titulo}
              onChangeText={(text) => setFormData(prev => ({ ...prev, titulo: text }))}
              error={errors.titulo}
              required
            />
          </View>

          <View style={styles.inputContainer}>
            <Input
              label="Descrição (Opcional)"
              placeholder="Descreva sua meta..."
              value={formData.descricao}
              onChangeText={(text) => setFormData(prev => ({ ...prev, descricao: text }))}
              multiline
              numberOfLines={3}
            />
          </View>

          <View style={styles.inputContainer}>
            <Input
              label="Valor da Meta"
              placeholder="0,00"
              value={formData.valorAlvo}
              onChangeText={(text) => setFormData(prev => ({ ...prev, valorAlvo: text }))}
              keyboardType="numeric"
              leftIcon="cash-outline"
              error={errors.valorAlvo}
              required
            />
          </View>

          {/* Date Picker */}
          <View style={styles.dateContainer}>
            <Text style={styles.sectionTitle}>Data Limite</Text>
            <TouchableOpacity 
              style={styles.dateButton}
              onPress={() => setShowDatePicker(true)}
            >
              <Ionicons name="calendar" size={20} color={theme.primary} />
              <Text style={styles.dateText}>
                {formData.dataLimite.toLocaleDateString('pt-BR')}
              </Text>
            </TouchableOpacity>
            {errors.dataLimite && <Text style={styles.errorText}>{errors.dataLimite}</Text>}
          </View>

          {showDatePicker && (
            <DateTimePicker
              value={formData.dataLimite}
              mode="date"
              display="default"
              minimumDate={new Date()}
              onChange={(event: any, selectedDate: Date | undefined) => {
                setShowDatePicker(false)
                if (selectedDate) {
                  setFormData(prev => ({ ...prev, dataLimite: selectedDate }))
                }
              }}
            />
          )}

          {/* Category Selector */}
          <CategorySelector />

          {/* Priority Selector */}
          <PrioritySelector />

          {/* Icon Selector */}
          <IconSelector />

          {/* Suggestion Card */}
          <SuggestionCard />

          {/* Reminder Settings */}
          <View style={styles.reminderSection}>
            <View style={styles.switchContainer}>
              <Text style={styles.switchLabel}>Lembretes</Text>
              <TouchableOpacity
                onPress={() => setFormData(prev => ({ 
                  ...prev, 
                  configuracoes: {
                    ...prev.configuracoes,
                    lembretes: {
                      ...prev.configuracoes.lembretes,
                      ativo: !prev.configuracoes.lembretes.ativo
                    }
                  }
                }))}
              >
                <Ionicons 
                  name={formData.configuracoes.lembretes.ativo ? "toggle" : "toggle-outline"} 
                  size={32} 
                  color={formData.configuracoes.lembretes.ativo ? theme.primary : theme.textSecondary} 
                />
              </TouchableOpacity>
            </View>

            {formData.configuracoes.lembretes.ativo && (
              <View style={styles.reminderOptions}>
                {[
                  { value: 'diario', label: 'Diário' },
                  { value: 'semanal', label: 'Semanal' },
                  { value: 'mensal', label: 'Mensal' },
                ].map((option) => (
                  <TouchableOpacity
                    key={option.value}
                    style={styles.reminderOption}
                    onPress={() => setFormData(prev => ({ 
                      ...prev, 
                      configuracoes: {
                        ...prev.configuracoes,
                        lembretes: {
                          ...prev.configuracoes.lembretes,
                          frequencia: option.value as any
                        }
                      }
                    }))}
                  >
                    <Ionicons 
                      name={formData.configuracoes.lembretes.frequencia === option.value ? "radio-button-on" : "radio-button-off"} 
                      size={20} 
                      color={theme.primary} 
                    />
                    <Text style={styles.reminderOptionText}>{option.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>
        </ScrollView>

        {/* Save Button */}
        <Button
          title={isEditing ? 'Atualizar Meta' : 'Criar Meta'}
          onPress={handleSave}
          loading={saving}
          style={styles.saveButton}
          fullWidth
        />
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}