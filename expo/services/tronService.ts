import '@/utils/polyfills';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import * as bip39 from 'bip39';
import TronWebLib from 'tronweb';

const getTronWebConstructor = () => {
  if (typeof (TronWebLib as any).TronWeb === 'function') {
    return (TronWebLib as any).TronWeb;
  }
  if (typeof (TronWebLib as any).default === 'function') {
    return (TronWebLib as any).default;
  }
  if (typeof TronWebLib === 'function') {
    return TronWebLib;
  }
  throw new Error('TronWeb constructor not found');
};

const USDT_CONTRACT_ADDRESSES: Record<NetworkType, string | null> = {
  mainnet: 'TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t',
  nile: 'TXYZopYRdj2D9XRtbG411XZZ3kM5VkAeBf',
};

const STORAGE_KEYS = {
  MNEMONIC: 'wallet_mnemonic',
  PRIVATE_KEY: 'wallet_private_key',
  ADDRESS: 'wallet_address',
  NETWORK: 'wallet_network',
};

const maskAddress = (value: string | null | undefined): string => {
  if (!value) {
    return 'unknown';
  }

  if (value.length <= 12) {
    return value;
  }

  return `${value.slice(0, 6)}...${value.slice(-4)}`;
};

export type NetworkType = 'mainnet' | 'nile';

interface NetworkConfig {
  fullHost: string;
  apiKey?: string;
}

const NETWORKS: Record<NetworkType, NetworkConfig> = {
  mainnet: {
    fullHost: 'https://api.trongrid.io',
  },
  nile: {
    fullHost: 'https://nile.trongrid.io',
  },
};

let currentNetwork: NetworkType = 'nile';
let tronWeb: any = null;
let isInitializing = false;

const initTronWeb = (network: NetworkType = currentNetwork) => {
  if (isInitializing || (tronWeb && currentNetwork === network)) return;
  isInitializing = true;
  
  const config = NETWORKS[network];
  try {
    const TronWeb = getTronWebConstructor();
    tronWeb = new TronWeb({ fullHost: config.fullHost });
    currentNetwork = network;
    console.log(`TronWeb: ${network}`);
  } catch (error) {
    console.error('TronWeb init failed:', error);
    tronWeb = null;
  } finally {
    isInitializing = false;
  }
};

const ensureTronWeb = () => {
  if (!tronWeb) {
    initTronWeb('nile');
  }
  return tronWeb;
};

export const setNetwork = async (network: NetworkType) => {
  initTronWeb(network);
  await secureStoreSetItem(STORAGE_KEYS.NETWORK, network);
};

export const getNetwork = async (): Promise<NetworkType> => {
  const stored = await secureStoreGetItem(STORAGE_KEYS.NETWORK);
  return (stored as NetworkType) || 'nile';
};

const secureStoreSetItem = async (key: string, value: string) => {
  if (Platform.OS === 'web') {
    localStorage.setItem(key, value);
  } else {
    await SecureStore.setItemAsync(key, value);
  }
};

const secureStoreGetItem = async (key: string): Promise<string | null> => {
  if (Platform.OS === 'web') {
    return localStorage.getItem(key);
  } else {
    return await SecureStore.getItemAsync(key);
  }
};

const secureStoreDeleteItem = async (key: string) => {
  if (Platform.OS === 'web') {
    localStorage.removeItem(key);
  } else {
    await SecureStore.deleteItemAsync(key);
  }
};

export const createWallet = async () => {
  try {
    if (typeof (global as any).Buffer === 'undefined') {
      throw new Error('Buffer polyfill not loaded');
    }
    
    ensureTronWeb();
    if (!tronWeb) throw new Error('TronWeb not initialized');
    
    const TronWebUtils = tronWeb.utils || (TronWebLib as any).utils;
    if (!TronWebUtils || !TronWebUtils.accounts) throw new Error('TronWeb utils not available');
    
    const account = TronWebUtils.accounts.generateAccount();
    if (!account || !account.privateKey || !account.address) throw new Error('Failed to generate account');
    
    const privateKey = account.privateKey.replace(/^0x/, '');
    const address = account.address.base58;

    await secureStoreSetItem(STORAGE_KEYS.PRIVATE_KEY, privateKey);
    await secureStoreSetItem(STORAGE_KEYS.ADDRESS, address);
    await secureStoreDeleteItem(STORAGE_KEYS.MNEMONIC);

    console.log('Wallet created for address:', maskAddress(address));
    return { address, privateKey, mnemonic: null };
  } catch (error) {
    console.error('Wallet creation failed:', error);
    throw error;
  }
};

export const importWalletFromMnemonic = async (mnemonic: string) => {
  try {
    if (!bip39.validateMnemonic(mnemonic.trim())) throw new Error('Invalid mnemonic phrase');

    ensureTronWeb();
    const TronWebUtils = tronWeb.utils || (TronWebLib as any).utils;
    const hdNode = TronWebUtils.accounts.generateAccountWithMnemonic(mnemonic.trim());

    await secureStoreSetItem(STORAGE_KEYS.MNEMONIC, mnemonic.trim());
    await secureStoreSetItem(STORAGE_KEYS.PRIVATE_KEY, hdNode.privateKey);
    await secureStoreSetItem(STORAGE_KEYS.ADDRESS, hdNode.address);

    console.log('Mnemonic imported for address:', maskAddress(hdNode.address));
    return { address: hdNode.address, privateKey: hdNode.privateKey, mnemonic: mnemonic.trim() };
  } catch (error) {
    console.error('Mnemonic import failed:', error);
    throw error;
  }
};

export const importWalletFromPrivateKey = async (privateKey: string) => {
  try {
    const cleanPrivateKey = privateKey.trim();
    if (cleanPrivateKey.length !== 64) throw new Error('Invalid private key length');

    ensureTronWeb();
    const address = tronWeb.address.fromPrivateKey(cleanPrivateKey);

    await secureStoreSetItem(STORAGE_KEYS.PRIVATE_KEY, cleanPrivateKey);
    await secureStoreSetItem(STORAGE_KEYS.ADDRESS, address);
    await secureStoreDeleteItem(STORAGE_KEYS.MNEMONIC);

    console.log('Private key imported for address:', maskAddress(address));
    return { address, privateKey: cleanPrivateKey, mnemonic: null };
  } catch (error) {
    console.error('PK import failed:', error);
    throw new Error('Invalid private key');
  }
};

export const getStoredWallet = async () => {
  try {
    const address = await secureStoreGetItem(STORAGE_KEYS.ADDRESS);
    const privateKey = await secureStoreGetItem(STORAGE_KEYS.PRIVATE_KEY);
    const mnemonic = await secureStoreGetItem(STORAGE_KEYS.MNEMONIC);
    const network = await getNetwork();
    if (network !== currentNetwork) initTronWeb(network);
    return { address, privateKey, mnemonic };
  } catch (error) {
    console.error('Get wallet failed:', error);
    return { address: null, privateKey: null, mnemonic: null };
  }
};

export const clearWallet = async () => {
  try {
    await secureStoreDeleteItem(STORAGE_KEYS.MNEMONIC);
    await secureStoreDeleteItem(STORAGE_KEYS.PRIVATE_KEY);
    await secureStoreDeleteItem(STORAGE_KEYS.ADDRESS);
  } catch (error) {
    console.error('Clear wallet failed:', error);
    throw error;
  }
};

export const getUSDTBalance = async (address: string): Promise<string> => {
  try {
    const contractAddress = USDT_CONTRACT_ADDRESSES[currentNetwork];
    if (!contractAddress) return '0.00';
    
    try {
      const balance = await getUSDTBalanceViaTronScan(address, contractAddress);
      if (balance !== null) return balance;
    } catch {
      // Fallback to TronGrid
    }
    
    try {
      return await getUSDTBalanceViaTronGrid(address, contractAddress);
    } catch {
      return '0.00';
    }
  } catch {
    return '0.00';
  }
};

const getUSDTBalanceViaTronScan = async (address: string, contractAddress: string): Promise<string | null> => {
  try {
    const apiUrl = currentNetwork === 'mainnet'
      ? 'https://apilist.tronscanapi.com/api'
      : 'https://nileapi.tronscan.org/api';
    
    const response = await fetch(
      `${apiUrl}/account/tokens?address=${address}&start=0&limit=20`,
      { method: 'GET', headers: { 'Accept': 'application/json' } }
    );
    
    if (!response.ok) return null;
    
    const data = await response.json();
    
    if (data.data && Array.isArray(data.data)) {
      for (const token of data.data) {
        const tokenId = token.tokenId || token.token_id || token.contractAddress;
        if (tokenId === contractAddress || token.tokenAbbr === 'USDT' || token.tokenName?.includes('USDT')) {
          const balance = token.balance || token.amount || '0';
          const decimals = token.tokenDecimal || token.decimals || 6;
          return (parseFloat(balance) / Math.pow(10, decimals)).toFixed(2);
        }
      }
    }
    
    const trc20Response = await fetch(`${apiUrl}/account/wallet?address=${address}`, {
      method: 'GET', headers: { 'Accept': 'application/json' },
    });
    
    if (trc20Response.ok) {
      const trc20Data = await trc20Response.json();
      
      if (trc20Data.data && Array.isArray(trc20Data.data)) {
        for (const item of trc20Data.data) {
          if (item.token_id === contractAddress || item.tokenAbbr === 'USDT') {
            return (parseFloat(item.balance || '0') / Math.pow(10, item.tokenDecimal || 6)).toFixed(2);
          }
        }
      }
      
      if (trc20Data.withPriceTokens && Array.isArray(trc20Data.withPriceTokens)) {
        for (const token of trc20Data.withPriceTokens) {
          if (token.tokenId === contractAddress || token.tokenAbbr === 'USDT') {
            return (parseFloat(token.balance || '0') / Math.pow(10, token.tokenDecimal || 6)).toFixed(2);
          }
        }
      }
    }
    
    return null;
  } catch {
    return null;
  }
};

const getUSDTBalanceViaTronGrid = async (address: string, contractAddress: string): Promise<string> => {
  const apiUrl = currentNetwork === 'mainnet' ? 'https://api.trongrid.io' : 'https://nile.trongrid.io';
  
  ensureTronWeb();
  if (!tronWeb) throw new Error('TronWeb not available');
  
  let hexAddress: string;
  try {
    hexAddress = tronWeb.address.toHex(address).replace(/^41/, '');
  } catch {
    hexAddress = address;
  }
  
  const parameter = hexAddress.toLowerCase().padStart(64, '0');
  
  const response = await fetch(`${apiUrl}/wallet/triggerconstantcontract`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
    body: JSON.stringify({
      owner_address: address,
      contract_address: contractAddress,
      function_selector: 'balanceOf(address)',
      parameter,
      visible: true,
    }),
  });
  
  if (!response.ok) throw new Error(`API error: ${response.status}`);
  
  const data = await response.json();
  if (data.result?.result === false || !data.constant_result?.[0]) return '0.00';
  
  const balanceHex = data.constant_result[0];
  if (!balanceHex || balanceHex === '0' || balanceHex === '0000000000000000000000000000000000000000000000000000000000000000') return '0.00';
  
  const balanceNumber = parseInt(balanceHex, 16);
  if (isNaN(balanceNumber)) return '0.00';
  
  return (balanceNumber / 1000000).toFixed(2);
};

export const getTRXBalance = async (address: string): Promise<string> => {
  try {
    ensureTronWeb();
    const balance = await tronWeb.trx.getBalance(address);
    return tronWeb.fromSun(balance);
  } catch {
    return '0';
  }
};

export const getTransactionHistory = async (address: string) => {
  try {
    ensureTronWeb();
    const apiUrl = currentNetwork === 'mainnet' 
      ? 'https://apilist.tronscanapi.com/api'
      : 'https://nileapi.tronscan.org/api';
    
    const trongridUrl = currentNetwork === 'mainnet'
      ? 'https://api.trongrid.io'
      : 'https://nile.trongrid.io';
    
    const transactions: any[] = [];
    const contractAddress = USDT_CONTRACT_ADDRESSES[currentNetwork];
    
    if (contractAddress) {
      let trc20Fetched = false;
      
      try {
        const trc20GridUrl = `${trongridUrl}/v1/accounts/${address}/transactions/trc20?limit=50&contract_address=${contractAddress}`;
        console.log('Fetching TRC-20 transactions from TronGrid for wallet:', maskAddress(address));
        const trc20GridResponse = await fetch(trc20GridUrl, {
          method: 'GET',
          headers: { 'Accept': 'application/json' },
        });
        
        if (trc20GridResponse.ok) {
          const trc20GridData = await trc20GridResponse.json();
          console.log('TronGrid TRC-20 response keys:', Object.keys(trc20GridData));
          const trc20Txs = trc20GridData.data || [];
          console.log('TronGrid TRC-20 transactions count:', trc20Txs.length);
          
          if (Array.isArray(trc20Txs) && trc20Txs.length > 0) {
            trc20Fetched = true;
            for (const tx of trc20Txs) {
              const tokenInfo = tx.token_info || {};
              const decimals = tokenInfo.decimals || 6;
              const value = tx.value || '0';
              const amount = (Number(value) / Math.pow(10, decimals)).toFixed(2);
              const txFrom = tx.from || '';
              const txTo = tx.to || '';
              
              transactions.push({
                txID: tx.transaction_id,
                timestamp: tx.block_timestamp,
                amount,
                from: txFrom,
                to: txTo,
                type: txTo.toLowerCase() === address.toLowerCase() ? 'incoming' as const : 'outgoing' as const,
                status: 'confirmed' as const,
                currency: 'USDT' as const,
              });
            }
            console.log('TRC-20 USDT transactions added from TronGrid:', trc20Txs.length);
          }
        }
      } catch (e) {
        console.log('TronGrid TRC-20 fetch failed:', e);
      }
      
      if (!trc20Fetched) {
        try {
          const trc20Url = `${apiUrl}/token_trc20/transfers?limit=50&start=0&sort=-timestamp&count=true&relatedAddress=${address}&contract_address=${contractAddress}`;
          console.log('Fetching TRC-20 transactions from TronScan for wallet:', maskAddress(address));
          const trc20Response = await fetch(trc20Url);
          
          if (trc20Response.ok) {
            const trc20Data = await trc20Response.json();
            console.log('TronScan TRC-20 response keys:', Object.keys(trc20Data));
            
            const transfers = trc20Data.token_transfers || trc20Data.data || trc20Data.transfers || [];
            console.log('TronScan TRC-20 transfers count:', transfers.length);
            
            if (Array.isArray(transfers)) {
              for (const tx of transfers) {
                const txFrom = tx.from_address || tx.from || tx.transferFromAddress || '';
                const txTo = tx.to_address || tx.to || tx.transferToAddress || '';
                const value = tx.quant || tx.value || tx.amount || '0';
                const decimals = tx.tokenInfo?.tokenDecimal || tx.decimals || 6;
                const amount = (Number(value) / Math.pow(10, decimals)).toFixed(2);
                
                transactions.push({
                  txID: tx.transaction_id || tx.hash || tx.txID,
                  timestamp: tx.block_ts || tx.block_timestamp || tx.timestamp,
                  amount,
                  from: txFrom,
                  to: txTo,
                  type: txTo.toLowerCase() === address.toLowerCase() ? 'incoming' as const : 'outgoing' as const,
                  status: tx.contractRet === 'SUCCESS' || tx.finalResult === 'SUCCESS' || !tx.contractRet ? 'confirmed' as const : 'pending' as const,
                  currency: 'USDT' as const,
                });
              }
            }
          }
        } catch (e) {
          console.log('TronScan TRC-20 fetch failed:', e);
        }
      }
    }
    
    try {
      const trxUrl = `${apiUrl}/transaction?sort=-timestamp&count=true&limit=50&start=0&address=${address}`;
      const trxResponse = await fetch(trxUrl, { method: 'GET', headers: { 'Accept': 'application/json' } });
      
      if (trxResponse.ok) {
        const trxData = await trxResponse.json();
        const txArray = trxData.data && Array.isArray(trxData.data) ? trxData.data : (Array.isArray(trxData) ? trxData : []);
        
        for (const tx of txArray) {
          const txId = tx.hash || tx.txID || tx.transaction_id;
          if (!txId || (tx.contractType !== 1 && tx.contractType !== '1')) continue;
          
          let amount = tx.amount || tx.value || (tx.contractData?.amount) || 0;
          if (!amount) continue;
          
          try {
            const txAmount = tronWeb.fromSun(amount);
            const txFrom = tx.ownerAddress || tx.from || tx.contractData?.owner_address || address;
            const txTo = tx.toAddress || tx.to || tx.contractData?.to_address || address;
            
            transactions.push({
              txID: txId,
              timestamp: tx.timestamp || tx.block_timestamp,
              amount: txAmount,
              from: txFrom,
              to: txTo,
              type: txTo?.toLowerCase() === address.toLowerCase() ? 'incoming' as const : 'outgoing' as const,
              status: (tx.contractRet === 'SUCCESS' || tx.confirmed || !tx.contractRet) ? 'confirmed' as const : 'pending' as const,
              currency: 'TRX' as const,
            });
          } catch {}
        }
      }
    } catch {}

    transactions.sort((a, b) => b.timestamp - a.timestamp);
    return transactions;
  } catch {
    return [];
  }
};

export const sendUSDT = async (
  fromAddress: string,
  privateKey: string,
  toAddress: string,
  amount: string
) => {
  try {
    console.log(`Send: ${amount} USDT -> ${maskAddress(toAddress)}`);

    const contractAddress = USDT_CONTRACT_ADDRESSES[currentNetwork];
    if (!contractAddress) throw new Error(`USDT not available on ${currentNetwork}`);
    if (!isValidTronAddress(toAddress)) throw new Error('Invalid recipient address');

    const amountInSun = Math.floor(parseFloat(amount) * 1000000);
    if (amountInSun <= 0) throw new Error('Amount must be greater than 0');
    console.log(`Amount in smallest unit (6 decimals): ${amountInSun}`);

    const cleanPrivateKey = privateKey.startsWith('0x') ? privateKey.substring(2) : privateKey;
    
    const TronWeb = getTronWebConstructor();
    const config = NETWORKS[currentNetwork];
    const txTronWeb = new TronWeb({ fullHost: config.fullHost, privateKey: cleanPrivateKey });
    
    const configuredAddress = txTronWeb.address.fromPrivateKey(cleanPrivateKey);
    if (configuredAddress.toLowerCase() !== fromAddress.toLowerCase()) {
      throw new Error('Private key does not match sender address');
    }

    try {
      const accountInfo = await txTronWeb.trx.getAccount(fromAddress);
      if (!accountInfo || !accountInfo.address) {
        throw new Error('Wallet not activated on TRON network. Send TRX to this wallet first to activate it.');
      }
      console.log('Wallet activated ✓');
    } catch {
      throw new Error('Failed to verify wallet activation. Ensure wallet has received TRX before.');
    }

    const currentBalance = await getUSDTBalance(fromAddress);
    if (parseFloat(currentBalance) < parseFloat(amount)) {
      throw new Error(`Insufficient USDT. Have ${currentBalance}, need ${amount}`);
    }

    const trxBalanceBefore = await getTRXBalance(fromAddress);
    const trxBalanceNum = parseFloat(trxBalanceBefore);
    const minRequiredTRX = 20;
    if (trxBalanceNum < minRequiredTRX) {
      throw new Error(`Need ${minRequiredTRX} TRX for fees. Have: ${trxBalanceBefore} TRX`);
    }
    console.log(`TRX Balance: ${trxBalanceBefore} TRX ✓`);

    console.log('=== USDT Transfer Debug Info ===');
    console.log(`From Address (parameter): ${maskAddress(fromAddress)}`);
    console.log(`TronWeb defaultAddress: ${maskAddress(txTronWeb.defaultAddress?.base58)}`);
    console.log(`Amount: ${amount} USDT (${amountInSun} in smallest unit)`);
    console.log(`To Address: ${maskAddress(toAddress)}`);
    console.log(`Contract Address: ${contractAddress}`);
    console.log(`Network: ${currentNetwork}`);
    
    try {
      console.log(`Loading contract: ${contractAddress}`);
      
      const contractInfo = await txTronWeb.trx.getContract(contractAddress);
      if (!contractInfo || !contractInfo.contract_address) {
        throw new Error(`USDT contract not found at ${contractAddress} on ${currentNetwork}. Please verify the contract address on ${currentNetwork === 'mainnet' ? 'tronscan.org' : 'nile.tronscan.org'}`);
      }
      console.log('Contract exists on chain ✓');
      
      const contract = await txTronWeb.contract().at(contractAddress);
      if (!contract?.transfer) throw new Error('Contract load failed - transfer method not found');
      console.log('Contract loaded with transfer() method ✓');
      
      console.log('=== Pre-flight checks (no simulation on TRON) ===');
      console.log(`✓ USDT balance verified: ${currentBalance} >= ${amount}`);
      console.log(`✓ TRX balance verified: ${trxBalanceBefore} >= ${minRequiredTRX}`);
      console.log(`✓ Signer address matches: ${maskAddress(configuredAddress)}`);
      console.log(`✓ Wallet activated on TRON network`);
      
      console.log('=== Sending USDT transaction (using send() only) ===');
      const result = await contract.transfer(toAddress, amountInSun).send({
        feeLimit: 150000000,
        callValue: 0,
        shouldPollResponse: false,
      });
      
      const txID = typeof result === 'string' ? result : result?.txid || result?.transaction?.txID;
      if (!txID || typeof txID !== 'string') throw new Error('No transaction ID received');
      
      console.log(`TX broadcast: ${txID}`);
      console.log('Transaction broadcasted, starting polling (up to 120s)...');
      
      let actualFee = '0';
      let txSuccess = false;
      let txFailed = false;
      let attempts = 0;
      const maxAttempts = 40;
      const pollInterval = 3000;
      let lastError = '';
      
      while (attempts < maxAttempts) {
        try {
          console.log(`Poll attempt ${attempts + 1}/${maxAttempts}...`);
          const txInfo = await txTronWeb.trx.getTransactionInfo(txID);
          
          if (txInfo && Object.keys(txInfo).length > 0) {
            const receiptResult = txInfo.receipt?.result;
            console.log(`Receipt: ${receiptResult || 'undefined'}`);
            
            if (txInfo.result === 'FAILED' || receiptResult === 'REVERT' || receiptResult === 'OUT_OF_ENERGY') {
              lastError = receiptResult || txInfo.result || 'FAILED';
              console.error(`✗ Transaction FAILED: ${lastError}`);
              txFailed = true;
              
              if (receiptResult === 'OUT_OF_ENERGY') {
                throw new Error('Transaction reverted: Out of energy. Need more TRX (30+) for network fees.');
              }
              
              throw new Error(`Transaction reverted: ${lastError}. Causes: 1) Wrong USDT contract for ${currentNetwork}, 2) Insufficient balance, 3) Need more TRX (25+).`);
            }
            
            if (receiptResult === 'SUCCESS') {
              txSuccess = true;
              console.log('✓ Transaction confirmed');
              const fee = txInfo.fee || 0;
              actualFee = (fee / 1000000).toFixed(6);
              const energyFee = txInfo.receipt?.energy_fee || 0;
              
              if (parseFloat(actualFee) === 0 && energyFee > 0) {
                actualFee = (energyFee / 1000000).toFixed(6);
              }
              
              if (parseFloat(actualFee) === 0) {
                const trxBalanceAfter = await getTRXBalance(fromAddress);
                const feePaid = parseFloat(trxBalanceBefore) - parseFloat(trxBalanceAfter);
                if (feePaid > 0) actualFee = feePaid.toFixed(6);
              }
              
              console.log(`Fee: ${actualFee} TRX`);
              break;
            }
          }
          
          await new Promise(resolve => setTimeout(resolve, pollInterval));
          attempts++;
        } catch (verifyError) {
          if (verifyError instanceof Error && 
              (verifyError.message.includes('reverted') || verifyError.message.includes('REVERT') || verifyError.message.includes('energy'))) {
            throw verifyError;
          }
          console.log('Poll error, retrying:', verifyError);
          await new Promise(resolve => setTimeout(resolve, pollInterval));
          attempts++;
        }
      }
      
      if (!txSuccess && !txFailed) {
        console.log('⏳ Transaction pending - check Tronscan');
        const tronscanUrl = currentNetwork === 'mainnet' 
          ? `https://tronscan.org/#/transaction/${txID}`
          : `https://nile.tronscan.org/#/transaction/${txID}`;
        return { 
          txID, 
          success: true, 
          pending: true, 
          fee: '0',
          tronscanUrl 
        };
      }
      
      console.log('=== Transaction completed ===');
      return { txID, success: true, pending: false, fee: actualFee };
      
    } catch (contractError: any) {
      const errorStr = contractError?.message || contractError?.toString() || '';
      console.error('Contract execution error:', errorStr);
      
      if (errorStr.includes('REVERT') || errorStr.includes('revert')) {
        throw new Error(`Transaction reverted on ${currentNetwork}. The USDT contract at ${contractAddress} may not be valid. Check: 1) Contract has USDT tokens, 2) Contract is TRC20 compliant, 3) You have test USDT tokens. Verify on ${currentNetwork === 'mainnet' ? 'tronscan.org' : 'nile.tronscan.org'}/#/contract/${contractAddress}`);
      }
      if (errorStr.includes('OUT_OF_ENERGY') || errorStr.includes('energy')) {
        throw new Error('Out of energy. Need 30+ TRX.');
      }
      if (errorStr.includes('balance')) throw new Error('Insufficient USDT balance.');
      if (errorStr.includes('bandwidth')) throw new Error('Insufficient bandwidth. Need more TRX.');
      
      throw new Error(`Transaction failed: ${errorStr}`);
    }
  } catch (error) {
    console.error('USDT send failed:', error);
    throw new Error(error instanceof Error ? error.message : 'Failed to send USDT');
  }
};

export const sendTRX = async (
  fromAddress: string,
  privateKey: string,
  toAddress: string,
  amount: string
) => {
  try {
    if (!isValidTronAddress(toAddress)) throw new Error('Invalid recipient address');

    ensureTronWeb();
    const amountInSun = tronWeb.toSun(amount);
    if (amountInSun <= 0) throw new Error('Amount must be greater than 0');

    tronWeb.setPrivateKey(privateKey);
    const transaction = await tronWeb.trx.sendTransaction(toAddress, amountInSun);
    const txID = transaction.txid || transaction.transaction?.txID;
    
    console.log(`TRX TX: ${txID}`);
    return { txID, success: true };
  } catch (error) {
    console.error('TRX send failed:', error);
    throw error;
  }
};

export const isValidTronAddress = (address: string): boolean => {
  try {
    ensureTronWeb();
    return tronWeb.isAddress(address);
  } catch {
    return false;
  }
};

export const getUSDTPrice = async (): Promise<number> => {
  try {
    const response = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=tether&vs_currencies=usd');
    const data = await response.json();
    return data.tether?.usd || 1.0;
  } catch {
    return 1.0;
  }
};

export const getTRXPrice = async (): Promise<number> => {
  try {
    const response = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=tron&vs_currencies=usd');
    const data = await response.json();
    return data.tron?.usd || 0.10;
  } catch {
    return 0.10;
  }
};

export const estimateUSDTTransactionFee = async (fromAddress: string, toAddress: string, amount?: string): Promise<{ feeInTRX: string; feeInUSD: string; hasEnergy: boolean; energyNeeded: number }> => {
  try {
    ensureTronWeb();
    
    if (!isValidTronAddress(toAddress)) return { feeInTRX: '0', feeInUSD: '0.00', hasEnergy: false, energyNeeded: 31895 };
    
    const contractAddress = USDT_CONTRACT_ADDRESSES[currentNetwork];
    if (!contractAddress) return { feeInTRX: '0', feeInUSD: '0.00', hasEnergy: false, energyNeeded: 31895 };
    
    const resources = await getAccountResources(fromAddress);
    const availableEnergy = resources.energyLimit - resources.energyUsed;
    const energyNeeded = 31895;
    let feeInTRX = 0;
    const hasEnergy = availableEnergy >= energyNeeded;
    
    try {
      const amountToSend = amount ? Math.floor(parseFloat(amount) * 1000000).toString() : '1000000';
      
      const transactionObject = await tronWeb.transactionBuilder.triggerSmartContract(
        contractAddress,
        'transfer(address,uint256)',
        { feeLimit: 150000000, callValue: 0 },
        [{ type: 'address', value: toAddress }, { type: 'uint256', value: amountToSend }],
        fromAddress
      );

      if (transactionObject?.transaction) {
        const energyRequired = transactionObject.energy_used || energyNeeded;
        
        if (availableEnergy < energyRequired) {
          feeInTRX = (energyRequired - availableEnergy) * 0.00042;
        }
        
        const availableBandwidth = resources.freeNetLimit - resources.freeNetUsed;
        if (availableBandwidth < 345) feeInTRX += 0.001;
        
        feeInTRX = Math.max(feeInTRX, 0.1);
      }
    } catch {
      if (!hasEnergy) {
        feeInTRX = Math.max((energyNeeded - availableEnergy) * 0.00042, 13.5);
      } else {
        feeInTRX = 0.1;
      }
      
      if ((resources.freeNetLimit - resources.freeNetUsed) < 345) feeInTRX += 0.001;
    }
    
    const trxPrice = await getTRXPrice();
    const feeInUSD = (feeInTRX * trxPrice).toFixed(2);
    
    return { feeInTRX: feeInTRX.toFixed(6), feeInUSD, hasEnergy, energyNeeded };
  } catch {
    return { feeInTRX: '15.000000', feeInUSD: '1.50', hasEnergy: false, energyNeeded: 31895 };
  }
};

export const estimateTransactionFee = (): string => {
  return '0.27-15';
};

export const getAccountResources = async (address: string) => {
  try {
    ensureTronWeb();
    const resources = await tronWeb.trx.getAccountResources(address);
    return {
      freeNetLimit: resources.freeNetLimit || 0,
      freeNetUsed: resources.freeNetUsed || 0,
      energyLimit: resources.EnergyLimit || 0,
      energyUsed: resources.EnergyUsed || 0,
    };
  } catch {
    return { freeNetLimit: 0, freeNetUsed: 0, energyLimit: 0, energyUsed: 0 };
  }
};
