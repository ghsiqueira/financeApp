import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Button, Input, Card, Loading, CustomAlert } from '../../components/common';
import { CategoryService } from '../../services/CategoryService';
import { TransactionService } from '../../services/TransactionService';
import { BudgetService } from '../../services/BudgetService';
import { TransactionStackParamList, Category, Budget, CreateTransactionData } from '../../types';
import { COLORS, FONTS, FONT_SIZES, SPACING, BORDER_RADIUS, VALIDATION_RULES } from '../../constants';

type CreateTransactionScreenNavigationProp = NativeStackNavigationProp<
  TransactionStackParamList,
  'CreateTransaction'
>;

interface Props {
  navigation: CreateTransactionScreenNavigationProp;
}

interface FormData {
  description: string;
  amount: string;
  type: 'income' | 'expense';
  category: string;
  date: string;
  isRecurring: boolean;
  recurringDay: string;
  budgetId?: string;
}

interface FormErrors {
  description?: string;
  amount?: string;
  category?: string;
  date?: string;
  recurringDay?: string;
}

export const CreateTransactionScreen: React.FC<Props> = ({ navigation }) => {
  const [loading, setLoading] = useState(false);
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  const [budgetsLoading, setBudgetsLoading] = useState(true);
  const [categories, setCategories] = useState<Category[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [showAlert, setShowAlert] = useState(false);
  const [alertConfig, setAlertConfig] = useState({
    title: '',
    message: '',
    type: 'info' as 'info' | 'success' | 'error' | 'warning',
  });

  const [formData, setFormData] = useState<FormData>({
    description: '',
    amount: '',
    type: 'expense',
    category: '',
    date: new Date().toISOString().split('T')[0],
    isRecurring: false,
    recurringDay: '',
    budgetId: '',
  });

  const [errors, setErrors] = useState<FormErrors>({});

  // Carregar categorias
  useEffect(() => {
    loadCategories();
  }, [formData.type]);

  // Carregar orçamentos
  useEffect(() => {
    if (formData.type === 'expense') {
      loadBudgets();
    } else {
      setBudgets([]);
      setBudgetsLoading(false);
    }
  }, [formData.type]);

  const loadCategories = async () => {
    try {
      setCategoriesLoading(true);
      const response = await CategoryService.getCategories({ type: formData.type });
      setCategories(response.data || []);
    } catch (error: any) {
      console.error('Erro ao carregar categorias:', error);
      showAlertMessage('Erro', 'Não foi possível carregar as categorias', 'error');
    } finally {
      setCategoriesLoading(false);
    }
  };

  const loadBudgets = async () => {
    try {
      setBudgetsLoading(true);
      const currentBudgets = await BudgetService.getCurrentBudgets();
      setBudgets(currentBudgets);
    } catch (error: any) {
      console.error('Erro ao carregar orçamentos:', error);
      setBudgets([]);
    } finally {
      setBudgetsLoading(false);
    }
  };

  const showAlertMessage = (title: string, message: string, type: 'info' | 'success' | 'error' | 'warning' = 'info') => {
    setAlertConfig({ title, message, type });
    setShowAlert(true);
  };

  const handleInputChange = (field: keyof FormData, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Limpar erro do campo quando usuário digitar
    if (errors[field as keyof FormErrors]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }

    // Resetar categoria ao mudar o tipo
    if (field === 'type') {
      setFormData(prev => ({ ...prev, category: '', budgetId: '' }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    // Validar descrição
    if (!formData.description.trim()) {
      newErrors.description = 'Descrição é obrigatória';
    } else if (formData.description.length < 2) {
      newErrors.description = 'Descrição deve ter pelo menos 2 caracteres';
    }

    // Validar valor
    const amount = parseFloat(formData.amount.replace(',', '.'));
    if (!formData.amount.trim()) {
      newErrors.amount = 'Valor é obrigatório';
    } else if (isNaN(amount) || amount <= 0) {
      newErrors.amount = 'Digite um valor válido maior que zero';
    } else if (amount > VALIDATION_RULES.amount.max) {
      newErrors.amount = `Valor máximo é ${VALIDATION_RULES.amount.max.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}`;
    }

    // Validar categoria
    if (!formData.category) {
      newErrors.category = 'Selecione uma categoria';
    }

    // Validar data
    if (!formData.date) {
      newErrors.date = 'Data é obrigatória';
    } else {
      const selectedDate = new Date(formData.date);
      const today = new Date();
      const maxDate = new Date();
      maxDate.setFullYear(today.getFullYear() + 1);
      
      if (selectedDate > maxDate) {
        newErrors.date = 'Data não pode ser superior a 1 ano no futuro';
      }
    }

    // Validar dia recorrente
    if (formData.isRecurring) {
      const recurringDay = parseInt(formData.recurringDay);
      if (!formData.recurringDay.trim()) {
        newErrors.recurringDay = 'Dia recorrente é obrigatório';
      } else if (isNaN(recurringDay) || recurringDay < 1 || recurringDay > 31) {
        newErrors.recurringDay = 'Dia deve estar entre 1 e 31';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      showAlertMessage('Dados inválidos', 'Por favor, corrija os erros antes de continuar', 'error');
      return;
    }

    try {
      setLoading(true);

      const transactionData: CreateTransactionData = {
        description: formData.description.trim(),
        amount: parseFloat(formData.amount.replace(',', '.')),
        type: formData.type,
        category: formData.category,
        date: formData.date,
        isRecurring: formData.isRecurring,
        ...(formData.isRecurring && { recurringDay: parseInt(formData.recurringDay) }),
        ...(formData.budgetId && { budgetId: formData.budgetId }),
      };

      // Verificar duplicatas se necessário
      const duplicates = await TransactionService.checkDuplicates(transactionData);
      
      if (duplicates.length > 0) {
        showAlertMessage(
          'Possível duplicata',
          `Encontramos ${duplicates.length} transação(ões) similar(es). Deseja continuar mesmo assim?`,
          'warning'
        );
        return;
      }

      await TransactionService.createTransaction(transactionData);
      
      showAlertMessage(
        'Sucesso!',
        'Transação criada com sucesso',
        'success'
      );
      
      // Voltar para a lista após um breve delay
      setTimeout(() => {
        navigation.goBack();
      }, 1500);

    } catch (error: any) {
      console.error('Erro ao criar transação:', error);
      showAlertMessage(
        'Erro',
        error.message || 'Não foi possível criar a transação',
        'error'
      );
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value: string): string => {
    const numericValue = value.replace(/\D/g, '');
    const floatValue = parseInt(numericValue) / 100;
    return floatValue.toLocaleString('pt-BR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  const handleAmountChange = (value: string) => {
    const formatted = formatCurrency(value);
    handleInputChange('amount', formatted);
  };

  const renderTypeSelector = () => (
    <Card style={styles.typeSelector}>
      <Text style={styles.sectionTitle}>Tipo de Transação</Text>
      <View style={styles.typeButtons}>
        <TouchableOpacity
          style={[
            styles.typeButton,
            formData.type === 'expense' && styles.typeButtonActive,
            { borderColor: COLORS.error, backgroundColor: formData.type === 'expense' ? COLORS.error : 'transparent' }
          ]}
          onPress={() => handleInputChange('type', 'expense')}
        >
          <Ionicons 
            name="arrow-down" 
            size={20} 
            color={formData.type === 'expense' ? COLORS.white : COLORS.error} 
          />
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
            { borderColor: COLORS.success, backgroundColor: formData.type === 'income' ? COLORS.success : 'transparent' }
          ]}
          onPress={() => handleInputChange('type', 'income')}
        >
          <Ionicons 
            name="arrow-up" 
            size={20} 
            color={formData.type === 'income' ? COLORS.white : COLORS.success} 
          />
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
    <Card>
      <Text style={styles.sectionTitle}>Categoria</Text>
      {categoriesLoading ? (
        <View style={styles.loadingContainer}>
          <Loading size="small" text="Carregando categorias..." />
        </View>
      ) : categories.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>Nenhuma categoria encontrada</Text>
          <Button
            title="Criar Categoria"
            variant="outline"
            size="sm"
            onPress={() => navigation.navigate('Categories' as any)}
          />
        </View>
      ) : (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryScroll}>
          {categories.map(category => (
            <TouchableOpacity
              key={category._id}
              style={[
                styles.categoryItem,
                formData.category === category._id && styles.categoryItemActive,
                { borderColor: category.color }
              ]}
              onPress={() => handleInputChange('category', category._id)}
            >
              <Text style={styles.categoryIcon}>{category.icon}</Text>
              <Text style={[
                styles.categoryName,
                formData.category === category._id && { color: category.color }
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
    if (formData.type === 'income' || budgets.length === 0) return null;

    return (
      <Card>
        <Text style={styles.sectionTitle}>Orçamento (Opcional)</Text>
        {budgetsLoading ? (
          <View style={styles.loadingContainer}>
            <Loading size="small" text="Carregando orçamentos..." />
          </View>
        ) : (
          <View style={styles.budgetList}>
            <TouchableOpacity
              style={[
                styles.budgetItem,
                !formData.budgetId && styles.budgetItemActive
              ]}
              onPress={() => handleInputChange('budgetId', '')}
            >
              <Text style={styles.budgetName}>Nenhum orçamento</Text>
            </TouchableOpacity>
            
            {budgets.map(budget => (
              <TouchableOpacity
                key={budget._id}
                style={[
                  styles.budgetItem,
                  formData.budgetId === budget._id && styles.budgetItemActive
                ]}
                onPress={() => handleInputChange('budgetId', budget._id)}
              >
                <View style={styles.budgetInfo}>
                  <Text style={styles.budgetName}>{budget.name}</Text>
                  <Text style={styles.budgetUsage}>
                    {budget.usage?.toFixed(1)}% usado
                  </Text>
                </View>
                <View style={styles.budgetProgress}>
                  <View style={[
                    styles.budgetProgressFill,
                    { 
                      width: `${Math.min(budget.usage || 0, 100)}%`,
                      backgroundColor: budget.isOverBudget ? COLORS.error : COLORS.primary
                    }
                  ]} />
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </Card>
    );
  };

  const renderRecurringOptions = () => (
    <Card>
      <View style={styles.recurringHeader}>
        <Text style={styles.sectionTitle}>Transação Recorrente</Text>
        <Switch
          value={formData.isRecurring}
          onValueChange={(value) => handleInputChange('isRecurring', value)}
          trackColor={{ false: COLORS.gray300, true: COLORS.primary20 }}
          thumbColor={formData.isRecurring ? COLORS.primary : COLORS.gray400}
        />
      </View>
      
      {formData.isRecurring && (
        <Input
          label="Dia do mês para repetir"
          placeholder="Ex: 15"
          value={formData.recurringDay}
          onChangeText={(value) => handleInputChange('recurringDay', value)}
          keyboardType="numeric"
          error={errors.recurringDay}
          maxLength={2}
        />
      )}
    </Card>
  );

  if (categoriesLoading && categories.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <Loading text="Carregando formulário..." />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Seletor de tipo */}
        {renderTypeSelector()}

        {/* Campos básicos */}
        <Card>
          <Input
            label="Descrição"
            placeholder="Ex: Almoço no restaurante"
            value={formData.description}
            onChangeText={(value) => handleInputChange('description', value)}
            error={errors.description}
            required
            maxLength={100}
          />

          <Input
            label="Valor"
            placeholder="0,00"
            value={formData.amount}
            onChangeText={handleAmountChange}
            keyboardType="numeric"
            error={errors.amount}
            required
            leftIcon="cash-outline"
          />

          <Input
            label="Data"
            value={formData.date}
            onChangeText={(value) => handleInputChange('date', value)}
            error={errors.date}
            required
            rightIcon="calendar-outline"
          />
        </Card>

        {/* Seletor de categoria */}
        {renderCategorySelector()}

        {/* Seletor de orçamento */}
        {renderBudgetSelector()}

        {/* Opções de recorrência */}
        {renderRecurringOptions()}

        {/* Botão de salvar */}
        <View style={styles.buttonContainer}>
          <Button
            title="Criar Transação"
            onPress={handleSubmit}
            loading={loading}
            fullWidth
          />
        </View>

        {/* Espaçamento final */}
        <View style={styles.bottomSpacing} />
      </ScrollView>

      {/* Alert customizado */}
      <CustomAlert
        visible={showAlert}
        title={alertConfig.title}
        message={alertConfig.message}
        type={alertConfig.type}
        onConfirm={() => setShowAlert(false)}
      />
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
    paddingHorizontal: SPACING.md,
  },
  typeSelector: {
    marginTop: SPACING.md,
  },
  sectionTitle: {
    fontSize: FONT_SIZES.md,
    fontFamily: FONTS.bold,
    color: COLORS.textPrimary,
    marginBottom: SPACING.sm,
  },
  typeButtons: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  typeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.sm,
    borderWidth: 2,
    borderRadius: BORDER_RADIUS.md,
    gap: SPACING.xs,
  },
  typeButtonActive: {
    // Styles aplicados via backgroundColor dinâmico
  },
  typeButtonText: {
    fontSize: FONT_SIZES.md,
    fontFamily: FONTS.medium,
  },
  loadingContainer: {
    paddingVertical: SPACING.lg,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: SPACING.lg,
    gap: SPACING.sm,
  },
  emptyText: {
    fontSize: FONT_SIZES.sm,
    fontFamily: FONTS.regular,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  categoryScroll: {
    marginBottom: SPACING.xs,
  },
  categoryItem: {
    alignItems: 'center',
    padding: SPACING.sm,
    marginRight: SPACING.sm,
    borderWidth: 2,
    borderColor: COLORS.border,
    borderRadius: BORDER_RADIUS.md,
    minWidth: 80,
  },
  categoryItemActive: {
    backgroundColor: COLORS.primary10,
  },
  categoryIcon: {
    fontSize: 24,
    marginBottom: SPACING.xs,
  },
  categoryName: {
    fontSize: FONT_SIZES.xs,
    fontFamily: FONTS.medium,
    color: COLORS.textPrimary,
    textAlign: 'center',
  },
  budgetList: {
    gap: SPACING.xs,
  },
  budgetItem: {
    padding: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: BORDER_RADIUS.sm,
  },
  budgetItemActive: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primary10,
  },
  budgetInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.xs,
  },
  budgetName: {
    fontSize: FONT_SIZES.sm,
    fontFamily: FONTS.medium,
    color: COLORS.textPrimary,
  },
  budgetUsage: {
    fontSize: FONT_SIZES.xs,
    fontFamily: FONTS.regular,
    color: COLORS.textSecondary,
  },
  budgetProgress: {
    height: 4,
    backgroundColor: COLORS.gray200,
    borderRadius: BORDER_RADIUS.full,
    overflow: 'hidden',
  },
  budgetProgressFill: {
    height: '100%',
  },
  recurringHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  buttonContainer: {
    paddingVertical: SPACING.lg,
  },
  bottomSpacing: {
    height: SPACING.xl,
  },
  errorText: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.error,
    marginTop: SPACING.xs,
    fontFamily: FONTS.regular,
  },
});
