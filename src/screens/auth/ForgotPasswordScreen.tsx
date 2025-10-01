// src/screens/auth/ForgotPasswordScreen.tsx
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { Input, Button, Card } from '../../components/common';
import { COLORS, FONTS } from '../../constants';
import { AuthService } from '../../services/AuthService';

const ForgotPasswordScreen: React.FC = () => {
  const navigation = useNavigation();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleSendCode = async () => {
    // Limpar erro anterior
    setError('');

    // Validar email
    if (!email.trim()) {
      setError('Email é obrigatório');
      return;
    }

    if (!validateEmail(email)) {
      setError('Email inválido');
      return;
    }

    setLoading(true);

    try {
      // Chamar API para enviar código
      await AuthService.forgotPassword(email.trim());

      // Sucesso - navegar para tela de reset com o email
      Alert.alert(
        'Código Enviado!',
        `Um código de verificação foi enviado para ${email}. Verifique sua caixa de entrada e spam.`,
        [
          {
            text: 'OK',
            onPress: () => {
              (navigation as any).navigate('ResetPassword', { email: email.trim() });
            },
          },
        ]
      );
    } catch (err: any) {
      setError(err.message || 'Erro ao enviar código. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const handleResendCode = () => {
    Alert.alert(
      'Reenviar Código',
      'Deseja receber um novo código de verificação?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Reenviar',
          onPress: handleSendCode,
        },
      ]
    );
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
          >
            <Ionicons name="arrow-back" size={24} color={COLORS.gray900} />
          </TouchableOpacity>
        </View>

        {/* Content */}
        <View style={styles.content}>
          {/* Icon */}
          <View style={styles.iconContainer}>
            <View style={styles.iconCircle}>
              <Ionicons name="mail-outline" size={48} color={COLORS.primary} />
            </View>
          </View>

          {/* Title and Description */}
          <Text style={styles.title}>Esqueceu a Senha?</Text>
          <Text style={styles.description}>
            Não se preocupe! Digite seu email e enviaremos um código de verificação para redefinir sua senha.
          </Text>

          {/* Form Card */}
          <Card style={styles.formCard}>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Email</Text>
              <Input
                placeholder="seu@email.com"
                value={email}
                onChangeText={(text) => {
                  setEmail(text);
                  setError('');
                }}
                error={error}
                leftIcon="mail-outline"
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                editable={!loading}
                returnKeyType="send"
                onSubmitEditing={handleSendCode}
              />
            </View>

            <Button
              title="Enviar Código"
              onPress={handleSendCode}
              loading={loading}
              disabled={loading || !email.trim()}
            />
          </Card>

          {/* Help Section */}
          <Card style={styles.helpCard}>
            <View style={styles.helpItem}>
              <Ionicons name="time-outline" size={20} color={COLORS.info} />
              <Text style={styles.helpText}>
                O código expira em 15 minutos
              </Text>
            </View>
            <View style={styles.helpItem}>
              <Ionicons name="shield-checkmark-outline" size={20} color={COLORS.success} />
              <Text style={styles.helpText}>
                Link seguro e criptografado
              </Text>
            </View>
            <View style={styles.helpItem}>
              <Ionicons name="mail-unread-outline" size={20} color={COLORS.warning} />
              <Text style={styles.helpText}>
                Verifique também a pasta de spam
              </Text>
            </View>
          </Card>

          {/* Footer */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>Não recebeu o código?</Text>
            <TouchableOpacity
              onPress={handleResendCode}
              disabled={loading}
            >
              <Text style={styles.footerLink}>Reenviar código</Text>
            </TouchableOpacity>
          </View>

          {/* Back to Login */}
          <TouchableOpacity
            style={styles.backToLogin}
            onPress={() => navigation.navigate('Login' as never)}
            disabled={loading}
          >
            <Ionicons name="arrow-back-circle-outline" size={20} color={COLORS.primary} />
            <Text style={styles.backToLoginText}>Voltar para o Login</Text>
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
  formCard: {
    padding: 20,
    marginBottom: 16,
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontFamily: FONTS.medium,
    color: COLORS.gray700,
    marginBottom: 8,
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
  backToLogin: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
  },
  backToLoginText: {
    fontSize: 15,
    fontFamily: FONTS.medium,
    color: COLORS.primary,
  },
});

export default ForgotPasswordScreen;