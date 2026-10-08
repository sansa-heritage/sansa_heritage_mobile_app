
import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useRef,
  ReactNode,
  useCallback,
} from 'react';
import { Platform, AppState, AppStateStatus } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import messaging from '@react-native-firebase/messaging';
import notifee, { AndroidImportance, EventType } from '@notifee/react-native';
import config from '../config/config';
import { Notification } from '../models/notification.model';

interface NotificationContextType {
  isEnabled: boolean;
  deviceToken: string | null;
  loading: boolean;
  unreadCount: number;
  notifications: Notification[];
  requestPermissions: () => Promise<boolean>;
  refreshToken: () => Promise<string | null>;
  deleteToken: () => Promise<void>;
  fetchNotifications: () => Promise<void>;
  markAsRead: (notificationId: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  refreshUnreadCount: () => Promise<void>;
  clearAll: () => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within NotificationProvider');
  }
  return context;
};

interface NotificationProviderProps {
  children: ReactNode;
}

export const NotificationProvider: React.FC<NotificationProviderProps> = ({ children }) => {
  const [isEnabled, setIsEnabled] = useState(false);
  const [deviceToken, setDeviceToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const hasInitializedRef = useRef(false);

  /* ============================================================
     ✅ ANDROID CHANNEL — must exist BEFORE any notification
     ============================================================ */
  useEffect(() => {
    const createChannel = async () => {
      if (Platform.OS === 'android') {
        await notifee.createChannel({
          id: 'default',
          name: 'Default Notifications',
          importance: AndroidImportance.HIGH,
          sound: 'default',
          vibration: true,
        });
      }
    };
    createChannel();
  }, []);

  /* ============================================================
     ✅ REGISTER TOKEN with BACKEND
     ============================================================ */
  const saveTokenToBackend = useCallback(async (token: string) => {
    try {
      const authToken = await AsyncStorage.getItem('authToken');
      if (!authToken) return;

      await fetch(`${config.baseURL}api/notifications/register-token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          deviceToken: token,
          deviceType: Platform.OS === 'ios' ? 'ios' : 'android',
          deviceId: `${Platform.OS}-${Date.now()}`,
        }),
      });
      console.log('✅ FCM token registered with backend');
    } catch (error) {
      console.error('❌ Failed to register token:', error);
    }
  }, []);

  /* ============================================================
     ✅ REQUEST PERMISSIONS
     ============================================================ */
  const requestPermissions = useCallback(async (): Promise<boolean> => {
    try {
      const authStatus = await messaging().requestPermission();
      const enabled =
        authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
        authStatus === messaging.AuthorizationStatus.PROVISIONAL;

      if (enabled) {
        setIsEnabled(true);
        const token = await messaging().getToken();
        setDeviceToken(token);
        await saveTokenToBackend(token);
        return true;
      }
      return false;
    } catch (error) {
      console.error('❌ Permission error:', error);
      return false;
    }
  }, [saveTokenToBackend]);

  /* ============================================================
     ✅ REFRESH TOKEN
     ============================================================ */
  const refreshToken = useCallback(async (): Promise<string | null> => {
    try {
      const token = await messaging().getToken();
      setDeviceToken(token);
      await saveTokenToBackend(token);
      return token;
    } catch (error) {
      console.error('❌ Refresh token error:', error);
      return null;
    }
  }, [saveTokenToBackend]);

  /* ============================================================
     ✅ DELETE TOKEN
     ============================================================ */
  const deleteToken = useCallback(async (): Promise<void> => {
    try {
      if (deviceToken) {
        const authToken = await AsyncStorage.getItem('authToken');
        if (authToken) {
          await fetch(`${config.baseURL}api/notifications/unregister-token`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${authToken}`,
            },
            body: JSON.stringify({ deviceToken }),
          });
        }
      }
      await messaging().deleteToken();
      setDeviceToken(null);
      setIsEnabled(false);
      setNotifications([]);
      setUnreadCount(0);
    } catch (error) {
      console.error('❌ Delete token error:', error);
    }
  }, [deviceToken]);

  /* ============================================================
     ✅ FETCH NOTIFICATIONS
     ============================================================ */
  const refreshUnreadCount = useCallback(async (): Promise<void> => {
    try {
      const authToken = await AsyncStorage.getItem('authToken');
      if (!authToken) {
        setUnreadCount(0);
        return;
      }

      const response = await fetch(
        `${config.baseURL}api/notifications/unread-count`,
        {
          headers: { Authorization: `Bearer ${authToken}` },
        }
      );
      const data = await response.json();
      setUnreadCount(data.count || 0);
    } catch (error) {
      console.error('Error fetching unread count:', error);
    }
  }, []);

  const fetchNotifications = useCallback(async (): Promise<void> => {
    try {
      const authToken = await AsyncStorage.getItem('authToken');
      if (!authToken) {
        setNotifications([]);
        return;
      }

      const response = await fetch(`${config.baseURL}api/notifications`, {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      const data = await response.json();
      if (data.success) {
        setNotifications(data.notifications || []);
        setUnreadCount(data.unreadCount || 0);
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  }, []);

  const markAsRead = useCallback(async (notificationId: string): Promise<void> => {
    try {
      const authToken = await AsyncStorage.getItem('authToken');
      if (!authToken) return;

      await fetch(
        `${config.baseURL}api/notifications/${notificationId}/read`,
        {
          method: 'PUT',
          headers: { Authorization: `Bearer ${authToken}` },
        }
      );

      setNotifications((prev) =>
        prev.map((n) => (n._id === notificationId ? { ...n, read: true } : n))
      );
      await refreshUnreadCount();
    } catch (error) {
      console.error('Error marking as read:', error);
    }
  }, [refreshUnreadCount]);

  const markAllAsRead = useCallback(async (): Promise<void> => {
    try {
      const authToken = await AsyncStorage.getItem('authToken');
      if (!authToken) return;

      await fetch(`${config.baseURL}api/notifications/mark-all-read`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${authToken}` },
      });

      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  }, []);

  const clearAll = useCallback(async (): Promise<void> => {
    setNotifications([]);
    setUnreadCount(0);
  }, []);

  /* ============================================================
     ✅ FCM — FOREGROUND MESSAGE (APP IS OPEN)
     ============================================================ */
  useEffect(() => {
    const unsubscribe = messaging().onMessage(async (remoteMessage) => {
      console.log('📩 Foreground message:', remoteMessage);

      const { notification, data } = remoteMessage;

      await notifee.displayNotification({
        title: notification?.title || 'New Notification',
        body: notification?.body || '',
        data: data as any,
        android: {
          channelId: 'default',
          importance: AndroidImportance.HIGH,
          smallIcon: 'ic_launcher',
          pressAction: {
            id: 'default',
            launchActivity: 'default',
          },
        },
        ios: {
          foregroundPresentationOptions: {
            banner: true,
            sound: true,
            badge: true,
          },
        },
      });

      // ✅ Instant bell update on foreground message
      refreshUnreadCount();
    });

    return unsubscribe;
  }, [refreshUnreadCount]);

  /* ============================================================
     ✅ NOTIFEE — Handle NOTIFICATION PRESS
     ============================================================ */
  useEffect(() => {
    const unsubscribe = notifee.onForegroundEvent(({ type, detail }) => {
      if (type === EventType.PRESS) {
        console.log('👆 Notification pressed (foreground):', detail.notification);
      }
    });

    notifee.getInitialNotification().then((initialNotification) => {
      if (initialNotification) {
        console.log('👆 Notification pressed (initial):', initialNotification.notification);
      }
    });

    return unsubscribe;
  }, []);

  /* ============================================================
     ✅ TOKEN REFRESH LISTENER
     ============================================================ */
  useEffect(() => {
    const unsubscribe = messaging().onTokenRefresh(async (newToken) => {
      console.log('🔄 FCM token refreshed:', newToken);
      setDeviceToken(newToken);
      await saveTokenToBackend(newToken);
    });
    return unsubscribe;
  }, [saveTokenToBackend]);

  /* ============================================================
     ✅ INITIALIZATION — runs once on mount
     ============================================================ */
  useEffect(() => {
    if (hasInitializedRef.current) return;
    hasInitializedRef.current = true;

    const init = async () => {
      setLoading(true);
      try {
        const authToken = await AsyncStorage.getItem('authToken');
        if (authToken) {
          await requestPermissions();
          await fetchNotifications();
        }
      } catch (error) {
        console.error('Notification init error:', error);
      } finally {
        setLoading(false);
      }
    };
    init();
  }, [fetchNotifications, requestPermissions]);

  /* ============================================================
     ✅ LIVE POLLING — refresh unread count every 15s while app is active
     ============================================================ */
  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | null = null;

    const startPolling = () => {
      if (interval) return;
      // Refresh immediately, then every 15s
      refreshUnreadCount();
      interval = setInterval(() => {
        refreshUnreadCount();
      }, 15000);
    };

    const stopPolling = () => {
      if (interval) {
        clearInterval(interval);
        interval = null;
      }
    };

    // Start polling on mount
    startPolling();

    // Pause polling when app goes to background, resume when active
    const subscription = AppState.addEventListener('change', (nextState: AppStateStatus) => {
      if (nextState === 'active') {
        // ✅ Refresh immediately on foreground (catches notifications received while backgrounded)
        refreshUnreadCount();
        startPolling();
      } else {
        stopPolling();
      }
    });

    return () => {
      stopPolling();
      subscription.remove();
    };
  }, [refreshUnreadCount]);

  return (
    <NotificationContext.Provider
      value={{
        isEnabled,
        deviceToken,
        loading,
        unreadCount,
        notifications,
        requestPermissions,
        refreshToken,
        deleteToken,
        fetchNotifications,
        markAsRead,
        markAllAsRead,
        refreshUnreadCount,
        clearAll,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};