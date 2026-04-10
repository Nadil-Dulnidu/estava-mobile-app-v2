import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@clerk/expo';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { ErrorState, LoadingState } from '@/src/components/common/StateViews';
import { ScreenWrapper } from '@/src/components/common/ScreenWrapper';
import {
  mapFormStateToPayload,
  PropertyFormScreen,
  PropertyFormState,
} from '@/src/screens/property/PropertyFormScreen';
import { propertyApi } from '@/src/services/api/property.api';
import { uploadApi } from '@/src/services/api/upload.api';
import { mapPropertyToForm } from '@/src/utils/propertyForm';
import { theme } from '@/src/theme';

export const EditPropertyScreen = () => {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { getToken } = useAuth();
  const router = useRouter();

  const [initialValues, setInitialValues] = useState<PropertyFormState | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Keep getToken in a ref — it's a new reference every render and would
  // cause an infinite loop if used directly in useCallback deps.
  const getTokenRef = useRef(getToken);
  useEffect(() => { getTokenRef.current = getToken; });

  const load = useCallback(async () => {
    if (!id) return;

    setLoading(true);
    setError(null);
    try {
      const response = await propertyApi.getPropertyById(id, getTokenRef.current);
      setInitialValues(mapPropertyToForm(response.data));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load property');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  if (loading) {
    return (
      <ScreenWrapper>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name='arrow-back' size={22} color={theme.colors.textPrimary} />
          </Pressable>
          <Text style={styles.headerTitle}>Edit Property</Text>
          <View style={{ width: 40 }} />
        </View>
        <LoadingState message='Loading property...' />
      </ScreenWrapper>
    );
  }

  if (error || !initialValues) {
    return (
      <ScreenWrapper>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name='arrow-back' size={22} color={theme.colors.textPrimary} />
          </Pressable>
          <Text style={styles.headerTitle}>Edit Property</Text>
          <View style={{ width: 40 }} />
        </View>
        <ErrorState message={error || 'Unable to load'} onRetry={load} />
      </ScreenWrapper>
    );
  }

  return (
    <ScreenWrapper>
      {/* Custom Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name='arrow-back' size={22} color={theme.colors.textPrimary} />
        </Pressable>
        <Text style={styles.headerTitle}>Edit Property</Text>
        <View style={{ width: 40 }} />
      </View>

      <PropertyFormScreen
        title='Edit Property'
        submitLabel='Save Changes'
        initialValues={initialValues}
        onSubmit={async ({ formValues, existingImages, localImages }) => {
          if (!id) return;

          const uploaded = await uploadApi.uploadImages(localImages, getTokenRef.current);
          const payload = mapFormStateToPayload({
            ...formValues,
            images: [...existingImages, ...uploaded],
          });

          await propertyApi.updateProperty(id, payload, getTokenRef.current);
          Alert.alert('Saved', 'Property updated successfully.');
          router.replace(`/properties/${id}`);
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
