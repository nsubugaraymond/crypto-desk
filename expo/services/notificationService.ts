import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createAudioPlayer } from 'expo-audio';
import Constants, { ExecutionEnvironment } from 'expo-constants';

const LAST_CHECKED_KEY = 'last_checked_transactions';
const CASH_SOUND_URI = 'https://assets.mixkit.co/active_storage/sfx/2058/2058-preview.mp3';

export type TransactionToastPayload = {
  id: string;
  type: 'incoming' | 'outgoing';
  amount: string;
  currency: string;
  txID: string;
};

type ToastCallback = (payload: TransactionToastPayload) => void;

let _toastCallback: ToastCallback | null = null;

export function registerToastCallback(cb: ToastCallback) {
  _toastCallback = cb;
}

export function unregisterToastCallback() {
  _toastCallback = null;
}

const isExpoGo = Constants.executionEnvironment === ExecutionEnvironment.StoreClient;

let Notifications: typeof import('expo-notifications') | null = null;

async function getNotifications() {
  if (isExpoGo) {
    console.log('🔔 Skipping expo-notifications in Expo Go');
    return null;
  }
  if (Notifications) return Notifications;
  try {
    Notifications = await import('expo-notifications');
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
        shouldShowBanner: true,
        shouldShowList: true,
        priority: Notifications!.AndroidNotificationPriority.HIGH,
      }),
    });
    return Notifications;
  } catch (error) {
    console.log('expo-notifications not available:', error);
    return null;
  }
}

export const requestNotificationPermissions = async (): Promise<boolean> => {
  try {
    if (Platform.OS === 'web') {
      if ('Notification' in window) {
        if (Notification.permission === 'granted') return true;
        if (Notification.permission !== 'denied') {
          const permission = await Notification.requestPermission();
          return permission === 'granted';
        }
      }
      return false;
    }

    const notif = await getNotifications();
    if (!notif) {
      console.log('🔔 Notifications not available — skipping permission request');
      return false;
    }

    const { status: existingStatus } = await notif.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await notif.requestPermissionsAsync();
      finalStatus = status;
    }

    if (Platform.OS === 'android') {
      try {
        await notif.setNotificationChannelAsync('transactions', {
          name: 'Transactions',
          importance: notif.AndroidImportance.HIGH,
          vibrationPattern: [0, 250, 250, 250],
          sound: 'default',
        });
      } catch (channelError) {
        console.log('Could not set notification channel:', channelError);
      }
    }

    console.log('🔔 Notification permission:', finalStatus);
    return finalStatus === 'granted';
  } catch (error) {
    console.log('Notification permissions not available:', error);
    return false;
  }
};

export const playCashSound = async (): Promise<void> => {
  try {
    console.log('🔊 Playing cash deposit sound...');
    const player = createAudioPlayer({ uri: CASH_SOUND_URI });

    player.play();

    setTimeout(() => {
      try {
        player.remove();
      } catch {
        // ignore cleanup errors
      }
    }, 4000);
  } catch (error) {
    console.log('Could not play cash sound:', error);
  }
};

export const sendLocalNotification = async (
  title: string,
  body: string,
  data?: Record<string, string>
) => {
  try {
    if (Platform.OS === 'web') {
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification(title, { body });
      }
      return;
    }

    const notif = await getNotifications();
    if (!notif) {
      console.log('📋 Notification (no-op):', title, '-', body);
      return;
    }

    await notif.scheduleNotificationAsync({
      content: {
        title,
        body,
        data: data ?? {},
        sound: 'default',
        ...(Platform.OS === 'android' && { channelId: 'transactions' }),
      },
      trigger: null,
    });

    console.log('💰 Notification sent:', title, '-', body);
  } catch (error) {
    console.log('Notification fallback (sound/log only):', title, '-', body);
  }
};

export const getLastCheckedTransactions = async (): Promise<string[]> => {
  try {
    const stored = await AsyncStorage.getItem(LAST_CHECKED_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error('Error getting last checked transactions:', error);
    return [];
  }
};

export const setLastCheckedTransactions = async (txIds: string[]): Promise<void> => {
  try {
    await AsyncStorage.setItem(LAST_CHECKED_KEY, JSON.stringify(txIds));
  } catch (error) {
    console.error('Error setting last checked transactions:', error);
  }
};

export const checkForNewIncomingTransactions = async (
  currentTransactions: {
    txID: string;
    type: 'incoming' | 'outgoing';
    amount: string;
    currency: string;
    timestamp: number;
  }[],
  address: string
): Promise<number> => {
  try {
    const lastCheckedTxIds = await getLastCheckedTransactions();
    const currentTxIds = currentTransactions.map(tx => tx.txID);

    if (lastCheckedTxIds.length === 0) {
      if (currentTxIds.length > 0) {
        await setLastCheckedTransactions(currentTxIds.slice(0, 100));
      }
      console.log('📋 First load — storing transaction IDs without notifications');
      return 0;
    }

    const newIncoming = currentTransactions.filter(
      tx => tx.type === 'incoming' && !lastCheckedTxIds.includes(tx.txID)
    );

    if (newIncoming.length > 0) {
      console.log(`🆕 ${newIncoming.length} new incoming transaction(s) detected!`);

      await playCashSound();

      for (const tx of newIncoming) {
        console.log('New incoming transaction:', tx.txID, tx.amount, tx.currency);
        await sendLocalNotification(
          '💰 Payment Received',
          `You received ${tx.amount} ${tx.currency}`,
          { txID: tx.txID, type: 'incoming', currency: tx.currency }
        );
        if (_toastCallback) {
          _toastCallback({
            id: tx.txID + '_in',
            type: 'incoming',
            amount: tx.amount,
            currency: tx.currency,
            txID: tx.txID,
          });
        }
      }
    }

    const newOutgoing = currentTransactions.filter(
      tx => tx.type === 'outgoing' && !lastCheckedTxIds.includes(tx.txID)
    );

    for (const tx of newOutgoing) {
      console.log('New outgoing transaction confirmed:', tx.txID);
      await sendLocalNotification(
        '📤 Payment Sent',
        `You sent ${tx.amount} ${tx.currency}`,
        { txID: tx.txID, type: 'outgoing', currency: tx.currency }
      );
      if (_toastCallback) {
        _toastCallback({
          id: tx.txID + '_out',
          type: 'outgoing',
          amount: tx.amount,
          currency: tx.currency,
          txID: tx.txID,
        });
      }
    }

    if (currentTxIds.length > 0) {
      await setLastCheckedTransactions(currentTxIds.slice(0, 100));
    }

    return newIncoming.length;
  } catch (error) {
    console.error('Error checking for new transactions:', error);
    return 0;
  }
};
