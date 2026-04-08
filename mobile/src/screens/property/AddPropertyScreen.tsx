import { useAuth } from '@clerk/expo';
import { useRouter } from 'expo-router';
import { Alert } from 'react-native';
import {
  defaultPropertyFormValues,
  mapFormStateToPayload,
  PropertyFormScreen,
} from '@/src/screens/property/PropertyFormScreen';
import { uploadApi } from '@/src/services/api/upload.api';
import { propertyApi } from '@/src/services/api/property.api';
import { ScreenWrapper } from '@/src/components/common/ScreenWrapper';

export const AddPropertyScreen = () => {
  const { getToken } = useAuth();
  const router = useRouter();

  return (
    <ScreenWrapper>
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
          router.replace('/(tabs)/my-properties');
        }}
      />
    </ScreenWrapper>
  );
};
