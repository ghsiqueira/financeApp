import { useState, useCallback } from 'react';
import { ToastType } from '../components/common/Toast';

interface ToastState {
  visible: boolean;
  message: string;
  type: ToastType;
  action?: {
    label: string;
    onPress: () => void;
  };
}

export const useToast = () => {
  const [toast, setToast] = useState<ToastState>({
    visible: false,
    message: '',
    type: 'info',
  });

  const showToast = useCallback((
    message: string,
    type: ToastType = 'info',
    action?: { label: string; onPress: () => void }
  ) => {
    setToast({
      visible: true,
      message,
      type,
      action,
    });
  }, []);

  const hideToast = useCallback(() => {
    setToast(prev => ({ ...prev, visible: false }));
  }, []);

  // Atalhos para cada tipo
  const success = useCallback((message: string, action?: { label: string; onPress: () => void }) => {
    showToast(message, 'success', action);
  }, [showToast]);

  const error = useCallback((message: string, action?: { label: string; onPress: () => void }) => {
    showToast(message, 'error', action);
  }, [showToast]);

  const warning = useCallback((message: string, action?: { label: string; onPress: () => void }) => {
    showToast(message, 'warning', action);
  }, [showToast]);

  const info = useCallback((message: string, action?: { label: string; onPress: () => void }) => {
    showToast(message, 'info', action);
  }, [showToast]);

  return {
    toast,
    showToast,
    hideToast,
    success,
    error,
    warning,
    info,
  };
};