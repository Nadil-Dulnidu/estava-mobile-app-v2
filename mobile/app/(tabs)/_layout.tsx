import { useAuth } from '@clerk/expo';
import { Redirect } from 'expo-router';

export default function TabsLayout() {
  const { isLoaded, isSignedIn } = useAuth();

  if (!isLoaded) return null;
  if (!isSignedIn) return <Redirect href='/(auth)/sign-in' />;

  // Legacy route group kept for backward links; redirect to the active app shell.
  return <Redirect href='/(user)' />;
}
