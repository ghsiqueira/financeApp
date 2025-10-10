// src/screens/auth/LoginScreen.tsx - COM BOTÃO DE TEMA
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
import { Ionicons } from '@expo/vector-icons';
import { Button, Input, CustomAlert } from '../../components/common';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { FONTS, FONT_SIZES, SPACING } from '../../constants';
import { validateEmail } from '../../utils';

type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
  ForgotPassword: undefined;
};

type LoginScreenNavigationProp = NativeStackNavigationProp<AuthStackParamList, 'Login'>;

interface Props {
  navigation: LoginScreenNavigationProp;
}

interface FormData {
  email: string;
  password: string;
}

interface FormErrors {
  email?: string;
  password?: string;
}

export const LoginScreen: React.FC<Props> = ({ navigation }) => {
  const { login, isLoading, error, clearError } = useAuth();
  const { theme, isDarkMode, toggleTheme } = useTheme();
  const [showAlert, setShowAlert] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const [formData, setFormData] = useState<FormData>({
    email: '',
    password: '',
  });

  const [errors, setErrors] = useState<FormErrors>({});

  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
    
    if (error) {
      clearError();
    }
  };

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.email.trim()) {
      newErrors.email = 'Email é obrigatório';
    } else if (!validateEmail(formData.email)) {
      newErrors.email = 'Digite um email válido';
    }

    if (!formData.password) {
      newErrors.password = 'Senha é obrigatória';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Senha deve ter pelo menos 6 caracteres';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleLogin = async () => {
    if (!validateForm()) {
      return;
    }

    try {
      await login({
        email: formData.email.trim().toLowerCase(),
        password: formData.password,
      });
    } catch (err) {
      // Erro será tratado pelo context
    }
  };

  const handleShowAlert = () => {
    if (error) {
      setShowAlert(true);
    }
  };

  React.useEffect(() => {
    if (error) {
      handleShowAlert();
    }
  }, [error]);

  // Estilos dinâmicos
  const dynamicStyles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.background,
    },
    themeButton: {
      position: 'absolute',
      top: SPACING.md,
      right: SPACING.md,
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: theme.card,
      borderWidth: 1,
      borderColor: theme.border,
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 10,
    },
    logo: {
      width: 80,
      height: 80,
      borderRadius: 40,
      backgroundColor: theme.primary,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: SPACING.md,
    },
    appName: {
      fontSize: FONT_SIZES.xxxl,
      fontFamily: FONTS.bold,
      color: theme.textPrimary,
      marginBottom: SPACING.xs,
    },
    tagline: {
      fontSize: FONT_SIZES.md,
      fontFamily: FONTS.regular,
      color: theme.textSecondary,
      textAlign: 'center',
    },
    formTitle: {
      fontSize: FONT_SIZES.xl,
      fontFamily: FONTS.bold,
      color: theme.textPrimary,
      marginBottom: SPACING.lg,
      textAlign: 'center',
    },
    forgotPasswordText: {
      fontSize: FONT_SIZES.sm,
      fontFamily: FONTS.medium,
      color: theme.primary,
    },
    dividerLine: {
      flex: 1,
      height: 1,
      backgroundColor: theme.border,
    },
    dividerText: {
      fontSize: FONT_SIZES.sm,
      fontFamily: FONTS.regular,
      color: theme.textSecondary,
      marginHorizontal: SPACING.md,
    },
    registerText: {
      fontSize: FONT_SIZES.sm,
      fontFamily: FONTS.regular,
      color: theme.textSecondary,
    },
    registerLink: {
      fontSize: FONT_SIZES.sm,
      fontFamily: FONTS.bold,
      color: theme.primary,
    },
  });

  return (
    <SafeAreaView style={dynamicStyles.container}>
      {/* Botão de Tema Flutuante */}
      <TouchableOpacity
        style={dynamicStyles.themeButton}
        onPress={toggleTheme}
        activeOpacity={0.7}
      >
        <Ionicons
          name={isDarkMode ? 'sunny-outline' : 'moon-outline'}
          size={24}
          color={theme.textPrimary}
        />
      </TouchableOpacity>

      <KeyboardAvoidingView
        style={styles.keyboardContainer}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <ScrollView
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.logoContainer}>
              <View style={dynamicStyles.logo}>
                <Text style={styles.logoText}>💰</Text>
              </View>
              <Text style={dynamicStyles.appName}>Finance App</Text>
              <Text style={dynamicStyles.tagline}>Controle suas finanças de forma simples</Text>
            </View>
          </View>

          {/* Formulário */}
          <View style={styles.formContainer}>
            <Text style={dynamicStyles.formTitle}>Entre na sua conta</Text>

            <Input
              label="Email"
              placeholder="seu@email.com"
              value={formData.email}
              onChangeText={(value) => handleInputChange('email', value)}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              error={errors.email}
              leftIcon="mail-outline"
              required
            />

            <Input
              label="Senha"
              placeholder="Sua senha"
              value={formData.password}
              onChangeText={(value) => handleInputChange('password', value)}
              secureTextEntry={!showPassword}
              error={errors.password}
              leftIcon="lock-closed-outline"
              rightIcon={showPassword ? "eye-off-outline" : "eye-outline"}
              onRightIconPress={() => setShowPassword(!showPassword)}
              required
            />

            <TouchableOpacity
              style={styles.forgotPassword}
              onPress={() => navigation.navigate('ForgotPassword')}
            >
              <Text style={dynamicStyles.forgotPasswordText}>Esqueceu sua senha?</Text>
            </TouchableOpacity>

            <Button
              title="Entrar"
              onPress={handleLogin}
              loading={isLoading}
              fullWidth
              style={styles.loginButton}
            />

            <View style={styles.divider}>
              <View style={dynamicStyles.dividerLine} />
              <Text style={dynamicStyles.dividerText}>ou</Text>
              <View style={dynamicStyles.dividerLine} />
            </View>

            <View style={styles.registerContainer}>
              <Text style={dynamicStyles.registerText}>Não tem uma conta? </Text>
              <TouchableOpacity onPress={() => navigation.navigate('Register')}>
                <Text style={dynamicStyles.registerLink}>Cadastre-se</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Alert de erro */}
      <CustomAlert
        visible={showAlert}
        title="Erro no login"
        message={error || 'Não foi possível fazer login'}
        type="error"
        onConfirm={() => {
          setShowAlert(false);
          clearError();
        }}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  keyboardContainer: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: SPACING.lg,
  },
  header: {
    paddingTop: SPACING.xxl,
    paddingBottom: SPACING.xl,
    alignItems: 'center',
  },
  logoContainer: {
    alignItems: 'center',
  },
  logoText: {
    fontSize: 40,
  },
  formContainer: {
    flex: 1,
    paddingTop: SPACING.lg,
  },
  forgotPassword: {
    alignSelf: 'flex-end',
    marginBottom: SPACING.lg,
    marginTop: -SPACING.sm,
  },
  loginButton: {
    marginBottom: SPACING.lg,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  registerContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: SPACING.xl,
  },
});