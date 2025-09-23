// src/navigation/CategoryNavigator.tsx
import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { CategoryListScreen } from '../screens/categories/CategoryListScreen';
import { CreateCategoryScreen } from '../screens/categories/CreateCategoryScreen';
import { EditCategoryScreen } from '../screens/categories/EditCategoryScreen';
import { COLORS, FONTS } from '../constants';

export type CategoryStackParamList = {
  CategoryList: undefined;
  CreateCategory: undefined;
  EditCategory: { categoryId: string };
};

const Stack = createNativeStackNavigator<CategoryStackParamList>();

export const CategoryNavigator: React.FC = () => {
  return (
    <Stack.Navigator
      initialRouteName="CategoryList"
      screenOptions={{
        headerStyle: {
          backgroundColor: COLORS.primary,
        },
        headerTintColor: COLORS.white,
        headerTitleStyle: {
          fontFamily: FONTS.bold,
          fontSize: 18,
        },
        headerBackTitle: '',
        headerShadowVisible: true,
        contentStyle: {
          backgroundColor: COLORS.background,
        },
      }}
    >
      <Stack.Screen 
        name="CategoryList" 
        component={CategoryListScreen}
        options={{ 
          title: 'Categorias',
          headerShown: true,
          headerLargeTitle: false,
        }}
      />
      <Stack.Screen 
        name="CreateCategory" 
        component={CreateCategoryScreen}
        options={{ 
          title: 'Nova Categoria',
          headerShown: true,
          presentation: 'modal',
          headerStyle: {
            backgroundColor: COLORS.primary,
          },
          headerTintColor: COLORS.white,
          headerTitleStyle: {
            fontFamily: FONTS.bold,
            fontSize: 18,
          },
        }}
      />
      <Stack.Screen 
        name="EditCategory" 
        component={EditCategoryScreen}
        options={{ 
          title: 'Editar Categoria',
          headerShown: true,
          headerStyle: {
            backgroundColor: COLORS.primary,
          },
          headerTintColor: COLORS.white,
          headerTitleStyle: {
            fontFamily: FONTS.bold,
            fontSize: 18,
          },
        }}
      />
    </Stack.Navigator>
  );
};