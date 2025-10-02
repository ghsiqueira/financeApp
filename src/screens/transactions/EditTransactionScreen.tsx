import React, { useState, useEffect } from 'react';
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
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';

import { Card, Button, Loading, CalendarDatePicker } from '../../components/common';
import { CategoryService } from '../../services/CategoryService';
import { TransactionService } from '../../services/TransactionService';
import { BudgetService } from '../../services/BudgetService';
import { Category, Budget, UpdateTransactionData } from '../../types';
import { COLORS, FONTS, SPACING, BORDER_RADIUS, FONT_SIZES, SHADOWS } from '../../constants';
import { formatCurrency } from '../../utils';

type RootStackParamList = {
  TransactionList: undefined;
  EditTransaction: { transactionId: string };
};

type EditTransactionScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'EditTransaction'>;
type EditTransactionScreenRouteProp = RouteProp<RootStackParamList, 'EditTransaction'>;

interface Props {
  navigation: EditTransactionScreenNavigationProp;
  route: EditTransactionScreenRouteProp;
}

export const EditTransactionScreen: React.FC<Props> = ({ navigation, route }) => {
  const { transactionId } = route.params;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [type, setType] = useState<'income' | 'expense'>('expense');
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [selectedBudget, setSelectedBudget] = useState<Budget | null>(null);
  const [date, setDate] = useState(new Date());
  const [notes, setNotes] = useState('');
  const [isRecurring, setIsRecurring] = useState(false);
  const [recurringDay, setRecurringDay] = useState(1);

  const [showCategorySelector, setShowCategorySelector] = useState(false);
  const [showBudgetSelector, setShowBudgetSelector] = useState(false);
  const [showRecurringSelector, setShowRecurringSelector] = useState(false);

  const [errors, setErrors] = useState<{
    description?: string;
    amount?: string;
    category?: string;
  }>({});

  useEffect(() => {
    loadTransaction();
    loadCategories();
    loadBudgets();
  }, []);

  const loadTransaction = async () => {
    try {
      const response = await TransactionService.getTransaction(transactionId);
      if (response.success && response.data) {
        const transaction = response.data;
        
        setDescription(transaction.description);
        setAmount(formatCurrency(transaction.amount));
        setType(transaction.type);
        setDate(new Date(transaction.date));
        setNotes(transaction.notes || '');
        setIsRecurring(transaction.isRecurring || false);
        setRecurringDay(transaction.recurringDay || 1);

        if (transaction.category) {
          const cat = typeof transaction.category === 'object' 
            ? transaction.category 
            : null;
          if (cat) setSelectedCategory(cat);
        }

        if (transaction.budgetId) {
          const budget = typeof transaction.budgetId === 'object' 
            ? transaction.budgetId 
            : null;
          if (budget) setSelectedBudget(budget);
        }
      }
    } catch (error) {
      console.error('Erro ao carregar transação:', error);
      Alert.alert('Erro', 'Não foi possível carregar a transação');
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

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
        
        setCategories(Array.from(categoryMap.values()));
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

  const handleAmountChange = (text: string) => {
    const numericValue = text.replace(/[^\d]/g, '');
    const floatValue = parseInt(numericValue) / 100;
    const formatted = floatValue.toLocaleString('pt-BR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
    setAmount(`R$ ${formatted}`);
    
    if (floatValue > 0) {
      setErrors(prev => ({ ...prev, amount: undefined }));
    }
  };

  const handleDescriptionChange = (text: string) => {
    setDescription(text);
    if (text.trim()) {
      setErrors(prev => ({ ...prev, description: undefined }));
    }
  };

  const handleDateChange = (selectedDate: Date) => {
    setDate(selectedDate);
    if (isRecurring) {
      setRecurringDay(selectedDate.getDate());
    }
  };

  const parseCurrency = (value: string): number => {
    return parseFloat(value.replace(/[^\d,]/g, '').replace(',', '.')) || 0;
  };

  const validateForm = (): boolean => {
    const newErrors: typeof errors = {};

    if (!description.trim()) {
      newErrors.description = 'Descrição é obrigatória';
    }

    const amountValue = parseCurrency(amount);
    if (amountValue <= 0) {
      newErrors.amount = 'Digite um valor válido';
    }

    if (!selectedCategory) {
      newErrors.category = 'Selecione uma categoria';
    }

    setErrors(newErrors);

    if (Object.keys(newErrors).length > 0) {
      Alert.alert('Atenção', 'Preencha todos os campos obrigatórios');
      return false;
    }

    return true;
  };

  const handleSave = async () => {
    if (!validateForm()) return;

    try {
      setSaving(true);

      const updateData: UpdateTransactionData = {
        description: description.trim(),
        amount: parseCurrency(amount),
        type,
        category: selectedCategory?._id || selectedCategory?.id,
        budgetId: selectedBudget ? (selectedBudget._id || selectedBudget.id) : undefined,
        date: date.toISOString(),
        notes: notes.trim() || undefined,
        isRecurring,
        recurringDay: isRecurring ? recurringDay : undefined,
      };

      const response = await TransactionService.updateTransaction(transactionId, updateData);

      if (response.success) {
        Alert.alert('Sucesso', 'Transação atualizada com sucesso!', [
          { text: 'OK', onPress: () => navigation.goBack() }
        ]);
      }
    } catch (error: any) {
      console.error('Erro ao salvar:', error);
      Alert.alert('Erro', error.message || 'Erro ao salvar transação');
    } finally {
      setSaving(false);
    }
  };

  const getDaysInCurrentMonth = () => {
    const year = date.getFullYear();
    const month = date.getMonth();
    return new Date(year, month + 1, 0).getDate();
  };

  const filteredCategories = categories.filter(cat => cat.type === type);
  
  const filteredBudgets = budgets.filter(budget => {
    if (type !== 'expense') return false;
    if (!budget.category) return false;
    
    const categoryId = typeof budget.category === 'string' 
      ? budget.category 
      : budget.category._id || budget.category.id;
    
    return categoryId === (selectedCategory?._id || selectedCategory?.id);
  });

  // ... (CategorySelector, RecurringSelector e BudgetSelector permanecem iguais)

  const CategorySelector = () => (
    <View style={styles.selectorContainer}>
      <View style={styles.selectorHeader}>
        <Text style={styles.selectorTitle}>Selecionar Categoria</Text>
        <TouchableOpacity onPress={() => setShowCategorySelector(false)}>
          <Ionicons name="close" size={24} color={COLORS.textSecondary} />
        </TouchableOpacity>
      </View>
      
      <ScrollView style={styles.selectorList}>
        {filteredCategories.map((category) => (
          <TouchableOpacity
            key={category._id}
            style={[
              styles.categoryItem,
              selectedCategory?._id === category._id && styles.selectedCategoryItem
            ]}
            onPress={() => {
              setSelectedCategory(category);
              setShowCategorySelector(false);
              setErrors(prev => ({ ...prev, category: undefined }));
              
              if (selectedBudget) {
                const budgetCategoryId = typeof selectedBudget.category === 'string' 
                  ? selectedBudget.category
                  : selectedBudget.category?._id || selectedBudget.category?.id;
                
                if (budgetCategoryId !== category._id) {
                  setSelectedBudget(null);
                }
              }
            }}
          >
            <View style={styles.categoryInfo}>
              <View style={[
                styles.categoryIconContainer,
                { backgroundColor: category.color + '20' }
              ]}>
                <Text style={styles.categoryEmoji}>{category.icon}</Text>
              </View>
              <Text style={styles.categoryName}>{category.name}</Text>
            </View>
            {selectedCategory?._id === category._id && (
              <Ionicons name="checkmark-circle" size={24} color={COLORS.success} />
            )}
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );

  const RecurringSelector = () => (
    <View style={styles.selectorContainer}>
      <View style={styles.selectorHeader}>
        <Text style={styles.selectorTitle}>Transação Recorrente</Text>
        <TouchableOpacity onPress={() => setShowRecurringSelector(false)}>
          <Ionicons name="close" size={24} color={COLORS.textSecondary} />
        </TouchableOpacity>
      </View>
      
      <View style={styles.recurringContent}>
        <View style={styles.recurringInfo}>
          <Ionicons name="repeat" size={32} color={COLORS.primary} />
          <Text style={styles.recurringDescription}>
            A transação será criada automaticamente todos os meses no dia especificado
          </Text>
        </View>

        <View style={styles.recurringOptions}>
          <TouchableOpacity
            style={styles.recurringOptionButton}
            onPress={() => {
              setRecurringDay(1);
              setShowRecurringSelector(false);
            }}
          >
            <Text style={styles.recurringOptionText}>Repetir todo dia 1</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.recurringOptionButton, styles.recurringOptionButtonOutline]}
            onPress={() => {
              setRecurringDay(date.getDate());
              setShowRecurringSelector(false);
            }}
          >
            <Text style={[styles.recurringOptionText, styles.recurringOptionTextOutline]}>
              Repetir todo dia {date.getDate()}
            </Text>
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
                  recurringDay === day && styles.dayGridItemSelected
                ]}
                onPress={() => {
                  setRecurringDay(day);
                  setShowRecurringSelector(false);
                }}
              >
                <Text style={[
                  styles.dayGridText,
                  recurringDay === day && styles.dayGridTextSelected
                ]}>
                  {day}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </View>
    </View>
  );

  const BudgetSelector = () => (
    <View style={styles.selectorContainer}>
      <View style={styles.selectorHeader}>
        <Text style={styles.selectorTitle}>Selecionar Orçamento</Text>
        <TouchableOpacity onPress={() => setShowBudgetSelector(false)}>
          <Ionicons name="close" size={24} color={COLORS.textSecondary} />
        </TouchableOpacity>
      </View>
      
      <ScrollView style={styles.selectorList}>
        <TouchableOpacity
          style={[
            styles.budgetItem,
            !selectedBudget && styles.selectedBudgetItem
          ]}
          onPress={() => {
            setSelectedBudget(null);
            setShowBudgetSelector(false);
          }}
        >
          <View style={styles.budgetInfo}>
            <Text style={styles.budgetName}>Nenhum orçamento</Text>
            <Text style={styles.budgetDetails}>Não vincular a um orçamento</Text>
          </View>
          {!selectedBudget && (
            <Ionicons name="checkmark-circle" size={24} color={COLORS.success} />
          )}
        </TouchableOpacity>

        {filteredBudgets.map((budget) => {
          const percentage = budget.monthlyLimit > 0 
            ? (budget.spent / budget.monthlyLimit) * 100 
            : 0;
          const isOverBudget = budget.spent > budget.monthlyLimit;

          return (
            <TouchableOpacity
              key={budget._id}
              style={[
                styles.budgetItem,
                selectedBudget?._id === budget._id && styles.selectedBudgetItem
              ]}
              onPress={() => {
                setSelectedBudget(budget);
                setShowBudgetSelector(false);
              }}
            >
              <View style={styles.budgetInfo}>
                <Text style={styles.budgetName}>{budget.name}</Text>
                <Text style={[
                  styles.budgetDetails,
                  isOverBudget && { color: COLORS.error }
                ]}>
                  {formatCurrency(budget.spent)} / {formatCurrency(budget.monthlyLimit)} ({percentage.toFixed(0)}%)
                </Text>
              </View>
              {selectedBudget?._id === budget._id && (
                <Ionicons name="checkmark-circle" size={24} color={COLORS.success} />
              )}
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <Loading text="Carregando transação..." />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.headerButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color={COLORS.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Editar Transação</Text>
        <View style={{ width: 40 }} />
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView 
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {/* Tipo de Transação */}
          <Card style={styles.card}>
            <Text style={styles.sectionTitle}>Tipo de Transação</Text>
            <View style={styles.typeContainer}>
              <TouchableOpacity
                style={[
                  styles.typeButton,
                  type === 'expense' && [styles.typeButtonActive, { backgroundColor: COLORS.error }],
                  { borderColor: COLORS.error }
                ]}
                onPress={() => {
                  setType('expense');
                  setSelectedBudget(null);
                }}
              >
                <Ionicons 
                  name="arrow-down" 
                  size={20} 
                  color={type === 'expense' ? COLORS.white : COLORS.error} 
                />
                <Text style={[
                  styles.typeButtonText,
                  { color: type === 'expense' ? COLORS.white : COLORS.error }
                ]}>
                  Despesa
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.typeButton,
                  type === 'income' && [styles.typeButtonActive, { backgroundColor: COLORS.success }],
                  { borderColor: COLORS.success }
                ]}
                onPress={() => {
                  setType('income');
                  setSelectedBudget(null);
                }}
              >
                <Ionicons 
                  name="arrow-up" 
                  size={20} 
                  color={type === 'income' ? COLORS.white : COLORS.success} 
                />
                <Text style={[
                  styles.typeButtonText,
                  { color: type === 'income' ? COLORS.white : COLORS.success }
                ]}>
                  Receita
                </Text>
              </TouchableOpacity>
            </View>
          </Card>

          {/* Informações Principais */}
          <Card style={styles.card}>
            <Text style={styles.sectionTitle}>Informações Principais</Text>
            
            <View style={styles.inputGroup}>
              <Text style={styles.label}>
                Descrição <Text style={styles.required}>*</Text>
              </Text>
              <TextInput
                style={[styles.input, errors.description && styles.inputError]}
                value={description}
                onChangeText={handleDescriptionChange}
                placeholder="Ex: Compra no supermercado"
                placeholderTextColor={COLORS.gray400}
              />
              {errors.description && (
                <Text style={styles.errorText}>{errors.description}</Text>
              )}
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>
                Valor <Text style={styles.required}>*</Text>
              </Text>
              <TextInput
                style={[styles.input, styles.inputAmount, errors.amount && styles.inputError]}
                value={amount}
                onChangeText={handleAmountChange}
                keyboardType="numeric"
                placeholder="R$ 0,00"
                placeholderTextColor={COLORS.gray400}
              />
              {errors.amount && (
                <Text style={styles.errorText}>{errors.amount}</Text>
              )}
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>
                Categoria <Text style={styles.required}>*</Text>
              </Text>
              <TouchableOpacity
                style={[styles.selectButton, errors.category && styles.inputError]}
                onPress={() => setShowCategorySelector(true)}
              >
                {selectedCategory ? (
                  <View style={styles.selectedItem}>
                    <View style={[
                      styles.categoryIcon,
                      { backgroundColor: selectedCategory.color + '20' }
                    ]}>
                      <Text style={styles.categoryEmoji}>{selectedCategory.icon}</Text>
                    </View>
                    <Text style={styles.selectedText}>{selectedCategory.name}</Text>
                  </View>
                ) : (
                  <Text style={styles.placeholder}>Selecione uma categoria</Text>
                )}
                <Ionicons name="chevron-down" size={20} color={COLORS.textSecondary} />
              </TouchableOpacity>
              {errors.category && (
                <Text style={styles.errorText}>{errors.category}</Text>
              )}
            </View>

            {/* USANDO O CALENDARDATEPICKER CUSTOMIZADO */}
            <CalendarDatePicker
              label="Data"
              value={date}
              onDateChange={handleDateChange}
              helperText="Selecione a data da transação"
            />
          </Card>

          {/* Orçamento (se despesa) */}
          {type === 'expense' && selectedCategory && filteredBudgets.length > 0 && (
            <Card style={styles.card}>
              <Text style={styles.sectionTitle}>Orçamento (Opcional)</Text>
              <TouchableOpacity
                style={styles.selectButton}
                onPress={() => setShowBudgetSelector(true)}
              >
                {selectedBudget ? (
                  <View style={styles.selectedBudgetContainer}>
                    <View style={styles.selectedItem}>
                      <Ionicons name="wallet-outline" size={20} color={COLORS.primary} />
                      <Text style={styles.selectedText}>{selectedBudget.name}</Text>
                    </View>
                    <Text style={styles.budgetAmount}>
                      {formatCurrency(selectedBudget.spent)} / {formatCurrency(selectedBudget.monthlyLimit)}
                    </Text>
                  </View>
                ) : (
                  <Text style={styles.placeholder}>Selecione um orçamento</Text>
                )}
                <Ionicons name="chevron-down" size={20} color={COLORS.textSecondary} />
              </TouchableOpacity>
            </Card>
          )}

          {/* Observações */}
          <Card style={styles.card}>
            <Text style={styles.sectionTitle}>Observações (Opcional)</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={notes}
              onChangeText={setNotes}
              placeholder="Adicione observações sobre esta transação..."
              placeholderTextColor={COLORS.gray400}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
          </Card>

          {/* Recorrência */}
          <Card style={styles.card}>
            <View style={styles.switchContainer}>
              <View style={styles.switchInfo}>
                <Text style={styles.switchLabel}>Transação Recorrente</Text>
                <Text style={styles.switchDescription}>
                  Repetir automaticamente todo mês
                </Text>
              </View>
              <TouchableOpacity
                style={[
                  styles.switch,
                  isRecurring && styles.switchActive
                ]}
                onPress={() => setIsRecurring(!isRecurring)}
              >
                <View style={[
                  styles.switchThumb,
                  isRecurring && styles.switchThumbActive
                ]} />
              </TouchableOpacity>
            </View>

            {isRecurring && (
              <TouchableOpacity
                style={styles.recurringDayButton}
                onPress={() => setShowRecurringSelector(true)}
              >
                <View style={styles.recurringDayInfo}>
                  <Ionicons name="repeat" size={20} color={COLORS.primary} />
                  <Text style={styles.recurringDayLabel}>Dia da recorrência</Text>
                </View>
                <View style={styles.recurringDayValue}>
                  <Text style={styles.recurringDayText}>Dia {recurringDay}</Text>
                  <Ionicons name="chevron-forward" size={20} color={COLORS.textSecondary} />
                </View>
              </TouchableOpacity>
            )}
          </Card>

          <View style={{ height: 100 }} />
        </ScrollView>
      </KeyboardAvoidingView>

      <View style={styles.footer}>
        <Button
          title="Salvar Alterações"
          onPress={handleSave}
          disabled={saving}
          loading={saving}
        />
      </View>

      {/* Modals */}
      <Modal
        visible={showCategorySelector}
        transparent
        animationType="slide"
        onRequestClose={() => setShowCategorySelector(false)}
      >
        <View style={styles.modalOverlay}>
          <CategorySelector />
        </View>
      </Modal>

      <Modal
        visible={showBudgetSelector}
        transparent
        animationType="slide"
        onRequestClose={() => setShowBudgetSelector(false)}
      >
        <View style={styles.modalOverlay}>
          <BudgetSelector />
        </View>
      </Modal>

      <Modal
        visible={showRecurringSelector}
        transparent
        animationType="slide"
        onRequestClose={() => setShowRecurringSelector(false)}
      >
        <View style={styles.modalOverlay}>
          <RecurringSelector />
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    backgroundColor: COLORS.white,
    ...SHADOWS.sm,
  },
  headerButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: FONT_SIZES.xl,
    fontFamily: FONTS.bold,
    color: COLORS.textPrimary,
  },
  scrollContent: {
    paddingBottom: SPACING.xl,
  },
  card: {
    margin: SPACING.md,
    marginBottom: 0,
    marginTop: SPACING.md,
  },
  sectionTitle: {
    fontSize: FONT_SIZES.lg,
    fontFamily: FONTS.semibold,
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
    backgroundColor: COLORS.white,
  },
  typeButtonActive: {
    borderWidth: 0,
  },
  typeButtonText: {
    fontSize: FONT_SIZES.md,
    fontFamily: FONTS.semibold,
  },
  inputGroup: {
    marginBottom: SPACING.md,
  },
  label: {
    fontSize: FONT_SIZES.sm,
    fontFamily: FONTS.medium,
    color: COLORS.textSecondary,
    marginBottom: SPACING.xs,
  },
  required: {
    color: COLORS.error,
  },
  input: {
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    fontSize: FONT_SIZES.md,
    fontFamily: FONTS.regular,
    color: COLORS.textPrimary,
  },
  inputAmount: {
    fontSize: FONT_SIZES.xl,
    fontFamily: FONTS.bold,
  },
  inputError: {
    borderColor: COLORS.error,
  },
  errorText: {
    fontSize: FONT_SIZES.xs,
    fontFamily: FONTS.regular,
    color: COLORS.error,
    marginTop: 4,
  },
  textArea: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  selectButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    minHeight: 56,
  },
  selectedItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    flex: 1,
  },
  categoryIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryEmoji: {
    fontSize: 18,
  },
  selectedText: {
    fontSize: FONT_SIZES.md,
    fontFamily: FONTS.medium,
    color: COLORS.textPrimary,
    flex: 1,
  },
  placeholder: {
    fontSize: FONT_SIZES.md,
    fontFamily: FONTS.regular,
    color: COLORS.gray400,
    flex: 1,
  },
  selectedBudgetContainer: {
    flex: 1,
  },
  budgetAmount: {
    fontSize: FONT_SIZES.xs,
    fontFamily: FONTS.regular,
    color: COLORS.textSecondary,
    marginTop: 2,
    marginLeft: 40,
  },
  switchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  switchInfo: {
    flex: 1,
  },
  switchLabel: {
    fontSize: FONT_SIZES.md,
    fontFamily: FONTS.semibold,
    color: COLORS.textPrimary,
    marginBottom: 4,
  },
  switchDescription: {
    fontSize: FONT_SIZES.sm,
    fontFamily: FONTS.regular,
    color: COLORS.textSecondary,
  },
  switch: {
    width: 50,
    height: 28,
    borderRadius: 14,
    backgroundColor: COLORS.gray300,
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
    ...SHADOWS.sm,
  },
  switchThumbActive: {
    transform: [{ translateX: 22 }],
  },
  recurringDayButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.gray50,
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    marginTop: SPACING.md,
  },
  recurringDayInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  recurringDayLabel: {
    fontSize: FONT_SIZES.sm,
    fontFamily: FONTS.medium,
    color: COLORS.textSecondary,
  },
  recurringDayValue: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  recurringDayText: {
    fontSize: FONT_SIZES.md,
    fontFamily: FONTS.semibold,
    color: COLORS.textPrimary,
  },
  footer: {
    padding: SPACING.md,
    backgroundColor: COLORS.white,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    ...SHADOWS.md,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  selectorContainer: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: BORDER_RADIUS.xl,
    borderTopRightRadius: BORDER_RADIUS.xl,
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
    fontFamily: FONTS.bold,
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
    flex: 1,
  },
  categoryIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryName: {
    fontSize: FONT_SIZES.md,
    fontFamily: FONTS.medium,
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
    fontFamily: FONTS.semibold,
    color: COLORS.textPrimary,
    marginBottom: 4,
  },
  budgetDetails: {
    fontSize: FONT_SIZES.sm,
    fontFamily: FONTS.regular,
    color: COLORS.textSecondary,
  },
  recurringContent: {
    padding: SPACING.lg,
  },
  recurringInfo: {
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  recurringDescription: {
    fontSize: FONT_SIZES.sm,
    fontFamily: FONTS.regular,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginTop: SPACING.sm,
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
  recurringOptionButtonOutline: {
    backgroundColor: COLORS.white,
    borderWidth: 2,
    borderColor: COLORS.primary,
  },
  recurringOptionText: {
    fontSize: FONT_SIZES.md,
    fontFamily: FONTS.semibold,
    color: COLORS.white,
  },
  recurringOptionTextOutline: {
    color: COLORS.primary,
  },
  daySelector: {
    marginTop: SPACING.md,
  },
  daySelectorLabel: {
    fontSize: FONT_SIZES.sm,
    fontFamily: FONTS.medium,
    color: COLORS.textSecondary,
    marginBottom: SPACING.md,
  },
  dayGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.xs,
  },
  dayGridItem: {
    width: 45,
    height: 45,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: COLORS.gray50,
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
    fontFamily: FONTS.medium,
    color: COLORS.textPrimary,
  },
  dayGridTextSelected: {
    color: COLORS.white,
    fontFamily: FONTS.bold,
  },
});