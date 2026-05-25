import { useRouter } from 'expo-router';
import React, { useState, useEffect, useCallback } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  TextInput, 
  TouchableOpacity, 
  Alert, 
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Modal
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { QrCode, X } from 'lucide-react-native';

import Colors from '@/constants/colors';
import Typography from '@/constants/typography';
import CryptoIcon from '@/components/CryptoIcon';
import { useWalletStore } from '@/hooks/useWalletStore';
import { isValidTronAddress, estimateUSDTTransactionFee, getUSDTPrice, getTRXPrice } from '@/services/tronService';
import { useSecurity } from '@/contexts/SecurityContext';
import { useUserTracking } from '@/contexts/UserTrackingContext';
import PinVerification from '@/components/PinVerification';

export default function SendScreen() {
  const router = useRouter();
  const { address, usdtBalance, trxBalance, sendUSDTTransaction, sendTRXTransaction, isLoading } = useWalletStore();
  const { verifyPin, isBiometricEnabled, authenticate, requireAuthForTransactions } = useSecurity();
  const { trackTransaction } = useUserTracking();
  
  const [recipient, setRecipient] = useState('');
  const [amount, setAmount] = useState('');
  const [currency, setCurrency] = useState<'USDT' | 'TRX'>('USDT');
  const [errors, setErrors] = useState({ recipient: '', amount: '' });
  const [showScanner, setShowScanner] = useState(false);
  const [permission, requestPermission] = useCameraPermissions();
  const [hasScanned, setHasScanned] = useState(false);
  const [estimatedFee, setEstimatedFee] = useState<{ feeInTRX: string; feeInUSD: string; hasEnergy: boolean } | null>(null);
  const [isEstimatingFee, setIsEstimatingFee] = useState(false);
  const [usdtPrice, setUsdtPrice] = useState<number>(1.0);
  const [trxPrice, setTrxPrice] = useState<number>(0.1);
  const [isLoadingPrice, setIsLoadingPrice] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);

  const handleBarCodeScanned = useCallback(({ data }: { data: string }) => {
    if (hasScanned) {
      return;
    }
    
    try {
      console.log('QR code scanned successfully');
      setHasScanned(true);
      
      let address = data;
      if (data.includes(':')) {
        address = data.split(':')[1] || data;
      }
      
      setRecipient(address);
      setShowScanner(false);
      
      setTimeout(() => {
        Alert.alert('Success', 'Address scanned successfully');
      }, 500);
    } catch (error) {
      console.error('Error processing scanned address:', error);
      setHasScanned(true);
      setShowScanner(false);
      
      setTimeout(() => {
        Alert.alert('Error', 'Failed to process scanned address');
      }, 500);
    }
  }, [hasScanned]);

  useEffect(() => {
    if (!isLoading && !address) {
      router.replace('/');
    }
  }, [address, isLoading, router]);

  useEffect(() => {
    const fetchPrices = async () => {
      setIsLoadingPrice(true);
      try {
        const [usdtPriceData, trxPriceData] = await Promise.all([
          getUSDTPrice(),
          getTRXPrice()
        ]);
        setUsdtPrice(usdtPriceData);
        setTrxPrice(trxPriceData);
      } catch (error) {
        console.error('Error fetching prices:', error);
      } finally {
        setIsLoadingPrice(false);
      }
    };
    void fetchPrices();
  }, []);

  useEffect(() => {
    const estimateFee = async () => {
      if (currency === 'USDT' && recipient.trim() && address && isValidTronAddress(recipient.trim())) {
        setIsEstimatingFee(true);
        try {
          const fee = await estimateUSDTTransactionFee(address, recipient.trim(), amount || undefined);
          setEstimatedFee(fee);
        } catch (error) {
          console.error('Error estimating fee:', error);
          setEstimatedFee(null);
        } finally {
          setIsEstimatingFee(false);
        }
      } else {
        setEstimatedFee(null);
      }
    };
    
    const debounce = setTimeout(() => {
      void estimateFee();
    }, 500);
    
    return () => clearTimeout(debounce);
  }, [recipient, currency, address, amount]);

  if (isLoading && !address) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.light.primary} testID="send-screen-loading-indicator" />
        </View>
      </SafeAreaView>
    );
  }

  if (!address) {
    return null;
  }

  const getCurrentBalance = () => {
    return currency === 'USDT' ? usdtBalance : trxBalance;
  };

  const validateForm = () => {
    let valid = true;
    const newErrors = { recipient: '', amount: '' };
    
    // Validate recipient address
    if (!recipient.trim()) {
      newErrors.recipient = 'Recipient address is required';
      valid = false;
    } else if (!isValidTronAddress(recipient.trim())) {
      newErrors.recipient = 'Invalid Tron address';
      valid = false;
    }
    
    // Validate amount
    if (!amount.trim()) {
      newErrors.amount = 'Amount is required';
      valid = false;
    } else {
      const amountValue = parseFloat(amount);
      const balance = parseFloat(getCurrentBalance());
      
      if (isNaN(amountValue) || amountValue <= 0) {
        newErrors.amount = 'Amount must be greater than 0';
        valid = false;
      } else if (amountValue > balance) {
        newErrors.amount = 'Insufficient balance';
        valid = false;
      } else if (currency === 'USDT') {
        if (estimatedFee) {
          const requiredTRX = parseFloat(estimatedFee.feeInTRX);
          const trxBal = parseFloat(trxBalance);
          if (trxBal < requiredTRX) {
            newErrors.amount = `Insufficient TRX for network fees. Need at least ${requiredTRX} TRX to send USDT`;
            valid = false;
          }
        }
      }
    }
    
    setErrors(newErrors);
    return valid;
  };

  const handleSend = async () => {
    if (!validateForm()) return;
    
    if (requireAuthForTransactions) {
      setShowAuthModal(true);
    } else {
      await executeSend();
    }
  };

  const executeSend = async () => {
    try {
      const amountValue = parseFloat(amount.trim());
      
      const result = currency === 'USDT' 
        ? await sendUSDTTransaction(recipient.trim(), amountValue.toString())
        : await sendTRXTransaction(recipient.trim(), amountValue.toString());
      
      if (result.success) {
        trackTransaction(currency, amount.trim());
        
        const isPending = (result as any).pending;
        const tronscanUrl = (result as any).tronscanUrl;
        
        if (isPending) {
          Alert.alert(
            'Transaction Pending',
            `Your ${currency} transaction has been broadcasted but confirmation is taking longer than expected.\n\nTransaction ID: ${result.txID}\n\nPlease check Tronscan to verify the status:\n${tronscanUrl}`,
            [{ text: 'OK', onPress: () => router.replace('/') }]
          );
        } else {
          const feeInfo = (result as any).fee && currency === 'USDT' 
            ? `\nNetwork Fee: ${(result as any).fee} TRX` 
            : '';
          
          Alert.alert(
            'Transaction Confirmed',
            `Your ${currency} transaction has been confirmed on-chain!\n\nTransaction ID: ${result.txID}${feeInfo}`,
            [{ text: 'OK', onPress: () => router.replace('/') }]
          );
        }
      }
    } catch (error) {
      Alert.alert('Error', (error as Error).message);
    }
  };

  const handleMaxAmount = () => {
    setAmount(getCurrentBalance());
  };

  const handleScanPress = async () => {
    if (Platform.OS === 'web') {
      Alert.alert(
        'Camera Not Available',
        'QR code scanning is only available on mobile devices. Please enter the wallet address manually in the field above.',
        [{ text: 'OK' }]
      );
      return;
    }

    if (!permission) {
      const { granted } = await requestPermission();
      if (granted) {
        setShowScanner(true);
        setHasScanned(false);
      }
    } else if (permission.granted) {
      setShowScanner(true);
      setHasScanned(false);
    } else {
      await requestPermission();
    }
  };

  const usdtBalanceInUSD = currency === 'USDT' ? (parseFloat(usdtBalance) * usdtPrice).toFixed(2) : '0.00';
  const trxBalanceInUSD = currency === 'TRX' ? (parseFloat(trxBalance) * trxPrice).toFixed(2) : '0.00';
  const hasValidRecipient = isValidTronAddress(recipient.trim());
  const isFeeReadyForSend = currency === 'TRX' || !hasValidRecipient || (!isEstimatingFee && estimatedFee !== null);
  const isSendDisabled = isLoading || !recipient.trim() || !amount.trim() || !hasValidRecipient || !isFeeReadyForSend;

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={24}
      >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.card}>
          <Text style={styles.title}>Send Crypto</Text>
          <Text style={styles.subtitle}>Send USDT or TRX to another address</Text>
          
          {/* Currency Selection */}
          <View style={styles.currencySelector}>
            <TouchableOpacity
              style={[
                styles.currencyButton,
                currency === 'USDT' ? styles.currencyButtonActive : null
              ]}
              onPress={() => setCurrency('USDT')}
            >
              <CryptoIcon currency="USDT" size={20} />
              <Text style={[
                styles.currencyButtonText,
                currency === 'USDT' ? styles.currencyButtonTextActive : null
              ]}>USDT</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.currencyButton,
                currency === 'TRX' ? styles.currencyButtonActive : null
              ]}
              onPress={() => setCurrency('TRX')}
            >
              <CryptoIcon currency="TRX" size={20} />
              <Text style={[
                styles.currencyButtonText,
                currency === 'TRX' ? styles.currencyButtonTextActive : null
              ]}>TRX</Text>
            </TouchableOpacity>
          </View>
          
          <View style={styles.balanceContainer}>
            <Text style={styles.balanceLabel}>Available Balance:</Text>
            <View style={styles.balanceValueContainer}>
              <Text style={styles.balanceValue}>
                {getCurrentBalance()} {currency}
              </Text>
              {currency === 'USDT' && (
                <Text style={styles.balanceValueUSD}>
                  ≈ ${isLoadingPrice ? '...' : usdtBalanceInUSD} USD
                </Text>
              )}
              {currency === 'TRX' && (
                <Text style={styles.balanceValueUSD}>
                  ≈ ${isLoadingPrice ? '...' : trxBalanceInUSD} USD
                </Text>
              )}
            </View>
          </View>
          
          {currency === 'USDT' && !!recipient.trim() && isValidTronAddress(recipient.trim()) && (
            <View style={[styles.feeContainer, estimatedFee && !estimatedFee.hasEnergy && styles.feeContainerWarning]}>
              {isEstimatingFee ? (
                <>
                  <Text style={styles.feeLabel}>Estimating fee...</Text>
                  <ActivityIndicator size="small" color="#856404" />
                </>
              ) : estimatedFee ? (
                <>
                  <View>
                    <Text style={styles.feeLabel}>Network Fee:</Text>
                    {!estimatedFee.hasEnergy && (
                      <Text style={styles.feeWarning}>⚠️ No staked energy</Text>
                    )}
                  </View>
                  <View style={styles.feeValueContainer}>
                    <Text style={styles.feeValue}>{estimatedFee.feeInTRX} TRX</Text>
                    <Text style={styles.feeValueUSD}>≈ ${estimatedFee.feeInUSD}</Text>
                  </View>
                </>
              ) : null}
            </View>
          )}
          
          <View style={styles.formGroup}>
            <View style={styles.labelRow}>
              <Text style={styles.label}>Recipient Address</Text>
              <TouchableOpacity 
                style={styles.scanButton}
                onPress={handleScanPress}
              >
                <QrCode size={16} color={Colors.light.primary} />
                <Text style={styles.scanButtonText}>Scan</Text>
              </TouchableOpacity>
            </View>
            <TextInput
              style={[styles.input, errors.recipient ? styles.inputError : null]}
              placeholder="Enter Tron address (starts with T)"
              value={recipient}
              onChangeText={setRecipient}
              autoCapitalize="none"
              autoCorrect={false}
            />
            {errors.recipient ? (
              <Text style={styles.errorText}>{errors.recipient}</Text>
            ) : null}
          </View>
          
          <View style={styles.formGroup}>
            <View style={styles.amountHeader}>
              <Text style={styles.label}>Amount ({currency})</Text>
              <TouchableOpacity onPress={handleMaxAmount}>
                <Text style={styles.maxButton}>MAX</Text>
              </TouchableOpacity>
            </View>
            <TextInput
              style={[styles.input, errors.amount ? styles.inputError : null]}
              placeholder="0.00"
              value={amount}
              onChangeText={setAmount}
              keyboardType="decimal-pad"
            />
            {errors.amount ? (
              <Text style={styles.errorText}>{errors.amount}</Text>
            ) : null}
          </View>
          
          <TouchableOpacity
            style={[
              styles.sendButton,
              isSendDisabled ? styles.disabledButton : null
            ]}
            onPress={handleSend}
            disabled={isSendDisabled}
            testID="send-crypto-button"
          >
            {isLoading ? (
              <ActivityIndicator size="small" color="white" />
            ) : (
              <Text style={styles.sendButtonText}>Send {currency}</Text>
            )}
          </TouchableOpacity>
          {currency === 'USDT' && hasValidRecipient && !isFeeReadyForSend ? (
            <Text style={styles.sendHint}>Fee must finish loading before you can send.</Text>
          ) : null}
        </View>
      </ScrollView>

      <Modal
        visible={showScanner}
        animationType="slide"
        onRequestClose={() => setShowScanner(false)}
      >
        <View style={styles.scannerContainer}>
          <View style={styles.scannerHeader}>
            <Text style={styles.scannerTitle}>Scan QR Code</Text>
            <TouchableOpacity 
              onPress={() => setShowScanner(false)}
              style={styles.closeButton}
            >
              <X size={24} color="#fff" />
            </TouchableOpacity>
          </View>
          {Platform.OS !== 'web' ? (
            <CameraView
              style={styles.camera}
              facing="back"
              onBarcodeScanned={handleBarCodeScanned}
            >
              <View style={styles.scannerOverlay}>
                <View style={styles.scannerFrame} />
              </View>
            </CameraView>
          ) : (
            <View style={styles.webFallback}>
              <Text style={styles.webFallbackText}>
                Camera scanning is not available on web.
                Please enter the address manually.
              </Text>
              <TouchableOpacity
                style={styles.closeWebButton}
                onPress={() => setShowScanner(false)}
              >
                <Text style={styles.closeWebButtonText}>Close</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </Modal>

      <Modal
        visible={showAuthModal}
        animationType="slide"
        onRequestClose={() => setShowAuthModal(false)}
      >
        <View style={styles.authModalContainer}>
          <PinVerification
            title="Confirm Transaction"
            subtitle="Enter your PIN to authorize this transaction"
            onVerifyPin={async (pin) => {
              const result = await verifyPin(pin);
              return result;
            }}
            onBiometric={isBiometricEnabled ? async () => {
              const result = await authenticate();
              return result;
            } : undefined}
            showBiometric={isBiometricEnabled}
            onSuccess={async () => {
              setShowAuthModal(false);
              await executeSend();
            }}
          />
          <TouchableOpacity
            style={styles.cancelAuthButton}
            onPress={() => setShowAuthModal(false)}
          >
            <Text style={styles.cancelAuthText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </Modal>
      </KeyboardAvoidingView>
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    padding: 14,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  title: {
    ...Typography.headingBold,
    marginBottom: 4,
    color: Colors.light.text,
  },
  subtitle: {
    ...Typography.bodyRegular,
    color: Colors.light.muted,
    marginBottom: 14,
  },
  currencySelector: {
    flexDirection: 'row',
    marginBottom: 14,
    backgroundColor: '#E8EDF5',
    borderRadius: 8,
    padding: 3,
  },
  currencyButton: {
    flex: 1,
    flexDirection: 'row',
    paddingVertical: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 6,
    gap: 6,
  },
  currencyButtonActive: {
    backgroundColor: Colors.light.primary,
  },
  currencyButtonText: {
    ...Typography.bodySemibold,
    color: Colors.light.muted,
  },
  currencyButtonTextActive: {
    color: 'white',
  },
  balanceContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#F0F4F9',
    padding: 10,
    borderRadius: 8,
    marginBottom: 10,
  },
  balanceLabel: {
    ...Typography.bodyRegular,
    color: Colors.light.muted,
  },
  balanceValue: {
    ...Typography.subtitleSemibold,
    color: Colors.light.text,
  },
  balanceValueContainer: {
    alignItems: 'flex-end',
  },
  balanceValueUSD: {
    ...Typography.smallRegular,
    color: Colors.light.muted,
    marginTop: 2,
  },
  feeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFF3CD',
    padding: 10,
    borderRadius: 8,
    marginBottom: 14,
  },
  feeLabel: {
    ...Typography.bodyRegular,
    color: '#856404',
  },
  feeValue: {
    ...Typography.subtitleSemibold,
    color: '#856404',
  },
  feeContainerWarning: {
    backgroundColor: '#FFE5E5',
  },
  feeWarning: {
    ...Typography.xsRegular,
    color: '#D32F2F',
    marginTop: 2,
  },
  feeValueContainer: {
    alignItems: 'flex-end',
  },
  feeValueUSD: {
    ...Typography.smallRegular,
    color: '#856404',
    marginTop: 2,
  },
  formGroup: {
    marginBottom: 14,
  },
  label: {
    ...Typography.bodyMedium,
    marginBottom: 8,
    color: Colors.light.text,
  },
  input: {
    backgroundColor: '#F5F7FA',
    borderWidth: 1,
    borderColor: Colors.light.border,
    borderRadius: 8,
    padding: 10,
    ...Typography.subtitleMedium,
  },
  inputError: {
    borderColor: Colors.light.error,
  },
  errorText: {
    ...Typography.smallRegular,
    color: Colors.light.error,
    marginTop: 4,
  },
  amountHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  maxButton: {
    ...Typography.smallSemibold,
    color: Colors.light.primary,
  },
  sendButton: {
    backgroundColor: Colors.light.primary,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  disabledButton: {
    backgroundColor: Colors.light.muted,
    opacity: 0.7,
  },
  sendButtonText: {
    ...Typography.buttonText,
    color: 'white',
  },
  sendHint: {
    ...Typography.smallRegular,
    color: Colors.light.muted,
    textAlign: 'center',
    marginTop: 10,
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  scanButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  scanButtonText: {
    ...Typography.bodySemibold,
    color: Colors.light.primary,
  },
  scannerContainer: {
    flex: 1,
    backgroundColor: '#000',
  },
  scannerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 20,
    backgroundColor: 'rgba(0,0,0,0.8)',
  },
  scannerTitle: {
    ...Typography.titleBold,
    color: '#fff',
  },
  closeButton: {
    padding: 8,
  },
  camera: {
    flex: 1,
  },
  scannerOverlay: {
    flex: 1,
    backgroundColor: 'transparent',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scannerFrame: {
    width: 250,
    height: 250,
    borderWidth: 2,
    borderColor: '#fff',
    borderRadius: 12,
    backgroundColor: 'transparent',
  },
  webFallback: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  webFallbackText: {
    ...Typography.subtitleMedium,
    color: '#fff',
    textAlign: 'center',
    marginBottom: 20,
  },
  closeWebButton: {
    backgroundColor: Colors.light.primary,
    paddingVertical: 12,
    paddingHorizontal: 32,
    borderRadius: 8,
  },
  closeWebButtonText: {
    ...Typography.buttonText,
    color: '#fff',
  },
  authModalContainer: {
    flex: 1,
    backgroundColor: '#fff',
  },
  cancelAuthButton: {
    position: 'absolute',
    bottom: 40,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  cancelAuthText: {
    ...Typography.buttonText,
    color: Colors.light.primary,
  },
});