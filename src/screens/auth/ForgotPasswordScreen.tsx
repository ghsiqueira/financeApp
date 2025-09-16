// src/screens/auth/ForgotPasswordScreen.tsx
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Button, Input, CustomAlert } from '../../components/common';
import { useAuth } from '../../contexts/AuthContext';
import { COLORS, FONTS, FONT_SIZES, SPACING, VALIDATION_RULES } from '../../constants';
import { validateEmail } from '../../utils';

type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
  ForgotPassword: undefined;
};

type ForgotPasswordScreenNavigationProp = NativeStackNavigationProp<AuthStackParamList, 'ForgotPassword'>;

interface Props {
  navigation: ForgotPasswordScreenNavigationProp;
}

export const ForgotPasswordScreen: React.FC<Props> = ({ navigation }) => {
  const { forgotPassword, isLoading, error, clearError } = useAuth();
  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState('');
  const [showAlert, setShowAlert] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleEmailChange = (value: string) => {
    setEmail(value);
    if (emailError) {
      setEmailError('');
    }
    if (error) {
      clearError();
    }
  };

  const validateForm = (): boolean => {
    if (!email.trim()) {
      setEmailError('Email é obrigatório');
      return false;
    }

    if (!validateEmail(email)) {
      setEmailError('Digite um email válido');
      return false;
    }

    return true;
  };

  const handleForgotPassword = async () => {
    if (!validateForm()) {
      return;
    }

    try {
      await forgotPassword(email.trim().toLowerCase());
      setSuccess(true);
      setShowAlert(true);
    } catch (err) {
      setShowAlert(true);
    }
  };

  const handleAlertConfirm = () => {
    setShowAlert(false);
    if (success) {
      navigation.navigate('Login');
    } else {
      clearError();
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.keyboardContainer}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.header}>
            <View style={styles.logoContainer}>
              <View style={styles.logo}>
                <Text style={styles.logoText}>🔑</Text>
              </View>
              <Text style={styles.title}>Recuperar Senha</Text>
              <Text style={styles.subtitle}>
                Digite seu email e enviaremos instruções para redefinir sua senha
              </Text>
            </View>
          </View>

          <View style={styles.formContainer}>
            <Input
              label="Email"
              placeholder="seu@email.com"
              value={email}
              onChangeText={handleEmailChange}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              error={emailError}
              leftIcon="mail-outline"
              required
            />

            <Button
              title="Enviar Instruções"
              onPress={handleForgotPassword}
              loading={isLoading}
              fullWidth
              style={styles.submitButton}
            />

            <TouchableOpacity
              style={styles.backToLogin}
              onPress={() => navigation.navigate('Login')}
            >
              <Text style={styles.backToLoginText}>Voltar ao login</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      <CustomAlert
        visible={showAlert}
        title={success ? 'Email enviado!' : 'Erro'}
        message={
          success
            ? 'Enviamos instruções para recuperar sua senha. Verifique sua caixa de entrada.'
            : error || 'Não foi possível enviar o email de recuperação'
        }
        type={success ? 'success' : 'error'}
        onConfirm={handleAlertConfirm}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  keyboardContainer: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: SPACING.lg,
  },
  header: {
    paddingTop: SPACING['2xl'],
    paddingBottom: SPACING.xl,
    alignItems: 'center',
  },
  logoContainer: {
    alignItems: 'center',
  },
  logo: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: COLORS.warning,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  logoText: {
    fontSize: 40,
  },
  title: {
    fontSize: FONT_SIZES['2xl'],
    fontFamily: FONTS.bold,
    color: COLORS.textPrimary,
    marginBottom: SPACING.sm,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: FONT_SIZES.md,
    fontFamily: FONTS.regular,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
  },
  formContainer: {
    flex: 1,
    paddingTop: SPACING.lg,
  },
  submitButton: {
    marginTop: SPACING.lg,
    marginBottom: SPACING.xl,
  },
  backToLogin: {
    alignSelf: 'center',
  },
  backToLoginText: {
    fontSize: FONT_SIZES.sm,
    fontFamily: FONTS.medium,
    color: COLORS.primary,
  },
});