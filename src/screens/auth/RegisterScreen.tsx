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

type RegisterScreenNavigationProp = StackNavigationProp<AuthStackParamList, 'Register'>

interface Props {
  navigation: RegisterScreenNavigationProp
}

export default function RegisterScreen({ navigation }: Props) {
  const { theme } = useTheme()
  const { signUp, isLoading } = useAuth()
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  })
  const [errors, setErrors] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  })
  const [acceptedTerms, setAcceptedTerms] = useState(false)

  const validateForm = () => {
    const newErrors = { name: '', email: '', password: '', confirmPassword: '' }
    let isValid = true

    // Validar nome
    if (!formData.name.trim()) {
      newErrors.name = 'Nome é obrigatório'
      isValid = false
    } else if (formData.name.trim().length < 2) {
      newErrors.name = 'Nome deve ter pelo menos 2 caracteres'
      isValid = false
    }

    // Validar email
    if (!formData.email.trim()) {
      newErrors.email = 'Email é obrigatório'
      isValid = false
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email inválido'
      isValid = false
    }

    // Validar senha
    if (!formData.password.trim()) {
      newErrors.password = 'Senha é obrigatória'
      isValid = false
    } else if (formData.password.length < 6) {
      newErrors.password = 'Senha deve ter pelo menos 6 caracteres'
      isValid = false
    } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(formData.password)) {
      newErrors.password = 'Senha deve conter pelo menos: 1 maiúscula, 1 minúscula e 1 número'
      isValid = false
    }

    // Validar confirmação de senha
    if (!formData.confirmPassword.trim()) {
      newErrors.confirmPassword = 'Confirmação de senha é obrigatória'
      isValid = false
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Senhas não conferem'
      isValid = false
    }

    // Validar termos
    if (!acceptedTerms) {
      Alert.alert('Termos de Uso', 'Você deve aceitar os termos de uso para continuar')
      isValid = false
    }

    setErrors(newErrors)
    return isValid
  }

  const handleRegister = async () => {
    if (!validateForm()) return

    try {
      await signUp(formData.name.trim(), formData.email.trim(), formData.password)
      Toast.show({
        type: 'success',
        text1: 'Conta criada com sucesso!',
        text2: 'Bem-vindo ao Finance App!',
      })
    } catch (error: any) {
      Alert.alert(
        'Erro no Cadastro',
        error.message || 'Não foi possível criar sua conta. Tente novamente.',
        [{ text: 'OK' }]
      )
    }
  }

  const handleInputChange = (field: keyof typeof formData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    // Limpar erro do campo quando usuário começar a digitar
    if (errors[field as keyof typeof errors]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
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
      paddingBottom: 32,
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
    logo: {
      marginBottom: 20,
    },
    title: {
      fontSize: 28,
      fontWeight: 'bold',
      color: theme.text,
      marginBottom: 8,
    },
    subtitle: {
      fontSize: 16,
      color: theme.textSecondary,
      textAlign: 'center',
    },
    form: {
      flex: 1,
    },
    inputContainer: {
      marginBottom: 16,
    },
    termsContainer: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      marginBottom: 24,
      paddingHorizontal: 4,
    },
    checkbox: {
      width: 20,
      height: 20,
      borderRadius: 4,
      borderWidth: 2,
      marginRight: 12,
      marginTop: 2,
      alignItems: 'center',
      justifyContent: 'center',
    },
    termsText: {
      flex: 1,
      fontSize: 14,
      color: theme.textSecondary,
      lineHeight: 20,
    },
    termsLink: {
      color: theme.primary,
      fontWeight: '500',
    },
    registerButton: {
      marginBottom: 24,
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
            
            <View style={styles.logo}>
              <Ionicons name="wallet" size={50} color={theme.primary} />
            </View>
            <Text style={styles.title}>Criar conta</Text>
            <Text style={styles.subtitle}>
              Preencha seus dados para começar
            </Text>
          </View>

          {/* Form */}
          <View style={styles.form}>
            <Input
              label="Nome completo"
              placeholder="Digite seu nome"
              autoCapitalize="words"
              autoCorrect={false}
              leftIcon="person"
              value={formData.name}
              onChangeText={(value) => handleInputChange('name', value)}
              error={errors.name}
              containerStyle={styles.inputContainer}
              required
            />

            <Input
              label="Email"
              placeholder="Digite seu email"
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              leftIcon="mail"
              value={formData.email}
              onChangeText={(value) => handleInputChange('email', value)}
              error={errors.email}
              containerStyle={styles.inputContainer}
              required
            />

            <Input
              label="Senha"
              placeholder="Digite sua senha"
              secureTextEntry
              leftIcon="lock-closed"
              value={formData.password}
              onChangeText={(value) => handleInputChange('password', value)}
              error={errors.password}
              containerStyle={styles.inputContainer}
              required
            />

            <Input
              label="Confirmar senha"
              placeholder="Digite sua senha novamente"
              secureTextEntry
              leftIcon="lock-closed"
              value={formData.confirmPassword}
              onChangeText={(value) => handleInputChange('confirmPassword', value)}
              error={errors.confirmPassword}
              containerStyle={styles.inputContainer}
              required
            />

            {/* Terms and Conditions */}
            <View style={styles.termsContainer}>
              <TouchableOpacity 
                style={[
                  styles.checkbox,
                  {
                    borderColor: acceptedTerms ? theme.primary : theme.border,
                    backgroundColor: acceptedTerms ? theme.primary : 'transparent',
                  }
                ]}
                onPress={() => setAcceptedTerms(!acceptedTerms)}
              >
                {acceptedTerms && (
                  <Ionicons name="checkmark" size={14} color="#FFFFFF" />
                )}
              </TouchableOpacity>
              
              <Text style={styles.termsText}>
                Eu aceito os{' '}
                <TouchableOpacity onPress={() => {
                  Alert.alert('Termos de Uso', 'Os termos de uso serão implementados em breve.')
                }}>
                  <Text style={styles.termsLink}>Termos de Uso</Text>
                </TouchableOpacity>
                {' '}e a{' '}
                <TouchableOpacity onPress={() => {
                  Alert.alert('Política de Privacidade', 'A política de privacidade será implementada em breve.')
                }}>
                  <Text style={styles.termsLink}>Política de Privacidade</Text>
                </TouchableOpacity>
              </Text>
            </View>

            <Button
              title="Criar conta"
              onPress={handleRegister}
              loading={isLoading}
              style={styles.registerButton}
              fullWidth
            />
          </View>

          {/* Footer */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>Já tem uma conta?</Text>
            <TouchableOpacity onPress={() => navigation.navigate('Login')}>
              <Text style={styles.loginLink}>Fazer login</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}