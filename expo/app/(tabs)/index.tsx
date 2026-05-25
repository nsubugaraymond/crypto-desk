import { useEffect, useState, useCallback } from 'react';
import { StyleSheet, View, ScrollView, RefreshControl, Text, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import AssetCard from '@/components/AssetCard';
import WalletCard from '@/components/WalletCard';
import WalletSetup from '@/components/WalletSetup';
import Colors from '@/constants/colors';
import Typography from '@/constants/typography';
import { useTransactionPolling } from '@/hooks/useTransactionPolling';
import { useWalletStore } from '@/hooks/useWalletStore';
import { getUSDTPrice, getTRXPrice } from '@/services/tronService';

export default function WalletHomeScreen() {
  const { address, usdtBalance, trxBalance, initializeWallet, refreshBalance, refreshTransactions, isLoading } = useWalletStore();
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [usdtPrice, setUsdtPrice] = useState<number>(1);
  const [trxPrice, setTrxPrice] = useState<number>(0);

  useTransactionPolling();

  useEffect(() => {
    console.log('📱 Wallet home screen mounted');
    const init = async () => {
      try {
        console.log('🔄 Initializing wallet from home screen');
        await initializeWallet();
        console.log('✅ Wallet initialized from home screen');
      } catch (error) {
        console.error('❌ Failed to initialize wallet from home screen:', error);
      }
    };

    void init();
  }, [initializeWallet]);

  useEffect(() => {
    const fetchPrices = async () => {
      try {
        console.log('💱 Fetching home screen prices');
        const [nextUsdtPrice, nextTrxPrice] = await Promise.all([getUSDTPrice(), getTRXPrice()]);
        setUsdtPrice(nextUsdtPrice);
        setTrxPrice(nextTrxPrice);
      } catch (error) {
        console.error('❌ Price fetch error on home screen:', error);
      }
    };

    void fetchPrices();
  }, [usdtBalance, trxBalance]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);

    try {
      console.log('🔄 Refreshing wallet home screen');
      await Promise.all([refreshBalance(), refreshTransactions()]);
      const [nextUsdtPrice, nextTrxPrice] = await Promise.all([getUSDTPrice(), getTRXPrice()]);
      setUsdtPrice(nextUsdtPrice);
      setTrxPrice(nextTrxPrice);
    } finally {
      setRefreshing(false);
    }
  }, [refreshBalance, refreshTransactions]);

  if (isLoading && !address) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.light.primary} testID="wallet-home-loading-indicator" />
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
        testID="wallet-home-screen"
      >
      <WalletCard />

        <View style={styles.assetsSection}>
          <Text style={styles.sectionTitle}>Assets</Text>
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
