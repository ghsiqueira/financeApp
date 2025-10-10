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
import { useTheme } from '../../contexts/ThemeContext';
import { FONTS, FONT_SIZES, SPACING, VALIDATION_RULES } from '../../constants';
import { validateEmail } from '../../utils';

type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
  ForgotPassword: undefined;
};

type RegisterScreenNavigationProp = NativeStackNavigationProp<AuthStackParamList, 'Register'>;

interface Props {
  navigation: RegisterScreenNavigationProp;
}

interface FormData {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
}

interface FormErrors {
  name?: string;
  email?: string;
  password?: string;
  confirmPassword?: string;
}

export const RegisterScreen: React.FC<Props> = ({ navigation }) => {
  const { register, isLoading, error, clearError } = useAuth();
  const { theme } = useTheme();
  const [showAlert, setShowAlert] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [formData, setFormData] = useState<FormData>({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
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

    if (!formData.name.trim()) {
      newErrors.name = 'Nome é obrigatório';
    } else if (formData.name.length < VALIDATION_RULES.name.minLength) {
      newErrors.name = `Nome deve ter pelo menos ${VALIDATION_RULES.name.minLength} caracteres`;
    } else if (formData.name.length > VALIDATION_RULES.name.maxLength) {
      newErrors.name = `Nome deve ter no máximo ${VALIDATION_RULES.name.maxLength} caracteres`;
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email é obrigatório';
    } else if (!validateEmail(formData.email)) {
      newErrors.email = 'Digite um email válido';
    }

    if (!formData.password) {
      newErrors.password = 'Senha é obrigatória';
    } else if (formData.password.length < VALIDATION_RULES.password.minLength) {
      newErrors.password = `Senha deve ter pelo menos ${VALIDATION_RULES.password.minLength} caracteres`;
    } else if (!VALIDATION_RULES.password.pattern.test(formData.password)) {
      newErrors.password = VALIDATION_RULES.password.message;
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Confirmação de senha é obrigatória';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Senhas não coincidem';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleRegister = async () => {
    if (!validateForm()) {
      return;
    }

    try {
      await register({
        name: formData.name.trim(),
        email: formData.email.trim().toLowerCase(),
        password: formData.password,
        confirmPassword: formData.confirmPassword,
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

  // Estilos dinâmicos - ✅ LABELS CORRIGIDAS
  const dynamicStyles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.background,
    },
    appName: {
      fontSize: FONT_SIZES['2xl'],
      fontFamily: FONTS.bold,
      color: theme.textPrimary,
      marginBottom: SPACING.xs,
    },
    tagline: {
      fontSize: FONT_SIZES.sm,
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
    loginText: {
      fontSize: FONT_SIZES.sm,
      fontFamily: FONTS.regular,
      color: theme.textSecondary,
    },
    loginLink: {
      fontSize: FONT_SIZES.sm,
      fontFamily: FONTS.bold,
      color: theme.primary,
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
  });

  return (
    <SafeAreaView style={dynamicStyles.container}>
      <KeyboardAvoidingView
        style={styles.keyboardContainer}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <ScrollView 
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.header}>
            <View style={styles.logoContainer}>
              <View style={dynamicStyles.logo}>
                <Text style={styles.logoText}>💰</Text>
              </View>
              <Text style={dynamicStyles.appName}>FinanceApp</Text>
              <Text style={dynamicStyles.tagline}>Controle suas finanças com inteligência</Text>
            </View>
          </View>

          <View style={styles.formContainer}>
            <Text style={dynamicStyles.formTitle}>Criar sua conta</Text>

            <Input
              label="Nome completo"
              placeholder="Digite seu nome"
              value={formData.name}
              onChangeText={(value) => handleInputChange('name', value)}
              error={errors.name}
              leftIcon="person-outline"
              autoCapitalize="words"
            />

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
            />

            <Input
              label="Senha"
              placeholder="Digite sua senha"
              value={formData.password}
              onChangeText={(value) => handleInputChange('password', value)}
              secureTextEntry={!showPassword}
              error={errors.password}
              leftIcon="lock-closed-outline"
              rightIcon={showPassword ? "eye-off-outline" : "eye-outline"}
              onRightIconPress={() => setShowPassword(!showPassword)}
            />

            <Input
              label="Confirmar senha"
              placeholder="Confirme sua senha"
              value={formData.confirmPassword}
              onChangeText={(value) => handleInputChange('confirmPassword', value)}
              secureTextEntry={!showConfirmPassword}
              error={errors.confirmPassword}
              leftIcon="lock-closed-outline"
              rightIcon={showConfirmPassword ? "eye-off-outline" : "eye-outline"}
              onRightIconPress={() => setShowConfirmPassword(!showConfirmPassword)}
            />

            <Button
              title="Criar Conta"
              onPress={handleRegister}
              loading={isLoading}
              fullWidth
              style={styles.registerButton}
            />

            <View style={styles.divider}>
              <View style={dynamicStyles.dividerLine} />
              <Text style={dynamicStyles.dividerText}>ou</Text>
              <View style={dynamicStyles.dividerLine} />
            </View>

            <View style={styles.loginContainer}>
              <Text style={dynamicStyles.loginText}>Já tem uma conta? </Text>
              <TouchableOpacity onPress={() => navigation.navigate('Login')}>
                <Text style={dynamicStyles.loginLink}>Faça login</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      <CustomAlert
        visible={showAlert}
        title="Erro no cadastro"
        message={error || 'Não foi possível criar a conta'}
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
  scrollContent: {
    flexGrow: 1,
  },
  header: {
    paddingTop: SPACING.xl,
    paddingBottom: SPACING.lg,
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
  },
  registerButton: {
    marginTop: SPACING.md,
    marginBottom: SPACING.lg,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  loginContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: SPACING.xl,
  },
});
