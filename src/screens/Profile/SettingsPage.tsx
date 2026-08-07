import React, { useState } from 'react';
import { View, Text, StyleSheet, Switch, TouchableOpacity, Image } from 'react-native';
import MaterialIcons from "react-native-vector-icons/MaterialIcons";

const SettingsScreen = () => {
  const [isNotificationEnabled, setIsNotificationEnabled] = useState(false);
  const [isUpdateEnabled, setIsUpdateEnabled] = useState(false);

  const toggleNotificationSwitch = () => setIsNotificationEnabled(previousState => !previousState);
  const toggleUpdateSwitch = () => setIsUpdateEnabled(previousState => !previousState);

  return (
    <View style={styles.screen}>
      <Text style={styles.header}>Settings</Text>

      <TouchableOpacity style={styles.settingItem}>
        <View style={styles.iconTextContainer}>
          <MaterialIcons name="email" size={24} color="orange" />
          <Text style={styles.itemText}>Email Support</Text>
        </View>
        <MaterialIcons name="arrow-forward-ios" size={20} color="gray" />
      </TouchableOpacity>

      <TouchableOpacity style={styles.settingItem}>
        <View style={styles.iconTextContainer}>
          <MaterialIcons name="help-outline" size={24} color="orange" />
          <Text style={styles.itemText}>FAQ</Text>
        </View>
        <MaterialIcons name="arrow-forward-ios" size={20} color="gray" />
      </TouchableOpacity>

      <TouchableOpacity style={styles.settingItem}>
        <View style={styles.iconTextContainer}>
          <MaterialIcons name="lock" size={24} color="orange" />
          <Text style={styles.itemText}>Privacy Statement</Text>
        </View>
        <MaterialIcons name="arrow-forward-ios" size={20} color="gray" />
      </TouchableOpacity>

      <View style={styles.settingItem}>
        <View style={styles.iconTextContainer}>
          <MaterialIcons name="notifications" size={24} color="orange" />
          <Text style={styles.itemText}>Notification</Text>
        </View>
        <Switch
          trackColor={{ false: '#767577', true: 'orange' }}
          thumbColor={isNotificationEnabled ? 'white' : '#f4f3f4'}
          onValueChange={toggleNotificationSwitch}
          value={isNotificationEnabled}
        />
      </View>

      <View style={styles.settingItem}>
        <View style={styles.iconTextContainer}>
          <MaterialIcons name="update" size={24} color="orange" />
          <Text style={styles.itemText}>Update</Text>
        </View>
        <Switch
          trackColor={{ false: '#767577', true: 'orange' }}
          thumbColor={isUpdateEnabled ? 'white' : '#f4f3f4'}
          onValueChange={toggleUpdateSwitch}
          value={isUpdateEnabled}
        />
      </View>
    </View>
  );
};

export default SettingsScreen;

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
});
