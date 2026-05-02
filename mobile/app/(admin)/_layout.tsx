import { Ionicons } from '@expo/vector-icons';
import { Redirect, Tabs } from 'expo-router';
import { Platform } from 'react-native';
import { theme } from '@/src/theme';
import { useAppSession } from '@/src/context/AppSessionContext';

export default function AdminTabsLayout() {
  const { isLoaded, isSignedIn, role } = useAppSession();

  if (!isLoaded) return null;
  if (!isSignedIn) return <Redirect href='/(public)' />;
  if (role !== 'admin') return <Redirect href='/(user)' />;

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
          title: 'Dashboard',
          tabBarIcon: ({ color, focused, size }) => (
            <Ionicons name={focused ? 'grid' : 'grid-outline'} size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name='properties'
        options={{
          title: 'Properties',
          tabBarIcon: ({ color, focused, size }) => (
            <Ionicons name={focused ? 'business' : 'business-outline'} size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name='reviews'
        options={{
          title: 'Reviews',
          tabBarIcon: ({ color, focused, size }) => (
            <Ionicons name={focused ? 'chatbubbles' : 'chatbubbles-outline'} size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name='analytics'
        options={{
          title: 'Analytics',
          tabBarIcon: ({ color, focused, size }) => (
            <Ionicons name={focused ? 'stats-chart' : 'stats-chart-outline'} size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name='profile'
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, focused, size }) => (
            <Ionicons name={focused ? 'person' : 'person-outline'} size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
