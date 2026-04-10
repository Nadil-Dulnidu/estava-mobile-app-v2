import { Redirect } from 'expo-router';

export default function PublicSignInRoute() {
  return <Redirect href='/(auth)/sign-in' />;
}
