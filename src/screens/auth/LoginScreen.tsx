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
    // ✅ CORREÇÃO: Labels agora usam textSecondary para melhor contraste
    inputLabel: {
      fontSize: FONT_SIZES.sm,
      fontFamily: FONTS.medium,
      color: theme.textSecondary, // ✅ Era textPrimary, agora é textSecondary
      marginBottom: SPACING.xs,
    },
    inputRequired: {
      color: theme.error,
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
          contentContainerStyle={styles.scrollContainer}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Logo Section */}
          <View style={styles.logoSection}>
            <View style={dynamicStyles.logo}>
              <Ionicons name="wallet" size={40} color="#FFFFFF" />
            </View>
            <Text style={dynamicStyles.appName}>Finance App</Text>
            <Text style={dynamicStyles.tagline}>
              Organize suas finanças de forma simples
            </Text>
          </View>

          {/* Form Section */}
          <View style={styles.formSection}>
            <Text style={dynamicStyles.formTitle}>Entre na sua conta</Text>

            {/* ✅ CORREÇÃO: Labels agora ficam visíveis no modo escuro */}
            <View style={styles.inputGroup}>
              <Text style={dynamicStyles.inputLabel}>
                Email <Text style={dynamicStyles.inputRequired}>*</Text>
              </Text>
              <Input
                placeholder="seu@email.com"
                value={formData.email}
                onChangeText={(value) => handleInputChange('email', value)}
                error={errors.email}
                keyboardType="email-address"
                autoCapitalize="none"
                leftIcon="mail-outline"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={dynamicStyles.inputLabel}>
                Senha <Text style={dynamicStyles.inputRequired}>*</Text>
              </Text>
              <Input
                placeholder="Sua senha"
                value={formData.password}
                onChangeText={(value) => handleInputChange('password', value)}
                error={errors.password}
                secureTextEntry={!showPassword}
                leftIcon="lock-closed-outline"
                rightIcon={showPassword ? 'eye-off-outline' : 'eye-outline'}
                onRightIconPress={() => setShowPassword(!showPassword)}
              />
            </View>

            <TouchableOpacity
              style={styles.forgotPasswordButton}
              onPress={() => navigation.navigate('ForgotPassword')}
            >
              <Text style={dynamicStyles.forgotPasswordText}>
                Esqueceu sua senha?
              </Text>
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

            <View style={styles.registerSection}>
              <Text style={dynamicStyles.registerText}>
                Não tem uma conta?{' '}
              </Text>
              <TouchableOpacity onPress={() => navigation.navigate('Register')}>
                <Text style={dynamicStyles.registerLink}>Cadastre-se</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      <CustomAlert
        visible={showAlert}
        title="Erro ao fazer login"
        message={error || 'Ocorreu um erro ao fazer login. Tente novamente.'}
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
  scrollContainer: {
    flexGrow: 1,
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.xl * 2,
  },
  logoSection: {
    alignItems: 'center',
    marginBottom: SPACING.xl * 2,
  },
  formSection: {
    flex: 1,
  },
  inputGroup: {
    marginBottom: SPACING.lg,
  },
  forgotPasswordButton: {
    alignSelf: 'flex-end',
    marginBottom: SPACING.lg,
  },
  loginButton: {
    marginBottom: SPACING.md,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: SPACING.lg,
  },
  registerSection: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
});