// src/navigation/ProfileNavigator.tsx
import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { 
  ProfileScreen,
  SettingsScreen,
  EditProfileScreen,
  CategoryListScreen,
  CreateCategoryScreen,
  EditCategoryScreen
} from '../screens/PlaceholderScreens';
import { COLORS, FONTS } from '../constants';

export type ProfileStackParamList = {
  Profile: undefined;
  Settings: undefined;
  EditProfile: undefined;
  Categories: undefined;
  CreateCategory: undefined;
  EditCategory: { categoryId: string };
};

const ProfileStack = createNativeStackNavigator<ProfileStackParamList>();

export const ProfileNavigator: React.FC = () => {
  return (
    <ProfileStack.Navigator
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
      <ProfileStack.Screen 
        name="Profile" 
        component={ProfileScreen}
        options={{ title: 'Perfil' }}
      />
      <ProfileStack.Screen 
        name="Settings" 
        component={SettingsScreen}
        options={{ title: 'Configurações' }}
      />
      <ProfileStack.Screen 
        name="EditProfile" 
        component={EditProfileScreen}
        options={{ title: 'Editar Perfil' }}
      />
      <ProfileStack.Screen 
        name="Categories" 
        component={CategoryListScreen}
        options={{ title: 'Categorias' }}
      />
      <ProfileStack.Screen 
        name="CreateCategory" 
        component={CreateCategoryScreen}
        options={{ title: 'Nova Categoria' }}
      />
      <ProfileStack.Screen 
        name="EditCategory" 
        component={EditCategoryScreen}
        options={{ title: 'Editar Categoria' }}
      />
    </ProfileStack.Navigator>
  );
};