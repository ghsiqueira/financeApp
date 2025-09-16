import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { GoalListScreen } from '../screens/goals/GoalListScreen';
import { CreateGoalScreen } from '../screens/goals/CreateGoalScreen';
import { EditGoalScreen } from '../screens/goals/EditGoalScreen';
import { GoalDetailScreen } from '../screens/goals/GoalDetailScreen';
import { GoalStackParamList } from './types';
import { COLORS, FONTS } from '../constants';

const Stack = createNativeStackNavigator<GoalStackParamList>();

export const GoalNavigator: React.FC = () => {
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
        name="GoalList" 
        component={GoalListScreen}
        options={{ title: 'Metas' }}
      />
      <Stack.Screen 
        name="CreateGoal" 
        component={CreateGoalScreen}
        options={{ title: 'Nova Meta' }}
      />
      <Stack.Screen 
        name="EditGoal" 
        component={EditGoalScreen}
        options={{ title: 'Editar Meta' }}
      />
      <Stack.Screen 
        name="GoalDetail" 
        component={GoalDetailScreen}
        options={{ title: 'Detalhes da Meta' }}
      />
    </Stack.Navigator>
  );
};