import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Image,
  Alert,
  BackHandler,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation, useRoute, RouteProp, useFocusEffect } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';

import { RootStackParamList } from '../../models/types';
import { Address } from '../../models/address';

import LoadingService from '../../services/LoadingService';

/* ================= TYPES ================= */

type OrderConfirmRouteProp = RouteProp<RootStackParamList, 'CheckoutPage'>;

/* ================= COMPONENT ================= */

const OrderConfirmationScreen: React.FC = () => {
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();
  const route = useRoute<OrderConfirmRouteProp>();

  const [address, setAddress] = useState<Address | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // Get all breakdown values from route params
  const {
    billingDetails = 0,
    bagTotal = 0,
    savings = 0,
    couponDiscount = 0,
    deliveryFee = 50,
    isFreeShipping = false,
    subtotal = 0,
    couponApplied = false,
  } = route.params || {};

  const amountPayable: number = Number(billingDetails);
  const finalDeliveryFee = isFreeShipping ? 0 : deliveryFee;
  const gst = (amountPayable + finalDeliveryFee) * 0.05;
  const finalAmount = amountPayable + finalDeliveryFee + gst;

  /* ================= GET BUTTON TEXT ================= */
  const getButtonText = () => {
    return 'PROCEED TO PAYMENT';
  };

  /* ================= GET BUTTON ICON ================= */
  const getButtonIcon = () => {
    return 'arrow-forward';
  };

  /* ================= LOAD ADDRESS ================= */

  useEffect(() => {
    const loadSelectedAddress = async () => {
      try {
        LoadingService.show();
        const stored = await AsyncStorage.getItem('selectedAddress');
        if (stored) {
          setAddress(JSON.parse(stored));
        }
      } catch (e) {
        console.log('Address load error', e);
      } finally {
        LoadingService.hide();
        setLoading(false);
      }
    };

    loadSelectedAddress();
  }, []);

  /* ================= BACK BUTTON HANDLER ================= */
  useFocusEffect(
    useCallback(() => {
      const onBackPress = () => {
        Alert.alert(
          'Leave Checkout',
          'Are you sure you want to leave? Your cart items will be saved.',
          [
            { text: 'Stay', style: 'cancel' },
            { text: 'Leave', onPress: () => navigation.navigate('Dashboard') }
          ]
        );
        return true;
      };

      const subscription = BackHandler.addEventListener('hardwareBackPress', onBackPress);
      return () => subscription.remove();
    }, [navigation])
  );

  /* ================= PROCEED TO PAYMENT ================= */

  const proceedToPayment = () => {
    // Validate address
    if (!address) {
      Alert.alert(
        'Address Required',
        'Please add a delivery address before proceeding.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Add Address', onPress: () => navigation.navigate('AddressFormPage') }
        ]
      );
      return;
    }

    // Validate amount
    if (finalAmount <= 0) {
      Alert.alert('Invalid Amount', 'Please add items to your cart before proceeding.');
      return;
    }

    // Navigate to Payment Page
    navigation.navigate('PaymentPage', {
      amount: Math.round(finalAmount),
      address: address,
      orderId: `ORD${Date.now()}`,
      productName: 'Sansa Heritage Order'
    });
  };

  /* ================= UI ================= */

  return (
    <ScrollView
      contentContainerStyle={styles.scrollContainer}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.container}>
        {/* Title */}
        <Text style={styles.title}>Order Summary</Text>

        {/* DELIVERY ADDRESS */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Ionicons name="location-outline" size={22} color="#000" />
            <Text style={styles.cardTitle}>Delivery Address</Text>
          </View>

          {address ? (
            <View style={styles.addressContainer}>
              <Text style={styles.addressName}>
                {address.name || 'Customer'}
              </Text>
              <Text style={styles.addressText}>
                {address.street}, {address.city}
              </Text>
              <Text style={styles.addressText}>
                {address.state}, {address.country} - {address.zipCode}
              </Text>
              <Text style={styles.addressPhone}>
                Phone: {address.phone || 'Not provided'}
              </Text>
            </View>
          ) : (
            <View style={styles.noAddressContainer}>
              <Ionicons name="location-outline" size={40} color="#ccc" />
              <Text style={styles.noAddressText}>
                No delivery address selected
              </Text>
              <TouchableOpacity
                style={styles.addAddressBtn}
                onPress={() => navigation.navigate('AddressFormPage')}
              >
                <Text style={styles.addAddressBtnText}>Add Address</Text>
              </TouchableOpacity>
            </View>
          )}

          {address && (
            <TouchableOpacity
              style={styles.changeAddressBtn}
              onPress={() => navigation.navigate('AddressFormPage')}
            >
              <Text style={styles.changeAddressText}>Change Address</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* ORDER SUMMARY - Now shows all breakdowns */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Ionicons name="receipt-outline" size={22} color="#000" />
            <Text style={styles.cardTitle}>Order Summary</Text>
          </View>

          {/* Bag Total */}
          <View style={styles.billRow}>
            <Text style={styles.billLabel}>Bag Total</Text>
            <Text style={styles.billValue}>₹{Number(bagTotal).toFixed(0)}</Text>
          </View>

          {/* Savings */}
          {Number(savings) > 0 && (
            <View style={styles.billRow}>
              <Text style={styles.billLabel}>Savings</Text>
              <Text style={styles.savingsValue}>-₹{Number(savings).toFixed(0)}</Text>
            </View>
          )}

          {/* Coupon Discount */}
          {couponApplied && Number(couponDiscount) > 0 && (
            <View style={styles.billRow}>
              <Text style={styles.billLabel}>Coupon Discount</Text>
              <Text style={styles.savingsValue}>-₹{Number(couponDiscount).toFixed(0)}</Text>
            </View>
          )}

          {/* Delivery Fee */}
          <View style={styles.billRow}>
            <Text style={styles.billLabel}>Delivery Fee</Text>
            <Text style={[styles.billValue, isFreeShipping && styles.freeText]}>
              {isFreeShipping ? 'FREE' : `₹${Number(deliveryFee).toFixed(0)}`}
            </Text>
          </View>

          {/* GST */}
          <View style={styles.billRow}>
            <Text style={styles.billLabel}>GST (5%)</Text>
            <Text style={styles.billValue}>₹{gst.toFixed(0)}</Text>
          </View>

          <View style={styles.divider} />

          {/* Total Amount */}
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Total Amount</Text>
            <Text style={styles.totalValue}>
              ₹{Math.round(finalAmount)}
            </Text>
          </View>
        </View>

        {/* PAYMENT METHOD - Only Razorpay */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Ionicons name="card-outline" size={22} color="#000" />
            <Text style={styles.cardTitle}>Payment Method</Text>
          </View>

          {/* Razorpay Option - Always selected */}
          <View
            style={[
              styles.paymentOption,
              styles.paymentOptionSelected,
            ]}
          >
            <View style={styles.paymentOptionLeft}>
              <View style={styles.paymentIconContainer}>
                <Image
                  source={{ uri: 'https://razorpay.com/favicon.png' }}
                  style={styles.paymentIcon}
                  resizeMode="contain"
                />
              </View>
              <View style={styles.paymentTextContainer}>
                <Text style={styles.paymentOptionText}>Razorpay</Text>
                <Text style={styles.paymentOptionSubText}>
                  Credit/Debit Cards, UPI, NetBanking
                </Text>
              </View>
            </View>
            <View
              style={[
                styles.radioCircle,
                styles.radioCircleSelected,
              ]}
            >
              <View style={styles.radioInner} />
            </View>
          </View>
        </View>

        {/* ORDER NOTE */}
        <View style={styles.noteCard}>
          <Text style={styles.noteText}>
            By placing your order, you agree to our{' '}
            <Text
              style={styles.linkText}
              onPress={() => navigation.navigate('TermsScreen')}
            >
              Terms & Conditions
            </Text>{' '}
            and{' '}
            <Text
              style={styles.linkText}
              onPress={() => navigation.navigate('PrivacyPolicy')}
            >
              Privacy Policy
            </Text>
          </Text>
        </View>
      </View>

      {/* FOOTER BUTTON */}
      <View style={styles.footer}>
        <View style={styles.footerLeft}>
          <Text style={styles.footerAmount}>₹{Math.round(finalAmount)}</Text>
          <Text style={styles.footerLabel}>Total Amount</Text>
        </View>
        <TouchableOpacity style={styles.payBtn} onPress={proceedToPayment}>
          <Text style={styles.payText}>{getButtonText()}</Text>
          <Ionicons name={getButtonIcon()} size={18} color="#fff" />
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

export default OrderConfirmationScreen;

/* ================= STYLES ================= */

const styles = StyleSheet.create({
  loader: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f6f6f6',
  },

  scrollContainer: {
    flexGrow: 1,
    paddingBottom: 120,
  },

  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#f6f6f6',
  },

  title: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 20,
    color: '#000',
  },

  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },

  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    paddingBottom: 12,
  },

  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
  },

  addressContainer: {
    marginBottom: 12,
  },

  addressName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    marginBottom: 4,
  },

  addressText: {
    fontSize: 14,
    color: '#555',
    marginBottom: 2,
    lineHeight: 20,
  },

  addressPhone: {
    fontSize: 14,
    color: '#555',
    marginTop: 6,
  },

  noAddressContainer: {
    alignItems: 'center',
    paddingVertical: 20,
  },

  noAddressText: {
    fontSize: 14,
    color: '#999',
    marginBottom: 12,
  },

  addAddressBtn: {
    backgroundColor: '#000',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },

  addAddressBtnText: {
    color: '#fff',
    fontWeight: '600',
  },

  changeAddressBtn: {
    alignSelf: 'flex-start',
    marginTop: 8,
  },

  changeAddressText: {
    color: '#1e88e5',
    fontSize: 13,
    fontWeight: '500',
  },

  billRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },

  billLabel: {
    fontSize: 14,
    color: '#666',
  },

  billValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
  },

  savingsValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#4CAF50',
  },

  freeText: {
    color: '#4CAF50',
    fontWeight: '700',
  },

  divider: {
    height: 1,
    backgroundColor: '#eee',
    marginVertical: 12,
  },

  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  totalLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: '#000',
  },

  totalValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#000',
  },

  paymentOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 12,
    marginBottom: 12,
    backgroundColor: '#fff',
  },

  paymentOptionSelected: {
    borderColor: '#000',
    backgroundColor: '#fafafa',
  },

  paymentOptionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    flex: 1,
  },

  paymentIconContainer: {
    width: 48,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f8f8',
    borderRadius: 10,
  },

  paymentIcon: {
    width: 40,
    height: 40,
    resizeMode: 'contain',
  },

  paymentTextContainer: {
    flex: 1,
  },

  paymentOptionText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    marginBottom: 2,
  },

  paymentOptionSubText: {
    fontSize: 12,
    color: '#888',
  },

  radioCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#ccc',
    justifyContent: 'center',
    alignItems: 'center',
  },

  radioCircleSelected: {
    borderColor: '#000',
  },

  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#000',
  },

  noteCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    marginBottom: 16,
  },

  noteText: {
    fontSize: 12,
    color: '#888',
    textAlign: 'center',
    lineHeight: 18,
  },

  linkText: {
    color: '#1e88e5',
    fontWeight: '500',
  },

  footer: {
    position: 'absolute',
    bottom: 80,
    width: '100%',
    backgroundColor: '#fff',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderTopWidth: 1,
    borderTopColor: '#eee',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 5,
  },

  footerLeft: {
    alignItems: 'flex-start',
  },

  footerAmount: {
    fontSize: 20,
    fontWeight: '700',
    color: '#000',
  },

  footerLabel: {
    fontSize: 12,
    color: '#888',
    marginTop: 2,
  },

  payBtn: {
    backgroundColor: '#000',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 40,
  },

  payText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
});