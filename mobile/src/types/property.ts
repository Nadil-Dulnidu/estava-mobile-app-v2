export type ListingType = 'sale' | 'rent';
export type PropertyType = 'apartment' | 'house' | 'villa' | 'land' | 'commercial';
export type PropertyStatus = 'available' | 'sold' | 'rented' | 'unavailable';
export type FurnishedStatus = 'furnished' | 'semi-furnished' | 'unfurnished' | null;

export interface PropertyImage {
  _id?: string;
  url: string;
  altText?: string | null;
  isCover: boolean;
  fileKey?: string | null;
  publicId?: string | null;
}

export interface Property {
  _id: string;
  title: string;
  description: string;
  price: number;
  listingType: ListingType;
  propertyType: PropertyType;
  status: PropertyStatus;
  address: string;
  city: string;
  district?: string | null;
  province?: string | null;
  bedrooms?: number | null;
  bathrooms?: number | null;
  parkingSpaces?: number | null;
  landSize?: number | null;
  floorArea?: number | null;
  distanceFromCityCenterKm?: number | null;
  furnishedStatus?: FurnishedStatus;
  yearBuilt?: number | null;
  features: string[];
  tags: string[];
  images: PropertyImage[];
  createdBy: string;
  updatedBy?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface PropertyFilters {
  search?: string;
  status?: PropertyStatus | '';
  listingType?: ListingType | '';
  propertyType?: PropertyType | '';
  sortBy?: 'createdAt' | 'updatedAt' | 'price' | 'title' | 'city';
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

export interface LocalPickedImage {
  id: string;
  uri: string;
  fileName: string;
  isCover: boolean;
  altText?: string;
  mimeType?: string | null;
  file?: Blob | null;
}
