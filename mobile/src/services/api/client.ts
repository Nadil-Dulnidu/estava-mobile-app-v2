import axios from 'axios';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL;

if (!API_BASE_URL) {
  console.warn('EXPO_PUBLIC_API_BASE_URL is not set. API calls will fail until configured.');
}

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 20000,
});

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const fallbackMessage = 'Request failed. Please try again.';
    const message = error?.response?.data?.message || error?.message || fallbackMessage;

    return Promise.reject(new Error(message));
  }
);

export const authHeader = async (
  getToken?: (options?: { template?: string }) => Promise<string | null>
) => {
  if (!getToken) return {};
  let token: string | null = null;
  try {
    token = await getToken({ template: 'estava' });
  } catch {
    token = null;
  }
  if (!token) {
    token = await getToken();
  }
  if (!token) return {};
  return { Authorization: `Bearer ${token}` };
};
