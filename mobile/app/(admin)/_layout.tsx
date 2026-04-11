import { Ionicons } from '@expo/vector-icons';
import { Redirect, Tabs } from 'expo-router';
import { theme } from '@/src/theme';
import { useAppSession } from '@/src/context/AppSessionContext';

export default function AdminTabsLayout() {
  const { isLoaded, isSignedIn, role } = useAppSession();

  if (!isLoaded) return null;
  if (!isSignedIn) return <Redirect href='/(auth)/sign-in' />;
  if (role !== 'admin') return <Redirect href='/(user)' />;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.textMuted,
        tabBarStyle: {
          backgroundColor: theme.colors.surface,
          borderTopColor: theme.colors.border,
          height: 66,
          paddingTop: 8,
          paddingBottom: 6,
        },
      }}>
      <Tabs.Screen
        name='index'
        options={{
          title: 'Dashboard',
          tabBarIcon: ({ color, size }) => <Ionicons name='grid-outline' size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name='properties'
        options={{
          title: 'Properties',
          tabBarIcon: ({ color, size }) => <Ionicons name='business-outline' size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name='reviews'
        options={{
          title: 'Reviews',
          tabBarIcon: ({ color, size }) => <Ionicons name='chatbubbles-outline' size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name='analytics'
        options={{
          title: 'Analytics',
          tabBarIcon: ({ color, size }) => <Ionicons name='stats-chart-outline' size={size} color={color} />,
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
