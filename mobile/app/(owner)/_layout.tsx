import { Ionicons } from '@expo/vector-icons';
import { Redirect, Tabs } from 'expo-router';
import { theme } from '@/src/theme';
import { useAppSession } from '@/src/context/AppSessionContext';
import { useNotifications } from '@/src/context/NotificationContext';

export default function OwnerTabsLayout() {
  const { isLoaded, isSignedIn, role } = useAppSession();
  const { unreadCount } = useNotifications();

  if (!isLoaded) return null;
  if (!isSignedIn) return <Redirect href='/(auth)/sign-in' />;
  if (role !== 'owner') return <Redirect href='/' />;

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
        name='properties'
        options={{
          title: 'Properties',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name='business-outline' size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name='inquiries'
        options={{
          title: 'Inquiries',
          tabBarIcon: ({ color, size }) => <Ionicons name='chatbox-outline' size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name='appointments'
        options={{
          title: 'Visits',
          tabBarIcon: ({ color, size }) => <Ionicons name='calendar-outline' size={size} color={color} />,
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
    </Tabs>
  );
}
