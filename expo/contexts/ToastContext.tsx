import React, { useState, useCallback } from 'react';
import createContextHook from '@nkzw/create-context-hook';
import TransactionToast, { ToastData } from '@/components/TransactionToast';

export const [ToastProvider, useToast] = createContextHook(() => {
  const [currentToast, setCurrentToast] = useState<ToastData | null>(null);
  const [visible, setVisible] = useState<boolean>(false);
  const queueRef = React.useRef<ToastData[]>([]);

  const showTransactionToast = useCallback((data: ToastData) => {
    console.log('🔔 Showing transaction toast:', data.type, data.amount, data.currency);
    if (visible) {
      queueRef.current = [...queueRef.current, data];
    } else {
      setCurrentToast(data);
      setVisible(true);
    }
  }, [visible]);

  const dismissToast = useCallback(() => {
    setVisible(false);
    setCurrentToast(null);
    setTimeout(() => {
      if (queueRef.current.length > 0) {
        const [next, ...rest] = queueRef.current;
        queueRef.current = rest;
        setCurrentToast(next);
        setVisible(true);
      }
    }, 400);
  }, []);

  return { showTransactionToast, dismissToast, currentToast, visible };
});

export function ToastOverlay() {
  const { currentToast, visible, dismissToast } = useToast();
  return (
    <TransactionToast
      data={currentToast}
      visible={visible}
      onDismiss={dismissToast}
    />
  );
}
