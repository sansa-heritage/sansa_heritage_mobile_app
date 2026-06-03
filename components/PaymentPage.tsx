// import { useNavigation } from '@react-navigation/native';
// import { StackNavigationProp } from '@react-navigation/stack';
// import React from 'react';
// import { View, Text, Image, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
// import { RootStackParamList } from './(tabs)/types';

// const SuccessPage: React.FC = () => {
//   const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();
//   const gotToHome = () => {
//     navigation.navigate('Dashboard');
//   }
//   return (
//     <ScrollView contentContainerStyle={styles.container}>
//       <View style={styles.successIcon}>
//         <Image source={require('../assets/images/giphy.gif')} style={styles.image} />
//       </View>
//       <Text style={styles.title}>Congratulations!</Text>
//       <Text style={styles.message}>
//         Payment is the transfer of money services in exchange product or Payments
//       </Text>
//       <TouchableOpacity style={styles.button} onPress={() => { /* Handle get receipt action */ }}>
//         <Text style={styles.buttonText}>Get your receipt</Text>
//       </TouchableOpacity>
//       <TouchableOpacity style={styles.backButton} onPress={gotToHome}>
//         <Text style={styles.backButtonColor}>Back to Home</Text>
//       </TouchableOpacity>
//     </ScrollView>
//   );
// };

// const styles = StyleSheet.create({
//   container: {
//     flexGrow: 1,
//     justifyContent: 'center',
//     alignItems: 'center',
//     backgroundColor: '#fff',
//     paddingVertical: 20, // Add some vertical padding
//   },
//   successIcon: {
//     marginBottom: 32,
//   },
//   image: {
//     width: 100, // Adjust width as needed
//     height: 100, // Adjust height as needed
//   },
//   title: {
//     fontSize: 24,
//     fontWeight: 'bold',
//     marginBottom: 16,
//   },
//   message: {
//     fontSize: 16,
//     marginBottom: 32,
//     textAlign: 'center',
//   },
//   button: {
//     backgroundColor: '#151515',
//     padding: 16,
//     borderRadius: 33,
//     width: '80%',
//     alignItems: 'center',
//     marginTop: 5,
//   },
//   backButton: {
//     backgroundColor: '#FFE9E2',
//     padding: 16,
//     borderRadius: 33,
//     width: '80%',
//     alignItems: 'center',
//     marginTop: 10, // Add some space between buttons
//   },
//   backButtonColor: {
//     color: '#F67952',
//   },
//   buttonText: {
//     color: 'white',
//     fontSize: 18,
//   },
// });

// export default SuccessPage;
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  ScrollView,
  BackHandler,
} from 'react-native';
import RazorpayCheckout from 'react-native-razorpay';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import Ionicons from 'react-native-vector-icons/Ionicons';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { RootStackParamList } from './(tabs)/types';
import config from '../config/config';
import { createRazorpayOrder, verifyRazorpayPayment } from './apiHelper/apiService';

type PaymentPageRouteProp = RouteProp<RootStackParamList, 'PaymentPage'>;

// Your Razorpay Test Key
const RAZORPAY_TEST_KEY = 'rzp_test_SexowhJ3EFaPtE';

const PaymentPage: React.FC = () => {
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();
  const route = useRoute<PaymentPageRouteProp>();

  const [loading, setLoading] = useState(false);
  const [retryCount, setRetryCount] = useState(0);

  const {
    amount = 0,
    address,
    productName = 'Sansa Heritage Order',
  } = route.params || {};

  const finalAmount = Math.round(amount);

  // Helper: Get stored address
  const getStoredAddress = async () => {
    try {
      const addressStr = await AsyncStorage.getItem('selectedAddress');
      return addressStr ? JSON.parse(addressStr) : null;
    } catch (error) {
      console.log('Error getting stored address:', error);
      return null;
    }
  };

  // STEP 1: Create Razorpay Order using apiService
  const createOrderOnBackend = async (): Promise<string | null> => {
    try {
      console.log('📦 Creating order for amount:', finalAmount);
      
      const result = await createRazorpayOrder(finalAmount);
      console.log('Order response:', result);

      if (result.success && result.orderId) {
        return result.orderId;
      } else {
        throw new Error(result.message || result.error || 'Failed to create order');
      }
    } catch (error: any) {
      console.error('Order creation error:', error);
      Alert.alert(
        'Error',
        error.message || 'Could not create payment order. Please try again.',
      );
      return null;
    }
  };

  // STEP 2: Open Razorpay Checkout
  const openRazorpayCheckout = async (razorpayOrderId: string) => {
    const shippingAddress = address || (await getStoredAddress());

    const options = {
      key: RAZORPAY_TEST_KEY,
      amount: finalAmount * 100,
      currency: 'INR',
      name: 'Sansa Heritage Hub',
      description: `${productName} - Order Payment`,
      order_id: razorpayOrderId,
      image: 'https://razorpay.com/favicon.png',
      prefill: {
        name: shippingAddress?.name || 'Customer',
        email: shippingAddress?.email || 'customer@example.com',
        contact: shippingAddress?.phone || '9999999999',
      },
      notes: {
        address: shippingAddress
          ? `${shippingAddress.street}, ${shippingAddress.city}`
          : 'No address',
      },
      theme: { color: '#F67952' },
      modal: { backdropclose: false },
    };

    console.log('🚀 Opening Razorpay checkout with order ID:', razorpayOrderId);

    try {
      const paymentData = await RazorpayCheckout.open(options);
      console.log('Payment success:', paymentData);

      await verifyPaymentOnBackend({
        orderId: razorpayOrderId,
        paymentId: paymentData.razorpay_payment_id,
        signature: paymentData.razorpay_signature,
      });
    } catch (error: any) {
      console.error('Payment error:', error);

      if (error.code === 'PAYMENT_FAILED') {
        Alert.alert(
          'Payment Failed',
          error.description || 'Your payment could not be processed.',
          [
            { text: 'Retry', onPress: () => handlePayment() },
            {
              text: 'Cancel',
              style: 'cancel',
              onPress: () => navigation.goBack(),
            },
          ],
        );
      } else if (error.code === 'USER_CANCELLED') {
        Alert.alert('Payment Cancelled', 'You cancelled the payment process.', [
          { text: 'OK', onPress: () => navigation.goBack() },
        ]);
      } else {
        Alert.alert(
          'Payment Error',
          error.description || 'Something went wrong.',
        );
      }
    }
  };

  // STEP 3: Verify Payment using apiService
  const verifyPaymentOnBackend = async (data: {
    orderId: string;
    paymentId: string;
    signature: string;
  }) => {
    setLoading(true);

    try {
      const shippingAddress = address || (await getStoredAddress());

      if (!shippingAddress) {
        throw new Error('Shipping address not found');
      }

      const formattedAddress = {
        street: shippingAddress.street || shippingAddress.address,
        city: shippingAddress.city,
        state: shippingAddress.state,
        country: shippingAddress.country || 'India',
        zipCode: shippingAddress.zipCode || shippingAddress.pincode,
        phone: shippingAddress.phone,
        email: shippingAddress.email,
        name: shippingAddress.name,
      };

      console.log('🔐 Verifying payment');

      const result = await verifyRazorpayPayment({
        razorpay_order_id: data.orderId,
        razorpay_payment_id: data.paymentId,
        razorpay_signature: data.signature,
        shippingAddress: formattedAddress,
        totalPrice: finalAmount,
      });

      console.log('Verification response:', result);

      if (result.success) {
        // Clear cart after successful order
        await AsyncStorage.removeItem('cart');
        await AsyncStorage.removeItem('cartItems');

        navigation.replace('SuccessPage', {
          amount: finalAmount,
          orderId: result.order?.orderId || result.order?.id || data.orderId,
          paymentId: data.paymentId,
          paymentStatus: 'success',
          paymentMethod: 'razorpay',
        });
      } else {
        throw new Error(result.message || 'Payment verification failed');
      }
    } catch (error: any) {
      console.error('Verification error:', error);
      Alert.alert(
        'Verification Failed',
        'Payment was processed but verification failed. Please contact support.',
        [
          {
            text: 'Go to Home',
            onPress: () => navigation.navigate('Dashboard'),
          },
        ],
      );
    } finally {
      setLoading(false);
    }
  };

  // Main payment handler
  const handlePayment = async () => {
    if (finalAmount <= 0) {
      Alert.alert('Invalid Amount', 'Please check your order total.');
      return;
    }

    const shippingAddress = address || (await getStoredAddress());
    if (!shippingAddress) {
      Alert.alert(
        'Address Required',
        'Please add a delivery address before proceeding.',
        [
          {
            text: 'Add Address',
            onPress: () => navigation.navigate('AddressFormPage'),
          },
          { text: 'Cancel', style: 'cancel' },
        ],
      );
      return;
    }

    setLoading(true);
    setRetryCount(prev => prev + 1);

    try {
      const razorpayOrderId = await createOrderOnBackend();
      if (razorpayOrderId) {
        await openRazorpayCheckout(razorpayOrderId);
      }
    } catch (error) {
      console.error('Payment flow error:', error);
    } finally {
      setLoading(false);
    }
  };

  // Auto-start payment
  useEffect(() => {
    const timer = setTimeout(() => handlePayment(), 500);
    return () => clearTimeout(timer);
  }, []);

  // Back button handler
  useEffect(() => {
    const backHandler = BackHandler.addEventListener(
      'hardwareBackPress',
      () => {
        if (!loading) {
          Alert.alert('Cancel Payment', 'Are you sure you want to cancel?', [
            { text: 'No', style: 'cancel' },
            {
              text: 'Yes',
              onPress: () => navigation.goBack(),
              style: 'destructive',
            },
          ]);
          return true;
        }
        return false;
      },
    );
    return () => backHandler.remove();
  }, [loading, navigation]);

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {loading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#F67952" />
          <Text style={styles.loadingText}>Initializing Secure Payment...</Text>
          <Text style={styles.loadingSubText}>Please don't close the app</Text>
          {retryCount > 1 && (
            <Text style={styles.retryText}>Retry: {retryCount}</Text>
          )}
        </View>
      )}

      <View style={styles.card}>
        <View style={styles.headerIcon}>
          <Ionicons name="lock-closed" size={40} color="#F67952" />
        </View>
        <Text style={styles.title}>Secure Payment</Text>

        <View style={styles.amountContainer}>
          <Text style={styles.amountLabel}>Total Amount</Text>
          <Text style={styles.amountValue}>₹{finalAmount}</Text>
        </View>

        <View style={styles.divider} />

        <View style={styles.paymentMethodContainer}>
          <Ionicons name="card-outline" size={20} color="#4CAF50" />
          <Text style={styles.secureText}>100% Secure Payments</Text>
        </View>

        <View style={styles.paymentMethodContainer}>
          <Ionicons name="shield-checkmark-outline" size={20} color="#4CAF50" />
          <Text style={styles.secureText}>Powered by Razorpay</Text>
        </View>
      </View>

      <View style={styles.testModeCard}>
        <Ionicons name="information-circle-outline" size={20} color="#F67952" />
        <Text style={styles.testModeTitle}>Test Mode Active</Text>
        <Text style={styles.testModeText}>Use these test credentials:</Text>
        <View style={styles.testCredentials}>
          <Text style={styles.credentialText}>
            💳 Card: 4111 1111 1111 1111
          </Text>
          <Text style={styles.credentialText}>📱 UPI: success@razorpay</Text>
        </View>
      </View>

      {!loading && (
        <TouchableOpacity style={styles.retryButton} onPress={handlePayment}>
          <Ionicons name="refresh-outline" size={20} color="#F67952" />
          <Text style={styles.retryButtonText}>Retry Payment</Text>
        </TouchableOpacity>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f6f6f6',
    padding: 20,
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 30,
  },
  loadingText: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
    color: '#151515',
  },
  loadingSubText: { fontSize: 14, color: '#888', marginTop: 8 },
  retryText: { fontSize: 12, color: '#F67952', marginTop: 12 },
  card: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 24,
    width: '100%',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  headerIcon: { marginBottom: 16 },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#151515',
    marginBottom: 24,
  },
  amountContainer: { width: '100%', alignItems: 'center', marginBottom: 20 },
  amountLabel: { fontSize: 14, color: '#888', marginBottom: 8 },
  amountValue: { fontSize: 36, fontWeight: 'bold', color: '#151515' },
  divider: {
    height: 1,
    backgroundColor: '#eee',
    width: '100%',
    marginVertical: 20,
  },
  paymentMethodContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  secureText: { fontSize: 14, color: '#4CAF50', fontWeight: '500' },
  testModeCard: {
    backgroundColor: '#FFF3E0',
    borderRadius: 12,
    padding: 16,
    marginTop: 16,
    width: '100%',
  },
  testModeTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#E65100',
    marginTop: 4,
    marginBottom: 8,
  },
  testModeText: { fontSize: 12, color: '#E65100', marginBottom: 8 },
  testCredentials: { marginTop: 4 },
  credentialText: { fontSize: 12, color: '#BF360C', marginVertical: 2 },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 20,
    padding: 12,
    backgroundColor: '#fff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#F67952',
  },
  retryButtonText: { color: '#F67952', fontSize: 14, fontWeight: '500' },
});

export default PaymentPage;
