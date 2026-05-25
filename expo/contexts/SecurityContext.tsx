import * as SecureStore from 'expo-secure-store';
import * as LocalAuthentication from 'expo-local-authentication';
import { useState, useEffect } from 'react';
import createContextHook from '@nkzw/create-context-hook';
import { Platform } from 'react-native';

const STORAGE_KEY_PIN = 'wallet_pin';
const STORAGE_KEY_BIOMETRIC = 'wallet_biometric_enabled';
const STORAGE_KEY_REQUIRE_AUTH_FOR_TRANSACTIONS = 'wallet_require_auth_transactions';

const readSecureValue = async (key: string): Promise<string | null> => {
  return SecureStore.getItemAsync(key);
};

const writeSecureValue = async (key: string, value: string): Promise<void> => {
  await SecureStore.setItemAsync(key, value);
};

const deleteSecureValue = async (key: string): Promise<void> => {
  await SecureStore.deleteItemAsync(key);
};

export type SecuritySettings = {
  isPinSet: boolean;
  isBiometricEnabled: boolean;
  isBiometricAvailable: boolean;
  requireAuthForTransactions: boolean;
};

export const [SecurityContext, useSecurity] = createContextHook(() => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isPinSet, setIsPinSet] = useState(false);
  const [isBiometricEnabled, setIsBiometricEnabled] = useState(false);
  const [isBiometricAvailable, setIsBiometricAvailable] = useState(false);
  const [requireAuthForTransactions, setRequireAuthForTransactions] = useState(true);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    initializeSecurity();
  }, []);

  const initializeSecurity = async () => {
    try {
      const [pin, biometric, requireAuth, biometricHardware] = await Promise.all([
        readSecureValue(STORAGE_KEY_PIN),
        readSecureValue(STORAGE_KEY_BIOMETRIC),
        readSecureValue(STORAGE_KEY_REQUIRE_AUTH_FOR_TRANSACTIONS),
        checkBiometricAvailability()
      ]);

      setIsPinSet(!!pin);
      setIsBiometricEnabled(biometric === 'true');
      setRequireAuthForTransactions(requireAuth !== 'false');
      setIsBiometricAvailable(biometricHardware);
    } catch (error) {
      console.error('Error initializing security:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const checkBiometricAvailability = async (): Promise<boolean> => {
    try {
      if (Platform.OS === 'web') {
        return false;
      }
      const compatible = await LocalAuthentication.hasHardwareAsync();
      const enrolled = await LocalAuthentication.isEnrolledAsync();
      return compatible && enrolled;
    } catch (error) {
      console.error('Error checking biometric availability:', error);
      return false;
    }
  };

  const setPin = async (pin: string): Promise<void> => {
    try {
      await writeSecureValue(STORAGE_KEY_PIN, pin);
      setIsPinSet(true);
    } catch (error) {
      console.error('Error setting PIN:', error);
      throw new Error('Failed to set PIN');
    }
  };

  const verifyPin = async (pin: string): Promise<boolean> => {
    try {
      const storedPin = await readSecureValue(STORAGE_KEY_PIN);
      return storedPin === pin;
    } catch (error) {
      console.error('Error verifying PIN:', error);
      return false;
    }
  };

  const changePin = async (oldPin: string, newPin: string): Promise<boolean> => {
    try {
      const isValid = await verifyPin(oldPin);
      if (!isValid) {
        return false;
      }
      await setPin(newPin);
      return true;
    } catch (error) {
      console.error('Error changing PIN:', error);
      return false;
    }
  };

  const removePin = async (pin: string): Promise<boolean> => {
    try {
      const isValid = await verifyPin(pin);
      if (!isValid) {
        return false;
      }
      await deleteSecureValue(STORAGE_KEY_PIN);
      setIsPinSet(false);
      setIsAuthenticated(false);
      return true;
    } catch (error) {
      console.error('Error removing PIN:', error);
      return false;
    }
  };

  const enableBiometric = async (): Promise<void> => {
    try {
      await writeSecureValue(STORAGE_KEY_BIOMETRIC, 'true');
      setIsBiometricEnabled(true);
    } catch (error) {
      console.error('Error enabling biometric:', error);
      throw new Error('Failed to enable biometric authentication');
    }
  };

  const disableBiometric = async (): Promise<void> => {
    try {
      await deleteSecureValue(STORAGE_KEY_BIOMETRIC);
      setIsBiometricEnabled(false);
    } catch (error) {
      console.error('Error disabling biometric:', error);
      throw new Error('Failed to disable biometric authentication');
    }
  };

  const authenticateWithBiometric = async (): Promise<boolean> => {
    try {
      if (Platform.OS === 'web') {
        return false;
      }

      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Authenticate to access your wallet',
        fallbackLabel: 'Use PIN',
        cancelLabel: 'Cancel',
      });

      if (result.success) {
        setIsAuthenticated(true);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error authenticating with biometric:', error);
      return false;
    }
  };

  const authenticate = async (pin?: string): Promise<boolean> => {
    try {
      if (isBiometricEnabled && isBiometricAvailable) {
        const biometricSuccess = await authenticateWithBiometric();
        if (biometricSuccess) {
          return true;
        }
      }

      if (pin) {
        const isValid = await verifyPin(pin);
        if (isValid) {
          setIsAuthenticated(true);
          return true;
        }
      }

      return false;
    } catch (error) {
      console.error('Error during authentication:', error);
      return false;
    }
  };

  const authenticateForTransaction = async (pin?: string): Promise<boolean> => {
    if (!requireAuthForTransactions) {
      return true;
    }
    return authenticate(pin);
  };

  const logout = () => {
    setIsAuthenticated(false);
  };

  const setRequireAuthForTransactionsSetting = async (value: boolean): Promise<void> => {
    try {
      await writeSecureValue(STORAGE_KEY_REQUIRE_AUTH_FOR_TRANSACTIONS, value.toString());
      setRequireAuthForTransactions(value);
    } catch (error) {
      console.error('Error setting transaction auth requirement:', error);
      throw new Error('Failed to update setting');
    }
  };

  const getSecuritySettings = (): SecuritySettings => {
    return {
      isPinSet,
      isBiometricEnabled,
      isBiometricAvailable,
      requireAuthForTransactions,
    };
  };

  return {
    isAuthenticated,
    isLoading,
    isPinSet,
    isBiometricEnabled,
    isBiometricAvailable,
    requireAuthForTransactions,
    setPin,
    verifyPin,
    changePin,
    removePin,
    enableBiometric,
    disableBiometric,
    authenticate,
    authenticateForTransaction,
    logout,
    setRequireAuthForTransactions: setRequireAuthForTransactionsSetting,
    getSecuritySettings,
  };
});
