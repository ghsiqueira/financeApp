// src/screens/budgets/index.ts
export { BudgetListScreen } from './BudgetListScreen';
export { CreateEditBudgetScreen } from './CreateEditBudgetScreen';
export { BudgetDetailScreen } from './BudgetDetailScreen';

// Types para navigation
export type BudgetStackParamList = {
  BudgetList: undefined;
  CreateBudget: undefined;
  EditBudget: { budgetId: string };
  BudgetDetail: { budgetId: string };
};