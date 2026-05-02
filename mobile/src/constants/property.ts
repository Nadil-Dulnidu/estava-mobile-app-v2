export const LISTING_OPTIONS = [
  { label: 'Sale', value: 'sale' },
  { label: 'Rent', value: 'rent' },
] as const;

export const PROPERTY_TYPE_OPTIONS = [
  { label: 'Apartment', value: 'apartment' },
  { label: 'House', value: 'house' },
  { label: 'Villa', value: 'villa' },
  { label: 'Land', value: 'land' },
  { label: 'Commercial', value: 'commercial' },
] as const;

export const RESIDENTIAL_PROPERTY_TYPES = ['apartment', 'house', 'villa'] as const;

export const STATUS_OPTIONS = [
  { label: 'Available', value: 'available' },
  { label: 'Sold', value: 'sold' },
  { label: 'Rented', value: 'rented' },
  { label: 'Unavailable', value: 'unavailable' },
] as const;

export const STATUS_OPTIONS_BY_LISTING_TYPE = {
  sale: [
    { label: 'Available', value: 'available' },
    { label: 'Sold', value: 'sold' },
    { label: 'Unavailable', value: 'unavailable' },
  ],
  rent: [
    { label: 'Available', value: 'available' },
    { label: 'Rented', value: 'rented' },
    { label: 'Unavailable', value: 'unavailable' },
  ],
} as const;

export const FURNISHED_OPTIONS = [
  { label: 'Furnished', value: 'furnished' },
  { label: 'Semi-furnished', value: 'semi-furnished' },
  { label: 'Unfurnished', value: 'unfurnished' },
] as const;

export const SORT_OPTIONS = [
  { label: 'Newest', sortBy: 'createdAt', sortOrder: 'desc' },
  { label: 'Price Low-High', sortBy: 'price', sortOrder: 'asc' },
  { label: 'Price High-Low', sortBy: 'price', sortOrder: 'desc' },
] as const;
