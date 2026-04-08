import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { ClerkProvider } from '@clerk/expo';
import { tokenCache } from '@clerk/expo/token-cache';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { InAppNotificationBanner } from '@/src/components/common/InAppNotificationBanner';
import { AppSessionProvider } from '@/src/context/AppSessionContext';
import { NotificationProvider } from '@/src/context/NotificationContext';

const publishableKey = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY;

if (!publishableKey) {
  throw new Error('Add your Clerk Publishable Key to .env');
}

export default function RootLayout() {
  const colorScheme = useColorScheme();

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <ClerkProvider publishableKey={publishableKey} tokenCache={tokenCache}>
        <AppSessionProvider>
          <NotificationProvider>
            <InAppNotificationBanner />
            <Stack>
              <Stack.Screen name='index' options={{ headerShown: false }} />
              <Stack.Screen name='(auth)' options={{ headerShown: false }} />
              <Stack.Screen name='(public)' options={{ headerShown: false }} />
              <Stack.Screen name='(user)' options={{ headerShown: false }} />
              <Stack.Screen name='(owner)' options={{ headerShown: false }} />
              <Stack.Screen name='(admin)' options={{ headerShown: false }} />
              <Stack.Screen name='properties/[id]' options={{ title: 'Property Details' }} />
              <Stack.Screen name='properties/[id]/edit' options={{ title: 'Edit Property' }} />
              <Stack.Screen name='properties/add' options={{ title: 'Add Property' }} />
            </Stack>
          </NotificationProvider>
        </AppSessionProvider>
        <StatusBar style='auto' />
      </ClerkProvider>
    </ThemeProvider>
  );
}
