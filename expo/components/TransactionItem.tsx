import { ArrowDownLeft, ArrowUpRight, ExternalLink } from 'lucide-react-native';
import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Linking } from 'react-native';

import Colors from '@/constants/colors';
import Typography from '@/constants/typography';
import CryptoIcon from '@/components/CryptoIcon';
import { Transaction } from '@/types/wallet';
import { getNetwork } from '@/services/tronService';

interface TransactionItemProps {
  transaction: Transaction;
}

export default function TransactionItem({ transaction }: TransactionItemProps) {
  const { type, amount, timestamp, to, from, status, currency, txID } = transaction;
  const [network, setNetwork] = useState<'mainnet' | 'nile'>('nile');
  
  useEffect(() => {
    loadNetwork();
  }, []);

  const loadNetwork = async () => {
    const currentNetwork = await getNetwork();
    setNetwork(currentNetwork);
  };
  
  const isIncoming = type === 'incoming';
  const formattedDate = new Date(timestamp).toLocaleDateString();
  const formattedTime = new Date(timestamp).toLocaleTimeString([], { 
    hour: '2-digit', 
    minute: '2-digit' 
  });
  
  const formatAddress = (address: string) => {
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
  };

  const getCurrencySymbol = () => {
    return currency === 'USDT' ? '$' : '';
  };

  const openExplorer = async () => {
    const explorerUrl = network === 'mainnet'
      ? `https://tronscan.org/#/transaction/${txID}`
      : `https://nile.tronscan.org/#/transaction/${txID}`;
    
    try {
      await Linking.openURL(explorerUrl);
    } catch (error) {
      console.error('Failed to open explorer:', error);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.iconContainer}>
        <CryptoIcon currency={currency} size={26} />
        <View style={[styles.directionBadge, isIncoming ? styles.incomingBadge : styles.outgoingBadge]}>
          {isIncoming ? (
            <ArrowDownLeft size={10} color="#fff" />
          ) : (
            <ArrowUpRight size={10} color="#fff" />
          )}
        </View>
      </View>
      
      <View style={styles.details}>
        <Text style={styles.type}>
          {isIncoming ? `Received ${currency}` : `Sent ${currency}`}
        </Text>
        <Text style={styles.address}>
          {isIncoming 
            ? `From: ${formatAddress(from)}` 
            : `To: ${formatAddress(to)}`
          }
        </Text>
        <Text style={styles.date}>
          {formattedDate} at {formattedTime}
        </Text>
      </View>
      
      <View style={styles.amountContainer}>
        <Text style={[
          styles.amount, 
          isIncoming ? styles.incoming : styles.outgoing
        ]}>
          {isIncoming ? '+' : '-'}{getCurrencySymbol()}{amount} {currency}
        </Text>
        <Text style={[
          styles.status,
          status === 'confirmed' ? styles.confirmed : styles.pending
        ]}>
          {status}
        </Text>
        <TouchableOpacity style={styles.explorerButton} onPress={openExplorer}>
          <ExternalLink size={12} color={Colors.light.primary} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 10,
    marginBottom: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  iconContainer: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
    position: 'relative',
  },
  directionBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 16,
    height: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  incomingBadge: {
    backgroundColor: Colors.light.success,
  },
  outgoingBadge: {
    backgroundColor: Colors.light.error,
  },
  details: {
    flex: 1,
  },
  type: {
    ...Typography.smallSemibold,
    marginBottom: 2,
    color: Colors.light.text,
  },
  address: {
    ...Typography.xsRegular,
    color: Colors.light.muted,
    marginBottom: 1,
  },
  date: {
    ...Typography.xsRegular,
    color: Colors.light.muted,
  },
  amountContainer: {
    alignItems: 'flex-end',
  },
  amount: {
    ...Typography.smallSemibold,
    marginBottom: 2,
  },
  incoming: {
    color: Colors.light.success,
  },
  outgoing: {
    color: Colors.light.error,
  },
  status: {
    ...Typography.xsRegular,
    textTransform: 'capitalize' as const,
    marginBottom: 2,
  },
  confirmed: {
    color: Colors.light.success,
  },
  pending: {
    color: Colors.light.warning,
  },
  explorerButton: {
    paddingTop: 2,
  },
});
