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
  Dimensions,
} from "react-native";
import Ionicons from "react-native-vector-icons/Ionicons";
import { useNotifications } from "../../context/NotificationContext";
import { Notification } from "../../models/notification.model";

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
        activeOpacity={0.7}
        style={[
          styles.notificationCard,
          !item.read && styles.unreadCard
        ]}
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
            size={scale(22)}
            color={notificationIcon.color}
          />
        </View>

        {/* CONTENT */}
        <View style={styles.cardContent}>
          <View style={styles.cardTopRow}>
            <Text
              numberOfLines={2}
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
                {getActionText(item.type)} →
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
        {active && <View style={styles.tabIndicator} />}
      </TouchableOpacity>
    );
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <View style={styles.container}>
      {/* TITLE SECTION */}
      <View style={styles.titleSection}>
        {/* <View style={styles.titleLeft}>
          <Text style={styles.title}>Notifications</Text>
          <Text style={styles.subtitle}>
            Stay updated with your orders and offers
          </Text>
        </View> */}
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
        <View style={styles.loading}>
          <ActivityIndicator size="large" color="#96252A" />
        </View>
      ) : filteredNotifications.length === 0 ? (
        <View style={styles.empty}>
          <View style={styles.emptyIconContainer}>
            <Ionicons
              name="notifications-off-outline"
              size={scale(50)}
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
    justifyContent: "space-between",
    paddingHorizontal: scale(16),
    paddingTop: scale(12),
    paddingBottom: scale(8),
    backgroundColor: "#F8F9FA",
  },

  titleLeft: {
    flex: 1,
  },

  title: {
    fontSize: scale(20),
    fontWeight: "700",
    color: "#151515",
    letterSpacing: -0.5,
  },

  subtitle: {
    fontSize: scale(12),
    color: "#6B7280",
    fontWeight: "400",
    marginTop: 2,
  },

  markAllButton: {
    paddingHorizontal: scale(10),
    paddingVertical: scale(4),
    borderRadius: 16,
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
    paddingHorizontal: scale(16),
    paddingBottom: scale(10),
    backgroundColor: "#F8F9FA",
  },

  tabsContent: {
    paddingRight: scale(16),
    gap: 6,
  },

  tab: {
    paddingHorizontal: scale(14),
    paddingVertical: scale(6),
    borderRadius: 16,
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
    paddingHorizontal: scale(16),
    paddingTop: scale(4),
    paddingBottom: scale(20),
  },

  /* ==========================================
     NOTIFICATION CARD
  ========================================== */
  notificationCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 10,
    padding: scale(10),
    marginBottom: scale(8),
    shadowColor: "#000000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1,
  },

  unreadCard: {
    backgroundColor: "#FAF5F5",
    borderLeftWidth: 2.5,
    borderLeftColor: "#96252A",
  },

  /* ==========================================
     ICON
  ========================================== */
  iconCircle: {
    width: scale(40),
    height: scale(40),
    borderRadius: scale(20),
    alignItems: "center",
    justifyContent: "center",
    marginRight: scale(10),
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
    marginBottom: 1,
  },

  notificationTitle: {
    flex: 1,
    fontSize: scale(13),
    lineHeight: 18,
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
    fontSize: scale(12),
    lineHeight: 17,
    color: "#6B7280",
    fontWeight: "400",
    marginBottom: 3,
  },

  actionText: {
    fontSize: scale(12),
    color: "#96252A",
    fontWeight: "600",
  },

  /* ==========================================
     UNREAD DOT
  ========================================== */
  unreadDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: "#96252A",
    marginLeft: 6,
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
    width: scale(70),
    height: scale(70),
    borderRadius: scale(35),
    backgroundColor: "#F3F4F6",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },

  emptyTitle: {
    fontSize: scale(16),
    fontWeight: "600",
    color: "#151515",
    marginTop: 8,
  },

  emptySubtitle: {
    fontSize: scale(12),
    color: "#9CA3AF",
    textAlign: "center",
    marginTop: 4,
    lineHeight: 18,
  },
});

export default NotificationScreen;