// components/services/NotificationService.ts

import messaging from '@react-native-firebase/messaging';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alert, Platform } from 'react-native';
import config from '../config/config';
import type { FirebaseMessagingTypes } from '@react-native-firebase/messaging';

// ✅ Define types for notification data
interface NotificationData {
  [key: string]: string | object;
}


type AuthorizationStatus =
  FirebaseMessagingTypes.AuthorizationStatus;



class NotificationService {
  private static instance: NotificationService;
  private _token: string | null = null;
  private _isInitialized: boolean = false;
  private _onNotificationListeners: ((notification: any) => void)[] = [];

  static getInstance(): NotificationService {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService();
    }
    return NotificationService.instance;
  }

async initialize(): Promise<void> {
  if (this._isInitialized) return;

  try {
    const authStatus = await this.requestPermission();

    const enabled = authStatus === 1 || authStatus === 2;

    if (enabled) {
      await this.getDeviceToken();
      this.setupListeners();
      await this.checkInitialNotification();
      this._isInitialized = true;
      console.log('✅ Notification Service initialized');
    } else {
      console.log('❌ Notification permission denied');
    }
  } catch (error) {
    console.error('❌ Notification init error:', error);
  }
}

  async requestPermission(): Promise<number> {
  const authStatus = await messaging().requestPermission();

  const enabled =
    authStatus === 1 || // AUTHORIZED
    authStatus === 2;   // PROVISIONAL

  if (enabled) {
    console.log('✅ Notification permission granted');
  } else {
    console.log('❌ Notification permission denied');
  }

  return authStatus;
}

  async getDeviceToken(): Promise<string | null> {
    try {
      const savedToken = await AsyncStorage.getItem('fcmToken');
      const token = await messaging().getToken();

      if (token) {
        this._token = token;
        await AsyncStorage.setItem('fcmToken', token);
        console.log('📱 FCM Token:', token.substring(0, 20) + '...');
        await this.registerTokenWithBackend(token);
        return token;
      }

      if (savedToken) {
        this._token = savedToken;
        console.log('📱 Using saved token:', savedToken.substring(0, 20) + '...');
        return savedToken;
      }

      return null;
    } catch (error) {
      console.error('❌ Error getting FCM token:', error);
      return null;
    }
  }

  async registerTokenWithBackend(token: string): Promise<void> {
    try {
      const authToken = await AsyncStorage.getItem('authToken');
      if (!authToken) {
        console.log('⚠️ No auth token found, skipping registration');
        return;
      }

      const response = await fetch(
        `${config.baseURL}api/notifications/register-token`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${authToken}`,
          },
          body: JSON.stringify({
            deviceToken: token,
            deviceType: Platform.OS,
            deviceId: await this.getDeviceId(),
          }),
        }
      );

      if (response.ok) {
        console.log('✅ Token registered with backend');
      } else {
        const errorData = await response.json();
        console.log('❌ Failed to register token:', errorData.message || 'Unknown error');
      }
    } catch (error) {
      console.error('❌ Token registration error:', error);
    }
  }

  async getDeviceId(): Promise<string> {
    try {
      let deviceId = await AsyncStorage.getItem('deviceId');
      if (!deviceId) {
        deviceId = Math.random().toString(36).substring(2, 15);
        await AsyncStorage.setItem('deviceId', deviceId);
      }
      return deviceId;
    } catch {
      return 'unknown-device';
    }
  }

  setupListeners(): void {
    // Foreground message listener
    messaging().onMessage(async (remoteMessage) => {
      console.log('📨 Foreground notification:', remoteMessage.notification?.title);
      this.handleForegroundMessage(remoteMessage);
      this.notifyListeners(remoteMessage);
    });

    // Background message handler
    messaging().setBackgroundMessageHandler(async (remoteMessage) => {
      console.log('📨 Background notification:', remoteMessage.notification?.title);
    });

    // App opened from notification (background state)
    messaging().onNotificationOpenedApp((remoteMessage) => {
      console.log('📨 App opened from notification:', remoteMessage.notification?.title);
      this.handleNotificationOpen(remoteMessage);
    });
  }

  async checkInitialNotification(): Promise<void> {
    try {
      const remoteMessage = await messaging().getInitialNotification();
      if (remoteMessage) {
        console.log('📨 App opened from terminated state:', remoteMessage.notification?.title);
        this.handleNotificationOpen(remoteMessage);
      }
    } catch (error) {
      console.error('❌ Error checking initial notification:', error);
    }
  }

  handleForegroundMessage(
    remoteMessage: FirebaseMessagingTypes.RemoteMessage
  ): void {
    const { notification } = remoteMessage;

    Alert.alert(
      notification?.title || 'New Notification',
      notification?.body || '',
      [
        {
          text: 'View',
          onPress: () => this.handleNotificationOpen(remoteMessage),
        },
        { text: 'Close', style: 'cancel' },
      ],
      { cancelable: true }
    );
  }

  handleNotificationOpen(
    remoteMessage: FirebaseMessagingTypes.RemoteMessage
  ): void {
    const data = remoteMessage.data as NotificationData | undefined;
    
    const screen = data?.screen as string || 'Dashboard';
    
    let params = {};
    const paramsString = data?.params as string;
    if (paramsString) {
      try {
        params = JSON.parse(paramsString);
      } catch (error) {
        console.error('Error parsing notification params:', error);
      }
    }

    console.log(`📱 Navigate to: ${screen}`, params);
  }

  addListener(callback: (notification: any) => void): void {
    this._onNotificationListeners.push(callback);
  }

  removeListener(callback: (notification: any) => void): void {
    this._onNotificationListeners = this._onNotificationListeners.filter(
      (cb) => cb !== callback
    );
  }

  private notifyListeners(notification: any): void {
    this._onNotificationListeners.forEach((callback) => {
      try {
        callback(notification);
      } catch (error) {
        console.error('Error in notification listener:', error);
      }
    });
  }

  async deleteToken(): Promise<void> {
    try {
      const token = await AsyncStorage.getItem('fcmToken');
      if (token) {
        const authToken = await AsyncStorage.getItem('authToken');
        if (authToken) {
          await fetch(`${config.baseURL}api/notifications/unregister-token`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${authToken}`,
            },
            body: JSON.stringify({ deviceToken: token }),
          });
        }
        await AsyncStorage.removeItem('fcmToken');
        this._token = null;
        console.log('✅ Token deleted');
      }
    } catch (error) {
      console.error('❌ Error deleting token:', error);
    }
  }

  getToken(): string | null {
    return this._token;
  }

  async refreshToken(): Promise<string | null> {
    await AsyncStorage.removeItem('fcmToken');
    return this.getDeviceToken();
  }

  isEnabled(): boolean {
    return this._isInitialized && !!this._token;
  }
}

export const notificationService = NotificationService.getInstance();
