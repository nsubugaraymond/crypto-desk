import React, { useState } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { useSecurity } from '@/contexts/SecurityContext';
import PinSetup from '@/components/PinSetup';
import PinVerification from '@/components/PinVerification';
import Colors from '@/constants/colors';

interface AuthGateProps {
  children: React.ReactNode;
}

export default function AuthGate({ children }: AuthGateProps) {
  const {
    isAuthenticated,
    isLoading,
    isPinSet,
    isBiometricEnabled,
    setPin,
    authenticate,
  } = useSecurity();
  const [isSettingUp, setIsSettingUp] = useState(false);

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.light.primary} />
      </View>
    );
  }

  if (!isPinSet && !isSettingUp) {
    return (
      <PinSetup
        title="Secure Your Wallet"
        subtitle="Create a 6-digit PIN to protect your wallet"
        onComplete={async (pin) => {
          setIsSettingUp(true);
          await setPin(pin);
          await authenticate(pin);
          setIsSettingUp(false);
        }}
      />
    );
  }

  if (!isAuthenticated) {
    return (
      <PinVerification
        title="Unlock Wallet"
        subtitle="Enter your PIN to access your wallet"
        onVerifyPin={async (pin) => {
          const result = await authenticate(pin);
          return result;
        }}
        onBiometric={isBiometricEnabled ? async () => {
          const result = await authenticate();
          return result;
        } : undefined}
        showBiometric={isBiometricEnabled}
        onSuccess={() => {}}
      />
    );
  }

  return <>{children}</>;
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
});
