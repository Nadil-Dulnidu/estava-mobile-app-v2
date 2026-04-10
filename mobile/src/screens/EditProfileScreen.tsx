import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  Alert,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { AppButton } from '@/src/components/common/AppButton';
import { ScreenWrapper } from '@/src/components/common/ScreenWrapper';
import { useAppSession } from '@/src/context/AppSessionContext';
import { theme } from '@/src/theme';

export const EditProfileScreen = () => {
  const { user, refreshOwnerState } = useAppSession();
  const router = useRouter();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setFirstName(user?.firstName || '');
    setLastName(user?.lastName || '');
  }, [user]);

  const handleSave = async () => {
    if (!user) return;

    setSaving(true);
    try {
      await user.update({
        firstName: firstName.trim() || undefined,
        lastName: lastName.trim() || undefined,
      });
      await refreshOwnerState();
      Alert.alert('Saved', 'Profile updated successfully.');
      router.back();
    } catch (error) {
      Alert.alert(
        'Update failed',
        error instanceof Error ? error.message : 'Please try again'
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <ScreenWrapper>
      {/* Custom header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons
            name='arrow-back'
            size={22}
            color={theme.colors.textPrimary}
          />
        </Pressable>
        <Text style={styles.headerTitle}>Edit Profile</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Avatar preview */}
      <View style={styles.avatarSection}>
        <View style={styles.avatar}>
          <Text style={styles.avatarLabel}>
            {`${user?.firstName?.[0] || 'E'}${user?.lastName?.[0] || ''}`.toUpperCase()}
          </Text>
        </View>
        <Text style={styles.avatarHint}>
          {user?.primaryEmailAddress?.emailAddress || ''}
        </Text>
      </View>

      {/* Form */}
      <View style={styles.formCard}>
        <Text style={styles.fieldLabel}>First Name</Text>
        <TextInput
          style={styles.input}
          placeholder='Enter your first name'
          placeholderTextColor={theme.colors.textMuted}
          value={firstName}
          onChangeText={setFirstName}
          autoCapitalize='words'
        />

        <Text style={styles.fieldLabel}>Last Name</Text>
        <TextInput
          style={styles.input}
          placeholder='Enter your last name'
          placeholderTextColor={theme.colors.textMuted}
          value={lastName}
          onChangeText={setLastName}
          autoCapitalize='words'
        />
      </View>

      <View style={styles.footer}>
        <AppButton
          label='Save Changes'
          icon='checkmark-outline'
          onPress={handleSave}
          loading={saving}
        />
        <AppButton
          label='Cancel'
          variant='secondary'
          onPress={() => router.back()}
        />
      </View>
    </ScreenWrapper>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.lg,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: theme.radius.full,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    ...theme.typography.h3,
    color: theme.colors.accentDark,
  },
  avatarSection: {
    alignItems: 'center',
    marginBottom: theme.spacing.xl,
    gap: theme.spacing.sm,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: theme.radius.full,
    backgroundColor: theme.colors.chipBg,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: theme.colors.primary,
  },
  avatarLabel: {
    ...theme.typography.h2,
    color: theme.colors.primary,
  },
  avatarHint: {
    ...theme.typography.body,
    color: theme.colors.textMuted,
  },
  formCard: {
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.lg,
    padding: theme.spacing.lg,
    gap: theme.spacing.xs,
    ...theme.shadow.card,
  },
  fieldLabel: {
    ...theme.typography.bodyStrong,
    color: theme.colors.textSecondary,
    marginTop: theme.spacing.xs,
  },
  input: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.background,
    height: 50,
    paddingHorizontal: theme.spacing.md,
    color: theme.colors.textPrimary,
    ...theme.typography.body,
    fontSize: 15,
  },
  footer: {
    gap: theme.spacing.sm,
    marginTop: theme.spacing.xl,
  },
});
