import { useAuth } from "@clerk/expo";
import Constants from "expo-constants";
import { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { io, Socket } from "socket.io-client";
import { notificationApi } from "@/src/services/api/notification.api";
import { AppNotification } from "@/src/types/notification";

interface NotificationContextValue {
  notifications: AppNotification[];
  unreadCount: number;
  isConnected: boolean;
  banner: AppNotification | null;
  dismissBanner: () => void;
  refresh: () => Promise<void>;
  markAsRead: (id: string) => Promise<void>;
  clearAll: () => Promise<number>;
}

const NotificationContext = createContext<NotificationContextValue | undefined>(undefined);

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

export const NotificationProvider = ({ children }: { children: ReactNode }) => {
  const { isSignedIn, userId, getToken } = useAuth();
  const getTokenRef = useRef(getToken);
  const socketRef = useRef<Socket | null>(null);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [banner, setBanner] = useState<AppNotification | null>(null);

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
    setBanner(null);
    return response.data?.deletedCount ?? 0;
  }, []);

  // Stable dismissBanner — extracted as useCallback so its reference
  // doesn't change on every useMemo recalc, preventing render loops in consumers
  const dismissBanner = useCallback(() => setBanner(null), []);

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
      setBanner(next);
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
      banner,
      dismissBanner,
      refresh,
      markAsRead,
      clearAll,
    }),
    [notifications, unreadCount, isConnected, banner, dismissBanner, refresh, markAsRead, clearAll],
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
