import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { ClerkProvider } from '@clerk/expo';
import { tokenCache } from '@clerk/expo/token-cache';
import {
  Poppins_400Regular,
  Poppins_500Medium,
  Poppins_600SemiBold,
  Poppins_700Bold,
} from '@expo-google-fonts/poppins';
import { useFonts } from 'expo-font';
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
  const [fontsLoaded] = useFonts({
    'Poppins-Regular': Poppins_400Regular,
    'Poppins-Medium': Poppins_500Medium,
    'Poppins-SemiBold': Poppins_600SemiBold,
    'Poppins-Bold': Poppins_700Bold,
  });

  if (!fontsLoaded) return null;

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <ClerkProvider publishableKey={publishableKey!} tokenCache={tokenCache}>
        <AppSessionProvider>
          <NotificationProvider>
            <InAppNotificationBanner />
            <Stack>
              <Stack.Screen name='index' options={{ headerShown: false }} />
              <Stack.Screen name='(auth)' options={{ headerShown: false }} />
              <Stack.Screen name='(public)' options={{ headerShown: false }} />
              <Stack.Screen name='(user)' options={{ headerShown: false }} />
              <Stack.Screen name='(admin)' options={{ headerShown: false }} />
              <Stack.Screen
                name='edit-profile'
                options={{ headerShown: false }}
              />
              <Stack.Screen
                name='my-listings'
                options={{ headerShown: false }}
              />
              <Stack.Screen
                name='my-appointments'
                options={{ headerShown: false }}
              />
              <Stack.Screen
                name='my-inquiries'
                options={{ headerShown: false }}
              />
              <Stack.Screen
                name='properties/[id]'
                options={{ headerShown: false }}
              />
              <Stack.Screen
                name='properties/[id]/edit'
                options={{ headerShown: false }}
              />
              <Stack.Screen
                name='properties/add'
                options={{ headerShown: false }}
              />
            </Stack>
          </NotificationProvider>
        </AppSessionProvider>
        <StatusBar style='auto' />
      </ClerkProvider>
    </ThemeProvider>
  );
}
