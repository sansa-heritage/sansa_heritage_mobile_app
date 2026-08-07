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
import { createRazorpayOrder, verifyRazorpayPayment } from '../../api/paymentApi';

type PaymentPageRouteProp = RouteProp<RootStackParamList, 'PaymentPage'>;

// Your Razorpay Test Key
const RAZORPAY_TEST_KEY = 'rzp_test_SexowhJ3EFaPtE';

const PaymentPage: React.FC = () => {
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();
  const route = useRoute<PaymentPageRouteProp>();

  const [loading, setLoading] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isPaymentCompleted, setIsPaymentCompleted] = useState(false);

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
      console.log('📦 Creating order for amount (rupees):', finalAmount);
      
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

  // STEP 2: Open Razorpay Checkout (COMPLETE FIXED VERSION)
  const openRazorpayCheckout = async (razorpayOrderId: string) => {
    const shippingAddress = address || (await getStoredAddress());

    // ✅ Convert rupees to paise (Razorpay expects amount in paise)
    const amountInPaise = Math.round(finalAmount * 100);
    console.log('💰 Amount in rupees:', finalAmount);
    console.log('💰 Amount in paise:', amountInPaise);

    const options = {
      key: RAZORPAY_TEST_KEY,
      amount: amountInPaise, // ✅ Send in paise
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
      modal: { 
        backdropclose: false,
        confirm_close: true,
      },
    };

    console.log('🚀 Opening Razorpay checkout with:', {
      orderId: razorpayOrderId,
      amount: options.amount,
      currency: options.currency,
    });

    try {
      const paymentData = await RazorpayCheckout.open(options);
      console.log('Payment success:', paymentData);

      if (paymentData && paymentData.razorpay_payment_id) {
        setIsPaymentCompleted(true);
        await verifyPaymentOnBackend({
          orderId: razorpayOrderId,
          paymentId: paymentData.razorpay_payment_id,
          signature: paymentData.razorpay_signature,
        });
      } else {
        Alert.alert(
          'Payment Status',
          'Payment was processed but we are waiting for confirmation.',
          [{ text: 'OK', onPress: () => navigation.navigate('Dashboard') }]
        );
      }
    } catch (error: any) {
      console.error('Payment error details:', JSON.stringify(error, null, 2));
      
      // Comprehensive error parsing
      let errorCode = '';
      let errorDescription = '';
      
      // Handle different error formats
      if (typeof error === 'object') {
        // Check nested error object
        if (error?.error) {
          errorCode = error.error.code || error.error.error?.code || '';
          errorDescription = error.error.description || error.error.message || error.error.error?.description || '';
        }
        // Check direct properties
        if (!errorCode && error?.code) {
          errorCode = error.code;
          errorDescription = error.description || error.message || '';
        }
        // Check if error is a string inside object
        if (!errorCode && error?.error && typeof error.error === 'string') {
          try {
            const parsed = JSON.parse(error.error);
            errorCode = parsed?.code || parsed?.error?.code || '';
            errorDescription = parsed?.description || parsed?.error?.description || '';
          } catch (e) {
            errorDescription = error.error;
          }
        }
      }
      
      // If error is a string
      if (typeof error === 'string') {
        try {
          const parsed = JSON.parse(error);
          errorCode = parsed?.code || parsed?.error?.code || '';
          errorDescription = parsed?.description || parsed?.error?.description || error;
        } catch (e) {
          errorDescription = error;
        }
      }

      // Check if it's a cancellation
      const errorString = JSON.stringify(error).toLowerCase();
      const isCancellation = 
        errorString.includes('cancel') ||
        errorString.includes('exit') ||
        errorString.includes('user_cancelled') ||
        errorString.includes('user cancelled') ||
        errorCode === 'USER_CANCELLED' ||
        errorCode === 'CANCELLED' ||
        errorCode === 'PAYMENT_CANCELLED' ||
        errorCode === 'back_pressed';

      console.log('✅ Parsed - Code:', errorCode);
      console.log('✅ Parsed - Description:', errorDescription);
      console.log('✅ Is Cancellation:', isCancellation);

      if (isCancellation) {
        Alert.alert(
          'Payment Cancelled',
          'You have cancelled the payment process.',
          [
            { 
              text: 'Go Back', 
              onPress: () => navigation.goBack(),
              style: 'cancel'
            },
            { 
              text: 'Retry', 
              onPress: () => handlePayment() 
            }
          ]
        );
      } else if (errorCode === 'PAYMENT_FAILED' || errorString.includes('failed')) {
        Alert.alert(
          'Payment Failed',
          errorDescription || 'Your payment could not be processed. Please try again.',
          [
            { text: 'Retry', onPress: () => handlePayment() },
            { text: 'Cancel', style: 'cancel', onPress: () => navigation.goBack() },
          ]
        );
      } else if (errorCode === 'NETWORK_ERROR' || errorString.includes('network') || errorString.includes('connection')) {
        Alert.alert(
          'Network Error',
          'Please check your internet connection and try again.',
          [
            { text: 'Retry', onPress: () => handlePayment() },
            { text: 'Cancel', style: 'cancel', onPress: () => navigation.goBack() },
          ]
        );
      } else if (errorCode === 'BAD_REQUEST_ERROR' || errorString.includes('bad_request')) {
        Alert.alert(
          'Payment Error',
          errorDescription || 'There was an issue with your payment request. Please try again.',
          [
            { text: 'Retry', onPress: () => handlePayment() },
            { text: 'Go Back', style: 'cancel', onPress: () => navigation.goBack() },
          ]
        );
      } else {
        Alert.alert(
          'Payment Error',
          errorDescription || 'Something went wrong. Please try again.',
          [
            { text: 'Retry', onPress: () => handlePayment() },
            { text: 'Go Back', style: 'cancel', onPress: () => navigation.goBack() },
          ]
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

      console.log('🔐 Verifying payment with ID:', data.paymentId);

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
    // Prevent multiple simultaneous payment attempts
    if (isProcessing) {
      console.log('⏳ Payment already in progress');
      return;
    }

    if (isPaymentCompleted) {
      console.log('✅ Payment already completed');
      return;
    }

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

    setIsProcessing(true);
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
      setIsProcessing(false);
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
        if (!loading && !isProcessing && !isPaymentCompleted) {
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
  }, [loading, navigation, isProcessing, isPaymentCompleted]);

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

      {!loading && !isPaymentCompleted && (
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
