// src/navigation/types.ts
import { NavigatorScreenParams } from '@react-navigation/native';

// Root Stack Navigator
export type RootStackParamList = {
  Auth: NavigatorScreenParams<AuthStackParamList>;
  Main: NavigatorScreenParams<MainTabParamList>;
};

// Auth Stack Navigator
export type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
  ForgotPassword: undefined;
};

// Main Tab Navigator
export type MainTabParamList = {
  Home: undefined;
  Transactions: NavigatorScreenParams<TransactionStackParamList>;
  Goals: NavigatorScreenParams<GoalStackParamList>;
  Budgets: NavigatorScreenParams<BudgetStackParamList>;
  Reports: undefined;
  Profile: NavigatorScreenParams<ProfileStackParamList>;
};

// Transaction Stack Navigator
export type TransactionStackParamList = {
  TransactionList: undefined;
  CreateTransaction: undefined;
  EditTransaction: { transactionId: string };
  TransactionDetails: { transactionId: string };
};

// Goal Stack Navigator
export type GoalStackParamList = {
  GoalList: undefined;
  CreateGoal: undefined;
  EditGoal: { goalId: string };
  GoalDetail: { goalId: string };
  ShareGoal: { goalId: string; goalTitle: string }; 
  SharedGoals: undefined; 
};

// Budget Stack Navigator
export type BudgetStackParamList = {
  BudgetList: undefined;
  CreateBudget: undefined;
  EditBudget: { budgetId: string };
  BudgetDetail: { budgetId: string };
};

// Profile Stack Navigator
export type ProfileStackParamList = {
  Profile: undefined;
  Settings: undefined;
  EditProfile: undefined;
  Categories: NavigatorScreenParams<CategoryStackParamList>;
};

// Category Stack Navigator
export type CategoryStackParamList = {
  CategoryList: undefined;
  CreateCategory: undefined;
  EditCategory: { categoryId: string };
};

// Global declaration para tipagem automática
declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}