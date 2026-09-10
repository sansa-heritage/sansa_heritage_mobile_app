import React, { useEffect, useState } from "react";
import {
  View,
  Image,
  TouchableOpacity,
  StyleSheet,
  Text,
  SafeAreaView,
  StatusBar,
  Platform,
} from "react-native";
import MaterialIcons from "react-native-vector-icons/MaterialIcons";
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from "../../models/types";
import { NotificationBadge } from "../NotificationBadge";
import { getFavoriteProducts } from "../../api/favoriteApi";
import eventBus from "../../services/eventBus";

type NavigationProp = StackNavigationProp<RootStackParamList>;

// Route name to display name mapping
const getDisplayName = (routeName: string, params?: any): string => {
  if (routeName === 'CategoryScreen' && params?.displayTitle) {
    return params.displayTitle;
  }

  const routeMap: { [key: string]: string } = {
    // Profile related
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

    // Cart related
    'CartPage': 'My Cart',
    'CheckoutPage': 'Checkout',
    'PaymentPage': 'Payment',

    // Info pages
    'PrivacyPolicy': 'Privacy Policy',
    'AboutUs': 'About Us',
    'TermsScreen': 'Terms & Conditions',
    'FAQScreen': 'FAQ',
    'ReturnRefundScreen': 'Return & Refund Policy',

    // Product related
    'ProductDetails': 'Product Details',
    'CategoryScreen': 'Categories',

    // Dashboard
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

interface HeaderProps {
  currentRoute: string;
  routeParams?: any;
}

const Header: React.FC<HeaderProps> = ({ currentRoute, routeParams = {} }) => {
  const navigation = useNavigation<NavigationProp>();
  const isDashboard = currentRoute === "Dashboard";
  const isWishlist =
    currentRoute === "FavoritesPage" || currentRoute === "FavoriteScreen";

  // ✅ Wishlist count state
  const [wishlistCount, setWishlistCount] = useState(0);

  // ✅ Fetch count on route change + listen for updates
  useEffect(() => {
    let mounted = true;

    const fetchCount = async () => {
      try {
        const items = await getFavoriteProducts();
        if (mounted) setWishlistCount(items?.length || 0);
      } catch {
        if (mounted) setWishlistCount(0);
      }
    };

    fetchCount();

    const listener = () => fetchCount();
    eventBus.on("ITEM_REMOVED", listener);
    eventBus.on("FAVORITE_UPDATED", listener);

    return () => {
      mounted = false;
      eventBus.off("ITEM_REMOVED", listener);
      eventBus.off("FAVORITE_UPDATED", listener);
    };
  }, [currentRoute]);

  const navigateToNotifications = () => {
    navigation.navigate('NotificationScreen');
  };

  const goBack = () => {
    if (navigation.canGoBack()) {
      navigation.goBack();
    }
  };

  const shouldShowBack = !isDashboard;

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar
        barStyle="dark-content"
        backgroundColor="#FFFFFF"
        translucent={false}
      />
      <View style={styles.header}>
        {isDashboard ? (
          <Image
            source={require("../../../assets/images/logo.png")}
            style={styles.logo}
            resizeMode="contain"
          />
        ) : (
          <View style={styles.leftRow}>
            {shouldShowBack && (
              <TouchableOpacity onPress={goBack} style={styles.backButton}>
                <MaterialIcons name="arrow-back" size={24} color="#151515" />
              </TouchableOpacity>
            )}

            {/* ✅ Title + (count) for Wishlist only */}
            <Text style={styles.pageTitle}>
              {getDisplayName(currentRoute, routeParams)}
              {isWishlist && wishlistCount > 0 && (
                <Text style={styles.countText}> ({wishlistCount})</Text>
              )}
            </Text>
          </View>
        )}

        <View style={styles.rightSection}>
          <TouchableOpacity
            style={styles.iconButton}
            onPress={() => navigation.navigate('FavoritesPage')}
          >
            <MaterialIcons name="favorite-border" size={24} color="#151515" />
          </TouchableOpacity>
          <NotificationBadge
            size={24}
            color="#151515"
            onPress={navigateToNotifications}
          />
        </View>
      </View>
    </SafeAreaView>
  );
};

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
    fontSize: 18,
    fontWeight: "600",
    color: "#151515",
    marginLeft: 4,
  },
  // ✅ Count style inside the title
  countText: {
    fontSize: 15,
    fontWeight: "500",
    color: "#888",
  },
  logo: {
    width: 100,
    height: 36,
  },
  rightSection: {
    flexDirection: "row",
    alignItems: "center",
  },
  iconButton: {
    marginRight: 16,
    padding: 4,
  },
});

export default Header;