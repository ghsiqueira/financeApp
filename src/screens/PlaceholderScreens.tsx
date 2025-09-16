// src/screens/PlaceholderScreens.tsx
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS, FONTS, FONT_SIZES, SPACING } from '../constants';

// Tela básica reutilizável
const BasicScreen: React.FC<{ title: string; subtitle?: string }> = ({ title, subtitle }) => (
  <SafeAreaView style={screenStyles.container}>
    <View style={screenStyles.content}>
      <Text style={screenStyles.title}>{title}</Text>
      {subtitle && <Text style={screenStyles.subtitle}>{subtitle}</Text>}
      <Text style={screenStyles.comingSoon}>Em desenvolvimento...</Text>
    </View>
  </SafeAreaView>
);

// Exportar o LoginScreen real
export { LoginScreen } from './auth/LoginScreen';

// Telas de autenticação
export const RegisterScreen: React.FC = () => (
  <BasicScreen title="Criar Conta" subtitle="Cadastre-se para começar" />
);

export const ForgotPasswordScreen: React.FC = () => (
  <BasicScreen title="Recuperar Senha" subtitle="Digite seu email para recuperar a senha" />
);

// Telas de metas
export const GoalListScreen: React.FC = () => (
  <BasicScreen title="Metas" subtitle="Organize seus objetivos financeiros" />
);

export const CreateGoalScreen: React.FC = () => (
  <BasicScreen title="Nova Meta" subtitle="Defina uma nova meta financeira" />
);

export const EditGoalScreen: React.FC = () => (
  <BasicScreen title="Editar Meta" />
);

export const GoalDetailScreen: React.FC = () => (
  <BasicScreen title="Detalhes da Meta" />
);

// Telas de orçamentos
export const BudgetListScreen: React.FC = () => (
  <BasicScreen title="Orçamentos" subtitle="Controle seus gastos mensais" />
);

export const CreateBudgetScreen: React.FC = () => (
  <BasicScreen title="Novo Orçamento" subtitle="Defina limites para suas categorias" />
);

export const EditBudgetScreen: React.FC = () => (
  <BasicScreen title="Editar Orçamento" />
);

export const BudgetDetailScreen: React.FC = () => (
  <BasicScreen title="Detalhes do Orçamento" />
);

// Telas de relatórios
export const ReportsScreen: React.FC = () => (
  <BasicScreen title="Relatórios" subtitle="Analise suas finanças com gráficos e estatísticas" />
);

// Telas de perfil
export const ProfileScreen: React.FC = () => (
  <BasicScreen title="Perfil" subtitle="Gerencie sua conta e configurações" />
);

export const SettingsScreen: React.FC = () => (
  <BasicScreen title="Configurações" />
);

export const EditProfileScreen: React.FC = () => (
  <BasicScreen title="Editar Perfil" />
);

// Telas de transações
export const TransactionListScreen: React.FC = () => (
  <BasicScreen title="Transações" subtitle="Histórico de todas suas transações" />
);

export const EditTransactionScreen: React.FC = () => (
  <BasicScreen title="Editar Transação" />
);

export const TransactionDetailScreen: React.FC = () => (
  <BasicScreen title="Detalhes da Transação" />
);

// Telas de categorias
export const CategoryListScreen: React.FC = () => (
  <BasicScreen title="Categorias" subtitle="Gerencie suas categorias personalizadas" />
);

export const CreateCategoryScreen: React.FC = () => (
  <BasicScreen title="Nova Categoria" />
);

export const EditCategoryScreen: React.FC = () => (
  <BasicScreen title="Editar Categoria" />
);

const screenStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
  },
  title: {
    fontSize: FONT_SIZES['2xl'],
    fontFamily: FONTS.bold,
    color: COLORS.textPrimary,
    marginBottom: SPACING.sm,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: FONT_SIZES.md,
    fontFamily: FONTS.regular,
    color: COLORS.textSecondary,
    marginBottom: SPACING.lg,
    textAlign: 'center',
  },
  comingSoon: {
    fontSize: FONT_SIZES.sm,
    fontFamily: FONTS.medium,
    color: COLORS.primary,
    backgroundColor: COLORS.primary10,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: 20,
  },
});