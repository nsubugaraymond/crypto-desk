import { useRouter } from 'expo-router';
import { Copy, QrCode, ShieldCheck } from 'lucide-react-native';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Alert,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Clipboard from 'expo-clipboard';
import * as Haptics from 'expo-haptics';

import AssetCard from '@/components/AssetCard';
import WalletCard from '@/components/WalletCard';
import WalletSetup from '@/components/WalletSetup';
import Colors from '@/constants/colors';
import Typography from '@/constants/typography';
import { useWalletStore } from '@/hooks/useWalletStore';
import { getTRXPrice, getUSDTPrice } from '@/services/tronService';

export default function WalletTabScreen() {
  const router = useRouter();
  const {
    address,
    usdtBalance,
    trxBalance,
    initializeWallet,
    refreshBalance,
    refreshTransactions,
    isLoading,
  } = useWalletStore();

  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [usdtPrice, setUsdtPrice] = useState<number>(1);
  const [trxPrice, setTrxPrice] = useState<number>(0.1);

  const loadPrices = useCallback(async () => {
    try {
      console.log('💱 Loading wallet prices');
      const [nextUsdtPrice, nextTrxPrice] = await Promise.all([getUSDTPrice(), getTRXPrice()]);
      setUsdtPrice(nextUsdtPrice);
      setTrxPrice(nextTrxPrice);
    } catch (error) {
      console.error('❌ Failed to load wallet prices:', error);
    }
  }, []);

  useEffect(() => {
    if (address) {
      return;
    }

    console.log('🔐 Wallet tab initializing wallet');
    void initializeWallet().catch((error: unknown) => {
      console.error('❌ Wallet tab failed to initialize wallet:', error);
    });
  }, [address, initializeWallet]);

  useEffect(() => {
    void loadPrices();
  }, [loadPrices, usdtBalance, trxBalance]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);

    try {
      console.log('🔄 Refreshing wallet tab');
      await Promise.all([refreshBalance(), refreshTransactions(), loadPrices()]);
    } finally {
      setRefreshing(false);
    }
  }, [loadPrices, refreshBalance, refreshTransactions]);

  const handleCopyAddress = useCallback(async () => {
    if (!address) {
      return;
    }

    try {
      await Haptics.selectionAsync();
      await Clipboard.setStringAsync(address);
      Alert.alert('Address Copied', 'Your wallet address is ready to paste.');
    } catch (error) {
      console.error('❌ Failed to copy wallet address:', error);
      Alert.alert('Copy Failed', 'Please try copying your wallet address again.');
    }
  }, [address]);

  const formattedAddress = useMemo(() => {
    if (!address) {
      return '';
    }

    return `${address.slice(0, 12)}...${address.slice(-10)}`;
  }, [address]);

  if (isLoading && !address) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.light.primary} testID="wallet-tab-loading-indicator" />
        </View>
      </SafeAreaView>
    );
  }

  if (!address) {
    return <WalletSetup />;
  }

  const usdtUsd = (parseFloat(usdtBalance) * usdtPrice).toFixed(2);
  const trxUsd = (parseFloat(trxBalance) * trxPrice).toFixed(2);

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <ScrollView
        contentContainerStyle={styles.contentContainer}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.light.primary} />}
        showsVerticalScrollIndicator={false}
        style={styles.container}
        testID="wallet-screen"
      >
      <WalletCard />

      <View style={styles.identityCard}>
        <View style={styles.identityHeader}>
          <View>
            <Text style={styles.identityEyebrow}>Wallet</Text>
            <Text style={styles.identityTitle}>TRON address vault</Text>
          </View>
          <TouchableOpacity onPress={handleCopyAddress} style={styles.copyButton} testID="copy-wallet-address-button">
            <Copy color={Colors.light.primary} size={18} strokeWidth={2} />
          </TouchableOpacity>
        </View>

        <Text style={styles.addressPreview}>{formattedAddress}</Text>
        <Text style={styles.addressFull}>{address}</Text>

        <View style={styles.identityFooter}>
          <View style={styles.readyBadge}>
            <ShieldCheck color="#2E6BFF" size={14} strokeWidth={2.1} />
            <Text style={styles.readyText}>Ready for USDT and TRX</Text>
          </View>

          <TouchableOpacity
            onPress={() => router.push('/receive' as any)}
            style={styles.qrButton}
            testID="open-receive-screen-button"
          >
            <QrCode color="#FFFFFF" size={18} strokeWidth={2} />
            <Text style={styles.qrButtonText}>QR</Text>
          </TouchableOpacity>
        </View>
      </View>

        <View style={styles.assetsSection}>
          <Text style={styles.sectionTitle}>Holdings</Text>
          <AssetCard balance={usdtBalance} currency="USDT" label="TRC-20" usdValue={usdtUsd} />
          <AssetCard balance={trxBalance} currency="TRX" label="TRON" usdValue={trxUsd} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F4F6FA',
  },
  container: {
    flex: 1,
    backgroundColor: '#F4F6FA',
  },
  contentContainer: {
    paddingBottom: 24,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  identityCard: {
    marginTop: 16,
    marginHorizontal: 16,
    borderRadius: 24,
    padding: 18,
    backgroundColor: 'rgba(255,255,255,0.88)',
    borderWidth: 1,
    borderColor: 'rgba(221,228,242,0.9)',
    shadowColor: '#0C1626',
    shadowOffset: {
      width: 0,
      height: 10,
    },
    shadowOpacity: 0.06,
    shadowRadius: 20,
    elevation: 3,
  },
  identityHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  identityEyebrow: {
    ...Typography.smallSemibold,
    color: Colors.light.secondary,
    textTransform: 'uppercase' as const,
    letterSpacing: 0.8,
  },
  identityTitle: {
    ...Typography.titleSemibold,
    color: Colors.light.text,
    marginTop: 2,
  },
  copyButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F1F5FB',
  },
  addressPreview: {
    ...Typography.bodySemibold,
    color: Colors.light.text,
    marginBottom: 6,
  },
  addressFull: {
    ...Typography.monoSmall,
    color: Colors.light.muted,
    lineHeight: 20,
  },
  identityFooter: {
    marginTop: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  readyBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EEF4FF',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  readyText: {
    ...Typography.smallMedium,
    color: '#204A9F',
    marginLeft: 6,
  },
  qrButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#121A2A',
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  qrButtonText: {
    ...Typography.smallSemibold,
    color: '#FFFFFF',
    marginLeft: 6,
  },
  assetsSection: {
    marginTop: 18,
  },
  sectionTitle: {
    ...Typography.subtitleSemibold,
    color: Colors.light.text,
    marginHorizontal: 20,
    marginBottom: 10,
  },
});
