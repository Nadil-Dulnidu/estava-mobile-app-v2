import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { theme } from '@/src/theme';
import { LocalPickedImage, PropertyImage } from '@/src/types/property';

interface ImagePickerUploaderProps {
  existingImages: PropertyImage[];
  localImages: LocalPickedImage[];
  onExistingImagesChange: (images: PropertyImage[]) => void;
  onLocalImagesChange: (images: LocalPickedImage[]) => void;
}

export const ImagePickerUploader = ({
  existingImages,
  localImages,
  onExistingImagesChange,
  onLocalImagesChange,
}: ImagePickerUploaderProps) => {
  const pick = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) return;

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsMultipleSelection: true,
      quality: 0.8,
      selectionLimit: 10,
    });

    if (result.canceled) return;

    const hasCover = existingImages.some((image) => image.isCover) || localImages.some((image) => image.isCover);

    const mapped = result.assets.map((asset, index) => ({
      id: `${asset.assetId || Date.now()}-${index}`,
      uri: asset.uri,
      fileName: asset.fileName || `property-${Date.now()}-${index}.jpg`,
      isCover: !hasCover && index === 0,
    }));

    onLocalImagesChange([...localImages, ...mapped]);
  };

  const setExistingCover = (targetIndex: number) => {
    onExistingImagesChange(
      existingImages.map((image, index) => ({
        ...image,
        isCover: index === targetIndex,
      }))
    );
    onLocalImagesChange(localImages.map((image) => ({ ...image, isCover: false })));
  };

  const setLocalCover = (targetIndex: number) => {
    onLocalImagesChange(
      localImages.map((image, index) => ({
        ...image,
        isCover: index === targetIndex,
      }))
    );
    onExistingImagesChange(existingImages.map((image) => ({ ...image, isCover: false })));
  };

  return (
    <View style={styles.wrapper}>
      <Pressable style={styles.uploader} onPress={pick}>
        <Ionicons name='images-outline' size={24} color={theme.colors.primary} />
        <Text style={styles.uploadTitle}>Select Property Images</Text>
        <Text style={styles.uploadHint}>Tap to add one or more photos</Text>
      </Pressable>

      <View style={styles.list}>
        {existingImages.map((image, index) => (
          <View key={`existing-${image._id || index}`} style={styles.imageCard}>
            <Image source={{ uri: image.url }} style={styles.image} contentFit='cover' />
            <View style={styles.imageActions}>
              <Pressable onPress={() => setExistingCover(index)}>
                <Text style={[styles.cover, image.isCover && styles.coverActive]}>
                  {image.isCover ? 'Cover' : 'Set Cover'}
                </Text>
              </Pressable>
              <Pressable
                onPress={() => onExistingImagesChange(existingImages.filter((_, i) => i !== index))}>
                <Ionicons name='trash-outline' size={16} color={theme.colors.danger} />
              </Pressable>
            </View>
          </View>
        ))}

        {localImages.map((image, index) => (
          <View key={image.id} style={styles.imageCard}>
            <Image source={{ uri: image.uri }} style={styles.image} contentFit='cover' />
            <View style={styles.imageActions}>
              <Pressable onPress={() => setLocalCover(index)}>
                <Text style={[styles.cover, image.isCover && styles.coverActive]}>
                  {image.isCover ? 'Cover' : 'Set Cover'}
                </Text>
              </Pressable>
              <Pressable onPress={() => onLocalImagesChange(localImages.filter((_, i) => i !== index))}>
                <Ionicons name='trash-outline' size={16} color={theme.colors.danger} />
              </Pressable>
            </View>
          </View>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    gap: theme.spacing.sm,
  },
  uploader: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderStyle: 'dashed',
    borderRadius: theme.radius.lg,
    backgroundColor: theme.colors.surface,
    alignItems: 'center',
    paddingVertical: theme.spacing.lg,
    gap: 4,
  },
  uploadTitle: {
    ...theme.typography.bodyStrong,
    color: theme.colors.textPrimary,
  },
  uploadHint: {
    ...theme.typography.caption,
    color: theme.colors.textMuted,
  },
  list: {
    gap: theme.spacing.sm,
  },
  imageCard: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.md,
    overflow: 'hidden',
    backgroundColor: theme.colors.surface,
  },
  image: {
    width: '100%',
    height: 160,
    backgroundColor: '#E2E8F0',
  },
  imageActions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
  },
  cover: {
    ...theme.typography.caption,
    color: theme.colors.textSecondary,
  },
  coverActive: {
    color: theme.colors.primary,
    fontWeight: '700',
  },
});
