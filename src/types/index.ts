// src/types/index.ts - TIPOS COMPLETOS CORRIGIDOS

// User types
export interface User {
  id: string;
  name: string;
  email: string;
  createdAt: string;
  updatedAt: string;
}

export interface AuthResponse {
  success: boolean;
  message: string;
  token: string;
  user: User;
}

// Transaction types
export interface Transaction {
  _id: string;
  id: string; // Para compatibilidade
  userId: string;
  description: string;
  amount: number;
  type: 'income' | 'expense';
  category: Category;
  date: string;
  isRecurring: boolean;
  recurringDay?: number;
  budgetId?: Budget;
  createdAt: string;
  updatedAt: string;
}

export interface CreateTransactionData {
  description: string;
  amount: number;
  type: 'income' | 'expense';
  category: string;
  date?: string;
  isRecurring?: boolean;
  recurringDay?: number;
  budgetId?: string;
}

// Goal types - CORRIGIDO baseado na resposta da API
export interface Goal {
  goal: Goal;
  _id: string;
  id?: string; // Para compatibilidade opcional
  userId: string;
  title: string;
  name?: string; // Para compatibilidade opcional
  description?: string;
  targetAmount: number;
  currentAmount: number;
  startDate: string;
  endDate: string;
  targetDate?: string; // Para compatibilidade opcional
  category?: string;
  monthlyTarget: number;
  monthlyTargetRemaining: number;
  status: 'active' | 'completed' | 'paused';
  progress: number;
  daysRemaining: number;
  daysPassed: number;
  totalDays: number;
  monthsRemaining: number;
  remainingAmount: number;
  createdAt: string;
  updatedAt: string;
  __v?: number; // MongoDB version field
}

export interface CreateGoalData {
  title: string;
  description?: string;
  targetAmount: number;
  currentAmount?: number;
  startDate?: string;
  endDate?: string;
  targetDate: string; // Será mapeado para endDate
  category?: string;
}

// Budget types
export interface Budget {
  _id: string;
  id: string; // Para compatibilidade
  userId: string;
  name: string;
  category: Category;
  monthlyLimit: number;
  amount: number; // Para compatibilidade (mesmo valor que monthlyLimit)
  spent: number;
  month: number;
  year: number;
  isActive: boolean;
  usage?: number;
  remaining?: number;
  isOverBudget?: boolean;
  overage?: number;
  recentTransactions?: Transaction[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateBudgetData {
  name: string;
  category: string;
  monthlyLimit: number;
  month: number;
  year: number;
}

// Category types
export interface Category {
  _id: string;
  id: string; // Para compatibilidade
  name: string;
  icon: string;
  color: string;
  type: 'income' | 'expense';
  userId?: string;
  isDefault: boolean;
  usage?: {
    transactions: number;
    budgets: number;
    total: number;
  };
  createdAt: string;
}

export interface CreateCategoryData {
  name: string;
  icon: string;
  color: string;
  type: 'income' | 'expense';
}

// API Response types - CORRIGIDOS
export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  errors?: any[];
}

// Tipo específico para resposta do GoalService baseado no log
export interface GoalApiResponse {
  data: {
    goal: Goal;
    success: boolean;
  };
  message: string;
  success: boolean;
}

export interface PaginatedResponse<T> extends ApiResponse<T> {
  pagination: {
    current: number;
    pages: number;
    total: number;
  };
}

// Summary types
export interface FinancialSummary {
  income: number;
  expense: number;
  incomeCount: number;
  expenseCount: number;
  balance: number;
}

export interface BudgetSummary {
  budgets: Budget[];
  totals: {
    budget: number;
    spent: number;
    remaining: number;
    usage: number;
    overBudgetCount: number;
    totalBudgets: number;
  };
  period: {
    month: number;
    year: number;
  };
}

export interface GoalStats {
  active: { count: number; totalTarget: number; totalCurrent: number };
  completed: { count: number; totalTarget: number; totalCurrent: number };
  paused: { count: number; totalTarget: number; totalCurrent: number };
  total: { count: number; totalTarget: number; totalCurrent: number; progress: number };
}

// Hook types
export interface UseTransactionsState {
  transactions: Transaction[];
  loading: boolean;
  error: string | null;
  pagination: {
    current: number;
    pages: number;
    total: number;
  };
}

// Chart data types
export interface ChartData {
  labels: string[];
  datasets: {
    data: number[];
    colors?: string[];
  }[];
}

export interface CategorySpendingData {
  category: Category;
  amount: number;
  count: number;
  percentage: number;
}

// Navigation types - CORRIGIDOS para consistência
export type RootStackParamList = {
  Auth: undefined;
  Main: undefined;
  Login: undefined;
  Register: undefined;
  ForgotPassword: undefined;
};

export type MainTabParamList = {
  Home: undefined;
  Transactions: undefined;
  Goals: undefined;
  Budgets: undefined;
  Reports: undefined;
  Profile: undefined;
};

export type TransactionStackParamList = {
  TransactionList: undefined;
  CreateTransaction: undefined;
  EditTransaction: { transactionId: string };
  TransactionDetail: { transactionId: string };
};

export type GoalStackParamList = {
  GoalList: undefined;
  CreateGoal: undefined;
  EditGoal: { goalId: string };
  GoalDetail: { goalId: string }; // CORRIGIDO para consistência
};

export type BudgetStackParamList = {
  BudgetList: undefined;
  CreateBudget: undefined;
  EditBudget: { budgetId: string };
  BudgetDetail: { budgetId: string }; // CORRIGIDO para consistência
};

export type CategoryStackParamList = {
  CategoryList: undefined;
  CreateCategory: undefined;
  EditCategory: { categoryId: string };
};

export type ProfileStackParamList = {
  Profile: undefined;
  Settings: undefined;
  EditProfile: undefined;
  Categories: undefined;
};

// Form types
export interface LoginFormData {
  email: string;
  password: string;
}

export interface RegisterFormData {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
}

export interface ForgotPasswordFormData {
  email: string;
}

// Filter types
export interface TransactionFilters {
  type?: 'income' | 'expense';
  category?: string;
  startDate?: string;
  endDate?: string;
  isRecurring?: boolean;
  page?: number;
  limit?: number;
}

// Notification types
export interface AppNotification {
  id: string;
  title: string;
  message: string;
  type: 'success' | 'error' | 'warning' | 'info';
  timestamp: string;
  read: boolean;
}

// Service method types para compatibilidade
export interface ServiceResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  errors?: any[];
}

// Métodos específicos que são usados no HomeScreen
export interface TransactionServiceMethods {
  getFinancialSummary(): Promise<FinancialSummary>;
  getRecentTransactions(limit: number): Promise<Transaction[]>;
  getTransactions(filters?: TransactionFilters): Promise<PaginatedResponse<Transaction[]>>;
  deleteTransaction(id: string): Promise<void>;
  duplicateTransaction(id: string): Promise<Transaction>;
}

export interface GoalServiceMethods {
  getActiveGoals(limit: number): Promise<Goal[]>;
  getGoal(id: string): Promise<ServiceResponse<Goal>>; // ADICIONADO
  addToGoal(id: string, amount: number): Promise<ServiceResponse<Goal>>; // CORRIGIDO
  pauseGoal(id: string): Promise<ServiceResponse<Goal>>; // CORRIGIDO
  resumeGoal(id: string): Promise<ServiceResponse<Goal>>; // CORRIGIDO
  completeGoal(id: string): Promise<ServiceResponse<Goal>>; // ADICIONADO
  deleteGoal(id: string): Promise<ServiceResponse<void>>; // CORRIGIDO
  createGoal(data: CreateGoalData): Promise<ServiceResponse<Goal>>; // ADICIONADO
  updateGoal(id: string, data: Partial<CreateGoalData>): Promise<ServiceResponse<Goal>>; // ADICIONADO
}

export interface BudgetServiceMethods {
  getCurrentBudgets(limit: number): Promise<Budget[]>;
  adjustBudgetLimit(id: string, newLimit: number): Promise<Budget>;
  deleteBudget(id: string): Promise<void>;
}