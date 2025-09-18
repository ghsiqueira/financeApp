// src/components/common/BasicComponents.tsx
import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  ViewStyle,
  TextStyle,
  TouchableOpacityProps,
  TextInput,
  TextInputProps,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONTS, FONT_SIZES, SPACING, BORDER_RADIUS } from '../../constants';

// ============ INPUT COMPONENT ============
interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  leftIcon?: string;
  rightIcon?: string;
  onRightIconPress?: () => void;
  required?: boolean;
}

export const Input: React.FC<InputProps> = ({
  label,
  error,
  leftIcon,
  rightIcon,
  onRightIconPress,
  required = false,
  style,
  ...props
}) => {
  const hasError = !!error;

  return (
    <View style={styles.inputContainer}>
      {label && (
        <Text style={styles.inputLabel}>
          {label}
          {required && <Text style={styles.inputRequired}> *</Text>}
        </Text>
      )}
      <View style={[
        styles.inputWrapper,
        hasError && styles.inputWrapperError,
        style,
      ]}>
        {leftIcon && (
          <Ionicons 
            name={leftIcon as any} 
            size={20} 
            color={hasError ? COLORS.error : COLORS.gray400} 
            style={styles.inputLeftIcon}
          />
        )}
        <TextInput
          style={[
            styles.input,
            leftIcon && styles.inputWithLeftIcon,
            rightIcon && styles.inputWithRightIcon,
          ]}
          placeholderTextColor={COLORS.gray400}
          {...props}
        />
        {rightIcon && (
          <TouchableOpacity onPress={onRightIconPress} style={styles.inputRightIcon}>
            <Ionicons 
              name={rightIcon as any} 
              size={20} 
              color={hasError ? COLORS.error : COLORS.gray400} 
            />
          </TouchableOpacity>
        )}
      </View>
      {error && <Text style={styles.inputError}>{error}</Text>}
    </View>
  );
};

// ============ CARD COMPONENT ============
interface CardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  padding?: boolean;
  shadow?: boolean;
}

export const Card: React.FC<CardProps> = ({
  children,
  style,
  padding = true,
  shadow = true,
}) => {
  return (
    <View style={[
      styles.card,
      padding && styles.cardPadding,
      shadow && styles.cardShadow,
      style,
    ]}>
      {children}
    </View>
  );
};

// ============ LOADING COMPONENT ============
interface LoadingProps {
  text?: string;
  size?: 'small' | 'large';
  color?: string;
}

export const Loading: React.FC<LoadingProps> = ({
  text,
  size = 'large',
  color = COLORS.primary,
}) => {
  return (
    <View style={styles.loadingContainer}>
      <ActivityIndicator size={size} color={color} />
      {text && <Text style={styles.loadingText}>{text}</Text>}
    </View>
  );
};

// ============ BUTTON COMPONENT ============
interface ButtonProps extends TouchableOpacityProps {
  title: string;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  fullWidth?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  title,
  variant = 'primary',
  size = 'md',
  loading = false,
  fullWidth = false,
  style,
  disabled,
  ...props
}) => {
  const buttonStyles = [
    styles.button,
    styles[`button_${variant}`],
    styles[`button_${size}`],
    fullWidth && styles.buttonFullWidth,
    (disabled || loading) && styles.buttonDisabled,
    style,
  ];

  const textStyles = [
    styles.buttonText,
    styles[`buttonText_${variant}`],
    styles[`buttonText_${size}`],
    (disabled || loading) && styles.buttonTextDisabled,
  ];

  return (
    <TouchableOpacity
      style={buttonStyles}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <ActivityIndicator 
          size="small" 
          color={variant === 'outline' || variant === 'ghost' ? COLORS.primary : COLORS.white} 
        />
      ) : (
        <Text style={textStyles}>{title}</Text>
      )}
    </TouchableOpacity>
  );
};

// ============ EMPTY STATE COMPONENT ============
interface EmptyStateProps {
  icon?: string;
  title: string;
  description?: string;
  actionText?: string;
  onAction?: () => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title,
  description,
  actionText,
  onAction,
}) => {
  return (
    <View style={styles.emptyState}>
      <Text style={styles.emptyStateTitle}>{title}</Text>
      {description && (
        <Text style={styles.emptyStateDescription}>{description}</Text>
      )}
      {actionText && onAction && (
        <Button
          title={actionText}
          onPress={onAction}
          style={styles.emptyStateButton}
        />
      )}
    </View>
  );
};

// ============ STYLES ============
const styles = StyleSheet.create({
  // Input styles
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
    borderColor: COLORS.border,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: COLORS.white,
  },
  inputWrapperError: {
    borderColor: COLORS.error,
  },
  input: {
    flex: 1,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    fontSize: FONT_SIZES.base,
    fontFamily: FONTS.regular,
    color: COLORS.textPrimary,
  },
  inputWithLeftIcon: {
    paddingLeft: SPACING.xs,
  },
  inputWithRightIcon: {
    paddingRight: SPACING.xs,
  },
  inputLeftIcon: {
    marginLeft: SPACING.sm,
  },
  inputRightIcon: {
    paddingHorizontal: SPACING.sm,
  },
  inputError: {
    fontSize: FONT_SIZES.xs,
    fontFamily: FONTS.regular,
    color: COLORS.error,
    marginTop: SPACING.xs,
  },

  // Card styles
  card: {
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  cardPadding: {
    padding: SPACING.md,
  },
  cardShadow: {
    shadowColor: COLORS.black,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },

  // Loading styles
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.lg,
  },
  loadingText: {
    marginTop: SPACING.md,
    fontSize: FONT_SIZES.base,
    fontFamily: FONTS.regular,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },

  // Button styles
  button: {
    borderRadius: BORDER_RADIUS.md,
    paddingHorizontal: SPACING.md,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  button_primary: {
    backgroundColor: COLORS.primary,
  },
  button_secondary: {
    backgroundColor: COLORS.secondary,
  },
  button_outline: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  button_ghost: {
    backgroundColor: 'transparent',
  },
  button_danger: {
    backgroundColor: COLORS.error,
  },
  button_sm: {
    paddingVertical: SPACING.xs,
    paddingHorizontal: SPACING.sm,
  },
  button_md: {
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
  },
  button_lg: {
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.lg,
  },
  buttonFullWidth: {
    width: '100%',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    fontFamily: FONTS.medium,
    textAlign: 'center',
  },
  buttonText_primary: {
    color: COLORS.white,
  },
  buttonText_secondary: {
    color: COLORS.white,
  },
  buttonText_outline: {
    color: COLORS.primary,
  },
  buttonText_ghost: {
    color: COLORS.primary,
  },
  buttonText_danger: {
    color: COLORS.white,
  },
  buttonText_sm: {
    fontSize: FONT_SIZES.sm,
  },
  buttonText_md: {
    fontSize: FONT_SIZES.base,
  },
  buttonText_lg: {
    fontSize: FONT_SIZES.lg,
  },
  buttonTextDisabled: {
    color: COLORS.gray400,
  },

  // Empty State styles
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.xl,
  },
  emptyStateTitle: {
    fontSize: FONT_SIZES.lg,
    fontFamily: FONTS.bold,
    color: COLORS.textPrimary,
    textAlign: 'center',
    marginBottom: SPACING.sm,
  },
  emptyStateDescription: {
    fontSize: FONT_SIZES.base,
    fontFamily: FONTS.regular,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: SPACING.lg,
    lineHeight: 22,
  },
  emptyStateButton: {
    marginTop: SPACING.md,
  },
});