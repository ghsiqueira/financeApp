// src/components/common/Badge.tsx
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS, FONTS, FONT_SIZES, SPACING } from '../../constants';

interface BadgeProps {
  text: string;
  variant?: 'success' | 'warning' | 'error' | 'info' | 'neutral';
  size?: 'sm' | 'md';
}

export const Badge: React.FC<BadgeProps> = ({
  text,
  variant = 'neutral',
  size = 'md',
}) => {
  const getBackgroundColor = () => {
    switch (variant) {
      case 'success': return COLORS.success10;
      case 'warning': return COLORS.warning10;
      case 'error': return COLORS.error10;
      case 'info': return COLORS.primary10;
      default: return COLORS.gray100;
    }
  };

  const getTextColor = () => {
    switch (variant) {
      case 'success': return COLORS.success;
      case 'warning': return COLORS.warning;
      case 'error': return COLORS.error;
      case 'info': return COLORS.primary;
      default: return COLORS.textSecondary;
    }
  };

  return (
    <View style={[
      styles.badge,
      {
        backgroundColor: getBackgroundColor(),
        paddingVertical: size === 'sm' ? SPACING.xs : SPACING.sm,
        paddingHorizontal: size === 'sm' ? SPACING.sm : SPACING.md,
      }
    ]}>
      <Text style={[
        styles.text,
        {
          color: getTextColor(),
          fontSize: size === 'sm' ? FONT_SIZES.xs : FONT_SIZES.sm,
        }
      ]}>
        {text}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  text: {
    fontFamily: FONTS.medium,
    textAlign: 'center',
  },
});