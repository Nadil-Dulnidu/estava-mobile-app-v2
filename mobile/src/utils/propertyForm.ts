import { Property } from '@/src/types/property';
import { isCommercialPropertyType, isLandPropertyType, isResidentialPropertyType } from '@/src/utils/propertyRules';

export const parseNumberInput = (value: string): number | null => {
  const normalized = value.trim();
  if (!normalized) return null;
  const numberValue = Number(normalized);
  return Number.isFinite(numberValue) ? numberValue : null;
};

export const ensureOneCoverImage = <T extends { isCover: boolean }>(images: T[]) => {
  if (!images.length) return images;

  const coverCount = images.filter((image) => image.isCover).length;
  if (coverCount === 1) return images;

  return images.map((image, index) => ({
    ...image,
    isCover: index === 0,
  }));
};

export const mapPropertyToForm = (property: Property) => ({
  title: property.title,
  description: property.description,
  price: String(property.price),
  listingType: property.listingType,
  propertyType: property.propertyType,
  status: property.status,
  address: property.address,
  city: property.city,
  district: property.district || '',
  province: property.province || '',
  bedrooms: property.bedrooms == null ? '' : String(property.bedrooms),
  bathrooms: property.bathrooms == null ? '' : String(property.bathrooms),
  parkingSpaces: property.parkingSpaces == null ? '' : String(property.parkingSpaces),
  landSize: property.landSize == null ? '' : String(property.landSize),
  floorArea: property.floorArea == null ? '' : String(property.floorArea),
  distanceFromCityCenterKm:
    property.distanceFromCityCenterKm == null ? '' : String(property.distanceFromCityCenterKm),
  furnishedStatus: property.furnishedStatus || 'unfurnished',
  yearBuilt: property.yearBuilt == null ? '' : String(property.yearBuilt),
  features: property.features || [],
  tags: property.tags || [],
  images: property.images || [],
});

export const validatePropertyForm = (values: Record<string, unknown>) => {
  const errors: Record<string, string> = {};

  const title = String(values.title || '').trim();
  const description = String(values.description || '').trim();
  const address = String(values.address || '').trim();
  const city = String(values.city || '').trim();
  const price = Number(values.price || 0);
  const propertyType = String(values.propertyType || '');

  if (!title) errors.title = 'Title is required';
  if (!description || description.length < 20) {
    errors.description = 'Description must be at least 20 characters';
  }
  if (!price || price <= 0) errors.price = 'Price must be greater than 0';
  if (!address) errors.address = 'Address is required';
  if (!city) errors.city = 'City is required';

  const bedrooms = parseNumberInput(String(values.bedrooms || ''));
  const bathrooms = parseNumberInput(String(values.bathrooms || ''));

  if (isResidentialPropertyType(propertyType)) {
    if (bedrooms == null) errors.bedrooms = 'Bedrooms are required';
    if (bathrooms == null) errors.bathrooms = 'Bathrooms are required';
  }

  const landSize = parseNumberInput(String(values.landSize || ''));
  if (isLandPropertyType(propertyType) && landSize == null) {
    errors.landSize = 'Land size is required for land properties';
  }

  const floorArea = parseNumberInput(String(values.floorArea || ''));
  if (isCommercialPropertyType(propertyType) && floorArea == null) {
    errors.floorArea = 'Floor area is required for commercial properties';
  }

  ['bedrooms', 'bathrooms', 'parkingSpaces', 'landSize', 'floorArea', 'distanceFromCityCenterKm'].forEach((field) => {
    const fieldValue = parseNumberInput(String(values[field] || ''));
    if (fieldValue != null && fieldValue < 0) {
      errors[field] = `${field} cannot be negative`;
    }
  });

  const yearBuilt = parseNumberInput(String(values.yearBuilt || ''));
  const currentYear = new Date().getFullYear();
  if (yearBuilt != null && (yearBuilt < 1800 || yearBuilt > currentYear + 1)) {
    errors.yearBuilt = 'Invalid year built';
  }

  return errors;
};
