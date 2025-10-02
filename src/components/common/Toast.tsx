// src/components/common/Toast.tsx
import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONTS, FONT_SIZES, SPACING, BORDER_RADIUS, SHADOWS } from '../../constants';

const { width } = Dimensions.get('window');

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface ToastProps {
  visible: boolean;
  message: string;
  type?: ToastType;
  duration?: number;
  onHide?: () => void;
  action?: {
    label: string;
    onPress: () => void;
  };
}

const TOAST_CONFIG = {
  success: {
    icon: 'checkmark-circle' as const,
    color: COLORS.success,
    backgroundColor: COLORS.success + '15',
  },
  error: {
    icon: 'close-circle' as const,
    color: COLORS.error,
    backgroundColor: COLORS.error + '15',
  },
  warning: {
    icon: 'warning' as const,
    color: COLORS.warning,
    backgroundColor: COLORS.warning + '15',
  },
  info: {
    icon: 'information-circle' as const,
    color: COLORS.info,
    backgroundColor: COLORS.info + '15',
  },
};

export const Toast: React.FC<ToastProps> = ({
  visible,
  message,
  type = 'info',
  duration = 3000,
  onHide,
  action,
}) => {
  const translateY = useRef(new Animated.Value(-100)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  const config = TOAST_CONFIG[type];

  useEffect(() => {
    if (visible) {
      // Mostrar toast
      Animated.parallel([
        Animated.spring(translateY, {
          toValue: 0,
          useNativeDriver: true,
          tension: 50,
          friction: 8,
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();

      // Auto-hide após duration
      if (duration > 0) {
        const timer = setTimeout(() => {
          hideToast();
        }, duration);

        return () => clearTimeout(timer);
      }
    } else {
      hideToast();
    }
  }, [visible]);

  const hideToast = () => {
    Animated.parallel([
      Animated.timing(translateY, {
        toValue: -100,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onHide?.();
    });
  };

  if (!visible) {
    return null;
  }

  return (
    <Animated.View
      style={[
        styles.container,
        {
          transform: [{ translateY }],
          opacity,
        },
      ]}
    >
      <View style={[styles.toast, { backgroundColor: config.backgroundColor }]}>
        <View style={styles.content}>
          <View style={[styles.iconContainer, { backgroundColor: config.color + '30' }]}>
            <Ionicons name={config.icon} size={20} color={config.color} />
          </View>

          <Text style={styles.message} numberOfLines={2}>
            {message}
          </Text>

          {action && (
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => {
                action.onPress();
                hideToast();
              }}
            >
              <Text style={[styles.actionText, { color: config.color }]}>
                {action.label}
              </Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={styles.closeButton}
            onPress={hideToast}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="close" size={18} color={COLORS.gray600} />
          </TouchableOpacity>
        </View>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 9999,
    paddingTop: SPACING.md,
    paddingHorizontal: SPACING.md,
  },
  toast: {
    borderRadius: BORDER_RADIUS.lg,
    ...SHADOWS.lg,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.md,
  },
  iconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.sm,
  },
  message: {
    flex: 1,
    fontSize: FONT_SIZES.sm,
    fontFamily: FONTS.medium,
    color: COLORS.textPrimary,
    lineHeight: 20,
  },
  actionButton: {
    marginLeft: SPACING.sm,
    paddingHorizontal: SPACING.sm,
  },
  actionText: {
    fontSize: FONT_SIZES.sm,
    fontFamily: FONTS.semibold,
  },
  closeButton: {
    marginLeft: SPACING.xs,
    padding: SPACING.xs,
  },
});