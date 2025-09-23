// src/navigation/BudgetNavigator.tsx
import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { BudgetListScreen } from '../screens/budgets/BudgetListScreen';
import { CreateEditBudgetScreen } from '../screens/budgets/CreateEditBudgetScreen';
import { BudgetDetailScreen } from '../screens/budgets/BudgetDetailScreen';
import { COLORS, FONTS } from '../constants';

export type BudgetStackParamList = {
  BudgetList: undefined;
  CreateBudget: undefined;
  EditBudget: { budgetId: string };
  BudgetDetail: { budgetId: string };
};

const Stack = createNativeStackNavigator<BudgetStackParamList>();

export const BudgetNavigator: React.FC = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: COLORS.primary,
        },
        headerTintColor: COLORS.white,
        headerTitleStyle: {
          fontFamily: FONTS.bold,
        },
      }}
    >
      <Stack.Screen 
        name="BudgetList" 
        component={BudgetListScreen}
        options={{ title: 'Orçamentos' }}
      />
      <Stack.Screen 
        name="CreateBudget" 
        component={CreateEditBudgetScreen}
        options={{ title: 'Novo Orçamento' }}
      />
      <Stack.Screen 
        name="EditBudget" 
        component={CreateEditBudgetScreen}
        options={{ title: 'Editar Orçamento' }}
      />
      <Stack.Screen 
        name="BudgetDetail" 
        component={BudgetDetailScreen}
        options={{ title: 'Detalhes do Orçamento' }}
      />
    </Stack.Navigator>
  );
};