import { useEffect, useMemo, useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';
import { AppButton } from '@/src/components/common/AppButton';
import { AppInput } from '@/src/components/common/AppInput';
import { OptionSelect } from '@/src/components/property/OptionSelect';
import { ChipInput } from '@/src/components/property/ChipInput';
import { ImagePickerUploader } from '@/src/components/property/ImagePickerUploader';
import {
  FURNISHED_OPTIONS,
  LISTING_OPTIONS,
  PROPERTY_TYPE_OPTIONS,
} from '@/src/constants/property';
import { theme } from '@/src/theme';
import { LocalPickedImage, PropertyImage } from '@/src/types/property';
import { ensureOneCoverImage, parseNumberInput, validatePropertyForm } from '@/src/utils/propertyForm';
import {
  getStatusOptionsForListingType,
  isCommercialPropertyType,
  isLandPropertyType,
  isResidentialPropertyType,
} from '@/src/utils/propertyRules';

export interface PropertyFormState {
  title: string;
  description: string;
  price: string;
  listingType: string;
  propertyType: string;
  status: string;
  address: string;
  city: string;
  district: string;
  province: string;
  bedrooms: string;
  bathrooms: string;
  parkingSpaces: string;
  landSize: string;
  floorArea: string;
  distanceFromCityCenterKm: string;
  furnishedStatus: string;
  yearBuilt: string;
  features: string[];
  tags: string[];
  images: PropertyImage[];
}

interface PropertyFormScreenProps {
  title: string;
  submitLabel: string;
  initialValues: PropertyFormState;
  loading?: boolean;
  onSubmit: (payload: {
    formValues: PropertyFormState;
    existingImages: PropertyImage[];
    localImages: LocalPickedImage[];
  }) => Promise<void>;
}

export const PropertyFormScreen = ({
  title,
  submitLabel,
  initialValues,
  loading,
  onSubmit,
}: PropertyFormScreenProps) => {
  const [values, setValues] = useState<PropertyFormState>(initialValues);
  const [existingImages, setExistingImages] = useState<PropertyImage[]>(initialValues.images || []);
  const [localImages, setLocalImages] = useState<LocalPickedImage[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const isLand = isLandPropertyType(values.propertyType);
  const isCommercial = isCommercialPropertyType(values.propertyType);
  const isResidential = isResidentialPropertyType(values.propertyType);
  const statusOptions = useMemo(
    () => getStatusOptionsForListingType(values.listingType),
    [values.listingType]
  );

  const sectionTitleStyle = useMemo(() => [styles.sectionTitle], []);

  const setValue = <K extends keyof PropertyFormState>(field: K, next: PropertyFormState[K]) => {
    setSubmitError(null);
    setValues((prev) => ({ ...prev, [field]: next }));
  };

  useEffect(() => {
    if (statusOptions.some((option) => option.value === values.status)) return;
    setValues((prev) => ({ ...prev, status: 'available' }));
  }, [statusOptions, values.status]);

  const handleSubmit = async () => {
    setSubmitError(null);
    const validationErrors = validatePropertyForm(values as unknown as Record<string, unknown>);

    const combinedImages = ensureOneCoverImage([...existingImages, ...localImages]);
    const hasImage = combinedImages.length > 0;

    if (!hasImage) {
      validationErrors.images = 'Add at least one property image';
    }

    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      setSubmitError('Please fix the highlighted form fields and try again.');
      Alert.alert('Validation error', 'Please fix the highlighted form fields.');
      return;
    }

    setErrors({});

    const normalizedValues: PropertyFormState = {
      ...values,
      title: values.title.trim(),
      description: values.description.trim(),
      address: values.address.trim(),
      city: values.city.trim(),
      district: values.district.trim(),
      province: values.province.trim(),
      features: values.features.map((f) => f.trim()).filter(Boolean),
      tags: values.tags.map((t) => t.trim()).filter(Boolean),
      images: ensureOneCoverImage(existingImages),
    };

    if (isLand) {
      normalizedValues.bedrooms = '';
      normalizedValues.bathrooms = '';
      normalizedValues.parkingSpaces = '';
      normalizedValues.floorArea = '';
      normalizedValues.furnishedStatus = '';
      normalizedValues.yearBuilt = '';
    }

    if (isCommercial) {
      normalizedValues.bedrooms = '';
      normalizedValues.furnishedStatus = '';
    }

    try {
      setSubmitting(true);
      await onSubmit({
        formValues: normalizedValues,
        existingImages: ensureOneCoverImage(existingImages),
        localImages: ensureOneCoverImage(localImages),
      });
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Failed to save property. Please try again.';
      setSubmitError(message);
      Alert.alert('Submission failed', message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.formTitle}>{title}</Text>

      <Text style={sectionTitleStyle}>Listing Details</Text>
      <AppInput
        label='Title'
        value={values.title}
        onChangeText={(v) => setValue('title', v)}
        placeholder='Modern 3 Bedroom House in Colombo'
        error={errors.title}
      />
      <AppInput
        label='Description'
        value={values.description}
        onChangeText={(v) => setValue('description', v)}
        multiline
        numberOfLines={5}
        style={styles.multiline}
        placeholder='Describe key highlights and condition'
        error={errors.description}
      />
      <AppInput
        label='Price (LKR)'
        value={values.price}
        onChangeText={(v) => setValue('price', v)}
        keyboardType='numeric'
        placeholder='35000000'
        error={errors.price}
      />

      <OptionSelect
        label='Listing Type'
        value={values.listingType}
        options={LISTING_OPTIONS}
        onChange={(v) => setValue('listingType', v)}
      />
      <OptionSelect
        label='Property Type'
        value={values.propertyType}
        options={PROPERTY_TYPE_OPTIONS}
        onChange={(v) => setValue('propertyType', v)}
      />
      <OptionSelect
        label='Status'
        value={values.status}
        options={statusOptions}
        onChange={(v) => setValue('status', v)}
      />

      <Text style={sectionTitleStyle}>Location</Text>
      <AppInput
        label='Address'
        value={values.address}
        onChangeText={(v) => setValue('address', v)}
        placeholder='123, Main Street'
        error={errors.address}
      />
      <AppInput
        label='City'
        value={values.city}
        onChangeText={(v) => setValue('city', v)}
        placeholder='Colombo'
        error={errors.city}
      />
      <AppInput
        label='District'
        value={values.district}
        onChangeText={(v) => setValue('district', v)}
      />
      <AppInput
        label='Province'
        value={values.province}
        onChangeText={(v) => setValue('province', v)}
      />

      <Text style={sectionTitleStyle}>Property Specs</Text>
      {isResidential ? (
        <>
          <AppInput
            label='Bedrooms'
            value={values.bedrooms}
            onChangeText={(v) => setValue('bedrooms', v)}
            keyboardType='number-pad'
            error={errors.bedrooms}
          />
          <AppInput
            label='Bathrooms'
            value={values.bathrooms}
            onChangeText={(v) => setValue('bathrooms', v)}
            keyboardType='number-pad'
            error={errors.bathrooms}
          />
        </>
      ) : null}

      {isCommercial ? (
        <AppInput
          label='Restrooms / Bathrooms (Optional)'
          value={values.bathrooms}
          onChangeText={(v) => setValue('bathrooms', v)}
          keyboardType='number-pad'
          error={errors.bathrooms}
        />
      ) : null}

      {!isLand ? (
        <AppInput
          label='Parking Spaces'
          value={values.parkingSpaces}
          onChangeText={(v) => setValue('parkingSpaces', v)}
          keyboardType='number-pad'
          error={errors.parkingSpaces}
        />
      ) : null}
      <AppInput
        label={isLand ? 'Land Size (Required)' : 'Land Size'}
        value={values.landSize}
        onChangeText={(v) => setValue('landSize', v)}
        keyboardType='numeric'
        error={errors.landSize}
      />
      {isLand ? (
        <AppInput
          label='Distance From City Center (km)'
          value={values.distanceFromCityCenterKm}
          onChangeText={(v) => setValue('distanceFromCityCenterKm', v)}
          keyboardType='numeric'
          error={errors.distanceFromCityCenterKm}
        />
      ) : (
        <>
          <AppInput
            label={isCommercial ? 'Floor Area (Required)' : 'Floor Area'}
            value={values.floorArea}
            onChangeText={(v) => setValue('floorArea', v)}
            keyboardType='numeric'
            error={errors.floorArea}
          />
          {isCommercial ? null : (
            <OptionSelect
              label='Furnished Status'
              value={values.furnishedStatus}
              options={FURNISHED_OPTIONS}
              onChange={(v) => setValue('furnishedStatus', v)}
            />
          )}
          <AppInput
            label='Year Built'
            value={values.yearBuilt}
            onChangeText={(v) => setValue('yearBuilt', v)}
            keyboardType='number-pad'
            error={errors.yearBuilt}
          />
        </>
      )}

      <Text style={sectionTitleStyle}>Features & Tags</Text>
      <ChipInput
        label='Features'
        values={values.features}
        onChange={(next) => setValue('features', next)}
      />
      <ChipInput label='Tags' values={values.tags} onChange={(next) => setValue('tags', next)} />

      <Text style={sectionTitleStyle}>Images</Text>
      <ImagePickerUploader
        existingImages={existingImages}
        localImages={localImages}
        onExistingImagesChange={(next) => {
          setSubmitError(null);
          setExistingImages(next);
        }}
        onLocalImagesChange={(next) => {
          setSubmitError(null);
          setLocalImages(next);
        }}
      />
      {errors.images ? <Text style={styles.errorText}>{errors.images}</Text> : null}
      {submitError ? <Text style={styles.errorText}>{submitError}</Text> : null}

      <AppButton
        label={submitLabel}
        onPress={() => {
          void handleSubmit();
        }}
        loading={loading || submitting}
        style={styles.submitButton}
      />
    </View>
  );
};

export const defaultPropertyFormValues: PropertyFormState = {
  title: '',
  description: '',
  price: '',
  listingType: 'sale',
  propertyType: 'house',
  status: 'available',
  address: '',
  city: '',
  district: '',
  province: '',
  bedrooms: '',
  bathrooms: '',
  parkingSpaces: '',
  landSize: '',
  floorArea: '',
  distanceFromCityCenterKm: '',
  furnishedStatus: 'unfurnished',
  yearBuilt: '',
  features: [],
  tags: [],
  images: [],
};

export const mapFormStateToPayload = (state: PropertyFormState) => {
  const optionalNumber = (value: string) => {
    const parsed = parseNumberInput(value);
    return parsed == null ? undefined : parsed;
  };

  return {
    title: state.title.trim(),
    description: state.description.trim(),
    price: Number(state.price),
    listingType: state.listingType,
    propertyType: state.propertyType,
    status: state.status,
    address: state.address.trim(),
    city: state.city.trim(),
    district: state.district.trim() || undefined,
    province: state.province.trim() || undefined,
    bedrooms: optionalNumber(state.bedrooms),
    bathrooms: optionalNumber(state.bathrooms),
    parkingSpaces: optionalNumber(state.parkingSpaces),
    landSize: optionalNumber(state.landSize),
    floorArea: optionalNumber(state.floorArea),
    distanceFromCityCenterKm: optionalNumber(state.distanceFromCityCenterKm),
    furnishedStatus: state.furnishedStatus || undefined,
    yearBuilt: optionalNumber(state.yearBuilt),
    features: state.features,
    tags: state.tags,
    images: state.images,
  };
};

const styles = StyleSheet.create({
  container: {
    gap: theme.spacing.sm,
  },
  formTitle: {
    ...theme.typography.h2,
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing.xs,
  },
  sectionTitle: {
    ...theme.typography.h3,
    color: theme.colors.textPrimary,
    marginTop: theme.spacing.md,
  },
  multiline: {
    minHeight: 120,
    textAlignVertical: 'top',
    paddingTop: theme.spacing.sm,
  },
  errorText: {
    ...theme.typography.caption,
    color: theme.colors.danger,
  },
  submitButton: {
    marginTop: theme.spacing.md,
  },
});
