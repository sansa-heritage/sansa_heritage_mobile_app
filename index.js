// /**
//  * @format
//  */

// import { AppRegistry } from 'react-native';
// import App from './App';
// import { name as appName } from './app.json';

// AppRegistry.registerComponent(appName, () => App);

/**
 * @format
 */

import { AppRegistry } from 'react-native';
import messaging from '@react-native-firebase/messaging';
import notifee, { EventType } from '@notifee/react-native';
import App from './App';
import { name as appName } from './app.json';

/* ============================================================
   ✅ BACKGROUND MESSAGE HANDLER
   Runs when app is CLOSED or in BACKGROUND
   ============================================================ */
messaging().setBackgroundMessageHandler(async (remoteMessage) => {
  console.log('📩 [BG] Message received:', remoteMessage);

  const { notification, data } = remoteMessage;

  try {
    // Android channel must exist for popup
    await notifee.createChannel({
      id: 'default',
      name: 'Default Notifications',
      importance: 4, // AndroidImportance.HIGH
      sound: 'default',
      vibration: true,
    });

    await notifee.displayNotification({
      title: notification?.title || 'New Notification',
      body: notification?.body || '',
      data: data || {},
      android: {
        channelId: 'default',
        importance: 4,
        smallIcon: 'ic_launcher',
        pressAction: {
          id: 'default',
          launchActivity: 'default',
        },
      },
    });

    console.log('✅ [BG] Notification displayed');
  } catch (err) {
    console.error('❌ [BG] Display error:', err);
  }
});

/* ============================================================
   ✅ BACKGROUND EVENT HANDLER
   ============================================================ */
notifee.onBackgroundEvent(async ({ type, detail }) => {
  console.log('👆 [BG] Event:', type, detail);
  if (type === EventType.PRESS) {
    console.log('📱 User tapped notification:', detail.notification?.data);
  }
});

AppRegistry.registerComponent(appName, () => App);