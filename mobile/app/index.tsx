import { Redirect } from 'expo-router';
import { useAppSession } from '@/src/context/AppSessionContext';

export default function IndexScreen() {
  const { isLoaded, role } = useAppSession();

  if (!isLoaded) return null;

  if (role === 'guest') return <Redirect href='/(public)' />;
  if (role === 'admin') return <Redirect href='/(admin)' />;

  return <Redirect href='/(user)' />;
}
