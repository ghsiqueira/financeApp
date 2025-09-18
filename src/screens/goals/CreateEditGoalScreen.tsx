// src/screens/goals/CreateEditGoalScreen.tsx
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';

import {
  Button,
  Input,
  Select,
  DatePicker,
  CurrencyInput,
  Card,
  Loading,
} from '../../components/common';
import { GoalService, Goal, CreateGoalData } from '../../services/GoalService';
import { COLORS, FONTS, FONT_SIZES, SPACING } from '../../constants';
import { DEFAULT_CATEGORIES } from '../../constants';

type GoalStackParamList = {
  GoalList: undefined;
  CreateGoal: undefined;
  EditGoal: { goalId: string };
  GoalDetails: { goalId: string };
};

type CreateEditGoalScreenNavigationProp = NativeStackNavigationProp<
  GoalStackParamList,
  'CreateGoal' | 'EditGoal'
>;

type CreateEditGoalScreenRouteProp = RouteProp<
  GoalStackParamList,
  'CreateGoal' | 'EditGoal'
>;

interface Props {
  navigation: CreateEditGoalScreenNavigationProp;
  route: CreateEditGoalScreenRouteProp;
}

interface FormData {
  title: string;
  description: string;
  targetAmount: string;
  currentAmount: string;
  targetDate: Date;
  category: string;
}

interface FormErrors {
  title?: string;
  targetAmount?: string;
  targetDate?: string;
  category?: string;
}

export const CreateEditGoalScreen: React.FC<Props> = ({ navigation, route }) => {
  const isEditing = route.name === 'EditGoal';
  const goalId = route.params && 'goalId' in route.params ? route.params.goalId : undefined;

  const [loading, setLoading] = useState(isEditing);
  const [saving, setSaving] = useState(false);
  const [goal, setGoal] = useState<Goal | null>(null);

  const [formData, setFormData] = useState<FormData>({
    title: '',
    description: '',
    targetAmount: '',
    currentAmount: '0',
    targetDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 dias no futuro
    category: '',
  });

  const [errors, setErrors] = useState<FormErrors>({});

  // Categorias para metas
  const goalCategories = [
    'Emergência',
    'Viagem',
    'Casa própria',
    'Carro',
    'Educação',
    'Investimento',
    'Aposentadoria',
    'Casamento',
    'Outros',
  ];

  // Carregar meta para edição
  useEffect(() => {
    if (isEditing && goalId) {
      loadGoal();
    }
  }, [isEditing, goalId]);

  const loadGoal = async () => {
    try {
      setLoading(true);
      const response = await GoalService.getGoal(goalId!);
      
      if (response.success && response.data) {
        const goalData = response.data;
        setGoal(goalData);
        setFormData({
          title: goalData.title,
          description: goalData.description || '',
          targetAmount: goalData.targetAmount.toString(),
          currentAmount: goalData.currentAmount.toString(),
          targetDate: new Date(goalData.targetDate || goalData.endDate),
          category: goalData.category || '',
        });
      } else {
        Alert.alert('Erro', 'Meta não encontrada');
        navigation.goBack();
      }
    } catch (error: any) {
      Alert.alert('Erro', error.message || 'Erro ao carregar meta');
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

  // Atualizar campo do formulário
  const updateField = (field: keyof FormData, value: string | Date) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Limpar erro do campo
    if (errors[field as keyof FormErrors]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  // Validar formulário
  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    // Validar título
    if (!formData.title.trim()) {
      newErrors.title = 'Título é obrigatório';
    } else if (formData.title.trim().length < 3) {
      newErrors.title = 'Título deve ter pelo menos 3 caracteres';
    }

    // Validar valor meta
    const targetAmount = parseFloat(formData.targetAmount.replace(/[^\d,]/g, '').replace(',', '.'));
    if (!formData.targetAmount || isNaN(targetAmount) || targetAmount <= 0) {
      newErrors.targetAmount = 'Digite um valor válido para a meta';
    }

    // Validar data
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (formData.targetDate < today) {
      newErrors.targetDate = 'Data da meta deve ser futura';
    }

    // Validar categoria
    if (!formData.category) {
      newErrors.category = 'Selecione uma categoria';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Salvar meta
  const handleSave = async () => {
    if (!validateForm()) {
      return;
    }

    try {
      setSaving(true);

      const targetAmount = parseFloat(formData.targetAmount.replace(/[^\d,]/g, '').replace(',', '.'));
      const currentAmount = parseFloat(formData.currentAmount.replace(/[^\d,]/g, '').replace(',', '.')) || 0;

      const goalData: CreateGoalData = {
        title: formData.title.trim(),
        description: formData.description.trim(),
        targetAmount,
        currentAmount,
        targetDate: formData.targetDate.toISOString(),
        category: formData.category,
      };

      if (isEditing && goalId) {
        await GoalService.updateGoal(goalId, goalData);
        Alert.alert('Sucesso', 'Meta atualizada com sucesso!');
      } else {
        await GoalService.createGoal(goalData);
        Alert.alert('Sucesso', 'Meta criada com sucesso!');
      }

      navigation.goBack();
    } catch (error: any) {
      Alert.alert('Erro', error.message || 'Erro ao salvar meta');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <Loading text="Carregando meta..." />;
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.keyboardContainer}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={styles.header}>
          <Text style={styles.title}>
            {isEditing ? 'Editar Meta' : 'Nova Meta'}
          </Text>
          <Text style={styles.subtitle}>
            {isEditing 
              ? 'Atualize as informações da sua meta' 
              : 'Defina um objetivo financeiro para alcançar'
            }
          </Text>
        </View>

        <ScrollView
          style={styles.form}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <Card style={styles.formCard}>
            <Text style={styles.sectionTitle}>Informações Básicas</Text>

            <Input
              label="Título da Meta"
              placeholder="Ex: Viagem para Europa"
              value={formData.title}
              onChangeText={(value: string | Date) => updateField('title', value)}
              error={errors.title}
              maxLength={50}
              required
            />

            <Input
              label="Descrição (Opcional)"
              placeholder="Descreva sua meta em mais detalhes"
              value={formData.description}
              onChangeText={(value: string | Date) => updateField('description', value)}
              multiline
              numberOfLines={3}
              maxLength={200}
            />

            <Select
              label="Categoria"
              placeholder="Selecione uma categoria"
              value={formData.category}
              onValueChange={(value: string) => updateField('category', value)}
              options={goalCategories.map(cat => ({ label: cat, value: cat }))}
              error={errors.category}
              required
            />
          </Card>

          <Card style={styles.formCard}>
            <Text style={styles.sectionTitle}>Valores</Text>

            <CurrencyInput
              label="Valor da Meta"
              placeholder="R$ 0,00"
              value={formData.targetAmount}
              onChangeText={(value: string) => updateField('targetAmount', value)}
              error={errors.targetAmount}
              required
            />

            {isEditing && (
              <CurrencyInput
                label="Valor Atual"
                placeholder="R$ 0,00"
                value={formData.currentAmount}
                onChangeText={(value: string) => updateField('currentAmount', value)}
                helperText="Quanto você já economizou para esta meta"
              />
            )}
          </Card>

          <Card style={styles.formCard}>
            <Text style={styles.sectionTitle}>Prazo</Text>

            <DatePicker
              label="Data da Meta"
              value={formData.targetDate}
              onDateChange={(date: Date) => updateField('targetDate', date)}
              error={errors.targetDate}
              minimumDate={new Date()}
              helperText="Até quando você quer alcançar esta meta"
              required
            />

            <View style={styles.dateInfo}>
              <Text style={styles.dateInfoText}>
                Dias restantes: {Math.ceil((formData.targetDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))}
              </Text>
            </View>
          </Card>

          {/* Preview da meta */}
          {formData.title && formData.targetAmount && (
            <Card style={styles.previewCard}>
              <Text style={styles.sectionTitle}>Preview da Meta</Text>
              
              <View style={styles.preview}>
                <View style={styles.previewHeader}>
                  <Text style={styles.previewTitle}>{formData.title}</Text>
                  {formData.category && (
                    <Text style={styles.previewCategory}>{formData.category}</Text>
                  )}
                </View>

                <View style={styles.previewValues}>
                  <Text style={styles.previewTarget}>
                    Meta: R$ {formData.targetAmount || '0,00'}
                  </Text>
                  {isEditing && (
                    <Text style={styles.previewCurrent}>
                      Atual: R$ {formData.currentAmount || '0,00'}
                    </Text>
                  )}
                </View>

                <Text style={styles.previewDate}>
                  Até: {formData.targetDate.toLocaleDateString('pt-BR')}
                </Text>
              </View>
            </Card>
          )}
        </ScrollView>

        <View style={styles.footer}>
          <Button
            title="Cancelar"
            variant="outline"
            onPress={() => navigation.goBack()}
            style={styles.cancelButton}
          />
          
          <Button
            title={isEditing ? 'Atualizar' : 'Criar Meta'}
            onPress={handleSave}
            loading={saving}
            style={styles.saveButton}
          />
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  keyboardContainer: {
    flex: 1,
  },
  header: {
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
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
  form: {
    flex: 1,
    paddingHorizontal: SPACING.lg,
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
  dateInfo: {
    marginTop: SPACING.sm,
    padding: SPACING.sm,
    backgroundColor: COLORS.primary10,
    borderRadius: 8,
  },
  dateInfoText: {
    fontSize: FONT_SIZES.sm,
    fontFamily: FONTS.medium,
    color: COLORS.primary,
    textAlign: 'center',
  },
  previewCard: {
    marginBottom: SPACING.lg,
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
  previewTarget: {
    fontSize: FONT_SIZES.base,
    fontFamily: FONTS.bold,
    color: COLORS.primary,
  },
  previewCurrent: {
    fontSize: FONT_SIZES.sm,
    fontFamily: FONTS.medium,
    color: COLORS.success,
  },
  previewDate: {
    fontSize: FONT_SIZES.sm,
    fontFamily: FONTS.regular,
    color: COLORS.textSecondary,
  },
  footer: {
    flexDirection: 'row',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    gap: SPACING.sm,
    backgroundColor: COLORS.white,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  cancelButton: {
    flex: 1,
  },
  saveButton: {
    flex: 2,
  },
});