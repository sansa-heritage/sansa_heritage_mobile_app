import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { StackActions, useNavigation } from '@react-navigation/native';
import { authService } from '../../services/AuthService';
import { getUserDetails } from '../../api/profileApi';
import DeviceInfo from 'react-native-device-info';

const AccountPage = ({ onLogout }: { onLogout: () => void }) => {
  const navigation = useNavigation<any>();

  const [username, setUsername] = useState<string>('Guest');
  const [email, setEmail] = useState<string>('');

  const APP_VERSION = `Version ${DeviceInfo.getVersion()}`;

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

  const handleLogout = async () => {
    try {
      await authService.logout();
      onLogout();
      navigation.dispatch(StackActions.replace('Login'));
    } catch (error) {
      console.log('Logout error:', error);
    }
  };

  // Split menu items into two groups
  const firstMenuItems = [
    { label: 'Orders', icon: 'receipt-outline', screen: 'OrdersPage' },
    { label: 'Address', icon: 'location-outline', screen: 'AddressScreen' },
    { label: 'Settings', icon: 'settings-outline', screen: 'SettingsPage' },
  ];

  const secondMenuItems = [
    { label: 'Privacy Policy', icon: 'lock-closed-outline', screen: 'PrivacyPolicy' },
    { label: 'Terms & Conditions', icon: 'document-text-outline', screen: 'TermsScreen' },
    { label: 'Returns & Refund Policy', icon: 'refresh-outline', screen: 'ReturnRefundScreen' },
    { label: 'About Us', icon: 'information-circle-outline', screen: 'AboutUs' },
    { label: 'Help & Support', icon: 'help-circle-outline', screen: 'HelpSupport' },
  ];

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#F6F6F6" />
      <ScrollView 
        style={styles.container} 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        bounces={true}
      >
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
            {/* <Text style={styles.editBtnText}>Edit Profile</Text> */}
          </TouchableOpacity>
        </View>

        {/* FIRST MENU CARD - Orders, Address, Settings */}
        <View style={styles.menuCard}>
          {firstMenuItems.map((item, index) => (
            <TouchableOpacity
              key={index}
              style={[
                styles.menuItem,
                index === firstMenuItems.length - 1 && styles.menuItemLast
              ]}
              onPress={() => navigation.navigate(item.screen)}
            >
              <View style={styles.menuIconWrapper}>
                <Ionicons name={item.icon} size={22} color="#333" />
              </View>
              <Text style={styles.menuLabel}>{item.label}</Text>
              <Ionicons name="chevron-forward" size={18} color="#C0C0C0" />
            </TouchableOpacity>
          ))}
        </View>

        {/* SECOND MENU CARD - Privacy Policy, Terms, Returns, About Us, Help & Support */}
        <View style={styles.menuCard}>
          {secondMenuItems.map((item, index) => (
            <TouchableOpacity
              key={index}
              style={[
                styles.menuItem,
                index === secondMenuItems.length - 1 && styles.menuItemLast
              ]}
              onPress={() => navigation.navigate(item.screen)}
            >
              <View style={styles.menuIconWrapper}>
                <Ionicons name={item.icon} size={22} color="#333" />
              </View>
              <Text style={styles.menuLabel}>{item.label}</Text>
              <Ionicons name="chevron-forward" size={18} color="#C0C0C0" />
            </TouchableOpacity>
          ))}
        </View>

        {/* LOGOUT BUTTON - Outlined style with red border */}
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={22} color="#E53935" />
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>

        {/* VERSION - Below logout button */}
        <Text style={styles.version}>{APP_VERSION}</Text>
      </ScrollView>
    </SafeAreaView>
  );
};

export default AccountPage;

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F6F6F6',
  },
  container: {
    flex: 1,
    backgroundColor: '#F6F6F6',
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 0,
    paddingBottom: 40,
    flexGrow: 1,
  },

  // Profile Card
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    padding: 16,
    borderRadius: 14,
    marginTop: 16,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
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
    color: '#151515',
  },
  email: {
    fontSize: 14,
    color: '#777',
    marginTop: 4,
  },
  editBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    backgroundColor: '#F5F5F5',
  },
  editBtnText: {
    fontSize: 12,
    color: '#333',
    marginLeft: 4,
    fontWeight: '500',
  },

  // Menu Cards
  menuCard: {
    backgroundColor: '#FFF',
    borderRadius: 14,
    marginBottom: 16,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  menuItemLast: {
    borderBottomWidth: 0,
  },
  menuIconWrapper: {
    width: 28,
    alignItems: 'center',
  },
  menuLabel: {
    flex: 1,
    fontSize: 15,
    marginLeft: 12,
    color: '#333',
    fontWeight: '500',
  },

  // Logout Button - Outlined with red border (matching image)
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFF',
    paddingVertical: 14,
    borderRadius: 14,
    marginTop: 8,
    marginBottom: 16,
    borderWidth: 1.5,
    borderColor: '#E53935',
    elevation: 1,
    shadowColor: '#000',
    shadowOpacity: 0.03,
    shadowRadius: 2,
    shadowOffset: { width: 0, height: 1 },
  },
  logoutText: {
    fontSize: 16,
    color: '#E53935',
    fontWeight: '600',
    marginLeft: 10,
  },

  // Version - Now visible below logout button
  version: {
    textAlign: 'center',
    fontSize: 12,
    color: '#999',
    marginTop: 4,
    marginBottom: 30,
    paddingBottom: 10,
  },
});