// User types
export interface User {
  id: string;
  name: string;
  email: string;
  createdAt: string;
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

// Goal types
export interface Goal {
  _id: string;
  userId: string;
  title: string;
  description?: string;
  targetAmount: number;
  currentAmount: number;
  startDate: string;
  endDate: string;
  monthlyTarget: number;
  status: 'active' | 'completed' | 'paused';
  progress?: number;
  daysRemaining?: number;
  monthlyTargetRemaining?: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateGoalData {
  title: string;
  description?: string;
  targetAmount: number;
  startDate: string;
  endDate: string;
}

// Budget types
export interface Budget {
  _id: string;
  userId: string;
  name: string;
  category: Category;
  monthlyLimit: number;
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

// API Response types
export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  errors?: any[];
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

// Navigation types
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
  TransactionDetails: { transactionId: string };
};

export type GoalStackParamList = {
  GoalList: undefined;
  CreateGoal: undefined;
  EditGoal: { goalId: string };
  GoalDetails: { goalId: string };
};

export type BudgetStackParamList = {
  BudgetList: undefined;
  CreateBudget: undefined;
  EditBudget: { budgetId: string };
  BudgetDetails: { budgetId: string };
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
  total: number;
  count: number;
  avg: number;
  percentage: number;
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