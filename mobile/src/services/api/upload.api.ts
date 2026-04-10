import { LocalPickedImage, PropertyImage } from '@/src/types/property';
import { apiClient, authHeader } from '@/src/services/api/client';

type GetTokenFn = (options?: { template?: string }) => Promise<string | null>;

interface ImageKitAuthPayload {
  token: string;
  expire: number;
  signature: string;
  publicKey: string;
}

const parseImageKitAuthPayload = (value: unknown): ImageKitAuthPayload | null => {
  const candidates: unknown[] = [];
  const pushCandidate = (item: unknown) => {
    if (item && typeof item === 'object') {
      candidates.push(item);
    }
  };

  pushCandidate(value);

  const root = value as Record<string, unknown> | null;
  pushCandidate(root?.data);
  pushCandidate((root?.data as Record<string, unknown> | undefined)?.data);
  pushCandidate(root?.auth);
  pushCandidate(root?.authParams);

  for (const candidate of candidates) {
    const record = candidate as Record<string, unknown>;
    const token = typeof record.token === 'string' ? record.token : null;
    const signature = typeof record.signature === 'string' ? record.signature : null;
    const publicKey = typeof record.publicKey === 'string' ? record.publicKey : null;
    const rawExpire = record.expire;
    const expire =
      typeof rawExpire === 'number'
        ? rawExpire
        : typeof rawExpire === 'string'
          ? Number(rawExpire)
          : Number.NaN;

    if (token && signature && publicKey && Number.isFinite(expire)) {
      return { token, signature, publicKey, expire };
    }
  }

  return null;
};

const getImageKitAuth = async (getToken?: GetTokenFn) => {
  const headers = await authHeader(getToken);
  const response = await apiClient.get('/api/uploads/imagekit-auth', {
    headers,
  });

  if (typeof response.data === 'string') {
    const text = response.data.trim().toLowerCase();
    if (text.startsWith('<!doctype html') || text.startsWith('<html')) {
      throw new Error('Authentication failed. Please sign out and sign in again.');
    }
  }

  const payload = parseImageKitAuthPayload(response.data);
  if (!payload) {
    throw new Error('Unable to initialize image upload. Please sign in again and retry.');
  }

  return payload;
};

const uploadToImageKit = async (image: LocalPickedImage, auth: ImageKitAuthPayload) => {
  const formData = new FormData();
  formData.append('file', {
    uri: image.uri,
    type: 'image/jpeg',
    name: image.fileName,
  } as unknown as Blob);
  formData.append('fileName', image.fileName);
  formData.append('useUniqueFileName', 'true');
  formData.append('token', auth.token);
  formData.append('signature', auth.signature);
  formData.append('expire', String(auth.expire));
  formData.append('publicKey', auth.publicKey);

  const response = await fetch('https://upload.imagekit.io/api/v1/files/upload', {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || 'Image upload failed');
  }

  const result = await response.json();

  return {
    url: result.url,
    publicId: result.fileId,
    fileKey: result.filePath,
    altText: image.altText || null,
    isCover: image.isCover,
  } as PropertyImage;
};

export const uploadApi = {
  async uploadImages(images: LocalPickedImage[], getToken?: GetTokenFn) {
    if (!images.length) return [];

    const auth = await getImageKitAuth(getToken);
    const uploaded: PropertyImage[] = [];

    for (const image of images) {
      const uploadedImage = await uploadToImageKit(image, auth);
      uploaded.push(uploadedImage);
    }

    return uploaded;
  },
};
