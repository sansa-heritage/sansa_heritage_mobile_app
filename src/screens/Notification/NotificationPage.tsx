import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  ScrollView,
} from "react-native";
import Ionicons from "react-native-vector-icons/Ionicons";
import { useNotifications } from "../../context/NotificationContext";
import { Notification } from "../../models/notification.model";

const NotificationScreen: React.FC = () => {
  const {
    notifications,
    loading,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    refreshUnreadCount,
  } = useNotifications();

  const [refreshing, setRefreshing] = useState(false);
  const [selectedTab, setSelectedTab] = useState("All");

  const tabs = ["All", "Orders", "Offers", "Updates", "Reminders"];

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
      // Navigation handled by parent
    }
  };

  const getActionText = (type: string) => {
    switch (type) {
      case "order":
        return "View Order";
      case "promotion":
        return "Shop Now";
      case "payment":
        return "View Details";
      case "cart":
        return "View Cart";
      case "wishlist":
        return "View Wishlist";
      default:
        return "View Details";
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "order":
        return { icon: "cube-outline", color: "#96252A", bg: "#FCEBED" };
      case "promotion":
        return { icon: "pricetag-outline", color: "#267B76", bg: "#E9F8F6" };
      case "cart":
        return { icon: "cart-outline", color: "#B57724", bg: "#FFF3E4" };
      case "wishlist":
        return { icon: "heart-outline", color: "#3D7AA7", bg: "#EDF6FF" };
      case "payment":
        return { icon: "wallet-outline", color: "#B57724", bg: "#FFF3E4" };
      case "reminder":
        return { icon: "time-outline", color: "#B57724", bg: "#FFF3E4" };
      case "system":
        return { icon: "ribbon-outline", color: "#72559A", bg: "#F4EFFB" };
      default:
        return { icon: "notifications-outline", color: "#96252A", bg: "#FCEBED" };
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return "Just now";
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    if (days < 30) {
      return date.toLocaleDateString("en-GB", {
        day: "numeric",
        month: "short",
      });
    }
    return date.toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  const filterNotifications = () => {
    if (selectedTab === "All") return notifications;
    return notifications.filter((notification) => {
      if (selectedTab === "Orders") return notification.type === "order";
      if (selectedTab === "Offers") return notification.type === "promotion";
      if (selectedTab === "Updates") {
        return notification.type === "system" || notification.type === "general";
      }
      if (selectedTab === "Reminders") {
        return (
          notification.type === "reminder" ||
          notification.type === "cart" ||
          notification.type === "wishlist"
        );
      }
      return true;
    });
  };

  const filteredNotifications = filterNotifications();

  const shouldShowAction = (item: Notification) => {
    return (
      !!item.action ||
      ["order", "promotion", "payment", "cart", "wishlist"].includes(item.type)
    );
  };

  const renderNotification = ({ item }: { item: Notification }) => {
    const notificationIcon = getNotificationIcon(item.type);

    return (
      <TouchableOpacity
        activeOpacity={0.9}
        style={styles.notificationCard}
        onPress={() => handleNotificationPress(item)}
      >
        {/* ICON */}
        <View
          style={[
            styles.iconCircle,
            {
              backgroundColor: notificationIcon.bg,
            },
          ]}
        >
          <Ionicons
            name={notificationIcon.icon}
            size={40}
            color={notificationIcon.color}
          />
        </View>

        {/* CONTENT */}
        <View style={styles.cardContent}>
          <View style={styles.cardTopRow}>
            <Text
              numberOfLines={1}
              style={[
                styles.notificationTitle,
                !item.read && styles.unreadTitle,
              ]}
            >
              {item.title}
            </Text>
            <Text style={styles.notificationTime}>
              {formatTime(item.createdAt)}
            </Text>
          </View>

          <Text
            numberOfLines={2}
            style={styles.notificationBody}
          >
            {item.body}
          </Text>

          {shouldShowAction(item) && (
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => {
                if (!item.read) {
                  markAsRead(item._id);
                }
                if (item.action) {
                  // Navigation handled by parent
                }
              }}
            >
              <Text style={styles.actionText}>
                {getActionText(item.type)}
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {/* UNREAD DOT */}
        {!item.read && <View style={styles.unreadDot} />}
      </TouchableOpacity>
    );
  };

  const renderTab = (tab: string) => {
    const active = selectedTab === tab;
    return (
      <TouchableOpacity
        key={tab}
        activeOpacity={0.8}
        onPress={() => setSelectedTab(tab)}
        style={[styles.tab, active && styles.activeTab]}
      >
        <Text style={[styles.tabText, active && styles.activeTabText]}>
          {tab}
        </Text>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      {/* TITLE SECTION */}
      <View style={styles.titleSection}>
        <View style={styles.titleLeft}>
          <Text style={styles.title}>Notifications</Text>
          <Text style={styles.subtitle}>
            Stay updated with your orders and offers
          </Text>
        </View>
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={markAllAsRead}
          style={styles.markAllButton}
        >
          <Text style={styles.markAllText}>Mark all as read</Text>
        </TouchableOpacity>
      </View>

      {/* FILTER TABS */}
      <View style={styles.tabsWrapper}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tabsContent}
        >
          {tabs.map(renderTab)}
        </ScrollView>
      </View>

      {/* NOTIFICATIONS LIST */}
      {loading && notifications.length === 0 ? (
        <View style={styles.loading}>
          <ActivityIndicator size="large" color="#96252A" />
        </View>
      ) : filteredNotifications.length === 0 ? (
        <View style={styles.empty}>
          <Ionicons
            name="notifications-off-outline"
            size={60}
            color="#CCCCCC"
          />
          <Text style={styles.emptyTitle}>No notifications yet</Text>
          <Text style={styles.emptySubtitle}>
            We'll notify you when something new arrives
          </Text>
        </View>
      ) : (
        <FlatList
          data={filteredNotifications}
          renderItem={renderNotification}
          keyExtractor={(item) => item._id}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              colors={["#96252A"]}
              tintColor="#96252A"
            />
          }
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },

  /* ==========================================
     TITLE SECTION
  ========================================== */
  titleSection: {
    flexDirection: "row",
    alignItems: "flex-end",
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
    backgroundColor: "#FFFFFF",
  },

  titleLeft: {
    flex: 1,
  },

  title: {
    fontSize: 20,
    fontWeight: "700",
    color: "#151515",
  },

  subtitle: {
    fontSize: 14,
    color: "#6B7280",
    fontWeight: "400",
    marginTop: 4,
  },

  markAllButton: {
    marginLeft: 12,
    paddingBottom: 2,
  },

  markAllText: {
    fontSize: 13,
    color: "#96252A",
    fontWeight: "500",
  },

  /* ==========================================
     TABS
  ========================================== */
  tabsWrapper: {
    paddingHorizontal: 20,
    paddingBottom: 16,
    backgroundColor: "#FFFFFF",
  },

  tabsContent: {
    paddingRight: 20,
  },

  tab: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: "#96252A",
    backgroundColor: "#FFFFFF",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
  },

  activeTab: {
    backgroundColor: "#96252A",
    borderColor: "#96252A",
  },

  tabText: {
    fontSize: 14,
    color: "#6B7280",
    fontWeight: "500",
  },

  activeTabText: {
    color: "#FFFFFF",
    fontWeight: "600",
  },

  /* ==========================================
     LIST
  ========================================== */
  listContent: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 20,
  },

  /* ==========================================
     NOTIFICATION CARD
  ========================================== */
  notificationCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#F3F4F6",
    borderRadius: 14,
    padding: 12,
    marginBottom: 8,
    shadowColor: "#000000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },

  /* ==========================================
     ICON
  ========================================== */
  iconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 14,
    flexShrink: 0,
  },

  /* ==========================================
     CARD CONTENT
  ========================================== */
  cardContent: {
    flex: 1,
    alignSelf: "stretch",
    justifyContent: "center",
    minWidth: 0,
  },

  cardTopRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    marginBottom: 2,
  },

  notificationTitle: {
    flex: 1,
    fontSize: 15,
    lineHeight: 20,
    color: "#111827",
    fontWeight: "600",
    marginRight: 8,
  },

  unreadTitle: {
    fontWeight: "700",
  },

  notificationTime: {
    fontSize: 13,
    color: "#9CA3AF",
    fontWeight: "400",
    flexShrink: 0,
  },

  notificationBody: {
    fontSize: 14,
    lineHeight: 20,
    color: "#4B5563",
    fontWeight: "400",
    marginBottom: 4,
  },

  actionText: {
    fontSize: 14,
    color: "#2563EB",
    fontWeight: "500",
  },

  /* ==========================================
     UNREAD DOT
  ========================================== */
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#EF4444",
    marginLeft: 8,
    flexShrink: 0,
  },

  /* ==========================================
     LOADING
  ========================================== */
  loading: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },

  /* ==========================================
     EMPTY STATE
  ========================================== */
  empty: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 40,
  },

  emptyTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: "#111827",
    marginTop: 16,
  },

  emptySubtitle: {
    fontSize: 14,
    color: "#9CA3AF",
    textAlign: "center",
    marginTop: 8,
  },
});

export default NotificationScreen;