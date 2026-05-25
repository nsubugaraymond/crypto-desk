export interface Transaction {
  txID: string;
  timestamp: number;
  amount: string;
  from: string;
  to: string;
  type: 'incoming' | 'outgoing';
  status: 'confirmed' | 'pending';
  currency: 'USDT' | 'TRX';
  fee?: string;
}

export interface WalletState {
  address: string | null;
  privateKey: string | null;
  mnemonic: string | null;
  usdtBalance: string;
  trxBalance: string;
  transactions: Transaction[];
  isLoading: boolean;
  error: string | null;
}
