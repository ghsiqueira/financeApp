import { useState, useCallback } from 'react';

interface ConfirmState {
  visible: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  type?: 'danger' | 'warning' | 'info';
  onConfirm: () => void;
  onCancel: () => void;
}

export const useConfirm = () => {
  const [confirm, setConfirm] = useState<ConfirmState>({
    visible: false,
    title: '',
    message: '',
    type: 'danger',
    onConfirm: () => {},
    onCancel: () => {},
  });

  const showConfirm = useCallback((options: {
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    type?: 'danger' | 'warning' | 'info';
    onConfirm: () => void;
    onCancel?: () => void;
  }) => {
    setConfirm({
      visible: true,
      title: options.title,
      message: options.message,
      confirmText: options.confirmText,
      cancelText: options.cancelText,
      type: options.type || 'danger',
      onConfirm: () => {
        options.onConfirm();
        hideConfirm();
      },
      onCancel: () => {
        options.onCancel?.();
        hideConfirm();
      },
    });
  }, []);

  const hideConfirm = useCallback(() => {
    setConfirm(prev => ({ ...prev, visible: false }));
  }, []);

  // Atalho para confirmação de deleção
  const confirmDelete = useCallback((
    itemName: string,
    onConfirm: () => void
  ) => {
    showConfirm({
      title: 'Excluir item',
      message: `Tem certeza que deseja excluir "${itemName}"? Esta ação não pode ser desfeita.`,
      confirmText: 'Excluir',
      cancelText: 'Cancelar',
      type: 'danger',
      onConfirm,
    });
  }, [showConfirm]);

  return {
    confirm,
    showConfirm,
    hideConfirm,
    confirmDelete,
  };
};
