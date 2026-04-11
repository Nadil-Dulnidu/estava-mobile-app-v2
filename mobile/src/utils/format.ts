import { Property } from '@/src/types/property';

export const formatLkr = (amount: number) =>
  new Intl.NumberFormat('en-LK', {
    style: 'currency',
    currency: 'LKR',
    maximumFractionDigits: 0,
  }).format(amount);

export const formatDate = (value?: string) => {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '-';
  return date.toLocaleDateString();
};

const ABSOLUTE_URL_REGEX = /^https?:\/\//i;
const API_BASE_URL = (process.env.EXPO_PUBLIC_API_BASE_URL || '').replace(/\/+$/, '');
const IMAGEKIT_URL_ENDPOINT = (process.env.EXPO_PUBLIC_IMAGEKIT_URL_ENDPOINT || '').replace(/\/+$/, '');

const resolveAssetUrl = (raw?: string | null) => {
  const value = raw?.trim();
  if (!value) return '';

  if (value.startsWith('data:')) return value;
  if (ABSOLUTE_URL_REGEX.test(value)) return value;
  if (value.startsWith('//')) return `https:${value}`;

  if (value.startsWith('/uploads/')) {
    return API_BASE_URL ? `${API_BASE_URL}${value}` : '';
  }

  if (value.startsWith('/')) {
    if (IMAGEKIT_URL_ENDPOINT) return `${IMAGEKIT_URL_ENDPOINT}${value}`;
    if (API_BASE_URL) return `${API_BASE_URL}${value}`;
    return '';
  }

  if (IMAGEKIT_URL_ENDPOINT) return `${IMAGEKIT_URL_ENDPOINT}/${value.replace(/^\/+/, '')}`;
  if (API_BASE_URL) return `${API_BASE_URL}/${value.replace(/^\/+/, '')}`;

  return '';
};

type PropertyImageLike = {
  url?: string | null;
  fileKey?: string | null;
  imageUrl?: string | null;
  uri?: string | null;
  src?: string | null;
};

export const resolvePropertyImageUrl = (image?: PropertyImageLike | null) => {
  if (!image) return '';

  const candidates = [image.url, image.imageUrl, image.uri, image.src, image.fileKey];
  for (const candidate of candidates) {
    const resolved = resolveAssetUrl(candidate);
    if (resolved) return resolved;
  }

  return '';
};

export const getCoverImage = (property: Property) => {
  const coverImage = property.images.find((image) => image.isCover) || property.images[0];
  return resolvePropertyImageUrl(coverImage);
};

export const compactText = (value: string, max = 120) =>
  value.length > max ? `${value.slice(0, max)}...` : value;
