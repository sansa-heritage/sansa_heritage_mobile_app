import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image, ScrollView, Dimensions } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { authService } from './apiHelper/AuthService';
import { StackActions } from '@react-navigation/native';
import { getUserDetails } from './apiHelper/apiService';

const { width } = Dimensions.get('window');
interface Props {
  onLogout: () => void;
}
export default function AccountPage({ navigation, onLogout }: any) {
  const [username, setUsername] = useState<string | null>(null);
  const [email, setEmail] = useState<string | null>(null);
  const [phone, setPhone] = useState<string | null>(null);

  useEffect(() => {
    const loadUserData = async () => {
      const userDetails = await getUserDetails();
      setUsername(userDetails?.username || "Guest");
      setEmail(userDetails?.email);
      // setPhone(ph);
    };
    loadUserData();
  }, []);
  const handleLogout = async () => {
    await authService.logout();
    onLogout()
    navigation.dispatch(StackActions.replace('Login'));
  };


  const menuItems = [
    // { label: 'My Favorites', onPress: () => navigation.navigate('FavoritesPage') },
    // { label: 'Profiles', onPress: () => navigation.navigate('Profile') },
    { label: 'About Us', onPress: () => navigation.navigate('AboutUs') },
    { label: 'Privacy Policy', onPress: () => navigation.navigate('PrivacyPolicy') },
    { label: 'Settings', onPress: () => navigation.navigate('SettingsPage') },
    { label: 'Orders', onPress: () => navigation.navigate('OrdersPage') },
    { label: 'Saved Cards', onPress: () => navigation.navigate('CardsScreen') },
    { label: 'Address', onPress: () => navigation.navigate('AddressFormPage') },
    // { label: 'Notifications', onPress: () => navigation.navigate('NotificationScreen') },
    // { label: 'FAQ', onPress: () => navigation.navigate('FAQScreen') },
    { label: 'Terms & Conditions', onPress: () => navigation.navigate('TermsScreen') },
    { label: 'Returns & Refund policy', onPress: () => navigation.navigate('TermsScreen') },
  ];

  return (
    <ScrollView style={styles.container}>
      <View style={styles.profileSection}>
        <View style={styles.profileCircle}>
          <Text style={styles.profileInitials}>
            {email ? email.charAt(0).toUpperCase() : 'A'}
          </Text>
        </View>
        <View style={styles.profileInfo}>
          <Text style={styles.profileName}>{username}</Text>
          <Text style={styles.profileEmail}>{email}</Text>
          <Text style={styles.profilePhone}>{phone}</Text>
        </View>
        <TouchableOpacity onPress={() => navigation.navigate('UpdateProfileScreen')}>
          <Text style={styles.editText}>Edit</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.menuContainer}>
        {menuItems.map((item, index) => (
          <TouchableOpacity key={index} style={styles.menuItem} onPress={item.onPress}>
            <View style={{ flex: 1 }}>
              <Text style={styles.menuLabel}>{item.label}</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#adadad" />
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.logoutContainer}>
        <TouchableOpacity style={styles.button} onPress={handleLogout}>
          <Text style={styles.buttonText}>Logout</Text>
        </TouchableOpacity>
        <Text style={styles.versionText}>Version 0.0.1 Build 100</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  profileSection: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  profileCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#151515',
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileInitials: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
  },
  profileInfo: {
    flex: 1,
    marginLeft: 12,
  },
  profileName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#151515',
  },
  profileEmail: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  profilePhone: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  editText: {
    color: '#007bff',
    fontSize: 14,
    fontWeight: '600',
  },
  menuContainer: {
    marginTop: 16,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  menuLabel: {
    fontSize: 16,
    color: '#151515',
  },
  menuSubText: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  logoutContainer: {
    alignItems: 'center',
    marginTop: 30,
    marginBottom: 100
  },
  button: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 4,
    paddingVertical: 12,
    paddingHorizontal: 135,
    backgroundColor: '#fff',
  },
  buttonText: {
    fontSize: 16,
    color: '#000',
    textAlign: 'center',
  },
  versionText: {
    marginTop: 8,
    fontSize: 12,
    color: '#888',
  },
});
