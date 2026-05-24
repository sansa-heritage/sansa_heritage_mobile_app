import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import {
  StackActions,
  useNavigation,
  CommonActions,
} from '@react-navigation/native';
import { authService } from './apiHelper/AuthService';
import { getUserDetails } from './apiHelper/apiService';
import DeviceInfo from 'react-native-device-info';

const AccountPage = ({ onLogout }: { onLogout: () => void }) => {
  const navigation = useNavigation<any>();

  // ✅ Hooks at TOP LEVEL (very important)
  const [username, setUsername] = useState<string>('Guest');
  const [email, setEmail] = useState<string>('');

  const APP_VERSION = `Version ${DeviceInfo.getVersion()}`;

  // ✅ useEffect at top level
  useEffect(() => {
    const loadUserData = async () => {
      try {
        const user = await getUserDetails();
        setUsername(user?.username || 'Guest');
        setEmail(user?.email || '');
      } catch (error) {
        console.log('Failed to load user:', error);
      }
    };

    loadUserData();
  }, []);

  // ✅ Normal function (NO hooks inside)
  // const handleLogout = async () => {
  //   try {
  //     await authService.logout();
  //     onLogout();
  //     navigation.dispatch(StackActions.replace('Login'));
  //   } catch (error) {
  //     console.log('Logout error:', error);
  //   }
  // };

  // const handleLogout = async () => {
  //   try {
  //     await authService.logout();
  //     onLogout(); // This triggers setIsLoggedIn(false) in App.tsx

  //     // Reset the entire navigation stack to Login screen
  //     // This works across different navigators
  //     navigation.dispatch(
  //       CommonActions.reset({
  //         index: 0,
  //         routes: [{ name: 'Login' }],
  //       }),
  //     );
  //   } catch (error) {
  //     console.log('Logout error:', error);
  //   }
  // };

  const handleLogout = async () => {
    try {
      await authService.logout();
      onLogout(); // This is ALL you need!
    } catch (error) {
      console.log('Logout error:', error);
    }
  };

  const menuItems = [
    { label: 'Orders', icon: 'receipt-outline', screen: 'OrdersPage' },
    { label: 'Address', icon: 'location-outline', screen: 'AddressFormPage' },
    { label: 'Settings', icon: 'settings-outline', screen: 'SettingsPage' },
    {
      label: 'Privacy Policy',
      icon: 'lock-closed-outline',
      screen: 'PrivacyPolicy',
    },
    {
      label: 'Terms & Conditions',
      icon: 'document-text-outline',
      screen: 'TermsScreen',
    },
    {
      label: 'Returns & Refund Policy',
      icon: 'refresh-outline',
      screen: 'ReturnRefundScreen',
    },
    {
      label: 'About Us',
      icon: 'information-circle-outline',
      screen: 'AboutUs',
    },
  ];

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* PROFILE CARD */}
      <View style={styles.profileCard}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {email ? email.charAt(0).toUpperCase() : 'A'}
          </Text>
        </View>

        <View style={styles.profileInfo}>
          <Text style={styles.name}>{username}</Text>
          <Text style={styles.email}>{email}</Text>
        </View>

        <TouchableOpacity
          style={styles.editBtn}
          onPress={() => navigation.navigate('UpdateProfileScreen')}
        >
          <Ionicons name="create-outline" size={18} color="#000" />
        </TouchableOpacity>
      </View>

      {/* MENU */}
      <View style={styles.menuCard}>
        {menuItems.map((item, index) => (
          <TouchableOpacity
            key={index}
            style={styles.menuItem}
            onPress={() => navigation.navigate(item.screen)}
          >
            <Ionicons name={item.icon} size={20} color="#333" />
            <Text style={styles.menuLabel}>{item.label}</Text>
            <Ionicons name="chevron-forward" size={18} color="#aaa" />
          </TouchableOpacity>
        ))}
      </View>

      {/* LOGOUT */}
      <View style={styles.logoutSection}>
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={20} color="#E53935" />
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>

        <Text style={styles.version}>{APP_VERSION}</Text>
      </View>
    </ScrollView>
  );
};

export default AccountPage;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F6F6F6',
    paddingHorizontal: 16,
  },

  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    padding: 16,
    borderRadius: 14,
    marginTop: 16,
    elevation: 4,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: '#FFF',
    fontSize: 26,
    fontWeight: '700',
  },
  profileInfo: {
    flex: 1,
    marginLeft: 14,
  },
  name: {
    fontSize: 17,
    fontWeight: '700',
  },
  email: {
    fontSize: 14,
    color: '#777',
    marginTop: 4,
  },
  editBtn: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: '#F1F1F1',
  },

  menuCard: {
    backgroundColor: '#FFF',
    borderRadius: 14,
    marginTop: 20,
    elevation: 3,
    overflow: 'hidden',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#EEE',
  },
  menuLabel: {
    flex: 1,
    fontSize: 15,
    marginLeft: 12,
    color: '#333',
  },

  logoutSection: {
    alignItems: 'center',
    marginTop: 30,
    marginBottom: 60,
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    paddingVertical: 14,
    paddingHorizontal: 40,
    borderRadius: 30,
    borderWidth: 1,
    borderColor: '#E53935',
  },
  logoutText: {
    fontSize: 16,
    color: '#E53935',
    fontWeight: '600',
    marginLeft: 8,
  },
  version: {
    marginTop: 12,
    fontSize: 12,
    color: '#999',
  },
});
