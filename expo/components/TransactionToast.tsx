import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  TouchableOpacity,
  Dimensions,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArrowDownLeft, ArrowUpRight, X } from 'lucide-react-native';

import Typography from '@/constants/typography';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export interface ToastData {
  id: string;
  type: 'incoming' | 'outgoing';
  amount: string;
  currency: string;
  txID: string;
  from?: string;
  to?: string;
}

interface TransactionToastProps {
  data: ToastData | null;
  visible: boolean;
  onDismiss: () => void;
  duration?: number;
}

export default function TransactionToast({
  data,
  visible,
  onDismiss,
  duration = 5000,
}: TransactionToastProps) {
  const insets = useSafeAreaInsets();
  const translateY = useRef(new Animated.Value(-200)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0.9)).current;
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (visible && data) {
      Animated.parallel([
        Animated.spring(translateY, {
          toValue: 0,
          useNativeDriver: true,
          tension: 80,
          friction: 12,
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.spring(scale, {
          toValue: 1,
          useNativeDriver: true,
          tension: 80,
          friction: 10,
        }),
      ]).start();

      timerRef.current = setTimeout(() => {
        dismissToast();
      }, duration);
    }

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [visible, data]);

  const dismissToast = () => {
    Animated.parallel([
      Animated.timing(translateY, {
        toValue: -200,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 0,
        duration: 250,
        useNativeDriver: true,
      }),
      Animated.timing(scale, {
        toValue: 0.9,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onDismiss();
    });
  };

  if (!data) return null;

  const isIncoming = data.type === 'incoming';
  const accentColor = isIncoming ? '#00C48C' : '#FF647C';
  const bgColor = isIncoming ? '#0A1F15' : '#1F0A10';
  const iconBg = isIncoming ? 'rgba(0, 196, 140, 0.15)' : 'rgba(255, 100, 124, 0.15)';
  const label = isIncoming ? 'Received' : 'Sent';
  const shortTx = data.txID.length > 16
    ? `${data.txID.slice(0, 8)}...${data.txID.slice(-8)}`
    : data.txID;

  return (
    <Animated.View
      style={[
        styles.container,
        {
          top: insets.top + 8,
          transform: [{ translateY }, { scale }],
          opacity,
        },
      ]}
      pointerEvents={visible ? 'auto' : 'none'}
    >
      <View style={[styles.toast, { backgroundColor: bgColor, borderColor: accentColor }]}>
        <View style={[styles.iconContainer, { backgroundColor: iconBg }]}>
          {isIncoming ? (
            <ArrowDownLeft size={22} color={accentColor} />
          ) : (
            <ArrowUpRight size={22} color={accentColor} />
          )}
        </View>

        <View style={styles.content}>
          <View style={styles.topRow}>
            <Text style={[styles.label, { color: accentColor }]}>{label}</Text>
            <TouchableOpacity
              onPress={dismissToast}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
              style={styles.closeBtn}
            >
              <X size={16} color="#8A8FA0" />
            </TouchableOpacity>
          </View>
          <Text style={styles.amount}>
            {isIncoming ? '+' : '-'}{data.amount} {data.currency}
          </Text>
          <Text style={styles.txId} numberOfLines={1}>
            TX: {shortTx}
          </Text>
        </View>

        <View style={[styles.accentBar, { backgroundColor: accentColor }]} />
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 16,
    right: 16,
    zIndex: 9999,
    alignItems: 'center',
    ...(Platform.OS === 'web' ? { pointerEvents: 'box-none' as const } : {}),
  },
  toast: {
    width: SCREEN_WIDTH - 32,
    maxWidth: 420,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderLeftWidth: 0,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.35,
        shadowRadius: 16,
      },
      android: {
        elevation: 12,
      },
      web: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.35,
        shadowRadius: 16,
      },
    }),
  },
  accentBar: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 4,
    borderTopLeftRadius: 16,
    borderBottomLeftRadius: 16,
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  content: {
    flex: 1,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 2,
  },
  label: {
    ...Typography.labelUppercase,
  },
  closeBtn: {
    padding: 2,
  },
  amount: {
    ...Typography.balanceMedium,
    color: '#FFFFFF',
    marginBottom: 2,
  },
  txId: {
    ...Typography.monoSmall,
    color: '#6B7080',
  },
});
