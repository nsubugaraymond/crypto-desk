import React from 'react';
import { StyleSheet, View, Image } from 'react-native';

interface CryptoIconProps {
  currency: 'TRX' | 'USDT' | string;
  size?: number;
}

const CRYPTO_ICONS: Record<string, string> = {
  TRX: 'https://cryptologos.cc/logos/tron-trx-logo.png',
  USDT: 'https://cryptologos.cc/logos/tether-usdt-logo.png',
};

export default function CryptoIcon({ currency, size = 32 }: CryptoIconProps) {
  const iconUrl = CRYPTO_ICONS[currency.toUpperCase()];

  if (!iconUrl) {
    return (
      <View style={[styles.placeholder, { width: size, height: size, borderRadius: size / 2 }]}>
      </View>
    );
  }

  return (
    <Image
      source={{ uri: iconUrl }}
      style={[styles.icon, { width: size, height: size, borderRadius: size / 2 }]}
      resizeMode="contain"
    />
  );
}

const styles = StyleSheet.create({
  icon: {
    backgroundColor: 'transparent',
  },
  placeholder: {
    backgroundColor: '#E0E0E0',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
