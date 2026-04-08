import { useAuth } from '@clerk/expo';
import { Ionicons } from '@expo/vector-icons';
import { Redirect, Tabs } from 'expo-router';
import { theme } from '@/src/theme';

export default function TabsLayout() {
  const { isLoaded, isSignedIn } = useAuth();

  if (!isLoaded) return null;
  if (!isSignedIn) return <Redirect href='/(auth)/sign-in' />;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.textMuted,
        tabBarStyle: {
          backgroundColor: theme.colors.surface,
          borderTopColor: theme.colors.border,
          height: 64,
          paddingTop: 6,
        },
      }}>
      <Tabs.Screen
        name='index'
        options={{
          title: 'Home',
          tabBarIcon: ({ color, size }) => <Ionicons name='home-outline' size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name='listings'
        options={{
          title: 'Listings',
          tabBarIcon: ({ color, size }) => <Ionicons name='search-outline' size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name='favorites'
        options={{
          title: 'Favorites',
          tabBarIcon: ({ color, size }) => <Ionicons name='heart-outline' size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name='my-properties'
        options={{
          title: 'My Properties',
          tabBarIcon: ({ color, size }) => <Ionicons name='business-outline' size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name='profile'
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, size }) => <Ionicons name='person-outline' size={size} color={color} />,
        }}
      />
    </Tabs>
  );
}
