// src/navigation/CategoryNavigator.tsx
import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { CategoryListScreen } from '../screens/categories/CategoryListScreen';
import { CreateCategoryScreen } from '../screens/categories/CreateCategoryScreen';

export type CategoryStackParamList = {
  CategoryList: undefined;
  CreateCategory: undefined;
  EditCategory: { categoryId: string };
};

const Stack = createStackNavigator<CategoryStackParamList>();

export const CategoryNavigator: React.FC = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="CategoryList" component={CategoryListScreen} />
      <Stack.Screen name="CreateCategory" component={CreateCategoryScreen} />
      <Stack.Screen name="EditCategory" component={CreateCategoryScreen} />
    </Stack.Navigator>
  );
};