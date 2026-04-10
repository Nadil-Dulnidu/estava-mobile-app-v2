import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import type { Href } from 'expo-router';
import { Alert, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { ScreenWrapper } from '@/src/components/common/ScreenWrapper';
import { useAppSession } from '@/src/context/AppSessionContext';
import { theme } from '@/src/theme';

type IoniconsName = keyof typeof Ionicons.glyphMap;

type MenuItem = {
  icon: IoniconsName;
  label: string;
  subtitle: string;
  onPress: () => void;
};

type MenuSection = {
  title: string;
  items: MenuItem[];
};

export const ProfileScreen = () => {
  const { user, isOwner, isAdmin, signOut } = useAppSession();
  const router = useRouter();

  const performSignOut = async () => {
    try {
      await signOut();
      router.replace('/(auth)/sign-in');
    } catch (e) {
      Alert.alert('Sign out failed', e instanceof Error ? e.message : 'Please try again.');
    }
  };

  const handleSignOut = () => {
    if (Platform.OS === 'web') {
      const confirmFn = (globalThis as { confirm?: (message?: string) => boolean }).confirm;
      const confirmed = confirmFn ? confirmFn('Are you sure you want to sign out?') : true;
      if (confirmed) {
        void performSignOut();
      }
      return;
    }

    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: () => void performSignOut(),
      },
    ]);
  };

  const showOwnerItems = isOwner || isAdmin;

  const accountSection: MenuSection = {
    title: 'Account',
    items: [
      {
        icon: 'person-outline',
        label: 'Edit Profile',
        subtitle: 'Update your name and details',
        onPress: () => router.push('/edit-profile' as Href),
      },
    ],
  };

  const ownerSection: MenuSection = {
    title: 'Owner Tools',
    items: showOwnerItems
      ? [
          {
            icon: 'business-outline',
            label: 'My Listings',
            subtitle: 'Manage your property listings',
            onPress: () => router.push('/my-listings' as Href),
          },
          {
            icon: 'calendar-outline',
            label: 'Appointments',
            subtitle: 'View and manage visit schedules',
            onPress: () => router.push('/my-appointments' as Href),
          },
          {
            icon: 'chatbox-ellipses-outline',
            label: 'Inquiry Requests',
            subtitle: 'Respond to property inquiries',
            onPress: () => router.push('/my-inquiries' as Href),
          },
        ]
      : [],
  };

  const actionsSection: MenuSection = {
    title: 'Actions',
    items: [
      {
        icon: 'add-circle-outline',
        label: 'Create New Listing',
        subtitle: 'Post a new property for sale or rent',
        onPress: () => router.push('/properties/add' as Href),
      },
      {
        icon: 'search-outline',
        label: 'Browse Listings',
        subtitle: 'Explore available properties',
        onPress: () => router.push('/(user)/explore'),
      },
    ],
  };

  const sections = [
    accountSection,
    ownerSection,
    actionsSection,
  ].filter((s) => s.items.length > 0);

  const roleBadge = isAdmin ? 'Admin' : isOwner ? 'Owner' : 'User';
  const initials = `${user?.firstName?.[0] ?? 'E'}${user?.lastName?.[0] ?? ''}`.toUpperCase();

  return (
    <ScreenWrapper>
      {/* ── Profile Header ── */}
      <View style={styles.profileHeader}>
        <View style={styles.avatarContainer}>
          <View style={styles.avatar}>
            <Text style={styles.avatarLabel}>{initials}</Text>
          </View>
          <View style={styles.onlineIndicator} />
        </View>
        <Text style={styles.userName}>{user?.fullName ?? 'Estava User'}</Text>
        <Text style={styles.userEmail}>
          {user?.primaryEmailAddress?.emailAddress ?? '-'}
        </Text>
        <View style={styles.roleBadge}>
          <Ionicons
            name={isAdmin ? 'shield-checkmark' : isOwner ? 'key' : 'person'}
            size={12}
            color={theme.colors.primary}
          />
          <Text style={styles.roleBadgeText}>{roleBadge}</Text>
        </View>
      </View>

      {/* ── Menu Sections ── */}
      {sections.map((section) => (
        <View key={section.title} style={styles.menuSection}>
          <Text style={styles.sectionTitle}>{section.title}</Text>
          <View style={styles.menuCard}>
            {section.items.map((item, index) => (
              <Pressable
                key={item.label}
                style={({ pressed }) => [
                  styles.menuItem,
                  index < section.items.length - 1 && styles.menuItemBorder,
                  pressed && styles.menuItemPressed,
                ]}
                onPress={item.onPress}
              >
                <View style={styles.menuIconWrap}>
                  <Ionicons name={item.icon} size={20} color={theme.colors.primary} />
                </View>
                <View style={styles.menuTextWrap}>
                  <Text style={styles.menuLabel}>{item.label}</Text>
                  <Text style={styles.menuSubtitle}>{item.subtitle}</Text>
                </View>
                <Ionicons name='chevron-forward' size={18} color={theme.colors.textMuted} />
              </Pressable>
            ))}
          </View>
        </View>
      ))}

      {/* ── Sign Out ── */}
      <Pressable
        style={({ pressed }) => [styles.signOutBtn, pressed && styles.signOutBtnPressed]}
        onPress={handleSignOut}
      >
        <Ionicons name='log-out-outline' size={20} color={theme.colors.danger} />
        <Text style={styles.signOutLabel}>Sign Out</Text>
      </Pressable>

      <Text style={styles.versionText}>Estava v1.0.0</Text>
    </ScreenWrapper>
  );
};

const styles = StyleSheet.create({
  profileHeader: {
    alignItems: 'center',
    paddingVertical: theme.spacing.lg,
    marginBottom: theme.spacing.sm,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: theme.spacing.md,
  },
  avatar: {
    width: 88,
    height: 88,
    borderRadius: theme.radius.full,
    backgroundColor: theme.colors.chipBg,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: theme.colors.primary,
  },
  avatarLabel: {
    fontSize: 30,
    fontWeight: '700',
    fontFamily: 'Poppins-Bold',
    color: theme.colors.primary,
  },
  onlineIndicator: {
    position: 'absolute',
    bottom: 4,
    right: 4,
    width: 16,
    height: 16,
    borderRadius: theme.radius.full,
    backgroundColor: theme.colors.success,
    borderWidth: 3,
    borderColor: theme.colors.background,
  },
  userName: {
    ...theme.typography.h2,
    color: theme.colors.accentDark,
    marginBottom: 2,
  },
  userEmail: {
    ...theme.typography.body,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.sm,
  },
  roleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: theme.colors.chipBg,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 4,
    borderRadius: theme.radius.full,
  },
  roleBadgeText: {
    ...theme.typography.caption,
    color: theme.colors.primary,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  menuSection: {
    marginBottom: theme.spacing.lg,
  },
  sectionTitle: {
    ...theme.typography.caption,
    color: theme.colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: theme.spacing.xs,
    marginLeft: 4,
  },
  menuCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    overflow: 'hidden',
    ...theme.shadow.card,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: 14,
    gap: theme.spacing.sm,
  },
  menuItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  menuItemPressed: {
    backgroundColor: theme.colors.chipBg,
  },
  menuIconWrap: {
    width: 40,
    height: 40,
    borderRadius: theme.radius.sm,
    backgroundColor: theme.colors.chipBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuTextWrap: {
    flex: 1,
  },
  menuLabel: {
    ...theme.typography.bodyStrong,
    color: theme.colors.textPrimary,
  },
  menuSubtitle: {
    ...theme.typography.caption,
    color: theme.colors.textMuted,
    marginTop: 1,
  },
  signOutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.xs,
    paddingVertical: 14,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: theme.colors.danger,
    backgroundColor: theme.colors.surface,
    marginTop: theme.spacing.xs,
  },
  signOutBtnPressed: {
    backgroundColor: '#FFF5F5',
  },
  signOutLabel: {
    ...theme.typography.bodyStrong,
    color: theme.colors.danger,
  },
  versionText: {
    ...theme.typography.caption,
    color: theme.colors.textMuted,
    textAlign: 'center',
    marginTop: theme.spacing.lg,
    marginBottom: theme.spacing.md,
  },
});
