// src/screens/PlaceholderScreens.tsx
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONTS, FONT_SIZES, SPACING } from '../constants';

const PlaceholderScreen = ({ title }: { title: string }) => (
  <View style={styles.container}>
    <Ionicons name="construct-outline" size={64} color={COLORS.gray400} />
    <Text style={styles.title}>{title}</Text>
    <Text style={styles.description}>
      Esta tela está em desenvolvimento e será implementada em breve.
    </Text>
  </View>
);

export const ProfileScreen = () => <PlaceholderScreen title="Perfil" />;
export const SettingsScreen = () => <PlaceholderScreen title="Configurações" />;
export const EditProfileScreen = () => <PlaceholderScreen title="Editar Perfil" />;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
    padding: SPACING.xl,
  },
  title: {
    fontSize: FONT_SIZES.xl,
    fontFamily: FONTS.bold,
    color: COLORS.gray900,
    marginTop: SPACING.lg,
    marginBottom: SPACING.sm,
    textAlign: 'center',
  },
  description: {
    fontSize: FONT_SIZES.md,
    fontFamily: FONTS.regular,
    color: COLORS.gray600,
    textAlign: 'center',
    lineHeight: 20,
  },
});