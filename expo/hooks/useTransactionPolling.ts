import { useEffect, useRef, useCallback } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { useWalletStore } from '@/hooks/useWalletStore';

const SILENT_CHECK_INTERVAL = 60000;

export function useTransactionPolling() {
  const { address, silentRefreshTransactions, silentRefreshBalance } = useWalletStore();
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const appStateRef = useRef<AppStateStatus>(AppState.currentState);

  const silentCheck = useCallback(async () => {
    if (!address) return;
    try {
      console.log('👁️ Silent check for new transactions...');
      const hasNew = await silentRefreshTransactions();
      if (hasNew) {
        await silentRefreshBalance();
      }
    } catch (error) {
      console.log('Silent check error:', error);
    }
  }, [address, silentRefreshTransactions, silentRefreshBalance]);

  const startPolling = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    if (!address) return;

    console.log('👁️ Smart transaction monitoring started (every 60s)');
    intervalRef.current = setInterval(silentCheck, SILENT_CHECK_INTERVAL);
  }, [address, silentCheck]);

  const stopPolling = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
      console.log('⏹️ Transaction monitoring paused');
    }
  }, []);

  useEffect(() => {
    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      if (
        appStateRef.current.match(/inactive|background/) &&
        nextAppState === 'active'
      ) {
        console.log('📱 App came to foreground — running silent check');
        silentCheck();
        startPolling();
      } else if (nextAppState.match(/inactive|background/)) {
        stopPolling();
      }
      appStateRef.current = nextAppState;
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);

    return () => {
      subscription.remove();
    };
  }, [silentCheck, startPolling, stopPolling]);

  useEffect(() => {
    if (address) {
      startPolling();
    } else {
      stopPolling();
    }

    return () => {
      stopPolling();
    };
  }, [address, startPolling, stopPolling]);

  return { silentCheck, startPolling, stopPolling };
}
