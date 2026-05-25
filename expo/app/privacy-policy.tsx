import React from 'react';
import { Alert, Linking, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ArrowLeft, Mail, Shield } from 'lucide-react-native';
import * as Clipboard from 'expo-clipboard';
import * as Haptics from 'expo-haptics';

import Colors from '@/constants/colors';
import Typography from '@/constants/typography';
import { APP_COMPANY_NAME, PRIVACY_POLICY_TITLE, SUPPORT_EMAIL, SUPPORT_SUBJECT } from '@/constants/compliance';

const sections = [
  {
    title: 'What this app stores',
    body: 'Your wallet address, private key, and optional recovery phrase are stored on your device so the wallet can function. They are not sent to a central account system by default.',
  },
  {
    title: 'Blockchain and price data',
    body: 'Balances, transaction history, fee estimates, and price information are fetched from third-party blockchain and pricing services. Those services may receive your wallet address and device network information when requests are made.',
  },
  {
    title: 'Notifications and analytics',
    body: 'The app may request notification permission so it can alert you about wallet activity. The app does not promise real-time delivery and data shown in the app can be delayed.',
  },
  {
    title: 'Your choices',
    body: 'You can delete local wallet data at any time from Settings. You should back up your recovery phrase before deleting the wallet from your device.',
  },
] as const;

export default function PrivacyPolicyScreen() {
  const router = useRouter();

  const handleEmailSupport = async () => {
    const mailUrl = `mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent(SUPPORT_SUBJECT)}`;

    try {
      await Linking.openURL(mailUrl);
    } catch (error) {
      console.error('Failed to open support email:', error);
      Alert.alert('Support', SUPPORT_EMAIL);
    }
  };

  const handleCopyEmail = async () => {
    try {
      await Haptics.selectionAsync();
      await Clipboard.setStringAsync(SUPPORT_EMAIL);
      Alert.alert('Copied', 'Support email copied to clipboard');
    } catch (error) {
      console.error('Failed to copy support email:', error);
      Alert.alert('Error', 'Unable to copy support email');
    }
  };

  return (
    <View style={styles.screen}>
      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()} testID="privacy-policy-back-button">
            <ArrowLeft size={18} color={Colors.light.text} />
          </TouchableOpacity>
          <View style={styles.headerCopy}>
            <Text style={styles.eyebrow}>{APP_COMPANY_NAME}</Text>
            <Text style={styles.title}>{PRIVACY_POLICY_TITLE}</Text>
          </View>
        </View>

        <ScrollView contentContainerStyle={styles.contentContainer} showsVerticalScrollIndicator={false} testID="privacy-policy-screen">
          <View style={styles.heroCard}>
            <View style={styles.heroIconWrap}>
              <Shield size={18} color={Colors.light.primary} />
            </View>
            <Text style={styles.heroTitle}>Clear and factual privacy details</Text>
            <Text style={styles.heroText}>
              This wallet stores signing credentials on your device and uses network services to fetch balances, history, and fee information.
            </Text>
          </View>

          {sections.map((section) => (
            <View key={section.title} style={styles.sectionCard}>
              <Text style={styles.sectionTitle}>{section.title}</Text>
              <Text style={styles.sectionBody}>{section.body}</Text>
            </View>
          ))}

          <View style={styles.contactCard}>
            <View style={styles.contactHeader}>
              <Mail size={18} color={Colors.light.primary} />
              <Text style={styles.contactTitle}>Support Contact</Text>
            </View>
            <Text style={styles.contactValue}>{SUPPORT_EMAIL}</Text>
            <View style={styles.contactActions}>
              <TouchableOpacity style={styles.secondaryButton} onPress={handleCopyEmail} testID="privacy-policy-copy-email-button">
                <Text style={styles.secondaryButtonText}>Copy email</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.primaryButton} onPress={handleEmailSupport} testID="privacy-policy-email-button">
                <Text style={styles.primaryButtonText}>Email support</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#EEF3FA',
  },
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingTop: 10,
    paddingBottom: 12,
  },
  backButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.86)',
    marginRight: 12,
  },
  headerCopy: {
    flex: 1,
  },
  eyebrow: {
    ...Typography.smallSemibold,
    color: Colors.light.muted,
    textTransform: 'uppercase' as const,
    letterSpacing: 0.6,
  },
  title: {
    ...Typography.titleSemibold,
    color: Colors.light.text,
  },
  contentContainer: {
    paddingHorizontal: 18,
    paddingBottom: 28,
    gap: 14,
  },
  heroCard: {
    backgroundColor: '#101828',
    borderRadius: 24,
    padding: 20,
  },
  heroIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.12)',
    marginBottom: 14,
  },
  heroTitle: {
    ...Typography.subtitleSemibold,
    color: 'white',
    marginBottom: 8,
  },
  heroText: {
    ...Typography.bodyRegular,
    color: '#D0D5DD',
    lineHeight: 22,
  },
  sectionCard: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 18,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.04,
    shadowRadius: 18,
    elevation: 2,
  },
  sectionTitle: {
    ...Typography.bodySemibold,
    color: Colors.light.text,
    marginBottom: 8,
  },
  sectionBody: {
    ...Typography.bodyRegular,
    color: Colors.light.muted,
    lineHeight: 22,
  },
  contactCard: {
    backgroundColor: '#EAF2FF',
    borderRadius: 22,
    padding: 18,
    borderWidth: 1,
    borderColor: '#D0E0FF',
  },
  contactHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 8,
  },
  contactTitle: {
    ...Typography.bodySemibold,
    color: Colors.light.text,
  },
  contactValue: {
    ...Typography.subtitleMedium,
    color: Colors.light.text,
    marginBottom: 14,
  },
  contactActions: {
    flexDirection: 'row',
    gap: 10,
  },
  secondaryButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 14,
    paddingVertical: 12,
    backgroundColor: 'white',
  },
  secondaryButtonText: {
    ...Typography.bodySemibold,
    color: Colors.light.text,
  },
  primaryButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 14,
    paddingVertical: 12,
    backgroundColor: Colors.light.primary,
  },
  primaryButtonText: {
    ...Typography.bodySemibold,
    color: 'white',
  },
});
