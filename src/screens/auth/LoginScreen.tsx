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

type LoginScreenNavigationProp = StackNavigationProp<AuthStackParamList, 'Login'>

interface Props {
  navigation: LoginScreenNavigationProp
}

export default function LoginScreen({ navigation }: Props) {
  const { theme } = useTheme()
  const { signIn, isLoading } = useAuth()
  
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  })
  const [errors, setErrors] = useState({
    email: '',
    password: '',
  })

  const validateForm = () => {
    const newErrors = { email: '', password: '' }
    let isValid = true

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
    }

    setErrors(newErrors)
    return isValid
  }

  const handleLogin = async () => {
    if (!validateForm()) return

    try {
      await signIn(formData.email.trim(), formData.password)
      Toast.show({
        type: 'success',
        text1: 'Login realizado com sucesso!',
        text2: 'Bem-vindo de volta!',
      })
    } catch (error: any) {
      Alert.alert(
        'Erro no Login',
        error.message || 'Credenciais inválidas. Tente novamente.',
        [{ text: 'OK' }]
      )
    }
  }

  const handleInputChange = (field: keyof typeof formData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    // Limpar erro do campo quando usuário começar a digitar
    if (errors[field]) {
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
      paddingTop: 60,
      paddingBottom: 40,
    },
    logo: {
      marginBottom: 24,
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
      marginBottom: 20,
    },
    forgotPassword: {
      alignSelf: 'flex-end',
      marginBottom: 32,
    },
    forgotPasswordText: {
      fontSize: 14,
      color: theme.primary,
      fontWeight: '500',
    },
    loginButton: {
      marginBottom: 24,
    },
    divider: {
      flexDirection: 'row',
      alignItems: 'center',
      marginVertical: 24,
    },
    dividerLine: {
      flex: 1,
      height: 1,
      backgroundColor: theme.border,
    },
    dividerText: {
      marginHorizontal: 16,
      fontSize: 14,
      color: theme.textSecondary,
    },
    socialButtons: {
      gap: 12,
      marginBottom: 32,
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
    registerLink: {
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
            <View style={styles.logo}>
              <Ionicons name="wallet" size={60} color={theme.primary} />
            </View>
            <Text style={styles.title}>Bem-vindo de volta!</Text>
            <Text style={styles.subtitle}>
              Faça login para acessar sua conta
            </Text>
          </View>

          {/* Form */}
          <View style={styles.form}>
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

            <TouchableOpacity 
              style={styles.forgotPassword}
              onPress={() => navigation.navigate('ForgotPassword')}
            >
              <Text style={styles.forgotPasswordText}>
                Esqueceu sua senha?
              </Text>
            </TouchableOpacity>

            <Button
              title="Entrar"
              onPress={handleLogin}
              loading={isLoading}
              style={styles.loginButton}
              fullWidth
            />

            {/* Divider */}
            <View style={styles.divider}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>ou continue com</Text>
              <View style={styles.dividerLine} />
            </View>

            {/* Social Login Buttons */}
            <View style={styles.socialButtons}>
              <Button
                title="Continuar com Google"
                variant="outline"
                icon="logo-google"
                onPress={() => {
                  Toast.show({
                    type: 'info',
                    text1: 'Em breve!',
                    text2: 'Login social será implementado em breve',
                  })
                }}
                fullWidth
              />
              <Button
                title="Continuar com Apple"
                variant="outline"
                icon="logo-apple"
                onPress={() => {
                  Toast.show({
                    type: 'info',
                    text1: 'Em breve!',
                    text2: 'Login social será implementado em breve',
                  })
                }}
                fullWidth
              />
            </View>
          </View>

          {/* Footer */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>Não tem uma conta?</Text>
            <TouchableOpacity onPress={() => navigation.navigate('Register')}>
              <Text style={styles.registerLink}>Criar conta</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}