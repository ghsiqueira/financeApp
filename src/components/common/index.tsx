import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  StyleSheet,
  ViewStyle,
  TextStyle,
  TextInputProps,
  TouchableOpacityProps,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, FONTS, FONT_SIZES, SPACING, BORDER_RADIUS, SHADOWS } from '../../constants';

// Loading Component
interface LoadingProps {
  size?: 'small' | 'large';
  color?: string;
  text?: string;
}

export const Loading: React.FC<LoadingProps> = ({ 
  size = 'large', 
  color = COLORS.primary, 
  text 
}) => (
  <View style={styles.loadingContainer}>
    <ActivityIndicator size={size} color={color} />
    {text && <Text style={styles.loadingText}>{text}</Text>}
  </View>
);

// Button Component
interface ButtonProps extends TouchableOpacityProps {
  title: string;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'small' | 'medium' | 'large';
  loading?: boolean;
  icon?: keyof typeof Ionicons.glyphMap;
  iconPosition?: 'left' | 'right';
  gradient?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  title,
  variant = 'primary',
  size = 'medium',
  loading = false,
  icon,
  iconPosition = 'left',
  gradient = false,
  style,
  disabled,
  ...props
}) => {
  // Helper function to get button styles safely - only ViewStyle properties
  const getButtonVariantStyle = (variant: string): ViewStyle => {
    const variantMap: Record<string, ViewStyle> = {
      primary: styles.buttonPrimary,
      secondary: styles.buttonSecondary,
      outline: styles.buttonOutline,
      ghost: styles.buttonGhost,
    };
    return variantMap[variant] || {};
  };

  const getButtonSizeStyle = (size: string): ViewStyle => {
    const sizeMap: Record<string, ViewStyle> = {
      small: styles.buttonSmall,
      medium: styles.buttonMedium,
      large: styles.buttonLarge,
    };
    return sizeMap[size] || {};
  };

  const getButtonTextVariantStyle = (variant: string): TextStyle => {
    const variantMap: Record<string, TextStyle> = {
      primary: styles.buttonTextPrimary,
      secondary: styles.buttonTextSecondary,
      outline: styles.buttonTextOutline,
      ghost: styles.buttonTextGhost,
    };
    return variantMap[variant] || {};
  };

  const getButtonTextSizeStyle = (size: string): TextStyle => {
    const sizeMap: Record<string, TextStyle> = {
      small: styles.buttonTextSmall,
      medium: styles.buttonTextMedium,
      large: styles.buttonTextLarge,
    };
    return sizeMap[size] || {};
  };

  const buttonViewStyles: ViewStyle[] = [
    styles.button,
    getButtonVariantStyle(variant),
    getButtonSizeStyle(size),
    disabled ? styles.buttonDisabled : {},
  ];

  const textStyles: TextStyle[] = [
    styles.buttonText,
    getButtonTextVariantStyle(variant),
    getButtonTextSizeStyle(size),
    disabled ? styles.buttonTextDisabled : {},
  ];

  // Combine external style with button view styles
  const finalButtonStyle: ViewStyle[] = style 
    ? [...buttonViewStyles, style as ViewStyle] 
    : buttonViewStyles;

  const content = (
    <View style={styles.buttonContent}>
      {loading ? (
        <ActivityIndicator size="small" color={variant === 'outline' ? COLORS.primary : COLORS.white} />
      ) : (
        <>
          {icon && iconPosition === 'left' && (
            <Ionicons 
              name={icon} 
              size={size === 'small' ? 16 : size === 'large' ? 24 : 20} 
              color={variant === 'outline' ? COLORS.primary : COLORS.white} 
              style={styles.buttonIconLeft}
            />
          )}
          <Text style={textStyles}>{title}</Text>
          {icon && iconPosition === 'right' && (
            <Ionicons 
              name={icon} 
              size={size === 'small' ? 16 : size === 'large' ? 24 : 20} 
              color={variant === 'outline' ? COLORS.primary : COLORS.white} 
              style={styles.buttonIconRight}
            />
          )}
        </>
      )}
    </View>
  );

  if (gradient && variant === 'primary' && !disabled) {
    const gradientViewStyle: ViewStyle = StyleSheet.flatten(buttonViewStyles);

    return (
      <TouchableOpacity {...props} disabled={disabled || loading} style={style}>
        <LinearGradient
          colors={[COLORS.primary, COLORS.secondary]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[gradientViewStyle, { borderWidth: 0 }]}
        >
          {content}
        </LinearGradient>
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity {...props} style={finalButtonStyle} disabled={disabled || loading}>
      {content}
    </TouchableOpacity>
  );
};

// Input Component
interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  icon?: keyof typeof Ionicons.glyphMap;
  iconPosition?: 'left' | 'right';
  onIconPress?: () => void;
  required?: boolean;
}

export const Input: React.FC<InputProps> = ({
  label,
  error,
  icon,
  iconPosition = 'right',
  onIconPress,
  required = false,
  style,
  ...props
}) => (
  <View style={styles.inputContainer}>
    {label && (
      <Text style={styles.inputLabel}>
        {label}
        {required && <Text style={styles.inputRequired}> *</Text>}
      </Text>
    )}
    <View style={[styles.inputWrapper, error && styles.inputWrapperError]}>
      {icon && iconPosition === 'left' && (
        <TouchableOpacity onPress={onIconPress} style={styles.inputIconLeft}>
          <Ionicons name={icon} size={20} color={COLORS.gray500} />
        </TouchableOpacity>
      )}
      <TextInput
        style={[
          styles.input,
          icon && iconPosition === 'left' && styles.inputWithIconLeft,
          icon && iconPosition === 'right' && styles.inputWithIconRight,
          style,
        ]}
        placeholderTextColor={COLORS.gray400}
        {...props}
      />
      {icon && iconPosition === 'right' && (
        <TouchableOpacity onPress={onIconPress} style={styles.inputIconRight}>
          <Ionicons name={icon} size={20} color={COLORS.gray500} />
        </TouchableOpacity>
      )}
    </View>
    {error && <Text style={styles.inputError}>{error}</Text>}
  </View>
);

// Card Component
interface CardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  padding?: keyof typeof SPACING;
  shadow?: boolean;
}

export const Card: React.FC<CardProps> = ({ 
  children, 
  style, 
  padding = 'md',
  shadow = true 
}) => (
  <View style={[
    styles.card,
    { padding: SPACING[padding] },
    shadow && SHADOWS.md,
    style
  ]}>
    {children}
  </View>
);

// Empty State Component
interface EmptyStateProps {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  description?: string;
  actionText?: string;
  onAction?: () => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  actionText,
  onAction,
}) => (
  <View style={styles.emptyState}>
    <View style={styles.emptyStateIcon}>
      <Ionicons name={icon} size={64} color={COLORS.gray400} />
    </View>
    <Text style={styles.emptyStateTitle}>{title}</Text>
    {description && (
      <Text style={styles.emptyStateDescription}>{description}</Text>
    )}
    {actionText && onAction && (
      <Button
        title={actionText}
        onPress={onAction}
        variant="outline"
        style={styles.emptyStateButton}
      />
    )}
  </View>
);

// Status Badge Component
interface StatusBadgeProps {
  status: 'success' | 'warning' | 'error' | 'info';
  text: string;
  size?: 'small' | 'medium';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  text,
  size = 'medium',
}) => {
  const badgeColors = {
    success: { bg: COLORS.successLight, text: COLORS.successDark },
    warning: { bg: COLORS.warningLight, text: COLORS.warningDark },
    error: { bg: COLORS.errorLight, text: COLORS.errorDark },
    info: { bg: COLORS.infoLight, text: COLORS.infoDark },
  };

  // Helper functions to get styles safely
  const getStatusBadgeSizeStyle = (size: string): ViewStyle => {
    const sizeMap: Record<string, ViewStyle> = {
      small: styles.statusBadgeSmall,
      medium: styles.statusBadgeMedium,
    };
    return sizeMap[size] || {};
  };

  const getStatusBadgeTextSizeStyle = (size: string): TextStyle => {
    const sizeMap: Record<string, TextStyle> = {
      small: styles.statusBadgeTextSmall,
      medium: styles.statusBadgeTextMedium,
    };
    return sizeMap[size] || {};
  };

  return (
    <View style={[
      styles.statusBadge,
      getStatusBadgeSizeStyle(size),
      { backgroundColor: badgeColors[status].bg }
    ]}>
      <Text style={[
        styles.statusBadgeText,
        getStatusBadgeTextSizeStyle(size),
        { color: badgeColors[status].text }
      ]}>
        {text}
      </Text>
    </View>
  );
};

// Divider Component
interface DividerProps {
  color?: string;
  thickness?: number;
  style?: ViewStyle;
}

export const Divider: React.FC<DividerProps> = ({
  color = COLORS.gray200,
  thickness = 1,
  style,
}) => (
  <View style={[{ height: thickness, backgroundColor: color }, style]} />
);

const styles = StyleSheet.create({
  // Loading
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.lg,
  },
  loadingText: {
    marginTop: SPACING.md,
    fontSize: FONT_SIZES.md,
    color: COLORS.textSecondary,
    fontFamily: FONTS.regular,
  },

  // Button
  button: {
    borderRadius: BORDER_RADIUS.md,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
  },
  buttonPrimary: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  buttonSecondary: {
    backgroundColor: COLORS.secondary,
    borderColor: COLORS.secondary,
  },
  buttonOutline: {
    backgroundColor: 'transparent',
    borderColor: COLORS.primary,
  },
  buttonGhost: {
    backgroundColor: 'transparent',
    borderColor: 'transparent',
  },
  buttonSmall: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    minHeight: 36,
  },
  buttonMedium: {
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    minHeight: 48,
  },
  buttonLarge: {
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.lg,
    minHeight: 56,
  },
  buttonDisabled: {
    backgroundColor: COLORS.gray200,
    borderColor: COLORS.gray200,
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    fontFamily: FONTS.medium,
    textAlign: 'center',
  },
  buttonTextPrimary: {
    color: COLORS.white,
  },
  buttonTextSecondary: {
    color: COLORS.white,
  },
  buttonTextOutline: {
    color: COLORS.primary,
  },
  buttonTextGhost: {
    color: COLORS.primary,
  },
  buttonTextSmall: {
    fontSize: FONT_SIZES.sm,
  },
  buttonTextMedium: {
    fontSize: FONT_SIZES.md,
  },
  buttonTextLarge: {
    fontSize: FONT_SIZES.lg,
  },
  buttonTextDisabled: {
    color: COLORS.gray400,
  },
  buttonIconLeft: {
    marginRight: SPACING.sm,
  },
  buttonIconRight: {
    marginLeft: SPACING.sm,
  },

  // Input
  inputContainer: {
    marginBottom: SPACING.md,
  },
  inputLabel: {
    fontSize: FONT_SIZES.sm,
    fontFamily: FONTS.medium,
    color: COLORS.textPrimary,
    marginBottom: SPACING.xs,
  },
  inputRequired: {
    color: COLORS.error,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.gray300,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: COLORS.white,
  },
  inputWrapperError: {
    borderColor: COLORS.error,
  },
  input: {
    flex: 1,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    fontSize: FONT_SIZES.md,
    fontFamily: FONTS.regular,
    color: COLORS.textPrimary,
    minHeight: 48,
  },
  inputWithIconLeft: {
    paddingLeft: SPACING.sm,
  },
  inputWithIconRight: {
    paddingRight: SPACING.sm,
  },
  inputIconLeft: {
    paddingLeft: SPACING.md,
  },
  inputIconRight: {
    paddingRight: SPACING.md,
  },
  inputError: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.error,
    marginTop: SPACING.xs,
    fontFamily: FONTS.regular,
  },

  // Card
  card: {
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.md,
    marginBottom: SPACING.md,
  },

  // Empty State
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.xl,
  },
  emptyStateIcon: {
    marginBottom: SPACING.lg,
  },
  emptyStateTitle: {
    fontSize: FONT_SIZES.xl,
    fontFamily: FONTS.bold,
    color: COLORS.textPrimary,
    textAlign: 'center',
    marginBottom: SPACING.sm,
  },
  emptyStateDescription: {
    fontSize: FONT_SIZES.md,
    fontFamily: FONTS.regular,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: SPACING.lg,
  },
  emptyStateButton: {
    minWidth: 200,
  },

  // Status Badge
  statusBadge: {
    borderRadius: BORDER_RADIUS.full,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    alignSelf: 'flex-start',
  },
  statusBadgeSmall: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: 2,
  },
  statusBadgeMedium: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
  },
  statusBadgeText: {
    fontFamily: FONTS.medium,
    textAlign: 'center',
  },
  statusBadgeTextSmall: {
    fontSize: FONT_SIZES.xs,
  },
  statusBadgeTextMedium: {
    fontSize: FONT_SIZES.sm,
  },
});