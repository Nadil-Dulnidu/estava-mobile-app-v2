import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@clerk/expo';
import { useRouter } from 'expo-router';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import {
  defaultPropertyFormValues,
  mapFormStateToPayload,
  PropertyFormScreen,
} from '@/src/screens/property/PropertyFormScreen';
import { uploadApi } from '@/src/services/api/upload.api';
import { propertyApi } from '@/src/services/api/property.api';
import { ScreenWrapper } from '@/src/components/common/ScreenWrapper';
import { theme } from '@/src/theme';

export const AddPropertyScreen = () => {
  const { getToken } = useAuth();
  const router = useRouter();

  return (
    <ScreenWrapper>
      {/* Custom Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name='arrow-back' size={22} color={theme.colors.textPrimary} />
        </Pressable>
        <Text style={styles.headerTitle}>Add Property</Text>
        <View style={{ width: 40 }} />
      </View>

      <PropertyFormScreen
        title='Add Property'
        submitLabel='Create Property'
        initialValues={defaultPropertyFormValues}
        onSubmit={async ({ formValues, existingImages, localImages }) => {
          const uploaded = await uploadApi.uploadImages(localImages, getToken);
          const payload = mapFormStateToPayload({
            ...formValues,
            images: [...existingImages, ...uploaded],
          });

          await propertyApi.createProperty(payload, getToken);
          Alert.alert('Success', 'Property created successfully.');
          router.back();
        }}
      />
    </ScreenWrapper>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.md,
    paddingTop: 4,
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
});
