// src/screens/transactions/CreateTransactionScreen.tsx - VERSÃO COM EMOJIS
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Modal,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useFocusEffect } from '@react-navigation/native';

import { Card, Button, Loading } from '../../components/common';
import { CategoryService } from '../../services/CategoryService';
import { TransactionService } from '../../services/TransactionService';
import { BudgetService } from '../../services/BudgetService';
import { Category, Budget, CreateTransactionData } from '../../types';
import { COLORS, FONTS, FONT_SIZES, SPACING, BORDER_RADIUS, SHADOWS } from '../../constants';
import { formatCurrency } from '../../utils';

type RootStackParamList = {
  TransactionList: undefined;
  CreateTransaction: undefined;
};

type CreateTransactionScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'CreateTransaction'>;

interface Props {
  navigation: CreateTransactionScreenNavigationProp;
}

export const CreateTransactionScreen: React.FC<Props> = ({ navigation }) => {
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [showCategorySelector, setShowCategorySelector] = useState(false);
  const [showBudgetSelector, setShowBudgetSelector] = useState(false);
  const [showRecurringSelector, setShowRecurringSelector] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showAmountModal, setShowAmountModal] = useState(false);
  const [tempAmount, setTempAmount] = useState('');

  const [formData, setFormData] = useState({
    description: '',
    amount: '',
    type: 'expense' as 'income' | 'expense',
    category: '',
    budgetId: '',
    date: new Date(),
    notes: '',
    isRecurring: false,
    recurringDay: '',
  });

  useFocusEffect(
    useCallback(() => {
      loadCategories();
      loadBudgets();
    }, [])
  );

  const loadCategories = async () => {
    try {
      const response = await CategoryService.getCategories();
      if (response.success && response.data) {
        const categoryMap = new Map<string, Category>();
        
        response.data.forEach(category => {
          const hasValidIcon = category.icon && category.icon.trim() !== '' && category.icon !== '?';
          const hasValidColor = category.color && category.color.trim() !== '';
          const categoryName = category.name.toLowerCase().trim();
          
          if (hasValidIcon && hasValidColor) {
            const existing = categoryMap.get(categoryName);
            if (!existing || (existing.icon === '?' && category.icon !== '?')) {
              categoryMap.set(categoryName, category);
            }
          }
        });
        
        const uniqueCategories = Array.from(categoryMap.values());
        console.log('Categorias únicas carregadas:', uniqueCategories.length);
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
        setBudgets(response.data.filter(b => b.isActive));
      }
    } catch (error) {
      console.error('Erro ao carregar orçamentos:', error);
    }
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleAmountModalOpen = () => {
    setTempAmount(formData.amount.replace(/[^\d]/g, ''));
    setShowAmountModal(true);
  };

  const handleAmountModalConfirm = () => {
    const numericValue = tempAmount.replace(/[^\d]/g, '');
    const floatValue = parseInt(numericValue || '0') / 100;
    const formatted = floatValue.toLocaleString('pt-BR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
    handleInputChange('amount', `R$ ${formatted}`);
    setShowAmountModal(false);
  };

  const handleAmountModalCancel = () => {
    setTempAmount('');
    setShowAmountModal(false);
  };

  const parseCurrency = (value: string): number => {
    return parseFloat(value.replace(/[^\d,]/g, '').replace(',', '.')) || 0;
  };

  const validateForm = (): boolean => {
    if (!formData.description.trim()) {
      Alert.alert('Erro', 'Digite uma descrição para a transação');
      return false;
    }

    const amountValue = parseCurrency(formData.amount);
    if (amountValue <= 0) {
      Alert.alert('Erro', 'Digite um valor válido');
      return false;
    }

    if (!formData.category) {
      Alert.alert('Erro', 'Selecione uma categoria');
      return false;
    }

    if (formData.isRecurring && !formData.recurringDay) {
      Alert.alert('Erro', 'Selecione o dia para recorrência');
      return false;
    }

    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    try {
      setLoading(true);

      const transactionData: CreateTransactionData = {
        description: formData.description.trim(),
        amount: parseCurrency(formData.amount),
        type: formData.type,
        category: formData.category,
        date: formData.date.toISOString(),
        notes: formData.notes.trim() || undefined,
        isRecurring: formData.isRecurring,
        recurringDay: formData.isRecurring ? parseInt(formData.recurringDay) : undefined,
        budgetId: formData.budgetId || undefined,
      };

      const response = await TransactionService.createTransaction(transactionData);

      if (response.success) {
        setTimeout(() => {
          navigation.goBack();
          Alert.alert('Sucesso', 'Transação criada com sucesso');
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

  const getDaysInCurrentMonth = () => {
    const year = formData.date.getFullYear();
    const month = formData.date.getMonth();
    return new Date(year, month + 1, 0).getDate();
  };

  const filteredCategories = categories.filter(cat => cat.type === formData.type);
  const selectedCategoryObj = categories.find(cat => cat._id === formData.category);
  
  const filteredBudgets = budgets.filter(budget => {
    if (formData.type !== 'expense') return false;
    if (!budget.category) return false;
    
    const categoryId = typeof budget.category === 'string' 
      ? budget.category 
      : budget.category._id || budget.category.id;
    
    return categoryId === formData.category;
  });

  const selectedBudget = budgets.find(b => b._id === formData.budgetId || b.id === formData.budgetId);

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
          onPress={() => {
            handleInputChange('type', 'expense');
            handleInputChange('budgetId', '');
          }}
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
          onPress={() => {
            handleInputChange('type', 'income');
            handleInputChange('budgetId', '');
          }}
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

  const renderCategorySelector = () => (
    <Modal
      visible={showCategorySelector}
      transparent
      animationType="slide"
      onRequestClose={() => setShowCategorySelector(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.selectorContainer}>
          <View style={styles.selectorHeader}>
            <Text style={styles.selectorTitle}>Selecionar Categoria</Text>
            <TouchableOpacity onPress={() => setShowCategorySelector(false)}>
              <Ionicons name="close" size={24} color="#666" />
            </TouchableOpacity>
          </View>
          
          <ScrollView style={styles.selectorList}>
            {filteredCategories.map((category) => (
              <TouchableOpacity
                key={category._id}
                style={[
                  styles.categoryItem,
                  formData.category === category._id && styles.selectedCategoryItem
                ]}
                onPress={() => {
                  handleInputChange('category', category._id);
                  setShowCategorySelector(false);
                  if (formData.budgetId) {
                    const budget = budgets.find(b => b._id === formData.budgetId || b.id === formData.budgetId);
                    if (budget) {
                      const budgetCategoryId = typeof budget.category === 'string' 
                        ? budget.category
                        : budget.category?._id || budget.category?.id;
                      
                      if (budgetCategoryId !== category._id) {
                        handleInputChange('budgetId', '');
                      }
                    }
                  }
                }}
              >
                <View style={styles.categoryInfo}>
                  <View style={[
                    styles.categoryIconContainer,
                    { backgroundColor: category.color + '20' }
                  ]}>
                    <Text style={{ fontSize: 20 }}>{category.icon}</Text>
                  </View>
                  <Text style={styles.categoryName}>{category.name}</Text>
                </View>
                {formData.category === category._id && (
                  <Ionicons name="checkmark" size={20} color="#4CAF50" />
                )}
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );

  const renderBudgetSelector = () => (
    <Modal
      visible={showBudgetSelector}
      transparent
      animationType="slide"
      onRequestClose={() => setShowBudgetSelector(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.selectorContainer}>
          <View style={styles.selectorHeader}>
            <Text style={styles.selectorTitle}>Selecionar Orçamento</Text>
            <TouchableOpacity onPress={() => setShowBudgetSelector(false)}>
              <Ionicons name="close" size={24} color="#666" />
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
              <Text style={styles.budgetName}>Nenhum orçamento</Text>
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
                    {formatCurrency(budget.spent)} / {formatCurrency(budget.monthlyLimit)}
                  </Text>
                </View>
                {formData.budgetId === budget._id && (
                  <Ionicons name="checkmark" size={20} color="#4CAF50" />
                )}
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );

  const renderRecurringSelector = () => (
    <Modal
      visible={showRecurringSelector}
      transparent
      animationType="slide"
      onRequestClose={() => setShowRecurringSelector(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.selectorContainer}>
          <View style={styles.selectorHeader}>
            <Text style={styles.selectorTitle}>Dia da Recorrência</Text>
            <TouchableOpacity onPress={() => setShowRecurringSelector(false)}>
              <Ionicons name="close" size={24} color="#666" />
            </TouchableOpacity>
          </View>
          
          <ScrollView style={styles.recurringContent}>
            <Text style={styles.recurringDescription}>
              A transação será criada automaticamente todo mês no dia escolhido
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
                {Array.from({ length: getDaysInCurrentMonth() }, (_, i) => i + 1).map((day) => (
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
        <View style={styles.amountModalContainer}>
          <View style={styles.amountModalHeader}>
            <Text style={styles.amountModalTitle}>Valor da Transação</Text>
            <TouchableOpacity onPress={handleAmountModalCancel}>
              <Ionicons name="close" size={24} color="#666" />
            </TouchableOpacity>
          </View>

          <TextInput
            style={styles.amountInput}
            value={tempAmount ? `R$ ${(parseInt(tempAmount) / 100).toFixed(2).replace('.', ',')}` : 'R$ 0,00'}
            keyboardType="numeric"
            onChangeText={(text) => {
              const numericValue = text.replace(/[^\d]/g, '');
              setTempAmount(numericValue);
            }}
            autoFocus
          />

          <View style={styles.amountModalButtons}>
            <Button
              title="Cancelar"
              onPress={handleAmountModalCancel}
              variant="outline"
              style={{ flex: 1, marginRight: SPACING.sm }}
            />
            <Button
              title="Confirmar"
              onPress={handleAmountModalConfirm}
              style={{ flex: 1 }}
            />
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );

  if (loading) {
    return <Loading text="Criando transação..." />;
  }

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {renderTypeSelector()}

        <Card style={styles.card}>
          <Text style={styles.sectionTitle}>Informações</Text>
          
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Descrição *</Text>
            <TextInput
              style={styles.input}
              value={formData.description}
              onChangeText={(text) => handleInputChange('description', text)}
              placeholder="Ex: Compra no supermercado"
              placeholderTextColor="#999"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Valor *</Text>
            <TouchableOpacity
              style={styles.input}
              onPress={handleAmountModalOpen}
            >
              <Text style={formData.amount ? styles.inputText : styles.placeholder}>
                {formData.amount || 'R$ 0,00'}
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Categoria *</Text>
            <TouchableOpacity
              style={styles.input}
              onPress={() => setShowCategorySelector(true)}
            >
              {selectedCategoryObj ? (
                <View style={styles.selectedCategory}>
                  <View style={[
                    styles.categoryIconSmall,
                    { backgroundColor: selectedCategoryObj.color + '20' }
                  ]}>
                    <Text style={{ fontSize: 16 }}>{selectedCategoryObj.icon}</Text>
                  </View>
                  <Text style={styles.inputText}>{selectedCategoryObj.name}</Text>
                </View>
              ) : (
                <Text style={styles.placeholder}>Selecione uma categoria</Text>
              )}
              <Ionicons name="chevron-down" size={20} color="#999" />
            </TouchableOpacity>
          </View>

          {formData.type === 'expense' && formData.category && filteredBudgets.length > 0 && (
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Orçamento (opcional)</Text>
              <TouchableOpacity
                style={styles.input}
                onPress={() => setShowBudgetSelector(true)}
              >
                {selectedBudget ? (
                  <View style={styles.selectedBudget}>
                    <Text style={styles.inputText}>{selectedBudget.name}</Text>
                    <Text style={styles.budgetDetailsSmall}>
                      {formatCurrency(selectedBudget.spent)} / {formatCurrency(selectedBudget.monthlyLimit)}
                    </Text>
                  </View>
                ) : (
                  <Text style={styles.placeholder}>Selecione um orçamento</Text>
                )}
                <Ionicons name="chevron-down" size={20} color="#999" />
              </TouchableOpacity>
            </View>
          )}

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Data</Text>
            <TouchableOpacity
              style={styles.input}
              onPress={() => setShowDatePicker(true)}
            >
              <Text style={styles.inputText}>
                {formData.date.toLocaleDateString('pt-BR')}
              </Text>
              <Ionicons name="calendar-outline" size={20} color="#666" />
            </TouchableOpacity>
          </View>

          {showDatePicker && (
            <DateTimePicker
              value={formData.date}
              mode="date"
              display="default"
              onChange={(event, selectedDate) => {
                setShowDatePicker(false);
                if (selectedDate) {
                  handleInputChange('date', selectedDate);
                  if (formData.isRecurring) {
                    handleInputChange('recurringDay', selectedDate.getDate().toString());
                  }
                }
              }}
            />
          )}

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Observações</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={formData.notes}
              onChangeText={(text) => handleInputChange('notes', text)}
              placeholder="Adicione observações (opcional)"
              placeholderTextColor="#999"
              multiline
              numberOfLines={3}
            />
          </View>
        </Card>

        <Card style={styles.card}>
          <View style={styles.switchContainer}>
            <View style={styles.switchInfo}>
              <Text style={styles.switchLabel}>Transação Recorrente</Text>
              <Text style={styles.switchDescription}>
                Repetir mensalmente
              </Text>
            </View>
            <TouchableOpacity
              style={[
                styles.switch,
                formData.isRecurring && styles.switchActive
              ]}
              onPress={() => {
                const newValue = !formData.isRecurring;
                handleInputChange('isRecurring', newValue);
                if (!newValue) {
                  handleInputChange('recurringDay', '');
                }
              }}
            >
              <View style={[
                styles.switchThumb,
                formData.isRecurring && styles.switchThumbActive
              ]} />
            </TouchableOpacity>
          </View>

          {formData.isRecurring && (
            <TouchableOpacity
              style={styles.recurringDayButton}
              onPress={() => setShowRecurringSelector(true)}
            >
              <Text style={styles.recurringDayLabel}>Dia da recorrência</Text>
              <View style={styles.recurringDayValue}>
                <Text style={styles.recurringDayText}>
                  {formData.recurringDay ? `Dia ${formData.recurringDay}` : 'Selecionar dia'}
                </Text>
                <Ionicons name="chevron-forward" size={20} color="#666" />
              </View>
            </TouchableOpacity>
          )}
        </Card>
      </ScrollView>

      <View style={styles.footer}>
        <Button
          title="Criar Transação"
          onPress={handleSubmit}
          disabled={loading}
          loading={loading}
        />
      </View>

      {renderCategorySelector()}
      {renderBudgetSelector()}
      {renderRecurringSelector()}
      {renderAmountModal()}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  card: {
    margin: SPACING.md,
  },
  sectionTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginBottom: SPACING.md,
  },
  typeContainer: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  typeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 2,
    gap: SPACING.xs,
  },
  typeButtonActive: {
    backgroundColor: COLORS.error,
  },
  typeIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  typeButtonText: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
  },
  inputGroup: {
    marginBottom: SPACING.md,
  },
  label: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    marginBottom: SPACING.xs,
    fontWeight: '500',
  },
  input: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  inputText: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textPrimary,
  },
  placeholder: {
    fontSize: FONT_SIZES.md,
    color: '#999',
  },
  textArea: {
    minHeight: 80,
    alignItems: 'flex-start',
    paddingTop: SPACING.md,
  },
  selectedCategory: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    flex: 1,
  },
  categoryIconSmall: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectedBudget: {
    flex: 1,
  },
  budgetDetailsSmall: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  switchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.md,
  },
  switchInfo: {
    flex: 1,
  },
  switchLabel: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginBottom: 4,
  },
  switchDescription: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
  },
  switch: {
    width: 50,
    height: 28,
    borderRadius: 14,
    backgroundColor: COLORS.border,
    padding: 2,
    justifyContent: 'center',
  },
  switchActive: {
    backgroundColor: COLORS.primary,
  },
  switchThumb: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: COLORS.white,
  },
  switchThumbActive: {
    transform: [{ translateX: 22 }],
  },
  recurringDayButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.background,
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
  },
  recurringDayLabel: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
  },
  recurringDayValue: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  recurringDayText: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textPrimary,
    fontWeight: '500',
  },
  footer: {
    padding: SPACING.md,
    backgroundColor: COLORS.white,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  selectorContainer: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: BORDER_RADIUS.lg,
    borderTopRightRadius: BORDER_RADIUS.lg,
    maxHeight: '80%',
  },
  selectorHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  selectorTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  selectorList: {
    maxHeight: 400,
  },
  categoryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  selectedCategoryItem: {
    backgroundColor: COLORS.primary + '10',
  },
  categoryInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  categoryIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryName: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textPrimary,
  },
  budgetItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  selectedBudgetItem: {
    backgroundColor: COLORS.primary + '10',
  },
  budgetInfo: {
    flex: 1,
  },
  budgetName: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textPrimary,
    fontWeight: '500',
  },
  budgetDetails: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    marginTop: 4,
  },
  recurringContent: {
    padding: SPACING.md,
  },
  recurringDescription: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    marginBottom: SPACING.md,
    textAlign: 'center',
  },
  recurringOptions: {
    gap: SPACING.sm,
    marginBottom: SPACING.lg,
  },
  recurringOptionButton: {
    backgroundColor: COLORS.primary,
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    alignItems: 'center',
  },
  recurringOptionText: {
    fontSize: FONT_SIZES.md,
    color: COLORS.white,
    fontWeight: '600',
  },
  daySelector: {
    marginTop: SPACING.md,
  },
  daySelectorLabel: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    marginBottom: SPACING.md,
  },
  dayGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
  },
  dayGridItem: {
    width: 45,
    height: 45,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: COLORS.background,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  dayGridItemSelected: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  dayGridText: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textPrimary,
  },
  dayGridTextSelected: {
    color: COLORS.white,
    fontWeight: '600',
  },
  amountModalContainer: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: BORDER_RADIUS.lg,
    borderTopRightRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
  },
  amountModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.lg,
  },
  amountModalTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  amountInput: {
    fontSize: 32,
    fontWeight: '600',
    color: COLORS.textPrimary,
    textAlign: 'center',
    padding: SPACING.lg,
    marginBottom: SPACING.lg,
  },
  amountModalButtons: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
});