// src/navigation/CategoryNavigator.tsx
import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { CategoryListScreen } from '../screens/categories/CategoryListScreen';
import { CreateCategoryScreen } from '../screens/categories/CreateCategoryScreen';
import { EditCategoryScreen } from '../screens/categories/EditCategoryScreen';
import { CategoryStackParamList } from '../types';
import { COLORS } from '../constants';

const Stack = createStackNavigator<CategoryStackParamList>();

export function CategoryNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: COLORS.primary,
        },
        headerTintColor: COLORS.white,
        headerTitleStyle: {
          fontWeight: 'bold',
        },
      }}
    >
      <Stack.Screen 
        name="CategoryList" 
        component={CategoryListScreen}
        options={{ title: 'Categorias' }}
      />
      <Stack.Screen 
        name="CreateCategory" 
        component={CreateCategoryScreen}
        options={{ title: 'Nova Categoria' }}
      />
      <Stack.Screen 
        name="EditCategory" 
        component={EditCategoryScreen}
        options={{ title: 'Editar Categoria' }}
      />
    </Stack.Navigator>
  );
}