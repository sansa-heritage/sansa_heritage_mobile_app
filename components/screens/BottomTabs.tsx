import React, { useEffect, useState } from 'react';
import { View, TouchableOpacity, StyleSheet, Text, Modal, SafeAreaView, ScrollView, Image, Dimensions } from 'react-native';
import Ionicons from "react-native-vector-icons/Ionicons";
import MaterialIcons from "react-native-vector-icons/MaterialIcons";
import { StackActions, useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { authService } from '../apiHelper/AuthService';
import { getCartItems, getFavoriteProducts } from '../apiHelper/apiService';
import eventBus from '../apiHelper/eventBus';

const { width: screenWidth } = Dimensions.get('window');

type Tab = {
  name: 'Dashboard' | 'CartPage' | 'FavoritesPage' | 'AccountPage';
  icon: 'home-outline' | 'cart-outline' | 'heart-outline' | 'person-outline';
  activeIcon: 'home' | 'cart' | 'heart' | 'person';
};

const tabs: Tab[] = [
  { name: 'Dashboard', icon: 'home-outline', activeIcon: 'home' },
  { name: 'CartPage', icon: 'cart-outline', activeIcon: 'cart' },
  { name: 'FavoritesPage', icon: 'heart-outline', activeIcon: 'heart' },
  { name: 'AccountPage', icon: 'person-outline', activeIcon: 'person' },
];

interface Props {
  activeRoute: 'Dashboard' | 'CartPage' | 'FavoritesPage' | 'Profile';
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
    fetchCounts();    // refresh count after item removed
  };

  eventBus.on("ITEM_REMOVED", listener);   // ADD listener

  fetchCounts();
  loadUserData();

  return () => {
    eventBus.off("ITEM_REMOVED", listener); // REMOVE only on unmount
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
            >
              <View style={{ position: "relative" }}>
                <Ionicons
                  name={isActive ? tab.activeIcon : tab.icon}
                  size={28}
                  color={isActive ? "#151515" : "#adadad"}
                />
                {badgeCount > 0 && (
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>{badgeCount}</Text>
                  </View>
                )}
              </View>

              <Text style={[styles.label, { color: isActive ? "#151515" : "#adadad" }]}>
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

            {/* Close Button */}
            <TouchableOpacity onPress={() => setMenuVisible(false)}>
              <Text style={styles.menuCloseText}>Close</Text>
            </TouchableOpacity>

            {/* Profile Section */}
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

            <ScrollView>
              {/* Menu Items */}
              <TouchableOpacity onPress={redirectToFavorites} style={styles.menuItem}>
                <MaterialIcons name="favorite" size={24} color="orange" />
                <Text style={styles.menuItemText}>My Favorites</Text>
              </TouchableOpacity>

              <TouchableOpacity onPress={redirectToWallets} style={styles.menuItem}>
                <Ionicons name="wallet" size={24} color="orange" />
                <Text style={styles.menuItemText}>Wallets</Text>
              </TouchableOpacity>

              <TouchableOpacity onPress={redirectToOrders} style={styles.menuItem}>
                <MaterialIcons name="shopping-cart" size={24} color="orange" />
                <Text style={styles.menuItemText}>My Orders</Text>
              </TouchableOpacity>

              <TouchableOpacity onPress={redirectToProfile} style={styles.menuItem}>
                <Ionicons name="person" size={24} color="orange" />
                <Text style={styles.menuItemText}>Profiles</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.menuItem} onPress={redirectToAboutUs}>
                <Ionicons name="document" size={24} color="orange" />
                <Text style={styles.menuItemText}>About Us</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.menuItem} onPress={redirectToPrivacy}>
                <Ionicons name="lock-closed" size={24} color="orange" />
                <Text style={styles.menuItemText}>Privacy policy</Text>
              </TouchableOpacity>

              <TouchableOpacity onPress={redirectToSettings} style={styles.menuItem}>
                <Ionicons name="settings" size={24} color="orange" />
                <Text style={styles.menuItemText}>Settings</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={e => {
                  handleLogout()
                }}
                style={styles.logOut}
              >
                <Ionicons name="log-out" size={24} color="orange" />
                <Text style={styles.menuItemText}>Log out</Text>
              </TouchableOpacity>

              {/* Brand Logo */}
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
    borderTopColor: '#ddd',
    backgroundColor: '#fff',
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  tab: {
    alignItems: 'center',
  },
  label: {
    fontSize: 12,
    marginTop: 2,
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
    color: '#ff6f61',
    textAlign: 'right',
    marginBottom: 20,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
  },
  menuItemText: {
    fontSize: 16,
    marginLeft: 15,
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
    backgroundColor: "red",
    borderRadius: 20,
    width: 20,
    height: 20,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 10,
  },
  badgeText: {
    color: "white",
    fontSize: 12,
    fontWeight: "bold",
  },

});
