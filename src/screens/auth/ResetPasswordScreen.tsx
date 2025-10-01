// src/screens/auth/ResetPasswordScreen.tsx - SOMENTE CÓDIGO
import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Button, Card } from '../../components/common';
import { COLORS, FONTS } from '../../constants';
import { AuthService } from '../../services/AuthService';

interface RouteParams {
  email: string;
}

const ResetPasswordScreen: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { email } = (route.params as RouteParams) || { email: '' };

  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [timer, setTimer] = useState(900); // 15 minutos
  const [canResend, setCanResend] = useState(false);

  const codeInputRefs = useRef<(TextInput | null)[]>([]);

  // Timer de expiração
  useEffect(() => {
    const interval = setInterval(() => {
      setTimer((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          setCanResend(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleCodeChange = (text: string, index: number) => {
    const numericText = text.replace(/[^0-9]/g, '');
    
    if (numericText.length > 1) {
      // Colar código completo
      const digits = numericText.slice(0, 6).split('');
      const newCode = [...code];
      digits.forEach((digit, i) => {
        if (i < 6) newCode[i] = digit;
      });
      setCode(newCode);
      
      const lastIndex = Math.min(digits.length, 5);
      codeInputRefs.current[lastIndex]?.focus();
    } else {
      const newCode = [...code];
      newCode[index] = numericText;
      setCode(newCode);

      if (numericText && index < 5) {
        codeInputRefs.current[index + 1]?.focus();
      }
    }

    if (error) {
      setError('');
    }
  };

  const handleCodeKeyPress = (key: string, index: number) => {
    if (key === 'Backspace' && !code[index] && index > 0) {
      codeInputRefs.current[index - 1]?.focus();
    }
  };

  const handleVerifyCode = async () => {
    const fullCode = code.join('');
    
    if (fullCode.length !== 6) {
      setError('Digite o código completo de 6 dígitos');
      return;
    }

    if (timer === 0) {
      setError('Código expirado. Solicite um novo código.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Verificar código
      await AuthService.verifyResetCode(email, fullCode);

      // Se código válido, navegar para tela de nova senha
      Alert.alert(
        'Código Válido!',
        'Agora defina sua nova senha.',
        [
          {
            text: 'Continuar',
            onPress: () => {
              (navigation as any).navigate('NewPassword', { 
                email, 
                code: fullCode 
              });
            },
          },
        ]
      );
    } catch (err: any) {
      setError(err.message || 'Código inválido ou expirado');
    } finally {
      setLoading(false);
    }
  };

  const handleResendCode = async () => {
    setLoading(true);
    try {
      await AuthService.forgotPassword(email);
      
      setTimer(900);
      setCanResend(false);
      setCode(['', '', '', '', '', '']);
      setError('');
      
      Alert.alert('Código Reenviado', 'Um novo código foi enviado para seu email.');
    } catch (err: any) {
      Alert.alert('Erro', 'Não foi possível reenviar o código. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
            disabled={loading}
          >
            <Ionicons name="arrow-back" size={24} color={COLORS.gray900} />
          </TouchableOpacity>
        </View>

        {/* Content */}
        <View style={styles.content}>
          {/* Icon */}
          <View style={styles.iconContainer}>
            <View style={styles.iconCircle}>
              <Ionicons name="mail-open-outline" size={48} color={COLORS.primary} />
            </View>
          </View>

          {/* Title */}
          <Text style={styles.title}>Verifique seu Email</Text>
          <Text style={styles.description}>
            Enviamos um código de 6 dígitos para{'\n'}
            <Text style={styles.emailText}>{email}</Text>
          </Text>

          {/* Code Input */}
          <Card style={styles.codeCard}>
            <Text style={styles.codeLabel}>Digite o Código</Text>
            <View style={styles.codeContainer}>
              {code.map((digit, index) => (
                <TextInput
                  key={index}
                  ref={(ref) => {
                    codeInputRefs.current[index] = ref;
                  }}
                  style={[
                    styles.codeInput,
                    digit && styles.codeInputFilled,
                    error && styles.codeInputError,
                  ]}
                  value={digit}
                  onChangeText={(text) => handleCodeChange(text, index)}
                  onKeyPress={({ nativeEvent: { key } }) => handleCodeKeyPress(key, index)}
                  keyboardType="number-pad"
                  maxLength={1}
                  editable={!loading && timer > 0}
                  selectTextOnFocus
                />
              ))}
            </View>

            {error && (
              <View style={styles.errorContainer}>
                <Ionicons name="alert-circle" size={16} color={COLORS.error} />
                <Text style={styles.errorText}>{error}</Text>
              </View>
            )}

            {/* Timer */}
            <View style={styles.timerContainer}>
              <Ionicons 
                name="time-outline" 
                size={16} 
                color={timer > 300 ? COLORS.success : timer > 0 ? COLORS.warning : COLORS.error} 
              />
              <Text style={[
                styles.timerText,
                { color: timer > 300 ? COLORS.success : timer > 0 ? COLORS.warning : COLORS.error }
              ]}>
                {timer > 0 ? `Código expira em ${formatTime(timer)}` : 'Código expirado'}
              </Text>
            </View>

            <Button
              title={loading ? 'Verificando...' : 'Verificar Código'}
              onPress={handleVerifyCode}
              loading={loading}
              disabled={loading || code.join('').length !== 6 || timer === 0}
              style={styles.verifyButton}
            />
          </Card>

          {/* Help Card */}
          <Card style={styles.helpCard}>
            <View style={styles.helpItem}>
              <Ionicons name="mail-unread-outline" size={20} color={COLORS.warning} />
              <Text style={styles.helpText}>
                Não recebeu? Verifique a pasta de spam
              </Text>
            </View>
            <View style={styles.helpItem}>
              <Ionicons name="shield-checkmark-outline" size={20} color={COLORS.success} />
              <Text style={styles.helpText}>
                Nunca compartilhe este código
              </Text>
            </View>
          </Card>

          {/* Resend Code */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>Não recebeu o código?</Text>
            <TouchableOpacity
              onPress={handleResendCode}
              disabled={loading || !canResend}
            >
              <Text style={[
                styles.footerLink,
                (!canResend || loading) && styles.footerLinkDisabled
              ]}>
                {canResend ? 'Reenviar código' : 'Aguarde para reenviar'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Wrong Email */}
          <TouchableOpacity
            style={styles.wrongEmail}
            onPress={() => navigation.goBack()}
            disabled={loading}
          >
            <Ionicons name="mail-outline" size={18} color={COLORS.gray600} />
            <Text style={styles.wrongEmailText}>Email incorreto? Voltar</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  keyboardView: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
    padding: 24,
  },
  iconContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  iconCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: COLORS.primary + '20',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 28,
    fontFamily: FONTS.bold,
    color: COLORS.gray900,
    textAlign: 'center',
    marginBottom: 12,
  },
  description: {
    fontSize: 15,
    fontFamily: FONTS.regular,
    color: COLORS.gray600,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 32,
  },
  emailText: {
    fontFamily: FONTS.bold,
    color: COLORS.primary,
  },
  codeCard: {
    padding: 24,
    marginBottom: 16,
  },
  codeLabel: {
    fontSize: 14,
    fontFamily: FONTS.medium,
    color: COLORS.gray700,
    marginBottom: 16,
    textAlign: 'center',
  },
  codeContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 16,
  },
  codeInput: {
    width: 50,
    height: 60,
    borderWidth: 2,
    borderColor: COLORS.gray300,
    borderRadius: 12,
    fontSize: 24,
    fontFamily: FONTS.bold,
    textAlign: 'center',
    color: COLORS.gray900,
    backgroundColor: COLORS.white,
  },
  codeInputFilled: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primary + '10',
  },
  codeInputError: {
    borderColor: COLORS.error,
    backgroundColor: COLORS.error + '10',
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginBottom: 12,
  },
  errorText: {
    fontSize: 13,
    fontFamily: FONTS.medium,
    color: COLORS.error,
  },
  timerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginBottom: 20,
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: COLORS.gray50,
    borderRadius: 8,
  },
  timerText: {
    fontSize: 13,
    fontFamily: FONTS.medium,
  },
  verifyButton: {
    marginTop: 4,
  },
  helpCard: {
    padding: 16,
    backgroundColor: COLORS.gray50,
    marginBottom: 24,
  },
  helpItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  helpText: {
    flex: 1,
    fontSize: 13,
    fontFamily: FONTS.regular,
    color: COLORS.gray700,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginBottom: 16,
  },
  footerText: {
    fontSize: 14,
    fontFamily: FONTS.regular,
    color: COLORS.gray600,
  },
  footerLink: {
    fontSize: 14,
    fontFamily: FONTS.bold,
    color: COLORS.primary,
  },
  footerLinkDisabled: {
    color: COLORS.gray400,
  },
  wrongEmail: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
  },
  wrongEmailText: {
    fontSize: 14,
    fontFamily: FONTS.regular,
    color: COLORS.gray600,
  },
});

export default ResetPasswordScreen;