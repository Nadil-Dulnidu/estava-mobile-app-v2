import { Ionicons } from '@expo/vector-icons';
import { Redirect, Tabs } from 'expo-router';
import { theme } from '@/src/theme';
import { useAppSession } from '@/src/context/AppSessionContext';
import { useNotifications } from '@/src/context/NotificationContext';

export default function AdminTabsLayout() {
  const { isLoaded, isSignedIn, role } = useAppSession();
  const { unreadCount } = useNotifications();

  if (!isLoaded) return null;
  if (!isSignedIn) return <Redirect href='/(auth)/sign-in' />;
  if (role !== 'admin') return <Redirect href='/' />;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.textMuted,
      }}>
      <Tabs.Screen
        name='index'
        options={{
          title: 'Dashboard',
          tabBarIcon: ({ color, size }) => <Ionicons name='grid-outline' size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name='moderation'
        options={{
          title: 'Moderation',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name='shield-checkmark-outline' size={size} color={color} />
          ),
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
        name='notifications'
        options={{
          title: 'Alerts',
          tabBarBadge: unreadCount > 0 ? unreadCount : undefined,
          tabBarIcon: ({ color, size }) => (
            <Ionicons name='notifications-outline' size={size} color={color} />
          ),
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
