import { useEffect } from 'react';
import { useToast } from '@/contexts/ToastContext';
import { registerToastCallback, unregisterToastCallback } from '@/services/notificationService';

export function useToastBridge() {
  const { showTransactionToast } = useToast();

  useEffect(() => {
    console.log('🔗 Toast bridge registered');
    registerToastCallback((payload) => {
      showTransactionToast({
        id: payload.id,
        type: payload.type,
        amount: payload.amount,
        currency: payload.currency,
        txID: payload.txID,
      });
    });

    return () => {
      unregisterToastCallback();
      console.log('🔗 Toast bridge unregistered');
    };
  }, [showTransactionToast]);
}
