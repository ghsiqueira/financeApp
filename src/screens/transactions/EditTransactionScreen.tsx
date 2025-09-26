// src/screens/transactions/EditTransactionScreen.tsx - CÓDIGO COMPLETO FINAL
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { CalendarDatePicker } from '../../components/common/Calendar';

import { TransactionStackParamList } from '../../navigation/TransactionNavigator';
import { TransactionService, UpdateTransactionData } from '../../services/TransactionService';
import { CategoryService } from '../../services/CategoryService';
import { BudgetService } from '../../services/BudgetService';
import { Transaction, Category, Budget, TransactionType } from '../../types';
import { parseCurrency, formatCurrency } from '../../utils';
import { Card } from '../../components/common';

type EditTransactionNavigationProp = StackNavigationProp<TransactionStackParamList, 'EditTransaction'>;
type EditTransactionRouteProp = RouteProp<TransactionStackParamList, 'EditTransaction'>;

interface Props {
  navigation: EditTransactionNavigationProp;
  route: EditTransactionRouteProp;
}

export const EditTransactionScreen: React.FC<Props> = ({ navigation, route }) => {
  const { transactionId } = route.params;
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [transaction, setTransaction] = useState<Transaction | null>(null);
  
  // Form data
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('R$ 0,00');
  const [type, setType] = useState<TransactionType>('expense');
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [selectedBudget, setSelectedBudget] = useState<Budget | null>(null);
  const [date, setDate] = useState(new Date());
  const [notes, setNotes] = useState('');
  const [isRecurring, setIsRecurring] = useState(false);
  const [recurringDay, setRecurringDay] = useState<number | undefined>(undefined);
  
  // UI states
  const [categories, setCategories] = useState<Category[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [showRecurringSelector, setShowRecurringSelector] = useState(false);
  const [showCategorySelector, setShowCategorySelector] = useState(false);
  const [showBudgetSelector, setShowBudgetSelector] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (isRecurring && !recurringDay) {
      setRecurringDay(date.getDate());
    } else if (!isRecurring) {
      setRecurringDay(undefined);
    }
  }, [isRecurring, date]);

  const loadData = async () => {
    try {
      await Promise.all([
        loadTransaction(),
        loadCategories(),
        loadBudgets(),
      ]);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    }
  };

  const loadTransaction = async () => {
    try {
      const response = await TransactionService.getTransaction(transactionId);
      
      if (response.success && response.data) {
        const txn = response.data;
        setTransaction(txn);
        
        // Preencher form
        setDescription(txn.description || '');
        setAmount(formatCurrency(txn.amount || 0));
        setType(txn.type || 'expense');
        
        // Categoria
        if (txn.category) {
          if (typeof txn.category === 'string') {
            // Se categoria é string, criar objeto básico temporário
            setSelectedCategory({
              _id: txn.category,
              id: txn.category,
              name: 'Categoria',
              icon: 'wallet-outline',
              color: '#4CAF50',
              type: txn.type || 'expense',
              isDefault: false,
              createdAt: new Date().toISOString()
            });
          } else {
            setSelectedCategory(txn.category);
          }
        }
        
        // Budget
        if (txn.budgetId && typeof txn.budgetId === 'object') {
          setSelectedBudget(txn.budgetId);
        }
        
        setDate(new Date(txn.date));
        setNotes(txn.notes || '');
        setIsRecurring(txn.isRecurring || false);
        setRecurringDay(txn.recurringDay);
        
      } else {
        Alert.alert('Erro', 'Transação não encontrada');
        navigation.goBack();
      }
    } catch (error: any) {
      console.error('Erro ao carregar transação:', error);
      Alert.alert('Erro', error.message || 'Erro ao carregar transação');
      navigation.goBack();
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
        setBudgets(response.data.filter(b => b.isActive));
      }
    } catch (error) {
      console.error('Erro ao carregar orçamentos:', error);
    } finally {
      setLoading(false);
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
  };

  const handleDateChange = (selectedDate: Date) => {
    setDate(selectedDate);
    if (isRecurring) {
      setRecurringDay(selectedDate.getDate());
    }
  };

  const validateForm = (): boolean => {
    if (!description.trim()) {
      Alert.alert('Erro', 'Digite uma descrição para a transação');
      return false;
    }

    const amountValue = parseCurrency(amount);
    if (amountValue <= 0) {
      Alert.alert('Erro', 'Digite um valor válido');
      return false;
    }

    if (!selectedCategory) {
      Alert.alert('Erro', 'Selecione uma categoria');
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

  // Filtrar categorias e orçamentos por tipo
  const filteredCategories = categories.filter(cat => cat.type === type);
  const filteredBudgets = budgets.filter(budget => {
    if (type !== 'expense') return false;
    if (!budget.category) return false;
    
    const categoryId = typeof budget.category === 'string' 
      ? budget.category 
      : budget.category._id || budget.category.id;
    const selectedCategoryId = selectedCategory?._id || selectedCategory?.id;
    
    return categoryId === selectedCategoryId;
  });

  const CategorySelector = () => (
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
            key={category._id || category.id}
            style={[
              styles.categoryItem,
              selectedCategory?._id === category._id && styles.selectedCategoryItem
            ]}
            onPress={() => {
              setSelectedCategory(category);
              setShowCategorySelector(false);
              // Reset budget quando trocar categoria
              if (selectedBudget && type === 'expense') {
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
                <Ionicons 
                  name={category.icon as any}
                  size={16} 
                  color={category.color}
                />
              </View>
              <Text style={styles.categoryName}>{category.name}</Text>
            </View>
            {selectedCategory?._id === category._id && (
              <Ionicons name="checkmark" size={20} color="#4CAF50" />
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
          <Ionicons name="close" size={24} color="#666" />
        </TouchableOpacity>
      </View>
      
      <View style={styles.recurringContent}>
        <Text style={styles.recurringDescription}>
          A transação será automaticamente criada todos os meses no dia especificado
        </Text>

        <View style={styles.recurringOption}>
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
            style={styles.recurringOptionButton}
            onPress={() => {
              setRecurringDay(date.getDate());
              setShowRecurringSelector(false);
            }}
          >
            <Text style={styles.recurringOptionText}>Repetir todo dia {date.getDate()}</Text>
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
          <Ionicons name="close" size={24} color="#666" />
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
          <Text style={styles.budgetName}>Sem orçamento</Text>
          {!selectedBudget && (
            <Ionicons name="checkmark" size={20} color="#4CAF50" />
          )}
        </TouchableOpacity>
        
        {filteredBudgets.map((budget) => (
          <TouchableOpacity
            key={budget._id || budget.id}
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
              <Text style={styles.budgetDetails}>
                {formatCurrency(budget.spent || 0)} / {formatCurrency(budget.monthlyLimit)}
              </Text>
            </View>
            {selectedBudget?._id === budget._id && (
              <Ionicons name="checkmark" size={20} color="#4CAF50" />
            )}
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4CAF50" />
          <Text style={styles.loadingText}>Carregando transação...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Editar Transação</Text>
        <TouchableOpacity 
          onPress={handleSave}
          disabled={saving}
          style={[styles.saveButton, saving && styles.saveButtonDisabled]}
        >
          {saving ? (
            <ActivityIndicator size="small" color="#FFF" />
          ) : (
            <Text style={styles.saveButtonText}>Salvar</Text>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Tipo de Transação */}
        <Card style={styles.typeCard}>
          <Text style={styles.sectionTitle}>Tipo</Text>
          <View style={styles.typeSelector}>
            <TouchableOpacity
              style={[
                styles.typeButton,
                type === 'income' && styles.incomeTypeButton,
              ]}
              onPress={() => {
                setType('income');
                setSelectedCategory(null);
                setSelectedBudget(null);
              }}
            >
              <Ionicons name="trending-up" size={20} color={type === 'income' ? '#FFF' : '#4CAF50'} />
              <Text style={[
                styles.typeButtonText,
                type === 'income' && styles.selectedTypeButtonText,
              ]}>
                Receita
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[
                styles.typeButton,
                type === 'expense' && styles.expenseTypeButton,
              ]}
              onPress={() => {
                setType('expense');
                setSelectedCategory(null);
                setSelectedBudget(null);
              }}
            >
              <Ionicons name="trending-down" size={20} color={type === 'expense' ? '#FFF' : '#F44336'} />
              <Text style={[
                styles.typeButtonText,
                type === 'expense' && styles.selectedTypeButtonText,
              ]}>
                Despesa
              </Text>
            </TouchableOpacity>
          </View>
        </Card>

        {/* Informações Básicas */}
        <Card style={styles.formCard}>
          <Text style={styles.sectionTitle}>Informações</Text>
          
          {/* Descrição */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Descrição</Text>
            <TextInput
              style={styles.textInput}
              value={description}
              onChangeText={setDescription}
              placeholder="Ex: Almoço, Salário, etc."
              placeholderTextColor="#999"
            />
          </View>

          {/* Valor */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Valor</Text>
            <TextInput
              style={[styles.textInput, styles.amountInput]}
              value={amount}
              onChangeText={handleAmountChange}
              keyboardType="numeric"
              placeholder="R$ 0,00"
              placeholderTextColor="#999"
            />
          </View>

          {/* Categoria */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Categoria</Text>
            <TouchableOpacity
              style={styles.selectButton}
              onPress={() => setShowCategorySelector(true)}
            >
              <View style={styles.selectButtonContent}>
                {selectedCategory ? (
                  <View style={styles.selectedCategoryDisplay}>
                    <View style={[
                      styles.categoryIconContainer,
                      { backgroundColor: selectedCategory.color + '20' }
                    ]}>
                      <Ionicons 
                        name={selectedCategory.icon as any}
                        size={16} 
                        color={selectedCategory.color}
                      />
                    </View>
                    <Text style={styles.selectedItemText}>{selectedCategory.name}</Text>
                  </View>
                ) : (
                  <Text style={styles.selectButtonPlaceholder}>Selecionar categoria</Text>
                )}
                <Ionicons name="chevron-down" size={24} color="#666" />
              </View>
            </TouchableOpacity>
          </View>

          {/* Orçamento - Só para despesas */}
          {type === 'expense' && selectedCategory && filteredBudgets.length > 0 && (
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Orçamento (Opcional)</Text>
              <TouchableOpacity
                style={styles.selectButton}
                onPress={() => setShowBudgetSelector(true)}
              >
                <View style={styles.selectButtonContent}>
                  {selectedBudget ? (
                    <View style={styles.selectedBudgetDisplay}>
                      <Text style={styles.selectedItemText}>{selectedBudget.name}</Text>
                      <Text style={styles.budgetSubtext}>
                        {formatCurrency(selectedBudget.spent || 0)} / {formatCurrency(selectedBudget.monthlyLimit)}
                      </Text>
                    </View>
                  ) : (
                    <Text style={styles.selectButtonPlaceholder}>Selecionar orçamento</Text>
                  )}
                  <Ionicons name="chevron-down" size={24} color="#666" />
                </View>
              </TouchableOpacity>
            </View>
          )}

          {/* Data */}
          <View style={styles.inputGroup}>
            <CalendarDatePicker
              label="Data"
              value={date}
              onDateChange={handleDateChange}
              helperText={isRecurring ? `Será repetida todo dia ${recurringDay} do mês` : undefined}
            />
          </View>

          {/* Notas */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Notas (Opcional)</Text>
            <TextInput
              style={[styles.textInput, styles.notesInput]}
              value={notes}
              onChangeText={setNotes}
              placeholder="Informações adicionais..."
              placeholderTextColor="#999"
              multiline
              numberOfLines={3}
            />
          </View>
        </Card>

        {/* Configurações Avançadas */}
        <Card style={styles.formCard}>
          <Text style={styles.sectionTitle}>Configurações</Text>
          
          {/* Recorrência */}
          <TouchableOpacity
            style={styles.switchRow}
            onPress={() => setIsRecurring(!isRecurring)}
          >
            <View style={styles.switchInfo}>
              <Text style={styles.switchLabel}>Transação Recorrente</Text>
              <Text style={styles.switchDescription}>
                A transação será automaticamente criada todos os meses no dia especificado
              </Text>
            </View>
            <View style={[
              styles.switchButton,
              isRecurring && styles.switchButtonActive
            ]}>
              <View style={[
                styles.switchThumb,
                isRecurring && styles.switchThumbActive
              ]} />
            </View>
          </TouchableOpacity>

          {isRecurring && (
            <View style={styles.recurringConfig}>
              <Text style={styles.recurringDayLabel}>Repetir todo dia</Text>
              
              <View style={styles.recurringDaySelector}>
                <TouchableOpacity 
                  style={styles.recurringControlButton}
                  onPress={() => setRecurringDay(Math.max(1, (recurringDay || 1) - 1))}
                >
                  <Ionicons name="chevron-back" size={20} color="#4CAF50" />
                </TouchableOpacity>
                
                <View style={styles.recurringDayCircle}>
                  <Text style={styles.recurringDayNumber}>{recurringDay}</Text>
                </View>
                
                <TouchableOpacity 
                  style={styles.recurringControlButton}
                  onPress={() => setRecurringDay(Math.min(28, (recurringDay || 1) + 1))}
                >
                  <Ionicons name="chevron-forward" size={20} color="#4CAF50" />
                </TouchableOpacity>
              </View>
              
              <View style={styles.recurringNote}>
                <Ionicons name="information-circle-outline" size={16} color="#666" />
                <Text style={styles.recurringNoteText}>
                  Será repetida automaticamente todo dia {recurringDay} do mês
                </Text>
              </View>
            </View>
          )}
        </Card>
      </ScrollView>

      {/* Category Selector Modal */}
      {showCategorySelector && <CategorySelector />}

      {/* Budget Selector Modal */}
      {showBudgetSelector && <BudgetSelector />}

      {/* Recurring Selector Modal */}
      {showRecurringSelector && <RecurringSelector />}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 16,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  saveButton: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    minWidth: 80,
    alignItems: 'center',
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  typeCard: {
    marginBottom: 16,
  },
  formCard: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 16,
  },
  typeSelector: {
    flexDirection: 'row',
    gap: 12,
  },
  typeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  incomeTypeButton: {
    backgroundColor: '#4CAF50',
    borderColor: '#4CAF50',
  },
  expenseTypeButton: {
    backgroundColor: '#F44336',
    borderColor: '#F44336',
  },
  typeButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
  },
  selectedTypeButtonText: {
    color: '#FFF',
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 6,
    color: '#333',
  },
  textInput: {
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#333',
  },
  amountInput: {
    fontWeight: '600',
    fontSize: 18,
  },
  notesInput: {
    height: 80,
    textAlignVertical: 'top',
  },
  selectButton: {
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  selectButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  selectButtonPlaceholder: {
    fontSize: 16,
    color: '#999',
  },
  selectedCategoryDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  selectedBudgetDisplay: {
    flex: 1,
  },
  selectedItemText: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
  },
  budgetSubtext: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  categoryIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  switchInfo: {
    flex: 1,
  },
  switchLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
  },
  switchDescription: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  switchButton: {
    width: 50,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#E0E0E0',
    justifyContent: 'center',
    paddingHorizontal: 2,
  },
  switchButtonActive: {
    backgroundColor: '#4CAF50',
  },
  switchThumb: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#FFF',
    alignSelf: 'flex-start',
  },
  switchThumbActive: {
    alignSelf: 'flex-end',
  },
  recurringConfig: {
    marginTop: 16,
    alignItems: 'center',
  },
  recurringDayLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
    marginBottom: 16,
  },
  recurringDaySelector: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginBottom: 16,
  },
  recurringControlButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#4CAF50' + '20',
    alignItems: 'center',
    justifyContent: 'center',
  },
  recurringDayCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#4CAF50',
    alignItems: 'center',
    justifyContent: 'center',
  },
  recurringDayNumber: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFF',
  },
  recurringNote: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    backgroundColor: '#F0F8FF',
    borderRadius: 8,
  },
  recurringNoteText: {
    fontSize: 12,
    color: '#666',
    flex: 1,
  },
  // Selector Modals
  selectorContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  selectorHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#FFF',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
  },
  selectorTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  selectorList: {
    backgroundColor: '#FFF',
    maxHeight: '70%',
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  categoryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  selectedCategoryItem: {
    backgroundColor: '#F0F8FF',
    marginHorizontal: -20,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  categoryInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  categoryName: {
    fontSize: 16,
    color: '#333',
  },
  budgetItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  selectedBudgetItem: {
    backgroundColor: '#F0F8FF',
    marginHorizontal: -20,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  budgetInfo: {
    flex: 1,
  },
  budgetName: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
  },
  budgetDetails: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  // Recurring Selector Modal
  recurringContent: {
    padding: 20,
  },
  recurringDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 20,
    lineHeight: 20,
  },
  recurringOption: {
    marginBottom: 24,
  },
  recurringOptionButton: {
    padding: 16,
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    marginBottom: 8,
  },
  recurringOptionText: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
  },
  daySelector: {
    marginTop: 16,
  },
  daySelectorLabel: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
    marginBottom: 12,
  },
  dayGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  dayGridItem: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F8F9FA',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  dayGridItemSelected: {
    backgroundColor: '#4CAF50',
  },
  dayGridText: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
  dayGridTextSelected: {
    color: '#FFF',
  },
});

export default EditTransactionScreen;
