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
  Modal,
  useWindowDimensions,
  TextInput,
  KeyboardAvoidingView,
  Platform,
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
  const [newAddressModalVisible, setNewAddressModalVisible] =
    useState<boolean>(false);

  const [newAddress, setNewAddress] = useState({
    fullName: '',
    phone: '',
    street: '',
    city: '',
    state: '',
    zipCode: '',
  });

  const {
    billingDetails = 0,
    bagTotal = 0,
    savings = 0,
    couponDiscount = 0,
    deliveryFee = 50,
    isFreeShipping = false,
    couponApplied = false,
    appliedCoupon = null,
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

  /* ============ SAVE NEW ADDRESS ============ */
  const handleSaveNewAddress = async () => {
    const { fullName, phone, street, city, state, zipCode } = newAddress;

    if (
      !fullName.trim() ||
      !phone.trim() ||
      !street.trim() ||
      !city.trim() ||
      !state.trim() ||
      !zipCode.trim()
    ) {
      Alert.alert('Missing fields', 'Please fill in all fields.');
      return;
    }

    LoadingService.show();
    try {
      const token = await AsyncStorage.getItem('authToken');
      const baseURL = config.baseURL || '';

      const payload = {
        fullName: fullName.trim(),
        phone: phone.trim(),
        street: street.trim(),
        city: city.trim(),
        state: state.trim(),
        zipCode: zipCode.trim(),
      };

      let savedAddress: Address | null = null;

      if (token) {
        try {
          const res = await fetch(`${baseURL}api/auth/addresses`, {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload),
          });
          if (res.ok) {
            const json = await res.json();
            savedAddress = json.address || json;
            if (json.addresses) setAddresses(json.addresses);
            else if (savedAddress)
              setAddresses(prev => [...prev, savedAddress as Address]);
          }
        } catch (e) {
          console.log('Server save failed, saving locally', e);
        }
      }

      if (!savedAddress) {
        savedAddress = {
          ...(payload as any),
          name: payload.fullName,
        } as Address;
        setAddresses(prev => [...prev, savedAddress as Address]);
      }

      setAddress(savedAddress);
      await AsyncStorage.setItem(
        'selectedAddress',
        JSON.stringify(savedAddress),
      );

      setNewAddressModalVisible(false);
      setNewAddress({
        fullName: '',
        phone: '',
        street: '',
        city: '',
        state: '',
        zipCode: '',
      });
      Alert.alert('Success', 'Address added successfully');
    } catch (e: any) {
      console.error('Save address error:', e);
      Alert.alert('Error', 'Failed to save address');
    } finally {
      LoadingService.hide();
    }
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
      const sub = BackHandler.addEventListener(
        'hardwareBackPress',
        onBackPress,
      );
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
      coupon: appliedCoupon,
      discountAmount: couponApplied ? Number(couponDiscount) : 0,
    });
  };

  if (loading) {
    return <View style={{ flex: 1, backgroundColor: '#F5F5F5' }} />;
  }

  /* ============ DYNAMIC STYLES ============ */
  const dyn = {
    scrollContent: {
      paddingTop: s(8),
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

    /* ---- Bottom sheet (address picker) ---- */
    bottomSheetOverlay: {
      flex: 1,
      justifyContent: 'flex-end',
      backgroundColor: 'transparent',
    },
    bottomSheetBackdrop: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: 'rgba(0,0,0,0.45)',
    },
    bottomSheet: {
      backgroundColor: '#fff',
      borderTopLeftRadius: s(22),
      borderTopRightRadius: s(22),
      paddingTop: s(8),
      paddingBottom: Math.max(insets.bottom, s(16)),
      paddingHorizontal: s(16),
      maxHeight: '85%',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: -3 },
      shadowOpacity: 0.1,
      shadowRadius: 8,
      elevation: 12,
    },
    sheetHandle: {
      alignSelf: 'center',
      width: s(40),
      height: s(4),
      borderRadius: s(2),
      backgroundColor: '#DDD',
      marginBottom: s(10),
    },
    sheetHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingBottom: s(12),
      borderBottomWidth: 1,
      borderBottomColor: '#F0F0F0',
    },
    sheetTitle: {
      fontSize: s(15),
      fontWeight: '700',
      color: '#111',
    },
    sheetScroll: {
      marginTop: s(8),
      maxHeight: 400,
      marginBottom: s(4),
    },

    addressCard: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      padding: s(12),
      borderRadius: s(10),
      borderWidth: 1,
      borderColor: '#EEE',
      backgroundColor: '#FAFAFA',
      marginBottom: s(8),
    },
    addressCardSelected: {
      borderColor: '#9E0E26',
      backgroundColor: '#FDF2F4',
    },
    addressCardLeft: {
      marginRight: s(10),
      marginTop: s(2),
    },
    addressCardBody: { flex: 1 },
    addressCardTitle: {
      fontSize: s(13),
      fontWeight: '700',
      color: '#222',
      marginBottom: s(2),
    },
    addressCardLine: {
      fontSize: s(11.5),
      color: '#555',
      lineHeight: s(16),
    },
    addressCardPhone: {
      fontSize: s(11),
      color: '#777',
      marginTop: s(3),
    },

    noAddressBox: {
      alignItems: 'center',
      paddingVertical: s(30),
    },
    noAddressText: {
      fontSize: s(13),
      color: '#999',
      marginTop: s(8),
    },

    addAddressBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#9E0E26',
      paddingVertical: s(13),
      borderRadius: s(10),
      marginTop: s(8),
      gap: s(6),
    },
    addAddressBtnText: {
      color: '#fff',
      fontWeight: '700',
      fontSize: s(13),
    },

    /* ---- Form fields ---- */
    inputLabel: {
      fontSize: s(11.5),
      fontWeight: '600',
      color: '#555',
      marginTop: s(12),
      marginBottom: s(4),
    },
    inputField: {
      backgroundColor: '#F7F7F7',
      borderRadius: s(8),
      borderWidth: 1,
      borderColor: '#E5E5E5',
      paddingHorizontal: s(12),
      paddingVertical: s(10),
      fontSize: s(13),
      color: '#222',
    },
    inputRow: {
      flexDirection: 'row',
      marginTop: 0,
    },
  };

  /* ============ RENDER ============ */
  return (
    <SafeAreaView style={styles.safeArea} edges={['left', 'right']}>
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
                  {address.name || address.fullName || 'Customer'}
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

          {/* ITEMS PREVIEW — shows ALL items */}
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

              {cartItems.map((item, idx) => {
                const imgSrc = resolveImage(item.imageUrl);
                const { boldPart, normalPart } = splitTitle(
                  item.name || '',
                  2,
                );
                const price = Number(item.price) || 0;
                const qty = Number(item.quantity) || 1;

                // ✅ Discount guard (not shown here but kept for consistency)
                const discountValue = Number(item.discount || 0);
                const hasRealDiscount =
                  discountValue > 0 && discountValue < 100;
                const discountedPrice = hasRealDiscount
                  ? price - (price * discountValue) / 100
                  : price;

                return (
                  <View
                    key={`${item.productId}-${idx}`}
                    style={[styles.itemRow, dyn.itemRow]}
                  >
                    {imgSrc ? (
                      <Image
                        source={imgSrc}
                        style={[styles.itemImage, dyn.itemImage]}
                        resizeMode="contain"
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
                        Qty: {qty} · ₹{Math.round(discountedPrice * qty)}
                      </Text>
                    </View>
                  </View>
                );
              })}
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

            {/* ✅ Only show Bag Savings when there's a real discount */}
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

            {/* ✅ Only show Coupon Discount when it's real */}
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

            {/* ✅ Only show savings banner when there's real savings */}
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

      {/* ============ ADDRESS BOTTOM SHEET ============ */}
      <Modal
        visible={addressModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setAddressModalVisible(false)}
      >
        <View style={dyn.bottomSheetOverlay}>
          <TouchableOpacity
            style={dyn.bottomSheetBackdrop}
            activeOpacity={1}
            onPress={() => setAddressModalVisible(false)}
          />
          <View style={dyn.bottomSheet}>
            <View style={dyn.sheetHandle} />

            <View style={dyn.sheetHeader}>
              <Text style={dyn.sheetTitle}>Select Delivery Address</Text>
              <TouchableOpacity
                onPress={() => setAddressModalVisible(false)}
                hitSlop={8}
              >
                <Ionicons name="close" size={s(22)} color="#333" />
              </TouchableOpacity>
            </View>

            <ScrollView
              style={dyn.sheetScroll}
              showsVerticalScrollIndicator={false}
            >
              {addresses.length === 0 ? (
                <View style={dyn.noAddressBox}>
                  <Ionicons
                    name="location-outline"
                    size={s(40)}
                    color="#CCC"
                  />
                  <Text style={dyn.noAddressText}>
                    No addresses saved yet
                  </Text>
                </View>
              ) : (
                addresses.map((addr, idx) => {
                  const isSelected =
                    address &&
                    address.street === addr.street &&
                    address.zipCode === addr.zipCode &&
                    address.city === addr.city;

                  return (
                    <TouchableOpacity
                      key={addr._id || `${idx}`}
                      style={[
                        dyn.addressCard,
                        isSelected && dyn.addressCardSelected,
                      ]}
                      activeOpacity={0.8}
                      onPress={() => selectAddress(addr)}
                    >
                      <View style={dyn.addressCardLeft}>
                        <Ionicons
                          name="location"
                          size={s(16)}
                          color={isSelected ? '#9E0E26' : '#666'}
                        />
                      </View>
                      <View style={dyn.addressCardBody}>
                        <Text style={dyn.addressCardTitle}>
                          {addr.name || addr.fullName || 'Delivery Address'}
                        </Text>
                        <Text style={dyn.addressCardLine}>
                          {[addr.street, addr.area, addr.city]
                            .filter(Boolean)
                            .join(', ')}
                        </Text>
                        <Text style={dyn.addressCardLine}>
                          {[addr.state, addr.country, addr.zipCode]
                            .filter(Boolean)
                            .join(' - ')}
                        </Text>
                        {addr.phone ? (
                          <Text style={dyn.addressCardPhone}>
                            📞 {addr.phone}
                          </Text>
                        ) : null}
                      </View>
                      {isSelected && (
                        <Ionicons
                          name="checkmark-circle"
                          size={s(20)}
                          color="#9E0E26"
                        />
                      )}
                    </TouchableOpacity>
                  );
                })
              )}
            </ScrollView>

            <TouchableOpacity
              style={dyn.addAddressBtn}
              activeOpacity={0.85}
              onPress={() => {
                setAddressModalVisible(false);
                setNewAddressModalVisible(true);
              }}
            >
              <Ionicons
                name="add-circle-outline"
                size={s(18)}
                color="#fff"
              />
              <Text style={dyn.addAddressBtnText}>Add New Address</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* ============ NEW ADDRESS MODAL ============ */}
      <Modal
        visible={newAddressModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setNewAddressModalVisible(false)}
      >
        <KeyboardAvoidingView
          style={dyn.bottomSheetOverlay}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <TouchableOpacity
            style={dyn.bottomSheetBackdrop}
            activeOpacity={1}
            onPress={() => setNewAddressModalVisible(false)}
          />
          <View style={dyn.bottomSheet}>
            <View style={dyn.sheetHandle} />

            <View style={dyn.sheetHeader}>
              <Text style={dyn.sheetTitle}>Add New Address</Text>
              <TouchableOpacity
                onPress={() => setNewAddressModalVisible(false)}
                hitSlop={8}
              >
                <Ionicons name="close" size={s(22)} color="#333" />
              </TouchableOpacity>
            </View>

            <ScrollView
              style={dyn.sheetScroll}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              <Text style={dyn.inputLabel}>Full Name</Text>
              <TextInput
                style={dyn.inputField}
                placeholder="Enter full name"
                placeholderTextColor="#999"
                value={newAddress.fullName}
                onChangeText={t =>
                  setNewAddress(p => ({ ...p, fullName: t }))
                }
              />

              <Text style={dyn.inputLabel}>Phone Number</Text>
              <TextInput
                style={dyn.inputField}
                placeholder="Enter phone number"
                placeholderTextColor="#999"
                keyboardType="phone-pad"
                value={newAddress.phone}
                onChangeText={t =>
                  setNewAddress(p => ({ ...p, phone: t }))
                }
              />

              <Text style={dyn.inputLabel}>Street Address</Text>
              <TextInput
                style={dyn.inputField}
                placeholder="House no, street, area"
                placeholderTextColor="#999"
                value={newAddress.street}
                onChangeText={t =>
                  setNewAddress(p => ({ ...p, street: t }))
                }
              />

              <View style={dyn.inputRow}>
                <View style={{ flex: 1, marginRight: s(6) }}>
                  <Text style={dyn.inputLabel}>City</Text>
                  <TextInput
                    style={dyn.inputField}
                    placeholder="City"
                    placeholderTextColor="#999"
                    value={newAddress.city}
                    onChangeText={t =>
                      setNewAddress(p => ({ ...p, city: t }))
                    }
                  />
                </View>
                <View style={{ flex: 1, marginLeft: s(6) }}>
                  <Text style={dyn.inputLabel}>State</Text>
                  <TextInput
                    style={dyn.inputField}
                    placeholder="State"
                    placeholderTextColor="#999"
                    value={newAddress.state}
                    onChangeText={t =>
                      setNewAddress(p => ({ ...p, state: t }))
                    }
                  />
                </View>
              </View>

              <Text style={dyn.inputLabel}>ZIP Code</Text>
              <TextInput
                style={dyn.inputField}
                placeholder="Enter ZIP code"
                placeholderTextColor="#999"
                keyboardType="number-pad"
                value={newAddress.zipCode}
                onChangeText={t =>
                  setNewAddress(p => ({ ...p, zipCode: t }))
                }
              />
            </ScrollView>

            <TouchableOpacity
              style={dyn.addAddressBtn}
              activeOpacity={0.85}
              onPress={handleSaveNewAddress}
            >
              <Ionicons
                name="checkmark-circle-outline"
                size={s(18)}
                color="#fff"
              />
              <Text style={dyn.addAddressBtnText}>Save Address</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
};

export default OrderConfirmationScreen;

/* ============ STATIC STYLES ============ */
const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#F5F5F5' },

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
  itemImage: { resizeMode: 'contain' },
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