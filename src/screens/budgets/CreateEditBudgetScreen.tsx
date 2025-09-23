// src/screens/budgets/CreateEditBudgetScreen.tsx
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';

import {
  Button,
  Input,
  Select,
  CurrencyInput,
  Card,
  Loading,
} from '../../components/common';
import { BudgetService } from '../../services/BudgetService';
import { CategoryService } from '../../services/CategoryService';
import { Budget, CreateBudgetData, Category, BudgetStackParamList } from '../../types';
import { COLORS, FONTS, FONT_SIZES, SPACING } from '../../constants';
import { formatCurrency } from '../../utils';

type CreateEditBudgetScreenNavigationProp = NativeStackNavigationProp<
  BudgetStackParamList,
  'CreateBudget' | 'EditBudget'
>;

type CreateEditBudgetScreenRouteProp = RouteProp<
  BudgetStackParamList,
  'CreateBudget' | 'EditBudget'
>;

interface Props {
  navigation: CreateEditBudgetScreenNavigationProp;
  route: CreateEditBudgetScreenRouteProp;
}

interface FormData {
  name: string;
  category: string;
  monthlyLimit: string;
  month: number;
  year: number;
  isActive: boolean;
}

interface FormErrors {
  name?: string;
  category?: string;
  monthlyLimit?: string;
  month?: string;
  year?: string;
}

export const CreateEditBudgetScreen: React.FC<Props> = ({ navigation, route }) => {
  const isEditing = route.name === 'EditBudget';
  const budgetId = route.params && 'budgetId' in route.params ? route.params.budgetId : undefined;

  const [loading, setLoading] = useState(isEditing);
  const [saving, setSaving] = useState(false);
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  const [budget, setBudget] = useState<Budget | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);

  const currentDate = new Date();
  const [formData, setFormData] = useState<FormData>({
    name: '',
    category: '',
    monthlyLimit: '',
    month: currentDate.getMonth() + 1,
    year: currentDate.getFullYear(),
    isActive: true,
  });

  const [errors, setErrors] = useState<FormErrors>({});

  // Carregar categorias ao montar componente
  useEffect(() => {
    loadCategories();
  }, []);

  // Carregar orçamento para edição
  useEffect(() => {
    if (isEditing && budgetId) {
      loadBudget();
    }
  }, [isEditing, budgetId]);

  const loadCategories = async () => {
    try {
      setCategoriesLoading(true);
      const response = await CategoryService.getCategories({ type: 'expense' });
      
      if (response.success && response.data) {
        setCategories(response.data);
      } else {
        Alert.alert('Erro', 'Erro ao carregar categorias');
      }
    } catch (error: any) {
      console.error('Erro ao carregar categorias:', error);
      Alert.alert('Erro', 'Erro ao carregar categorias');
    } finally {
      setCategoriesLoading(false);
    }
  };

  const loadBudget = async () => {
    try {
      setLoading(true);
      
      const response = await BudgetService.getBudget(budgetId!);
      console.log('Resposta completa da API:', JSON.stringify(response, null, 2));
      
      if (response.success && response.data) {
        const budgetData = response.data;
        setBudget(budgetData);
        
        console.log('Dados do orçamento carregado:', {
          name: budgetData.name,
          category: budgetData.category,
          monthlyLimit: budgetData.monthlyLimit,
          month: budgetData.month,
          year: budgetData.year,
          isActive: budgetData.isActive
        });
        
        // Formatação correta do valor monetário
        const formatCurrencyValue = (value: number) => {
          if (!value || value === 0) return '';
          return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL',
          }).format(value);
        };
        
        const newFormData = {
          name: budgetData.name || '',
          category: typeof budgetData.category === 'string' ? budgetData.category : budgetData.category?._id || '',
          monthlyLimit: formatCurrencyValue(budgetData.monthlyLimit),
          month: budgetData.month || currentDate.getMonth() + 1,
          year: budgetData.year || currentDate.getFullYear(),
          isActive: budgetData.isActive !== undefined ? budgetData.isActive : true,
        };
        
        console.log('FormData que será definido:', newFormData);
        setFormData(newFormData);
        
      } else {
        Alert.alert('Erro', 'Orçamento não encontrado');
        navigation.goBack();
      }
    } catch (error: any) {
      console.error('Erro ao carregar orçamento:', error);
      Alert.alert('Erro', error.message || 'Erro ao carregar orçamento');
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

  // Atualizar campo do formulário
  const updateField = (field: keyof FormData, value: string | number | boolean) => {
    console.log('Atualizando campo:', field, 'com valor:', value);
    setFormData(prev => {
      const newFormData = { ...prev, [field]: value };
      console.log('Novo formData:', newFormData);
      return newFormData;
    });
    
    // Limpar erro do campo
    if (errors[field as keyof FormErrors]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  // Validar formulário
  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Nome é obrigatório';
    } else if (formData.name.trim().length < 3) {
      newErrors.name = 'Nome deve ter pelo menos 3 caracteres';
    }

    if (!formData.category) {
      newErrors.category = 'Selecione uma categoria';
    }

    const monthlyLimit = parseFloat(formData.monthlyLimit.replace(/[^\d,]/g, '').replace(',', '.'));
    if (!formData.monthlyLimit || isNaN(monthlyLimit) || monthlyLimit <= 0) {
      newErrors.monthlyLimit = 'Digite um valor válido para o limite';
    }

    if (formData.month < 1 || formData.month > 12) {
      newErrors.month = 'Mês inválido';
    }

    if (formData.year < 2020 || formData.year > 2030) {
      newErrors.year = 'Ano deve estar entre 2020 e 2030';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Salvar orçamento
  const handleSave = async () => {
    if (!validateForm()) {
      return;
    }

    try {
      setSaving(true);

      const monthlyLimit = parseFloat(formData.monthlyLimit.replace(/[^\d,]/g, '').replace(',', '.'));

      if (isEditing && budgetId) {
        const updateData = {
          name: formData.name.trim(),
          category: formData.category,
          monthlyLimit,
          month: formData.month,
          year: formData.year,
          isActive: formData.isActive,
        };
        
        console.log('Dados para atualização:', updateData);
        const response = await BudgetService.updateBudget(budgetId, updateData);
        
        if (response.success) {
          Alert.alert('Sucesso', 'Orçamento atualizado com sucesso!');
          navigation.goBack();
        } else {
          Alert.alert('Erro', response.message || 'Erro ao atualizar orçamento');
        }
      } else {
        const budgetData: CreateBudgetData = {
          name: formData.name.trim(),
          category: formData.category,
          monthlyLimit,
          month: formData.month,
          year: formData.year,
        };
        
        console.log('Dados para criação:', budgetData);
        const response = await BudgetService.createBudget(budgetData);
        
        if (response.success) {
          Alert.alert('Sucesso', 'Orçamento criado com sucesso!');
          navigation.goBack();
        } else {
          Alert.alert('Erro', response.message || 'Erro ao criar orçamento');
        }
      }
    } catch (error: any) {
      console.error('Erro ao salvar orçamento:', error);
      Alert.alert('Erro', error.message || 'Erro ao salvar orçamento');
    } finally {
      setSaving(false);
    }
  };

  // Gerar opções de mês
  const getMonthOptions = () => {
    const months = [
      'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
      'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
    ];
    return months.map((month, index) => ({
      label: month,
      value: (index + 1).toString(),
    }));
  };

  // Gerar opções de ano
  const getYearOptions = () => {
    const currentYear = new Date().getFullYear();
    const years = [];
    for (let year = currentYear - 1; year <= currentYear + 2; year++) {
      years.push({ label: year.toString(), value: year.toString() });
    }
    return years;
  };

  if (loading || categoriesLoading) {
    return <Loading text={isEditing ? "Carregando orçamento..." : "Preparando formulário..."} />;
  }

  console.log('Renderizando com formData:', formData);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>
          {isEditing ? 'Editar Orçamento' : 'Novo Orçamento'}
        </Text>
        <Text style={styles.subtitle}>
          {isEditing 
            ? 'Atualize as informações do seu orçamento' 
            : 'Defina um limite de gastos para uma categoria'
          }
        </Text>
      </View>

      <ScrollView
        style={styles.scrollContainer}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <Card style={styles.formCard}>
          <Text style={styles.sectionTitle}>Informações Básicas</Text>

          <Input
            label="Nome do Orçamento"
            placeholder="Ex: Alimentação, Transporte"
            value={formData.name}
            onChangeText={(value: string) => updateField('name', value)}
            error={errors.name}
            maxLength={50}
            required
          />

          <Select
            label="Categoria"
            placeholder="Selecione uma categoria"
            value={formData.category}
            onValueChange={(value: string) => {
              console.log('Categoria selecionada:', value);
              updateField('category', value);
            }}
            options={categories.map(cat => ({ 
              label: cat.name, 
              value: cat._id 
            }))}
            error={errors.category}
            required
          />
        </Card>

        <Card style={styles.formCard}>
          <Text style={styles.sectionTitle}>Limite</Text>

          <CurrencyInput
            label="Limite Mensal"
            placeholder="R$ 0,00"
            value={formData.monthlyLimit}
            onChangeText={(value: string) => updateField('monthlyLimit', value)}
            error={errors.monthlyLimit}
            helperText="Quanto você pretende gastar nesta categoria por mês"
            required
          />
        </Card>

        <Card style={styles.formCard}>
          <Text style={styles.sectionTitle}>Período</Text>

          <View style={styles.periodContainer}>
            <View style={styles.periodField}>
              <Select
                label="Mês"
                value={formData.month.toString()}
                onValueChange={(value: string) => updateField('month', parseInt(value))}
                options={getMonthOptions()}
                error={errors.month}
                required
              />
            </View>
            
            <View style={styles.periodField}>
              <Select
                label="Ano"
                value={formData.year.toString()}
                onValueChange={(value: string) => updateField('year', parseInt(value))}
                options={getYearOptions()}
                error={errors.year}
                required
              />
            </View>
          </View>
        </Card>

        {/* Preview do orçamento */}
        {formData.name && formData.monthlyLimit && formData.category && (
          <Card style={styles.previewCard}>
            <Text style={styles.sectionTitle}>Preview do Orçamento</Text>
            
            <View style={styles.preview}>
              <View style={styles.previewHeader}>
                <Text style={styles.previewTitle}>{formData.name}</Text>
                <Text style={styles.previewCategory}>
                  {categories.find(c => c._id === formData.category)?.name || 'Categoria'}
                </Text>
              </View>

              <View style={styles.previewValues}>
                <Text style={styles.previewLimit}>
                  Limite: {formData.monthlyLimit || 'R$ 0,00'}
                </Text>
              </View>

              <Text style={styles.previewPeriod}>
                Período: {getMonthOptions()[formData.month - 1]?.label} {formData.year}
              </Text>
            </View>
          </Card>
        )}

        <View style={styles.buttonsContainer}>
          <Button
            title="Cancelar"
            variant="outline"
            onPress={() => navigation.goBack()}
            style={styles.cancelButton}
          />
          
          <Button
            title={isEditing ? 'Atualizar' : 'Criar Orçamento'}
            onPress={handleSave}
            loading={saving}
            style={styles.saveButton}
          />
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
    paddingTop: SPACING.md,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  title: {
    fontSize: FONT_SIZES.xl,
    fontFamily: FONTS.bold,
    color: COLORS.textPrimary,
    marginBottom: SPACING.xs,
  },
  subtitle: {
    fontSize: FONT_SIZES.sm,
    fontFamily: FONTS.regular,
    color: COLORS.textSecondary,
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
  },
  formCard: {
    marginBottom: SPACING.md,
    padding: SPACING.lg,
  },
  sectionTitle: {
    fontSize: FONT_SIZES.lg,
    fontFamily: FONTS.bold,
    color: COLORS.textPrimary,
    marginBottom: SPACING.md,
  },
  periodContainer: {
    flexDirection: 'row',
    gap: SPACING.md,
  },
  periodField: {
    flex: 1,
  },
  previewCard: {
    marginBottom: SPACING.md,
    padding: SPACING.lg,
    backgroundColor: COLORS.backgroundSecondary,
  },
  preview: {
    gap: SPACING.sm,
  },
  previewHeader: {
    marginBottom: SPACING.sm,
  },
  previewTitle: {
    fontSize: FONT_SIZES.lg,
    fontFamily: FONTS.bold,
    color: COLORS.textPrimary,
    marginBottom: SPACING.xs,
  },
  previewCategory: {
    fontSize: FONT_SIZES.sm,
    fontFamily: FONTS.regular,
    color: COLORS.textSecondary,
  },
  previewValues: {
    gap: SPACING.xs,
  },
  previewLimit: {
    fontSize: FONT_SIZES.base,
    fontFamily: FONTS.bold,
    color: COLORS.primary,
  },
  previewPeriod: {
    fontSize: FONT_SIZES.sm,
    fontFamily: FONTS.regular,
    color: COLORS.textSecondary,
  },
  buttonsContainer: {
    flexDirection: 'row',
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.sm,
    paddingBottom: SPACING.sm,
    gap: SPACING.sm,
  },
  cancelButton: {
    flex: 1,
  },
  saveButton: {
    flex: 2,
  },
});