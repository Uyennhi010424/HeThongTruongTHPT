import { useEffect, useRef } from 'react';
import { Slot, useRouter, useSegments } from 'expo-router';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useAuthStore } from '../store/useAuthStore';
import * as SplashScreen from 'expo-splash-screen';
import { View, Text } from 'react-native';

SplashScreen.preventAutoHideAsync().catch(() => {});

export default function RootLayout() {
  const { isLoading, userToken, userData, restoreToken } = useAuthStore();
  const segments = useSegments();
  const router = useRouter();
  const splashHidden = useRef(false);

  useEffect(() => {
    restoreToken();
  }, []);

  useEffect(() => {
    if (isLoading) return;

    const rootSegment = (segments as string[])[0];
    const inAuthGroup = rootSegment === '(auth)';
    
    if (!userToken && !inAuthGroup) {
      router.replace('/(auth)/login' as any);
    } else if (userToken) {
      if (inAuthGroup || !rootSegment) {
        if (userData?.role === 'HOC_SINH') {
          router.replace('/(student)' as any);
        } else if (userData?.role === 'PHU_HUYNH') {
          router.replace('/(parent)' as any);
        }
      }
    }
    
    // Hide splash screen only once
    if (!splashHidden.current) {
      splashHidden.current = true;
      setTimeout(() => {
        SplashScreen.hideAsync().catch(() => {});
      }, 100);
    }
  }, [userToken, isLoading, segments, userData]);

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text>Đang tải...</Text>
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <Slot />
    </SafeAreaProvider>
  );
}
