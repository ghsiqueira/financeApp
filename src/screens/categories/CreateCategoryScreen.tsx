// src/screens/categories/CreateCategoryScreen.tsx
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { Card, Button, Loading, Toast } from '../../components/common';
import { CategoryService } from '../../services/CategoryService';
import { CreateCategoryData, Category } from '../../types';
import { COLORS, FONTS, FONT_SIZES, SPACING, BORDER_RADIUS, SHADOWS } from '../../constants';
import { CategoryStackParamList } from '../../navigation/CategoryNavigator';
import { useToast } from '../../hooks';

// TIPAGEM CORRIGIDA
type NavigationProp = NativeStackNavigationProp<
  CategoryStackParamList,
  'CreateCategory' | 'EditCategory'
>;

type RouteCreateProp = RouteProp<CategoryStackParamList, 'CreateCategory'>;
type RouteEditProp = RouteProp<CategoryStackParamList, 'EditCategory'>;

interface Props {
  navigation: NavigationProp;
  route: RouteCreateProp | RouteEditProp;
}

// Emojis sugeridos para categorias
const EMOJI_SUGGESTIONS = {
  income: ['💰', '💵', '💸', '🤑', '💳', '🏦', '💼', '📈', '🎁', '💎'],
  expense: ['🛒', '🍔', '🚗', '🏠', '⚡', '📱', '🎮', '✈️', '🏥', '📚', '👕', '🎬', '🍕', '☕'],
};

// Paleta de cores para categorias
const COLOR_PALETTE = [
  '#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8',
  '#F7DC6F', '#BB8FCE', '#85C1E2', '#F8B739', '#52B788',
  '#E63946', '#457B9D', '#F77F00', '#06FFA5', '#9D4EDD',
];

export const CreateCategoryScreen: React.FC<Props> = ({ navigation, route }) => {
  // Verificar se estamos editando
  const isEditing = route.params && 'categoryId' in route.params && !!route.params.categoryId;
  const categoryId = isEditing && 'categoryId' in route.params ? route.params.categoryId : undefined;

  const [loading, setLoading] = useState(isEditing);
  const [saving, setSaving] = useState(false);

  // Hooks de feedback
  const { toast, success, error: showError, hideToast } = useToast();

  // Form state
  const [name, setName] = useState('');
  const [type, setType] = useState<'income' | 'expense'>('expense');
  const [icon, setIcon] = useState('');
  const [color, setColor] = useState(COLOR_PALETTE[0]);
  const [description, setDescription] = useState('');

  // Validação
  const [errors, setErrors] = useState<{
    name?: string;
    icon?: string;
  }>({});

  // Carregar categoria para edição
  useEffect(() => {
    if (isEditing && categoryId) {
      loadCategory();
    }
  }, [isEditing, categoryId]);

  const loadCategory = async () => {
    try {
      setLoading(true);
      const category = await CategoryService.getCategoryById(categoryId!);
      
      if (category) {
        setName(category.name);
        setType(category.type);
        setIcon(category.icon);
        setColor(category.color);
        setDescription(''); // CategoryService não retorna description
      } else {
        showError('Categoria não encontrada');
        navigation.goBack();
      }
    } catch (error: any) {
      console.error('Erro ao carregar categoria:', error);
      showError(error.message || 'Erro ao carregar categoria');
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

  // Validar formulário
  const validateForm = (): boolean => {
    const newErrors: typeof errors = {};

    if (!name.trim()) {
      newErrors.name = 'Nome é obrigatório';
    } else if (name.trim().length < 2) {
      newErrors.name = 'Nome deve ter pelo menos 2 caracteres';
    } else if (name.trim().length > 30) {
      newErrors.name = 'Nome deve ter no máximo 30 caracteres';
    }

    if (!icon) {
      newErrors.icon = 'Selecione um ícone';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Salvar categoria
  const handleSave = async () => {
    if (!validateForm()) {
      showError('Preencha todos os campos obrigatórios');
      return;
    }

    try {
      setSaving(true);

      // DEBUG: Verificar token
      const token = await AsyncStorage.getItem('@FinanceApp:token');
      console.log('🔑 Token existe:', !!token);
      console.log('🔑 Token (primeiros 20 chars):', token?.substring(0, 20) + '...');

      if (isEditing) {
        const updateData: Partial<CreateCategoryData> = {
          name: name.trim(),
          type,
          icon,
          color,
        };

        console.log('📤 Enviando atualização de categoria:', JSON.stringify(updateData, null, 2));
        const category = await CategoryService.updateCategory(categoryId!, updateData);
        console.log('✅ Categoria atualizada:', category);
        
        if (category) {
          success('Categoria atualizada com sucesso!');
          setTimeout(() => {
            navigation.goBack();
          }, 1500);
        }
      } else {
        const createData: CreateCategoryData = {
          name: name.trim(),
          type,
          icon,
          color,
        };

        console.log('📤 Enviando criação de categoria:', JSON.stringify(createData, null, 2));
        const category = await CategoryService.createCategory(createData);
        console.log('✅ Categoria criada:', category);
        
        if (category) {
          success('Categoria criada com sucesso!');
          setTimeout(() => {
            navigation.goBack();
          }, 1500);
        }
      }
    } catch (error: any) {
      console.error('❌ Erro ao salvar categoria:', error);
      console.error('❌ Mensagem do erro:', error.message);
      console.error('❌ Stack trace:', error.stack);
      
      // Tentar pegar mais detalhes do erro
      if (error.response) {
        console.error('❌ Response do erro:', error.response);
      }
      
      showError(error.message || 'Erro ao salvar categoria');
    } finally {
      setSaving(false);
    }
  };

  // Renderizar seletor de tipo
  const renderTypeSelector = () => (
    <View style={styles.section}>
      <Text style={styles.label}>Tipo *</Text>
      <View style={styles.typeContainer}>
        <TouchableOpacity
          style={[
            styles.typeButton,
            type === 'income' && styles.typeButtonActive,
            { borderColor: COLORS.success },
          ]}
          onPress={() => setType('income')}
          disabled={isEditing}
        >
          <Ionicons
            name="arrow-down-circle"
            size={24}
            color={type === 'income' ? COLORS.success : COLORS.gray400}
          />
          <Text
            style={[
              styles.typeButtonText,
              type === 'income' && { color: COLORS.success },
            ]}
          >
            Receita
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.typeButton,
            type === 'expense' && styles.typeButtonActive,
            { borderColor: COLORS.error },
          ]}
          onPress={() => setType('expense')}
          disabled={isEditing}
        >
          <Ionicons
            name="arrow-up-circle"
            size={24}
            color={type === 'expense' ? COLORS.error : COLORS.gray400}
          />
          <Text
            style={[
              styles.typeButtonText,
              type === 'expense' && { color: COLORS.error },
            ]}
          >
            Despesa
          </Text>
        </TouchableOpacity>
      </View>
      {isEditing && (
        <Text style={styles.helperText}>O tipo não pode ser alterado</Text>
      )}
    </View>
  );

  // Renderizar seletor de emoji
  const renderEmojiSelector = () => {
    const emojis = EMOJI_SUGGESTIONS[type];

    return (
      <View style={styles.section}>
        <Text style={styles.label}>Ícone *</Text>
        <View style={styles.emojiContainer}>
          {emojis.map((emoji, index) => (
            <TouchableOpacity
              key={index}
              style={[
                styles.emojiButton,
                icon === emoji && styles.emojiButtonActive,
                icon === emoji && { borderColor: color },
              ]}
              onPress={() => {
                setIcon(emoji);
                setErrors({ ...errors, icon: undefined });
              }}
            >
              <Text style={styles.emojiText}>{emoji}</Text>
            </TouchableOpacity>
          ))}
        </View>
        {errors.icon && <Text style={styles.errorText}>{errors.icon}</Text>}
      </View>
    );
  };

  // Renderizar seletor de cor
  const renderColorSelector = () => (
    <View style={styles.section}>
      <Text style={styles.label}>Cor</Text>
      <View style={styles.colorContainer}>
        {COLOR_PALETTE.map((colorOption, index) => (
          <TouchableOpacity
            key={index}
            style={[
              styles.colorButton,
              { backgroundColor: colorOption },
              color === colorOption && styles.colorButtonActive,
            ]}
            onPress={() => setColor(colorOption)}
          >
            {color === colorOption && (
              <Ionicons name="checkmark" size={20} color={COLORS.white} />
            )}
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  // Preview da categoria
  const renderPreview = () => (
    <Card style={styles.previewCard}>
      <Text style={styles.previewLabel}>Preview</Text>
      <View style={styles.previewContent}>
        <View style={[styles.previewIcon, { backgroundColor: color + '20' }]}>
          <Text style={styles.previewEmoji}>{icon || '❓'}</Text>
        </View>
        <View style={styles.previewInfo}>
          <Text style={styles.previewName}>{name || 'Nome da categoria'}</Text>
          <Text style={styles.previewType}>
            {type === 'income' ? 'Receita' : 'Despesa'}
          </Text>
        </View>
      </View>
    </Card>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <Loading text="Carregando categoria..." />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Toast */}
      <Toast
        visible={toast.visible}
        message={toast.message}
        type={toast.type}
        onHide={hideToast}
      />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color={COLORS.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.title}>
          {isEditing ? 'Editar Categoria' : 'Nova Categoria'}
        </Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Preview */}
        {renderPreview()}

        {/* Formulário */}
        <Card style={styles.formCard}>
          {/* Nome */}
          <View style={styles.section}>
            <Text style={styles.label}>Nome *</Text>
            <TextInput
              style={[styles.input, errors.name && styles.inputError]}
              placeholder="Ex: Supermercado, Salário..."
              value={name}
              onChangeText={(text) => {
                setName(text);
                if (errors.name) {
                  setErrors({ ...errors, name: undefined });
                }
              }}
              maxLength={30}
              placeholderTextColor={COLORS.gray400}
            />
            {errors.name && <Text style={styles.errorText}>{errors.name}</Text>}
            <Text style={styles.charCount}>{name.length}/30</Text>
          </View>

          {/* Tipo */}
          {renderTypeSelector()}

          {/* Emoji */}
          {renderEmojiSelector()}

          {/* Cor */}
          {renderColorSelector()}

          {/* Descrição */}
          <View style={styles.section}>
            <Text style={styles.label}>Descrição (Opcional)</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Adicione uma descrição..."
              value={description}
              onChangeText={setDescription}
              multiline
              numberOfLines={3}
              maxLength={100}
              placeholderTextColor={COLORS.gray400}
            />
            <Text style={styles.charCount}>{description.length}/100</Text>
          </View>
        </Card>

        {/* Botões */}
        <View style={styles.buttonContainer}>
          <Button
            title={isEditing ? 'Salvar Alterações' : 'Criar Categoria'}
            onPress={handleSave}
            loading={saving}
            style={styles.saveButton}
          />
          <Button
            title="Cancelar"
            onPress={() => navigation.goBack()}
            variant="outline"
            disabled={saving}
          />
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
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
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: FONT_SIZES.xl,
    fontFamily: FONTS.bold,
    color: COLORS.textPrimary,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: SPACING.md,
  },
  previewCard: {
    padding: SPACING.lg,
    marginBottom: SPACING.md,
    backgroundColor: COLORS.white,
  },
  previewLabel: {
    fontSize: FONT_SIZES.sm,
    fontFamily: FONTS.medium,
    color: COLORS.textSecondary,
    marginBottom: SPACING.sm,
  },
  previewContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  previewIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
  },
  previewEmoji: {
    fontSize: 32,
  },
  previewInfo: {
    flex: 1,
  },
  previewName: {
    fontSize: FONT_SIZES.lg,
    fontFamily: FONTS.semibold,
    color: COLORS.textPrimary,
    marginBottom: 4,
  },
  previewType: {
    fontSize: FONT_SIZES.sm,
    fontFamily: FONTS.regular,
    color: COLORS.textSecondary,
  },
  formCard: {
    padding: SPACING.lg,
    marginBottom: SPACING.md,
  },
  section: {
    marginBottom: SPACING.lg,
  },
  label: {
    fontSize: FONT_SIZES.sm,
    fontFamily: FONTS.semibold,
    color: COLORS.textPrimary,
    marginBottom: SPACING.xs,
  },
  input: {
    borderWidth: 1,
    borderColor: COLORS.gray300,
    borderRadius: BORDER_RADIUS.md,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    fontSize: FONT_SIZES.md,
    fontFamily: FONTS.regular,
    color: COLORS.textPrimary,
    backgroundColor: COLORS.white,
  },
  inputError: {
    borderColor: COLORS.error,
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  errorText: {
    fontSize: FONT_SIZES.xs,
    fontFamily: FONTS.regular,
    color: COLORS.error,
    marginTop: 4,
  },
  helperText: {
    fontSize: FONT_SIZES.xs,
    fontFamily: FONTS.regular,
    color: COLORS.textTertiary,
    marginTop: 4,
  },
  charCount: {
    fontSize: FONT_SIZES.xs,
    fontFamily: FONTS.regular,
    color: COLORS.textTertiary,
    textAlign: 'right',
    marginTop: 4,
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
    gap: SPACING.xs,
    paddingVertical: SPACING.md,
    borderWidth: 2,
    borderColor: COLORS.gray300,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: COLORS.white,
  },
  typeButtonActive: {
    backgroundColor: COLORS.gray50,
  },
  typeButtonText: {
    fontSize: FONT_SIZES.md,
    fontFamily: FONTS.semibold,
    color: COLORS.textSecondary,
  },
  emojiContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
  },
  emojiButton: {
    width: 56,
    height: 56,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: COLORS.gray200,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: COLORS.white,
  },
  emojiButtonActive: {
    borderWidth: 3,
    backgroundColor: COLORS.gray50,
  },
  emojiText: {
    fontSize: 28,
  },
  colorContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
  },
  colorButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  colorButtonActive: {
    borderColor: COLORS.gray700,
    borderWidth: 3,
  },
  buttonContainer: {
    gap: SPACING.sm,
  },
  saveButton: {
    marginBottom: SPACING.xs,
  },
});