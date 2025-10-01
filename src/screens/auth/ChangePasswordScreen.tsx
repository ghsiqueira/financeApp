// src/screens/auth/ChangePasswordScreen.tsx
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
import { COLORS, FONTS } from '../../constants';
import { AuthService } from '../../services/AuthService';

interface FormErrors {
  currentPassword?: string;
  newPassword?: string;
  confirmPassword?: string;
}

const ChangePasswordScreen: React.FC = () => {
  const navigation = useNavigation();
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

    if (strength <= 30) return { strength: 'Muito Fraca', color: COLORS.error, percentage: 20 };
    if (strength <= 50) return { strength: 'Fraca', color: COLORS.warning, percentage: 40 };
    if (strength <= 70) return { strength: 'Regular', color: COLORS.info, percentage: 60 };
    if (strength <= 90) return { strength: 'Boa', color: COLORS.success, percentage: 80 };
    return { strength: 'Muito Forte', color: COLORS.success, percentage: 100 };
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

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.headerButton}
            onPress={handleCancel}
            disabled={loading}
          >
            <Ionicons name="arrow-back" size={24} color={COLORS.white} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Alterar Senha</Text>
          <View style={styles.headerButton} />
        </View>

        <ScrollView
          style={styles.content}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {/* Icon Section */}
          <View style={styles.iconContainer}>
            <View style={styles.iconCircle}>
              <Ionicons name="shield-checkmark" size={48} color={COLORS.primary} />
            </View>
          </View>

          <Text style={styles.pageTitle}>Segurança da Conta</Text>
          <Text style={styles.pageDescription}>
            Mantenha sua conta segura alterando sua senha regularmente
          </Text>

          {/* Form Card */}
          <Card style={styles.formCard}>
            {/* Senha Atual */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Senha Atual *</Text>
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

            <View style={styles.divider} />

            {/* Nova Senha */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Nova Senha *</Text>
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

              {/* Password Strength Indicator */}
              {newPassword && (
                <View style={styles.strengthContainer}>
                  <View style={styles.strengthBar}>
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

            {/* Confirmar Nova Senha */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Confirmar Nova Senha *</Text>
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

              {/* Match Indicator */}
              {confirmPassword && newPassword && (
                <View style={styles.matchContainer}>
                  <Ionicons
                    name={newPassword === confirmPassword ? 'checkmark-circle' : 'close-circle'}
                    size={16}
                    color={newPassword === confirmPassword ? COLORS.success : COLORS.error}
                  />
                  <Text
                    style={[
                      styles.matchText,
                      { color: newPassword === confirmPassword ? COLORS.success : COLORS.error },
                    ]}
                  >
                    {newPassword === confirmPassword ? 'As senhas coincidem' : 'As senhas não coincidem'}
                  </Text>
                </View>
              )}
            </View>
          </Card>

          {/* Requirements Card */}
          <Card style={styles.requirementsCard}>
            <Text style={styles.requirementsTitle}>
              <Ionicons name="information-circle" size={16} color={COLORS.info} />
              {' '}Requisitos da Senha
            </Text>
            <View style={styles.requirementsList}>
              <View style={styles.requirement}>
                <Ionicons
                  name={newPassword.length >= 6 ? 'checkmark-circle' : 'ellipse-outline'}
                  size={18}
                  color={newPassword.length >= 6 ? COLORS.success : COLORS.gray400}
                />
                <Text style={styles.requirementText}>Mínimo de 6 caracteres</Text>
              </View>
              <View style={styles.requirement}>
                <Ionicons
                  name={/[A-Z]/.test(newPassword) ? 'checkmark-circle' : 'ellipse-outline'}
                  size={18}
                  color={/[A-Z]/.test(newPassword) ? COLORS.success : COLORS.gray400}
                />
                <Text style={styles.requirementText}>Pelo menos uma letra maiúscula</Text>
              </View>
              <View style={styles.requirement}>
                <Ionicons
                  name={/[a-z]/.test(newPassword) ? 'checkmark-circle' : 'ellipse-outline'}
                  size={18}
                  color={/[a-z]/.test(newPassword) ? COLORS.success : COLORS.gray400}
                />
                <Text style={styles.requirementText}>Pelo menos uma letra minúscula</Text>
              </View>
              <View style={styles.requirement}>
                <Ionicons
                  name={/[0-9]/.test(newPassword) ? 'checkmark-circle' : 'ellipse-outline'}
                  size={18}
                  color={/[0-9]/.test(newPassword) ? COLORS.success : COLORS.gray400}
                />
                <Text style={styles.requirementText}>Pelo menos um número</Text>
              </View>
              <View style={styles.requirement}>
                <Ionicons
                  name={newPassword !== currentPassword && newPassword ? 'checkmark-circle' : 'ellipse-outline'}
                  size={18}
                  color={newPassword !== currentPassword && newPassword ? COLORS.success : COLORS.gray400}
                />
                <Text style={styles.requirementText}>Diferente da senha atual</Text>
              </View>
            </View>
          </Card>

          {/* Security Tips */}
          <Card style={styles.tipsCard}>
            <Text style={styles.tipsTitle}>
              <Ionicons name="shield-outline" size={16} color={COLORS.warning} />
              {' '}Dicas de Segurança
            </Text>
            <View style={styles.tipsList}>
              <View style={styles.tip}>
                <Text style={styles.tipBullet}>•</Text>
                <Text style={styles.tipText}>Use uma combinação de letras, números e símbolos</Text>
              </View>
              <View style={styles.tip}>
                <Text style={styles.tipBullet}>•</Text>
                <Text style={styles.tipText}>Evite usar informações pessoais óbvias</Text>
              </View>
              <View style={styles.tip}>
                <Text style={styles.tipBullet}>•</Text>
                <Text style={styles.tipText}>Não reutilize senhas de outras contas</Text>
              </View>
              <View style={styles.tip}>
                <Text style={styles.tipBullet}>•</Text>
                <Text style={styles.tipText}>Altere sua senha regularmente</Text>
              </View>
            </View>
          </Card>

          {/* Actions */}
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

          {/* Forgot Password Link */}
          <TouchableOpacity
            style={styles.forgotPasswordLink}
            onPress={() => navigation.navigate('ForgotPassword' as never)}
            disabled={loading}
          >
            <Ionicons name="help-circle-outline" size={18} color={COLORS.primary} />
            <Text style={styles.forgotPasswordText}>Esqueceu sua senha atual?</Text>
          </TouchableOpacity>

          <View style={{ height: 40 }} />
        </ScrollView>
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.primary,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  headerButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontFamily: FONTS.bold,
    color: COLORS.white,
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
  iconCircle: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: COLORS.primary + '20',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pageTitle: {
    fontSize: 24,
    fontFamily: FONTS.bold,
    color: COLORS.gray900,
    textAlign: 'center',
    marginBottom: 8,
  },
  pageDescription: {
    fontSize: 14,
    fontFamily: FONTS.regular,
    color: COLORS.gray600,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
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
  divider: {
    height: 1,
    backgroundColor: COLORS.gray200,
    marginVertical: 20,
  },
  strengthContainer: {
    marginTop: 12,
    gap: 6,
  },
  strengthBar: {
    height: 6,
    backgroundColor: COLORS.gray200,
    borderRadius: 3,
    overflow: 'hidden',
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
  requirementsCard: {
    padding: 16,
    backgroundColor: COLORS.info + '10',
    borderLeftWidth: 4,
    borderLeftColor: COLORS.info,
    marginBottom: 16,
  },
  requirementsTitle: {
    fontSize: 15,
    fontFamily: FONTS.bold,
    color: COLORS.gray900,
    marginBottom: 12,
  },
  requirementsList: {
    gap: 10,
  },
  requirement: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  requirementText: {
    fontSize: 13,
    fontFamily: FONTS.regular,
    color: COLORS.gray700,
  },
  tipsCard: {
    padding: 16,
    backgroundColor: COLORS.warning + '10',
    borderLeftWidth: 4,
    borderLeftColor: COLORS.warning,
    marginBottom: 16,
  },
  tipsTitle: {
    fontSize: 15,
    fontFamily: FONTS.bold,
    color: COLORS.gray900,
    marginBottom: 12,
  },
  tipsList: {
    gap: 8,
  },
  tip: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  tipBullet: {
    fontSize: 16,
    fontFamily: FONTS.bold,
    color: COLORS.warning,
    marginTop: -2,
  },
  tipText: {
    flex: 1,
    fontSize: 13,
    fontFamily: FONTS.regular,
    color: COLORS.gray700,
    lineHeight: 18,
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
  forgotPasswordText: {
    fontSize: 14,
    fontFamily: FONTS.medium,
    color: COLORS.primary,
  },
});

export default ChangePasswordScreen;