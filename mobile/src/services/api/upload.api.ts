import { LocalPickedImage, PropertyImage } from '@/src/types/property';
import { apiClient, authHeader } from '@/src/services/api/client';

type GetTokenFn = (options?: { template?: string }) => Promise<string | null>;

interface ImageKitAuthPayload {
  token: string;
  expire: number;
  signature: string;
  publicKey: string;
}

const getImageKitAuth = async (getToken?: GetTokenFn) => {
  const headers = await authHeader(getToken);
  const response = await apiClient.get<{ data: ImageKitAuthPayload }>('/api/uploads/imagekit-auth', {
    headers,
  });
  return response.data.data;
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
