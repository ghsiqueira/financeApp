import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button } from '../components/common';
import { useAuth } from '../contexts/AuthContext';
import { COLORS, FONTS, FONT_SIZES, SPACING } from '../constants';

export function MainNavigator() {
  const { user, logout } = useAuth();

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>🎉 Bem-vindo!</Text>
        <Text style={styles.subtitle}>
          Olá, {user?.name}! 
        </Text>
        <Text style={styles.description}>
          O app está funcionando perfeitamente! 
          O backend está conectado e você está autenticado.
        </Text>
        
        <View style={styles.info}>
          <Text style={styles.infoTitle}>✅ Funcionalidades implementadas:</Text>
          <Text style={styles.infoText}>• Sistema de autenticação</Text>
          <Text style={styles.infoText}>• Conexão com API</Text>
          <Text style={styles.infoText}>• Contexto de usuário</Text>
          <Text style={styles.infoText}>• Navegação</Text>
          <Text style={styles.infoText}>• Componentes base</Text>
        </View>

        <Text style={styles.nextSteps}>
          🚧 Próximos passos: Implementar telas principais
        </Text>
        
        <Button
          title="Sair"
          onPress={logout}
          variant="outline"
          icon="log-out-outline"
          style={styles.logoutButton}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.xl,
  },
  title: {
    fontSize: FONT_SIZES['3xl'],
    fontFamily: FONTS.bold,
    color: COLORS.textPrimary,
    marginBottom: SPACING.md,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: FONT_SIZES.xl,
    fontFamily: FONTS.medium,
    color: COLORS.primary,
    marginBottom: SPACING.lg,
    textAlign: 'center',
  },
  description: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: SPACING.xl,
  },
  info: {
    backgroundColor: COLORS.white,
    padding: SPACING.lg,
    borderRadius: 12,
    marginBottom: SPACING.xl,
    width: '100%',
    maxWidth: 300,
  },
  infoTitle: {
    fontSize: FONT_SIZES.md,
    fontFamily: FONTS.bold,
    color: COLORS.textPrimary,
    marginBottom: SPACING.md,
  },
  infoText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    marginBottom: SPACING.xs,
    paddingLeft: SPACING.sm,
  },
  nextSteps: {
    fontSize: FONT_SIZES.md,
    fontFamily: FONTS.medium,
    color: COLORS.warning,
    textAlign: 'center',
    marginBottom: SPACING.xl,
  },
  logoutButton: {
    minWidth: 200,
  },
});