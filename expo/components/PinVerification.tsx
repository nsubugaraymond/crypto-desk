import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Vibration,
  Platform,
} from 'react-native';
import { Lock, Fingerprint } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import Colors from '@/constants/colors';
import Typography from '@/constants/typography';

interface PinVerificationProps {
  onSuccess: () => void;
  onVerifyPin: (pin: string) => Promise<boolean>;
  onBiometric?: () => Promise<boolean>;
  showBiometric?: boolean;
  title?: string;
  subtitle?: string;
}

export default function PinVerification({ 
  onSuccess,
  onVerifyPin,
  onBiometric,
  showBiometric = false,
  title = 'Enter PIN',
  subtitle = 'Enter your 6-digit PIN to unlock',
}: PinVerificationProps) {
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [attempts, setAttempts] = useState(0);

  const handleNumberPress = async (num: number) => {
    if (Platform.OS !== 'web') {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }

    if (pin.length < 6) {
      const newPin = pin + num.toString();
      setPin(newPin);
      setError('');
      
      if (newPin.length === 6) {
        const isValid = await onVerifyPin(newPin);
        
        if (isValid) {
          onSuccess();
        } else {
          const newAttempts = attempts + 1;
          setAttempts(newAttempts);
          
          if (Platform.OS !== 'web') {
            Vibration.vibrate(500);
          }
          
          setError(`Incorrect PIN. ${3 - newAttempts} attempts remaining.`);
          setPin('');
          
          if (newAttempts >= 3) {
            setError('Too many failed attempts. Please try biometric authentication.');
          }
        }
      }
    }
  };

  const handleDelete = async () => {
    if (Platform.OS !== 'web') {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setPin(prev => prev.slice(0, -1));
    setError('');
  };

  const handleBiometric = async () => {
    if (onBiometric) {
      const success = await onBiometric();
      if (success) {
        onSuccess();
      } else {
        setError('Biometric authentication failed');
      }
    }
  };

  const renderPinDots = () => {
    return (
      <View style={styles.dotsContainer}>
        {[0, 1, 2, 3, 4, 5].map((index) => (
          <View
            key={index}
            style={[
              styles.dot,
              pin.length > index && styles.dotFilled,
              error && styles.dotError,
            ]}
          />
        ))}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.iconContainer}>
          <Lock size={40} color={Colors.light.primary} />
        </View>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.subtitle}>{subtitle}</Text>
      </View>

      {renderPinDots()}
      
      {error ? (
        <Text style={styles.errorText}>{error}</Text>
      ) : null}

      <View style={styles.keypad}>
        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
          <TouchableOpacity
            key={num}
            style={styles.key}
            onPress={() => handleNumberPress(num)}
            disabled={attempts >= 3}
          >
            <Text style={[styles.keyText, attempts >= 3 && styles.keyTextDisabled]}>
              {num}
            </Text>
          </TouchableOpacity>
        ))}
        
        <TouchableOpacity
          style={[styles.key, styles.keyEmpty]}
          onPress={handleBiometric}
          disabled={!showBiometric || !onBiometric}
        >
          {showBiometric && onBiometric && (
            <Fingerprint size={28} color={Colors.light.primary} />
          )}
        </TouchableOpacity>
        
        <TouchableOpacity
          style={styles.key}
          onPress={() => handleNumberPress(0)}
          disabled={attempts >= 3}
        >
          <Text style={[styles.keyText, attempts >= 3 && styles.keyTextDisabled]}>
            0
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.key, styles.keyEmpty]}
          onPress={handleDelete}
          disabled={pin.length === 0 || attempts >= 3}
        >
          <Text style={[styles.deleteText, attempts >= 3 && styles.keyTextDisabled]}>
            ⌫
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    justifyContent: 'space-around',
    paddingVertical: 40,
  },
  header: {
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.light.primary + '20',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  title: {
    ...Typography.headingBold,
    color: Colors.light.text,
    marginBottom: 8,
  },
  subtitle: {
    ...Typography.bodyLargeRegular,
    color: Colors.light.muted,
    textAlign: 'center',
  },
  dotsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 16,
    marginVertical: 40,
  },
  dot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: Colors.light.border,
    backgroundColor: 'transparent',
  },
  dotFilled: {
    backgroundColor: Colors.light.primary,
    borderColor: Colors.light.primary,
  },
  dotError: {
    borderColor: Colors.light.error,
    backgroundColor: Colors.light.error,
  },
  errorText: {
    ...Typography.bodyRegular,
    color: Colors.light.error,
    textAlign: 'center',
    marginTop: -20,
    marginBottom: 20,
    paddingHorizontal: 24,
  },
  keypad: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    paddingHorizontal: 40,
    gap: 16,
  },
  key: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#F5F7FA',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  keyEmpty: {
    backgroundColor: 'transparent',
  },
  keyText: {
    ...Typography.keypadDigit,
    color: Colors.light.text,
  },
  keyTextDisabled: {
    color: Colors.light.muted,
    opacity: 0.5,
  },
  deleteText: {
    ...Typography.keypadDigit,
    fontWeight: '400' as const,
    color: Colors.light.muted,
  },
});
