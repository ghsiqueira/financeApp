import { Transaction, Goal, Budget, Category } from '../types';

// Utilitário para mapear _id para id em objetos
export const mapIdField = <T extends { _id: string }>(item: T): T & { id: string } => ({
  ...item,
  id: item._id
});

// Utilitário para mapear arrays de objetos
export const mapArrayIds = <T extends { _id: string }>(items: T[]): (T & { id: string })[] => 
  items.map(mapIdField);

// Utilitários específicos para cada tipo
export const mapTransaction = (transaction: any): Transaction => ({
  ...transaction,
  id: transaction._id || transaction.id,
  _id: transaction._id || transaction.id,
});

export const mapGoal = (goal: any): Goal => ({
  ...goal,
  id: goal._id || goal.id,
  _id: goal._id || goal.id,
  name: goal.title || goal.name, // Mapear title para name também
  title: goal.title || goal.name, // Garantir que title existe
});

export const mapBudget = (budget: any): Budget => ({
  ...budget,
  id: budget._id || budget.id,
  _id: budget._id || budget.id,
  amount: budget.monthlyLimit || budget.amount, // Mapear monthlyLimit para amount
  monthlyLimit: budget.monthlyLimit || budget.amount, // Garantir que monthlyLimit existe
});

export const mapCategory = (category: any): Category => ({
  ...category,
  id: category._id || category.id,
  _id: category._id || category.id,
});

// Utilitário para calcular progresso de meta
export const calculateGoalProgress = (currentAmount: number, targetAmount: number): number => {
  if (targetAmount === 0) return 0;
  return Math.min((currentAmount / targetAmount) * 100, 100);
};

// Utilitário para calcular uso do orçamento
export const calculateBudgetUsage = (spent: number, limit: number): number => {
  if (limit === 0) return 0;
  return (spent / limit) * 100;
};

// Utilitário para determinar cor baseada no status
export const getStatusColor = (status: string): string => {
  switch (status.toLowerCase()) {
    case 'active':
    case 'success':
      return '#10B981';
    case 'warning':
    case 'paused':
      return '#F59E0B';
    case 'error':
    case 'overbudget':
      return '#EF4444';
    case 'completed':
      return '#8B5CF6';
    default:
      return '#6B7280';
  }
};

// Utilitário para gerar cores aleatórias
export const generateRandomColor = (): string => {
  const colors = [
    '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0',
    '#9966FF', '#FF9F40', '#FF6384', '#C9CBCF',
    '#4BC0C0', '#FF6384', '#36A2EB', '#FFCE56'
  ];
  return colors[Math.floor(Math.random() * colors.length)];
};

// Utilitário para validar valores monetários
export const isValidAmount = (amount: number): boolean => {
  return amount > 0 && amount <= 9999999.99;
};

// Utilitário para limpar dados numéricos
export const cleanNumericInput = (input: string): string => {
  return input.replace(/[^0-9.,]/g, '').replace(',', '.');
};

// Utilitário para converter string para número
export const parseAmount = (input: string): number => {
  const cleanInput = cleanNumericInput(input);
  const parsed = parseFloat(cleanInput);
  return isNaN(parsed) ? 0 : parsed;
};

// Utilitário para debounce
export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  wait: number
): ((...args: Parameters<T>) => void) => {
  let timeout: NodeJS.Timeout;
  
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
};