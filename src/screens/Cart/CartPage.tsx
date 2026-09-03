import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  Modal,
  Alert,
  SafeAreaView,
  Dimensions,
  TextInput,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import Ionicons from 'react-native-vector-icons/Ionicons';

import config from '../../config/config';
import { addToCart, removeFromCart } from '../../api/cartApi';
import { RootStackParamList } from '../../models/types';
import { Address } from '../../models/address';
import LoadingService from '../../services/LoadingService';

const { height, width } = Dimensions.get('window');

/* ================= TYPES ================= */

interface SizeInfo {
  _id: string;
  label: string;
  stock?: number;
}

interface ColorInfo {
  _id: string;
  name: string;
  hexCode?: string;
}

interface CartItem {
  productId: string;
  name: string;
  price: number | string;
  quantity: number | string;
  imageUrl: string;
  discount: number | string;
  size: string | SizeInfo | null;
  color: string | ColorInfo | null;
  cartItemId?: string;
  sizeLabel?: string;
  colorName?: string;
  colorHex?: string | null;
}

/* ================= COMPONENT ================= */

const CartScreen: React.FC = () => {
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();

  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [deliveryAddress, setDeliveryAddress] = useState<Address | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [addressModalVisible, setAddressModalVisible] = useState(false);
  const [qtyModalVisible, setQtyModalVisible] = useState(false);
  const [activeProductId, setActiveProductId] = useState<string | null>(null);
  const [activeItemIndex, setActiveItemIndex] = useState<number>(-1);

  // Coupon related states
  const [couponCode, setCouponCode] = useState('');
  const [couponApplied, setCouponApplied] = useState(false);
  const [couponDiscount, setCouponDiscount] = useState(0);
  const [showCouponInput, setShowCouponInput] = useState(false);

  const FREE_SHIPPING_THRESHOLD = 999;

  /* ================= HELPER: Get Size Label ================= */
  const getSizeLabel = (size: string | SizeInfo | null): string => {
    if (!size) return 'N/A';

    if (typeof size === 'object' && size.label) {
      return size.label.toUpperCase();
    }

    if (typeof size === 'string') {
      return size.toUpperCase();
    }

    return 'N/A';
  };

  /* ================= HELPER: Get Color Name ================= */
  const getColorName = (color: string | ColorInfo | null): string => {
    if (!color) return 'N/A';

    if (typeof color === 'object' && color.name) {
      return color.name;
    }

    if (typeof color === 'string') {
      if (color.match(/^[0-9a-fA-F]{24}$/)) {
        return 'Color';
      }
      return color;
    }

    return 'N/A';
  };

  /* ================= HELPER: Get Color Hex ================= */
  const getColorHex = (color: string | ColorInfo | null): string | null => {
    if (!color) return null;

    if (typeof color === 'object' && color.hexCode) {
      return color.hexCode;
    }

    return null;
  };

  /* ================= HELPER: Get Image Source ================= */
  const getImageSource = (imageUrl: string) => {
    if (!imageUrl) {
      return require('../../../assets/images/logo.png');
    }

    if (imageUrl.startsWith('data:image')) {
      return { uri: imageUrl };
    }

    if (imageUrl.startsWith('http')) {
      return { uri: imageUrl };
    }

    const baseURL = config.baseURL || 'https://ecappbe-sanasaheritages-projects.vercel.app/';
    return { uri: `${baseURL}${imageUrl}` };
  };

  /* ================= FETCH CART ================= */

  const fetchCart = async () => {
    LoadingService.show();
    setLoading(true);
    setError(null);

    try {
      const token = await AsyncStorage.getItem('authToken');

      if (!token) {
        setCartItems([]);
        LoadingService.hide();
        setLoading(false);
        return;
      }

      const baseURL = config.baseURL || 'https://ecappbe-sanasaheritages-projects.vercel.app/';
      const url = `${baseURL}api/cart/cartitems`;
      console.log('📦 Fetching cart from:', url);

      const res = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!res.ok) {
        if (res.status === 404) {
          setCartItems([]);
          LoadingService.hide();
          setLoading(false);
          return;
        }
        throw new Error(`Server error: ${res.status}`);
      }

      const data = await res.json();
      console.log('Cart data received:', data);

      if (!data || !data.items) {
        setCartItems([]);
        LoadingService.hide();
        setLoading(false);
        return;
      }

      const items = data.items || [];

      const enrichedItems = await Promise.all(
        items.map(async (item: CartItem, index: number) => {
          try {
            if (!item.productId) {
              console.log('Missing productId, skipping');
              return {
                ...item,
                sizeLabel: getSizeLabel(item.size),
                colorName: getColorName(item.color),
                colorHex: getColorHex(item.color),
                cartItemId: `${item.productId || 'unknown'}-${getColorName(item.color)}-${getSizeLabel(item.size)}-${index}`,
              };
            }

            const productRes = await fetch(
              `${baseURL}api/products/${item.productId}`,
              {
                headers: { 'Authorization': `Bearer ${token}` },
              },
            );

            if (!productRes.ok) {
              console.log('Product fetch failed for:', item.productId);
              return {
                ...item,
                sizeLabel: getSizeLabel(item.size),
                colorName: getColorName(item.color),
                colorHex: getColorHex(item.color),
                imageUrl: item.imageUrl || '',
                cartItemId: `${item.productId}-${getColorName(item.color)}-${getSizeLabel(item.size)}-${index}`,
              };
            }

            const productData = await productRes.json();

            let sizeLabel = getSizeLabel(item.size);
            let colorName = getColorName(item.color);
            let colorHex = getColorHex(item.color);

            if (productData && productData.sizes && Array.isArray(productData.sizes) && item.size) {
              const sizeId = typeof item.size === 'object' ? item.size._id : item.size;
              const foundSize = productData.sizes.find(
                (s: any) => s._id === sizeId,
              );
              if (foundSize && foundSize.label) {
                sizeLabel = foundSize.label;
              }
            }

            if (productData && productData.colors && Array.isArray(productData.colors) && item.color) {
              const colorId = typeof item.color === 'object' ? item.color._id : item.color;
              const foundColor = productData.colors.find(
                (c: any) => c._id === colorId,
              );
              if (foundColor) {
                if (foundColor.name) colorName = foundColor.name;
                if (foundColor.hexCode) colorHex = foundColor.hexCode;
              }
            }

            let imageUrl = item.imageUrl;
            if (productData && productData.image && (!imageUrl || imageUrl === '')) {
              imageUrl = productData.image;
            }
            if (productData && productData.images && productData.images.length > 0 && (!imageUrl || imageUrl === '')) {
              imageUrl = productData.images[0];
            }

            return {
              ...item,
              sizeLabel: sizeLabel,
              colorName: colorName,
              colorHex: colorHex,
              imageUrl: imageUrl || '',
              cartItemId: `${item.productId}-${colorName}-${sizeLabel}`,
            };
          } catch (err) {
            console.log('Error fetching product details:', err);
            return {
              ...item,
              sizeLabel: getSizeLabel(item.size),
              colorName: getColorName(item.color),
              colorHex: getColorHex(item.color),
              imageUrl: item.imageUrl || '',
              cartItemId: `${item.productId}-${getColorName(item.color)}-${getSizeLabel(item.size)}`,
            };
          }
        }),
      );

      const uniqueItems = enrichedItems.reduce((acc: CartItem[], current: CartItem) => {
        const existing = acc.find(item => item.cartItemId === current.cartItemId);
        if (existing) {
          const newQuantity = Number(existing.quantity) + Number(current.quantity);
          existing.quantity = newQuantity;
          return acc;
        }
        acc.push(current);
        return acc;
      }, []);

      setCartItems(uniqueItems);
    } catch (e: any) {
      console.error('Fetch cart error:', e);
      setError(e.message || 'Failed to load cart items');
      setCartItems([]);
    } finally {
      LoadingService.hide();
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCart();
  }, []);

  /* ================= FETCH ADDRESS ================= */

  useEffect(() => {
    const loadAddress = async () => {
      try {
        const token = await AsyncStorage.getItem('authToken');

        if (!token) return;

        const baseURL = config.baseURL || 'https://ecappbe-sanasaheritages-projects.vercel.app/';
        const res = await fetch(`${baseURL}api/auth/addresses`, {
          headers: { 'Authorization': `Bearer ${token}` },
        });

        if (!res.ok) return;

        const json = await res.json();
        setAddresses(json.addresses || []);

        const saved = await AsyncStorage.getItem('selectedAddress');
        if (saved) setDeliveryAddress(JSON.parse(saved));
      } catch (error) {
        console.error('Address load error:', error);
      }
    };

    loadAddress();
  }, []);

  /* ================= ADDRESS ================= */

  const selectAddress = async (address: Address) => {
    setDeliveryAddress(address);
    await AsyncStorage.setItem('selectedAddress', JSON.stringify(address));
    setAddressModalVisible(false);
  };

  /* ================= QTY ================= */

  const updateQuantity = async (newQty: number, index: number) => {
    const currentItem = cartItems[index];
    if (!currentItem) return;

    const currentQty = Number(currentItem.quantity);
    const diff = newQty - currentQty;

    if (diff === 0) return;

    LoadingService.show();

    try {
      let colorValue = null;
      if (currentItem.color) {
        if (typeof currentItem.color === 'object') {
          colorValue = currentItem.color._id || currentItem.color.name || null;
        } else {
          colorValue = currentItem.color;
        }
      }

      let sizeValue = null;
      if (currentItem.size) {
        if (typeof currentItem.size === 'object') {
          sizeValue = currentItem.size._id || currentItem.size.label || null;
        } else {
          sizeValue = currentItem.size;
        }
      }

      console.log('Updating quantity:', {
        productId: currentItem.productId,
        diff: diff,
        color: colorValue,
        size: sizeValue
      });

      if (diff > 0) {
        await addToCart(currentItem.productId, diff, colorValue, sizeValue);
      } else if (diff < 0) {
        await removeFromCart(currentItem.productId, Math.abs(diff), colorValue, sizeValue);
      }

      // Update local state
      setCartItems(prev =>
        prev.map((item, idx) =>
          idx === index ? { ...item, quantity: newQty } : item,
        ),
      );

    } catch (e) {
      console.log('Update quantity error:', e);
      Alert.alert('Error', 'Failed to update quantity. Please try again.');
    } finally {
      LoadingService.hide();
    }
  };

  /* ================= REMOVE ITEM ================= */

  const removeItem = async (index: number) => {
    const item = cartItems[index];
    if (!item) return;

    Alert.alert('Remove Item', 'Remove this item from cart?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: async () => {
          LoadingService.show();
          try {
            let productIdToRemove = String(item.productId);

            let colorValue = null;
            if (item.color) {
              if (typeof item.color === 'string') {
                const isObjectId = /^[0-9a-fA-F]{24}$/.test(item.color);
                if (isObjectId) {
                  colorValue = item.color;
                } else if (item.color !== 'N/A' && item.color !== 'Color') {
                  colorValue = item.color;
                }
              } else if (typeof item.color === 'object' && item.color !== null) {
                colorValue = item.color._id || item.color.name || null;
              }
            }

            let sizeValue = null;
            if (item.size) {
              if (typeof item.size === 'string') {
                const isObjectId = /^[0-9a-fA-F]{24}$/.test(item.size);
                if (isObjectId) {
                  sizeValue = item.size;
                } else if (item.size !== 'N/A') {
                  sizeValue = item.size;
                }
              } else if (typeof item.size === 'object' && item.size !== null) {
                sizeValue = item.size._id || item.size.label || null;
              }
            }

            console.log('🗑️ Removing item:', {
              productId: productIdToRemove,
              quantity: Number(item.quantity),
              color: colorValue,
              size: sizeValue,
              itemName: item.name
            });

            await removeFromCart(
              productIdToRemove,
              Number(item.quantity),
              colorValue,
              sizeValue
            );

            setCartItems(prev => prev.filter((_, i) => i !== index));
            await fetchCart();

            Alert.alert('Success', 'Item removed from cart');

          } catch (error: any) {
            console.error('❌ Remove item error:', error);

            if (error.message?.includes('not found')) {
              try {
                console.log('🔄 Retrying without color/size...');
                await removeFromCart(
                  String(item.productId),
                  Number(item.quantity),
                  null,
                  null
                );

                setCartItems(prev => prev.filter((_, i) => i !== index));
                await fetchCart();
                Alert.alert('Success', 'Item removed from cart');
              } catch (retryError: any) {
                console.error('❌ Retry failed:', retryError);
                await fetchCart();
                Alert.alert('Info', 'Item has been removed successfully.');
              }
            } else {
              Alert.alert('Error', error.message || 'Failed to remove item.');
            }
          } finally {
            LoadingService.hide();
          }
        },
      },
    ]);
  };

  /* ================= COUPON HANDLERS ================= */

  const handleApplyCoupon = () => {
    if (!couponCode.trim()) {
      Alert.alert('Error', 'Please enter a coupon code');
      return;
    }

    // Mock coupon validation - In real app, call API
    if (couponCode.toUpperCase() === 'SAVE10') {
      const total = bagTotal - savings;
      setCouponDiscount(total * 0.1);
      setCouponApplied(true);
      Alert.alert('Success', 'Coupon applied successfully!');
    } else if (couponCode.toUpperCase() === 'SAVE20') {
      const total = bagTotal - savings;
      setCouponDiscount(total * 0.2);
      setCouponApplied(true);
      Alert.alert('Success', 'Coupon applied successfully!');
    } else {
      Alert.alert('Invalid Coupon', 'Please enter a valid coupon code');
    }
  };

  const handleRemoveCoupon = () => {
    setCouponApplied(false);
    setCouponDiscount(0);
    setCouponCode('');
    setShowCouponInput(false);
  };

  /* ================= PRICE CALCULATIONS ================= */

  const bagTotal = cartItems.reduce(
    (s, i) => s + Number(i.price || 0) * Number(i.quantity || 0),
    0,
  );

  const savings = cartItems.reduce(
    (s, i) =>
      s +
      (Number(i.price || 0) *
        Number(i.discount || 0) *
        Number(i.quantity || 0)) /
      100,
    0,
  );

  const deliveryFee = cartItems.length ? 50 : 0;

  // Calculate if free shipping applies
  const subtotalAfterDiscount = bagTotal - savings;
  const isFreeShipping = subtotalAfterDiscount >= FREE_SHIPPING_THRESHOLD;
  const finalDeliveryFee = isFreeShipping ? 0 : deliveryFee;
  const remainingForFreeShipping = Math.max(0, FREE_SHIPPING_THRESHOLD - subtotalAfterDiscount);

  // Calculate progress percentage for free shipping
  const progressPercentage = Math.min((subtotalAfterDiscount / FREE_SHIPPING_THRESHOLD) * 100, 100);

  const amountPayable = subtotalAfterDiscount - couponDiscount + finalDeliveryFee;

  /* ================= LOADER ================= */

  if (error) {
    return (
      <View style={styles.emptyContainer}>
        <Ionicons name="alert-circle-outline" size={80} color="#E53935" />
        <Text style={styles.emptyTitle}>Something went wrong</Text>
        <Text style={styles.emptySubtitle}>{error}</Text>
        <TouchableOpacity style={styles.shopBtn} onPress={fetchCart}>
          <Text style={styles.shopBtnText}>RETRY</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (!cartItems.length && !loading) {
    return (
      <View style={styles.emptyContainer}>
        <Ionicons name="cart-outline" size={80} color="#bbb" />
        <Text style={styles.emptyTitle}>Your cart is empty</Text>
        <Text style={styles.emptySubtitle}>
          Looks like you haven't added anything yet
        </Text>
        <TouchableOpacity
          style={styles.shopBtn}
          onPress={() => navigation.navigate('Dashboard')}
        >
          <Text style={styles.shopBtnText}>CONTINUE SHOPPING</Text>
        </TouchableOpacity>
      </View>
    );
  }

  /* ================= UI ================= */

  const renderProductItem = ({ item, index }: { item: any; index: number }) => {
    const colorDisplay = item.colorName || getColorName(item.color);
    const sizeDisplay = item.sizeLabel || getSizeLabel(item.size);
    const colorHex = item.colorHex || getColorHex(item.color);
    const discountedPrice = Number(item.price) - (Number(item.price) * Number(item.discount || 0)) / 100;

    return (
      <View style={styles.card}>
        <Image
          source={getImageSource(item.imageUrl)}
          style={styles.image}
          onError={(e) => {
            console.log('Image load error for:', item.name);
          }}
        />

        <View style={styles.info}>
          <Text style={styles.name} numberOfLines={2}>
            {item.name || 'Product'}
          </Text>
          <Text style={styles.variantText}>
            Color: {colorDisplay} | Size: {sizeDisplay}
          </Text>

          <View style={styles.priceRow}>
            <Text style={styles.price}>
              ₹{discountedPrice.toFixed(0)}
            </Text>
            <Text style={styles.mrp}>₹{item.price}</Text>
            {Number(item.discount) > 0 && (
              <Text style={styles.discountBadge}>{item.discount}% OFF</Text>
            )}
          </View>

          <View style={styles.qtyRow}>
            <TouchableOpacity
              style={styles.qtyBtn}
              onPress={() => {
                const currentQty = Number(item.quantity);
                if (currentQty > 1) {
                  updateQuantity(currentQty - 1, index);
                }
              }}
            >
              <Text style={styles.qtyBtnText}>-</Text>
            </TouchableOpacity>
            <Text style={styles.qtyText}>{item.quantity}</Text>
            <TouchableOpacity
              style={styles.qtyBtn}
              onPress={() => {
                const currentQty = Number(item.quantity);
                updateQuantity(currentQty + 1, index);
              }}
            >
              <Text style={styles.qtyBtnText}>+</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <FlatList
          data={cartItems}
          keyExtractor={(item, index) => item.cartItemId || `${item.productId}-${index}`}
          renderItem={renderProductItem}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.flatListContent}
          ListHeaderComponent={
            <>
              {/* Delivery Address Section */}
              <View style={styles.sectionCard}>
                <View style={styles.addressRow}>
                  <Ionicons name="location-outline" size={18} color="#96252A" />
                  <View style={{ flex: 1, marginLeft: 6 }}>
                    <Text style={styles.smallLabel}>Deliver to</Text>
                    <Text style={styles.boldText} numberOfLines={1}>
                      {deliveryAddress
                        ? `${deliveryAddress.street}, ${deliveryAddress.city}`
                        : 'Select delivery address'}
                    </Text>
                  </View>
                  <TouchableOpacity onPress={() => setAddressModalVisible(true)}>
                    <Text style={styles.changeText}>Change</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </>
          }
          ListFooterComponent={
            <>
              {/* Coupon Section */}
              <View style={styles.sectionCard}>
                <TouchableOpacity
                  style={styles.couponHeader}
                  onPress={() => setShowCouponInput(!showCouponInput)}
                  activeOpacity={0.7}
                >
                  <View style={styles.couponLeft}>
                    <Ionicons name="pricetag-outline" size={20} color="#96252A" />
                    <View style={styles.couponTextContainer}>
                      <Text style={styles.couponTitle}>Apply Coupon Code</Text>
                      <Text style={styles.couponSubtext}>Get extra discounts on your order</Text>
                    </View>
                  </View>
                  <View style={styles.couponRight}>
                    <Text style={styles.couponApplyText}>Apply</Text>
                    <Ionicons
                      name={showCouponInput ? "chevron-up" : "chevron-forward"}
                      size={16}
                      color="#96252A"
                    />
                  </View>
                </TouchableOpacity>

                {showCouponInput && (
                  <View style={styles.couponInputContainer}>
                    <View style={styles.couponInputRow}>
                      <TextInput
                        style={styles.couponInput}
                        placeholder="Enter coupon code"
                        placeholderTextColor="#999"
                        value={couponCode}
                        onChangeText={setCouponCode}
                        editable={!couponApplied}
                        autoCapitalize="characters"
                      />
                      {couponApplied ? (
                        <TouchableOpacity
                          style={[styles.couponApplyBtn, styles.couponRemoveBtn]}
                          onPress={handleRemoveCoupon}
                        >
                          <Text style={styles.couponRemoveText}>Remove</Text>
                        </TouchableOpacity>
                      ) : (
                        <TouchableOpacity
                          style={styles.couponApplyBtn}
                          onPress={handleApplyCoupon}
                        >
                          <Text style={styles.couponApplyBtnText}>Apply</Text>
                        </TouchableOpacity>
                      )}
                    </View>
                    {couponApplied && (
                      <View style={styles.couponAppliedInfo}>
                        <Ionicons name="checkmark-circle" size={14} color="#4CAF50" />
                        <Text style={styles.couponAppliedText}>
                          Coupon applied! You saved ₹{couponDiscount.toFixed(0)}
                        </Text>
                      </View>
                    )}
                  </View>
                )}
              </View>

              {/* Free Shipping Progress Bar */}
              {cartItems.length > 0 && !isFreeShipping && (
                <View style={styles.freeShippingCard}>
                  <View style={styles.shippingRow}>
                    <Ionicons name="bicycle-outline" size={18} color="#4CAF50" />
                    <Text style={styles.shippingText}>
                      Add <Text style={styles.shippingAmount}>₹{remainingForFreeShipping.toFixed(0)}</Text> more to get FREE Shipping!
                    </Text>
                  </View>
                  <View style={styles.progressBarContainer}>
                    <View
                      style={[
                        styles.progressBar,
                        { width: `${progressPercentage}%` }
                      ]}
                    />
                  </View>
                  <View style={styles.progressLabels}>
                    <Text style={styles.progressLabel}>₹0</Text>
                    <Text style={styles.progressLabel}>₹{FREE_SHIPPING_THRESHOLD}</Text>
                  </View>
                </View>
              )}

              {/* Free Shipping Achieved */}
              {cartItems.length > 0 && isFreeShipping && (
                <View style={[styles.freeShippingCard, styles.shippingAchieved]}>
                  <View style={styles.shippingRow}>
                    <Ionicons name="checkmark-circle" size={18} color="#4CAF50" />
                    <Text style={styles.shippingAchievedText}>🎉 Free Shipping Applied!</Text>
                  </View>
                </View>
              )}

              {/* Order Details */}
              <View style={styles.orderDetailsCard}>
                <Text style={styles.sectionTitle}>Order Details</Text>
                <View style={styles.billRow}>
                  <Text style={styles.billLabel}>Bag Total</Text>
                  <Text style={styles.billValue}>₹{bagTotal.toFixed(0)}</Text>
                </View>
                <View style={styles.billRow}>
                  <Text style={styles.billLabel}>Savings</Text>
                  <Text style={styles.savingsValue}>-₹{savings.toFixed(0)}</Text>
                </View>
                {couponApplied && (
                  <View style={styles.billRow}>
                    <Text style={styles.billLabel}>Coupon Discount</Text>
                    <Text style={styles.savingsValue}>-₹{couponDiscount.toFixed(0)}</Text>
                  </View>
                )}
                <View style={styles.billRow}>
                  <Text style={styles.billLabel}>Delivery Fee</Text>
                  <Text style={[styles.billValue, isFreeShipping && styles.freeText]}>
                    {isFreeShipping ? 'FREE' : `₹${deliveryFee}`}
                  </Text>
                </View>
                <View style={styles.divider} />
                <View style={styles.billRow}>
                  <Text style={styles.totalLabel}>Amount Payable</Text>
                  <Text style={styles.totalValue}>₹{amountPayable.toFixed(0)}</Text>
                </View>
              </View>

              {/* Return/Refund Policy - FIXED DESIGN */}
              <View style={styles.policyCard}>
                <View style={styles.policyHeader}>
                  <View style={styles.policyIconCircle}>
                    <Ionicons name="shield-checkmark-outline" size={24} color="#96252A" />
                  </View>
                  <View style={styles.policyTextContainer}>
                    <Text style={styles.policyTitle}>Return/Refund policy</Text>
                    <Text style={styles.policyDesc}>
                      In case of return, we ensure quick refunds. Full amount will be refunded excluding convenience fee.
                    </Text>
                  </View>
                  <TouchableOpacity style={styles.policyRight}>
                    <Text style={styles.readPolicy}>Read policy</Text>
                    <Ionicons name="chevron-forward" size={14} color="#96252A" />
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.footerSpacer} />
            </>
          }
        />

        {/* FOOTER - PROCEED TO BUY BUTTON */}
        <View style={styles.footer}>
          <View>
            <Text style={styles.subTotal}>₹ {amountPayable.toFixed(0)}</Text>
            <Text style={styles.subLabel}>Total amount</Text>
          </View>
          <TouchableOpacity
            style={styles.checkoutBtn}
            onPress={() =>
              navigation.navigate('CheckoutPage' as any, {
                billingDetails: amountPayable,
                bagTotal: bagTotal,
                savings: savings,
                couponDiscount: couponDiscount,
                deliveryFee: finalDeliveryFee,
                isFreeShipping: isFreeShipping,
                subtotal: subtotalAfterDiscount,
                couponApplied: couponApplied,
              })
            }
          >
            <Text style={styles.checkoutText}>PROCEED TO BUY</Text>
          </TouchableOpacity>
        </View>

        {/* ADDRESS MODAL */}
        <Modal visible={addressModalVisible} transparent animationType="slide">
          <View style={styles.qtyModalOverlay}>
            <View style={styles.qtyModal}>
              <Text style={styles.modalTitle}>Select Delivery Address</Text>
              {addresses.map((addr, idx) => (
                <TouchableOpacity
                  key={idx}
                  style={styles.qtyOption}
                  onPress={() => selectAddress(addr)}
                >
                  <Text>
                    {addr.street}, {addr.city}
                  </Text>
                  <Text style={styles.addressSub}>
                    {addr.state} - {addr.zipCode}
                  </Text>
                </TouchableOpacity>
              ))}
              <TouchableOpacity
                style={[styles.qtyOption, styles.cancelButton]}
                onPress={() => setAddressModalVisible(false)}
              >
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        {/* QTY MODAL */}
        <Modal visible={qtyModalVisible} transparent animationType="slide">
          <View style={styles.qtyModalOverlay}>
            <View style={styles.qtyModal}>
              <Text style={styles.modalTitle}>Select Quantity</Text>
              {[1, 2, 3, 4, 5].map(q => (
                <TouchableOpacity
                  key={q}
                  style={styles.qtyOption}
                  onPress={() => {
                    if (activeItemIndex !== -1) {
                      updateQuantity(q, activeItemIndex);
                    }
                    setQtyModalVisible(false);
                    setActiveItemIndex(-1);
                  }}
                >
                  <Text>{q}</Text>
                </TouchableOpacity>
              ))}
              <TouchableOpacity
                style={[styles.qtyOption, styles.cancelButton]}
                onPress={() => {
                  setQtyModalVisible(false);
                  setActiveItemIndex(-1);
                }}
              >
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      </View>
    </SafeAreaView>
  );
};

export default CartScreen;

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f6f6f6',
  },
  container: {
    flex: 1,
    backgroundColor: '#f6f6f6',
  },
  flatListContent: {
    paddingBottom: 140,
  },
  sectionCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
    marginHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
    marginTop: 10,
  },
  addressRow: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  smallLabel: {
    fontSize: 11,
    color: '#888'
  },
  boldText: {
    fontWeight: '600',
    fontSize: 13,
    color: '#333',
  },
  changeText: {
    color: '#96252A',
    fontWeight: '600',
    fontSize: 12,
  },

  // Coupon Styles
  couponHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  couponLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  couponTextContainer: {
    marginLeft: 8,
    flex: 1,
  },
  couponTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#333',
  },
  couponSubtext: {
    fontSize: 10,
    color: '#999',
    marginTop: 1,
  },
  couponRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  couponApplyText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#96252A',
    marginRight: 4,
  },
  couponInputContainer: {
    marginTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
    paddingTop: 10,
  },
  couponInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  couponInput: {
    flex: 1,
    backgroundColor: '#F5F5F5',
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 13,
    color: '#333',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  couponApplyBtn: {
    backgroundColor: '#96252A',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
    marginLeft: 8,
    minWidth: 60,
    alignItems: 'center',
  },
  couponApplyBtnText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 13,
  },
  couponRemoveBtn: {
    backgroundColor: '#E53935',
  },
  couponRemoveText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 13,
  },
  couponAppliedInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  couponAppliedText: {
    fontSize: 12,
    color: '#2E7D32',
    marginLeft: 6,
    fontWeight: '500',
  },

  // Free Shipping Styles
  freeShippingCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
    marginHorizontal: 16,
    borderWidth: 1,
    borderColor: '#E8F5E9',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  shippingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  shippingText: {
    fontSize: 12,
    color: '#333',
    fontWeight: '500',
    marginLeft: 6,
  },
  shippingAmount: {
    fontWeight: '700',
    color: '#96252A',
  },
  shippingAchieved: {
    borderColor: '#4CAF50',
    backgroundColor: '#F1F8E9',
  },
  shippingAchievedText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#2E7D32',
    marginLeft: 6,
  },
  progressBarContainer: {
    height: 5,
    backgroundColor: '#E0E0E0',
    borderRadius: 2.5,
    overflow: 'hidden',
    marginVertical: 4,
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#96252A',
    borderRadius: 2.5,
  },
  progressLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 2,
  },
  progressLabel: {
    fontSize: 9,
    color: '#999',
  },

  // Product Card
  card: {
    backgroundColor: '#fff',
    flexDirection: 'row',
    padding: 12,
    borderRadius: 12,
    marginBottom: 10,
    marginHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  image: {
    width: 80,
    height: 100,
    resizeMode: 'contain',
    borderRadius: 8
  },
  info: {
    flex: 1,
    marginLeft: 10
  },
  name: {
    fontWeight: '600',
    fontSize: 13,
    color: '#151515',
    marginBottom: 2,
  },
  variantText: {
    fontSize: 11,
    color: '#666',
    marginBottom: 4,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  price: {
    fontWeight: '700',
    fontSize: 15,
    color: '#96252A',
  },
  mrp: {
    textDecorationLine: 'line-through',
    marginLeft: 6,
    color: '#888',
    fontSize: 12,
  },
  discountBadge: {
    backgroundColor: '#FFEBEE',
    color: '#E53935',
    fontSize: 9,
    fontWeight: '700',
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 3,
    marginLeft: 6,
    overflow: 'hidden',
  },
  qtyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 6,
    overflow: 'hidden',
    alignSelf: 'flex-start',
  },
  qtyBtn: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    backgroundColor: '#F5F5F5',
  },
  qtyBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  qtyText: {
    paddingHorizontal: 12,
    fontSize: 13,
    fontWeight: '500',
    minWidth: 25,
    textAlign: 'center',
  },

  // Order Details
  orderDetailsCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    marginHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 8,
    color: '#333',
  },
  billRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 3,
  },
  billLabel: {
    color: '#666',
    fontSize: 13,
  },
  billValue: {
    fontWeight: '500',
    fontSize: 13,
  },
  savingsValue: {
    color: '#4CAF50',
    fontWeight: '500',
    fontSize: 13,
  },
  freeText: {
    color: '#4CAF50',
    fontWeight: '700',
  },
  divider: {
    height: 1,
    backgroundColor: '#F0F0F0',
    marginVertical: 6
  },
  totalLabel: {
    fontSize: 15,
    fontWeight: '700',
    color: '#333',
  },
  totalValue: {
    fontSize: 17,
    fontWeight: '800',
    color: '#96252A',
  },

  // Footer
  footer: {
    position: 'absolute',
    bottom: 80,
    left: 0,
    right: 0,
    padding: 12,
    paddingBottom: 14,
    backgroundColor: '#fff',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderColor: '#eee',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
  },
  subTotal: {
    fontSize: 17,
    fontWeight: '700',
    color: '#96252A',
  },
  subLabel: {
    fontSize: 11,
    color: '#666',
    marginTop: 1
  },
  checkoutBtn: {
    backgroundColor: '#000000',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    minWidth: 130,
    alignItems: 'center',
  },
  checkoutText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 13,
  },

  // Return/Refund Policy - FIXED
  policyCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    marginHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  policyHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  policyIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F5F0EB',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  policyTextContainer: {
    flex: 1,
  },
  policyTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#333',
    marginBottom: 2,
  },
  policyDesc: {
    fontSize: 10,
    color: '#666',
    lineHeight: 16,
    alignItems:'flex-start'
  },
  policyRight: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 5,
    paddingTop: 2,
    color:'#96252A',
  },
  readPolicy: {
    fontSize: 11,
    fontWeight: '600',
    color: '#96252A',
    marginRight: 2,
  },

  footerSpacer: {
    height: 80,
  },

  // Empty State
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#f6f6f6',
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginTop: 16
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#777',
    marginTop: 6,
    textAlign: 'center',
  },
  shopBtn: {
    marginTop: 20,
    backgroundColor: '#96252A',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  shopBtnText: {
    color: '#fff',
    fontWeight: '700'
  },

  // Modals
  qtyModalOverlay: {
    flex: 1,
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  qtyModal: {
    backgroundColor: '#fff',
    marginHorizontal: 40,
    borderRadius: 12,
    overflow: 'hidden',
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  qtyOption: {
    padding: 14,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  addressSub: {
    fontSize: 12,
    color: '#888',
    marginTop: 2
  },
  cancelButton: {
    borderBottomWidth: 0
  },
  cancelText: {
    color: '#E53935',
    fontWeight: '500'
  },
});