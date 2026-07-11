// components/components/NotificationBadge.tsx

import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ViewStyle,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';
import { useNotifications } from '../context/NotificationContext';
import { StackNavigationProp } from '@react-navigation/stack';

interface NotificationBadgeProps {
  size?: number;
  color?: string;
  style?: ViewStyle;
  onPress?: () => void;
}

export const NotificationBadge: React.FC<NotificationBadgeProps> = ({
  size = 24,
  color = '#151515',
  style,
  onPress,
}) => {
  const navigation = useNavigation<StackNavigationProp<any>>();
  const { unreadCount, refreshUnreadCount } = useNotifications();

  // Refresh unread count when component mounts
  useEffect(() => {
    refreshUnreadCount();
  }, []);

  // Refresh every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      refreshUnreadCount();
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  const handlePress = () => {
    if (onPress) {
      onPress();
    } else {
      navigation.navigate('NotificationScreen');
    }
  };

  const showBadge = unreadCount > 0;

  return (
    <TouchableOpacity
      style={[styles.container, style]}
      onPress={handlePress}
      activeOpacity={0.7}
    >
      <Ionicons name="notifications-outline" size={size} color={color} />
      {showBadge && (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>
            {unreadCount > 99 ? '99+' : unreadCount}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    padding: 4,
  },
  badge: {
    position: 'absolute',
    top: -2,
    right: -2,
    backgroundColor: '#E53935',
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
    borderWidth: 2,
    borderColor: '#fff',
  },
  badgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '700',
    textAlign: 'center',
  },
});

export default NotificationBadge;
