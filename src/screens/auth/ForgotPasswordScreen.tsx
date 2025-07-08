import React, { useState, useEffect } from 'react'
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
  Alert,
  Animated,
} from 'react-native'
import { StackNavigationProp } from '@react-navigation/stack'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import Toast from 'react-native-toast-message'

import { useTheme } from '../../context/ThemeContext'
import { useAuthMutation } from '../../hooks/useApi'
import { AuthStackParamList } from '../../navigation/AuthNavigator'
import Button from '../../components/common/Button'
import Input from '../../components/common/Input'

type ForgotPasswordScreenNavigationProp = StackNavigationProp<AuthStackParamList, 'ForgotPassword'>

interface Props {
  navigation: ForgotPasswordScreenNavigationProp
}

export default function ForgotPasswordScreen({ navigation }: Props) {
  const { theme } = useTheme()
  const { forgotPassword } = useAuthMutation()
  
  const [email, setEmail] = useState('')
  const [emailError, setEmailError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [emailSent, setEmailSent] = useState(false)
  
  // Animações
  const scaleAnimation = new Animated.Value(1)
  const fadeAnimation = new Animated.Value(0)
  const slideAnimation = new Animated.Value(0)

  useEffect(() => {
    if (emailSent) {
      // Animação de sucesso
      Animated.sequence([
        Animated.timing(scaleAnimation, {
          toValue: 1.1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnimation, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start()

      Animated.timing(fadeAnimation, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }).start()

      Animated.timing(slideAnimation, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }).start()
    }
  }, [emailSent])

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

  const handleResendCode = async () => {
    try {
      setIsLoading(true)
      await forgotPassword(email.trim())
      
      Toast.show({
        type: 'success',
        text1: 'Código reenviado!',
        text2: 'Verifique sua caixa de entrada novamente',
      })
      
    } catch (error: any) {
      Alert.alert('Erro', 'Não foi possível reenviar o código.')
    } finally {
      setIsLoading(false)
    }
  }

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.background,
    },
    gradientOverlay: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      height: 300,
      backgroundColor: `${theme.primary}15`,
      borderBottomLeftRadius: 50,
      borderBottomRightRadius: 50,
    },
    content: {
      flex: 1,
      paddingHorizontal: 24,
    },
    header: {
      alignItems: 'center',
      paddingTop: 80,
      paddingBottom: 60,
      position: 'relative',
    },
    backButton: {
      position: 'absolute',
      left: 0,
      top: 80,
      width: 48,
      height: 48,
      borderRadius: 24,
      backgroundColor: theme.surface,
      alignItems: 'center',
      justifyContent: 'center',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.15,
      shadowRadius: 12,
      elevation: 8,
      borderWidth: 1,
      borderColor: theme.border,
    },
    iconContainer: {
      width: 120,
      height: 120,
      borderRadius: 60,
      backgroundColor: emailSent ? theme.success : theme.primary,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 32,
      shadowColor: emailSent ? theme.success : theme.primary,
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.4,
      shadowRadius: 16,
      elevation: 12,
    },
    iconRing: {
      position: 'absolute',
      width: 140,
      height: 140,
      borderRadius: 70,
      borderWidth: 2,
      borderColor: emailSent ? theme.success + '30' : theme.primary + '30',
    },
    iconRingOuter: {
      position: 'absolute',
      width: 160,
      height: 160,
      borderRadius: 80,
      borderWidth: 1,
      borderColor: emailSent ? theme.success + '20' : theme.primary + '20',
    },
    title: {
      fontSize: 36,
      fontWeight: '800',
      color: theme.text,
      marginBottom: 16,
      textAlign: 'center',
      letterSpacing: -0.5,
    },
    subtitle: {
      fontSize: 17,
      color: theme.textSecondary,
      textAlign: 'center',
      lineHeight: 26,
      paddingHorizontal: 20,
      fontWeight: '400',
    },
    form: {
      flex: 1,
      paddingTop: 20,
    },
    inputContainer: {
      marginBottom: 32,
    },
    actionButton: {
      marginTop: 8,
      marginBottom: 24,
      borderRadius: 16,
      height: 56,
      shadowColor: theme.primary,
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.3,
      shadowRadius: 12,
      elevation: 8,
    },
    successContainer: {
      backgroundColor: theme.surface,
      borderRadius: 24,
      padding: 32,
      marginBottom: 20,
      borderWidth: 1,
      borderColor: theme.border,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.1,
      shadowRadius: 20,
      elevation: 10,
    },
    successHeader: {
      alignItems: 'center',
      marginBottom: 24,
    },
    successIcon: {
      width: 64,
      height: 64,
      borderRadius: 32,
      backgroundColor: theme.success + '20',
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 16,
    },
    successTitle: {
      fontSize: 24,
      fontWeight: '700',
      color: theme.text,
      textAlign: 'center',
      marginBottom: 8,
    },
    successMessage: {
      fontSize: 16,
      color: theme.textSecondary,
      textAlign: 'center',
      lineHeight: 24,
      fontWeight: '400',
    },
    emailCard: {
      backgroundColor: theme.primary + '10',
      borderRadius: 16,
      padding: 20,
      marginVertical: 24,
      borderWidth: 1,
      borderColor: theme.primary + '20',
      alignItems: 'center',
    },
    emailLabel: {
      fontSize: 14,
      color: theme.textSecondary,
      marginBottom: 8,
      fontWeight: '500',
    },
    emailText: {
      fontSize: 18,
      color: theme.primary,
      fontWeight: '600',
      textAlign: 'center',
    },
    continueButton: {
      backgroundColor: theme.primary,
      borderRadius: 16,
      height: 56,
      marginBottom: 24,
      shadowColor: theme.primary,
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.3,
      shadowRadius: 12,
      elevation: 8,
    },
    resendContainer: {
      backgroundColor: theme.surface,
      borderRadius: 16,
      paddingVertical: 16,
      paddingHorizontal: 24,
      borderWidth: 1,
      borderColor: theme.border,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
    },
    resendText: {
      fontSize: 15,
      color: theme.textSecondary,
      fontWeight: '400',
    },
    resendLink: {
      fontSize: 15,
      color: theme.primary,
      fontWeight: '600',
      marginLeft: 8,
    },
    footer: {
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
      paddingVertical: 16,
      paddingHorizontal: 32,
    },
    footerText: {
      fontSize: 15,
      color: theme.textSecondary,
      fontWeight: '400',
    },
    loginLink: {
      fontSize: 15,
      color: theme.primary,
      fontWeight: '600',
      marginLeft: 8,
    },
    // Estilos de animação
    animatedContainer: {
      transform: [{ scale: scaleAnimation }],
    },
    fadeInContainer: {
      opacity: fadeAnimation,
      transform: [
        {
          translateY: slideAnimation.interpolate({
            inputRange: [0, 1],
            outputRange: [30, 0],
          }),
        },
      ],
    },
  })

  return (
    <SafeAreaView style={styles.container}>
      {/* Gradiente de fundo */}
      <View style={styles.gradientOverlay} />
      
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
              <Ionicons name="arrow-back" size={22} color={theme.text} />
            </TouchableOpacity>
            
            <Animated.View style={styles.animatedContainer}>
              <View style={styles.iconRingOuter} />
              <View style={styles.iconRing} />
              <View style={styles.iconContainer}>
                <Ionicons 
                  name={emailSent ? "checkmark" : "mail-outline"} 
                  size={56} 
                  color="#FFFFFF" 
                />
              </View>
            </Animated.View>
            
            <Text style={styles.title}>
              {emailSent ? 'Email enviado!' : 'Recuperar senha'}
            </Text>
            
            <Text style={styles.subtitle}>
              {emailSent 
                ? 'Enviamos um código de verificação para seu email. Verifique sua caixa de entrada e continue com a verificação.'
                : 'Digite seu email e enviaremos um código de verificação seguro para redefinir sua senha.'
              }
            </Text>
          </View>

          {/* Form */}
          <View style={styles.form}>
            {emailSent ? (
              /* SUCCESS STATE */
              <Animated.View style={styles.fadeInContainer}>
                <View style={styles.successContainer}>
                  <View style={styles.successHeader}>
                    <View style={styles.successIcon}>
                      <Ionicons 
                        name="checkmark-circle" 
                        size={32} 
                        color={theme.success} 
                      />
                    </View>
                    <Text style={styles.successTitle}>
                      Código enviado com sucesso!
                    </Text>
                    <Text style={styles.successMessage}>
                      Verificamos sua identidade e enviamos o código de recuperação.
                    </Text>
                  </View>
                  
                  <View style={styles.emailCard}>
                    <Text style={styles.emailLabel}>Código enviado para:</Text>
                    <Text style={styles.emailText}>{email}</Text>
                  </View>
                  
                  <Button
                    title="Continuar verificação"
                    onPress={handleGoToReset}
                    style={styles.continueButton}
                    fullWidth
                  />
                  
                  <TouchableOpacity 
                    style={styles.resendContainer}
                    onPress={handleResendCode} 
                    disabled={isLoading}
                  >
                    <Text style={styles.resendText}>Não recebeu o código?</Text>
                    <Text style={styles.resendLink}>
                      {isLoading ? 'Reenviando...' : 'Reenviar agora'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </Animated.View>
            ) : (
              /* INITIAL STATE */
              <>
                <Input
                  label="Endereço de email"
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
                  title="Enviar código de verificação"
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