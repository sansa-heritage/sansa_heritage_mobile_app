import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ScrollView,
  Dimensions,
} from "react-native";
import Ionicons from "react-native-vector-icons/Ionicons";
import { useNotifications } from "../../context/NotificationContext";
import { Notification } from "../../models/notification.model";
import LoadingService from "../../services/LoadingService";

const { width } = Dimensions.get('window');

// Responsive font size scaling
const scale = (size: number) => {
  const baseWidth = 375;
  return Math.round((width / baseWidth) * size);
};

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
    const load = async () => {
      LoadingService.show('Loading notifications...');
      try {
        await fetchNotifications();
      } finally {
        LoadingService.hide();
      }
    };
    load();
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
        activeOpacity={0.7}
        style={[styles.notificationCard, !item.read && styles.unreadCard]}
        onPress={() => handleNotificationPress(item)}
      >
        {/* ICON — compact */}
        <View
          style={[styles.iconCircle, { backgroundColor: notificationIcon.bg }]}
        >
          <Ionicons
            name={notificationIcon.icon}
            size={scale(20)}
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

          <Text numberOfLines={2} style={styles.notificationBody}>
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
              {/* <Text style={styles.actionText}>
                {getActionText(item.type)} →
              </Text> */}
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
        {active && <View style={styles.tabIndicator} />}
      </TouchableOpacity>
    );
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <View style={styles.container}>
      {/* TITLE SECTION */}
      <View style={styles.titleSection}>
        {unreadCount > 0 && (
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={markAllAsRead}
            style={styles.markAllButton}
          >
            <Text style={styles.markAllText}>Mark all read</Text>
          </TouchableOpacity>
        )}
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
        <View style={styles.loading} />
      ) : filteredNotifications.length === 0 ? (
        <View style={styles.empty}>
          <View style={styles.emptyIconContainer}>
            <Ionicons
              name="notifications-off-outline"
              size={scale(40)}
              color="#D1D5DB"
            />
          </View>
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
    backgroundColor: "#F8F9FA",
  },

  /* ==========================================
     TITLE SECTION
  ========================================== */
  titleSection: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    paddingHorizontal: scale(14),
    paddingTop: scale(8),
    paddingBottom: scale(4),
    backgroundColor: "#F8F9FA",
  },

  markAllButton: {
    paddingHorizontal: scale(9),
    paddingVertical: scale(3),
    borderRadius: 14,
    backgroundColor: "#96252A",
  },

  markAllText: {
    fontSize: scale(10),
    color: "#FFFFFF",
    fontWeight: "600",
  },

  /* ==========================================
     TABS
  ========================================== */
  tabsWrapper: {
    paddingHorizontal: scale(14),
    paddingBottom: scale(8),
    backgroundColor: "#F8F9FA",
  },

  tabsContent: {
    paddingRight: scale(14),
    gap: 5,
  },

  tab: {
    paddingHorizontal: scale(12),
    paddingVertical: scale(5),
    borderRadius: 14,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
  },

  activeTab: {
    backgroundColor: "#96252A",
    borderColor: "#96252A",
  },

  tabText: {
    fontSize: scale(11),
    color: "#6B7280",
    fontWeight: "500",
  },

  activeTabText: {
    color: "#FFFFFF",
    fontWeight: "600",
  },

  tabIndicator: {
    position: "absolute",
    bottom: -2,
    left: "50%",
    marginLeft: -3,
    width: 6,
    height: 2.5,
    borderRadius: 1.5,
    backgroundColor: "#96252A",
  },

  /* ==========================================
     LIST
  ========================================== */
  listContent: {
    paddingHorizontal: scale(12),
    paddingTop: scale(4),
    paddingBottom: scale(20),
  },

  /* ==========================================
     NOTIFICATION CARD — COMPACT
  ========================================== */
  notificationCard: {
    flexDirection: "row",
    alignItems: "flex-start",   // ✅ top-align so tall icons don't stretch card
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#F3F4F6",
    borderRadius: 12,
    paddingVertical: scale(8),
    paddingHorizontal: scale(10),
    marginBottom: 6,
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },

  unreadCard: {
    backgroundColor: "#FAF5F5",
    borderLeftWidth: 2.5,
    borderLeftColor: "#96252A",
  },

  /* ==========================================
     ICON — COMPACT
  ========================================== */
  iconCircle: {
    width: scale(36),
    height: scale(36),
    borderRadius: scale(18),
    alignItems: "center",
    justifyContent: "center",
    marginRight: scale(8),
    marginTop: 1,
    flexShrink: 0,
  },

  /* ==========================================
     CARD CONTENT
  ========================================== */
  cardContent: {
    flex: 1,
    minWidth: 0,
  },

  cardTopRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    marginBottom: 1,
  },

  notificationTitle: {
    flex: 1,
    fontSize: scale(12.5),
    lineHeight: scale(16),
    color: "#111827",
    fontWeight: "600",
    marginRight: 6,
  },

  unreadTitle: {
    fontWeight: "700",
    color: "#151515",
  },

  notificationTime: {
    fontSize: scale(10),
    color: "#9CA3AF",
    fontWeight: "400",
    flexShrink: 0,
    marginTop: 1,
  },

  notificationBody: {
    fontSize: scale(11.5),
    lineHeight: scale(15),
    color: "#6B7280",
    fontWeight: "400",
    marginBottom: 2,
  },

  actionText: {
    fontSize: scale(11.5),
    color: "#96252A",
    fontWeight: "600",
    marginTop: 1,
  },

  /* ==========================================
     UNREAD DOT — smaller
  ========================================== */
  unreadDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#96252A",
    marginLeft: 5,
    marginTop: scale(6),
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

  emptyIconContainer: {
    width: scale(56),
    height: scale(56),
    borderRadius: scale(28),
    backgroundColor: "#F3F4F6",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
  },

  emptyTitle: {
    fontSize: scale(15),
    fontWeight: "600",
    color: "#151515",
    marginTop: 6,
  },

  emptySubtitle: {
    fontSize: scale(12),
    color: "#9CA3AF",
    textAlign: "center",
    marginTop: 4,
    lineHeight: 17,
  },
});

export default NotificationScreen;