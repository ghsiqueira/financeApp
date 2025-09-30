// src/navigation/GoalNavigator.tsx
import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { 
  GoalListScreen,
  CreateGoalScreen,
  EditGoalScreen,
  GoalDetailScreen 
} from '../screens/goals';
import { COLORS, FONTS } from '../constants';
import { ShareGoalScreen } from '../screens/goals/ShareGoalScreen';
import { SharedGoalsScreen } from '../screens/goals/SharedGoalsScreen';

export type GoalStackParamList = {
  GoalList: undefined;
  CreateGoal: undefined;
  EditGoal: { goalId: string };
  GoalDetail: { goalId: string };
  ShareGoal: { goalId: string; goalTitle: string }; // ✅ NOVO
  SharedGoals: undefined; // ✅ NOVO
};

const GoalStack = createNativeStackNavigator<GoalStackParamList>();

export const GoalNavigator: React.FC = () => {
  return (
    <GoalStack.Navigator
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
      <GoalStack.Screen 
        name="GoalList" 
        component={GoalListScreen}
        options={{ title: 'Metas' }}
      />
      <GoalStack.Screen 
        name="CreateGoal" 
        component={CreateGoalScreen}
        options={{ title: 'Nova Meta' }}
      />
      <GoalStack.Screen 
        name="EditGoal" 
        component={EditGoalScreen}
        options={{ title: 'Editar Meta' }}
      />
      <GoalStack.Screen 
        name="GoalDetail"  // ✅ CORRIGIDO: mudado de GoalDetails para GoalDetail
        component={GoalDetailScreen}
        options={{ 
          title: 'Detalhes da Meta',
          headerShown: false // O GoalDetailScreen tem header customizado
        }}
      />
      <GoalStack.Screen 
        name="ShareGoal"
        component={ShareGoalScreen}
        options={{ 
          title: 'Compartilhar Meta',
          headerShown: false 
        }}
      />
      <GoalStack.Screen 
        name="SharedGoals"
        component={SharedGoalsScreen}
        options={{ 
          title: 'Metas Compartilhadas',
          headerShown: false 
        }}
      />
    </GoalStack.Navigator>
  );
};