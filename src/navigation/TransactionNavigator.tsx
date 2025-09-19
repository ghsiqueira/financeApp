import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { TransactionListScreen } from '../screens/transactions/TransactionListScreen'; // USAR A TELA REAL
import { CreateTransactionScreen } from '../screens/transactions/CreateTransactionScreen';
import { 
  EditTransactionScreen,
  TransactionDetailScreen
} from '../screens/PlaceholderScreens';
import { COLORS, FONTS } from '../constants';

export type TransactionStackParamList = {
  TransactionList: undefined;
  CreateTransaction: undefined;
  EditTransaction: { transactionId: string };
  TransactionDetails: { transactionId: string };
};

const TransactionStack = createNativeStackNavigator<TransactionStackParamList>();

export const TransactionNavigator: React.FC = () => {
  return (
    <TransactionStack.Navigator
      initialRouteName="TransactionList" // DEFINIR TELA INICIAL
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
      <TransactionStack.Screen 
        name="TransactionList" 
        component={TransactionListScreen}
        options={{ title: 'Transações' }}
      />
      <TransactionStack.Screen 
        name="CreateTransaction" 
        component={CreateTransactionScreen}
        options={{ title: 'Nova Transação' }}
      />
      <TransactionStack.Screen 
        name="EditTransaction" 
        component={EditTransactionScreen}
        options={{ title: 'Editar Transação' }}
      />
      <TransactionStack.Screen 
        name="TransactionDetails" 
        component={TransactionDetailScreen}
        options={{ title: 'Detalhes da Transação' }}
      />
    </TransactionStack.Navigator>
  );
};