// src/navigation/TransactionNavigator.tsx
import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { TransactionListScreen } from '../screens/transactions/TransactionListScreen';
import { CreateTransactionScreen } from '../screens/transactions/CreateTransactionScreen';
import { TransactionDetailScreen } from '../screens/transactions/TransactionDetailScreen';
import { EditTransactionScreen } from '../screens/transactions/EditTransactionScreen';
import { COLORS, FONTS } from '../constants';

export type TransactionStackParamList = {
  TransactionList: undefined;
  CreateTransaction: undefined;
  EditTransaction: { transactionId: string };
  TransactionDetails: { transactionId: string };
};

const Stack = createNativeStackNavigator<TransactionStackParamList>();

export const TransactionNavigator: React.FC = () => {
  return (
    <Stack.Navigator
      initialRouteName="TransactionList"
      screenOptions={{
        headerStyle: {
          backgroundColor: COLORS.primary,
        },
        headerTintColor: COLORS.white,
        headerTitleStyle: {
          fontFamily: FONTS.bold,
        },
        headerBackTitle: '',
      }}
    >
      <Stack.Screen 
        name="TransactionList" 
        component={TransactionListScreen}
        options={{ 
          title: 'Transações',
          headerShown: false,
        }}
      />
      <Stack.Screen 
        name="CreateTransaction" 
        component={CreateTransactionScreen}
        options={{ 
          title: 'Nova Transação',
          headerShown: false,
          presentation: 'modal',
        }}
      />
      <Stack.Screen 
        name="EditTransaction" 
        component={EditTransactionScreen}
        options={{ 
          title: 'Editar Transação',
          headerShown: false,
        }}
      />
      <Stack.Screen 
        name="TransactionDetails" 
        component={TransactionDetailScreen}
        options={{ 
          title: 'Detalhes da Transação',
          headerShown: false,
        }}
      />
    </Stack.Navigator>
  );
};