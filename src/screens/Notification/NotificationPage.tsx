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
import { useNavigation } from "@react-navigation/native";
import { useNotifications } from "../../context/NotificationContext";
import { Notification } from "../../models/notification.model";
import LoadingService from "../../services/LoadingService";

const { width } = Dimensions.get("window");

const scale = (size: number) => {
  const baseWidth = 375;
  return Math.round((width / baseWidth) * size);
};

const NotificationScreen: React.FC = () => {
  const navigation = useNavigation<any>();

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
      LoadingService.show("Loading notifications...");
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

  const getTypeConfig = (
    type: string,
  ): { icon: string; color: string; bg: string; action: string } => {
    switch (type) {
      case "order":
        return {
          icon: "cube-outline",
          color: "#9E0E26",
          bg: "#FBE9EC",
          action: "View Order",
        };
      case "promotion":
        return {
          icon: "pricetag-outline",
          color: "#1F8A7A",
          bg: "#E4F5F1",
          action: "Shop Now",
        };
      case "payment":
        return {
          icon: "wallet-outline",
          color: "#B57724",
          bg: "#FDF2E0",
          action: "View Details",
        };
      case "cart":
        return {
          icon: "cart-outline",
          color: "#B57724",
          bg: "#FDF2E0",
          action: "View Cart",
        };
      case "wishlist":
        return {
          icon: "heart-outline",
          color: "#3D7AA7",
          bg: "#E4EFF9",
          action: "View Wishlist",
        };
      case "reminder":
        return {
          icon: "time-outline",
          color: "#B57724",
          bg: "#FDF2E0",
          action: "View Details",
        };
      case "system":
      case "general":
        return {
          icon: "ribbon-outline",
          color: "#72559A",
          bg: "#EEE6F8",
          action: "View Details",
        };
      case "birthday":
        return {
          icon: "gift-outline",
          color: "#D64C5B",
          bg: "#FBE4E7",
          action: "Shop Now",
        };
      default:
        return {
          icon: "notifications-outline",
          color: "#9E0E26",
          bg: "#FBE9EC",
          action: "View Details",
        };
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
    if (days === 1) return "Yesterday";
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
      const t = notification.type as string;
      if (selectedTab === "Orders") return t === "order";
      if (selectedTab === "Offers") return t === "promotion";
      if (selectedTab === "Updates") return t === "system" || t === "general";
      if (selectedTab === "Reminders") {
        return t === "reminder" || t === "cart" || t === "wishlist";
      }
      return true;
    });
  };

  const filteredNotifications = filterNotifications();

  const shouldShowAction = (item: Notification) => {
    return (
      !!item.action ||
      [
        "order",
        "promotion",
        "payment",
        "cart",
        "wishlist",
        "reminder",
        "birthday",
      ].includes(item.type as string)
    );
  };

  const handleCTA = async (item: Notification) => {
    if (!item.read) await markAsRead(item._id);

    const data: any = (item as any).data || {};
    const t = item.type as string;

    const navAction = (item as any).action;
    if (navAction && typeof navAction === "string") {
      try {
        const parsed = JSON.parse(navAction);
        if (parsed?.screen) {
          navigation.navigate(parsed.screen, parsed.params || {});
          return;
        }
      } catch {
        // not JSON; fall through to type-based routing
      }
    }

    switch (t) {
      case "order":
        if (data.orderId) {
          navigation.navigate("OrderDetails", { orderId: data.orderId });
        } else {
          navigation.navigate("OrdersPage");
        }
        break;

      case "cart":
        navigation.navigate("CartPage");
        break;

      case "wishlist":
        navigation.navigate("FavoritesPage");
        break;

      case "promotion":
      case "birthday":
        if (data.productId) {
          navigation.navigate("ProductDetails", { itemId: data.productId });
        } else if (data.categoryId) {
          navigation.navigate("CategoryScreen", {
            mainCategory: data.categoryId,
            displayTitle: data.categoryName || "Category",
          });
        } else {
          navigation.navigate("Dashboard");
        }
        break;

      case "payment":
      case "reminder":
      case "system":
      case "general":
      default:
        if (data.orderId) {
          navigation.navigate("OrderDetails", { orderId: data.orderId });
        }
        break;
    }
  };

  const renderNotification = ({ item }: { item: Notification }) => {
    const cfg = getTypeConfig(item.type as string);

    return (
      <TouchableOpacity
        activeOpacity={0.7}
        style={styles.notificationRow}
        onPress={async () => {
          if (!item.read) await markAsRead(item._id);
        }}
      >
        <View style={[styles.iconCircle, { backgroundColor: cfg.bg }]}>
          <Ionicons name={cfg.icon as any} size={scale(24)} color={cfg.color} />
        </View>

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

          <Text numberOfLines={2} style={styles.notificationBody}>
            {item.body}
          </Text>

          {shouldShowAction(item) && (
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => handleCTA(item)}
              hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
            >
              <Text style={[styles.actionText, { color: cfg.color }]}>
                {cfg.action}
              </Text>
            </TouchableOpacity>
          )}
        </View>

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

  const unreadCount = notifications.filter((n) => !n.read).length;
  const hasNotifications = notifications.length > 0;

  return (
    <View style={styles.container}>
      {unreadCount > 0 && (
        <View style={styles.markAllRow}>
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={markAllAsRead}
            hitSlop={6}
          >
            <Text style={styles.markAllText}>Mark all as read</Text>
          </TouchableOpacity>
        </View>
      )}

      {hasNotifications && (
        <View style={styles.tabsWrapper}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.tabsContent}
          >
            {tabs.map(renderTab)}
          </ScrollView>
        </View>
      )}

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
        /* ✅ Outer rounded shell around the whole list */
        <View style={styles.listPanel}>
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
                colors={["#9E0E26"]}
                tintColor="#9E0E26"
              />
            }
          />
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F8F9FA" },

  /* Mark all as read */
  markAllRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
    alignItems: "center",
    paddingHorizontal: scale(16),
    paddingTop: scale(10),
    paddingBottom: scale(6),
    backgroundColor: "#F8F9FA",
  },
  markAllText: {
    fontSize: scale(13),
    color: "#9E0E26",
    fontWeight: "600",
  },

  /* Tabs */
  tabsWrapper: {
    paddingHorizontal: scale(14),
    paddingTop: scale(4),
    paddingBottom: scale(10),
    backgroundColor: "#F8F9FA",
  },
  tabsContent: { paddingRight: scale(14), gap: 8 },
  tab: {
    paddingHorizontal: scale(16),
    paddingVertical: scale(8),
    borderRadius: 20,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    justifyContent: "center",
    alignItems: "center",
  },
  activeTab: { backgroundColor: "#9E0E26", borderColor: "#9E0E26" },
  tabText: { fontSize: scale(12), color: "#374151", fontWeight: "500" },
  activeTabText: { color: "#FFFFFF", fontWeight: "700" },

  /* ✅ Outer rounded shell that contains the whole stack */
  listPanel: {
    flex: 1,
    marginHorizontal: scale(12),
    marginBottom: scale(6),
    backgroundColor: "#FDFDFD",
    borderRadius: 22,
    overflow: "hidden",
  },

  /* Inner padding of the FlatList */
  listContent: {
    paddingHorizontal: scale(6),
    paddingTop: scale(6),
    paddingBottom: scale(12),
  },

  /* ✅ Each card is its own rounded rectangle with a 2px seam */
  notificationRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: "#FFFFFF",
    paddingVertical: scale(14),
    paddingHorizontal: scale(14),
    marginBottom: 2,
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "#F3F4F6",
    position: "relative",
  },

  iconCircle: {
    width: scale(48),
    height: scale(48),
    borderRadius: scale(24),
    alignItems: "center",
    justifyContent: "center",
    marginRight: scale(12),
    flexShrink: 0,
  },

  cardContent: { flex: 1, minWidth: 0 },

  cardTopRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    marginBottom: 2,
  },
  notificationTitle: {
    flex: 1,
    fontSize: scale(13.5),
    lineHeight: scale(18),
    color: "#111827",
    fontWeight: "600",
    marginRight: 8,
  },
  unreadTitle: { fontWeight: "700", color: "#0F172A" },
  notificationTime: {
    fontSize: scale(11),
    color: "#9CA3AF",
    fontWeight: "400",
    flexShrink: 0,
    marginTop: 2,
  },
  notificationBody: {
    fontSize: scale(12),
    lineHeight: scale(16.5),
    color: "#6B7280",
    fontWeight: "400",
    marginBottom: 6,
  },
  actionText: {
    fontSize: scale(12.5),
    fontWeight: "700",
    marginTop: 2,
  },

  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#E53935",
    marginLeft: 8,
    marginTop: scale(20),
    flexShrink: 0,
  },

  loading: { flex: 1, justifyContent: "center", alignItems: "center" },

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