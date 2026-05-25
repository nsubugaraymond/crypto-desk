import React, { useState } from 'react';
import { StyleSheet, Text, View, TextInput, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import Colors from '@/constants/colors';
import Typography from '@/constants/typography';
import { useWalletStore } from '@/hooks/useWalletStore';
import { setNetwork } from '@/services/tronService';

export default function WalletSetup() {
  const [importInput, setImportInput] = useState('');
  const [importMode, setImportMode] = useState(false);
  const [importType, setImportType] = useState<'mnemonic' | 'privateKey'>('mnemonic');
  const { createWallet, importWalletFromMnemonic, importWalletFromPrivateKey, isLoading } = useWalletStore();

  const handleCreateWallet = async () => {
    try {
      await createWallet();
      Alert.alert(
        'Wallet Created',
        'Your new wallet has been created successfully! Please backup your recovery phrase securely.',
        [{ text: 'OK' }]
      );
    } catch (error) {
      Alert.alert('Error', (error as Error).message);
    }
  };

  const handleImportWallet = async () => {
    if (!importInput.trim()) {
      Alert.alert('Error', 'Please enter a recovery phrase or private key');
      return;
    }

    try {
      if (importType === 'mnemonic') {
        await importWalletFromMnemonic(importInput.trim());
      } else {
        await importWalletFromPrivateKey(importInput.trim());
      }
      Alert.alert(
        'Wallet Imported',
        'Your wallet has been imported successfully!',
        [{ text: 'OK' }]
      );
    } catch (error) {
      Alert.alert('Error', (error as Error).message);
    }
  };

  const handleDemoWallet = async () => {
    try {
      await setNetwork('nile');
      await createWallet();
      Alert.alert(
        'Demo Wallet Ready',
        'A demo wallet has been created on Nile Testnet. You can explore the app without using real funds.',
        [{ text: 'OK' }]
      );
    } catch (error) {
      Alert.alert('Error', (error as Error).message);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.title}>Welcome to USDT Wallet</Text>
        <Text style={styles.subtitle}>Self-custody TRON wallet for mainnet and Nile testnet</Text>
        
        {importMode ? (
          <>
            <View style={styles.importTypeSelector}>
              <TouchableOpacity
                style={[
                  styles.importTypeButton,
                  importType === 'mnemonic' ? styles.importTypeButtonActive : null
                ]}
                onPress={() => setImportType('mnemonic')}
              >
                <Text style={[
                  styles.importTypeText,
                  importType === 'mnemonic' ? styles.importTypeTextActive : null
                ]}>Recovery Phrase</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.importTypeButton,
                  importType === 'privateKey' ? styles.importTypeButtonActive : null
                ]}
                onPress={() => setImportType('privateKey')}
              >
                <Text style={[
                  styles.importTypeText,
                  importType === 'privateKey' ? styles.importTypeTextActive : null
                ]}>Private Key</Text>
              </TouchableOpacity>
            </View>
            
            <Text style={styles.label}>
              {importType === 'mnemonic' ? 'Enter your 12-word recovery phrase' : 'Enter your private key'}
            </Text>
            <TextInput
              style={[styles.input, importType === 'mnemonic' ? styles.inputMultiline : null]}
              placeholder={importType === 'mnemonic' ? 'word1 word2 word3 ...' : '64-character hex string'}
              value={importInput}
              onChangeText={setImportInput}
              secureTextEntry={importType === 'privateKey'}
              autoCapitalize="none"
              autoCorrect={false}
              multiline={importType === 'mnemonic'}
              numberOfLines={importType === 'mnemonic' ? 3 : 1}
            />
            
            <TouchableOpacity
              style={[styles.button, styles.primaryButton]}
              onPress={handleImportWallet}
              disabled={isLoading || !importInput.trim()}
            >
              {isLoading ? (
                <ActivityIndicator size="small" color="white" />
              ) : (
                <Text style={styles.buttonText}>Import Wallet</Text>
              )}
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.switchButton}
              onPress={() => setImportMode(false)}
              disabled={isLoading}
            >
              <Text style={styles.switchButtonText}>Create a new wallet instead</Text>
            </TouchableOpacity>
          </>
        ) : (
          <>
            <View style={styles.infoBox}>
              <Text style={styles.infoText}>
                Create a new decentralized wallet to store and manage your USDT on the TRON network.
              </Text>
              <Text style={styles.infoTextSmall}>
                • Your keys are stored securely on your device{'\n'}
                • No custodial control - you own your funds{'\n'}
                • Backup your recovery phrase after creation
              </Text>
            </View>
            
            <TouchableOpacity
              style={[styles.button, styles.primaryButton]}
              onPress={handleCreateWallet}
              disabled={isLoading}
              testID="create-wallet-button"
            >
              {isLoading ? (
                <ActivityIndicator size="small" color="white" />
              ) : (
                <Text style={styles.buttonText}>Create New Wallet</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.button, styles.secondaryButton]}
              onPress={handleDemoWallet}
              disabled={isLoading}
              testID="demo-wallet-button"
            >
              <Text style={styles.secondaryButtonText}>Continue with Demo Wallet</Text>
            </TouchableOpacity>

            <Text style={styles.demoText}>Demo Wallet uses Nile Testnet so reviewers can explore the app without real funds.</Text>
            
            <TouchableOpacity
              style={styles.switchButton}
              onPress={() => setImportMode(true)}
              disabled={isLoading}
              testID="import-wallet-link"
            >
              <Text style={styles.switchButtonText}>Import existing wallet</Text>
            </TouchableOpacity>
          </>
        )}
      </View>
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
    justifyContent: 'center',
    padding: 16,
    backgroundColor: '#F4F6FA',
  },
  card: {
    backgroundColor: Colors.light.card,
    borderRadius: 16,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 2,
  },
  title: {
    ...Typography.headingBold,
    color: Colors.light.text,
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    ...Typography.subtitleMedium,
    color: Colors.light.muted,
    marginBottom: 24,
    textAlign: 'center',
  },
  importTypeSelector: {
    flexDirection: 'row',
    marginBottom: 20,
    backgroundColor: '#F0F4F9',
    borderRadius: 8,
    padding: 4,
  },
  importTypeButton: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 6,
  },
  importTypeButtonActive: {
    backgroundColor: Colors.light.primary,
  },
  importTypeText: {
    ...Typography.captionSemibold,
    color: Colors.light.muted,
  },
  importTypeTextActive: {
    color: 'white',
  },
  label: {
    ...Typography.bodyMedium,
    marginBottom: 8,
    color: Colors.light.text,
  },
  input: {
    backgroundColor: '#F5F7FA',
    borderWidth: 1,
    borderColor: Colors.light.border,
    borderRadius: 8,
    padding: 12,
    ...Typography.subtitleMedium,
    marginBottom: 24,
  },
  inputMultiline: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  infoBox: {
    backgroundColor: '#F0F4F9',
    borderRadius: 8,
    padding: 16,
    marginBottom: 24,
    borderLeftWidth: 4,
    borderLeftColor: Colors.light.primary,
  },
  infoText: {
    ...Typography.bodyRegular,
    color: Colors.light.text,
    marginBottom: 12,
  },
  infoTextSmall: {
    ...Typography.smallRegular,
    color: Colors.light.muted,
    lineHeight: 18,
  },
  button: {
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  primaryButton: {
    backgroundColor: Colors.light.primary,
  },
  secondaryButton: {
    backgroundColor: '#E8F0FE',
    borderWidth: 1,
    borderColor: '#C9DBFF',
  },
  buttonText: {
    ...Typography.buttonText,
    color: 'white',
  },
  secondaryButtonText: {
    ...Typography.buttonText,
    color: Colors.light.primary,
  },
  demoText: {
    ...Typography.smallRegular,
    color: Colors.light.muted,
    textAlign: 'center',
    marginTop: -6,
    marginBottom: 16,
    lineHeight: 18,
  },
  switchButton: {
    alignItems: 'center',
  },
  switchButtonText: {
    ...Typography.bodyRegular,
    color: Colors.light.primary,
  },
});
