import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  Alert,
  Platform,
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
  const [photoBusy, setPhotoBusy] = useState(false);

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

  const applyProfileImage = async (asset: ImagePicker.ImagePickerAsset) => {
    if (!user) return;

    if (Platform.OS === 'web') {
      if (!asset.file) {
        throw new Error('Could not access selected file. Please try another image.');
      }
      await user.setProfileImage({ file: asset.file });
      return;
    }

    const response = await fetch(asset.uri);
    const fileBlob = await response.blob();

    await user.setProfileImage({ file: fileBlob });
  };

  const handleUploadPhoto = async () => {
    if (!user) return;

    try {
      setPhotoBusy(true);

      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        Alert.alert('Permission needed', 'Please allow photo library access to upload a profile picture.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (result.canceled || !result.assets.length) return;

      await applyProfileImage(result.assets[0]);
      Alert.alert('Updated', 'Profile photo updated successfully.');
    } catch (error) {
      Alert.alert('Upload failed', error instanceof Error ? error.message : 'Please try again');
    } finally {
      setPhotoBusy(false);
    }
  };

  const handleDeletePhoto = async () => {
    if (!user) return;

    const confirmDelete = async () => {
      try {
        setPhotoBusy(true);
        await user.setProfileImage({ file: null });
        Alert.alert('Removed', 'Profile photo removed successfully.');
      } catch (error) {
        Alert.alert('Remove failed', error instanceof Error ? error.message : 'Please try again');
      } finally {
        setPhotoBusy(false);
      }
    };

    if (Platform.OS === 'web') {
      const confirmFn = (globalThis as { confirm?: (message?: string) => boolean }).confirm;
      const shouldDelete = confirmFn ? confirmFn('Remove your profile photo?') : true;
      if (shouldDelete) {
        void confirmDelete();
      }
      return;
    }

    Alert.alert('Remove photo', 'Remove your profile photo?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Remove', style: 'destructive', onPress: () => void confirmDelete() },
    ]);
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
        <View style={styles.avatarPanel}>
          <View style={styles.avatar}>
            {user?.imageUrl ? (
              <Image source={{ uri: user.imageUrl }} style={styles.avatarImage} contentFit='cover' />
            ) : (
              <Text style={styles.avatarLabel}>
                {`${user?.firstName?.[0] || 'E'}${user?.lastName?.[0] || ''}`.toUpperCase()}
              </Text>
            )}
          </View>
          <View style={styles.avatarActions}>
            <Pressable
              style={({ pressed }) => [
                styles.photoActionBtn,
                styles.photoActionPrimary,
                pressed && styles.photoActionPressed,
                photoBusy && styles.photoActionDisabled,
              ]}
              disabled={photoBusy}
              onPress={handleUploadPhoto}>
              <Ionicons name='camera-outline' size={16} color='#fff' />
              <Text style={styles.photoActionPrimaryText}>Update Photo</Text>
            </Pressable>
            <Pressable
              style={({ pressed }) => [
                styles.photoActionBtn,
                styles.photoActionDanger,
                pressed && styles.photoActionPressed,
                photoBusy && styles.photoActionDisabled,
              ]}
              disabled={photoBusy}
              onPress={handleDeletePhoto}>
              <Ionicons name='trash-outline' size={16} color={theme.colors.danger} />
              <Text style={styles.photoActionDangerText}>Delete Photo</Text>
            </Pressable>
          </View>
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
  avatarPanel: {
    width: '100%',
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.lg,
    padding: theme.spacing.lg,
    alignItems: 'center',
    gap: theme.spacing.md,
    ...theme.shadow.card,
  },
  avatar: {
    width: 132,
    height: 132,
    borderRadius: theme.radius.full,
    backgroundColor: theme.colors.chipBg,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 4,
    borderColor: theme.colors.primary,
  },
  avatarImage: {
    width: '100%',
    height: '100%',
    borderRadius: theme.radius.full,
  },
  avatarLabel: {
    ...theme.typography.h2,
    color: theme.colors.primary,
    fontSize: 42,
  },
  avatarActions: {
    width: '100%',
    gap: theme.spacing.xs,
    flexDirection: 'row',
  },
  photoActionBtn: {
    flex: 1,
    height: 46,
    borderRadius: theme.radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 6,
    borderWidth: 1,
  },
  photoActionPrimary: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  photoActionDanger: {
    backgroundColor: '#FFF5F5',
    borderColor: '#FED7D7',
  },
  photoActionPressed: {
    opacity: 0.9,
  },
  photoActionDisabled: {
    opacity: 0.6,
  },
  photoActionPrimaryText: {
    ...theme.typography.bodyStrong,
    color: '#fff',
  },
  photoActionDangerText: {
    ...theme.typography.bodyStrong,
    color: theme.colors.danger,
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
