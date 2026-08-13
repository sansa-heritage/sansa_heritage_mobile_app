import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useNotifications } from '../../context/NotificationContext';
import { Notification } from '../../models/notification.model';

const NotificationScreen: React.FC = () => {
  const {
    notifications,
    unreadCount,
    loading,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    refreshUnreadCount,
  } = useNotifications();

  const [refreshing, setRefreshing] = useState(false);
  const [selectedTab, setSelectedTab] = useState('All');

  const tabs = ['All', 'Orders', 'Offers', 'Updates'];

  useEffect(() => {
    fetchNotifications();
  }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchNotifications();
    await refreshUnreadCount();
    setRefreshing(false);
  };

  const handleNotificationPress = async (notification: Notification) => {
    if (!notification.read) {
      await markAsRead(notification._id);
    }
    
    if (notification.action) {
      // Navigation is handled by the parent header
    }
  };

  const getActionText = (type: string) => {
    switch (type) {
      case 'order':
        return 'View Order';
      case 'promotion':
        return 'Shop Now';
      case 'payment':
        return 'View Details';
      case 'system':
        return 'View Details';
      default:
        return 'View Details';
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    if (days < 30) {
      return date.toLocaleDateString('en-US', { 
        day: 'numeric', 
        month: 'short' 
      });
    }
    return date.toLocaleDateString('en-US', { 
      day: 'numeric', 
      month: 'short', 
      year: 'numeric' 
    });
  };

  const filterNotifications = () => {
    if (selectedTab === 'All') return notifications;
    return notifications.filter(n => {
      if (selectedTab === 'Orders') return n.type === 'order';
      if (selectedTab === 'Offers') return n.type === 'promotion';
      if (selectedTab === 'Updates') return n.type === 'system' || n.type === 'general';
      return true;
    });
  };

  const filteredNotifications = filterNotifications();

  const renderNotification = ({ item }: { item: Notification }) => (
    <TouchableOpacity
      style={styles.notificationItem}
      onPress={() => handleNotificationPress(item)}
      activeOpacity={0.7}
    >
      <View style={styles.notificationContent}>
        <View style={styles.notificationHeader}>
          <Text style={[styles.notificationTitle, !item.read && styles.unreadTitle]}>
            {item.title}
          </Text>
          <Text style={styles.notificationTime}>{formatTime(item.createdAt)}</Text>
        </View>
        <Text style={styles.notificationBody}>{item.body}</Text>
        <TouchableOpacity 
          style={styles.actionButton}
          onPress={() => {
            if (item.action) {
              // Navigation handled by parent
            }
          }}
        >
          <Text style={styles.actionButtonText}>
            {getActionText(item.type)}
          </Text>
        </TouchableOpacity>
      </View>
      
      {!item.read && <View style={styles.unreadDot} />}
    </TouchableOpacity>
  );

  const renderTab = (tab: string) => (
    <TouchableOpacity
      key={tab}
      style={[styles.tab, selectedTab === tab && styles.activeTab]}
      onPress={() => setSelectedTab(tab)}
    >
      <Text style={[styles.tabText, selectedTab === tab && styles.activeTabText]}>
        {tab}
      </Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {/* Subtitle and Mark all - Header is already rendered by parent */}
      <View style={styles.subHeader}>
        <Text style={styles.headerSubtitle}>Stay updated with your orders and offers</Text>
        {unreadCount > 0 && (
          <TouchableOpacity onPress={markAllAsRead}>
            <Text style={styles.markAllText}>Mark all as read</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Divider */}
      <View style={styles.divider} />

      {/* Tabs */}
      <View style={styles.tabsContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {tabs.map(renderTab)}
        </ScrollView>
      </View>

      {/* Divider */}
      <View style={styles.divider2} />

      {/* Notifications List */}
      {loading && notifications.length === 0 ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#2563EB" />
        </View>
      ) : filteredNotifications.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="notifications-off-outline" size={80} color="#D1D5DB" />
          <Text style={styles.emptyText}>No notifications yet</Text>
          <Text style={styles.emptySubtext}>
            We'll notify you when something new arrives
          </Text>
        </View>
      ) : (
        <FlatList
          data={filteredNotifications}
          renderItem={renderNotification}
          keyExtractor={(item) => item._id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
          }
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  subHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
    backgroundColor: '#FFFFFF',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#64748B',
    flex: 1,
  },
  markAllText: {
    fontSize: 13,
    color: '#2563EB',
    fontWeight: '500',
  },
  divider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginHorizontal: 20,
  },
  tabsContainer: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
  },
  tab: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 12,
    backgroundColor: '#F1F5F9',
  },
  activeTab: {
    backgroundColor: '#2563EB',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#64748B',
  },
  activeTabText: {
    color: '#FFFFFF',
  },
  divider2: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginHorizontal: 20,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#0F172A',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#94A3B8',
    textAlign: 'center',
    marginTop: 8,
  },
  listContent: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 20,
  },
  notificationItem: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  notificationContent: {
    flex: 1,
  },
  notificationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 2,
  },
  notificationTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0F172A',
    flex: 1,
    marginRight: 8,
  },
  unreadTitle: {
    fontWeight: '700',
  },
  notificationTime: {
    fontSize: 13,
    color: '#94A3B8',
    fontWeight: '400',
  },
  notificationBody: {
    fontSize: 14,
    color: '#475569',
    lineHeight: 20,
    marginBottom: 6,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingVertical: 2,
  },
  actionButtonText: {
    fontSize: 14,
    color: '#2563EB',
    fontWeight: '500',
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#2563EB',
    alignSelf: 'flex-start',
    marginTop: 16,
    marginLeft: 12,
    flexShrink: 0,
  },
});

export default NotificationScreen;