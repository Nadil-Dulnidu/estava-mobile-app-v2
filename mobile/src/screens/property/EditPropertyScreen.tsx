import { useAuth } from '@clerk/expo';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Alert } from 'react-native';
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

  if (loading) return <LoadingState message='Loading property...' />;
  if (error || !initialValues) return <ErrorState message={error || 'Unable to load'} onRetry={load} />;

  return (
    <ScreenWrapper>
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
