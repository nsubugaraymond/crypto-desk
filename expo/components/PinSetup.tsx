import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Vibration,
  Platform,
} from 'react-native';
import { Shield } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import Colors from '@/constants/colors';
import Typography from '@/constants/typography';

interface PinSetupProps {
  onComplete: (pin: string) => void;
  onSkip?: () => void;
  title?: string;
  subtitle?: string;
  isChangingPin?: boolean;
  oldPin?: string;
}

export default function PinSetup({ 
  onComplete, 
  onSkip, 
  title = 'Set up PIN',
  subtitle = 'Create a 6-digit PIN to secure your wallet',
  isChangingPin = false,
  oldPin,
}: PinSetupProps) {
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [isConfirming, setIsConfirming] = useState(false);

  const handleNumberPress = async (num: number) => {
    if (Platform.OS !== 'web') {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }

    const currentPin = isConfirming ? confirmPin : pin;
    
    if (currentPin.length < 6) {
      const newPin = currentPin + num.toString();
      
      if (isConfirming) {
        setConfirmPin(newPin);
        
        if (newPin.length === 6) {
          if (newPin === pin) {
            onComplete(newPin);
          } else {
            if (Platform.OS !== 'web') {
              Vibration.vibrate(500);
            }
            Alert.alert('Error', 'PINs do not match. Please try again.');
            setPin('');
            setConfirmPin('');
            setIsConfirming(false);
          }
        }
      } else {
        setPin(newPin);
        
        if (newPin.length === 6) {
          setIsConfirming(true);
        }
      }
    }
  };

  const handleDelete = async () => {
    if (Platform.OS !== 'web') {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }

    if (isConfirming) {
      setConfirmPin(prev => prev.slice(0, -1));
    } else {
      setPin(prev => prev.slice(0, -1));
    }
  };

  const renderPinDots = (pinValue: string) => {
    return (
      <View style={styles.dotsContainer}>
        {[0, 1, 2, 3, 4, 5].map((index) => (
          <View
            key={index}
            style={[
              styles.dot,
              pinValue.length > index && styles.dotFilled,
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
          <Shield size={40} color={Colors.light.primary} />
        </View>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.subtitle}>
          {isConfirming ? 'Confirm your PIN' : subtitle}
        </Text>
      </View>

      {renderPinDots(isConfirming ? confirmPin : pin)}

      <View style={styles.keypad}>
        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
          <TouchableOpacity
            key={num}
            style={styles.key}
            onPress={() => handleNumberPress(num)}
          >
            <Text style={styles.keyText}>{num}</Text>
          </TouchableOpacity>
        ))}
        
        <TouchableOpacity
          style={[styles.key, styles.keyEmpty]}
          onPress={onSkip}
          disabled={!onSkip || isConfirming}
        >
          {onSkip && !isConfirming && (
            <Text style={styles.skipText}>Skip</Text>
          )}
        </TouchableOpacity>
        
        <TouchableOpacity
          style={styles.key}
          onPress={() => handleNumberPress(0)}
        >
          <Text style={styles.keyText}>0</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.key, styles.keyEmpty]}
          onPress={handleDelete}
          disabled={(isConfirming ? confirmPin : pin).length === 0}
        >
          <Text style={styles.deleteText}>⌫</Text>
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
  deleteText: {
    ...Typography.keypadDigit,
    fontWeight: '400' as const,
    color: Colors.light.muted,
  },
  skipText: {
    ...Typography.bodySemibold,
    color: Colors.light.primary,
  },
});
