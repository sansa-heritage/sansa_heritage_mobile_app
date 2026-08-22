import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Switch,
  TouchableOpacity,
  Alert,
  ScrollView,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import config from '../../config/config';

const SettingsScreen = () => {
  const navigation = useNavigation();
  const [loading, setLoading] = useState(false);
  
  // Notification preferences
  const [preferences, setPreferences] = useState({
    orderUpdates: true,
    promotions: true,
    paymentAlerts: true,
    deliveryUpdates: true,
    systemAnnouncements: true,
    pushNotifications: true,
    emailNotifications: false,
  });

  useEffect(() => {
    loadPreferences();
  }, []);

  const loadPreferences = async () => {
    try {
      const token = await AsyncStorage.getItem('authToken');
      if (!token) return;

      const response = await fetch(`${config.baseURL}api/notifications/preferences`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await response.json();
      if (data.success) {
        setPreferences(data.preferences);
      }
    } catch (error) {
      console.error('Error loading preferences:', error);
    }
  };

  const updatePreference = async (key: string, value: boolean) => {
    try {
      setLoading(true);
      const token = await AsyncStorage.getItem('authToken');
      if (!token) return;

      const updatedPreferences = { ...preferences, [key]: value };
      
      const response = await fetch(`${config.baseURL}api/notifications/preferences`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(updatedPreferences),
      });
      
      const data = await response.json();
      if (data.success) {
        setPreferences(updatedPreferences);
      }
    } catch (error) {
      console.error('Error updating preference:', error);
      Alert.alert('Error', 'Failed to update preferences');
    } finally {
      setLoading(false);
    }
  };

  const navigateTo = (screen: string) => {
    navigation.navigate(screen as never);
  };

  // Support & Information items (with chevron)
  const supportItems = [
    { id: 'email-support', label: 'Email Support', icon: 'mail-outline' },
    { id: 'faq', label: 'FAQ', icon: 'help-circle-outline' },
    { id: 'privacy', label: 'Privacy Statement', icon: 'lock-closed-outline' },
    { id: 'terms', label: 'Terms & Conditions', icon: 'document-text-outline' },
  ];

  // Notification items (with toggle switches)
  const notificationItems = [
    { id: 'pushNotifications', label: 'Push Notifications', icon: 'notifications-outline' },
    { id: 'orderUpdates', label: 'Order Updates', icon: 'cart-outline' },
    { id: 'promotions', label: 'Promotions & Offers', icon: 'pricetag-outline' },
    { id: 'paymentAlerts', label: 'Payment Alerts', icon: 'card-outline' },
    { id: 'deliveryUpdates', label: 'Delivery Updates', icon: 'car-outline' },
    { id: 'systemAnnouncements', label: 'System Announcements', icon: 'megaphone-outline' },
    { id: 'emailNotifications', label: 'Email Notifications', icon: 'mail-outline' },
  ];

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#F6F6F6" />
      <ScrollView 
        style={styles.container}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Header */}
        {/* <Text style={styles.header}>Settings</Text> */}

        {/* Support & Information Section */}
        <Text style={styles.sectionTitle}>Support & Information</Text>
        <View style={styles.card}>
          {supportItems.map((item, index) => (
            <TouchableOpacity
              key={item.id}
              style={[
                styles.menuItem,
                index === supportItems.length - 1 && styles.menuItemLast
              ]}
              onPress={() => {
                const screenMap: { [key: string]: string } = {
                  'email-support': 'EmailSupport',
                  'faq': 'FAQScreen',
                  'privacy': 'PrivacyPolicy',
                  'terms': 'TermsScreen',
                };
                navigateTo(screenMap[item.id]);
              }}
            >
              <View style={styles.menuLeft}>
                <Ionicons name={item.icon} size={22} color="#1C1C1E" />
                <Text style={styles.menuLabel}>{item.label}</Text>
              </View>
              <Ionicons name="chevron-forward-outline" size={20} color="#C0C0C0" />
            </TouchableOpacity>
          ))}
        </View>

        {/* Notifications Section */}
        <Text style={styles.sectionTitle}>Notifications</Text>
        <View style={styles.card}>
          {notificationItems.map((item, index) => (
            <View
              key={item.id}
              style={[
                styles.menuItem,
                index === notificationItems.length - 1 && styles.menuItemLast
              ]}
            >
              <View style={styles.menuLeft}>
                <Ionicons name={item.icon} size={22} color="#1C1C1E" />
                <Text style={styles.menuLabel}>{item.label}</Text>
              </View>
              <Switch
                trackColor={{ false: '#D1D1D6', true: '#1C1C1E' }}
                thumbColor={preferences[item.id as keyof typeof preferences] ? '#FFFFFF' : '#FFFFFF'}
                onValueChange={(value) => updatePreference(item.id, value)}
                value={preferences[item.id as keyof typeof preferences] || false}
                disabled={loading}
                ios_backgroundColor="#D1D1D6"
              />
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default SettingsScreen;

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
    paddingBottom: 60, // Increased for better scrolling
    paddingTop: 8,
  },

  // Header
  header: {
    fontSize: 28,
    fontWeight: '700',
    color: '#151515',
    marginTop: 8,
    marginBottom: 24,
  },

  // Section Title
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#8E8E93',
    marginBottom: 10,
    letterSpacing: 0.5,
  },

  // Card
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    marginBottom: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },

  // Menu Item
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
    minHeight: 50, // Ensures consistent height
  },
  menuItemLast: {
    borderBottomWidth: 0,
  },
  menuLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  menuLabel: {
    fontSize: 15,
    color: '#1C1C1E',
    fontWeight: '400',
    marginLeft: 14,
    flex: 1,
  },
});