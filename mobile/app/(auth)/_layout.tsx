import { useAuth } from '@clerk/expo';
import { Redirect, Stack } from 'expo-router';

export default function AuthLayout() {
  const { isLoaded, isSignedIn } = useAuth();

  if (!isLoaded) return null;
  if (isSignedIn) return <Redirect href='/' />;

  return (
    <Stack>
      <Stack.Screen name='sign-in' options={{ title: 'Sign In' }} />
      <Stack.Screen name='sign-up' options={{ title: 'Create Account' }} />
    </Stack>
  );
}
