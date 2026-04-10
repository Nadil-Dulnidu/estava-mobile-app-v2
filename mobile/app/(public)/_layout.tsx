import { Ionicons } from '@expo/vector-icons';
import { Redirect, Tabs } from 'expo-router';
import { Platform } from 'react-native';
import { theme } from '@/src/theme';
import { useAppSession } from '@/src/context/AppSessionContext';

export default function PublicTabsLayout() {
  const { isLoaded, isSignedIn, role } = useAppSession();

  if (!isLoaded) return null;
  // Signed-in users should use (user) or (admin) layouts
  if (isSignedIn && role === 'admin') return <Redirect href='/(admin)' />;
  if (isSignedIn) return <Redirect href='/(user)' />;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.textMuted,
        tabBarLabelStyle: {
          fontFamily: 'Poppins-Medium',
          fontSize: 11,
          marginTop: -2,
        },
        tabBarStyle: {
          backgroundColor: theme.colors.surface,
          borderTopColor: theme.colors.border,
          height: Platform.OS === 'ios' ? 88 : 68,
          paddingTop: 8,
          paddingBottom: Platform.OS === 'ios' ? 28 : 8,
          ...theme.shadow.card,
        },
      }}>
      <Tabs.Screen
        name='index'
        options={{
          title: 'Home',
          tabBarIcon: ({ color, focused, size }) => (
            <Ionicons name={focused ? 'home' : 'home-outline'} size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name='listings'
        options={{
          title: 'Explore',
          tabBarIcon: ({ color, focused, size }) => (
            <Ionicons name={focused ? 'search' : 'search-outline'} size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name='signin'
        options={{
          title: 'Sign In',
          tabBarIcon: ({ color, focused, size }) => (
            <Ionicons name={focused ? 'log-in' : 'log-in-outline'} size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
