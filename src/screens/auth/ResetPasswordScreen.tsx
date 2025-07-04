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
import { RouteProp } from '@react-navigation/native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import Toast from 'react-native-toast-message'

import { useTheme } from '../../context/ThemeContext'
import { useAuth } from '../../context/AuthContext'
import { AuthStackParamList } from '../../navigation/AuthNavigator'
import Button from '../../components/common/Button'
import Input from '../../components/common/Input'

type ResetPasswordScreenNavigationProp = StackNavigationProp<AuthStackParamList, 'ResetPassword'>
type ResetPasswordScreenRouteProp = RouteProp<AuthStackParamList, 'ResetPassword'>

interface Props {
  navigation: ResetPasswordScreenNavigationProp
  route: ResetPasswordScreenRouteProp
}

export default function ResetPasswordScreen({ navigation, route }: Props) {
  const { theme } = useTheme()
  const { resetPassword } = useAuth()
  const { email } = route.params
  
  const [formData, setFormData] = useState({
    code: '',
    newPassword: '',
    confirmPassword: '',
  })
  const [errors, setErrors] = useState({
    code: '',
    newPassword: '',
    confirmPassword: '',
  })
  const [isLoading, setIsLoading] = useState(false)

  const validateForm = () => {
    const newErrors = { code: '', newPassword: '', confirmPassword: '' }
    let isValid = true

    // Validar código
    if (!formData.code.trim()) {
      newErrors.code = 'Código é obrigatório'
      isValid = false
    } else if (formData.code.trim().length !== 6) {
      newErrors.code = 'Código deve ter 6 dígitos'
      isValid = false
    } else if (!/^\d{6}$/.test(formData.code.trim())) {
      newErrors.code = 'Código deve conter apenas números'
      isValid = false
    }

    // Validar nova senha
    if (!formData.newPassword.trim()) {
      newErrors.newPassword = 'Nova senha é obrigatória'
      isValid = false
    } else if (formData.newPassword.length < 6) {
      newErrors.newPassword = 'Senha deve ter pelo menos 6 caracteres'
      isValid = false
    } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(formData.newPassword)) {
      newErrors.newPassword = 'Senha deve conter pelo menos: 1 maiúscula, 1 minúscula e 1 número'
      isValid = false
    }

    // Validar confirmação de senha
    if (!formData.confirmPassword.trim()) {
      newErrors.confirmPassword = 'Confirmação de senha é obrigatória'
      isValid = false
    } else if (formData.newPassword !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Senhas não conferem'
      isValid = false
    }

    setErrors(newErrors)
    return isValid
  }

  const handleResetPassword = async () => {
    if (!validateForm()) return

    try {
      setIsLoading(true)
      await resetPassword(email, formData.code.trim(), formData.newPassword)
      
      Toast.show({
        type: 'success',
        text1: 'Senha redefinida!',
        text2: 'Sua senha foi alterada com sucesso',
      })
      
      // Voltar para login
      navigation.navigate('Login')
    } catch (error: any) {
      Alert.alert(
        'Erro',
        error.message || 'Código inválido ou expirado. Tente novamente.',
        [{ text: 'OK' }]
      )
    } finally {
      setIsLoading(false)
    }
  }

  const handleInputChange = (field: keyof typeof formData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    // Limpar erro do campo quando usuário começar a digitar
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }
  }

  const formatCode = (text: string) => {
    // Permitir apenas números e limitar a 6 dígitos
    const numbers = text.replace(/[^0-9]/g, '').slice(0, 6)
    return numbers
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
    emailInfo: {
      fontSize: 14,
      color: theme.primary,
      fontWeight: '600',
      textAlign: 'center',
      marginTop: 8,
    },
    form: {
      flex: 1,
      paddingTop: 20,
    },
    inputContainer: {
      marginBottom: 20,
    },
    codeInput: {
      textAlign: 'center',
      fontSize: 24,
      fontWeight: '600',
      letterSpacing: 8,
    },
    resetButton: {
      marginTop: 12,
      marginBottom: 24,
    },
    resendContainer: {
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 32,
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
              <Ionicons name="key" size={60} color={theme.primary} />
            </View>
            
            <Text style={styles.title}>Redefinir senha</Text>
            <Text style={styles.subtitle}>
              Digite o código de 6 dígitos enviado para:
            </Text>
            <Text style={styles.emailInfo}>{email}</Text>
          </View>

          {/* Form */}
          <View style={styles.form}>
            <Input
              label="Código de verificação"
              placeholder="000000"
              keyboardType="numeric"
              maxLength={6}
              leftIcon="shield-checkmark"
              value={formData.code}
              onChangeText={(value) => handleInputChange('code', formatCode(value))}
              error={errors.code}
              containerStyle={styles.inputContainer}
              style={styles.codeInput}
              required
            />

            <Input
              label="Nova senha"
              placeholder="Digite sua nova senha"
              secureTextEntry
              leftIcon="lock-closed"
              value={formData.newPassword}
              onChangeText={(value) => handleInputChange('newPassword', value)}
              error={errors.newPassword}
              containerStyle={styles.inputContainer}
              required
            />

            <Input
              label="Confirmar nova senha"
              placeholder="Digite sua senha novamente"
              secureTextEntry
              leftIcon="lock-closed"
              value={formData.confirmPassword}
              onChangeText={(value) => handleInputChange('confirmPassword', value)}
              error={errors.confirmPassword}
              containerStyle={styles.inputContainer}
              required
            />

            <Button
              title="Redefinir senha"
              onPress={handleResetPassword}
              loading={isLoading}
              style={styles.resetButton}
              fullWidth
            />

            <View style={styles.resendContainer}>
              <Text style={styles.resendText}>Não recebeu o código?</Text>
              <TouchableOpacity onPress={() => navigation.goBack()}>
                <Text style={styles.resendLink}>Reenviar</Text>
              </TouchableOpacity>
            </View>
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