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
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Input, Button, Card } from '../../components/common';
import { useTheme } from '../../contexts/ThemeContext';
import { FONTS, SPACING, BORDER_RADIUS } from '../../constants';
import { AuthService } from '../../services/AuthService';

interface RouteParams {
  email: string;
  code: string;
}

const NewPasswordScreen: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { theme } = useTheme();
  const { email, code } = (route.params as RouteParams) || { email: '', code: '' };

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ newPassword?: string; confirmPassword?: string }>({});

  const getPasswordStrength = (password: string): { strength: string; color: string; percentage: number } => {
    if (!password) return { strength: '', color: '', percentage: 0 };
    
    let strength = 0;
    if (password.length >= 6) strength += 25;
    if (password.length >= 8) strength += 15;
    if (/[A-Z]/.test(password)) strength += 25;
    if (/[a-z]/.test(password)) strength += 15;
    if (/[0-9]/.test(password)) strength += 10;
    if (/[^A-Za-z0-9]/.test(password)) strength += 10;

    if (strength <= 30) return { strength: 'Fraca', color: theme.error, percentage: 25 };
    if (strength <= 60) return { strength: 'Regular', color: theme.warning, percentage: 50 };
    if (strength <= 85) return { strength: 'Boa', color: theme.info, percentage: 75 };
    return { strength: 'Forte', color: theme.success, percentage: 100 };
  };

  const validateForm = (): boolean => {
    const newErrors: { newPassword?: string; confirmPassword?: string } = {};

    if (!newPassword) {
      newErrors.newPassword = 'Nova senha é obrigatória';
    } else if (newPassword.length < 6) {
      newErrors.newPassword = 'Senha deve ter pelo menos 6 caracteres';
    } else if (!/[A-Z]/.test(newPassword)) {
      newErrors.newPassword = 'Senha deve conter pelo menos uma letra maiúscula';
    } else if (!/[0-9]/.test(newPassword)) {
      newErrors.newPassword = 'Senha deve conter pelo menos um número';
    }

    if (!confirmPassword) {
      newErrors.confirmPassword = 'Confirme sua nova senha';
    } else if (newPassword !== confirmPassword) {
      newErrors.confirmPassword = 'As senhas não coincidem';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleResetPassword = async () => {
    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      await AuthService.resetPassword(email, code, newPassword);

      Alert.alert(
        'Senha Redefinida!',
        'Sua senha foi alterada com sucesso. Faça login com sua nova senha.',
        [
          {
            text: 'Fazer Login',
            onPress: () => {
              (navigation as any).navigate('Login');
            },
          },
        ]
      );
    } catch (err: any) {
      Alert.alert(
        'Erro',
        err.message || 'Não foi possível redefinir a senha. O código pode ter expirado.',
        [
          {
            text: 'Tentar Novamente',
            onPress: () => navigation.goBack(),
          },
        ]
      );
    } finally {
      setLoading(false);
    }
  };

  const passwordStrength = getPasswordStrength(newPassword);

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
    inputLabel: {
      fontSize: 14,
      fontFamily: FONTS.medium,
      color: theme.textSecondary, // ✅ MUDANÇA AQUI
      marginBottom: 8,
    },
    strengthBar: {
      height: 6,
      backgroundColor: theme.border,
      borderRadius: 3,
      overflow: 'hidden',
    },
    requirementsCard: {
      padding: 16,
      backgroundColor: theme.info + '10',
      borderLeftWidth: 4,
      borderLeftColor: theme.info,
      marginBottom: 24,
      borderRadius: BORDER_RADIUS.lg,
    },
    requirementsTitle: {
      fontSize: 15,
      fontFamily: FONTS.bold,
      color: theme.textPrimary,
      marginBottom: 12,
    },
    requirementText: {
      fontSize: 13,
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
  });

  return (
    <SafeAreaView style={dynamicStyles.container}>
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          style={styles.content}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
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

          <View style={styles.iconContainer}>
            <View style={dynamicStyles.iconCircle}>
              <Ionicons name="lock-closed-outline" size={48} color={theme.primary} />
            </View>
          </View>

          <Text style={dynamicStyles.title}>Criar Nova Senha</Text>
          <Text style={dynamicStyles.description}>
            Escolha uma senha forte e segura para proteger sua conta
          </Text>

          <Card style={styles.formCard}>
            <View style={styles.inputGroup}>
              <Text style={dynamicStyles.inputLabel}>Nova Senha *</Text>
              <Input
                placeholder="Digite sua nova senha"
                value={newPassword}
                onChangeText={(text) => {
                  setNewPassword(text);
                  if (errors.newPassword) {
                    setErrors({ ...errors, newPassword: undefined });
                  }
                }}
                error={errors.newPassword}
                secureTextEntry={!showNewPassword}
                leftIcon="lock-closed-outline"
                rightIcon={showNewPassword ? 'eye-off-outline' : 'eye-outline'}
                onRightIconPress={() => setShowNewPassword(!showNewPassword)}
                editable={!loading}
                autoCapitalize="none"
              />

              {newPassword && (
                <View style={styles.strengthContainer}>
                  <View style={dynamicStyles.strengthBar}>
                    <View
                      style={[
                        styles.strengthFill,
                        {
                          width: `${passwordStrength.percentage}%`,
                          backgroundColor: passwordStrength.color,
                        },
                      ]}
                    />
                  </View>
                  <Text style={[styles.strengthText, { color: passwordStrength.color }]}>
                    Força: {passwordStrength.strength}
                  </Text>
                </View>
              )}
            </View>

            <View style={styles.inputGroup}>
              <Text style={dynamicStyles.inputLabel}>Confirmar Senha *</Text>
              <Input
                placeholder="Confirme sua nova senha"
                value={confirmPassword}
                onChangeText={(text) => {
                  setConfirmPassword(text);
                  if (errors.confirmPassword) {
                    setErrors({ ...errors, confirmPassword: undefined });
                  }
                }}
                error={errors.confirmPassword}
                secureTextEntry={!showConfirmPassword}
                leftIcon="lock-closed-outline"
                rightIcon={showConfirmPassword ? 'eye-off-outline' : 'eye-outline'}
                onRightIconPress={() => setShowConfirmPassword(!showConfirmPassword)}
                editable={!loading}
                autoCapitalize="none"
              />

              {confirmPassword && newPassword && (
                <View style={styles.matchContainer}>
                  <Ionicons
                    name={newPassword === confirmPassword ? 'checkmark-circle' : 'close-circle'}
                    size={16}
                    color={newPassword === confirmPassword ? theme.success : theme.error}
                  />
                  <Text
                    style={[
                      styles.matchText,
                      { color: newPassword === confirmPassword ? theme.success : theme.error },
                    ]}
                  >
                    {newPassword === confirmPassword ? 'As senhas coincidem' : 'As senhas não coincidem'}
                  </Text>
                </View>
              )}
            </View>
          </Card>

          <Card style={dynamicStyles.requirementsCard}>
            <Text style={dynamicStyles.requirementsTitle}>
              <Ionicons name="information-circle" size={16} color={theme.info} />
              {' '}Requisitos da Senha
            </Text>
            <View style={styles.requirementsList}>
              <View style={styles.requirement}>
                <Ionicons
                  name={newPassword.length >= 6 ? 'checkmark-circle' : 'ellipse-outline'}
                  size={18}
                  color={newPassword.length >= 6 ? theme.success : theme.gray400}
                />
                <Text style={dynamicStyles.requirementText}>Mínimo de 6 caracteres</Text>
              </View>
              <View style={styles.requirement}>
                <Ionicons
                  name={/[A-Z]/.test(newPassword) ? 'checkmark-circle' : 'ellipse-outline'}
                  size={18}
                  color={/[A-Z]/.test(newPassword) ? theme.success : theme.gray400}
                />
                <Text style={dynamicStyles.requirementText}>Uma letra maiúscula</Text>
              </View>
              <View style={styles.requirement}>
                <Ionicons
                  name={/[a-z]/.test(newPassword) ? 'checkmark-circle' : 'ellipse-outline'}
                  size={18}
                  color={/[a-z]/.test(newPassword) ? theme.success : theme.gray400}
                />
                <Text style={dynamicStyles.requirementText}>Uma letra minúscula</Text>
              </View>
              <View style={styles.requirement}>
                <Ionicons
                  name={/[0-9]/.test(newPassword) ? 'checkmark-circle' : 'ellipse-outline'}
                  size={18}
                  color={/[0-9]/.test(newPassword) ? theme.success : theme.gray400}
                />
                <Text style={dynamicStyles.requirementText}>Um número</Text>
              </View>
            </View>
          </Card>

          <Button
            title="Redefinir Senha"
            onPress={handleResetPassword}
            loading={loading}
            disabled={loading || !newPassword || !confirmPassword}
            style={styles.submitButton}
          />

          <View style={{ height: 40 }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  keyboardView: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: 24,
  },
  header: {
    marginBottom: 16,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  formCard: {
    padding: 20,
    marginBottom: 16,
  },
  inputGroup: {
    marginBottom: 20,
  },
  strengthContainer: {
    marginTop: 12,
    gap: 6,
  },
  strengthFill: {
    height: '100%',
    borderRadius: 3,
  },
  strengthText: {
    fontSize: 12,
    fontFamily: FONTS.medium,
    textAlign: 'right',
  },
  matchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 8,
  },
  matchText: {
    fontSize: 12,
    fontFamily: FONTS.medium,
  },
  requirementsList: {
    gap: 10,
  },
  requirement: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  submitButton: {
    marginBottom: 16,
  },
});

export default NewPasswordScreen;
