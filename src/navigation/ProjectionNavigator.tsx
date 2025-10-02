import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import ProjectionsScreen from '../screens/projections/ProjectionsScreen';
import { COLORS, FONTS } from '../constants';

export type ProjectionStackParamList = {
  ProjectionList: undefined;
};

const Stack = createStackNavigator<ProjectionStackParamList>();

export const ProjectionNavigator: React.FC = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen
        name="ProjectionList"
        component={ProjectionsScreen}
        options={{
          headerShown: false, 
        }}
      />
    </Stack.Navigator>
  );
};