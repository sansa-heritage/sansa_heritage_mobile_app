import config from '../config/config';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { StackActions, useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import React, { useEffect, useState } from 'react';
import { View, Text, Image, StyleSheet, ImageBackground, Alert, TouchableOpacity, ScrollView } from 'react-native';
import { Address } from './models/address';
import { authService } from './apiHelper/AuthService';
interface ProfileProps {
  onLogout: () => void;
}
const ProfileScreen: React.FC<ProfileProps> = ({ onLogout }) => {
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [username, setUsername] = useState<string | null>(null);
  const [email, setEmail] = useState<string | null>(null);
  const navigation = useNavigation<StackNavigationProp<any>>();
  const handleLogout = async () => {
    await authService.logout();
    onLogout()
    navigation.dispatch(StackActions.replace('Login'));
  };
  // Fetch addresses from API
  const fetchAddresses = async () => {
    const storedToken = await AsyncStorage.getItem('authToken');
    const name = await AsyncStorage.getItem('username');
    const email = await AsyncStorage.getItem('email');
    console.log(name);

    setUsername(name);
    setEmail(email);

    try {
      const response = await fetch(`${config.baseURL}api/auth/addresses`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${storedToken}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch addresses');
      }

      const data = await response.json(); // Parse response to JSON
      console.log(data.addresses[0]);

      setAddresses(data.addresses || []); // Assuming data is of type Address[]
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to fetch addresses');

    };
  }


  useEffect(() => {
    fetchAddresses();
    console.log(username);

  }, []);
  return (
    <ScrollView
      style={{ flex: 1 }}
      contentContainerStyle={{ paddingBottom: 80 }} // space for footer/tabs
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.container}>
        <View style={{ flexDirection: "row", justifyContent: "flex-end", padding: 10 }}>
          <TouchableOpacity onPress={ e => {
            handleLogout()
          }} style={{ paddingHorizontal: 10, paddingVertical: 5 }}>
            <Text style={{ color: "red", fontWeight: "bold" }}>Logout</Text>
          </TouchableOpacity>
        </View>


        <Text style={styles.header}>My Orders</Text>
        <View style={styles.profileContainer}>
          <ImageBackground
            source={require('../assets/images/Rectangle 426.png')}  // Background image
            style={styles.backgroundImage}
          >
            <Image
              source={require('../assets/images/profile.png')}   // Profile image
              style={styles.profileImage}
            />
          </ImageBackground>
        </View>

        {/* Name and Email */}
        <View style={styles.aboutInfo}>
          <Text style={styles.name}>{username !== 'undefined' ? username : 'Guest User'}</Text>
          <Text style={styles.email}>{email}</Text>
        </View>

        {/* Stats Section */}
        <View style={styles.statsContainer}>
          <View style={styles.statBox}>
            <Image source={require('../assets/images/Ticket.png')} style={styles.icon} />
            <Text style={styles.statNumber}>10+</Text>
            <Text style={styles.statLabel}>Progress order</Text>
          </View>
          <View style={styles.statBox}>
            <Image source={require('../assets/images/Ticket.png')} style={styles.icon} />
            <Text style={styles.statNumber}>5</Text>
            <Text style={styles.statLabel}>Promocodes</Text>
          </View>
          <View style={styles.statBox}>
            <Image source={require('../assets/images/star 5.png')} style={styles.icon} />
            <Text style={styles.statNumber}>4.5K</Text>
            <Text style={styles.statLabel}>Reviews</Text>
          </View>
        </View>

        <View>
          <Text style={styles.aboutInfoLabel}>Personal Information</Text>
        </View>

        <View style={styles.personalInfo}>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Name:</Text>
            <Text style={styles.infoValue}>{username !== 'undefined' ? username : 'Guest User'}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Email:</Text>
            <Text style={styles.infoValue}>{email}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Location:</Text>
            <Text style={styles.infoValue}>{addresses[0]?.street || "no record found"}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Zip Code:</Text>
            <Text style={styles.infoValue}>{addresses[0]?.zipCode || "no record found"}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Phone Number:</Text>
            <Text style={styles.infoValue}>{addresses[0]?.phone || "no record found"}</Text>
          </View>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#fff',
    width: '100%',
  },
  header: {
    fontSize: 20,
    fontWeight: 'bold',
    margin: 20,
    textAlign: 'center',
    zIndex: 1
  },
  profileContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  backgroundImage: {
    width: '100%', // Set the size for the background image
    height: 264,
    justifyContent: 'center', // Centers the profile image
    alignItems: 'center', // Centers the profile image
    marginTop: -100
  },
  profileImage: {
    width: 85, // Adjust the size of the profile image
    height: 85,
    borderRadius: 60,
    borderWidth: 2,
    borderColor: '#00A0FF',
    marginTop: 137,
  },
  name: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginVertical: 10,
  },
  email: {
    fontSize: 16,
    color: '#777',
    textAlign: 'center',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 20,
  },
  statBox: {
    alignItems: 'center',
    flex: 1,
    marginHorizontal: 5,
    paddingVertical: 10,
    backgroundColor: '#F7F7F7',
    borderRadius: 10,
  },
  icon: {
    width: 24,
    height: 24,
    marginBottom: 5,
  },
  statNumber: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  statLabel: {
    fontSize: 14,
    color: '#777',
  },
  aboutInfo: {
    marginTop: 35,
  },
  aboutInfoLabel: {
    fontWeight: 'bold',
    marginVertical: 10,
    fontSize: 18,
  },
  personalInfo: {
    backgroundColor: '#F7F7F7',
    padding: 15,
    borderRadius: 10,
    marginTop: 15,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 15, // Add vertical space between each row
  },
  infoLabel: {
    fontWeight: 'bold',
    color: '#333',
    fontSize: 16,
  },
  infoValue: {
    fontSize: 16,
    color: '#777',
  },
});

export default ProfileScreen;
