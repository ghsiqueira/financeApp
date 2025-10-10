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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Button, Card } from '../../components/common';
import { useTheme } from '../../contexts/ThemeContext';
import { FONTS, SPACING, BORDER_RADIUS } from '../../constants';
import { AuthService } from '../../services/AuthService';

interface RouteParams {
  email: string;
}

const ResetPasswordScreen: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { theme } = useTheme();
  const { email } = (route.params as RouteParams) || { email: '' };

  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [timer, setTimer] = useState(900); // 15 minutos
  const [canResend, setCanResend] = useState(false);

  const codeInputRefs = useRef<(TextInput | null)[]>([]);

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
      await AuthService.verifyResetCode(email, fullCode);

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

  // Estilos dinâmicos - ✅ LABELS CORRIGIDAS
  const dynamicStyles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.background,
    },
    title: {
      fontSize: 28,
      fontFamily: FONTS.bold,
      color: theme.textPrimary,
      textAlign: 'center',
      marginBottom: 12,
    },
    description: {
      fontSize: 15,
      fontFamily: FONTS.regular,
      color: theme.textSecondary,
      textAlign: 'center',
      lineHeight: 22,
      marginBottom: 32,
    },
    emailText: {
      fontFamily: FONTS.bold,
      color: theme.primary,
    },
    codeLabel: {
      fontSize: 14,
      fontFamily: FONTS.medium,
      color: theme.textSecondary, // ✅ MUDANÇA AQUI
      marginBottom: 16,
      textAlign: 'center',
    },
    codeInput: {
      width: 50,
      height: 60,
      borderWidth: 2,
      borderColor: theme.border,
      borderRadius: 12,
      fontSize: 24,
      fontFamily: FONTS.bold,
      textAlign: 'center',
      color: theme.textPrimary,
      backgroundColor: theme.card,
    },
    codeInputFilled: {
      borderColor: theme.primary,
      backgroundColor: theme.primary + '10',
    },
    codeInputError: {
      borderColor: theme.error,
      backgroundColor: theme.error + '10',
    },
    errorText: {
      fontSize: 13,
      fontFamily: FONTS.medium,
      color: theme.error,
    },
    helpText: {
      flex: 1,
      fontSize: 13,
      fontFamily: FONTS.regular,
      color: theme.textSecondary,
    },
    footerText: {
      fontSize: 14,
      fontFamily: FONTS.regular,
      color: theme.textSecondary,
    },
    footerLink: {
      fontSize: 14,
      fontFamily: FONTS.bold,
      color: theme.primary,
    },
    footerLinkDisabled: {
      color: theme.gray400,
    },
    wrongEmailText: {
      fontSize: 14,
      fontFamily: FONTS.regular,
      color: theme.textSecondary,
    },
    iconCircle: {
      width: 100,
      height: 100,
      borderRadius: 50,
      backgroundColor: theme.primary + '20',
      alignItems: 'center',
      justifyContent: 'center',
    },
    helpCard: {
      padding: 16,
      backgroundColor: theme.backgroundSecondary,
      marginBottom: 24,
      borderRadius: BORDER_RADIUS.lg,
    },
  });

  const getTimerColor = () => {
    if (timer > 300) return theme.success;
    if (timer > 0) return theme.warning;
    return theme.error;
  };

  return (
    <SafeAreaView style={dynamicStyles.container}>
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
            disabled={loading}
          >
            <Ionicons name="arrow-back" size={24} color={theme.textPrimary} />
          </TouchableOpacity>
        </View>

        <View style={styles.content}>
          <View style={styles.iconContainer}>
            <View style={dynamicStyles.iconCircle}>
              <Ionicons name="mail-open-outline" size={48} color={theme.primary} />
            </View>
          </View>

          <Text style={dynamicStyles.title}>Verifique seu Email</Text>
          <Text style={dynamicStyles.description}>
            Enviamos um código de 6 dígitos para{'\n'}
            <Text style={dynamicStyles.emailText}>{email}</Text>
          </Text>

          <Card style={styles.codeCard}>
            <Text style={dynamicStyles.codeLabel}>Digite o Código</Text>
            <View style={styles.codeContainer}>
              {code.map((digit, index) => (
                <TextInput
                  key={index}
                  ref={(ref) => {
                    codeInputRefs.current[index] = ref;
                  }}
                  style={[
                    dynamicStyles.codeInput,
                    digit && dynamicStyles.codeInputFilled,
                    error && dynamicStyles.codeInputError,
                  ]}
                  value={digit}
                  onChangeText={(text) => handleCodeChange(text, index)}
                  onKeyPress={({ nativeEvent: { key } }) => handleCodeKeyPress(key, index)}
                  keyboardType="number-pad"
                  maxLength={1}
                  editable={!loading && timer > 0}
                  selectTextOnFocus
                  placeholderTextColor={theme.textTertiary}
                />
              ))}
            </View>

            {error && (
              <View style={styles.errorContainer}>
                <Ionicons name="alert-circle" size={16} color={theme.error} />
                <Text style={dynamicStyles.errorText}>{error}</Text>
              </View>
            )}

            <View style={styles.timerContainer}>
              <Ionicons 
                name="time-outline" 
                size={16} 
                color={getTimerColor()} 
              />
              <Text style={[
                styles.timerText,
                { color: getTimerColor() }
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

          <Card style={dynamicStyles.helpCard}>
            <View style={styles.helpItem}>
              <Ionicons name="mail-unread-outline" size={20} color={theme.warning} />
              <Text style={dynamicStyles.helpText}>
                Não recebeu? Verifique a pasta de spam
              </Text>
            </View>
            <View style={styles.helpItem}>
              <Ionicons name="shield-checkmark-outline" size={20} color={theme.success} />
              <Text style={dynamicStyles.helpText}>
                Nunca compartilhe este código
              </Text>
            </View>
          </Card>

          <View style={styles.footer}>
            <Text style={dynamicStyles.footerText}>Não recebeu o código?</Text>
            <TouchableOpacity
              onPress={handleResendCode}
              disabled={loading || !canResend}
            >
              <Text style={[
                dynamicStyles.footerLink,
                (!canResend || loading) && dynamicStyles.footerLinkDisabled
              ]}>
                {canResend ? 'Reenviar código' : 'Aguarde para reenviar'}
              </Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={styles.wrongEmail}
            onPress={() => navigation.goBack()}
            disabled={loading}
          >
            <Ionicons name="mail-outline" size={18} color={theme.textSecondary} />
            <Text style={dynamicStyles.wrongEmailText}>Email incorreto? Voltar</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
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
  codeCard: {
    padding: 24,
    marginBottom: 16,
  },
  codeContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 16,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginBottom: 12,
  },
  timerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginBottom: 20,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  timerText: {
    fontSize: 13,
    fontFamily: FONTS.medium,
  },
  verifyButton: {
    marginTop: 4,
  },
  helpItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginBottom: 16,
  },
  wrongEmail: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
  },
});

export default ResetPasswordScreen;
