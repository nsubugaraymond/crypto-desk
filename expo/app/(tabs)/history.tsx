import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { useRouter } from 'expo-router';
import { 
  StyleSheet, 
  Text, 
  View, 
  SectionList, 
  RefreshControl,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import { ArrowDownLeft, ArrowUpRight, Clock } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import TransactionItem from '@/components/TransactionItem';
import Colors from '@/constants/colors';
import Typography from '@/constants/typography';
import { useWalletStore } from '@/hooks/useWalletStore';
import { Transaction } from '@/types/wallet';

type FilterType = 'all' | 'sent' | 'received';

interface TransactionSection {
  title: string;
  data: Transaction[];
}

function groupTransactionsByDate(transactions: Transaction[]): TransactionSection[] {
  const groups: Record<string, Transaction[]> = {};
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const yesterday = today - 86400000;
  const weekAgo = today - 7 * 86400000;

  for (const tx of transactions) {
    const txDate = new Date(tx.timestamp);
    const txDay = new Date(txDate.getFullYear(), txDate.getMonth(), txDate.getDate()).getTime();

    let label: string;
    if (txDay >= today) {
      label = 'Today';
    } else if (txDay >= yesterday) {
      label = 'Yesterday';
    } else if (txDay >= weekAgo) {
      label = 'This Week';
    } else {
      label = txDate.toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
    }

    if (!groups[label]) groups[label] = [];
    groups[label].push(tx);
  }

  const order = ['Today', 'Yesterday', 'This Week'];
  return Object.entries(groups)
    .sort(([a], [b]) => {
      const ai = order.indexOf(a);
      const bi = order.indexOf(b);
      if (ai !== -1 && bi !== -1) return ai - bi;
      if (ai !== -1) return -1;
      if (bi !== -1) return 1;
      return b.localeCompare(a);
    })
    .map(([title, data]) => ({ title, data }));
}

export default function HistoryScreen() {
  const router = useRouter();
  const { address, transactions, refreshTransactions, isLoading } = useWalletStore();
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [filter, setFilter] = useState<FilterType>('all');

  useEffect(() => {
    if (!isLoading && !address) {
      router.replace('/');
      return;
    }

    if (address) {
      console.log('History screen mounted for wallet:', `${address.slice(0, 6)}...${address.slice(-4)}`);
    }
  }, [address, isLoading, router]);

  const filteredTransactions = useMemo(() => {
    if (filter === 'all') return transactions;
    if (filter === 'sent') return transactions.filter(t => t.type === 'outgoing');
    return transactions.filter(t => t.type === 'incoming');
  }, [transactions, filter]);

  const sections = useMemo(() => groupTransactionsByDate(filteredTransactions), [filteredTransactions]);

  const sentCount = useMemo(() => transactions.filter(t => t.type === 'outgoing').length, [transactions]);
  const receivedCount = useMemo(() => transactions.filter(t => t.type === 'incoming').length, [transactions]);

  const onRefresh = useCallback(async () => {
    console.log('Manual refresh triggered');
    setRefreshing(true);
    try {
      await refreshTransactions();
    } finally {
      setRefreshing(false);
    }
  }, [refreshTransactions]);

  if (isLoading && !address) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.light.primary} testID="history-screen-loading-indicator" />
        </View>
      </SafeAreaView>
    );
  }

  if (!address) {
    return null;
  }

  const renderItem = ({ item }: { item: Transaction }) => (
    <TransactionItem transaction={item} />
  );

  const renderSectionHeader = ({ section }: { section: TransactionSection }) => (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionHeaderText}>{section.title}</Text>
      <Text style={styles.sectionCount}>{section.data.length} transaction{section.data.length !== 1 ? 's' : ''}</Text>
    </View>
  );

  const renderEmptyList = () => (
    <View style={styles.emptyContainer}>
      <View style={styles.emptyIconWrapper}>
        <Clock size={36} color={Colors.light.muted} />
      </View>
      <Text style={styles.emptyTitle}>
        {filter === 'all' ? 'No Transactions Yet' : filter === 'sent' ? 'No Sent Transactions' : 'No Received Transactions'}
      </Text>
      <Text style={styles.emptyText}>
        {filter === 'all'
          ? 'Your transaction history will appear here once you send or receive tokens.'
          : filter === 'sent'
          ? 'You haven\'t sent any tokens yet.'
          : 'You haven\'t received any tokens yet.'}
      </Text>
    </View>
  );

  const filters: { key: FilterType; label: string; count: number; icon?: React.ReactNode }[] = [
    { key: 'all', label: 'All', count: transactions.length },
    { key: 'sent', label: 'Sent', count: sentCount, icon: <ArrowUpRight size={13} color={filter === 'sent' ? '#fff' : Colors.light.muted} /> },
    { key: 'received', label: 'Received', count: receivedCount, icon: <ArrowDownLeft size={13} color={filter === 'received' ? '#fff' : Colors.light.muted} /> },
  ];

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Transactions</Text>
        <Text style={styles.subtitle}>{transactions.length} total</Text>
      </View>

      <View style={styles.filterRow}>
        {filters.map((f) => (
          <TouchableOpacity
            key={f.key}
            style={[styles.filterChip, filter === f.key && styles.filterChipActive]}
            onPress={() => setFilter(f.key)}
            activeOpacity={0.7}
          >
            {f.icon && <View style={styles.filterIcon}>{f.icon}</View>}
            <Text style={[styles.filterChipText, filter === f.key && styles.filterChipTextActive]}>
              {f.label}
            </Text>
            {f.count > 0 && (
              <View style={[styles.filterBadge, filter === f.key && styles.filterBadgeActive]}>
                <Text style={[styles.filterBadgeText, filter === f.key && styles.filterBadgeTextActive]}>
                  {f.count}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        ))}
      </View>

      {refreshing && transactions.length === 0 ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.light.primary} />
          <Text style={styles.loadingText}>Loading transactions...</Text>
        </View>
      ) : (
        <SectionList
          sections={sections}
          renderItem={renderItem}
          renderSectionHeader={renderSectionHeader}
          keyExtractor={(item) => item.txID}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={renderEmptyList}
          stickySectionHeadersEnabled={false}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl 
              refreshing={refreshing} 
              onRefresh={onRefresh}
              colors={[Colors.light.primary]}
              tintColor={Colors.light.primary}
            />
          }
        />
      )}
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
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 4,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
  },
  title: {
    ...Typography.titleBold,
    color: Colors.light.text,
  },
  subtitle: {
    ...Typography.captionRegular,
    color: Colors.light.muted,
  },
  filterRow: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 8,
    gap: 8,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#E8EDF5',
  },
  filterChipActive: {
    backgroundColor: Colors.light.primary,
    borderColor: Colors.light.primary,
  },
  filterIcon: {
    marginRight: 4,
  },
  filterChipText: {
    ...Typography.smallSemibold,
    color: Colors.light.text,
  },
  filterChipTextActive: {
    color: '#fff',
  },
  filterBadge: {
    marginLeft: 6,
    backgroundColor: '#E8EDF5',
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 1,
    minWidth: 20,
    alignItems: 'center',
  },
  filterBadgeActive: {
    backgroundColor: 'rgba(255,255,255,0.25)',
  },
  filterBadgeText: {
    ...Typography.xsRegular,
    color: Colors.light.muted,
    fontWeight: '600' as const,
  },
  filterBadgeTextActive: {
    color: '#fff',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 4,
    paddingTop: 16,
    paddingBottom: 8,
  },
  sectionHeaderText: {
    ...Typography.captionSemibold,
    color: Colors.light.text,
    textTransform: 'uppercase' as const,
    letterSpacing: 0.5,
  },
  sectionCount: {
    ...Typography.xsRegular,
    color: Colors.light.muted,
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 24,
    flexGrow: 1,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    marginTop: 60,
  },
  emptyIconWrapper: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#E8EDF5',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    ...Typography.subtitleSemibold,
    color: Colors.light.text,
    marginBottom: 8,
  },
  emptyText: {
    ...Typography.bodyRegular,
    color: Colors.light.muted,
    textAlign: 'center',
    lineHeight: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    ...Typography.bodyRegular,
    marginTop: 12,
    color: Colors.light.muted,
  },
});
