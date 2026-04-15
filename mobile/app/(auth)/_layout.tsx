import { useAuth } from '@clerk/expo';
import { Redirect, usePathname } from 'expo-router';

export default function AuthLayout() {
  const { isLoaded, isSignedIn } = useAuth();
  const pathname = usePathname();

  if (!isLoaded) return null;
  if (isSignedIn) return <Redirect href='/(user)' />;

  if (pathname === '/(auth)/sign-up') {
    return <Redirect href='/(public)/signup' />;
  }

  return <Redirect href='/(public)/signin' />;
}
