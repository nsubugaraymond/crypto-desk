import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Alert,
  ScrollView,
  Platform,
  Switch,
  Modal,
  TextInput,
  Linking,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Eye,
  EyeOff,
  Network,
  Copy,
  Shield,
  Fingerprint,
  Lock,
  FileText,
  Mail,
  Trash2,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import * as Clipboard from 'expo-clipboard';

import Colors from '@/constants/colors';
import Typography from '@/constants/typography';
import { useWalletStore } from '@/hooks/useWalletStore';
import { getNetwork, setNetwork, NetworkType } from '@/services/tronService';
import { useRouter } from 'expo-router';
import { useSecurity } from '@/contexts/SecurityContext';
import PinSetup from '@/components/PinSetup';
import PinVerification from '@/components/PinVerification';
import { APP_COMPANY_NAME, PRIVACY_POLICY_TITLE, SUPPORT_EMAIL, SUPPORT_SUBJECT } from '@/constants/compliance';

type PinPromptMode = 'change' | 'remove' | null;
type SecretAction = 'revealMnemonic' | 'revealPrivateKey' | 'copyPrivateKey' | null;

export default function SettingsScreen() {
  const router = useRouter();
  const { address, mnemonic, privateKey, resetWallet, isLoading } = useWalletStore();
  const {
    isPinSet,
    isBiometricEnabled,
    isBiometricAvailable,
    requireAuthForTransactions,
    enableBiometric,
    disableBiometric,
    setRequireAuthForTransactions,
    removePin,
    verifyPin,
    changePin,
    authenticate,
  } = useSecurity();

  const [showMnemonic, setShowMnemonic] = useState<boolean>(false);
  const [showPrivateKey, setShowPrivateKey] = useState<boolean>(false);
  const [currentNetwork, setCurrentNetwork] = useState<NetworkType>('nile');
  const [showChangePinModal, setShowChangePinModal] = useState<boolean>(false);
  const [oldPinForChange, setOldPinForChange] = useState<string>('');
  const [pinPromptMode, setPinPromptMode] = useState<PinPromptMode>(null);
  const [pinPromptValue, setPinPromptValue] = useState<string>('');
  const [pinPromptError, setPinPromptError] = useState<string>('');
  const [secretAction, setSecretAction] = useState<SecretAction>(null);

  useEffect(() => {
    if (!isLoading && !address) {
      router.replace('/');
      return;
    }

    if (address) {
      void loadNetwork();
    }
  }, [address, isLoading, router]);

  const loadNetwork = async () => {
    const network = await getNetwork();
    setCurrentNetwork(network);
  };

  const closePinPrompt = () => {
    setPinPromptMode(null);
    setPinPromptValue('');
    setPinPromptError('');
  };

  const openPinPrompt = (mode: Exclude<PinPromptMode, null>) => {
    setPinPromptMode(mode);
    setPinPromptValue('');
    setPinPromptError('');
  };

  const handleNetworkChange = async (network: NetworkType) => {
    try {
      await Haptics.selectionAsync();
      await setNetwork(network);
      setCurrentNetwork(network);
      Alert.alert(
        'Network Changed',
        `Switched to ${network === 'mainnet' ? 'Mainnet' : 'Nile Testnet'}. Please refresh your balances.`
      );
    } catch {
      Alert.alert('Error', 'Failed to change network');
    }
  };

  const closeSecretAuth = () => {
    setSecretAction(null);
  };

  const scheduleClipboardClear = (value: string) => {
    setTimeout(() => {
      void Clipboard.getStringAsync()
        .then(async (currentClipboardValue) => {
          if (currentClipboardValue === value) {
            await Clipboard.setStringAsync('');
          }
        })
        .catch((error) => {
          console.error('Failed to clear clipboard:', error);
        });
    }, 60000);
  };

  const performSecretAction = async (action: Exclude<SecretAction, null>) => {
    if (action === 'revealMnemonic') {
      setShowMnemonic(true);
      return;
    }

    if (action === 'revealPrivateKey') {
      setShowPrivateKey(true);
      return;
    }

    if (action === 'copyPrivateKey') {
      if (!privateKey) {
        return;
      }

      try {
        await Haptics.selectionAsync();
        await Clipboard.setStringAsync(privateKey);
        scheduleClipboardClear(privateKey);
        Alert.alert('Private Key Copied', 'Private key copied to clipboard for 60 seconds');
      } catch (error) {
        console.error('Failed to copy private key:', error);
        Alert.alert('Error', 'Failed to copy private key to clipboard');
      }
    }
  };

  const requestSecretAction = (action: Exclude<SecretAction, null>) => {
    setSecretAction(action);
  };

  const handleMnemonicVisibility = () => {
    if (showMnemonic) {
      setShowMnemonic(false);
      return;
    }

    requestSecretAction('revealMnemonic');
  };

  const handlePrivateKeyVisibility = () => {
    if (showPrivateKey) {
      setShowPrivateKey(false);
      return;
    }

    requestSecretAction('revealPrivateKey');
  };

  const copyPrivateKey = async () => {
    if (!privateKey) {
      return;
    }

    requestSecretAction('copyPrivateKey');
  };

  const copySupportEmail = async () => {
    try {
      await Haptics.selectionAsync();
      await Clipboard.setStringAsync(SUPPORT_EMAIL);
      Alert.alert('Copied', 'Support email copied to clipboard');
    } catch (error) {
      console.error('Failed to copy support email:', error);
      Alert.alert('Error', 'Failed to copy support email');
    }
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete Account',
      'This removes your wallet keys and transaction history from this device. Make sure your recovery phrase is backed up first.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await resetWallet();
              router.replace('/');
            } catch (error) {
              console.error('Failed to delete account:', error);
              Alert.alert('Error', 'Unable to delete wallet data right now');
            }
          },
        },
      ]
    );
  };

  const handleBiometricToggle = async (value: boolean) => {
    try {
      await Haptics.selectionAsync();

      if (value) {
        await enableBiometric();
        Alert.alert('Success', 'Biometric authentication enabled');
      } else {
        await disableBiometric();
        Alert.alert('Success', 'Biometric authentication disabled');
      }
    } catch (error) {
      Alert.alert('Error', (error as Error).message);
    }
  };

  const handleRequireAuthToggle = async (value: boolean) => {
    try {
      await Haptics.selectionAsync();
      await setRequireAuthForTransactions(value);
    } catch {
      Alert.alert('Error', 'Failed to update setting');
    }
  };

  const handleChangePin = () => {
    openPinPrompt('change');
  };

  const handleRemovePin = () => {
    Alert.alert(
      'Remove PIN',
      'Enter your current PIN on the next step to remove wallet protection.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Continue',
          style: 'destructive',
          onPress: () => openPinPrompt('remove'),
        },
      ]
    );
  };

  const submitPinPrompt = async () => {
    const trimmedPin = pinPromptValue.trim();

    if (!trimmedPin) {
      setPinPromptError('PIN is required');
      return;
    }

    try {
      if (pinPromptMode === 'change') {
        const isValid = await verifyPin(trimmedPin);

        if (!isValid) {
          setPinPromptError('Incorrect PIN');
          return;
        }

        closePinPrompt();
        setOldPinForChange(trimmedPin);
        setShowChangePinModal(true);
        return;
      }

      if (pinPromptMode === 'remove') {
        const success = await removePin(trimmedPin);

        if (!success) {
          setPinPromptError('Incorrect PIN');
          return;
        }

        closePinPrompt();
        Alert.alert('Success', 'PIN removed successfully');
      }
    } catch (error) {
      console.error('PIN action failed:', error);
      setPinPromptError('Something went wrong. Please try again.');
    }
  };

  const handleOpenPrivacyPolicy = () => {
    router.push('/privacy-policy');
  };

  const handleOpenSupport = async () => {
    const mailUrl = `mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent(SUPPORT_SUBJECT)}`;

    try {
      await Linking.openURL(mailUrl);
    } catch (error) {
      console.error('Failed to open mail client:', error);
      Alert.alert('Support', SUPPORT_EMAIL);
    }
  };

  if (isLoading && !address) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.light.primary} testID="settings-screen-loading-indicator" />
        </View>
      </SafeAreaView>
    );
  }

  if (!address) {
    return null;
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer} showsVerticalScrollIndicator={false}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Security</Text>
          <View style={styles.card}>
            <View style={styles.securityItem}>
              <View style={styles.securityItemLeft}>
                <Lock size={20} color={Colors.light.primary} />
                <Text style={styles.securityItemText}>PIN Protection</Text>
              </View>
              <Text style={styles.securityItemValue}>{isPinSet ? 'Enabled' : 'Disabled'}</Text>
            </View>

            {isPinSet ? (
              <>
                <TouchableOpacity style={styles.securityAction} onPress={handleChangePin} testID="change-pin-button">
                  <Text style={styles.securityActionText}>Change PIN</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.securityAction} onPress={handleRemovePin} testID="remove-pin-button">
                  <Text style={[styles.securityActionText, styles.dangerText]}>Remove PIN</Text>
                </TouchableOpacity>
              </>
            ) : null}

            {isBiometricAvailable && isPinSet ? (
              <View style={styles.securityItem}>
                <View style={styles.securityItemLeft}>
                  <Fingerprint size={20} color={Colors.light.primary} />
                  <Text style={styles.securityItemText}>Biometric Authentication</Text>
                </View>
                <Switch
                  value={isBiometricEnabled}
                  onValueChange={handleBiometricToggle}
                  trackColor={{ false: '#D1D5DB', true: Colors.light.primary }}
                  thumbColor="#fff"
                  testID="biometric-toggle"
                />
              </View>
            ) : null}

            <View style={styles.securityItemNoBorder}>
              <View style={styles.securityItemLeft}>
                <Shield size={20} color={Colors.light.primary} />
                <View>
                  <Text style={styles.securityItemText}>Require Auth for Transactions</Text>
                  <Text style={styles.securityItemSubtext}>Ask for PIN before sending</Text>
                </View>
              </View>
              <Switch
                value={requireAuthForTransactions}
                onValueChange={handleRequireAuthToggle}
                trackColor={{ false: '#D1D5DB', true: Colors.light.primary }}
                thumbColor="#fff"
                testID="transaction-auth-toggle"
              />
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Network Configuration</Text>
          <View style={styles.card}>
            <View style={styles.networkSelector}>
              <TouchableOpacity
                style={[styles.networkButton, currentNetwork === 'nile' ? styles.networkButtonActive : null]}
                onPress={() => handleNetworkChange('nile')}
                testID="network-nile-button"
              >
                <Network size={20} color={currentNetwork === 'nile' ? 'white' : Colors.light.primary} />
                <Text style={[styles.networkButtonText, currentNetwork === 'nile' ? styles.networkButtonTextActive : null]}>Nile Testnet</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.networkButton, currentNetwork === 'mainnet' ? styles.networkButtonActive : null]}
                onPress={() => handleNetworkChange('mainnet')}
                testID="network-mainnet-button"
              >
                <Network size={20} color={currentNetwork === 'mainnet' ? 'white' : Colors.light.primary} />
                <Text style={[styles.networkButtonText, currentNetwork === 'mainnet' ? styles.networkButtonTextActive : null]}>Mainnet</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.warningBox}>
              <Text style={styles.warningText}>
                {currentNetwork === 'mainnet'
                  ? 'You are on Mainnet. Transactions use real funds.'
                  : 'You are on Nile Testnet. This is the recommended network for demo access.'}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Wallet Address</Text>
          <View style={styles.card}>
            <Text style={styles.addressText}>{address}</Text>
          </View>
        </View>

        {mnemonic ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Recovery Phrase</Text>
            <View style={styles.card}>
              <View style={styles.secretHeader}>
                <Text style={styles.secretLabel}>12-word recovery phrase</Text>
                <TouchableOpacity onPress={handleMnemonicVisibility} testID="toggle-mnemonic-button">
                  {showMnemonic ? (
                    <EyeOff size={20} color={Colors.light.muted} />
                  ) : (
                    <Eye size={20} color={Colors.light.muted} />
                  )}
                </TouchableOpacity>
              </View>
              {showMnemonic ? <Text style={styles.secretText}>{mnemonic}</Text> : <Text style={styles.secretHidden}>••••••••••••••••••••••••••</Text>}
              <View style={styles.warningBox}>
                <Text style={styles.warningTextSmall}>Never share your recovery phrase. Anyone with it can control your wallet.</Text>
              </View>
            </View>
          </View>
        ) : null}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Private Key</Text>
          <View style={styles.card}>
            <View style={styles.secretHeader}>
              <Text style={styles.secretLabel}>64-character hex string</Text>
              <View style={styles.secretActions}>
                <TouchableOpacity onPress={copyPrivateKey} style={styles.iconButton} disabled={!showPrivateKey} testID="copy-private-key-button">
                  <Copy size={20} color={showPrivateKey ? Colors.light.primary : Colors.light.muted} />
                </TouchableOpacity>
                <TouchableOpacity onPress={handlePrivateKeyVisibility} testID="toggle-private-key-button">
                  {showPrivateKey ? (
                    <EyeOff size={20} color={Colors.light.muted} />
                  ) : (
                    <Eye size={20} color={Colors.light.muted} />
                  )}
                </TouchableOpacity>
              </View>
            </View>
            {showPrivateKey ? <Text style={styles.secretText}>{privateKey}</Text> : <Text style={styles.secretHidden}>••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••</Text>}
            <View style={styles.warningBox}>
              <Text style={styles.warningTextSmall}>Never share your private key. Anyone with it can control your wallet.</Text>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Compliance & Support</Text>
          <View style={styles.card}>
            <TouchableOpacity style={styles.infoRow} onPress={handleOpenPrivacyPolicy} testID="privacy-policy-button">
              <View style={styles.infoRowLeft}>
                <FileText size={18} color={Colors.light.primary} />
                <Text style={styles.infoRowLabel}>{PRIVACY_POLICY_TITLE}</Text>
              </View>
              <Text style={styles.infoRowValue}>Open</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.infoRow} onPress={handleOpenSupport} testID="contact-support-button">
              <View style={styles.infoRowLeft}>
                <Mail size={18} color={Colors.light.primary} />
                <Text style={styles.infoRowLabel}>Contact Support</Text>
              </View>
              <Text style={styles.infoRowValue}>Email</Text>
            </TouchableOpacity>

            <View style={styles.supportCard}>
              <Text style={styles.supportLabel}>Support Contact</Text>
              <Text style={styles.supportValue}>{SUPPORT_EMAIL}</Text>
              <TouchableOpacity style={styles.supportCopyButton} onPress={copySupportEmail} testID="copy-support-email-button">
                <Copy size={16} color={Colors.light.primary} />
                <Text style={styles.supportCopyText}>Copy email</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account & Data</Text>
          <View style={styles.card}>
            <Text style={styles.accountText}>Delete Account removes wallet data from this device. It does not reverse on-chain transactions.</Text>
            <TouchableOpacity style={styles.dangerButton} onPress={handleDeleteAccount} testID="delete-account-button">
              <Trash2 size={20} color="white" />
              <Text style={styles.dangerButtonText}>Delete Account</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.infoSection}>
          <Text style={styles.infoTitle}>About This Wallet</Text>
          <Text style={styles.infoText}>
            {APP_COMPANY_NAME} Wallet is a self-custody wallet for TRON USDT and TRX. Private keys stay on this device unless you export them.
          </Text>
          <Text style={styles.infoText}>
            Balances, prices, and transaction history come from blockchain APIs and may be delayed. Demo access is available on Nile Testnet from the welcome screen.
          </Text>
        </View>
      </ScrollView>

      <Modal visible={pinPromptMode !== null} animationType="fade" transparent onRequestClose={closePinPrompt}>
        <View style={styles.overlay}>
          <View style={styles.promptCard}>
            <Text style={styles.promptTitle}>{pinPromptMode === 'change' ? 'Verify Current PIN' : 'Confirm PIN Removal'}</Text>
            <Text style={styles.promptSubtitle}>
              {pinPromptMode === 'change' ? 'Enter your current PIN to continue.' : 'Enter your current PIN to remove wallet protection.'}
            </Text>
            <TextInput
              style={[styles.promptInput, pinPromptError ? styles.promptInputError : null]}
              value={pinPromptValue}
              onChangeText={(value) => {
                setPinPromptValue(value);
                if (pinPromptError) {
                  setPinPromptError('');
                }
              }}
              placeholder="Enter PIN"
              placeholderTextColor={Colors.light.muted}
              secureTextEntry
              keyboardType={Platform.OS === 'ios' ? 'number-pad' : 'numeric'}
              maxLength={6}
              testID="pin-prompt-input"
            />
            {pinPromptError ? <Text style={styles.promptError}>{pinPromptError}</Text> : null}
            <View style={styles.promptActions}>
              <TouchableOpacity style={styles.promptSecondaryButton} onPress={closePinPrompt} testID="pin-prompt-cancel-button">
                <Text style={styles.promptSecondaryButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.promptPrimaryButton} onPress={submitPinPrompt} testID="pin-prompt-submit-button">
                <Text style={styles.promptPrimaryButtonText}>Continue</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal visible={secretAction !== null} animationType="slide" onRequestClose={closeSecretAuth}>
        <View style={styles.modalContainer}>
          <PinVerification
            title="Confirm Sensitive Action"
            subtitle="Re-enter your PIN or use biometrics to view or copy wallet secrets"
            onVerifyPin={async (pin) => {
              const result = await verifyPin(pin);
              return result;
            }}
            onBiometric={isBiometricEnabled ? async () => {
              const result = await authenticate();
              return result;
            } : undefined}
            showBiometric={isBiometricEnabled}
            onSuccess={async () => {
              if (!secretAction) {
                return;
              }

              const nextAction = secretAction;
              closeSecretAuth();
              await performSecretAction(nextAction);
            }}
          />
          <TouchableOpacity
            style={styles.modalCancelButton}
            onPress={closeSecretAuth}
            testID="secret-auth-cancel-button"
          >
            <Text style={styles.modalCancelText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </Modal>

      <Modal visible={showChangePinModal} animationType="slide" onRequestClose={() => setShowChangePinModal(false)}>
        <View style={styles.modalContainer}>
          <PinSetup
            title="Change PIN"
            subtitle="Enter your new 6-digit PIN"
            isChangingPin={true}
            oldPin={oldPinForChange}
            onComplete={async (newPin) => {
              const success = await changePin(oldPinForChange, newPin);

              if (success) {
                setShowChangePinModal(false);
                setOldPinForChange('');
                Alert.alert('Success', 'PIN changed successfully');
              } else {
                Alert.alert('Error', 'Failed to change PIN');
              }
            }}
          />
          <TouchableOpacity
            style={styles.modalCancelButton}
            onPress={() => {
              setShowChangePinModal(false);
              setOldPinForChange('');
            }}
            testID="change-pin-cancel-button"
          >
            <Text style={styles.modalCancelText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </Modal>
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
  contentContainer: {
    paddingBottom: 24,
  },
  section: {
    paddingHorizontal: 14,
    paddingVertical: 6,
  },
  sectionTitle: {
    ...Typography.smallRegular,
    color: Colors.light.muted,
    marginBottom: 6,
    textTransform: 'uppercase' as const,
    letterSpacing: 0.5,
    fontSize: 11,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  networkSelector: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 8,
  },
  networkButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: Colors.light.primary,
    backgroundColor: 'white',
  },
  networkButtonActive: {
    backgroundColor: Colors.light.primary,
  },
  networkButtonText: {
    ...Typography.bodySemibold,
    color: Colors.light.primary,
  },
  networkButtonTextActive: {
    color: 'white',
  },
  warningBox: {
    backgroundColor: '#FFF3CD',
    borderRadius: 6,
    padding: 8,
    marginTop: 6,
  },
  warningText: {
    ...Typography.captionRegular,
    color: '#856404',
  },
  warningTextSmall: {
    ...Typography.xsRegular,
    color: '#856404',
    lineHeight: 16,
  },
  addressText: {
    ...Typography.mono,
    color: Colors.light.text,
  },
  secretHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  secretLabel: {
    ...Typography.smallRegular,
    color: Colors.light.muted,
  },
  secretText: {
    ...Typography.mono,
    color: Colors.light.text,
    marginBottom: 8,
  },
  secretHidden: {
    ...Typography.bodyRegular,
    color: Colors.light.muted,
    marginBottom: 8,
  },
  secretActions: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
  },
  iconButton: {
    padding: 0,
  },
  securityItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  securityItemNoBorder: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  securityItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  securityItemText: {
    ...Typography.bodyRegular,
    color: Colors.light.text,
    fontSize: 13,
  },
  securityItemSubtext: {
    ...Typography.smallRegular,
    color: Colors.light.muted,
    marginTop: 2,
  },
  securityItemValue: {
    ...Typography.bodyRegular,
    color: Colors.light.muted,
  },
  securityAction: {
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  securityActionText: {
    ...Typography.bodyRegular,
    color: Colors.light.primary,
    fontSize: 13,
  },
  dangerText: {
    color: '#DC3545',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  infoRowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  infoRowLabel: {
    ...Typography.bodyRegular,
    color: Colors.light.text,
  },
  infoRowValue: {
    ...Typography.smallRegular,
    color: Colors.light.muted,
  },
  supportCard: {
    marginTop: 12,
    borderRadius: 10,
    backgroundColor: '#F8FAFC',
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  supportLabel: {
    ...Typography.smallRegular,
    color: Colors.light.muted,
    marginBottom: 4,
  },
  supportValue: {
    ...Typography.bodySemibold,
    color: Colors.light.text,
    marginBottom: 10,
  },
  supportCopyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    alignSelf: 'flex-start',
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 999,
    backgroundColor: '#E8F0FE',
  },
  supportCopyText: {
    ...Typography.captionSemibold,
    color: Colors.light.primary,
  },
  accountText: {
    ...Typography.captionRegular,
    color: Colors.light.muted,
    lineHeight: 18,
    marginBottom: 12,
  },
  dangerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#DC3545',
    paddingVertical: 12,
    borderRadius: 8,
  },
  dangerButtonText: {
    ...Typography.buttonText,
    color: 'white',
  },
  infoSection: {
    paddingHorizontal: 14,
    paddingTop: 4,
    paddingBottom: 16,
  },
  infoTitle: {
    ...Typography.smallRegular,
    color: Colors.light.muted,
    marginBottom: 6,
    textTransform: 'uppercase' as const,
    letterSpacing: 0.5,
    fontSize: 11,
  },
  infoText: {
    ...Typography.captionRegular,
    color: Colors.light.muted,
    lineHeight: 18,
    marginBottom: 8,
    fontSize: 12,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.45)',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  promptCard: {
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 20,
  },
  promptTitle: {
    ...Typography.subtitleSemibold,
    color: Colors.light.text,
    marginBottom: 8,
  },
  promptSubtitle: {
    ...Typography.bodyRegular,
    color: Colors.light.muted,
    lineHeight: 20,
    marginBottom: 16,
  },
  promptInput: {
    borderWidth: 1,
    borderColor: Colors.light.border,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    ...Typography.subtitleMedium,
    color: Colors.light.text,
    backgroundColor: '#F8FAFC',
  },
  promptInputError: {
    borderColor: '#DC3545',
  },
  promptError: {
    ...Typography.captionRegular,
    color: '#DC3545',
    marginTop: 8,
  },
  promptActions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 18,
  },
  promptSecondaryButton: {
    flex: 1,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
  },
  promptSecondaryButtonText: {
    ...Typography.bodySemibold,
    color: Colors.light.text,
  },
  promptPrimaryButton: {
    flex: 1,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    backgroundColor: Colors.light.primary,
  },
  promptPrimaryButtonText: {
    ...Typography.bodySemibold,
    color: 'white',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#fff',
  },
  modalCancelButton: {
    position: 'absolute',
    bottom: 40,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  modalCancelText: {
    ...Typography.buttonText,
    color: Colors.light.primary,
  },
});
