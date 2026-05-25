import { create } from 'zustand';

import { 
  createWallet,
  importWalletFromMnemonic,
  importWalletFromPrivateKey,
  getStoredWallet, 
  getUSDTBalance,
  getTRXBalance,
  getTransactionHistory,
  sendUSDT,
  sendTRX,
  clearWallet,
} from '@/services/tronService';
import { Transaction, WalletState } from '@/types/wallet';
import { 
  requestNotificationPermissions, 
  checkForNewIncomingTransactions 
} from '@/services/notificationService';

interface WalletStore extends WalletState {
  initializeWallet: () => Promise<void>;
  createWallet: () => Promise<void>;
  importWalletFromMnemonic: (mnemonic: string) => Promise<void>;
  importWalletFromPrivateKey: (privateKey: string) => Promise<void>;
  refreshBalance: () => Promise<void>;
  refreshTransactions: () => Promise<void>;
  silentRefreshTransactions: () => Promise<boolean>;
  silentRefreshBalance: () => Promise<void>;
  sendUSDTTransaction: (toAddress: string, amount: string) => Promise<{ txID: string; success: boolean }>;
  sendTRXTransaction: (toAddress: string, amount: string) => Promise<{ txID: string; success: boolean }>;
  resetWallet: () => Promise<void>;
}

const maskAddress = (value: string | null): string => {
  if (!value) {
    return 'unknown';
  }

  if (value.length <= 12) {
    return value;
  }

  return `${value.slice(0, 6)}...${value.slice(-4)}`;
};

export const useWalletStore = create<WalletStore>()((set, get) => ({
      address: null,
      privateKey: null,
      mnemonic: null,
      usdtBalance: '0',
      trxBalance: '0',
      transactions: [],
      isLoading: true,
      error: null,

      initializeWallet: async () => {
        set({ isLoading: true, error: null });
        try {
          await requestNotificationPermissions();
          
          const { address, privateKey, mnemonic } = await getStoredWallet();
          
          if (address && privateKey) {
            set({ address, privateKey, mnemonic });
            await get().refreshBalance();
            await get().refreshTransactions();
          }
        } catch (error) {
          set({ error: (error as Error).message });
          console.error('Error initializing wallet:', error);
        } finally {
          set({ isLoading: false });
        }
      },

      createWallet: async () => {
        set({ isLoading: true, error: null });
        try {
          const { address, privateKey, mnemonic } = await createWallet();
          set({ address, privateKey, mnemonic, isLoading: false });
          
          get().refreshBalance().catch(err => {
            console.error('Error refreshing balance after wallet creation:', err);
          });
        } catch (error) {
          set({ error: (error as Error).message, isLoading: false });
          console.error('Error creating wallet:', error);
          throw error;
        }
      },

      importWalletFromMnemonic: async (mnemonic: string) => {
        set({ isLoading: true, error: null });
        try {
          const result = await importWalletFromMnemonic(mnemonic);
          set({ address: result.address, privateKey: result.privateKey, mnemonic: result.mnemonic, isLoading: false });
          
          Promise.all([
            get().refreshBalance(),
            get().refreshTransactions()
          ]).catch(err => {
            console.error('Error refreshing data after import:', err);
          });
        } catch (error) {
          set({ error: (error as Error).message, isLoading: false });
          console.error('Error importing wallet from mnemonic:', error);
          throw error;
        }
      },

      importWalletFromPrivateKey: async (privateKey: string) => {
        set({ isLoading: true, error: null });
        try {
          const result = await importWalletFromPrivateKey(privateKey);
          set({ address: result.address, privateKey: result.privateKey, mnemonic: result.mnemonic, isLoading: false });
          
          Promise.all([
            get().refreshBalance(),
            get().refreshTransactions()
          ]).catch(err => {
            console.error('Error refreshing data after import:', err);
          });
        } catch (error) {
          set({ error: (error as Error).message, isLoading: false });
          console.error('Error importing wallet from private key:', error);
          throw error;
        }
      },

      refreshBalance: async () => {
        const { address } = get();
        if (!address) return;
        
        try {
          console.log('Refreshing balance for wallet:', maskAddress(address));
          const [usdtBalance, trxBalance] = await Promise.all([
            getUSDTBalance(address),
            getTRXBalance(address)
          ]);
          set({ usdtBalance, trxBalance });
        } catch (error) {
          console.error('Error refreshing balance:', error);
          set({ error: (error as Error).message });
        }
      },

      refreshTransactions: async () => {
        const { address } = get();
        if (!address) {
          console.log('No wallet address available for refreshing transactions');
          set({ isLoading: false });
          return;
        }
        
        set({ isLoading: true, error: null });
        try {
          console.log('=== Starting transaction refresh for wallet:', maskAddress(address));
          const transactions = await getTransactionHistory(address);
          console.log('=== Transactions fetched successfully:', transactions.length, 'transactions');
          if (transactions.length === 0) {
            console.log('=== No transactions found. This could mean:');
            console.log('    1. The wallet has no transaction history');
            console.log('    2. The API is not returning data for this network');
            console.log('    3. The address is new and has not made any transactions');
          }
          
          await checkForNewIncomingTransactions(transactions, address);
          
          set({ transactions, isLoading: false, error: null });
        } catch (error) {
          console.error('=== Error refreshing transactions:', error);
          const errorMessage = error instanceof Error ? error.message : 'Failed to fetch transactions';
          set({ error: errorMessage, isLoading: false });
        }
      },

      sendUSDTTransaction: async (toAddress: string, amount: string) => {
        const { address, privateKey } = get();
        if (!address || !privateKey) {
          throw new Error('Wallet not initialized');
        }
        
        set({ isLoading: true, error: null });
        try {
          console.log(`Sending ${amount} USDT to ${maskAddress(toAddress)}`);
          const result = await sendUSDT(address, privateKey, toAddress, amount);
          
          if (result.success) {
            const newTransaction: Transaction = {
              txID: result.txID,
              timestamp: Date.now(),
              amount,
              from: address,
              to: toAddress,
              type: 'outgoing',
              status: 'pending',
              currency: 'USDT',
              fee: result.fee || '0'
            };
            
            set(state => ({
              transactions: [newTransaction, ...state.transactions]
            }));
            
            setTimeout(() => {
              get().refreshBalance();
              get().refreshTransactions();
            }, 3000);
          }
          
          return result;
        } catch (error) {
          console.error('Error sending USDT:', error);
          set({ error: (error as Error).message });
          throw error;
        } finally {
          set({ isLoading: false });
        }
      },

      sendTRXTransaction: async (toAddress: string, amount: string) => {
        const { address, privateKey } = get();
        if (!address || !privateKey) {
          throw new Error('Wallet not initialized');
        }
        
        set({ isLoading: true, error: null });
        try {
          console.log(`Sending ${amount} TRX to ${maskAddress(toAddress)}`);
          const result = await sendTRX(address, privateKey, toAddress, amount);
          
          if (result.success) {
            const newTransaction: Transaction = {
              txID: result.txID,
              timestamp: Date.now(),
              amount,
              from: address,
              to: toAddress,
              type: 'outgoing',
              status: 'pending',
              currency: 'TRX'
            };
            
            set(state => ({
              transactions: [newTransaction, ...state.transactions]
            }));
            
            setTimeout(() => {
              get().refreshBalance();
              get().refreshTransactions();
            }, 3000);
          }
          
          return result;
        } catch (error) {
          console.error('Error sending TRX:', error);
          set({ error: (error as Error).message });
          throw error;
        } finally {
          set({ isLoading: false });
        }
      },

      silentRefreshBalance: async () => {
        const { address } = get();
        if (!address) return;
        try {
          const [usdtBalance, trxBalance] = await Promise.all([
            getUSDTBalance(address),
            getTRXBalance(address)
          ]);
          set({ usdtBalance, trxBalance });
        } catch (error) {
          console.log('Silent balance refresh error:', error);
        }
      },

      silentRefreshTransactions: async () => {
        const { address, transactions: currentTxs } = get();
        if (!address) return false;
        try {
          const transactions = await getTransactionHistory(address);
          const hasNewTransactions = transactions.length > 0 && (
            currentTxs.length === 0 ||
            transactions[0]?.txID !== currentTxs[0]?.txID ||
            transactions.length !== currentTxs.length
          );

          if (hasNewTransactions) {
            console.log('🆕 New wallet transactions detected silently');
            await checkForNewIncomingTransactions(transactions, address);
            set({ transactions, error: null });
          }
          return hasNewTransactions;
        } catch (error) {
          console.log('Silent transaction check error:', error);
          return false;
        }
      },

      resetWallet: async () => {
        set({ isLoading: true });
        try {
          await clearWallet();
          set({
            address: null,
            privateKey: null,
            mnemonic: null,
            usdtBalance: '0',
            trxBalance: '0',
            transactions: [],
            error: null
          });
        } catch (error) {
          console.error('Error resetting wallet:', error);
          set({ error: (error as Error).message });
        } finally {
          set({ isLoading: false });
        }
      }
    })
);
