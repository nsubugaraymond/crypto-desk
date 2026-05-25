import { Tabs } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React from 'react';
import { View, StyleSheet } from 'react-native';

import FloatingTabBar from '@/components/FloatingTabBar';

export default function TabLayout() {
  return (
    <View style={styles.container}>
      <StatusBar style="dark" translucent backgroundColor="transparent" />
      <Tabs
        screenOptions={{
          headerShown: false,
          headerShadowVisible: false,
          headerTitleAlign: 'center',
          tabBarHideOnKeyboard: true,
          tabBarShowLabel: false,
          tabBarStyle: {
            position: 'absolute',
            backgroundColor: 'transparent',
            borderTopWidth: 0,
            elevation: 0,
          },
          tabBarItemStyle: {
            alignItems: 'center',
            justifyContent: 'center',
          },
          tabBarIconStyle: {
            marginBottom: 0,
          },
        }}
        tabBar={(props) => <FloatingTabBar {...props} />}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: 'Wallet',
            tabBarAccessibilityLabel: 'Wallet tab',
            tabBarButtonTestID: 'tab-wallet',
          }}
        />
        <Tabs.Screen
          name="wallet"
          options={{
            href: null,
          }}
        />
        <Tabs.Screen
          name="send"
          options={{
            title: 'Send',
            tabBarAccessibilityLabel: 'Send tab',
            tabBarButtonTestID: 'tab-send',
            tabBarItemStyle: {
              alignItems: 'center',
              justifyContent: 'center',
            },
          }}
        />
        <Tabs.Screen
          name="receive"
          options={{
            title: 'Receive',
            tabBarAccessibilityLabel: 'Receive tab',
            tabBarButtonTestID: 'tab-receive',
          }}
        />
        <Tabs.Screen
          name="history"
          options={{
            title: 'History',
            tabBarAccessibilityLabel: 'History tab',
            tabBarButtonTestID: 'tab-history',
          }}
        />
        <Tabs.Screen
          name="settings"
          options={{
            title: 'Settings',
            tabBarAccessibilityLabel: 'Settings tab',
            tabBarButtonTestID: 'tab-settings',
          }}
        />
      </Tabs>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F4F6FA',
  },
});
