export { GoalListScreen } from './GoalListScreen';
export { CreateEditGoalScreen as CreateGoalScreen } from './CreateEditGoalScreen';
export { CreateEditGoalScreen as EditGoalScreen } from './CreateEditGoalScreen';
export { GoalDetailScreen } from './GoalDetailScreen';

// Types para navigation
export type GoalStackParamList = {
  GoalList: undefined;
  CreateGoal: undefined;
  EditGoal: { goalId: string };
  GoalDetail: { goalId: string }; // Corrigido: usando GoalDetail consistentemente
};