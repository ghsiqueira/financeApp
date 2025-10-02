import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import ProfileScreen from '../screens/profile/ProfileScreen';
import EditProfileScreen from '../screens/profile/EditProfileScreen';
import ChangePasswordScreen from '../screens/auth/ChangePasswordScreen';
import { CategoryNavigator } from './CategoryNavigator';
import { ProfileStackParamList } from './types';

const Stack = createStackNavigator<ProfileStackParamList>();

export const ProfileNavigator: React.FC = () => {
  return (
    <Stack.Navigator 
      screenOptions={{ 
        headerShown: false,
        cardStyle: { backgroundColor: '#F5F5F5' }
      }}
    >
      <Stack.Screen 
        name="Profile" 
        component={ProfileScreen}
        options={{ title: 'Perfil' }}
      />
      <Stack.Screen 
        name="EditProfile" 
        component={EditProfileScreen}
        options={{ 
          title: 'Editar Perfil',
          presentation: 'modal'
        }}
      />
      <Stack.Screen 
        name="ChangePassword" 
        component={ChangePasswordScreen}
        options={{ 
          title: 'Alterar Senha',
          presentation: 'modal'
        }}
      />
      <Stack.Screen 
        name="Categories" 
        component={CategoryNavigator}
        options={{ 
          headerShown: false
        }}
      />
    </Stack.Navigator>
  );
};