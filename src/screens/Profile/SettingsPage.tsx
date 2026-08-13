// import React, { useState } from 'react';
// import { View, Text, StyleSheet, Switch, TouchableOpacity, Image } from 'react-native';
// import MaterialIcons from "react-native-vector-icons/MaterialIcons";

// const SettingsScreen = () => {
//   const [isNotificationEnabled, setIsNotificationEnabled] = useState(false);
//   const [isUpdateEnabled, setIsUpdateEnabled] = useState(false);

//   const toggleNotificationSwitch = () => setIsNotificationEnabled(previousState => !previousState);
//   const toggleUpdateSwitch = () => setIsUpdateEnabled(previousState => !previousState);

//   return (
//     <View style={styles.screen}>
//       <Text style={styles.header}>Settings</Text>

//       <TouchableOpacity style={styles.settingItem}>
//         <View style={styles.iconTextContainer}>
//           <MaterialIcons name="email" size={24} color="orange" />
//           <Text style={styles.itemText}>Email Support</Text>
//         </View>
//         <MaterialIcons name="arrow-forward-ios" size={20} color="gray" />
//       </TouchableOpacity>

//       <TouchableOpacity style={styles.settingItem}>
//         <View style={styles.iconTextContainer}>
//           <MaterialIcons name="help-outline" size={24} color="orange" />
//           <Text style={styles.itemText}>FAQ</Text>
//         </View>
//         <MaterialIcons name="arrow-forward-ios" size={20} color="gray" />
//       </TouchableOpacity>

//       <TouchableOpacity style={styles.settingItem}>
//         <View style={styles.iconTextContainer}>
//           <MaterialIcons name="lock" size={24} color="orange" />
//           <Text style={styles.itemText}>Privacy Statement</Text>
//         </View>
//         <MaterialIcons name="arrow-forward-ios" size={20} color="gray" />
//       </TouchableOpacity>

//       <View style={styles.settingItem}>
//         <View style={styles.iconTextContainer}>
//           <MaterialIcons name="notifications" size={24} color="orange" />
//           <Text style={styles.itemText}>Notification</Text>
//         </View>
//         <Switch
//           trackColor={{ false: '#767577', true: 'orange' }}
//           thumbColor={isNotificationEnabled ? 'white' : '#f4f3f4'}
//           onValueChange={toggleNotificationSwitch}
//           value={isNotificationEnabled}
//         />
//       </View>

//       <View style={styles.settingItem}>
//         <View style={styles.iconTextContainer}>
//           <MaterialIcons name="update" size={24} color="orange" />
//           <Text style={styles.itemText}>Update</Text>
//         </View>
//         <Switch
//           trackColor={{ false: '#767577', true: 'orange' }}
//           thumbColor={isUpdateEnabled ? 'white' : '#f4f3f4'}
//           onValueChange={toggleUpdateSwitch}
//           value={isUpdateEnabled}
//         />
//       </View>
//     </View>
//   );
// };

// export default SettingsScreen;

// const styles = StyleSheet.create({
//   screen: {
//     flex: 1,
//     backgroundColor: '#fff',
//     paddingHorizontal: 20,
//     paddingTop: 20,
//   },
//   header: {
//     fontSize: 24,
//     fontWeight: 'bold',
//     marginBottom: 20,
//     textAlign: 'center',
//   },
//   settingItem: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     alignItems: 'center',
//     paddingVertical: 15,
//     borderBottomWidth: 1,
//     borderBottomColor: '#f4f4f4',
//   },
//   iconTextContainer: {
//     flexDirection: 'row',
//     alignItems: 'center',
//   },
//   itemText: {
//     marginLeft: 10,
//     fontSize: 16,
//     color: '#000',
//   },
// });

// src/screens/Profile/SettingsPage.tsx - Updated
import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  Switch, 
  TouchableOpacity, 
  Alert,
  ScrollView 
} from 'react-native';
import MaterialIcons from "react-native-vector-icons/MaterialIcons";
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
        Alert.alert('Success', 'Preferences updated successfully');
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

  return (
    <ScrollView style={styles.screen}>
      <Text style={styles.header}>Settings</Text>

      {/* Email Support */}
      <TouchableOpacity style={styles.settingItem} onPress={() => Alert.alert('Support', 'support@example.com')}>
        <View style={styles.iconTextContainer}>
          <MaterialIcons name="email" size={24} color="orange" />
          <Text style={styles.itemText}>Email Support</Text>
        </View>
        <MaterialIcons name="arrow-forward-ios" size={20} color="gray" />
      </TouchableOpacity>

      {/* FAQ */}
      <TouchableOpacity style={styles.settingItem} onPress={() => navigateTo('FAQScreen')}>
        <View style={styles.iconTextContainer}>
          <MaterialIcons name="help-outline" size={24} color="orange" />
          <Text style={styles.itemText}>FAQ</Text>
        </View>
        <MaterialIcons name="arrow-forward-ios" size={20} color="gray" />
      </TouchableOpacity>

      {/* Privacy Statement */}
      <TouchableOpacity style={styles.settingItem} onPress={() => navigateTo('PrivacyPolicy')}>
        <View style={styles.iconTextContainer}>
          <MaterialIcons name="lock" size={24} color="orange" />
          <Text style={styles.itemText}>Privacy Statement</Text>
        </View>
        <MaterialIcons name="arrow-forward-ios" size={20} color="gray" />
      </TouchableOpacity>

      {/* Terms & Conditions */}
      <TouchableOpacity style={styles.settingItem} onPress={() => navigateTo('TermsScreen')}>
        <View style={styles.iconTextContainer}>
          <MaterialIcons name="description" size={24} color="orange" />
          <Text style={styles.itemText}>Terms & Conditions</Text>
        </View>
        <MaterialIcons name="arrow-forward-ios" size={20} color="gray" />
      </TouchableOpacity>

      {/* Push Notifications */}
      <View style={styles.settingItem}>
        <View style={styles.iconTextContainer}>
          <MaterialIcons name="notifications" size={24} color="orange" />
          <Text style={styles.itemText}>Push Notifications</Text>
        </View>
        <Switch
          trackColor={{ false: '#767577', true: 'orange' }}
          thumbColor={preferences.pushNotifications ? 'white' : '#f4f3f4'}
          onValueChange={(value) => updatePreference('pushNotifications', value)}
          value={preferences.pushNotifications}
          disabled={loading}
        />
      </View>

      {/* Order Updates */}
      <View style={styles.settingItem}>
        <View style={styles.iconTextContainer}>
          <MaterialIcons name="shopping-cart" size={24} color="orange" />
          <Text style={styles.itemText}>Order Updates</Text>
        </View>
        <Switch
          trackColor={{ false: '#767577', true: 'orange' }}
          thumbColor={preferences.orderUpdates ? 'white' : '#f4f3f4'}
          onValueChange={(value) => updatePreference('orderUpdates', value)}
          value={preferences.orderUpdates}
          disabled={loading}
        />
      </View>

      {/* Promotions */}
      <View style={styles.settingItem}>
        <View style={styles.iconTextContainer}>
          <MaterialIcons name="local-offer" size={24} color="orange" />
          <Text style={styles.itemText}>Promotions & Offers</Text>
        </View>
        <Switch
          trackColor={{ false: '#767577', true: 'orange' }}
          thumbColor={preferences.promotions ? 'white' : '#f4f3f4'}
          onValueChange={(value) => updatePreference('promotions', value)}
          value={preferences.promotions}
          disabled={loading}
        />
      </View>

      {/* Payment Alerts */}
      <View style={styles.settingItem}>
        <View style={styles.iconTextContainer}>
          <MaterialIcons name="payment" size={24} color="orange" />
          <Text style={styles.itemText}>Payment Alerts</Text>
        </View>
        <Switch
          trackColor={{ false: '#767577', true: 'orange' }}
          thumbColor={preferences.paymentAlerts ? 'white' : '#f4f3f4'}
          onValueChange={(value) => updatePreference('paymentAlerts', value)}
          value={preferences.paymentAlerts}
          disabled={loading}
        />
      </View>

      {/* Delivery Updates */}
      <View style={styles.settingItem}>
        <View style={styles.iconTextContainer}>
          <MaterialIcons name="local-shipping" size={24} color="orange" />
          <Text style={styles.itemText}>Delivery Updates</Text>
        </View>
        <Switch
          trackColor={{ false: '#767577', true: 'orange' }}
          thumbColor={preferences.deliveryUpdates ? 'white' : '#f4f3f4'}
          onValueChange={(value) => updatePreference('deliveryUpdates', value)}
          value={preferences.deliveryUpdates}
          disabled={loading}
        />
      </View>

      {/* System Announcements */}
      <View style={styles.settingItem}>
        <View style={styles.iconTextContainer}>
          <MaterialIcons name="announcement" size={24} color="orange" />
          <Text style={styles.itemText}>System Announcements</Text>
        </View>
        <Switch
          trackColor={{ false: '#767577', true: 'orange' }}
          thumbColor={preferences.systemAnnouncements ? 'white' : '#f4f3f4'}
          onValueChange={(value) => updatePreference('systemAnnouncements', value)}
          value={preferences.systemAnnouncements}
          disabled={loading}
        />
      </View>

      {/* Email Notifications */}
      <View style={styles.settingItem}>
        <View style={styles.iconTextContainer}>
          <MaterialIcons name="email" size={24} color="orange" />
          <Text style={styles.itemText}>Email Notifications</Text>
        </View>
        <Switch
          trackColor={{ false: '#767577', true: 'orange' }}
          thumbColor={preferences.emailNotifications ? 'white' : '#f4f3f4'}
          onValueChange={(value) => updatePreference('emailNotifications', value)}
          value={preferences.emailNotifications}
          disabled={loading}
        />
      </View>

      {/* Admin Section (only visible to admins) */}
      <View style={styles.adminSection}>
        <Text style={styles.adminSectionTitle}>Admin</Text>
        <TouchableOpacity 
          style={styles.settingItem} 
          onPress={() => navigateTo('AdminNotifications')}
        >
          <View style={styles.iconTextContainer}>
            <MaterialIcons name="notifications-active" size={24} color="#2563EB" />
            <Text style={styles.itemText}>Manage Notifications</Text>
          </View>
          <MaterialIcons name="arrow-forward-ios" size={20} color="gray" />
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#fff',
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  header: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f4f4f4',
  },
  iconTextContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  itemText: {
    marginLeft: 10,
    fontSize: 16,
    color: '#000',
  },
  adminSection: {
    marginTop: 20,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  adminSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2563EB',
    marginBottom: 10,
  },
});

export default SettingsScreen;