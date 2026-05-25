import { useRouter } from 'expo-router';
import { Copy, RefreshCw, ArrowUpRight, ArrowDownLeft } from 'lucide-react-native';
import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Alert, ActivityIndicator, Platform } from 'react-native';
import * as Haptics from 'expo-haptics';
import * as Clipboard from 'expo-clipboard';

import Typography from '@/constants/typography';
import { useWalletStore } from '@/hooks/useWalletStore';
import { getUSDTPrice, getTRXPrice } from '@/services/tronService';

interface WalletCardProps {
  onTotalUsdChange?: (total: string) => void;
}

export default function WalletCard({ onTotalUsdChange }: WalletCardProps) {
  const router = useRouter();
  const { address, usdtBalance, trxBalance, isLoading, refreshBalance } = useWalletStore();
  const [usdtPrice, setUsdtPrice] = useState<number>(1.0);
  const [trxPrice, setTrxPrice] = useState<number>(0.0);
  const [isLoadingPrice, setIsLoadingPrice] = useState(false);

  useEffect(() => {
    const fetchPrices = async () => {
      setIsLoadingPrice(true);
      try {
        const [uPrice, tPrice] = await Promise.all([getUSDTPrice(), getTRXPrice()]);
        setUsdtPrice(uPrice);
        setTrxPrice(tPrice);
      } catch (error) {
        console.error('Error fetching prices:', error);
      } finally {
        setIsLoadingPrice(false);
      }
    };
    void fetchPrices();
  }, []);

  const totalUsd = (parseFloat(usdtBalance) * usdtPrice + parseFloat(trxBalance) * trxPrice).toFixed(2);

  useEffect(() => {
    onTotalUsdChange?.(totalUsd);
  }, [totalUsd, onTotalUsdChange]);

  const formatAddress = (addr: string | null) => {
    if (!addr) return '';
    return `${addr.substring(0, 8)}...${addr.substring(addr.length - 6)}`;
  };

  const copyToClipboard = async () => {
    if (!address) return;
    try {
      await Haptics.selectionAsync();
      if (Platform.OS === 'web') {
        let copied = false;
        try {
          await navigator.clipboard.writeText(address);
          copied = true;
        } catch (clipboardError) {
          console.log('Clipboard API failed, using fallback:', clipboardError);
          try {
            const textArea = document.createElement('textarea');
            textArea.value = address;
            textArea.style.position = 'fixed';
            textArea.style.left = '-999999px';
            textArea.style.top = '-999999px';
            document.body.appendChild(textArea);
            textArea.focus();
            textArea.select();
            copied = document.execCommand('copy');
            document.body.removeChild(textArea);
          } catch (fallbackError) {
            console.error('Fallback copy failed:', fallbackError);
          }
        }
        if (copied) {
          Alert.alert('Copied', 'Wallet address copied to clipboard');
        } else {
          Alert.alert('Copy Failed', 'Please manually copy the address');
        }
      } else {
        await Clipboard.setStringAsync(address);
        Alert.alert('Copied', 'Wallet address copied to clipboard');
      }
    } catch (error) {
      console.error('Failed to copy address:', error);
      Alert.alert('Error', 'Failed to copy address to clipboard');
    }
  };

  const handleRefresh = async () => {
    await Haptics.selectionAsync();
    await refreshBalance();
  };

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <View style={styles.topRow}>
          <View style={styles.addressPill}>
            <View style={styles.dot} />
            <Text style={styles.addressText}>{formatAddress(address)}</Text>
            <TouchableOpacity onPress={copyToClipboard} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <Copy size={13} color="rgba(255,255,255,0.6)" />
            </TouchableOpacity>
          </View>
          <TouchableOpacity
            style={styles.refreshBtn}
            onPress={handleRefresh}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator size="small" color="rgba(255,255,255,0.7)" />
            ) : (
              <RefreshCw size={16} color="rgba(255,255,255,0.7)" />
            )}
          </TouchableOpacity>
        </View>

        <View style={styles.balanceSection}>
          <Text style={styles.balanceLabel}>Total Balance</Text>
          {isLoadingPrice ? (
            <ActivityIndicator size="small" color="rgba(255,255,255,0.7)" style={{ marginVertical: 8 }} />
          ) : (
            <Text style={styles.balanceValue}>${parseFloat(totalUsd).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</Text>
          )}
          <Text style={styles.balanceSub}>USD</Text>
        </View>

        <View style={styles.actions}>
          <TouchableOpacity
            style={styles.actionBtn}
            onPress={() => router.push('/send' as any)}
            activeOpacity={0.75}
          >
            <View style={styles.actionIcon}>
              <ArrowUpRight size={18} color="#fff" />
            </View>
            <Text style={styles.actionLabel}>Send</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionBtn}
            onPress={() => router.push('/receive' as any)}
            activeOpacity={0.75}
          >
            <View style={styles.actionIcon}>
              <ArrowDownLeft size={18} color="#fff" />
            </View>
            <Text style={styles.actionLabel}>Receive</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'android' ? 12 : 8,
    paddingBottom: 4,
  },
  card: {
    backgroundColor: '#0A1628',
    borderRadius: Platform.OS === 'android' ? 16 : 20,
    padding: Platform.OS === 'android' ? 16 : 20,
    overflow: 'hidden',
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Platform.OS === 'android' ? 14 : 20,
  },
  addressPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 6,
    gap: 6,
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: '#00E676',
  },
  addressText: {
    ...Typography.monoSmall,
    color: 'rgba(255,255,255,0.75)',
    fontSize: 11,
  },
  refreshBtn: {
    padding: 6,
  },
  balanceSection: {
    alignItems: 'center',
    marginBottom: Platform.OS === 'android' ? 16 : 24,
  },
  balanceLabel: {
    ...Typography.smallMedium,
    color: 'rgba(255,255,255,0.5)',
    marginBottom: 6,
    textTransform: 'uppercase' as const,
    letterSpacing: 1,
  },
  balanceValue: {
    ...Typography.displayBold,
    color: '#fff',
    fontSize: Platform.OS === 'android' ? 30 : 36,
    lineHeight: Platform.OS === 'android' ? 38 : 44,
    letterSpacing: -1,
  },
  balanceSub: {
    ...Typography.smallRegular,
    color: 'rgba(255,255,255,0.4)',
    marginTop: 4,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 32,
  },
  actionBtn: {
    alignItems: 'center',
    gap: 6,
  },
  actionIcon: {
    width: Platform.OS === 'android' ? 40 : 44,
    height: Platform.OS === 'android' ? 40 : 44,
    borderRadius: Platform.OS === 'android' ? 20 : 22,
    backgroundColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionLabel: {
    ...Typography.smallMedium,
    color: 'rgba(255,255,255,0.8)',
  },
});
