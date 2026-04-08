import { useAuth } from '@clerk/expo';
import Constants from 'expo-constants';
import { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { notificationApi } from '@/src/services/api/notification.api';
import { AppNotification } from '@/src/types/notification';

interface NotificationContextValue {
  notifications: AppNotification[];
  unreadCount: number;
  isConnected: boolean;
  banner: AppNotification | null;
  dismissBanner: () => void;
  refresh: () => Promise<void>;
  markAsRead: (id: string) => Promise<void>;
}

const NotificationContext = createContext<NotificationContextValue | undefined>(undefined);

const getSocketBaseUrl = () => {
  const explicit = process.env.EXPO_PUBLIC_SOCKET_URL;
  if (explicit) return explicit;
  const apiUrl = process.env.EXPO_PUBLIC_API_BASE_URL;
  if (apiUrl) return apiUrl;

  const hostUri = Constants.expoConfig?.hostUri || '';
  const host = hostUri.split(':')[0];
  if (!host) return '';
  return `http://${host}:5000`;
};

export const NotificationProvider = ({ children }: { children: ReactNode }) => {
  const { isSignedIn, userId, getToken } = useAuth();
  const getTokenRef = useRef(getToken);
  const socketRef = useRef<Socket | null>(null);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [banner, setBanner] = useState<AppNotification | null>(null);

  useEffect(() => {
    getTokenRef.current = getToken;
  }, [getToken]);

  const unreadCount = useMemo(
    () => notifications.filter((item) => item.status === 'unread').length,
    [notifications]
  );

  const refresh = useCallback(async () => {
    if (!isSignedIn) {
      setNotifications([]);
      return;
    }

    try {
      const response = await notificationApi.getNotifications({ page: 1, limit: 50 }, getTokenRef.current);
      setNotifications(response.data || []);
    } catch {
      setNotifications((prev) => prev);
    }
  }, [isSignedIn]);

  const markAsRead = useCallback(async (id: string) => {
    await notificationApi.markReadState(id, 'read', getTokenRef.current);
    setNotifications((prev) =>
      prev.map((item) => (item._id === id ? { ...item, status: 'read' } : item))
    );
  }, []);

  useEffect(() => {
    if (isSignedIn) {
      refresh();
    } else {
      setNotifications([]);
    }
  }, [isSignedIn, refresh]);

  useEffect(() => {
    if (!isSignedIn || !userId) {
      setIsConnected(false);
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
      return;
    }

    const socketUrl = getSocketBaseUrl();
    if (!socketUrl) return;

    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
    }

    const socket = io(socketUrl, {
      transports: ['websocket'],
      auth: { userId },
    });
    socketRef.current = socket;

    socket.on('connect', () => setIsConnected(true));
    socket.on('disconnect', () => setIsConnected(false));
    socket.on('notification:new', (payload: { success?: boolean; data?: AppNotification }) => {
      const next = payload?.data;
      if (!next) return;

      setNotifications((prev) => [next, ...prev.filter((item) => item._id !== next._id)]);
      setBanner(next);
    });

    socket.on('connect_error', () => setIsConnected(false));

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  }, [isSignedIn, userId]);

  const value = useMemo(
    () => ({
      notifications,
      unreadCount,
      isConnected,
      banner,
      dismissBanner: () => setBanner(null),
      refresh,
      markAsRead,
    }),
    [notifications, unreadCount, isConnected, banner, refresh, markAsRead]
  );

  return <NotificationContext.Provider value={value}>{children}</NotificationContext.Provider>;
};

export const useNotifications = () => {
  const value = useContext(NotificationContext);
  if (!value) {
    throw new Error('useNotifications must be used within NotificationProvider');
  }
  return value;
};
