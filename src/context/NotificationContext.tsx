import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
  useCallback,
} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
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
          headers: {
            Authorization: `Bearer ${authToken}`,
          },
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
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
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
          headers: {
            Authorization: `Bearer ${authToken}`,
          },
        }
      );

      setNotifications((prev) =>
        prev.map((n) =>
          n._id === notificationId ? { ...n, read: true } : n
        )
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
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });

      setNotifications((prev) =>
        prev.map((n) => ({ ...n, read: true }))
      );
      setUnreadCount(0);
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  }, []);

  const clearAll = useCallback(async (): Promise<void> => {
    setNotifications([]);
    setUnreadCount(0);
  }, []);

  const requestPermissions = useCallback(async (): Promise<boolean> => {
    // Simplified version - you can add FCM here
    setIsEnabled(true);
    return true;
  }, []);

  const refreshToken = useCallback(async (): Promise<string | null> => {
    return null;
  }, []);

  const deleteToken = useCallback(async (): Promise<void> => {
    setDeviceToken(null);
    setIsEnabled(false);
    setNotifications([]);
    setUnreadCount(0);
  }, []);

  // Initialize
  useEffect(() => {
    const init = async () => {
      setLoading(true);
      try {
        const authToken = await AsyncStorage.getItem('authToken');
        if (authToken) {
          await fetchNotifications();
        }
      } catch (error) {
        console.error('Notification init error:', error);
      } finally {
        setLoading(false);
      }
    };
    init();
  }, [fetchNotifications]);

  // Listen for auth changes
  useEffect(() => {
    const checkAuth = async () => {
      const authToken = await AsyncStorage.getItem('authToken');
      if (authToken) {
        await fetchNotifications();
      } else {
        setNotifications([]);
        setUnreadCount(0);
      }
    };
    
    const interval = setInterval(checkAuth, 5000);
    return () => clearInterval(interval);
  }, [fetchNotifications]);

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