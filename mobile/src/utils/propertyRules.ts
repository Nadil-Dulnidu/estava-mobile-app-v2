import { STATUS_OPTIONS_BY_LISTING_TYPE, RESIDENTIAL_PROPERTY_TYPES } from '@/src/constants/property';
import { ListingType, PropertyType } from '@/src/types/property';

const residentialTypeSet = new Set<PropertyType>(RESIDENTIAL_PROPERTY_TYPES as unknown as PropertyType[]);

export const isResidentialPropertyType = (type: PropertyType | string) =>
  residentialTypeSet.has(type as PropertyType);

export const isLandPropertyType = (type: PropertyType | string) => type === 'land';

export const isCommercialPropertyType = (type: PropertyType | string) => type === 'commercial';

export const getStatusOptionsForListingType = (listingType: ListingType | string) =>
  STATUS_OPTIONS_BY_LISTING_TYPE[(listingType as ListingType) || 'sale'] || STATUS_OPTIONS_BY_LISTING_TYPE.sale;
