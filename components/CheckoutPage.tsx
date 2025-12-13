import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  TextInput,
  FlatList,
  ActivityIndicator,
  Alert,
  ScrollView,
} from 'react-native';

import Ionicons from "react-native-vector-icons/Ionicons";
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import config from '../config/config';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Image } from 'react-native';
import { placeOrder } from './apiHelper/apiService';
import { Address } from './models/address';
import { RootStackParamList } from './models/types';

const CheckoutScreen: React.FC = () => {
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [selectedAddress, setSelectedAddress] = useState<string | null>(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  type ProductCheckoutRouteProp = RouteProp<RootStackParamList, 'CheckoutPage'>;
  const [isUpdateModalVisible, setIsUpdateModalVisible] = useState(false);
  const route = useRoute<ProductCheckoutRouteProp>();
  // Destructure itemId from route.params
  const { billingDetails } = route.params;
  const totalPrice = billingDetails.valueOf() + 50;
  const merchantId = "<<Your merchant Id>>";
  const [newAddress, setNewAddress] = useState({
    street: '',
    city: '',
    state: '',
    country: '',
    zipCode: '',
    phone: ''
  });
  const [selectedAddressData, setSelectedAddressData] = useState<Address | null>(null); // For updating address
  const [loading, setLoading] = useState(false);
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();

  // Fetch addresses from API
  const fetchAddresses = async () => {
    const storedToken = await AsyncStorage.getItem('authToken');
    setLoading(true);
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

      const data = await response.json();

      setAddresses(data.addresses || []);
    } catch (error: any) {
    } finally {
      setLoading(false);
    }
  };

  const addAddress = async () => {
    const storedToken = await AsyncStorage.getItem('authToken');

    if (
      newAddress.street &&
      newAddress.city &&
      newAddress.state &&
      newAddress.country &&
      newAddress.zipCode &&
      newAddress.phone
    ) {
      try {
        const response = await fetch(`${config.baseURL}api/auth/addresses`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${storedToken}`,
          },
          body: JSON.stringify(newAddress),
        });
        if (response.ok) {
          fetchAddresses();

          setNewAddress({ street: '', city: '', state: '', country: '', zipCode: '', phone: '' });
          setIsModalVisible(false);
        } else {
          Alert.alert('Error', 'Failed to add address');
        }
      } catch (error: any) {
        Alert.alert('Error', error.message || 'Failed to add address');
      }
    } else {
      Alert.alert('Validation Error', 'All fields are required');
    }
  };

  const updateAddress = async () => {
    const storedToken = await AsyncStorage.getItem('authToken');

    if (
      newAddress.street &&
      newAddress.city &&
      newAddress.state &&
      newAddress.country &&
      newAddress.zipCode
    ) {
      try {
        // Send a PUT request to the API with the updated address data
        const response = await fetch(`${config.baseURL}api/auth/addresses/${selectedAddressData?._id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${storedToken}`,
          },
          body: JSON.stringify(newAddress),
        });

        if (response.ok) {
          fetchAddresses();
          setNewAddress({ street: '', city: '', state: '', country: '', zipCode: '', phone: '' });
          setIsUpdateModalVisible(false);
        } else {
          Alert.alert('Error', 'Failed to update address');
        }
      } catch (error: any) {
        Alert.alert('Error', error.message || 'Failed to update address');
      }
    } else {
      Alert.alert('Validation Error', 'All fields are required');
    }
  };




  useEffect(() => {
    fetchAddresses();
    fetchSelectedAddress();
  }, []);

  useEffect(() => {
    if (!isModalVisible) {
      setNewAddress({
        street: '',
        city: '',
        state: '',
        country: '',
        zipCode: '',
        phone: ''
      });
    }
  }, [isModalVisible]);

  useEffect(() => {
    if (!isUpdateModalVisible) {
      setNewAddress({
        street: '',
        city: '',
        state: '',
        country: '',
        zipCode: '',
        phone: ''
      });
    }


  }, [isUpdateModalVisible]);
  const redirectToConfirmationPage = () => {
    // navigation.navigate('PaymentPage');
    handlePayment()
  };

  const fetchSelectedAddress = async () => {

    const storedAddressString = await AsyncStorage.getItem("selectedAddress");
    console.log("storedAddressString");

    if (storedAddressString) {
      const storedAddress = JSON.parse(storedAddressString);
      console.log("address", storedAddress);
      setSelectedAddress(storedAddress._id);
    }

  }

  const handlePayment = async () => {

    if (selectedAddress && totalPrice) {
      const shipingAddress = addresses.filter(item => item._id === selectedAddress)
      try {
        const orderDetails = {
          shippingAddress: shipingAddress,
          totalPrice: totalPrice,
        };
        const orderData = await placeOrder(orderDetails);
        if (orderData) {
          navigation.navigate('PaymentPage', { orderId: orderData.order._id });
        }
      } catch (error: any) {
        Alert.alert('Order failed: ' + error.message);
      }
    }
  };
  return (
    <ScrollView contentContainerStyle={{ paddingBottom: 70 }}>
      <View style={styles.container}>
        <Text style={styles.title}>Checkout</Text>
        <Text style={styles.sectionTitle}>Delivery Address</Text>
        {loading ? (
          <ActivityIndicator size="large" color="orange" />
        ) : addresses && addresses.length > 0 ? (
          <FlatList
            data={addresses}
            keyExtractor={(item) => item._id.toString()}
            renderItem={({ item }) => (

              <View>
                <TouchableOpacity
                  style={[
                    styles.addressBox,
                    selectedAddress === item._id && styles.selectedBox,
                  ]}
                  onPress={() => setSelectedAddress(item._id)}
                >
                  <View style={styles.row}>
                    <View style={styles.radioAndTitle}>
                      <Ionicons
                        name={
                          selectedAddress === item._id
                            ? 'checkmark-circle'
                            : 'ellipse-outline'
                        }
                        size={24}
                        color={selectedAddress === item._id ? 'orange' : 'grey'}
                      />
                      <Text style={styles.addressTitle}>{item.street}</Text>
                    </View>
                  </View>

                  <Text style={styles.addressInfo}>{item.city}</Text>
                  <Text style={styles.addressInfo}>{item.state}</Text>
                  <Text style={styles.addressInfo}>{item.country}</Text>
                </TouchableOpacity>
              </View>
            )}
          />
        ) : (
          <View style={styles.noAddressContainer}>
            <Text style={styles.noAddressText}>
              No address found. Please add one.
            </Text>
          </View>
        )}
        {/* Add Address Button */}
        <TouchableOpacity style={styles.addButton} onPress={() => {
          setNewAddress({
            street: "",
            city: "",
            state: "",
            country: "",
            zipCode: "",
            phone: "",
          });
          setIsModalVisible(true);
        }}>
          <Text style={styles.addButtonText}>+ Add Address</Text>
        </TouchableOpacity>

        <Modal visible={isModalVisible} animationType="slide" transparent>
          <View style={styles.modalContainer}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Add New Address</Text>

              <Text style={styles.inputLabel}>Street</Text>
              <TextInput
                style={styles.input}
                maxLength={100}
                value={newAddress.street}
                onChangeText={(text) =>
                  setNewAddress((prev) => ({ ...prev, street: text }))
                }
              />

              <Text style={styles.inputLabel}>City</Text>
              <TextInput
                style={styles.input}
                maxLength={20}
                value={newAddress.city}
                onChangeText={(text) =>
                  setNewAddress((prev) => ({ ...prev, city: text }))
                }
              />

              <Text style={styles.inputLabel}>State</Text>
              <TextInput
                style={styles.input}
                maxLength={20}
                value={newAddress.state}
                onChangeText={(text) =>
                  setNewAddress((prev) => ({ ...prev, state: text }))
                }
              />

              <Text style={styles.inputLabel}>Country</Text>
              <TextInput
                style={styles.input}
                maxLength={20}
                value={newAddress.country}
                onChangeText={(text) =>
                  setNewAddress((prev) => ({ ...prev, country: text }))
                }
              />

              <Text style={styles.inputLabel}>Zip Code</Text>
              <TextInput
                style={styles.input}
                maxLength={6}
                keyboardType="numeric"
                value={newAddress.zipCode}
                onChangeText={(text) =>
                  setNewAddress((prev) => ({ ...prev, zipCode: text }))
                }
              />


              <Text style={styles.inputLabel}>Phone</Text>
              <View style={styles.phoneRow}>
                <Text style={styles.countryCode}>+91</Text>
                <TextInput
                  style={[styles.input, { flex: 1 }]}
                  maxLength={10}
                  keyboardType="phone-pad"
                  value={newAddress.phone}
                  onChangeText={(text) =>
                    setNewAddress((prev) => ({ ...prev, phone: text }))
                  }
                />
              </View>

              <View style={styles.modalActions}>
                <TouchableOpacity style={styles.actionButton} onPress={addAddress}>
                  <Text style={styles.actionText}>Save</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={() => setIsModalVisible(false)}
                >
                  <Text style={styles.actionText}>Cancel</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        <Modal visible={isUpdateModalVisible} animationType="slide" transparent>
          <View style={styles.modalContainer}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Update Address</Text>

              <Text style={styles.inputLabel}>Street</Text>
              <TextInput
                style={styles.input}
                maxLength={100}
                value={newAddress.street}
                onChangeText={(text) =>
                  setNewAddress((prev) => ({ ...prev, street: text }))
                }
              />


              <Text style={styles.inputLabel}>City</Text>
              <TextInput
                style={styles.input}
                maxLength={20}
                value={newAddress.city}
                onChangeText={(text) =>
                  setNewAddress((prev) => ({ ...prev, city: text }))
                }
              />

              <Text style={styles.inputLabel}>State</Text>
              <TextInput
                style={styles.input}
                maxLength={15}
                value={newAddress.state}
                onChangeText={(text) =>
                  setNewAddress((prev) => ({ ...prev, state: text }))
                }
              />

              <Text style={styles.inputLabel}>Country</Text>
              <TextInput
                style={styles.input}
                maxLength={20}
                value={newAddress.country}
                onChangeText={(text) =>
                  setNewAddress((prev) => ({ ...prev, country: text }))
                }
              />

              <Text style={styles.inputLabel}>Zip Code</Text>
              <TextInput
                style={styles.input}
                maxLength={6}
                keyboardType="numeric"
                value={newAddress.zipCode}
                onChangeText={(text) =>
                  setNewAddress((prev) => ({ ...prev, zipCode: text }))
                }
              />

              <Text style={styles.inputLabel}>Phone</Text>
              <View style={styles.phoneRow}>
                <Text style={styles.countryCode}>+91</Text>
                <TextInput
                  style={[styles.input, { flex: 1 }]}
                  maxLength={10}
                  keyboardType="phone-pad"
                  value={newAddress.phone}
                  onChangeText={(text) =>
                    setNewAddress((prev) => ({ ...prev, phone: text }))
                  }
                />
              </View>

              <View style={styles.modalActions}>
                <TouchableOpacity style={styles.actionButton} onPress={updateAddress}>
                  <Text style={styles.actionText}>Update</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={() => setIsUpdateModalVisible(false)}
                >
                  <Text style={styles.actionText}>Cancel</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>


        <Text style={styles.sectionTitle}>Billing information</Text>
        <View style={styles.billingContainer}>
          <View style={styles.billingRow}>
            <Text style={styles.billingLabel}>Delivery Fee :</Text>
            <Text style={styles.billingValue}>₹50</Text>
          </View>
          <View style={styles.billingRow}>
            <Text style={styles.billingLabel}>Subtotal :</Text>
            <Text style={styles.billingValue}>₹{String(billingDetails)}</Text>
          </View>
          <View style={styles.billingRow}>
            <Text style={styles.billingLabel}>Total :</Text>
            <Text style={styles.billingValue}>₹{totalPrice}</Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Payment Method</Text>
        <View style={styles.paymentMethods}>
          <Image source={require('../assets/images/ApplePay.png')} style={styles.paymentIcon} />
          <Image source={require('../assets/images/visa-logo.png')} style={styles.paymentIcon} />
          <Image source={require('../assets/images/Mastercard.png')} style={styles.paymentIcon} />
          <Image source={require('../assets/images/PayPal.png')} style={styles.paymentIcon} />
        </View>

        <TouchableOpacity style={styles.paymentButton} onPress={redirectToConfirmationPage}>
          <View style={styles.buttonContent}>
            <Image source={require('../assets/images/arrow-pointing-to-right-in-a-circle.png')} style={styles.paymentButtonImage} />
            <Text style={styles.paymentButtonText}>Swipe for Payment</Text>
          </View>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: 'white',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginVertical: 10,
  },
  addressBox: {
    padding: 16,
    borderWidth: 1,
    borderColor: 'gray',
    marginBottom: 8,
    borderRadius: 8,
  },
  selectedBox: {
    backgroundColor: 'rgba(255, 165, 0, 0.1)',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  radioAndTitle: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  pencilIcon: {
    marginTop: 0,
  },
  addressTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  addressInfo: {
    fontSize: 14,
    color: 'gray',
  },
  addButton: {
    marginTop: 20,
    padding: 10,
    backgroundColor: '#151515',
    borderRadius: 8,
  },
  addButtonText: {
    color: 'white',
    textAlign: 'center',
    fontSize: 16,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    width: '80%',
    padding: 20,
    backgroundColor: 'white',
    borderRadius: 8,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  noAddressContainer: {
    marginTop: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  noAddressText: {
    fontSize: 16,
    fontWeight: '500',
    color: 'grey',
  },
  input: {
    height: 40,
    borderColor: 'gray',
    borderWidth: 1,
    marginBottom: 10,
    paddingLeft: 8,
    borderRadius: 4,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  saveButton: {
    backgroundColor: '#151515',
    padding: 10,
    borderRadius: 4,
    width: '48%',
  },
  saveButtonText: {
    color: 'white',
    textAlign: 'center',
  },
  cancelButton: {
    backgroundColor: 'gray',
    padding: 10,
    borderRadius: 4,
    width: '48%',
  },
  cancelButtonText: {
    color: 'white',
    textAlign: 'center',
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
    color: '#333',
  },
  billingContainer: {
    backgroundColor: '#f9f9f9',
    borderRadius: 10,
    padding: 15,
    marginBottom: 20,
  },
  billingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 5,
  },
  billingLabel: {
    fontSize: 16,
    color: '#333',
  },
  billingValue: {
    fontSize: 16,
    fontWeight: '600',
  },
  paymentMethods: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 20,
  },
  paymentIcon: {
    width: 50,
    height: 30,
    resizeMode: 'contain',
  },
  paymentButton: {
    backgroundColor: '#151515',
    borderRadius: 30,
    paddingVertical: 15,
    alignItems: 'center',
    marginTop: 10,
  },
  buttonContent: {
    flexDirection: 'row', // Align items in a row
    alignItems: 'center', // Vertically center the image and text
  },
  paymentButtonImage: {
    width: 20, // Set image width
    height: 20, // Set image height
    marginRight: 10, // Add some space between image and text
  },
  paymentButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  actionButton: {
    backgroundColor: "black",
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    marginHorizontal: 10,
    flex: 1,
    alignItems: "center",
  },

  actionText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },

  phoneRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },

  countryCode: {
    marginRight: 10,
    fontSize: 16,
    fontWeight: "bold",
  },

});

export default CheckoutScreen;
