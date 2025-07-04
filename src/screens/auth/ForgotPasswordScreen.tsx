import React, { useState } from 'react'
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
  Alert,
} from 'react-native'
import { StackNavigationProp } from '@react-navigation/stack'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import Toast from 'react-native-toast-message'

import { useTheme } from '../../context/ThemeContext'
import { useAuth } from '../../context/AuthContext'
import { AuthStackParamList } from '../../navigation/AuthNavigator'
import Button from '../../components/common/Button'
import Input from '../../components/common/Input'

type ForgotPasswordScreenNavigationProp = StackNavigationProp<AuthStackParamList, 'ForgotPassword'>

interface Props {
  navigation: ForgotPasswordScreenNavigationProp
}

export default function ForgotPasswordScreen({ navigation }: Props) {
  const { theme } = useTheme()
  const { forgotPassword } = useAuth()
  
  const [email, setEmail] = useState('')
  const [emailError, setEmailError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [emailSent, setEmailSent] = useState(false)

  const validateEmail = () => {
    if (!email.trim()) {
      setEmailError('Email é obrigatório')
      return false
    }
    
    if (!/\S+@\S+\.\S+/.test(email)) {
      setEmailError('Email inválido')
      return false
    }
    
    setEmailError('')
    return true
  }

  const handleSendCode = async () => {
    if (!validateEmail()) return

    try {
      setIsLoading(true)
      await forgotPassword(email.trim())
      setEmailSent(true)
      
      Toast.show({
        type: 'success',
        text1: 'Código enviado!',
        text2: 'Verifique sua caixa de entrada',
      })
    } catch (error: any) {
      Alert.alert(
        'Erro',
        error.message || 'Não foi possível enviar o código. Tente novamente.',
        [{ text: 'OK' }]
      )
    } finally {
      setIsLoading(false)
    }
  }

  const handleGoToReset = () => {
    navigation.navigate('ResetPassword', { email: email.trim() })
  }

  const handleEmailChange = (value: string) => {
    setEmail(value)
    if (emailError) {
      setEmailError('')
    }
  }

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.background,
    },
    content: {
      flex: 1,
      paddingHorizontal: 24,
    },
    header: {
      alignItems: 'center',
      paddingTop: 40,
      paddingBottom: 40,
    },
    backButton: {
      position: 'absolute',
      left: 0,
      top: 40,
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: theme.surface,
      alignItems: 'center',
      justifyContent: 'center',
    },
    icon: {
      marginBottom: 24,
    },
    title: {
      fontSize: 28,
      fontWeight: 'bold',
      color: theme.text,
      marginBottom: 12,
      textAlign: 'center',
    },
    subtitle: {
      fontSize: 16,
      color: theme.textSecondary,
      textAlign: 'center',
      lineHeight: 24,
    },
    form: {
      flex: 1,
      paddingTop: 20,
    },
    inputContainer: {
      marginBottom: 24,
    },
    actionButton: {
      marginBottom: 20,
    },
    successContainer: {
      alignItems: 'center',
      paddingVertical: 32,
    },
    successIcon: {
      marginBottom: 24,
    },
    successTitle: {
      fontSize: 24,
      fontWeight: 'bold',
      color: theme.text,
      marginBottom: 12,
      textAlign: 'center',
    },
    successMessage: {
      fontSize: 16,
      color: theme.textSecondary,
      textAlign: 'center',
      lineHeight: 24,
      marginBottom: 8,
    },
    emailDisplay: {
      fontSize: 16,
      color: theme.primary,
      fontWeight: '600',
      textAlign: 'center',
      marginBottom: 32,
    },
    resendContainer: {
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
      marginTop: 20,
    },
    resendText: {
      fontSize: 14,
      color: theme.textSecondary,
    },
    resendLink: {
      fontSize: 14,
      color: theme.primary,
      fontWeight: '600',
      marginLeft: 4,
    },
    footer: {
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
      paddingBottom: 24,
    },
    footerText: {
      fontSize: 14,
      color: theme.textSecondary,
    },
    loginLink: {
      fontSize: 14,
      color: theme.primary,
      fontWeight: '600',
      marginLeft: 4,
    },
  })

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        style={{ flex: 1 }} 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView 
          style={styles.content}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity 
              style={styles.backButton}
              onPress={() => navigation.goBack()}
            >
              <Ionicons name="arrow-back" size={24} color={theme.text} />
            </TouchableOpacity>
            
            <View style={styles.icon}>
              <Ionicons 
                name={emailSent ? "checkmark-circle" : "lock-closed"} 
                size={60} 
                color={emailSent ? theme.success : theme.primary} 
              />
            </View>
            
            <Text style={styles.title}>
              {emailSent ? 'Código enviado!' : 'Esqueceu sua senha?'}
            </Text>
            
            <Text style={styles.subtitle}>
              {emailSent 
                ? 'Enviamos um código de 6 dígitos para seu email. Use este código para redefinir sua senha.'
                : 'Não se preocupe! Digite seu email e enviaremos um código para redefinir sua senha.'
              }
            </Text>
          </View>

          {/* Form */}
          <View style={styles.form}>
            {emailSent ? (
              // Success State
              <View style={styles.successContainer}>
                <Text style={styles.successMessage}>
                  Código enviado para:
                </Text>
                <Text style={styles.emailDisplay}>
                  {email}
                </Text>
                
                <Button
                  title="Inserir código"
                  onPress={handleGoToReset}
                  style={styles.actionButton}
                  fullWidth
                />
                
                <View style={styles.resendContainer}>
                  <Text style={styles.resendText}>Não recebeu o código?</Text>
                  <TouchableOpacity onPress={handleSendCode}>
                    <Text style={styles.resendLink}>Reenviar</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              // Initial State
              <>
                <Input
                  label="Email"
                  placeholder="Digite seu email"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  leftIcon="mail"
                  value={email}
                  onChangeText={handleEmailChange}
                  error={emailError}
                  containerStyle={styles.inputContainer}
                  required
                />

                <Button
                  title="Enviar código"
                  onPress={handleSendCode}
                  loading={isLoading}
                  style={styles.actionButton}
                  fullWidth
                />
              </>
            )}
          </View>

          {/* Footer */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>Lembrou da senha?</Text>
            <TouchableOpacity onPress={() => navigation.navigate('Login')}>
              <Text style={styles.loginLink}>Fazer login</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}