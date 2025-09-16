// src/components/common/index.tsx

import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  ActivityIndicator,
  ViewStyle,
  TextStyle,
  TextInputProps,
  TouchableOpacityProps,
  Alert,
  Modal,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONTS, FONT_SIZES, SPACING, BORDER_RADIUS, SHADOWS } from '../../constants';

// Interface para Button
interface ButtonProps extends TouchableOpacityProps {
  title: string;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  icon?: string;
  iconPosition?: 'left' | 'right';
  fullWidth?: boolean;
}

// Componente Button
export const Button: React.FC<ButtonProps> = ({
  title,
  variant = 'primary',
  size = 'md',
  loading = false,
  icon,
  iconPosition = 'left',
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

  const renderIcon = () => {
    if (loading) {
      return <ActivityIndicator size="small" color={getIconColor()} />;
    }
    if (icon) {
      return <Ionicons name={icon as any} size={getIconSize()} color={getIconColor()} />;
    }
    return null;
  };

  const getIconColor = () => {
    if (disabled || loading) return COLORS.gray400;
    switch (variant) {
      case 'primary':
      case 'danger':
        return COLORS.white;
      case 'secondary':
        return COLORS.white;
      case 'outline':
        return COLORS.primary;
      case 'ghost':
        return COLORS.primary;
      default:
        return COLORS.white;
    }
  };

  const getIconSize = () => {
    switch (size) {
      case 'sm': return 16;
      case 'md': return 20;
      case 'lg': return 24;
      default: return 20;
    }
  };

  return (
    <TouchableOpacity
      style={buttonStyles}
      disabled={disabled || loading}
      {...props}
    >
      <View style={styles.buttonContent}>
        {icon && iconPosition === 'left' && renderIcon()}
        {loading && !icon && renderIcon()}
        <Text style={textStyles}>{title}</Text>
        {icon && iconPosition === 'right' && renderIcon()}
      </View>
    </TouchableOpacity>
  );
};

// Interface para Input
interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  leftIcon?: string;
  rightIcon?: string;
  onRightIconPress?: () => void;
  required?: boolean;
}

// Componente Input
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

// Interface para Card
interface CardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  padding?: boolean;
  shadow?: boolean;
}

// Componente Card
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
      shadow && SHADOWS.md,
      style,
    ]}>
      {children}
    </View>
  );
};

// Interface para Loading
interface LoadingProps {
  text?: string;
  size?: 'small' | 'large';
  color?: string;
}

// Componente Loading
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

// Interface para Badge
interface BadgeProps {
  text: string;
  variant?: 'success' | 'warning' | 'error' | 'info' | 'neutral';
  size?: 'sm' | 'md';
}

// Componente Badge
export const Badge: React.FC<BadgeProps> = ({
  text,
  variant = 'neutral',
  size = 'md',
}) => {
  return (
    <View style={[
      styles.badge,
      styles[`badge_${variant}`],
      styles[`badge_${size}`],
    ]}>
      <Text style={[
        styles.badgeText,
        styles[`badgeText_${variant}`],
        styles[`badgeText_${size}`],
      ]}>
        {text}
      </Text>
    </View>
  );
};

// Interface para Alert customizado
interface AlertProps {
  visible: boolean;
  title: string;
  message?: string;
  onConfirm: () => void;
  onCancel?: () => void;
  confirmText?: string;
  cancelText?: string;
  type?: 'info' | 'warning' | 'error' | 'success';
}

// Componente Alert customizado
export const CustomAlert: React.FC<AlertProps> = ({
  visible,
  title,
  message,
  onConfirm,
  onCancel,
  confirmText = 'OK',
  cancelText = 'Cancelar',
  type = 'info',
}) => {
  const getIconName = () => {
    switch (type) {
      case 'success': return 'checkmark-circle';
      case 'warning': return 'warning';
      case 'error': return 'close-circle';
      default: return 'information-circle';
    }
  };

  const getIconColor = () => {
    switch (type) {
      case 'success': return COLORS.success;
      case 'warning': return COLORS.warning;
      case 'error': return COLORS.error;
      default: return COLORS.info;
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onCancel}
    >
      <View style={styles.alertOverlay}>
        <View style={styles.alertContainer}>
          <View style={styles.alertHeader}>
            <Ionicons 
              name={getIconName() as any} 
              size={32} 
              color={getIconColor()} 
            />
            <Text style={styles.alertTitle}>{title}</Text>
          </View>
          
          {message && (
            <Text style={styles.alertMessage}>{message}</Text>
          )}
          
          <View style={styles.alertButtons}>
            {onCancel && (
              <Button
                title={cancelText}
                variant="outline"
                onPress={onCancel}
                style={styles.alertButton}
              />
            )}
            <Button
              title={confirmText}
              onPress={onConfirm}
              style={styles.alertButton}
            />
          </View>
        </View>
      </View>
    </Modal>
  );
};

// Interface para Empty State
interface EmptyStateProps {
  icon: string;
  title: string;
  description?: string;
  actionText?: string;
  onAction?: () => void;
}

// Componente Empty State
export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  actionText,
  onAction,
}) => {
  return (
    <View style={styles.emptyState}>
      <View style={styles.emptyStateIcon}>
        <Ionicons name={icon as any} size={64} color={COLORS.gray400} />
      </View>
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

// Estilos
const styles = StyleSheet.create({
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
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
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
    fontSize: FONT_SIZES.md,
  },
  buttonText_lg: {
    fontSize: FONT_SIZES.lg,
  },
  buttonTextDisabled: {
    color: COLORS.gray400,
  },

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
    fontSize: FONT_SIZES.md,
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
    color: COLORS.error,
    marginTop: SPACING.xs,
    fontFamily: FONTS.regular,
  },

  // Card styles
  card: {
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.lg,
    marginBottom: SPACING.md,
  },
  cardPadding: {
    padding: SPACING.md,
  },

  // Loading styles
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.xl,
  },
  loadingText: {
    marginTop: SPACING.md,
    fontSize: FONT_SIZES.md,
    color: COLORS.textSecondary,
    fontFamily: FONTS.regular,
    textAlign: 'center',
  },

  // Badge styles
  badge: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.full,
    alignSelf: 'flex-start',
  },
  badge_success: {
    backgroundColor: COLORS.success10,
  },
  badge_warning: {
    backgroundColor: COLORS.warning10,
  },
  badge_error: {
    backgroundColor: COLORS.error10,
  },
  badge_info: {
    backgroundColor: COLORS.primary10,
  },
  badge_neutral: {
    backgroundColor: COLORS.gray100,
  },
  badge_sm: {
    paddingHorizontal: SPACING.xs,
    paddingVertical: 2,
  },
  badge_md: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
  },
  badgeText: {
    fontFamily: FONTS.medium,
    textAlign: 'center',
  },
  badgeText_success: {
    color: COLORS.success,
  },
  badgeText_warning: {
    color: COLORS.warning,
  },
  badgeText_error: {
    color: COLORS.error,
  },
  badgeText_info: {
    color: COLORS.primary,
  },
  badgeText_neutral: {
    color: COLORS.gray600,
  },
  badgeText_sm: {
    fontSize: FONT_SIZES.xs,
  },
  badgeText_md: {
    fontSize: FONT_SIZES.sm,
  },

  // Alert styles
  alertOverlay: {
    flex: 1,
    backgroundColor: COLORS.overlay,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.lg,
  },
  alertContainer: {
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    width: '100%',
    maxWidth: 400,
    ...SHADOWS.lg,
  },
  alertHeader: {
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  alertTitle: {
    fontSize: FONT_SIZES.lg,
    fontFamily: FONTS.bold,
    color: COLORS.textPrimary,
    textAlign: 'center',
    marginTop: SPACING.sm,
  },
  alertMessage: {
    fontSize: FONT_SIZES.md,
    fontFamily: FONTS.regular,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: SPACING.lg,
    lineHeight: 24,
  },
  alertButtons: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  alertButton: {
    flex: 1,
  },

  // Empty State styles
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
    fontSize: FONT_SIZES.lg,
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
    marginBottom: SPACING.lg,
    lineHeight: 24,
  },
  emptyStateButton: {
    minWidth: 200,
  },
});