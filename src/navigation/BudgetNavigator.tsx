import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { BudgetListScreen } from '../screens/budgets/BudgetListScreen';
import { CreateBudgetScreen } from '../screens/budgets/CreateBudgetScreen';
import { EditBudgetScreen } from '../screens/budgets/EditBudgetScreen';
import { BudgetDetailScreen } from '../screens/budgets/BudgetDetailScreen';
import { BudgetStackParamList } from './types';
import { COLORS, FONTS } from '../constants';

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
        component={CreateBudgetScreen}
        options={{ title: 'Novo Orçamento' }}
      />
      <Stack.Screen 
        name="EditBudget" 
        component={EditBudgetScreen}
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