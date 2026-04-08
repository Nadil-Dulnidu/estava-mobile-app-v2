import { useClerk, useUser } from '@clerk/expo';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, StyleSheet, Text, TextInput, View } from 'react-native';
import { AppButton } from '@/src/components/common/AppButton';
import { AppHeader } from '@/src/components/common/AppHeader';
import { ScreenWrapper } from '@/src/components/common/ScreenWrapper';
import { useAppSession } from '@/src/context/AppSessionContext';
import { theme } from '@/src/theme';

export const ProfileScreen = () => {
  const { user } = useUser();
  const { signOut } = useClerk();
  const { role, refreshOwnerState } = useAppSession();
  const router = useRouter();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [username, setUsername] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setFirstName(user?.firstName || '');
    setLastName(user?.lastName || '');
    setUsername(user?.username || '');
  }, [user]);

  const handleSignOut = async () => {
    try {
      await signOut();
      router.replace('/(auth)/sign-in');
    } catch (error) {
      Alert.alert('Sign out failed', error instanceof Error ? error.message : 'Please try again');
    }
  };

  const handleSave = async () => {
    if (!user) return;

    setSaving(true);
    try {
      await user.update({
        firstName: firstName.trim() || undefined,
        lastName: lastName.trim() || undefined,
        username: username.trim() || undefined,
      });
      await refreshOwnerState();
      Alert.alert('Saved', 'Profile updated successfully.');
    } catch (error) {
      Alert.alert('Update failed', error instanceof Error ? error.message : 'Please try again');
    } finally {
      setSaving(false);
    }
  };

  return (
    <ScreenWrapper>
      <AppHeader title='Profile' subtitle='Account settings and role access' />

      <View style={styles.card}>
        <Text style={styles.name}>{user?.fullName || 'Estava User'}</Text>
        <Text style={styles.email}>{user?.primaryEmailAddress?.emailAddress || '-'}</Text>
        <Text style={styles.meta}>Role: {role.toUpperCase()}</Text>
        <Text style={styles.meta}>User ID: {user?.id || '-'}</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Edit Profile</Text>
        <TextInput
          style={styles.input}
          placeholder='First name'
          placeholderTextColor={theme.colors.textMuted}
          value={firstName}
          onChangeText={setFirstName}
        />
        <TextInput
          style={styles.input}
          placeholder='Last name'
          placeholderTextColor={theme.colors.textMuted}
          value={lastName}
          onChangeText={setLastName}
        />
        <TextInput
          style={styles.input}
          placeholder='Username'
          placeholderTextColor={theme.colors.textMuted}
          value={username}
          onChangeText={setUsername}
        />
        <AppButton label='Save Profile' onPress={handleSave} loading={saving} />
      </View>

      <View style={styles.actions}>
        <AppButton label='My Properties' onPress={() => router.push('/(owner)/properties')} />
        <AppButton label='Public Browse' variant='secondary' onPress={() => router.push('/(public)')} />
        <AppButton
          label='Browse Listings'
          variant='secondary'
          onPress={() => router.push('/(public)/listings')}
        />
        <AppButton label='Sign Out' variant='danger' onPress={handleSignOut} />
      </View>
    </ScreenWrapper>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.lg,
    padding: theme.spacing.lg,
    gap: 6,
    ...theme.shadow.card,
  },
  name: {
    ...theme.typography.h3,
    color: theme.colors.textPrimary,
  },
  email: {
    ...theme.typography.body,
    color: theme.colors.textSecondary,
  },
  meta: {
    ...theme.typography.caption,
    color: theme.colors.textMuted,
  },
  sectionTitle: {
    ...theme.typography.h3,
    color: theme.colors.textPrimary,
    marginBottom: 4,
  },
  input: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.surface,
    height: 48,
    paddingHorizontal: theme.spacing.sm,
    color: theme.colors.textPrimary,
  },
  actions: {
    gap: theme.spacing.sm,
    marginTop: theme.spacing.lg,
  },
});
