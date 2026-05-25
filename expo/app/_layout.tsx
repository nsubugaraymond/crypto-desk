import "@/utils/polyfills";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import React, { useEffect } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { View, Text, StyleSheet } from "react-native";

import { trpc, trpcClient } from "@/lib/trpc";
import { SecurityContext } from "@/contexts/SecurityContext";
import { UserTrackingProvider } from "@/contexts/UserTrackingContext";
import AuthGate from "@/components/AuthGate";
import { ToastProvider, ToastOverlay } from "@/contexts/ToastContext";
import { useToastBridge } from "@/hooks/useToastBridge";

// Prevent the splash screen from auto-hiding before asset loading is complete.
void SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 5000,
    },
  },
});

class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error: Error | null }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: any) {
    console.error('❌ Error Boundary caught error:', error);
    console.error('Error info:', errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <View style={errorStyles.container}>
          <Text style={errorStyles.title}>⚠️ Something went wrong</Text>
          <Text style={errorStyles.message}>
            {this.state.error?.message || 'Unknown error'}
          </Text>
          <Text style={errorStyles.hint}>
            Please check the console for more details.
          </Text>
        </View>
      );
    }

    return this.props.children;
  }
}

const errorStyles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  message: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 8,
  },
  hint: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
  },
});

function ToastBridge({ children }: { children: React.ReactNode }) {
  useToastBridge();
  return <>{children}</>;
}

function RootLayoutNav() {
  return (
    <Stack screenOptions={{ headerShown: false, headerBackTitle: "Back" }}>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
    </Stack>
  );
}

export default function RootLayout() {
  const [appReady, setAppReady] = React.useState(false);

  useEffect(() => {
    const initApp = async () => {
      try {
        console.log('🚀 App starting...');
        console.log('✅ Polyfills loaded');
        console.log('✅ Buffer available:', typeof (global as any).Buffer !== 'undefined');
        await SplashScreen.hideAsync();
        console.log('✅ Splash screen hidden');
        setAppReady(true);
      } catch (error) {
        console.error('❌ Error initializing app:', error);
        setAppReady(true);
      }
    };
    void initApp();
  }, []);

  if (!appReady) {
    return null;
  }

  return (
    <ErrorBoundary>
      <trpc.Provider client={trpcClient} queryClient={queryClient}>
        <QueryClientProvider client={queryClient}>
          <UserTrackingProvider>
            <SecurityContext>
              <GestureHandlerRootView style={{ flex: 1 }}>
                <ToastProvider>
                  <AuthGate>
                    <ToastBridge>
                      <RootLayoutNav />
                      <ToastOverlay />
                    </ToastBridge>
                  </AuthGate>
                </ToastProvider>
              </GestureHandlerRootView>
            </SecurityContext>
          </UserTrackingProvider>
        </QueryClientProvider>
      </trpc.Provider>
    </ErrorBoundary>
  );
}
