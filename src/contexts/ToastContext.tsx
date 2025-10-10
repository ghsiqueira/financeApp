import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { Animated, StyleSheet, Text, View, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from './ThemeContext';
import { SPACING, FONT_SIZES, FONTS, BORDER_RADIUS, SHADOWS } from '../constants';

const { width } = Dimensions.get('window');

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface ToastConfig {
  message: string;
  type?: ToastType;
  duration?: number;
  title?: string;
}

interface Toast extends ToastConfig {
  id: string;
  type: ToastType;
  duration: number;
}

interface ToastContextType {
  showToast: (config: ToastConfig) => void;
  success: (message: string, title?: string) => void;
  error: (message: string, title?: string) => void;
  warning: (message: string, title?: string) => void;
  info: (message: string, title?: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

interface ToastProviderProps {
  children: ReactNode;
}

export const ToastProvider: React.FC<ToastProviderProps> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = useCallback((config: ToastConfig) => {
    const id = Date.now().toString();
    const newToast: Toast = {
      id,
      message: config.message,
      type: config.type || 'info',
      duration: config.duration || 3000,
      title: config.title,
    };

    setToasts((prev) => [...prev, newToast]);

    // Remover toast após a duração
    setTimeout(() => {
      setToasts((prev) => prev.filter((toast) => toast.id !== id));
    }, newToast.duration);
  }, []);

  const success = useCallback((message: string, title?: string) => {
    showToast({ message, type: 'success', title });
  }, [showToast]);

  const error = useCallback((message: string, title?: string) => {
    showToast({ message, type: 'error', title });
  }, [showToast]);

  const warning = useCallback((message: string, title?: string) => {
    showToast({ message, type: 'warning', title });
  }, [showToast]);

  const info = useCallback((message: string, title?: string) => {
    showToast({ message, type: 'info', title });
  }, [showToast]);

  return (
    <ToastContext.Provider value={{ showToast, success, error, warning, info }}>
      {children}
      <ToastContainer toasts={toasts} />
    </ToastContext.Provider>
  );
};

export const useToast = (): ToastContextType => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast deve ser usado dentro de ToastProvider');
  }
  return context;
};

// Componente interno do Toast Container
interface ToastContainerProps {
  toasts: Toast[];
}

const ToastContainer: React.FC<ToastContainerProps> = ({ toasts }) => {
  return (
    <View style={styles.container} pointerEvents="box-none">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} />
      ))}
    </View>
  );
};

// Componente individual do Toast
interface ToastItemProps {
  toast: Toast;
}

const ToastItem: React.FC<ToastItemProps> = ({ toast }) => {
  const { theme } = useTheme();
  const [fadeAnim] = useState(new Animated.Value(0));
  const [slideAnim] = useState(new Animated.Value(-100));

  React.useEffect(() => {
    // Animação de entrada
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }),
    ]).start();

    // Animação de saída
    const timeout = setTimeout(() => {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: -100,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    }, toast.duration - 300);

    return () => clearTimeout(timeout);
  }, [toast.duration]);

  const getToastStyle = () => {
    switch (toast.type) {
      case 'success':
        return {
          backgroundColor: theme.success,
          iconName: 'checkmark-circle' as const,
          iconColor: theme.white,
        };
      case 'error':
        return {
          backgroundColor: theme.error,
          iconName: 'close-circle' as const,
          iconColor: theme.white,
        };
      case 'warning':
        return {
          backgroundColor: theme.warning,
          iconName: 'warning' as const,
          iconColor: theme.white,
        };
      case 'info':
      default:
        return {
          backgroundColor: theme.info,
          iconName: 'information-circle' as const,
          iconColor: theme.white,
        };
    }
  };

  const toastStyle = getToastStyle();

  return (
    <Animated.View
      style={[
        styles.toast,
        {
          backgroundColor: toastStyle.backgroundColor,
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }],
        },
        SHADOWS.lg,
      ]}
    >
      <Ionicons name={toastStyle.iconName} size={24} color={toastStyle.iconColor} />
      <View style={styles.textContainer}>
        {toast.title && (
          <Text style={[styles.title, { color: theme.white }]}>{toast.title}</Text>
        )}
        <Text style={[styles.message, { color: theme.white }]} numberOfLines={2}>
          {toast.message}
        </Text>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 50,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 9999,
  },
  toast: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm + 4,
    marginHorizontal: SPACING.md,
    marginBottom: SPACING.sm,
    borderRadius: BORDER_RADIUS.lg,
    minWidth: width - SPACING.md * 2,
    maxWidth: width - SPACING.md * 2,
  },
  textContainer: {
    flex: 1,
    marginLeft: SPACING.sm + 4,
  },
  title: {
    fontSize: FONT_SIZES.md,
    fontFamily: FONTS.semibold,
    marginBottom: 2,
  },
  message: {
    fontSize: FONT_SIZES.sm,
    fontFamily: FONTS.regular,
    lineHeight: 18,
  },
});
