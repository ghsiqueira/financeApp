// src/screens/transactions/CreateTransactionScreen.tsx - CÓDIGO COMPLETO COM ORÇAMENTOS
import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Vibration,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useFocusEffect } from '@react-navigation/native';

import { Loading, Card, Input, Button } from '../../components/common';
import { CalendarDatePicker } from '../../components/common/Calendar';
import { TransactionService } from '../../services/TransactionService';
import { CategoryService } from '../../services/CategoryService';
import { BudgetService } from '../../services/BudgetService';
import { Category, Budget, CreateTransactionData } from '../../types';
import { TransactionStackParamList } from '../../navigation/TransactionNavigator';
import { COLORS, FONTS, FONT_SIZES, SPACING, BORDER_RADIUS, SHADOWS } from '../../constants';

interface CreateTransactionScreenProps {
  navigation: NativeStackNavigationProp<TransactionStackParamList, 'CreateTransaction'>;
}

interface FormData {
  description: string;
  amount: string;
  type: 'income' | 'expense';
  category: string;
  budgetId?: string;
  date: string;
  isRecurring: boolean;
  recurringDay: string;
  notes?: string;
}

interface FormErrors {
  [key: string]: string;
}

export const CreateTransactionScreen: React.FC<CreateTransactionScreenProps> = ({ navigation }) => {
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [categoriesLoading, setCategoriesLoading] = useState(true);

  const [formData, setFormData] = useState<FormData>({
    description: '',
    amount: '',
    type: 'expense',
    category: '',
    date: new Date().toISOString().split('T')[0],
    isRecurring: false,
    recurringDay: '1',
    notes: '',
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [showAmountModal, setShowAmountModal] = useState(false);
  const [amountModalValue, setAmountModalValue] = useState('');
  const [showBudgetSelector, setShowBudgetSelector] = useState(false);
  const [showRecurringSelector, setShowRecurringSelector] = useState(false);
  const amountInputRef = useRef<TextInput>(null);

  // Resetar formulário quando a tela ganhar foco
  useFocusEffect(
    React.useCallback(() => {
      // Resetar apenas se não estiver carregando
      if (!loading) {
        setFormData({
          description: '',
          amount: '',
          type: 'expense',
          category: '',
          date: new Date().toISOString().split('T')[0],
          isRecurring: false,
          recurringDay: '1',
          notes: '',
        });
        setErrors({});
        setShowAmountModal(false);
        setAmountModalValue('');
      }
    }, [loading])
  );

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    try {
      await Promise.all([
        loadCategories(),
        loadBudgets()
      ]);
    } catch (error) {
      console.error('Erro ao carregar dados iniciais:', error);
    } finally {
      setCategoriesLoading(false);
    }
  };

  const loadCategories = async () => {
    try {
      const response = await CategoryService.getCategories();
      if (response.success && response.data) {
        // Filtrar categorias duplicadas e garantir ícones válidos
        const uniqueCategories = response.data.filter((category, index, array) => {
          // Remover duplicatas baseado no nome e tipo
          const isDuplicate = array.findIndex(c => c.name === category.name && c.type === category.type) !== index;
          return !isDuplicate;
        }).map(category => {
          // Mapear ícones para nomes válidos do Ionicons
          const iconMap: { [key: string]: string } = {
            '🏠': 'home-outline',
            '💰': 'cash-outline', 
            '🍽️': 'restaurant-outline',
            '🚗': 'car-outline',
            '🏥': 'medical-outline',
            '📚': 'library-outline',
            '🎬': 'film-outline',
            '✂️': 'cut-outline',
            '🎁': 'gift-outline',
            '⛽': 'car-outline',
            '🛍️': 'bag-outline',
            '📄': 'document-text-outline',
            '💊': 'medical-outline',
            '😊': 'happy-outline',
            '✈️': 'airplane-outline',
            '📅': 'calendar-outline',
            'dumbbell': 'barbell-outline',
            'utensils': 'restaurant-outline', 
            'scissors': 'cut-outline',
            'fuel': 'car-outline',
            'shopping-bag': 'bag-outline',
            'file-text': 'document-text-outline',
            'pill': 'medical-outline',
            'smile': 'happy-outline',
            'plane': 'airplane-outline',
            'gift': 'gift-outline',
            'calendar': 'calendar-outline',
          };
          
          return {
            ...category,
            icon: iconMap[category.icon] || category.icon || (category.type === 'income' ? 'cash-outline' : 'wallet-outline'),
            color: category.color || (category.type === 'income' ? '#4CAF50' : '#F44336')
          };
        });
        
        setCategories(uniqueCategories);
      }
    } catch (error) {
      console.error('Erro ao carregar categorias:', error);
    }
  };

  const loadBudgets = async () => {
    try {
      const response = await BudgetService.getBudgets();
      if (response.success && response.data) {
        const activeBudgets = response.data.filter(budget => budget.isActive);
        setBudgets(activeBudgets);
      }
    } catch (error) {
      console.error('Erro ao carregar orçamentos:', error);
    }
  };

  useEffect(() => {
    if (!categoriesLoading) {
      loadCategories();
      setFormData(prev => ({ ...prev, category: '', budgetId: '' }));
    }
  }, [formData.type]);

  const handleInputChange = (field: keyof FormData, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const formatCurrency = (value: string): string => {
    const numericValue = value.replace(/\D/g, '');
    
    if (numericValue === '') return '';
    
    const floatValue = parseInt(numericValue) / 100;
    
    return floatValue.toLocaleString('pt-BR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  const parseCurrency = (value: string): number => {
    if (!value) return 0;
    const cleanValue = value.replace(/\./g, '').replace(',', '.');
    return parseFloat(cleanValue) || 0;
  };

  const handleAmountModalOpen = () => {
    const currentAmount = parseCurrency(formData.amount);
    setAmountModalValue(currentAmount > 0 ? (currentAmount * 100).toString() : '');
    setShowAmountModal(true);
  };

  const handleAmountModalChange = (value: string) => {
    const numericValue = value.replace(/\D/g, '');
    
    if (numericValue.length <= 9) {
      setAmountModalValue(numericValue);
    }
  };

  const handleAmountModalConfirm = () => {
    const formattedValue = formatCurrency(amountModalValue);
    handleInputChange('amount', formattedValue);
    setShowAmountModal(false);
    
    Vibration.vibrate(50);
  };

  const handleAmountModalCancel = () => {
    setShowAmountModal(false);
    setAmountModalValue('');
  };

  const getAmountDisplay = (): string => {
    if (!formData.amount) return '0,00';
    return formData.amount;
  };

  const getAmountPreview = (): string => {
    const numericValue = amountModalValue.replace(/\D/g, '');
    if (!numericValue) return 'R$ 0,00';
    
    const floatValue = parseInt(numericValue) / 100;
    return floatValue.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    });
  };

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.description.trim()) {
      newErrors.description = 'Descrição é obrigatória';
    }

    const amount = parseCurrency(formData.amount);
    if (amount <= 0) {
      newErrors.amount = 'Digite um valor maior que zero';
    } else if (amount > 999999.99) {
      newErrors.amount = 'Valor máximo é R$ 999.999,99';
    }

    if (!formData.category) {
      newErrors.category = 'Selecione uma categoria';
    }

    if (!formData.date) {
      newErrors.date = 'Data é obrigatória';
    }

    if (formData.isRecurring) {
      const recurringDay = parseInt(formData.recurringDay);
      if (isNaN(recurringDay) || recurringDay < 1 || recurringDay > 31) {
        newErrors.recurringDay = 'Dia deve estar entre 1 e 31';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      Alert.alert('Dados inválidos', 'Por favor, corrija os erros antes de continuar');
      return;
    }

    try {
      setLoading(true);

      const transactionData: CreateTransactionData = {
        description: formData.description.trim(),
        amount: parseCurrency(formData.amount),
        type: formData.type,
        category: formData.category,
        date: new Date(formData.date).toISOString(),
        isRecurring: formData.isRecurring,
        ...(formData.isRecurring && { recurringDay: parseInt(formData.recurringDay) }),
        ...(formData.budgetId && { budgetId: formData.budgetId }),
        ...(formData.notes && { notes: formData.notes.trim() }),
      };

      const response = await TransactionService.createTransaction(transactionData);

      if (response.success) {
        // Resetar formulário
        setFormData({
          description: '',
          amount: '',
          type: 'expense',
          category: '',
          date: new Date().toISOString().split('T')[0],
          isRecurring: false,
          recurringDay: '1',
          notes: '',
        });
        setErrors({});
        setShowAmountModal(false);
        setAmountModalValue('');

        // Navegar de volta
        navigation.goBack();
        
        // Mostrar feedback de sucesso
        setTimeout(() => {
          Alert.alert('Sucesso!', 'Transação criada com sucesso');
        }, 300);
      } else {
        Alert.alert('Erro', response.message || 'Não foi possível criar a transação');
      }
    } catch (error: any) {
      console.error('Erro ao criar transação:', error);
      Alert.alert('Erro', error.message || 'Não foi possível criar a transação');
    } finally {
      setLoading(false);
    }
  };

  // Filtrar categorias e orçamentos por tipo
  const filteredCategories = categories.filter(cat => cat.type === formData.type);
  const selectedCategoryObj = categories.find(cat => cat._id === formData.category);
  
  const filteredBudgets = budgets.filter(budget => {
    if (formData.type !== 'expense') return false;
    if (!budget.category) return false;
    
    const categoryId = typeof budget.category === 'string' 
      ? budget.category 
      : budget.category._id || budget.category.id;
    
    // Debug: log para ver os dados
    console.log('Verificando budget:', {
      budgetName: budget.name,
      budgetCategoryId: categoryId,
      selectedCategory: formData.category,
      match: categoryId === formData.category
    });
    
    return categoryId === formData.category;
  });

  // Debug: log para verificar condições
  console.log('Budget Selector - Condições:', {
    type: formData.type,
    hasCategory: !!formData.category,
    totalBudgets: budgets.length,
    filteredBudgets: filteredBudgets.length,
    shouldShow: formData.type === 'expense' && !!formData.category && filteredBudgets.length > 0
  });

  const renderTypeSelector = () => (
    <Card style={styles.card}>
      <Text style={styles.sectionTitle}>Tipo de Transação</Text>
      <View style={styles.typeContainer}>
        <TouchableOpacity
          style={[
            styles.typeButton,
            formData.type === 'expense' && styles.typeButtonActive,
            { borderColor: COLORS.error }
          ]}
          onPress={() => handleInputChange('type', 'expense')}
        >
          <View style={[
            styles.typeIconContainer,
            { backgroundColor: formData.type === 'expense' ? COLORS.white : COLORS.error + '20' }
          ]}>
            <Ionicons 
              name="arrow-down" 
              size={20} 
              color={formData.type === 'expense' ? COLORS.error : COLORS.error} 
            />
          </View>
          <Text style={[
            styles.typeButtonText,
            { color: formData.type === 'expense' ? COLORS.white : COLORS.error }
          ]}>
            Despesa
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.typeButton,
            formData.type === 'income' && styles.typeButtonActive,
            { borderColor: COLORS.success }
          ]}
          onPress={() => handleInputChange('type', 'income')}
        >
          <View style={[
            styles.typeIconContainer,
            { backgroundColor: formData.type === 'income' ? COLORS.white : COLORS.success + '20' }
          ]}>
            <Ionicons 
              name="arrow-up" 
              size={20} 
              color={formData.type === 'income' ? COLORS.success : COLORS.success} 
            />
          </View>
          <Text style={[
            styles.typeButtonText,
            { color: formData.type === 'income' ? COLORS.white : COLORS.success }
          ]}>
            Receita
          </Text>
        </TouchableOpacity>
      </View>
    </Card>
  );

  const renderAmountInput = () => (
    <Card style={styles.card}>
      <Text style={styles.sectionTitle}>Valor</Text>
      <TouchableOpacity 
        style={[
          styles.amountButton,
          errors.amount && styles.amountButtonError
        ]}
        onPress={handleAmountModalOpen}
      >
        <Ionicons 
          name="cash" 
          size={24} 
          color={formData.amount ? COLORS.primary : COLORS.gray400}
        />
        <View style={styles.amountContent}>
          <Text style={styles.amountLabel}>Valor da transação</Text>
          <Text style={[
            styles.amountValue,
            !formData.amount && styles.amountValuePlaceholder
          ]}>
            R$ {getAmountDisplay()}
          </Text>
        </View>
        <Ionicons name="chevron-forward" size={20} color={COLORS.gray400} />
      </TouchableOpacity>
      {errors.amount && <Text style={styles.errorText}>{errors.amount}</Text>}
    </Card>
  );

  const renderCategorySelector = () => (
    <Card style={styles.card}>
      <Text style={styles.sectionTitle}>Categoria</Text>
      {categoriesLoading ? (
        <View style={styles.loadingContainer}>
          <Loading size="small" />
          <Text style={styles.loadingText}>Carregando categorias...</Text>
        </View>
      ) : (
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoriesContainer}
        >
          {filteredCategories.map((category) => (
            <TouchableOpacity
              key={category._id}
              style={[
                styles.categoryButton,
                formData.category === category._id && styles.categoryButtonActive,
                { borderColor: formData.category === category._id ? category.color : COLORS.gray200 }
              ]}
              onPress={() => {
                handleInputChange('category', category._id);
                // Reset budget quando trocar categoria
                if (formData.budgetId) {
                  handleInputChange('budgetId', '');
                }
              }}
            >
              <View style={[
                styles.categoryIconContainer,
                { backgroundColor: formData.category === category._id ? category.color : category.color + '20' }
              ]}>
                <Ionicons
                  name={category.icon as any}
                  size={24}
                  color={formData.category === category._id ? COLORS.white : category.color}
                />
              </View>
              <Text style={[
                styles.categoryButtonText,
                { color: formData.category === category._id ? category.color : COLORS.gray600 }
              ]}>
                {category.name}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}
      {errors.category && <Text style={styles.errorText}>{errors.category}</Text>}
    </Card>
  );

  const renderBudgetSelector = () => {
    if (formData.type !== 'expense' || !formData.category || filteredBudgets.length === 0) {
      return null;
    }

    const selectedBudget = budgets.find(b => b._id === formData.budgetId);

    return (
      <Card style={styles.card}>
        <Text style={styles.sectionTitle}>Orçamento (Opcional)</Text>
        <TouchableOpacity
          style={styles.budgetSelectorButton}
          onPress={() => setShowBudgetSelector(true)}
        >
          <View style={styles.budgetSelectorContent}>
            <Ionicons name="wallet-outline" size={20} color={COLORS.gray400} />
            <View style={styles.budgetSelectorTextContainer}>
              {selectedBudget ? (
                <View style={styles.selectedBudgetDisplay}>
                  <Text style={styles.selectedBudgetText}>{selectedBudget.name}</Text>
                  <Text style={styles.selectedBudgetSubtext}>
                    R$ {(selectedBudget.spent || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })} / 
                    R$ {selectedBudget.monthlyLimit.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </Text>
                </View>
              ) : (
                <Text style={styles.budgetSelectorPlaceholder}>Selecionar orçamento</Text>
              )}
            </View>
            <Ionicons name="chevron-forward" size={20} color={COLORS.gray400} />
          </View>
        </TouchableOpacity>
      </Card>
    );
  };

  const renderRecurringSection = () => (
    <Card style={styles.card}>
      <View style={styles.recurringHeader}>
        <View style={styles.recurringTitleContainer}>
          <Ionicons name="refresh" size={20} color={COLORS.primary} />
          <Text style={styles.recurringTitle}>Transação Recorrente</Text>
        </View>
        <TouchableOpacity
          style={[
            styles.recurringToggle,
            formData.isRecurring && styles.recurringToggleActive
          ]}
          onPress={() => handleInputChange('isRecurring', !formData.isRecurring)}
        >
          <View style={[
            styles.recurringToggleCircle,
            formData.isRecurring && styles.recurringToggleCircleActive
          ]} />
        </TouchableOpacity>
      </View>

      <Text style={styles.recurringDescription}>
        A transação será automaticamente criada todos os meses no dia especificado
      </Text>

      {formData.isRecurring && (
        <View style={styles.recurringDayContainer}>
          <Text style={styles.recurringDayLabel}>Repetir todo dia</Text>
          
          <View style={styles.recurringDaySelector}>
            <TouchableOpacity
              style={styles.recurringControlButton}
              onPress={() => {
                const currentDay = parseInt(formData.recurringDay);
                const newDay = currentDay > 1 ? currentDay - 1 : 28;
                handleInputChange('recurringDay', newDay.toString());
              }}
            >
              <Ionicons name="chevron-back" size={20} color={COLORS.primary} />
            </TouchableOpacity>
            
            <View style={styles.recurringDayDisplay}>
              <Text style={styles.recurringDayNumber}>{formData.recurringDay}</Text>
            </View>
            
            <TouchableOpacity
              style={styles.recurringControlButton}
              onPress={() => {
                const currentDay = parseInt(formData.recurringDay);
                const newDay = currentDay < 28 ? currentDay + 1 : 1;
                handleInputChange('recurringDay', newDay.toString());
              }}
            >
              <Ionicons name="chevron-forward" size={20} color={COLORS.primary} />
            </TouchableOpacity>
          </View>
          {errors.recurringDay && <Text style={styles.errorText}>{errors.recurringDay}</Text>}
        </View>
      )}
    </Card>
  );

  // Selector Modals
  const BudgetSelector = () => (
    <Modal visible={showBudgetSelector} transparent animationType="slide">
      <View style={styles.modalOverlay}>
        <View style={styles.selectorModal}>
          <View style={styles.selectorHeader}>
            <Text style={styles.selectorTitle}>Selecionar Orçamento</Text>
            <TouchableOpacity onPress={() => setShowBudgetSelector(false)}>
              <Ionicons name="close" size={24} color={COLORS.gray600} />
            </TouchableOpacity>
          </View>
          
          <ScrollView style={styles.selectorList}>
            <TouchableOpacity
              style={[
                styles.budgetItem,
                !formData.budgetId && styles.selectedBudgetItem
              ]}
              onPress={() => {
                handleInputChange('budgetId', '');
                setShowBudgetSelector(false);
              }}
            >
              <Text style={styles.budgetName}>Sem orçamento</Text>
              {!formData.budgetId && (
                <Ionicons name="checkmark" size={20} color={COLORS.success} />
              )}
            </TouchableOpacity>
            
            {filteredBudgets.map((budget) => (
              <TouchableOpacity
                key={budget._id}
                style={[
                  styles.budgetItem,
                  formData.budgetId === budget._id && styles.selectedBudgetItem
                ]}
                onPress={() => {
                  handleInputChange('budgetId', budget._id);
                  setShowBudgetSelector(false);
                }}
              >
                <View style={styles.budgetInfo}>
                  <Text style={styles.budgetName}>{budget.name}</Text>
                  <Text style={styles.budgetDetails}>
                    R$ {(budget.spent || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })} / 
                    R$ {budget.monthlyLimit.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </Text>
                </View>
                {formData.budgetId === budget._id && (
                  <Ionicons name="checkmark" size={20} color={COLORS.success} />
                )}
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );

  const RecurringSelector = () => (
    <Modal visible={showRecurringSelector} transparent animationType="slide">
      <View style={styles.modalOverlay}>
        <View style={styles.recurringModal}>
          <View style={styles.selectorHeader}>
            <Text style={styles.selectorTitle}>Transação Recorrente</Text>
            <TouchableOpacity onPress={() => setShowRecurringSelector(false)}>
              <Ionicons name="close" size={24} color={COLORS.gray600} />
            </TouchableOpacity>
          </View>
          
          <ScrollView style={styles.recurringModalContent}>
            <Text style={styles.recurringModalDescription}>
              A transação será automaticamente criada todos os meses no dia especificado
            </Text>

            <View style={styles.recurringOptions}>
              <TouchableOpacity
                style={styles.recurringOptionButton}
                onPress={() => {
                  handleInputChange('recurringDay', '1');
                  setShowRecurringSelector(false);
                }}
              >
                <Text style={styles.recurringOptionText}>Repetir todo dia 1</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.recurringOptionButton}
                onPress={() => {
                  const today = new Date().getDate();
                  handleInputChange('recurringDay', today.toString());
                  setShowRecurringSelector(false);
                }}
              >
                <Text style={styles.recurringOptionText}>Repetir todo dia {new Date().getDate()}</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.daySelector}>
              <Text style={styles.daySelectorLabel}>Ou escolha um dia específico:</Text>
              <View style={styles.dayGrid}>
                {Array.from({ length: 28 }, (_, i) => i + 1).map((day) => (
                  <TouchableOpacity
                    key={day}
                    style={[
                      styles.dayGridItem,
                      parseInt(formData.recurringDay) === day && styles.dayGridItemSelected
                    ]}
                    onPress={() => {
                      handleInputChange('recurringDay', day.toString());
                      setShowRecurringSelector(false);
                    }}
                  >
                    <Text style={[
                      styles.dayGridText,
                      parseInt(formData.recurringDay) === day && styles.dayGridTextSelected
                    ]}>
                      {day}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );

  const renderAmountModal = () => (
    <Modal
      visible={showAmountModal}
      transparent
      animationType="slide"
      onRequestClose={handleAmountModalCancel}
    >
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.modalOverlay}
      >
        <TouchableOpacity 
          style={styles.modalBackdrop} 
          activeOpacity={1} 
          onPress={handleAmountModalCancel}
        >
          <View style={styles.modalContent}>
            <TouchableOpacity activeOpacity={1} onPress={() => {}}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Digite o valor</Text>
                <TouchableOpacity onPress={handleAmountModalCancel}>
                  <Ionicons name="close" size={24} color={COLORS.gray600} />
                </TouchableOpacity>
              </View>

              <View style={styles.modalAmountContainer}>
                <Text style={styles.modalAmountPreview}>
                  {getAmountPreview()}
                </Text>
              </View>

              <View style={styles.modalInputContainer}>
                <TextInput
                  ref={amountInputRef}
                  style={styles.modalInput}
                  value={amountModalValue}
                  onChangeText={handleAmountModalChange}
                  placeholder="000000"
                  placeholderTextColor={COLORS.gray400}
                  keyboardType="numeric"
                  autoFocus
                  selectTextOnFocus
                  maxLength={9}
                />
                <Text style={styles.modalInputHelper}>
                  Digite apenas números (ex: 1500 para R$ 15,00)
                </Text>
              </View>

              <View style={styles.modalButtons}>
                <TouchableOpacity 
                  style={styles.modalButtonCancel} 
                  onPress={handleAmountModalCancel}
                >
                  <Text style={styles.modalButtonCancelText}>Cancelar</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={styles.modalButtonConfirm} 
                  onPress={handleAmountModalConfirm}
                >
                  <Text style={styles.modalButtonConfirmText}>Confirmar</Text>
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </KeyboardAvoidingView>
    </Modal>
  );

  if (categoriesLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <Loading text="Carregando formulário..." />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {renderTypeSelector()}
        {renderAmountInput()}

        <Card style={styles.card}>
          <Input
            label="Descrição"
            placeholder="Ex: Almoço no restaurante"
            value={formData.description}
            onChangeText={(value) => handleInputChange('description', value)}
            error={errors.description}
            maxLength={100}
          />

          <CalendarDatePicker
            label="Data"
            value={new Date(formData.date)}
            onDateChange={(date) => handleInputChange('date', date.toISOString().split('T')[0])}
            error={errors.date}
            required
            helperText="Selecione a data da transação"
          />
        </Card>

        {renderCategorySelector()}
        {renderBudgetSelector()}
        {renderRecurringSection()}

        <Card style={styles.card}>
          <Input
            label="Observações (opcional)"
            placeholder="Adicione detalhes sobre esta transação..."
            value={formData.notes || ''}
            onChangeText={(value) => handleInputChange('notes', value)}
            multiline
            numberOfLines={3}
            maxLength={500}
          />
        </Card>

        <View style={styles.submitContainer}>
          <Button
            title="Criar Transação"
            onPress={handleSubmit}
            loading={loading}
            disabled={loading}
            style={styles.submitButton}
          />
        </View>
      </ScrollView>

      {renderAmountModal()}
      <BudgetSelector />
      <RecurringSelector />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollView: {
    flex: 1,
    padding: SPACING.md,
  },
  card: {
    marginBottom: SPACING.md,
  },
  sectionTitle: {
    fontSize: FONT_SIZES.lg,
    fontFamily: FONTS.bold,
    color: COLORS.gray900,
    marginBottom: SPACING.md,
  },
  
  typeContainer: {
    flexDirection: 'row',
    gap: SPACING.md,
  },
  typeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.lg,
    paddingHorizontal: SPACING.md,
    borderWidth: 2,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: COLORS.white,
  },
  typeButtonActive: {
    backgroundColor: COLORS.primary,
  },
  typeIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.sm,
  },
  typeButtonText: {
    fontSize: FONT_SIZES.md,
    fontFamily: FONTS.bold,
  },

  amountButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.lg,
    paddingHorizontal: SPACING.md,
    backgroundColor: COLORS.gray50,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 2,
    borderColor: COLORS.gray200,
  },
  amountButtonError: {
    borderColor: COLORS.error,
  },
  amountContent: {
    flex: 1,
    marginLeft: SPACING.md,
  },
  amountLabel: {
    fontSize: FONT_SIZES.sm,
    fontFamily: FONTS.medium,
    color: COLORS.gray600,
    marginBottom: 2,
  },
  amountValue: {
    fontSize: FONT_SIZES.xl,
    fontFamily: FONTS.bold,
    color: COLORS.gray900,
  },
  amountValuePlaceholder: {
    color: COLORS.gray400,
  },

  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.lg,
  },
  loadingText: {
    marginLeft: SPACING.sm,
    fontSize: FONT_SIZES.md,
    color: COLORS.gray600,
  },
  categoriesContainer: {
    paddingHorizontal: SPACING.xs,
  },
  categoryButton: {
    alignItems: 'center',
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.sm,
    marginHorizontal: SPACING.xs,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 2,
    backgroundColor: COLORS.white,
    minWidth: 80,
  },
  categoryButtonActive: {
    backgroundColor: COLORS.white,
  },
  categoryIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.xs,
  },
  categoryButtonText: {
    fontSize: FONT_SIZES.sm,
    fontFamily: FONTS.medium,
    textAlign: 'center',
  },

  // Budget Selector
  budgetSelectorButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.lg,
    paddingHorizontal: SPACING.md,
    backgroundColor: COLORS.gray50,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.gray200,
  },
  budgetSelectorContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  budgetSelectorTextContainer: {
    flex: 1,
    marginLeft: SPACING.md,
  },
  budgetSelectorPlaceholder: {
    fontSize: FONT_SIZES.md,
    color: COLORS.gray400,
  },
  selectedBudgetDisplay: {
    flex: 1,
  },
  selectedBudgetText: {
    fontSize: FONT_SIZES.md,
    fontFamily: FONTS.medium,
    color: COLORS.gray900,
  },
  selectedBudgetSubtext: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.gray600,
    marginTop: 2,
  },

  recurringHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.sm,
  },
  recurringTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  recurringTitle: {
    fontSize: FONT_SIZES.lg,
    fontFamily: FONTS.bold,
    color: COLORS.gray900,
    marginLeft: SPACING.sm,
  },
  recurringToggle: {
    width: 48,
    height: 28,
    borderRadius: 14,
    backgroundColor: COLORS.gray300,
    justifyContent: 'center',
    paddingHorizontal: 2,
  },
  recurringToggleActive: {
    backgroundColor: COLORS.primary,
  },
  recurringToggleCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: COLORS.white,
    alignSelf: 'flex-start',
  },
  recurringToggleCircleActive: {
    alignSelf: 'flex-end',
  },
  recurringDescription: {
    fontSize: FONT_SIZES.sm,
    fontFamily: FONTS.regular,
    color: COLORS.gray600,
    marginBottom: SPACING.lg,
  },
  recurringDayContainer: {
    alignItems: 'center',
  },
  recurringDayLabel: {
    fontSize: FONT_SIZES.md,
    fontFamily: FONTS.medium,
    color: COLORS.gray700,
    marginBottom: SPACING.md,
  },
  recurringDaySelector: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
  },
  recurringDayDisplay: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  recurringDayNumber: {
    fontSize: FONT_SIZES.xl,
    fontFamily: FONTS.bold,
    color: COLORS.white,
  },
  recurringControlButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.primary + '20',
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalBackdrop: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: BORDER_RADIUS.lg,
    borderTopRightRadius: BORDER_RADIUS.lg,
    paddingTop: SPACING.lg,
    ...SHADOWS.lg,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg,
    marginBottom: SPACING.lg,
  },
  modalTitle: {
    fontSize: FONT_SIZES.xl,
    fontFamily: FONTS.bold,
    color: COLORS.gray900,
  },
  modalAmountContainer: {
    alignItems: 'center',
    paddingVertical: SPACING.xl,
    backgroundColor: COLORS.gray50,
    marginHorizontal: SPACING.lg,
    borderRadius: BORDER_RADIUS.md,
    marginBottom: SPACING.lg,
  },
  modalAmountPreview: {
    fontSize: 32,
    fontFamily: FONTS.bold,
    color: COLORS.primary,
  },
  modalInputContainer: {
    paddingHorizontal: SPACING.lg,
    marginBottom: SPACING.lg,
  },
  modalInput: {
    fontSize: FONT_SIZES.xl,
    fontFamily: FONTS.bold,
    textAlign: 'center',
    paddingVertical: SPACING.md,
    borderBottomWidth: 2,
    borderBottomColor: COLORS.primary,
    color: COLORS.gray900,
  },
  modalInputHelper: {
    fontSize: FONT_SIZES.sm,
    fontFamily: FONTS.regular,
    color: COLORS.gray600,
    textAlign: 'center',
    marginTop: SPACING.sm,
  },
  modalButtons: {
    flexDirection: 'row',
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.xl,
    gap: SPACING.md,
  },
  modalButtonCancel: {
    flex: 1,
    paddingVertical: SPACING.md,
    backgroundColor: COLORS.gray200,
    borderRadius: BORDER_RADIUS.md,
    alignItems: 'center',
  },
  modalButtonCancelText: {
    fontSize: FONT_SIZES.md,
    fontFamily: FONTS.bold,
    color: COLORS.gray700,
  },
  modalButtonConfirm: {
    flex: 1,
    paddingVertical: SPACING.md,
    backgroundColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.md,
    alignItems: 'center',
  },
  modalButtonConfirmText: {
    fontSize: FONT_SIZES.md,
    fontFamily: FONTS.bold,
    color: COLORS.white,
  },

  // Selector Modal
  selectorModal: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: BORDER_RADIUS.lg,
    borderTopRightRadius: BORDER_RADIUS.lg,
    maxHeight: '80%',
  },
  recurringModal: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: BORDER_RADIUS.lg,
    borderTopRightRadius: BORDER_RADIUS.lg,
    maxHeight: '90%',
    paddingBottom: SPACING.lg,
  },
  selectorHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray200,
  },
  selectorTitle: {
    fontSize: FONT_SIZES.lg,
    fontFamily: FONTS.bold,
    color: COLORS.gray900,
  },
  selectorList: {
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
  },
  budgetItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray100,
  },
  selectedBudgetItem: {
    backgroundColor: COLORS.primary + '10',
    marginHorizontal: -SPACING.lg,
    paddingHorizontal: SPACING.lg,
    borderRadius: BORDER_RADIUS.sm,
  },
  budgetInfo: {
    flex: 1,
  },
  budgetName: {
    fontSize: FONT_SIZES.md,
    fontFamily: FONTS.medium,
    color: COLORS.gray900,
  },
  budgetDetails: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.gray600,
    marginTop: 2,
  },

  // Recurring Modal
  recurringModalContent: {
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
  },
  recurringModalDescription: {
    fontSize: FONT_SIZES.md,
    color: COLORS.gray600,
    marginBottom: SPACING.lg,
    lineHeight: 20,
  },
  recurringOptions: {
    marginBottom: SPACING.lg,
  },
  recurringOptionButton: {
    padding: SPACING.md,
    backgroundColor: COLORS.gray50,
    borderRadius: BORDER_RADIUS.md,
    marginBottom: SPACING.sm,
  },
  recurringOptionText: {
    fontSize: FONT_SIZES.md,
    fontFamily: FONTS.medium,
    color: COLORS.gray900,
  },
  daySelector: {
    marginTop: SPACING.md,
  },
  daySelectorLabel: {
    fontSize: FONT_SIZES.md,
    fontFamily: FONTS.medium,
    color: COLORS.gray900,
    marginBottom: SPACING.md,
  },
  dayGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
  },
  dayGridItem: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.gray100,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.sm,
  },
  dayGridItemSelected: {
    backgroundColor: COLORS.primary,
  },
  dayGridText: {
    fontSize: FONT_SIZES.md,
    fontFamily: FONTS.medium,
    color: COLORS.gray700,
  },
  dayGridTextSelected: {
    color: COLORS.white,
  },
  
  submitContainer: {
    paddingTop: SPACING.lg,
    paddingBottom: SPACING.xl,
  },
  submitButton: {
    marginTop: SPACING.md,
  },
  
  errorText: {
    fontSize: FONT_SIZES.sm,
    fontFamily: FONTS.medium,
    color: COLORS.error,
    marginTop: SPACING.xs,
  },
});

export default CreateTransactionScreen;