import { useAuth } from "@clerk/expo";
import Constants from "expo-constants";
import * as Notifications from "expo-notifications";
import { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { Platform } from "react-native";
import { io, Socket } from "socket.io-client";
import { notificationApi } from "@/src/services/api/notification.api";
import { AppNotification } from "@/src/types/notification";

interface NotificationContextValue {
  notifications: AppNotification[];
  unreadCount: number;
  isConnected: boolean;
  refresh: () => Promise<void>;
  markAsRead: (id: string) => Promise<void>;
  clearAll: () => Promise<number>;
}

const NotificationContext = createContext<NotificationContextValue | undefined>(undefined);
const isNativeMobile = Platform.OS === "ios" || Platform.OS === "android";
const NOTIFICATION_CHANNEL_ID = "default";

if (isNativeMobile) {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
    }),
  });
}

const getSocketBaseUrl = () => {
  const explicit = process.env.EXPO_PUBLIC_SOCKET_URL;
  if (explicit) return explicit;
  const apiUrl = process.env.EXPO_PUBLIC_API_BASE_URL;
  if (apiUrl) return apiUrl;

  const hostUri = Constants.expoConfig?.hostUri || "";
  const host = hostUri.split(":")[0];
  if (!host) return "";
  return `http://${host}:5000`;
};

const ensureNativeNotificationsReady = async () => {
  if (!isNativeMobile) return false;

  try {
    if (Platform.OS === "android") {
      await Notifications.setNotificationChannelAsync(NOTIFICATION_CHANNEL_ID, {
        name: "Default",
        importance: Notifications.AndroidImportance.HIGH,
        vibrationPattern: [0, 250, 250, 250],
      });
    }

    const currentPermissions = await Notifications.getPermissionsAsync();
    let permissionStatus = currentPermissions.status;

    if (permissionStatus !== "granted") {
      const requestPermissions = await Notifications.requestPermissionsAsync();
      permissionStatus = requestPermissions.status;
    }

    return permissionStatus === "granted";
  } catch {
    return false;
  }
};

export const NotificationProvider = ({ children }: { children: ReactNode }) => {
  const { isSignedIn, userId, getToken } = useAuth();
  const getTokenRef = useRef(getToken);
  const socketRef = useRef<Socket | null>(null);
  const nativeNotificationsEnabledRef = useRef(false);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [isConnected, setIsConnected] = useState(false);

  // Inline ref update — safe to do during render, avoids the useEffect
  // firing on every Clerk getToken reference cycle
  getTokenRef.current = getToken;

  const unreadCount = useMemo(() => notifications.filter((item) => item.status === "unread").length, [notifications]);

  const refresh = useCallback(async () => {
    if (!isSignedIn) {
      setNotifications([]);
      return;
    }

    try {
      const response = await notificationApi.getNotifications({ page: 1, limit: 50 }, getTokenRef.current);
      setNotifications(response.data || []);
    } catch {
      // Don't call setNotifications on error — it would create a
      // new array reference every catch, triggering another render
    }
  }, [isSignedIn]);

  const markAsRead = useCallback(async (id: string) => {
    await notificationApi.markReadState(id, "read", getTokenRef.current);
    setNotifications((prev) => prev.map((item) => (item._id === id ? { ...item, status: "read" } : item)));
  }, []);

  const clearAll = useCallback(async () => {
    const response = await notificationApi.clearAll(getTokenRef.current);
    setNotifications([]);
    return response.data?.deletedCount ?? 0;
  }, []);

  useEffect(() => {
    if (isSignedIn) {
      refresh();
    } else {
      setNotifications([]);
    }
  }, [isSignedIn, refresh]);

  useEffect(() => {
    let mounted = true;

    if (!isSignedIn) {
      nativeNotificationsEnabledRef.current = false;
      return () => {
        mounted = false;
      };
    }

    (async () => {
      const enabled = await ensureNativeNotificationsReady();
      if (mounted) {
        nativeNotificationsEnabledRef.current = enabled;
      }
    })();

    return () => {
      mounted = false;
    };
  }, [isSignedIn]);

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
      transports: ["websocket"],
      auth: { userId },
    });
    socketRef.current = socket;

    socket.on("connect", () => setIsConnected(true));
    socket.on("disconnect", () => setIsConnected(false));
    socket.on("notification:new", (payload: { success?: boolean; data?: AppNotification }) => {
      const next = payload?.data;
      if (!next) return;

      setNotifications((prev) => [next, ...prev.filter((item) => item._id !== next._id)]);
      if (nativeNotificationsEnabledRef.current) {
        void Notifications.scheduleNotificationAsync({
          content: {
            title: next.title,
            body: next.message,
            data: {
              notificationId: next._id,
              type: next.type,
              relatedEntityId: next.relatedEntityId ?? undefined,
              relatedEntityType: next.relatedEntityType ?? undefined,
            },
            sound: true,
          },
          trigger: null,
        });
      }
    });

    socket.on("connect_error", () => setIsConnected(false));

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
      refresh,
      markAsRead,
      clearAll,
    }),
    [notifications, unreadCount, isConnected, refresh, markAsRead, clearAll],
  );

  return <NotificationContext.Provider value={value}>{children}</NotificationContext.Provider>;
};

export const useNotifications = () => {
  const value = useContext(NotificationContext);
  if (!value) {
    throw new Error("useNotifications must be used within NotificationProvider");
  }
  return value;
};
