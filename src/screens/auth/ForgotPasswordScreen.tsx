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
import { useNavigation } from '@react-navigation/native';
import { Input, Button, Card } from '../../components/common';
import { useTheme } from '../../contexts/ThemeContext';
import { FONTS, FONT_SIZES, SPACING, BORDER_RADIUS } from '../../constants';
import { AuthService } from '../../services/AuthService';
import { validateEmail } from '../../utils';

const ForgotPasswordScreen: React.FC = () => {
  const navigation = useNavigation();
  const { theme } = useTheme();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSendCode = async () => {
    if (!email.trim()) {
      setError('Digite seu email');
      return;
    }

    if (!validateEmail(email)) {
      setError('Digite um email válido');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await AuthService.forgotPassword(email);

      Alert.alert(
        'Email Enviado!',
        'Enviamos um código de verificação para seu email. Verifique sua caixa de entrada.',
        [
          {
            text: 'OK',
            onPress: () => {
              (navigation as any).navigate('ResetPassword', { email });
            },
          },
        ]
      );
    } catch (err: any) {
      setError(err.message || 'Não foi possível enviar o email. Tente novamente.');
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
    inputLabel: {
      fontSize: 14,
      fontFamily: FONTS.medium,
      color: theme.textSecondary, // ✅ MUDANÇA AQUI
      marginBottom: 8,
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
    backToLoginText: {
      fontSize: 15,
      fontFamily: FONTS.medium,
      color: theme.primary,
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
              <Ionicons name="mail-outline" size={48} color={theme.primary} />
            </View>
          </View>

          <Text style={dynamicStyles.title}>Esqueceu sua senha?</Text>
          <Text style={dynamicStyles.description}>
            Digite seu email e enviaremos um código para redefinir sua senha
          </Text>

          <Card style={styles.formCard}>
            <View style={styles.inputGroup}>
              <Text style={dynamicStyles.inputLabel}>Email *</Text>
              <Input
                placeholder="seu@email.com"
                value={email}
                onChangeText={(text) => {
                  setEmail(text);
                  setError('');
                }}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                error={error}
                leftIcon="mail-outline"
                editable={!loading}
              />
            </View>

            <Button
              title="Enviar Código"
              onPress={handleSendCode}
              loading={loading}
              fullWidth
            />
          </Card>

          <Card style={dynamicStyles.helpCard}>
            <View style={styles.helpItem}>
              <Ionicons name="checkmark-circle" size={20} color={theme.success} />
              <Text style={dynamicStyles.helpText}>
                O código será enviado para seu email
              </Text>
            </View>
            <View style={styles.helpItem}>
              <Ionicons name="time-outline" size={20} color={theme.info} />
              <Text style={dynamicStyles.helpText}>
                O código expira em 15 minutos
              </Text>
            </View>
            <View style={styles.helpItem}>
              <Ionicons name="mail-unread-outline" size={20} color={theme.warning} />
              <Text style={dynamicStyles.helpText}>
                Verifique também sua caixa de spam
              </Text>
            </View>
          </Card>

          <View style={styles.footer}>
            <Text style={dynamicStyles.footerText}>Lembrou sua senha?</Text>
            <TouchableOpacity onPress={() => navigation.goBack()} disabled={loading}>
              <Text style={dynamicStyles.footerLink}>Fazer login</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={styles.backToLogin}
            onPress={() => navigation.goBack()}
            disabled={loading}
          >
            <Ionicons name="arrow-back-circle-outline" size={20} color={theme.primary} />
            <Text style={dynamicStyles.backToLoginText}>Voltar para Login</Text>
          </TouchableOpacity>
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
    paddingHorizontal: SPACING.lg,
  },
  scrollContent: {
    paddingBottom: SPACING.xl,
  },
  header: {
    paddingTop: SPACING.md,
    paddingBottom: SPACING.lg,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
  },
  iconContainer: {
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  formCard: {
    padding: 20,
    marginBottom: 16,
  },
  inputGroup: {
    marginBottom: 20,
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
  backToLogin: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
  },
});

export default ForgotPasswordScreen;
