import React, { useEffect, useState } from 'react';
import { View, TouchableOpacity, StyleSheet, Text, Modal, SafeAreaView, ScrollView, Image, Dimensions } from 'react-native';
import Ionicons from "react-native-vector-icons/Ionicons";
import MaterialIcons from "react-native-vector-icons/MaterialIcons";
import { StackActions, useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { authService } from '../../src/services/AuthService';
import { getCartItems } from '../api/cartApi';
import { getFavoriteProducts } from '../api/favoriteApi';
import eventBus from '../../src/services/eventBus';

const { width: screenWidth } = Dimensions.get('window');

type Tab = {
  name: 'Dashboard' | 'CartPage' | 'FavoritesPage' | 'AccountPage';
  icon: 'home-outline' | 'cart-outline' | 'heart-outline' | 'person-outline';
};

const tabs: Tab[] = [
  { name: 'Dashboard', icon: 'home-outline' },
  { name: 'CartPage', icon: 'cart-outline' },
  { name: 'FavoritesPage', icon: 'heart-outline' },
  { name: 'AccountPage', icon: 'person-outline' },
];

interface Props {
  activeRoute: string;
  onLogout: () => void;
}

export default function CustomBottomTabs({ activeRoute, onLogout }: Props) {
  const navigation = useNavigation<any>();
  const [username, setUsername] = useState<string | null>(null);
  const [email, setEmail] = useState<string | null>(null);
  const [menuVisible, setMenuVisible] = useState(false);
  const [cartCount, setCartCount] = useState(0);
  const [favoriteCount, setFavoriteCount] = useState(0);

  useEffect(() => {
    const loadUserData = async () => {
      const name = await AsyncStorage.getItem('name');
      const mail = await AsyncStorage.getItem('email');
      setUsername(name);
      setEmail(mail);
    };

    const fetchCounts = async () => {
      try {
        const cartItems = await getCartItems();
        setCartCount(cartItems.length || 0);

        const favItems = await getFavoriteProducts();
        setFavoriteCount(favItems.length || 0);

      } catch (err) {
        console.log("Error fetching counts:", err);
      }
    };

    const listener = (data) => {
      console.log("item removed", data);
      fetchCounts();
    };

    eventBus.on("ITEM_REMOVED", listener);

    fetchCounts();
    loadUserData();

    return () => {
      eventBus.off("ITEM_REMOVED", listener);
    };

  }, []);

  const redirectToProfile = () => {
    navigation.navigate('Profile');
    setMenuVisible(false)
  }
  const redirectToWallets = () => {
    navigation.navigate('WalletsPage');
    setMenuVisible(false)
  }
  const redirectToOrders = () => {
    navigation.navigate('OrdersPage');
    setMenuVisible(false)
  }
  const redirectToSettings = () => {
    navigation.navigate('SettingsPage');
    setMenuVisible(false)
  }
  const redirectToFavorites = () => {
    navigation.navigate('FavoritesPage');
    setMenuVisible(false)
  }
  const redirectToPrivacy = () => {
    navigation.navigate('PrivacyPolicy');
    setMenuVisible(false)
  }
  const redirectToAboutUs = () => {
    navigation.navigate('AboutUs');
    setMenuVisible(false)
  }
  const navigateTab = (tabName: string) => {
    if (tabName === 'Account') {
      navigation.navigate("AccountPage")
    } else {
      navigation.navigate(tabName);
    }
  };
  const handleLogout = async () => {
    await authService.logout();
    onLogout()
    navigation.dispatch(StackActions.replace('Login'));
  };
  return (
    <>
      {/* Bottom Tab Overlay */}
      <View style={styles.container}>
        {tabs.map((tab) => {
          const isActive = activeRoute === tab.name;
          const badgeCount =
            tab.name === "CartPage" ? cartCount :
              tab.name === "FavoritesPage" ? favoriteCount :
                0;

          return (
            <TouchableOpacity
              key={tab.name}
              style={styles.tab}
              onPress={() => navigateTab(tab.name)}
              activeOpacity={0.7}
            >
              <View style={{ position: "relative" }}>
                <Ionicons
                  name={tab.icon}
                  size={28}
                  color={isActive ? "#96252A" : "#adadad"}
                />
                {badgeCount > 0 && (
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>{badgeCount}</Text>
                  </View>
                )}
              </View>

              <Text style={[styles.label, { color: isActive ? "#96252A" : "#adadad" }]}>
                {tab.name.replace("Page", "")}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Side Menu Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={menuVisible}
        onRequestClose={() => setMenuVisible(false)}
      >
        <View style={styles.menuContainer}>
          <View style={styles.menuContent}>
            <TouchableOpacity onPress={() => setMenuVisible(false)}>
              <Text style={styles.menuCloseText}>Close</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={redirectToProfile} style={styles.menuItem}>
              <View style={styles.profileContainer}>
                <Image
                  source={require('../../assets/images/profile.png')}
                  style={styles.profileImage}
                />
                <View style={styles.rightColumn}>
                  <Text style={styles.userName}>{username}</Text>
                  <Text style={styles.userDesignation}>{email}</Text>
                </View>
              </View>
            </TouchableOpacity>

            <ScrollView showsVerticalScrollIndicator={false}>
              <TouchableOpacity onPress={redirectToFavorites} style={styles.menuItem}>
                <MaterialIcons name="favorite-border" size={24} color="#96252A" />
                <Text style={styles.menuItemText}>My Favorites</Text>
              </TouchableOpacity>

              <TouchableOpacity onPress={redirectToWallets} style={styles.menuItem}>
                <Ionicons name="wallet-outline" size={24} color="#96252A" />
                <Text style={styles.menuItemText}>Wallets</Text>
              </TouchableOpacity>

              <TouchableOpacity onPress={redirectToOrders} style={styles.menuItem}>
                <MaterialIcons name="shopping-cart" size={24} color="#96252A" />
                <Text style={styles.menuItemText}>My Orders</Text>
              </TouchableOpacity>

              <TouchableOpacity onPress={redirectToProfile} style={styles.menuItem}>
                <Ionicons name="person-outline" size={24} color="#96252A" />
                <Text style={styles.menuItemText}>Profiles</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.menuItem} onPress={redirectToAboutUs}>
                <Ionicons name="document-text-outline" size={24} color="#96252A" />
                <Text style={styles.menuItemText}>About Us</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.menuItem} onPress={redirectToPrivacy}>
                <Ionicons name="lock-closed-outline" size={24} color="#96252A" />
                <Text style={styles.menuItemText}>Privacy policy</Text>
              </TouchableOpacity>

              <TouchableOpacity onPress={redirectToSettings} style={styles.menuItem}>
                <Ionicons name="settings-outline" size={24} color="#96252A" />
                <Text style={styles.menuItemText}>Settings</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleLogout}
                style={styles.logOut}
              >
                <Ionicons name="log-out-outline" size={24} color="#96252A" />
                <Text style={styles.menuItemText}>Log out</Text>
              </TouchableOpacity>

              <View style={styles.brandLogo}>
                <Image source={require('../../assets/images/Vector.png')} />
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    height: 60,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
    position: 'absolute',
    bottom: 35,
    left: 0,
    right: 0,
    zIndex: 10,
    elevation: 10,
  },
  tab: {
    alignItems: 'center',
    paddingVertical: 4,
  },
  label: {
    fontSize: 11,
    marginTop: 2,
    fontWeight: '500',
  },
  menuContainer: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'flex-start',
  },
  menuContent: {
    width: screenWidth * 0.75,
    height: '100%',
    backgroundColor: '#fff',
    padding: 20,
  },
  menuCloseText: {
    fontSize: 16,
    color: '#96252A',
    textAlign: 'right',
    marginBottom: 20,
    fontWeight: '600',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
  },
  menuItemText: {
    fontSize: 16,
    marginLeft: 15,
    color: '#333',
  },
  profileContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  profileImage: {
    width: 60,
    height: 60,
    borderRadius: 30,
  },
  rightColumn: {
    marginLeft: 10,
    justifyContent: 'center',
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: 'bold',
    flexShrink: 1,
    flexWrap: 'wrap',
  },
  userDesignation: {
    fontSize: 14,
    color: '#666',
  },
  logOut: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    marginTop: 60
  },
  brandLogo: {
    marginTop: '43%',
  },
  badge: {
    position: "absolute",
    top: -5,
    right: -10,
    backgroundColor: "#E53935",
    borderRadius: 20,
    minWidth: 18,
    height: 18,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 10,
    paddingHorizontal: 4,
  },
  badgeText: {
    color: "white",
    fontSize: 10,
    fontWeight: "bold",
  },
});