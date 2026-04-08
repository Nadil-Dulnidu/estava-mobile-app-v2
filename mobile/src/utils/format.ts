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

export const getCoverImage = (property: Property) =>
  property.images.find((image) => image.isCover)?.url || property.images[0]?.url || '';

export const compactText = (value: string, max = 120) =>
  value.length > max ? `${value.slice(0, max)}...` : value;
