import { useEffect } from 'react';
import createContextHook from '@nkzw/create-context-hook';
import { trpc } from '@/lib/trpc';
import { useWalletStore } from '@/hooks/useWalletStore';

export const [UserTrackingProvider, useUserTracking] = createContextHook(() => {
  const address = useWalletStore((state) => state.address);
  const usdtBalance = useWalletStore((state) => state.usdtBalance);
  const trxBalance = useWalletStore((state) => state.trxBalance);

  const registerUserMutation = trpc.users.registerUser.useMutation();
  const updateActivityMutation = trpc.users.updateUserActivity.useMutation();

  useEffect(() => {
    if (address) {
      registerUserMutation.mutate({
        address,
        usdtBalance,
        trxBalance,
      });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [address]);

  useEffect(() => {
    if (address) {
      const interval = setInterval(() => {
        updateActivityMutation.mutate({
          address,
          usdtBalance,
          trxBalance,
        });
      }, 5 * 60 * 1000);

      return () => clearInterval(interval);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [address, usdtBalance, trxBalance]);

  const trackTransaction = (currency: 'USDT' | 'TRX', amount: string) => {
    console.log(`Transaction tracked: ${amount} ${currency}`);
  };

  return {
    trackTransaction,
  };
});
