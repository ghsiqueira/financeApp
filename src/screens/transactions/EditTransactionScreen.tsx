// src/screens/transactions/EditTransactionScreen.tsx
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  StyleSheet,
  Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';

import { TransactionService } from '../../services/TransactionService';
import { CategoryService } from '../../services/CategoryService';
import { BudgetService } from '../../services/BudgetService';
import { Transaction, Category, Budget, TransactionType, UpdateTransactionData } from '../../types';
import { formatCurrency, parseCurrency } from '../../utils';
import { Loading, Card } from '../../components/common';
import { COLORS, FONTS, FONT_SIZES, SPACING, BORDER_RADIUS, SHADOWS } from '../../constants';

type TransactionStackParamList = {
  EditTransaction: { transactionId: string };
};

interface EditTransactionScreenProps {
  navigation: NativeStackNavigationProp<TransactionStackParamList>;
  route: RouteProp<TransactionStackParamList, 'EditTransaction'>;
}

export const EditTransactionScreen: React.FC<EditTransactionScreenProps> = ({ 
  navigation, 
  route 
}) => {
  const { transactionId } = route.params;
  
  // Estados da transação
  const [transaction, setTransaction] = useState<Transaction | null>(null);
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [type, setType] = useState<TransactionType>('expense');
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [selectedBudget, setSelectedBudget] = useState<Budget | null>(null);
  const [date, setDate] = useState(new Date());
  const [notes, setNotes] = useState('');
  const [isRecurring, setIsRecurring] = useState(false);

  // Estados de carregamento e dados
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([]);

  useEffect(() => {
    loadTransactionData();
    loadCategories();
    loadBudgets();
  }, [transactionId]);

  const loadTransactionData = async () => {
    try {
      // ✅ ADICIONAR VERIFICAÇÃO DE SEGURANÇA
      if (!transactionId || transactionId === 'undefined') {
        Alert.alert('Erro', 'ID da transação inválido');
        navigation.goBack();
        return;
      }

      const response = await TransactionService.getTransaction(transactionId);
      
      if (response.success && response.data) {
        const txn = response.data;
        setTransaction(txn);
        setDescription(txn.description);
        setAmount(formatCurrency(txn.amount));
        setType(txn.type);
        setSelectedCategory(txn.category || null);
        setSelectedBudget(typeof txn.budgetId === 'object' ? txn.budgetId : null);
        setDate(new Date(txn.date));
        setNotes(txn.notes || '');
        setIsRecurring(txn.isRecurring || false);
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
        setCategories(response.data);
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
        budgetId: selectedBudget ? (selectedBudget._id || selectedBudget.id) : undefined, // ✅ CORRIGIDO - evita null
        date: date.toISOString(),
        notes: notes.trim() || undefined,
        isRecurring,
      };

      const response = await TransactionService.updateTransaction(transactionId, updateData);

      if (response.success) {
        Alert.alert('Sucesso', 'Transação atualizada com sucesso!', [
          { text: 'OK', onPress: () => navigation.goBack() }
        ]);
      } else {
        Alert.alert('Erro', response.message || 'Erro ao atualizar transação');
      }
    } catch (error: any) {
      Alert.alert('Erro', error.message || 'Erro ao atualizar transação');
    } finally {
      setSaving(false);
    }
  };

  const renderTypeSelector = () => (
    <Card style={styles.card}>
      <Text style={styles.cardTitle}>Tipo de Transação</Text>
      <View style={styles.typeContainer}>
        <TouchableOpacity
          style={[
            styles.typeButton,
            type === 'expense' && styles.typeButtonActive,
            { borderColor: COLORS.error }
          ]}
          onPress={() => setType('expense')}
        >
          <Ionicons 
            name="arrow-down" 
            size={24} 
            color={type === 'expense' ? COLORS.white : COLORS.error} 
          />
          <Text style={[
            styles.typeButtonText,
            type === 'expense' && styles.typeButtonTextActive
          ]}>
            Despesa
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.typeButton,
            type === 'income' && styles.typeButtonActive,
            { borderColor: COLORS.success }
          ]}
          onPress={() => setType('income')}
        >
          <Ionicons 
            name="arrow-up" 
            size={24} 
            color={type === 'income' ? COLORS.white : COLORS.success} 
          />
          <Text style={[
            styles.typeButtonText,
            type === 'income' && styles.typeButtonTextActive
          ]}>
            Receita
          </Text>
        </TouchableOpacity>
      </View>
    </Card>
  );

  const renderCategorySelector = () => (
    <Card style={styles.card}>
      <Text style={styles.cardTitle}>Categoria</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View style={styles.categoryContainer}>
          {categories
            .filter(cat => cat.type === type)
            .map((category) => (
              <TouchableOpacity
                key={category._id}
                style={[
                  styles.categoryButton,
                  selectedCategory?._id === category._id && styles.categoryButtonActive
                ]}
                onPress={() => setSelectedCategory(category)}
              >
                <Text style={styles.categoryIcon}>{category.icon}</Text>
                <Text style={[
                  styles.categoryText,
                  selectedCategory?._id === category._id && styles.categoryTextActive
                ]}>
                  {category.name}
                </Text>
              </TouchableOpacity>
            ))}
        </View>
      </ScrollView>
    </Card>
  );

  const renderBudgetSelector = () => {
    if (type === 'income') return null;

    return (
      <Card style={styles.card}>
        <Text style={styles.cardTitle}>Orçamento (Opcional)</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={styles.budgetContainer}>
            <TouchableOpacity
              style={[
                styles.budgetButton,
                !selectedBudget && styles.budgetButtonActive
              ]}
              onPress={() => setSelectedBudget(null)}
            >
              <Ionicons name="close" size={20} color={COLORS.gray600} />
              <Text style={styles.budgetText}>Nenhum</Text>
            </TouchableOpacity>

            {budgets.map((budget) => (
              <TouchableOpacity
                key={budget._id}
                style={[
                  styles.budgetButton,
                  selectedBudget?._id === budget._id && styles.budgetButtonActive
                ]}
                onPress={() => setSelectedBudget(budget)}
              >
                <Ionicons name="wallet" size={20} color={COLORS.primary} />
                <Text style={[
                  styles.budgetText,
                  selectedBudget?._id === budget._id && styles.budgetTextActive
                ]}>
                  {budget.name}
                </Text>
                <Text style={styles.budgetSubtext}>
                  {formatCurrency(budget.spent)} / {formatCurrency(budget.monthlyLimit)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      </Card>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <Loading />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={COLORS.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Editar Transação</Text>
        <TouchableOpacity onPress={handleSave} disabled={saving}>
          {saving ? (
            <Loading size="small" color={COLORS.white} />
          ) : (
            <Ionicons name="checkmark" size={24} color={COLORS.white} />
          )}
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Seletor de Tipo */}
        {renderTypeSelector()}

        {/* Valor */}
        <Card style={styles.card}>
          <Text style={styles.cardTitle}>Valor</Text>
          <TextInput
            style={[styles.input, styles.amountInput]}
            value={amount}
            onChangeText={handleAmountChange}
            placeholder="R$ 0,00"
            keyboardType="numeric"
            placeholderTextColor={COLORS.gray400}
          />
        </Card>

        {/* Descrição */}
        <Card style={styles.card}>
          <Text style={styles.cardTitle}>Descrição</Text>
          <TextInput
            style={styles.input}
            value={description}
            onChangeText={setDescription}
            placeholder="Digite uma descrição"
            placeholderTextColor={COLORS.gray400}
            maxLength={100}
          />
        </Card>

        {/* Categoria */}
        {renderCategorySelector()}

        {/* Orçamento */}
        {renderBudgetSelector()}

        {/* Data */}
        <Card style={styles.card}>
          <Text style={styles.cardTitle}>Data</Text>
          <TouchableOpacity style={styles.dateButton}>
            <Ionicons name="calendar-outline" size={20} color={COLORS.primary} />
            <Text style={styles.dateText}>
              {date.toLocaleDateString('pt-BR')}
            </Text>
          </TouchableOpacity>
        </Card>

        {/* Observações */}
        <Card style={styles.card}>
          <Text style={styles.cardTitle}>Observações (Opcional)</Text>
          <TextInput
            style={[styles.input, styles.notesInput]}
            value={notes}
            onChangeText={setNotes}
            placeholder="Adicione observações..."
            placeholderTextColor={COLORS.gray400}
            multiline
            numberOfLines={3}
            maxLength={500}
          />
        </Card>

        {/* Recorrência */}
        <Card style={styles.card}>
          <View style={styles.switchContainer}>
            <View style={styles.switchInfo}>
              <Text style={styles.cardTitle}>Transação Recorrente</Text>
              <Text style={styles.switchDescription}>
                Esta transação se repete mensalmente
              </Text>
            </View>
            <Switch
              value={isRecurring}
              onValueChange={setIsRecurring}
              trackColor={{ false: COLORS.gray300, true: COLORS.primary + '40' }}
              thumbColor={isRecurring ? COLORS.primary : COLORS.gray400}
            />
          </View>
        </Card>
      </ScrollView>

      {/* Botão de Salvar */}
      <View style={styles.bottomButton}>
        <TouchableOpacity
          style={[styles.saveButton, saving && styles.saveButtonDisabled]}
          onPress={handleSave}
          disabled={saving}
        >
          {saving ? (
            <Loading size="small" color={COLORS.white} />
          ) : (
            <>
              <Ionicons name="checkmark" size={20} color={COLORS.white} />
              <Text style={styles.saveButtonText}>Salvar Alterações</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
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
    paddingVertical: SPACING.md,
    backgroundColor: COLORS.primary,
    ...SHADOWS.sm,
  },
  headerTitle: {
    fontSize: FONT_SIZES.lg,
    fontFamily: FONTS.bold,
    color: COLORS.white,
    flex: 1,
    textAlign: 'center',
  },
  content: {
    flex: 1,
    padding: SPACING.md,
  },
  card: {
    marginBottom: SPACING.md,
    padding: SPACING.lg,
  },
  cardTitle: {
    fontSize: FONT_SIZES.md,
    fontFamily: FONTS.bold,
    color: COLORS.gray900,
    marginBottom: SPACING.md,
  },
  input: {
    borderWidth: 1,
    borderColor: COLORS.gray300,
    borderRadius: BORDER_RADIUS.md,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    fontSize: FONT_SIZES.md,
    fontFamily: FONTS.regular,
    color: COLORS.gray900,
    backgroundColor: COLORS.white,
  },
  amountInput: {
    fontSize: FONT_SIZES.xl,
    fontFamily: FONTS.bold,
    textAlign: 'center',
  },
  notesInput: {
    height: 80,
    textAlignVertical: 'top',
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
    paddingVertical: SPACING.md,
    borderWidth: 2,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: COLORS.white,
  },
  typeButtonActive: {
    backgroundColor: COLORS.primary,
  },
  typeButtonText: {
    fontSize: FONT_SIZES.md,
    fontFamily: FONTS.bold,
    color: COLORS.gray700,
    marginLeft: SPACING.xs,
  },
  typeButtonTextActive: {
    color: COLORS.white,
  },
  categoryContainer: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  categoryButton: {
    alignItems: 'center',
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.sm,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: COLORS.gray100,
    borderWidth: 2,
    borderColor: 'transparent',
    minWidth: 80,
  },
  categoryButtonActive: {
    backgroundColor: COLORS.primary + '20',
    borderColor: COLORS.primary,
  },
  categoryIcon: {
    fontSize: 24,
    marginBottom: SPACING.xs,
  },
  categoryText: {
    fontSize: FONT_SIZES.sm,
    fontFamily: FONTS.medium,
    color: COLORS.gray700,
    textAlign: 'center',
  },
  categoryTextActive: {
    color: COLORS.primary,
    fontFamily: FONTS.bold,
  },
  budgetContainer: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  budgetButton: {
    alignItems: 'center',
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.sm,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: COLORS.gray100,
    borderWidth: 2,
    borderColor: 'transparent',
    minWidth: 100,
  },
  budgetButtonActive: {
    backgroundColor: COLORS.primary + '20',
    borderColor: COLORS.primary,
  },
  budgetText: {
    fontSize: FONT_SIZES.sm,
    fontFamily: FONTS.medium,
    color: COLORS.gray700,
    textAlign: 'center',
    marginTop: SPACING.xs,
  },
  budgetTextActive: {
    color: COLORS.primary,
    fontFamily: FONTS.bold,
  },
  budgetSubtext: {
    fontSize: FONT_SIZES.xs,
    fontFamily: FONTS.regular,
    color: COLORS.gray500,
    textAlign: 'center',
    marginTop: 2,
  },
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.gray300,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: COLORS.white,
  },
  dateText: {
    fontSize: FONT_SIZES.md,
    fontFamily: FONTS.medium,
    color: COLORS.gray900,
    marginLeft: SPACING.sm,
  },
  switchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  switchInfo: {
    flex: 1,
  },
  switchDescription: {
    fontSize: FONT_SIZES.sm,
    fontFamily: FONTS.regular,
    color: COLORS.gray600,
    marginTop: 2,
  },
  bottomButton: {
    padding: SPACING.md,
    backgroundColor: COLORS.white,
    borderTopWidth: 1,
    borderTopColor: COLORS.gray200,
    ...SHADOWS.sm,
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
    paddingVertical: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
  },
  saveButtonDisabled: {
    backgroundColor: COLORS.gray400,
  },
  saveButtonText: {
    fontSize: FONT_SIZES.md,
    fontFamily: FONTS.bold,
    color: COLORS.white,
    marginLeft: SPACING.xs,
  },
});