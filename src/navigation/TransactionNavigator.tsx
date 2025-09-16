import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { TransactionListScreen } from '../screens/transactions/TransactionListScreen';
import { CreateTransactionScreen } from '../screens/transactions/CreateTransactionScreen';
import { EditTransactionScreen } from '../screens/transactions/EditTransactionScreen';
import { TransactionDetailScreen } from '../screens/transactions/TransactionDetailScreen';
import { TransactionStackParamList } from './types';
import { COLORS, FONTS } from '../constants';

const Stack = createNativeStackNavigator<TransactionStackParamList>();

export const TransactionNavigator: React.FC = () => {
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
        name="TransactionList" 
        component={TransactionListScreen}
        options={{ title: 'Transações' }}
      />
      <Stack.Screen 
        name="CreateTransaction" 
        component={CreateTransactionScreen}
        options={{ title: 'Nova Transação' }}
      />
      <Stack.Screen 
        name="EditTransaction" 
        component={EditTransactionScreen}
        options={{ title: 'Editar Transação' }}
      />
      <Stack.Screen 
        name="TransactionDetail" 
        component={TransactionDetailScreen}
        options={{ title: 'Detalhes da Transação' }}
      />
    </Stack.Navigator>
  );
};