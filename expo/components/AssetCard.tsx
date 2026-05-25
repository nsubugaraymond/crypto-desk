import React from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Platform } from 'react-native';


import Colors from '@/constants/colors';
import Typography from '@/constants/typography';
import CryptoIcon from '@/components/CryptoIcon';

interface AssetCardProps {
  currency: 'USDT' | 'TRX';
  balance: string;
  label: string;
  usdValue?: string;
  onPress?: () => void;
}

export default function AssetCard({ currency, balance, label, usdValue, onPress }: AssetCardProps) {
  const accentColor = currency === 'USDT' ? '#26A17B' : '#FF0013';

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={onPress}
      activeOpacity={0.7}
      disabled={!onPress}
    >
      <View style={[styles.accentStripe, { backgroundColor: accentColor }]} />
      <View style={styles.cardContent}>
        <View style={styles.left}>
          <View style={[styles.iconWrap, { backgroundColor: `${accentColor}12` }]}>
            <CryptoIcon currency={currency} size={32} />
          </View>
          <View style={styles.info}>
            <Text style={styles.currencyName}>{currency === 'USDT' ? 'Tether' : 'TRON'}</Text>
            <Text style={styles.currencyLabel}>{label}</Text>
          </View>
        </View>
        <View style={styles.right}>
          <Text style={styles.balance}>{parseFloat(balance).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 6 })}</Text>
          {usdValue ? (
            <Text style={styles.usdValue}>${usdValue}</Text>
          ) : null}
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.light.card,
    borderRadius: Platform.OS === 'android' ? 12 : 14,
    marginHorizontal: 16,
    marginBottom: Platform.OS === 'android' ? 8 : 10,
    overflow: 'hidden',
    flexDirection: 'row',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 1,
  },
  accentStripe: {
    width: 4,
  },
  cardContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Platform.OS === 'android' ? 12 : 16,
    paddingHorizontal: Platform.OS === 'android' ? 12 : 14,
  },
  left: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconWrap: {
    width: Platform.OS === 'android' ? 40 : 48,
    height: Platform.OS === 'android' ? 40 : 48,
    borderRadius: Platform.OS === 'android' ? 12 : 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  info: {
    gap: 2,
  },
  currencyName: {
    ...Typography.bodySemibold,
    color: Colors.light.text,
  },
  currencyLabel: {
    ...Typography.smallRegular,
    color: Colors.light.muted,
  },
  right: {
    alignItems: 'flex-end',
    gap: 2,
  },
  balance: {
    ...Typography.bodySemibold,
    color: Colors.light.text,
  },
  usdValue: {
    ...Typography.smallRegular,
    color: Colors.light.muted,
  },
});
