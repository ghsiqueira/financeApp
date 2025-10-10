import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { Input, Button, Card } from '../../components/common';
import { useTheme } from '../../contexts/ThemeContext';
import { FONTS, SPACING, BORDER_RADIUS } from '../../constants';
import { AuthService } from '../../services/AuthService';

interface FormErrors {
  currentPassword?: string;
  newPassword?: string;
  confirmPassword?: string;
}

const ChangePasswordScreen: React.FC = () => {
  const navigation = useNavigation();
  const { theme } = useTheme();
  const [loading, setLoading] = useState(false);
  
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  const [errors, setErrors] = useState<FormErrors>({});

  const getPasswordStrength = (password: string): { strength: string; color: string; percentage: number } => {
    if (!password) return { strength: '', color: '', percentage: 0 };
    
    let strength = 0;
    if (password.length >= 6) strength += 20;
    if (password.length >= 8) strength += 20;
    if (password.length >= 10) strength += 10;
    if (/[A-Z]/.test(password)) strength += 20;
    if (/[a-z]/.test(password)) strength += 10;
    if (/[0-9]/.test(password)) strength += 10;
    if (/[^A-Za-z0-9]/.test(password)) strength += 10;

    if (strength <= 30) return { strength: 'Muito Fraca', color: theme.error, percentage: 20 };
    if (strength <= 50) return { strength: 'Fraca', color: theme.warning, percentage: 40 };
    if (strength <= 70) return { strength: 'Regular', color: theme.info, percentage: 60 };
    if (strength <= 90) return { strength: 'Boa', color: theme.success, percentage: 80 };
    return { strength: 'Muito Forte', color: theme.success, percentage: 100 };
  };

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!currentPassword) {
      newErrors.currentPassword = 'Senha atual é obrigatória';
    }

    if (!newPassword) {
      newErrors.newPassword = 'Nova senha é obrigatória';
    } else if (newPassword.length < 6) {
      newErrors.newPassword = 'Senha deve ter pelo menos 6 caracteres';
    } else if (!/[A-Z]/.test(newPassword)) {
      newErrors.newPassword = 'Senha deve conter pelo menos uma letra maiúscula';
    } else if (!/[0-9]/.test(newPassword)) {
      newErrors.newPassword = 'Senha deve conter pelo menos um número';
    } else if (newPassword === currentPassword) {
      newErrors.newPassword = 'Nova senha deve ser diferente da atual';
    }

    if (!confirmPassword) {
      newErrors.confirmPassword = 'Confirme sua nova senha';
    } else if (newPassword !== confirmPassword) {
      newErrors.confirmPassword = 'As senhas não coincidem';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChangePassword = async () => {
    if (!validateForm()) {
      return;
    }

    Alert.alert(
      'Alterar Senha',
      'Tem certeza que deseja alterar sua senha?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Confirmar',
          onPress: async () => {
            setLoading(true);
            try {
              await AuthService.changePassword(currentPassword, newPassword);

              Alert.alert(
                'Sucesso!',
                'Sua senha foi alterada com sucesso.',
                [
                  {
                    text: 'OK',
                    onPress: () => navigation.goBack(),
                  },
                ]
              );
            } catch (err: any) {
              if (err.message.includes('atual')) {
                setErrors({ currentPassword: 'Senha atual incorreta' });
              } else {
                Alert.alert('Erro', err.message || 'Não foi possível alterar a senha');
              }
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  const handleCancel = () => {
    if (currentPassword || newPassword || confirmPassword) {
      Alert.alert(
        'Descartar Alterações',
        'Deseja descartar as alterações?',
        [
          { text: 'Continuar Editando', style: 'cancel' },
          {
            text: 'Descartar',
            style: 'destructive',
            onPress: () => navigation.goBack(),
          },
        ]
      );
    } else {
      navigation.goBack();
    }
  };

  const passwordStrength = getPasswordStrength(newPassword);

  // Estilos dinâmicos - ✅ LABELS CORRIGIDAS
  const dynamicStyles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.background,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      backgroundColor: theme.primary,
      paddingHorizontal: 16,
      paddingVertical: 12,
    },
    headerTitle: {
      fontSize: 18,
      fontFamily: FONTS.bold,
      color: theme.white,
    },
    iconCircle: {
      width: 90,
      height: 90,
      borderRadius: 45,
      backgroundColor: theme.primary + '20',
      alignItems: 'center',
      justifyContent: 'center',
    },
    pageTitle: {
      fontSize: 24,
      fontFamily: FONTS.bold,
      color: theme.textPrimary,
      textAlign: 'center',
      marginBottom: 8,
    },
    pageDescription: {
      fontSize: 14,
      fontFamily: FONTS.regular,
      color: theme.textSecondary,
      textAlign: 'center',
      marginBottom: 24,
      lineHeight: 20,
    },
    inputLabel: {
      fontSize: 14,
      fontFamily: FONTS.medium,
      color: theme.textSecondary, // ✅ MUDANÇA AQUI
      marginBottom: 8,
    },
    divider: {
      height: 1,
      backgroundColor: theme.border,
      marginVertical: 20,
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
      marginBottom: 16,
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
    tipsCard: {
      padding: 16,
      backgroundColor: theme.warning + '10',
      borderLeftWidth: 4,
      borderLeftColor: theme.warning,
      marginBottom: 16,
    },
    tipsTitle: {
      fontSize: 15,
      fontFamily: FONTS.bold,
      color: theme.textPrimary,
      marginBottom: 12,
    },
    tipText: {
      flex: 1,
      fontSize: 13,
      fontFamily: FONTS.regular,
      color: theme.textSecondary,
      lineHeight: 18,
    },
    tipBullet: {
      fontSize: 16,
      fontFamily: FONTS.bold,
      color: theme.warning,
      marginTop: -2,
    },
    forgotPasswordText: {
      fontSize: 14,
      fontFamily: FONTS.medium,
      color: theme.primary,
    },
  });

  return (
    <SafeAreaView style={dynamicStyles.container}>
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={dynamicStyles.header}>
          <TouchableOpacity
            style={styles.headerButton}
            onPress={handleCancel}
            disabled={loading}
          >
            <Ionicons name="arrow-back" size={24} color={theme.white} />
          </TouchableOpacity>
          <Text style={dynamicStyles.headerTitle}>Alterar Senha</Text>
          <View style={styles.headerButton} />
        </View>

        <ScrollView
          style={styles.content}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          <View style={styles.iconContainer}>
            <View style={dynamicStyles.iconCircle}>
              <Ionicons name="shield-checkmark" size={48} color={theme.primary} />
            </View>
          </View>

          <Text style={dynamicStyles.pageTitle}>Segurança da Conta</Text>
          <Text style={dynamicStyles.pageDescription}>
            Mantenha sua conta segura alterando sua senha regularmente
          </Text>

          <Card style={styles.formCard}>
            <View style={styles.inputGroup}>
              <Text style={dynamicStyles.inputLabel}>Senha Atual *</Text>
              <Input
                placeholder="Digite sua senha atual"
                value={currentPassword}
                onChangeText={(text) => {
                  setCurrentPassword(text);
                  if (errors.currentPassword) {
                    setErrors({ ...errors, currentPassword: undefined });
                  }
                }}
                error={errors.currentPassword}
                secureTextEntry={!showCurrentPassword}
                leftIcon="lock-closed-outline"
                rightIcon={showCurrentPassword ? 'eye-off-outline' : 'eye-outline'}
                onRightIconPress={() => setShowCurrentPassword(!showCurrentPassword)}
                editable={!loading}
                autoCapitalize="none"
              />
            </View>

            <View style={dynamicStyles.divider} />

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
              <Text style={dynamicStyles.inputLabel}>Confirmar Nova Senha *</Text>
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
                <Text style={dynamicStyles.requirementText}>Pelo menos uma letra maiúscula</Text>
              </View>
              <View style={styles.requirement}>
                <Ionicons
                  name={/[a-z]/.test(newPassword) ? 'checkmark-circle' : 'ellipse-outline'}
                  size={18}
                  color={/[a-z]/.test(newPassword) ? theme.success : theme.gray400}
                />
                <Text style={dynamicStyles.requirementText}>Pelo menos uma letra minúscula</Text>
              </View>
              <View style={styles.requirement}>
                <Ionicons
                  name={/[0-9]/.test(newPassword) ? 'checkmark-circle' : 'ellipse-outline'}
                  size={18}
                  color={/[0-9]/.test(newPassword) ? theme.success : theme.gray400}
                />
                <Text style={dynamicStyles.requirementText}>Pelo menos um número</Text>
              </View>
              <View style={styles.requirement}>
                <Ionicons
                  name={newPassword !== currentPassword && newPassword ? 'checkmark-circle' : 'ellipse-outline'}
                  size={18}
                  color={newPassword !== currentPassword && newPassword ? theme.success : theme.gray400}
                />
                <Text style={dynamicStyles.requirementText}>Diferente da senha atual</Text>
              </View>
            </View>
          </Card>

          <Card style={dynamicStyles.tipsCard}>
            <Text style={dynamicStyles.tipsTitle}>
              <Ionicons name="shield-outline" size={16} color={theme.warning} />
              {' '}Dicas de Segurança
            </Text>
            <View style={styles.tipsList}>
              <View style={styles.tip}>
                <Text style={dynamicStyles.tipBullet}>•</Text>
                <Text style={dynamicStyles.tipText}>Use uma combinação de letras, números e símbolos</Text>
              </View>
              <View style={styles.tip}>
                <Text style={dynamicStyles.tipBullet}>•</Text>
                <Text style={dynamicStyles.tipText}>Evite usar informações pessoais óbvias</Text>
              </View>
              <View style={styles.tip}>
                <Text style={dynamicStyles.tipBullet}>•</Text>
                <Text style={dynamicStyles.tipText}>Não reutilize senhas de outras contas</Text>
              </View>
              <View style={styles.tip}>
                <Text style={dynamicStyles.tipBullet}>•</Text>
                <Text style={dynamicStyles.tipText}>Altere sua senha regularmente</Text>
              </View>
            </View>
          </Card>

          <View style={styles.actionsSection}>
            <Button
              title="Alterar Senha"
              onPress={handleChangePassword}
              loading={loading}
              disabled={loading || !currentPassword || !newPassword || !confirmPassword}
            />

            <Button
              title="Cancelar"
              onPress={handleCancel}
              variant="outline"
              disabled={loading}
              style={styles.cancelButton}
            />
          </View>

          <TouchableOpacity
            style={styles.forgotPasswordLink}
            onPress={() => navigation.navigate('ForgotPassword' as never)}
            disabled={loading}
          >
            <Ionicons name="help-circle-outline" size={18} color={theme.primary} />
            <Text style={dynamicStyles.forgotPasswordText}>Esqueceu sua senha atual?</Text>
          </TouchableOpacity>

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
  headerButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  iconContainer: {
    alignItems: 'center',
    marginVertical: 20,
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
  tipsList: {
    gap: 8,
  },
  tip: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  actionsSection: {
    marginBottom: 16,
  },
  cancelButton: {
    marginTop: 12,
  },
  forgotPasswordLink: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
  },
});

export default ChangePasswordScreen;
