import React from 'react'
import { View, Text, StyleSheet } from 'react-native'
import { BaseToast, ErrorToast, ToastConfig, ToastConfigParams } from 'react-native-toast-message'

// Define styles BEFORE toastConfig to avoid "used before declaration" errors
const styles = StyleSheet.create({
  successToast: {
    borderLeftColor: '#34C759',
    backgroundColor: '#F0F9F0',
  },

  errorToast: {
    borderLeftColor: '#FF3B30',
    backgroundColor: '#FFF0F0',
  },

  infoToast: {
    borderLeftColor: '#007AFF',
    backgroundColor: '#F0F7FF',
  },

  warningToast: {
    borderLeftColor: '#FF9500',
    backgroundColor: '#FFF7F0',
  },

  contentContainer: {
    paddingHorizontal: 15,
  },

  text1: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1D1D1F',
  },

  text2: {
    fontSize: 14,
    fontWeight: '400',
    color: '#86868B',
  },

  customToast: {
    height: 'auto',
    minHeight: 70,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderLeftWidth: 5,
    marginHorizontal: 16,
    marginTop: 10,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },

  customContent: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 12,
    justifyContent: 'center',
  },

  customText1: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1D1D1F',
    marginBottom: 4,
  },

  customText2: {
    fontSize: 14,
    color: '#86868B',
    marginBottom: 8,
  },

  amount: {
    fontSize: 18,
    fontWeight: '700',
  },
})

export const toastConfig: ToastConfig = {
  success: (params: ToastConfigParams<any>) => (
    <BaseToast
      {...params}
      style={styles.successToast}
      contentContainerStyle={styles.contentContainer}
      text1Style={styles.text1}
      text2Style={styles.text2}
      text1NumberOfLines={2}
      text2NumberOfLines={3}
    />
  ),

  error: (params: ToastConfigParams<any>) => (
    <ErrorToast
      {...params}
      style={styles.errorToast}
      contentContainerStyle={styles.contentContainer}
      text1Style={styles.text1}
      text2Style={styles.text2}
      text1NumberOfLines={2}
      text2NumberOfLines={3}
    />
  ),

  info: (params: ToastConfigParams<any>) => (
    <BaseToast
      {...params}
      style={styles.infoToast}
      contentContainerStyle={styles.contentContainer}
      text1Style={styles.text1}
      text2Style={styles.text2}
      text1NumberOfLines={2}
      text2NumberOfLines={3}
    />
  ),

  warning: (params: ToastConfigParams<any>) => (
    <BaseToast
      {...params}
      style={styles.warningToast}
      contentContainerStyle={styles.contentContainer}
      text1Style={styles.text1}
      text2Style={styles.text2}
      text1NumberOfLines={2}
      text2NumberOfLines={3}
    />
  ),

  // Toast customizado para operações financeiras
  financial: (params: ToastConfigParams<any>) => (
    <View style={[styles.customToast, { borderLeftColor: '#007AFF' }]}>
      <View style={styles.customContent}>
        <Text style={styles.customText1}>{params.text1}</Text>
        {params.text2 && <Text style={styles.customText2}>{params.text2}</Text>}
        {params.props?.amount && (
          <Text style={[styles.amount, { color: params.props.type === 'income' ? '#34C759' : '#FF3B30' }]}>
            {params.props.type === 'income' ? '+' : '-'} R$ {params.props.amount}
          </Text>
        )}
      </View>
    </View>
  ),
}

// Funções helper para usar toast financeiro
export const showFinancialToast = {
  income: (amount: string, description?: string) => {
    import('react-native-toast-message').then(Toast => {
      Toast.default.show({
        type: 'financial',
        text1: 'Receita Adicionada',
        text2: description || 'Nova receita registrada com sucesso',
        props: {
          type: 'income',
          amount
        },
        visibilityTime: 3000,
      })
    })
  },

  expense: (amount: string, description?: string) => {
    import('react-native-toast-message').then(Toast => {
      Toast.default.show({
        type: 'financial',
        text1: 'Despesa Registrada',
        text2: description || 'Nova despesa registrada com sucesso',
        props: {
          type: 'expense',
          amount
        },
        visibilityTime: 3000,
      })
    })
  },

  budget: (message: string, type: 'warning' | 'error' = 'warning') => {
    import('react-native-toast-message').then(Toast => {
      Toast.default.show({
        type,
        text1: 'Alerta de Orçamento',
        text2: message,
        visibilityTime: 4000,
      })
    })
  },

  goal: (message: string) => {
    import('react-native-toast-message').then(Toast => {
      Toast.default.show({
        type: 'success',
        text1: 'Meta Atualizada',
        text2: message,
        visibilityTime: 3000,
      })
    })
  }
}
