// src/navigation/ProfileNavigator.tsx
import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { 
  ProfileScreen,
  SettingsScreen,
  EditProfileScreen,
} from '../screens/PlaceholderScreens';
import { CategoryNavigator } from './CategoryNavigator';
import { COLORS, FONTS } from '../constants';

export type ProfileStackParamList = {
  Profile: undefined;
  Settings: undefined;
  EditProfile: undefined;
  Categories: undefined;
};

const Stack = createNativeStackNavigator<ProfileStackParamList>();

export const ProfileNavigator: React.FC = () => {
  return (
    <Stack.Navigator
      initialRouteName="Profile"
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
        name="Profile" 
        component={ProfileScreen}
        options={{ 
          title: 'Perfil',
          headerShown: false,
          contentStyle: {
            backgroundColor: COLORS.background,
          },
        }}
      />
      <Stack.Screen 
        name="Settings" 
        component={SettingsScreen}
        options={{ 
          title: 'Configurações',
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
      <Stack.Screen 
        name="EditProfile" 
        component={EditProfileScreen}
        options={{ 
          title: 'Editar Perfil',
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
      <Stack.Screen 
        name="Categories" 
        component={CategoryNavigator}
        options={{ 
          title: 'Categorias',
          headerShown: false,
          presentation: 'card',
          contentStyle: {
            backgroundColor: COLORS.background,
          },
        }}
      />
    </Stack.Navigator>
  );
};