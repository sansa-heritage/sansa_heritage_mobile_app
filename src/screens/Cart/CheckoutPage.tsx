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
  ActivityIndicator,
  Modal,
  useWindowDimensions,
} from 'react-native';
import {
  SafeAreaView,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  useNavigation,
  useRoute,
  RouteProp,
  useFocusEffect,
} from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';

import { RootStackParamList } from '../../models/types';
import { Address } from '../../models/address';
import LoadingService from '../../services/LoadingService';
import config from '../../config/config';

type OrderConfirmRouteProp = RouteProp<RootStackParamList, 'CheckoutPage'>;

interface CartItem {
  productId: string;
  name: string;
  price: number | string;
  quantity: number | string;
  imageUrl: string;
  discount?: number | string;
}

/* ============ RESPONSIVE HELPERS ============ */
const BASE_WIDTH = 375;
const MAX_CONTENT_WIDTH = 500;
const makeScale = (screenWidth: number) => {
  const factor = Math.min(Math.max(screenWidth / BASE_WIDTH, 0.85), 1.3);
  return (size: number) => Math.round(size * factor);
};

const resolveImage = (raw?: string | null) => {
  if (!raw) return null;
  if (raw.startsWith('data:image')) return { uri: raw };
  if (raw.startsWith('http')) return { uri: raw };
  const base = config.baseURL || '';
  return { uri: `${base}${raw.startsWith('/') ? '' : '/'}${raw}` };
};

const splitTitle = (fullName: string, boldWords = 2) => {
  const words = (fullName || '').trim().split(/\s+/);
  if (words.length <= boldWords) return { boldPart: fullName, normalPart: '' };
  return {
    boldPart: words.slice(0, boldWords).join(' '),
    normalPart: words.slice(boldWords).join(' '),
  };
};

const OrderConfirmationScreen: React.FC = () => {
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();
  const route = useRoute<OrderConfirmRouteProp>();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();

  const s = makeScale(width);
  const contentWidth = Math.min(width - 24, MAX_CONTENT_WIDTH);

  const [address, setAddress] = useState<Address | null>(null);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [addressModalVisible, setAddressModalVisible] = useState<boolean>(false);

  const {
    billingDetails = 0,
    bagTotal = 0,
    savings = 0,
    couponDiscount = 0,
    deliveryFee = 50,
    isFreeShipping = false,
    couponApplied = false,
  } = route.params || {};

  const amountPayable: number = Number(billingDetails);
  const finalDeliveryFee = isFreeShipping ? 0 : Number(deliveryFee);
  const finalAmount = amountPayable + finalDeliveryFee;
  const totalSavings = Number(savings) + Number(couponDiscount);

  /* ============ LOAD ADDRESS + CART ============ */
  useEffect(() => {
    const load = async () => {
      try {
        LoadingService.show();

        const storedCart = await AsyncStorage.getItem('cartSnapshot');
        if (storedCart) {
          try {
            const parsed = JSON.parse(storedCart);
            if (Array.isArray(parsed)) setCartItems(parsed);
          } catch {}
        }

        const token = await AsyncStorage.getItem('authToken');
        if (token) {
          try {
            const baseURL = config.baseURL || '';
            const res = await fetch(`${baseURL}api/auth/addresses`, {
              headers: { Authorization: `Bearer ${token}` },
            });
            if (res.ok) {
              const json = await res.json();
              setAddresses(json.addresses || []);
            }
          } catch {}
        }

        const storedAddr = await AsyncStorage.getItem('selectedAddress');
        if (storedAddr) setAddress(JSON.parse(storedAddr));
      } catch (e) {
        console.log('Load error', e);
      } finally {
        LoadingService.hide();
        setLoading(false);
      }
    };
    load();
  }, []);

  /* ============ SELECT ADDRESS ============ */
  const selectAddress = async (addr: Address) => {
    setAddress(addr);
    try {
      await AsyncStorage.setItem('selectedAddress', JSON.stringify(addr));
    } catch {}
    setAddressModalVisible(false);
  };

  /* ============ BACK GUARD ============ */
  useFocusEffect(
    useCallback(() => {
      const onBackPress = () => {
        Alert.alert(
          'Leave Checkout?',
          'Your cart is saved. Are you sure you want to leave?',
          [
            { text: 'Stay', style: 'cancel' },
            {
              text: 'Leave',
              style: 'destructive',
              onPress: () => navigation.navigate('Dashboard'),
            },
          ],
        );
        return true;
      };
      const sub = BackHandler.addEventListener('hardwareBackPress', onBackPress);
      return () => sub.remove();
    }, [navigation]),
  );

  /* ============ PROCEED TO PAYMENT ============ */
  const proceedToPayment = () => {
    if (!address) {
      Alert.alert(
        'Address Required',
        'Please select a delivery address before proceeding.',
      );
      setAddressModalVisible(true);
      return;
    }
    if (finalAmount <= 0) {
      Alert.alert('Invalid Amount', 'Your cart is empty.');
      return;
    }

    navigation.navigate('PaymentPage', {
      amount: Math.round(finalAmount),
      address,
      orderId: `ORD${Date.now()}`,
      productName: 'Sansa Heritage Order',
    });
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.loader}>
          <ActivityIndicator size="large" color="#9E0E26" />
        </View>
      </SafeAreaView>
    );
  }

  /* ============ DYNAMIC STYLES ============ */
  const dyn = {
    scrollContent: {
      // ✅ Zero top padding — safe-area handles the notch
      paddingTop: 0,
      paddingHorizontal: s(12),
      paddingBottom: s(100) + insets.bottom + s(16),
    },

    card: {
      borderRadius: s(12),
      padding: s(14),
      marginBottom: s(12),
      marginTop: 0,
    },
    cardHeaderRow: { marginBottom: s(12) },
    cardHeaderLeft: { gap: s(8) },
    cardTitle: { fontSize: s(14) },
    changeText: { fontSize: s(12) },

    addressBox: { paddingTop: s(10) },
    addressName: { fontSize: s(14), marginBottom: s(4) },
    addressText: { fontSize: s(12), lineHeight: s(18) },
    addressPhone: { fontSize: s(12), marginTop: s(6) },
    noAddressBox: { paddingVertical: s(16) },
    noAddressText: { fontSize: s(13), marginVertical: s(8) },
    primarySmallBtn: {
      paddingHorizontal: s(16),
      paddingVertical: s(8),
      borderRadius: s(8),
    },
    primarySmallBtnText: { fontSize: s(12) },

    itemRow: { paddingVertical: s(8) },
    itemImage: { width: s(52), height: s(64), borderRadius: s(6) },
    itemInfo: { marginLeft: s(10) },
    itemName: { fontSize: s(12), marginBottom: s(4), lineHeight: s(16) },
    itemMeta: { fontSize: s(11) },
    moreItemsText: { fontSize: s(11), marginTop: s(8) },

    billRow: { marginBottom: s(8) },
    billLabel: { fontSize: s(13) },
    billValue: { fontSize: s(13) },
    savingsValue: { fontSize: s(13) },
    divider: { marginVertical: s(10) },
    totalLabel: { fontSize: s(14) },
    totalValue: { fontSize: s(16) },

    savingsBanner: {
      borderRadius: s(8),
      paddingVertical: s(8),
      paddingHorizontal: s(10),
      marginTop: s(10),
      gap: s(6),
    },
    savingsBannerText: { fontSize: s(12) },

    paymentOption: { padding: s(12), borderRadius: s(10) },
    paymentLeft: { gap: s(12) },
    paymentIconWrap: {
      width: s(40),
      height: s(40),
      borderRadius: s(8),
    },
    paymentIcon: { width: s(32), height: s(32) },
    paymentTitle: { fontSize: s(14), marginBottom: s(2) },
    paymentSub: { fontSize: s(11) },
    radioOn: { width: s(20), height: s(20), borderRadius: s(10) },
    radioDot: { width: s(10), height: s(10), borderRadius: s(5) },

    noteCard: { borderRadius: s(12), padding: s(12), marginBottom: s(16) },
    noteText: { fontSize: s(11), lineHeight: s(16) },

    footer: {
      paddingHorizontal: s(14),
      paddingTop: s(10),
      paddingBottom: Math.max(insets.bottom, s(8)) + s(6),
    },
    footerAmount: { fontSize: s(16) },
    footerLabel: { fontSize: s(10), marginTop: s(1) },
    payBtn: {
      paddingVertical: s(12),
      paddingHorizontal: s(16),
      borderRadius: s(10),
      gap: s(6),
    },
    payText: { fontSize: s(12) },

    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.5)',
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: s(20),
    },
    modalBox: {
      width: '100%',
      maxWidth: MAX_CONTENT_WIDTH,
      backgroundColor: '#fff',
      borderRadius: s(14),
      overflow: 'hidden',
      maxHeight: '80%',
    },
    modalHeader: {
      paddingVertical: s(14),
      paddingHorizontal: s(16),
      borderBottomWidth: 1,
      borderBottomColor: '#EEE',
    },
    modalTitle: {
      fontSize: s(15),
      fontWeight: '700',
      color: '#111',
      textAlign: 'center',
    },
    modalScroll: { maxHeight: 400 },
    addressOption: {
      paddingVertical: s(14),
      paddingHorizontal: s(16),
      borderBottomWidth: 1,
      borderBottomColor: '#F0F0F0',
    },
    addressOptionActive: { backgroundColor: '#FFF7F8' },
    addressOptionName: {
      fontSize: s(13),
      fontWeight: '700',
      color: '#111',
      marginBottom: s(4),
    },
    addressOptionText: { fontSize: s(12), color: '#555', lineHeight: s(16) },
    addressOptionSub: { fontSize: s(11), color: '#888', marginTop: s(4) },
    modalCancelBtn: { paddingVertical: s(14), alignItems: 'center' },
    modalCancelText: {
      fontSize: s(13),
      color: '#E53935',
      fontWeight: '600',
    },
    emptyAddress: { padding: s(20), alignItems: 'center' },
    emptyAddressText: { fontSize: s(12), color: '#888', textAlign: 'center' },
  };

  /* ============ RENDER ============ */
  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <ScrollView
        contentContainerStyle={dyn.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View
          style={{
            width: contentWidth,
            alignSelf: 'center',
            maxWidth: MAX_CONTENT_WIDTH,
          }}
        >
          {/* DELIVERY ADDRESS */}
          <View style={[styles.card, dyn.card]}>
            <View style={[styles.cardHeaderRow, dyn.cardHeaderRow]}>
              <View style={[styles.cardHeaderLeft, dyn.cardHeaderLeft]}>
                <Ionicons
                  name="location-outline"
                  size={s(18)}
                  color="#111"
                />
                <Text style={[styles.cardTitle, dyn.cardTitle]}>
                  Delivery Address
                </Text>
              </View>
              {address && (
                <TouchableOpacity
                  onPress={() => setAddressModalVisible(true)}
                  hitSlop={6}
                >
                  <Text style={[styles.changeText, dyn.changeText]}>
                    Change
                  </Text>
                </TouchableOpacity>
              )}
            </View>

            {address ? (
              <View style={[styles.addressBox, dyn.addressBox]}>
                <Text style={[styles.addressName, dyn.addressName]}>
                  {address.name || 'Customer'}
                </Text>
                <Text style={[styles.addressText, dyn.addressText]}>
                  {[address.street, address.area, address.city]
                    .filter(Boolean)
                    .join(', ')}
                </Text>
                <Text style={[styles.addressText, dyn.addressText]}>
                  {[address.state, address.country, address.zipCode]
                    .filter(Boolean)
                    .join(' - ')}
                </Text>
                {address.phone ? (
                  <Text style={[styles.addressPhone, dyn.addressPhone]}>
                    <Ionicons
                      name="call-outline"
                      size={s(12)}
                      color="#666"
                    />{' '}
                    {address.phone}
                  </Text>
                ) : null}
              </View>
            ) : (
              <View style={[styles.noAddressBox, dyn.noAddressBox]}>
                <Ionicons
                  name="location-outline"
                  size={s(36)}
                  color="#ccc"
                />
                <Text style={[styles.noAddressText, dyn.noAddressText]}>
                  No delivery address selected
                </Text>
                <TouchableOpacity
                  style={[styles.primarySmallBtn, dyn.primarySmallBtn]}
                  onPress={() => setAddressModalVisible(true)}
                >
                  <Text
                    style={[
                      styles.primarySmallBtnText,
                      dyn.primarySmallBtnText,
                    ]}
                  >
                    + Select Address
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          </View>

          {/* ITEMS PREVIEW */}
          {cartItems.length > 0 && (
            <View style={[styles.card, dyn.card]}>
              <View style={[styles.cardHeaderRow, dyn.cardHeaderRow]}>
                <View style={[styles.cardHeaderLeft, dyn.cardHeaderLeft]}>
                  <Ionicons
                    name="bag-handle-outline"
                    size={s(18)}
                    color="#111"
                  />
                  <Text style={[styles.cardTitle, dyn.cardTitle]}>
                    Items ({cartItems.length})
                  </Text>
                </View>
              </View>

              {cartItems.slice(0, 3).map((item, idx) => {
                const imgSrc = resolveImage(item.imageUrl);
                const { boldPart, normalPart } = splitTitle(
                  item.name || '',
                  2,
                );
                const price = Number(item.price) || 0;
                const qty = Number(item.quantity) || 1;

                return (
                  <View
                    key={`${item.productId}-${idx}`}
                    style={[styles.itemRow, dyn.itemRow]}
                  >
                    {imgSrc ? (
                      <Image
                        source={imgSrc}
                        style={[styles.itemImage, dyn.itemImage]}
                      />
                    ) : (
                      <View
                        style={[
                          styles.itemImage,
                          dyn.itemImage,
                          { backgroundColor: '#F0F0F0' },
                        ]}
                      />
                    )}
                    <View style={[styles.itemInfo, dyn.itemInfo]}>
                      <Text
                        style={[styles.itemName, dyn.itemName]}
                        numberOfLines={2}
                      >
                        <Text style={styles.itemNameBold}>
                          {boldPart}
                        </Text>
                        {normalPart ? (
                          <Text style={styles.itemNameNormal}>
                            {' '}
                            {normalPart}
                          </Text>
                        ) : null}
                      </Text>
                      <Text style={[styles.itemMeta, dyn.itemMeta]}>
                        Qty: {qty} · ₹{price * qty}
                      </Text>
                    </View>
                  </View>
                );
              })}

              {cartItems.length > 3 && (
                <Text
                  style={[styles.moreItemsText, dyn.moreItemsText]}
                >
                  + {cartItems.length - 3} more item
                  {cartItems.length - 3 > 1 ? 's' : ''}
                </Text>
              )}
            </View>
          )}

          {/* PRICE DETAILS */}
          <View style={[styles.card, dyn.card]}>
            <View style={[styles.cardHeaderRow, dyn.cardHeaderRow]}>
              <View style={[styles.cardHeaderLeft, dyn.cardHeaderLeft]}>
                <Ionicons
                  name="receipt-outline"
                  size={s(18)}
                  color="#111"
                />
                <Text style={[styles.cardTitle, dyn.cardTitle]}>
                  Price Details
                </Text>
              </View>
            </View>

            <View style={[styles.billRow, dyn.billRow]}>
              <Text style={[styles.billLabel, dyn.billLabel]}>
                Bag Total
              </Text>
              <Text style={[styles.billValue, dyn.billValue]}>
                ₹{Number(bagTotal).toFixed(0)}
              </Text>
            </View>

            {Number(savings) > 0 && (
              <View style={[styles.billRow, dyn.billRow]}>
                <Text style={[styles.billLabel, dyn.billLabel]}>
                  Bag Savings
                </Text>
                <Text style={[styles.savingsValue, dyn.savingsValue]}>
                  - ₹{Number(savings).toFixed(0)}
                </Text>
              </View>
            )}

            {couponApplied && Number(couponDiscount) > 0 && (
              <View style={[styles.billRow, dyn.billRow]}>
                <Text style={[styles.billLabel, dyn.billLabel]}>
                  Coupon Discount
                </Text>
                <Text style={[styles.savingsValue, dyn.savingsValue]}>
                  - ₹{Number(couponDiscount).toFixed(0)}
                </Text>
              </View>
            )}

            <View style={[styles.billRow, dyn.billRow]}>
              <Text style={[styles.billLabel, dyn.billLabel]}>
                Delivery Fee
              </Text>
              <Text
                style={[
                  styles.billValue,
                  dyn.billValue,
                  isFreeShipping && styles.freeText,
                ]}
              >
                {isFreeShipping ? 'FREE' : `₹${finalDeliveryFee}`}
              </Text>
            </View>

            <View style={[styles.divider, dyn.divider]} />

            <View style={styles.totalRow}>
              <Text style={[styles.totalLabel, dyn.totalLabel]}>
                Total Amount
              </Text>
              <Text style={[styles.totalValue, dyn.totalValue]}>
                ₹{Math.round(finalAmount)}
              </Text>
            </View>

            {totalSavings > 0 && (
              <View style={[styles.savingsBanner, dyn.savingsBanner]}>
                <Ionicons
                  name="pricetag"
                  size={s(14)}
                  color="#1B5E20"
                />
                <Text
                  style={[
                    styles.savingsBannerText,
                    dyn.savingsBannerText,
                  ]}
                >
                  You're saving{' '}
                  <Text style={styles.savingsAmount}>
                    ₹{totalSavings.toFixed(0)}
                  </Text>{' '}
                  on this order
                </Text>
              </View>
            )}
          </View>

          {/* PAYMENT METHOD */}
          <View style={[styles.card, dyn.card]}>
            <View style={[styles.cardHeaderRow, dyn.cardHeaderRow]}>
              <View style={[styles.cardHeaderLeft, dyn.cardHeaderLeft]}>
                <Ionicons
                  name="card-outline"
                  size={s(18)}
                  color="#111"
                />
                <Text style={[styles.cardTitle, dyn.cardTitle]}>
                  Payment Method
                </Text>
              </View>
            </View>

            <View
              style={[
                styles.paymentOption,
                dyn.paymentOption,
                styles.paymentOptionSelected,
              ]}
            >
              <View style={[styles.paymentLeft, dyn.paymentLeft]}>
                <View
                  style={[styles.paymentIconWrap, dyn.paymentIconWrap]}
                >
                  <Image
                    source={{ uri: 'https://razorpay.com/favicon.png' }}
                    style={[styles.paymentIcon, dyn.paymentIcon]}
                    resizeMode="contain"
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.paymentTitle, dyn.paymentTitle]}>
                    Razorpay
                  </Text>
                  <Text style={[styles.paymentSub, dyn.paymentSub]}>
                    Credit/Debit Cards, UPI, NetBanking
                  </Text>
                </View>
              </View>
              <View style={[styles.radioOn, dyn.radioOn]}>
                <View style={[styles.radioDot, dyn.radioDot]} />
              </View>
            </View>
          </View>

          {/* TERMS */}
          <View style={[styles.noteCard, dyn.noteCard]}>
            <Text style={[styles.noteText, dyn.noteText]}>
              By placing this order you agree to our{' '}
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
      </ScrollView>

      {/* STICKY FOOTER */}
      <View style={[styles.footer, dyn.footer]}>
        <View style={styles.footerLeft}>
          <Text style={[styles.footerAmount, dyn.footerAmount]}>
            ₹{Math.round(finalAmount)}
          </Text>
          <Text style={[styles.footerLabel, dyn.footerLabel]}>
            Total Payable
          </Text>
        </View>
        <TouchableOpacity
          style={[styles.payBtn, dyn.payBtn]}
          onPress={proceedToPayment}
          activeOpacity={0.85}
        >
          <Text style={[styles.payText, dyn.payText]}>
            PROCEED TO PAYMENT
          </Text>
          <Ionicons
            name="arrow-forward"
            size={s(14)}
            color="#fff"
          />
        </TouchableOpacity>
      </View>

      {/* ADDRESS PICKER MODAL */}
      <Modal
        visible={addressModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setAddressModalVisible(false)}
      >
        <View style={dyn.modalOverlay}>
          <View style={dyn.modalBox}>
            <View style={dyn.modalHeader}>
              <Text style={dyn.modalTitle}>Select Delivery Address</Text>
            </View>

            {addresses.length === 0 ? (
              <View style={dyn.emptyAddress}>
                <Ionicons
                  name="location-outline"
                  size={s(36)}
                  color="#CCC"
                />
                <Text style={[dyn.emptyAddressText, { marginTop: s(8) }]}>
                  No addresses saved yet.
                </Text>
                <Text
                  style={[
                    dyn.emptyAddressText,
                    { marginTop: s(4), fontSize: s(11) },
                  ]}
                >
                  Add one from your profile.
                </Text>
              </View>
            ) : (
              <ScrollView style={dyn.modalScroll}>
                {addresses.map((addr, idx) => {
                  const isSelected =
                    address &&
                    address.street === addr.street &&
                    address.zipCode === addr.zipCode &&
                    address.city === addr.city;

                  return (
                    <TouchableOpacity
                      key={addr._id || `${idx}`}
                      style={[
                        dyn.addressOption,
                        isSelected && dyn.addressOptionActive,
                      ]}
                      onPress={() => selectAddress(addr)}
                      activeOpacity={0.7}
                    >
                      <View
                        style={{
                          flexDirection: 'row',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          marginBottom: s(4),
                        }}
                      >
                        <Text style={dyn.addressOptionName}>
                          {addr.name || 'Customer'}
                        </Text>
                        {isSelected && (
                          <Ionicons
                            name="checkmark-circle"
                            size={s(18)}
                            color="#9E0E26"
                          />
                        )}
                      </View>
                      <Text style={dyn.addressOptionText}>
                        {[addr.street, addr.area, addr.city]
                          .filter(Boolean)
                          .join(', ')}
                      </Text>
                      <Text style={dyn.addressOptionSub}>
                        {[addr.state, addr.zipCode, addr.country]
                          .filter(Boolean)
                          .join(' - ')}
                      </Text>
                      {addr.phone ? (
                        <Text style={dyn.addressOptionSub}>
                          📞 {addr.phone}
                        </Text>
                      ) : null}
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            )}

            <TouchableOpacity
              style={dyn.modalCancelBtn}
              onPress={() => setAddressModalVisible(false)}
            >
              <Text style={dyn.modalCancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

export default OrderConfirmationScreen;

/* ============ STATIC STYLES ============ */
const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#F5F5F5' },
  loader: { flex: 1, justifyContent: 'center', alignItems: 'center' },

  card: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#EFEFEF',
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cardHeaderLeft: { flexDirection: 'row', alignItems: 'center' },
  cardTitle: { fontWeight: '700', color: '#111' },
  changeText: { color: '#9E0E26', fontWeight: '700' },

  addressBox: { borderTopWidth: 1, borderTopColor: '#F2F2F2' },
  addressName: { fontWeight: '700', color: '#111' },
  addressText: { color: '#555' },
  addressPhone: { color: '#666' },
  noAddressBox: { alignItems: 'center' },
  noAddressText: { color: '#888' },
  primarySmallBtn: { backgroundColor: '#111' },
  primarySmallBtnText: { color: '#fff', fontWeight: '700' },

  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#F5F5F5',
  },
  itemImage: { resizeMode: 'cover' },
  itemInfo: { flex: 1 },
  itemName: { color: '#111' },
  itemNameBold: { fontWeight: '700', color: '#111' },
  itemNameNormal: { fontWeight: '400', color: '#333' },
  itemMeta: { color: '#777', fontWeight: '500' },
  moreItemsText: {
    color: '#9E0E26',
    fontWeight: '600',
    textAlign: 'center',
  },

  billRow: { flexDirection: 'row', justifyContent: 'space-between' },
  billLabel: { color: '#666' },
  billValue: { fontWeight: '500', color: '#333' },
  savingsValue: { fontWeight: '600', color: '#16A34A' },
  freeText: { color: '#16A34A', fontWeight: '700' },
  divider: { height: 1, backgroundColor: '#EEE' },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  totalLabel: { fontWeight: '700', color: '#111' },
  totalValue: { fontWeight: '800', color: '#111' },

  savingsBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F5E9',
    borderWidth: 1,
    borderColor: '#A5D6A7',
  },
  savingsBannerText: { color: '#1B5E20', fontWeight: '600', flex: 1 },
  savingsAmount: { fontWeight: '800', textDecorationLine: 'underline' },

  paymentOption: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E5E5',
    backgroundColor: '#fff',
  },
  paymentOptionSelected: {
    borderColor: '#9E0E26',
    backgroundColor: '#FFF7F8',
  },
  paymentLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  paymentIconWrap: {
    backgroundColor: '#F8F8F8',
    justifyContent: 'center',
    alignItems: 'center',
  },
  paymentTitle: { fontWeight: '700', color: '#111' },
  paymentSub: { color: '#888' },
  radioOn: {
    borderWidth: 2,
    borderColor: '#9E0E26',
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioDot: { backgroundColor: '#9E0E26' },

  trustRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    borderTopWidth: 1,
    borderTopColor: '#F2F2F2',
  },
  trustItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  trustText: { color: '#555', fontWeight: '600' },

  noteCard: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#EFEFEF',
  },
  noteText: { color: '#888', textAlign: 'center' },
  linkText: { color: '#9E0E26', fontWeight: '700' },

  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#EEE',
  },
  footerLeft: { flexShrink: 1 },
  footerAmount: { fontWeight: '800', color: '#111' },
  footerLabel: { color: '#777' },
  payBtn: {
    backgroundColor: '#111',
    flexDirection: 'row',
    alignItems: 'center',
    flexShrink: 0,
  },
  payText: { color: '#fff', fontWeight: '700', letterSpacing: 0.3 },
});