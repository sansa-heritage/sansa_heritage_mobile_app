import React, { useEffect, useState } from "react";
import {
  View,
  TouchableOpacity,
  StyleSheet,
  Text,
  SafeAreaView,
  StatusBar,
  Platform,
} from "react-native";
import Ionicons from "react-native-vector-icons/Ionicons";
import MaterialIcons from "react-native-vector-icons/MaterialIcons";
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from "../../models/types";
import { NotificationBadge } from "../NotificationBadge";
import { getFavoriteProducts } from "../../api/favoriteApi";
import { getCartItems } from "../../api/cartApi";
import eventBus from "../../services/eventBus";

type NavigationProp = StackNavigationProp<RootStackParamList>;

/* ================= DISPLAY NAME MAP ================= */

const getDisplayName = (routeName: string, params?: any): string => {
  if (routeName === 'CategoryScreen' && params?.displayTitle) {
    return params.displayTitle;
  }

  const routeMap: { [key: string]: string } = {
    'Profile': 'My Profile',
    'AccountPage': 'My Account',
    'AddressScreen': 'My Address',
    'AddressPage': 'My Address',
    'OrdersPage': 'My Orders',
    'OrderDetails': 'Order Details',
    'SettingsPage': 'My Settings',
    'WalletsPage': 'My Wallet',
    'FavoritesPage': 'Wishlist',
    'FavoriteScreen': 'Wishlist',
    'NotificationScreen': 'My Notifications',
    'CartPage': 'My Cart',
    'CheckoutPage': 'Checkout',
    'PaymentPage': 'Payment',
    'PrivacyPolicy': 'Privacy Policy',
    'AboutUs': 'About Us',
    'TermsScreen': 'Terms & Conditions',
    'FAQScreen': 'FAQ',
    'ReturnRefundScreen': 'Return & Refund Policy',
    'ProductDetails': 'Product Details',
    'CategoryScreen': 'Categories',
    'Dashboard': 'Dashboard',
  };

  if (!routeMap[routeName]) {
    return (
      routeName
        .replace(/([A-Z])/g, ' $1')
        .replace(/Screen$/, '')
        .trim() || routeName
    );
  }

  return routeMap[routeName];
};

/* ================= COMPONENT ================= */

interface HeaderProps {
  currentRoute: string;
  routeParams?: any;
}

const Header: React.FC<HeaderProps> = ({ currentRoute, routeParams = {} }) => {
  const navigation = useNavigation<NavigationProp>();
  const isDashboard = currentRoute === "Dashboard";
  const isWishlist =
    currentRoute === "FavoritesPage" || currentRoute === "FavoriteScreen";
  const isCart = currentRoute === "CartPage";
  const isOrders = currentRoute === "OrdersPage";
  const isOrderDetails = currentRoute === "OrderDetails";

  // ✅ Hide notification bell on these pages
  const hideNotification =
    currentRoute === "CategoryScreen" ||
    currentRoute === "ProductDetails" ||
    currentRoute === "CartPage";

  // ✅ Hide ALL icons on AccountPage
  const hideAllIcons = currentRoute === "AccountPage";

  const [wishlistCount, setWishlistCount] = useState(0);
  const [cartCount, setCartCount] = useState(0);
  const [ordersCount, setOrdersCount] = useState(0);

  useEffect(() => {
    if (isDashboard || isOrderDetails) return;

    let mounted = true;

    const fetchCounts = async () => {
      try {
        const items = await getFavoriteProducts();
        const wishlistArr = Array.isArray(items)
          ? items
          : items?.items ?? items?.data ?? [];
        if (mounted) setWishlistCount(wishlistArr.length);
      } catch {
        if (mounted) setWishlistCount(0);
      }

      try {
        const cart = await getCartItems();
        const list = Array.isArray(cart)
          ? cart
          : cart?.items ?? cart?.data?.items ?? cart?.data ?? [];
        if (mounted) setCartCount(list.length);
      } catch {
        if (mounted) setCartCount(0);
      }
    };

    fetchCounts();

    const listener = () => fetchCounts();
    const ordersListener = (payload: any) => {
      if (!mounted) return;
      if (typeof payload?.count === 'number') {
        setOrdersCount(payload.count);
      }
    };

    eventBus.on("ITEM_REMOVED", listener);
    eventBus.on("FAVORITE_UPDATED", listener);
    eventBus.on("CART_UPDATED", listener);
    eventBus.on("ORDERS_UPDATED", ordersListener);

    return () => {
      mounted = false;
      eventBus.off("ITEM_REMOVED", listener);
      eventBus.off("FAVORITE_UPDATED", listener);
      eventBus.off("CART_UPDATED", listener);
      eventBus.off("ORDERS_UPDATED", ordersListener);
    };
  }, [currentRoute, isDashboard, isOrderDetails]);

  const navigateToNotifications = () => {
    navigation.navigate('NotificationScreen');
  };

  const goBack = () => {
    if (navigation.canGoBack()) {
      navigation.goBack();
    }
  };

  if (isDashboard) {
    return null;
  }

  /* ========== ORDER DETAILS — Only "Help" button ========== */
  if (isOrderDetails) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <StatusBar
          barStyle="dark-content"
          backgroundColor="#FFFFFF"
          translucent={false}
        />
        <View style={styles.header}>
          <View style={styles.leftRow}>
            <TouchableOpacity onPress={goBack} style={styles.backButton}>
              <MaterialIcons name="arrow-back" size={24} color="#151515" />
            </TouchableOpacity>

            <Text style={styles.pageTitle} numberOfLines={1}>
              {getDisplayName(currentRoute, routeParams)}
            </Text>
          </View>

          <View style={styles.rightSection}>
            <TouchableOpacity style={styles.helpBtn} activeOpacity={0.7}>
              <Ionicons name="headset-outline" size={20} color="#151515" />
              <Text style={styles.helpBtnText}>Help</Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  /* ========== DEFAULT HEADER (all other pages) ========== */

  const shouldShowBack = !isDashboard;

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar
        barStyle="dark-content"
        backgroundColor="#FFFFFF"
        translucent={false}
      />
      <View style={styles.header}>
        <View style={styles.leftRow}>
          {shouldShowBack && (
            <TouchableOpacity onPress={goBack} style={styles.backButton}>
              <MaterialIcons name="arrow-back" size={24} color="#151515" />
            </TouchableOpacity>
          )}

          <Text style={styles.pageTitle} numberOfLines={1}>
            {getDisplayName(currentRoute, routeParams)}

            {isCart && cartCount > 0 && (
              <Text style={styles.countText}> ({cartCount})</Text>
            )}

            {isWishlist && wishlistCount > 0 && (
              <Text style={styles.countText}> ({wishlistCount})</Text>
            )}

            {isOrders && ordersCount > 0 && (
              <Text style={styles.countText}> ({ordersCount})</Text>
            )}
          </Text>
        </View>

        <View style={styles.rightSection}>
          {/* ✅ Wishlist — hidden on Wishlist, Orders, and AccountPage */}
          {!isWishlist && !isOrders && !hideAllIcons && (
            <TouchableOpacity
              style={styles.iconButton}
              onPress={() => navigation.navigate('FavoritesPage')}
            >
              <View>
                <Ionicons name="heart-outline" size={26} color="#151515" />
                {wishlistCount > 0 && (
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>
                      {wishlistCount > 9 ? '9+' : wishlistCount}
                    </Text>
                  </View>
                )}
              </View>
            </TouchableOpacity>
          )}

          {/* ✅ Cart — hidden on Cart, Orders, and AccountPage */}
          {!isCart && !isOrders && !hideAllIcons && (
            <TouchableOpacity
              style={styles.iconButton}
              onPress={() => navigation.navigate('CartPage')}
            >
              <View>
                <Ionicons name="cart-outline" size={26} color="#151515" />
                {cartCount > 0 && (
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>
                      {cartCount > 9 ? '9+' : cartCount}
                    </Text>
                  </View>
                )}
              </View>
            </TouchableOpacity>
          )}

          {/* ✅ Notification bell — hidden on Category, ProductDetails, Cart, and AccountPage */}
          {!hideNotification && !hideAllIcons && (
            <NotificationBadge
              size={24}
              color="#151515"
              onPress={navigateToNotifications}
            />
          )}
        </View>
      </View>
    </SafeAreaView>
  );
};

/* ================= STYLES ================= */

const styles = StyleSheet.create({
  safeArea: {
    backgroundColor: '#FFFFFF',
    ...Platform.select({
      android: {
        paddingTop: StatusBar.currentHeight || 0,
      },
    }),
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#FFFFFF",
  },
  leftRow: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  backButton: {
    padding: 4,
    marginRight: 4,
  },
  pageTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: "#151515",
    marginLeft: 4,
    flexShrink: 1,
  },
  countText: {
    fontSize: 15,
    fontWeight: "500",
    color: "#888",
  },
  rightSection: {
    flexDirection: "row",
    alignItems: "center",
  },
  iconButton: {
    marginRight: 16,
    padding: 4,
  },
  badge: {
    position: 'absolute',
    top: -5,
    right: -10,
    minWidth: 18,
    height: 18,
    borderRadius: 20,
    backgroundColor: '#0C0C0C',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: 'bold',
  },

  helpBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1.2,
    borderColor: '#D5D5D5',
    backgroundColor: '#FFFFFF',
  },
  helpBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#151515',
  },
});

export default Header;