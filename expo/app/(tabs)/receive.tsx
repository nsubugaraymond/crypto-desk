import { useRouter } from 'expo-router';
import { Copy } from 'lucide-react-native';
import React, { useEffect } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  TouchableOpacity, 
  Alert,
  Share,
  Platform,
  ActivityIndicator,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import * as Clipboard from 'expo-clipboard';
import { Image } from 'expo-image';
import { SafeAreaView } from 'react-native-safe-area-context';

import Colors from '@/constants/colors';
import Typography from '@/constants/typography';
import { useWalletStore } from '@/hooks/useWalletStore';

export default function ReceiveScreen() {
  const router = useRouter();
  const { address, isLoading } = useWalletStore();

  useEffect(() => {
    if (!isLoading && !address) {
      router.replace('/');
    }
  }, [address, isLoading, router]);

  if (isLoading && !address) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.light.primary} testID="receive-screen-loading-indicator" />
        </View>
      </SafeAreaView>
    );
  }

  if (!address) {
    return null;
  }

  const copyToClipboard = async () => {
    try {
      if (Platform.OS !== 'web') {
        await Haptics.selectionAsync();
      }
      
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
          Alert.alert('Address Copied', 'Wallet address copied to clipboard');
        } else {
          Alert.alert('Copy Failed', 'Please manually copy the address');
        }
      } else {
        await Clipboard.setStringAsync(address);
        Alert.alert('Address Copied', 'Wallet address copied to clipboard');
      }
    } catch (error) {
      console.error('Failed to copy address:', error);
      Alert.alert('Error', 'Failed to copy address to clipboard');
    }
  };

  const shareAddress = async () => {
    try {
      if (Platform.OS === 'web') {
        // Check if Web Share API is available and supported
        if (navigator.share && navigator.canShare && navigator.canShare({ text: address })) {
          await navigator.share({
            title: 'My Tron Wallet Address',
            text: `My Tron wallet address: ${address}`,
          });
        } else {
          // Fallback to copying on web
          await copyToClipboard();
        }
      } else {
        // Use React Native Share API for mobile
        await Share.share({
          message: `My Tron wallet address: ${address}`,
        });
      }
    } catch (error: unknown) {
      console.error('Error sharing address:', error);
      // Fallback to copy if share fails
      const err = error as Error;
      if (err.name === 'NotAllowedError' || err.name === 'AbortError') {
        // User cancelled or permission denied, try copying instead
        await copyToClipboard();
      } else {
        Alert.alert('Error', 'Failed to share address. Address copied to clipboard instead.');
        await copyToClipboard();
      }
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.container}>
        <View style={styles.card}>
        <Text style={styles.title}>Receive Crypto</Text>
        <Text style={styles.subtitle}>Share your address to receive USDT or TRX</Text>
        
        <View style={styles.qrContainer}>
          <View style={styles.qrBox}>
            <Image
              source={{ uri: `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${address}` }}
              style={styles.qrImage}
              contentFit="contain"
              cachePolicy="memory-disk"
            />
          </View>
        </View>
        
        <View style={styles.addressContainer}>
          <Text style={styles.addressLabel}>Your Wallet Address</Text>
          <View style={styles.addressBox}>
            <Text style={styles.address}>{address}</Text>
            <TouchableOpacity onPress={copyToClipboard}>
              <Copy size={20} color={Colors.light.primary} />
            </TouchableOpacity>
          </View>
        </View>
        
        <View style={styles.actions}>
          <TouchableOpacity 
            style={styles.shareButton}
            onPress={shareAddress}
          >
            <Text style={styles.shareButtonText}>
              {Platform.OS === 'web' ? 'Share or Copy Address' : 'Share Address'}
            </Text>
          </TouchableOpacity>
        </View>
        
          <View style={styles.infoContainer}>
            <Text style={styles.infoText}>
              This address can receive both USDT (TRC-20) and TRX. Make sure the sender uses the correct network (Tron).
            </Text>
          </View>
        </View>
      </View>
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
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  title: {
    ...Typography.headingBold,
    marginBottom: 6,
    color: Colors.light.text,
  },
  subtitle: {
    ...Typography.bodyRegular,
    color: Colors.light.muted,
    marginBottom: 16,
  },
  qrContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  qrBox: {
    width: 180,
    height: 180,
    backgroundColor: '#fff',
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  qrImage: {
    width: 160,
    height: 160,
  },
  addressContainer: {
    marginBottom: 16,
  },
  addressLabel: {
    ...Typography.bodyMedium,
    marginBottom: 8,
    color: Colors.light.text,
  },
  addressBox: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#F0F4F9',
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  address: {
    ...Typography.mono,
    color: Colors.light.text,
    flex: 1,
    marginRight: 8,
  },
  actions: {
    marginBottom: 16,
  },
  shareButton: {
    backgroundColor: Colors.light.primary,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  shareButtonText: {
    ...Typography.buttonText,
    color: 'white',
  },
  infoContainer: {
    backgroundColor: '#F0F4F9',
    borderRadius: 8,
    padding: 12,
    borderLeftWidth: 4,
    borderLeftColor: Colors.light.warning,
  },
  infoText: {
    ...Typography.smallRegular,
    color: Colors.light.muted,
    lineHeight: 18,
  },
});