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
import { snackbar } from '../../components/common/Snackbar';

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
  availableSizes?: SizeInfo[];
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
  const [sizeModalVisible, setSizeModalVisible] = useState(false);
  const [activeProductId, setActiveProductId] = useState<string | null>(null);
  const [activeItemIndex, setActiveItemIndex] = useState<number>(-1);

  const [couponCode, setCouponCode] = useState('');
  const [couponApplied, setCouponApplied] = useState(false);
  const [couponDiscount, setCouponDiscount] = useState(0);
  const [showCouponInput, setShowCouponInput] = useState(false);

  const FREE_SHIPPING_THRESHOLD = 999;

  /* ================= HELPERS ================= */

  const getSizeLabel = (size: string | SizeInfo | null): string => {
    if (!size) return 'N/A';
    let raw = '';
    if (typeof size === 'object' && size.label) raw = size.label;
    else if (typeof size === 'string') raw = size;
    if (!raw) return 'N/A';

    const upper = raw.toUpperCase().trim();
    const map: Record<string, string> = {
      SMALL: 'S',
      MEDIUM: 'M',
      LARGE: 'L',
      'EXTRA LARGE': 'XL',
      'EXTRA SMALL': 'XS',
      'DOUBLE EXTRA LARGE': 'XXL',
      '2XL': 'XXL',
      '3XL': 'XXXL',
    };
    return map[upper] || upper;
  };

  const getColorName = (color: string | ColorInfo | null): string => {
    if (!color) return 'N/A';
    if (typeof color === 'object' && color.name) return color.name;
    if (typeof color === 'string') {
      if (color.match(/^[0-9a-fA-F]{24}$/)) return 'Color';
      return color;
    }
    return 'N/A';
  };

  const getColorHex = (color: string | ColorInfo | null): string | null => {
    if (!color) return null;
    if (typeof color === 'object' && color.hexCode) return color.hexCode;
    return null;
  };

  const toCamelCase = (value?: string | null): string => {
    if (!value) return '';
    return value
      .toString()
      .trim()
      .toLowerCase()
      .split(/[\s_-]+/)
      .filter(Boolean)
      .map(w => w.charAt(0).toUpperCase() + w.slice(1))
      .join(' ');
  };

  const splitTitle = (fullName: string, boldWordCount = 2) => {
    const words = fullName.trim().split(/\s+/);
    if (words.length <= boldWordCount) {
      return { boldPart: fullName, normalPart: '' };
    }
    const boldPart = words.slice(0, boldWordCount).join(' ');
    const normalPart = words.slice(boldWordCount).join(' ');
    return { boldPart, normalPart };
  };

  const getImageSource = (imageUrl: string) => {
    if (!imageUrl) return require('../../../assets/images/logo.png');
    if (imageUrl.startsWith('data:image')) return { uri: imageUrl };
    if (imageUrl.startsWith('http')) return { uri: imageUrl };
    const baseURL =
      config.baseURL ||
      'https://ecappbe-sanasaheritages-projects.vercel.app/';
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

      const baseURL =
        config.baseURL ||
        'https://ecappbe-sanasaheritages-projects.vercel.app/';
      const url = `${baseURL}api/cart/cartitems`;

      const res = await fetch(url, {
        headers: {
          Authorization: `Bearer ${token}`,
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
              return {
                ...item,
                sizeLabel: getSizeLabel(item.size),
                colorName: getColorName(item.color),
                colorHex: getColorHex(item.color),
                availableSizes: [],
                cartItemId: `${item.productId || 'unknown'}-${getColorName(
                  item.color,
                )}-${getSizeLabel(item.size)}-${index}`,
              };
            }

            const productRes = await fetch(
              `${baseURL}api/products/${item.productId}`,
              {
                headers: { Authorization: `Bearer ${token}` },
              },
            );

            if (!productRes.ok) {
              return {
                ...item,
                sizeLabel: getSizeLabel(item.size),
                colorName: getColorName(item.color),
                colorHex: getColorHex(item.color),
                imageUrl: item.imageUrl || '',
                availableSizes: [],
                cartItemId: `${item.productId}-${getColorName(
                  item.color,
                )}-${getSizeLabel(item.size)}-${index}`,
              };
            }

            const productData = await productRes.json();

            let sizeLabel = getSizeLabel(item.size);
            let colorName = getColorName(item.color);
            let colorHex = getColorHex(item.color);
            const availableSizes: SizeInfo[] = Array.isArray(productData?.sizes)
              ? productData.sizes
              : [];

            if (
              productData &&
              productData.sizes &&
              Array.isArray(productData.sizes) &&
              item.size
            ) {
              const sizeId =
                typeof item.size === 'object' ? item.size._id : item.size;
              const foundSize = productData.sizes.find(
                (s: any) => s._id === sizeId,
              );
              if (foundSize && foundSize.label) {
                sizeLabel = getSizeLabel(foundSize.label);
              }
            }

            if (
              productData &&
              productData.colors &&
              Array.isArray(productData.colors) &&
              item.color
            ) {
              const colorId =
                typeof item.color === 'object' ? item.color._id : item.color;
              const foundColor = productData.colors.find(
                (c: any) => c._id === colorId,
              );
              if (foundColor) {
                if (foundColor.name) colorName = foundColor.name;
                if (foundColor.hexCode) colorHex = foundColor.hexCode;
              }
            }

            let imageUrl = item.imageUrl;
            if (
              productData &&
              productData.image &&
              (!imageUrl || imageUrl === '')
            ) {
              imageUrl = productData.image;
            }
            if (
              productData &&
              productData.images &&
              productData.images.length > 0 &&
              (!imageUrl || imageUrl === '')
            ) {
              imageUrl = productData.images[0];
            }

            return {
              ...item,
              sizeLabel,
              colorName,
              colorHex,
              imageUrl: imageUrl || '',
              availableSizes,
              cartItemId: `${item.productId}-${colorName}-${sizeLabel}`,
            };
          } catch (err) {
            return {
              ...item,
              sizeLabel: getSizeLabel(item.size),
              colorName: getColorName(item.color),
              colorHex: getColorHex(item.color),
              imageUrl: item.imageUrl || '',
              availableSizes: [],
              cartItemId: `${item.productId}-${getColorName(
                item.color,
              )}-${getSizeLabel(item.size)}`,
            };
          }
        }),
      );

      const uniqueItems = enrichedItems.reduce(
        (acc: CartItem[], current: CartItem) => {
          const existing = acc.find(
            item => item.cartItemId === current.cartItemId,
          );
          if (existing) {
            existing.quantity =
              Number(existing.quantity) + Number(current.quantity);
            return acc;
          }
          acc.push(current);
          return acc;
        },
        [],
      );

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

        const baseURL =
          config.baseURL ||
          'https://ecappbe-sanasaheritages-projects.vercel.app/';
        const res = await fetch(`${baseURL}api/auth/addresses`, {
          headers: { Authorization: `Bearer ${token}` },
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

  /* ================= SIZE CHANGE ================= */

  const updateSize = async (newSize: SizeInfo, index: number) => {
    const currentItem = cartItems[index];
    if (!currentItem) return;

    LoadingService.show();
    try {
      let colorValue: any = null;
      if (currentItem.color) {
        colorValue =
          typeof currentItem.color === 'object'
            ? currentItem.color._id || currentItem.color.name || null
            : currentItem.color;
      }

      let oldSizeValue: any = null;
      if (currentItem.size) {
        oldSizeValue =
          typeof currentItem.size === 'object'
            ? currentItem.size._id || currentItem.size.label || null
            : currentItem.size;
      }

      await removeFromCart(
        currentItem.productId,
        Number(currentItem.quantity),
        colorValue,
        oldSizeValue,
      );

      await addToCart(
        currentItem.productId,
        Number(currentItem.quantity),
        colorValue,
        newSize._id || newSize.label,
      );

      setCartItems(prev =>
        prev.map((it, idx) =>
          idx === index
            ? { ...it, size: newSize, sizeLabel: getSizeLabel(newSize) }
            : it,
        ),
      );

      setSizeModalVisible(false);
      setActiveItemIndex(-1);
    } catch (e: any) {
      console.log('Update size error:', e);
      snackbar.error('Failed to update size. Please try again.');
    } finally {
      LoadingService.hide();
    }
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
        colorValue =
          typeof currentItem.color === 'object'
            ? currentItem.color._id || currentItem.color.name || null
            : currentItem.color;
      }

      let sizeValue = null;
      if (currentItem.size) {
        sizeValue =
          typeof currentItem.size === 'object'
            ? currentItem.size._id || currentItem.size.label || null
            : currentItem.size;
      }

      if (diff > 0) {
        await addToCart(currentItem.productId, diff, colorValue, sizeValue);
      } else if (diff < 0) {
        await removeFromCart(
          currentItem.productId,
          Math.abs(diff),
          colorValue,
          sizeValue,
        );
      }

      setCartItems(prev =>
        prev.map((item, idx) =>
          idx === index ? { ...item, quantity: newQty } : item,
        ),
      );
    } catch (e) {
      console.log('Update quantity error:', e);
      snackbar.error('Failed to update quantity. Please try again.');
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
                if (isObjectId) colorValue = item.color;
                else if (item.color !== 'N/A' && item.color !== 'Color')
                  colorValue = item.color;
              } else if (typeof item.color === 'object' && item.color !== null) {
                colorValue = item.color._id || item.color.name || null;
              }
            }

            let sizeValue = null;
            if (item.size) {
              if (typeof item.size === 'string') {
                const isObjectId = /^[0-9a-fA-F]{24}$/.test(item.size);
                if (isObjectId) sizeValue = item.size;
                else if (item.size !== 'N/A') sizeValue = item.size;
              } else if (typeof item.size === 'object' && item.size !== null) {
                sizeValue = item.size._id || item.size.label || null;
              }
            }

            await removeFromCart(
              productIdToRemove,
              Number(item.quantity),
              colorValue,
              sizeValue,
            );

            setCartItems(prev => prev.filter((_, i) => i !== index));
            await fetchCart();

            snackbar.success('Item removed from cart');
          } catch (error: any) {
            console.error('❌ Remove item error:', error);

            if (error.message?.includes('not found')) {
              try {
                await removeFromCart(
                  String(item.productId),
                  Number(item.quantity),
                  null,
                  null,
                );

                setCartItems(prev => prev.filter((_, i) => i !== index));
                await fetchCart();
                snackbar.success('Item removed from cart');
              } catch (retryError: any) {
                await fetchCart();
                snackbar.info('Item has been removed successfully.');
              }
            } else {
              snackbar.error(error.message || 'Failed to remove item.');
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
      snackbar.warning('Please enter a coupon code');
      return;
    }

    if (couponCode.toUpperCase() === 'SAVE10') {
      const total = bagTotal - savings;
      setCouponDiscount(total * 0.1);
      setCouponApplied(true);
      snackbar.success('Coupon applied successfully!');
    } else if (couponCode.toUpperCase() === 'SAVE20') {
      const total = bagTotal - savings;
      setCouponDiscount(total * 0.2);
      setCouponApplied(true);
      snackbar.success('Coupon applied successfully!');
    } else {
      snackbar.error('Please enter a valid coupon code', 'Invalid Coupon');
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
  const subtotalAfterDiscount = bagTotal - savings;
  const isFreeShipping = subtotalAfterDiscount >= FREE_SHIPPING_THRESHOLD;
  const finalDeliveryFee = isFreeShipping ? 0 : deliveryFee;
  const remainingForFreeShipping = Math.max(
    0,
    FREE_SHIPPING_THRESHOLD - subtotalAfterDiscount,
  );
  const progressPercentage = Math.min(
    (subtotalAfterDiscount / FREE_SHIPPING_THRESHOLD) * 100,
    100,
  );
  const amountPayable =
    subtotalAfterDiscount - couponDiscount + finalDeliveryFee;

  const totalYouSaved = savings + couponDiscount;

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

  /* ================= PRODUCT ROW ================= */

  const renderProductItem = ({
    item,
    index,
  }: {
    item: any;
    index: number;
  }) => {
    const sizeDisplay = item.sizeLabel || getSizeLabel(item.size);
    const discountedPrice =
      Number(item.price) -
      (Number(item.price) * Number(item.discount || 0)) / 100;
    const isLast = index === cartItems.length - 1;
    const colorText = toCamelCase(item.colorName);
    const { boldPart, normalPart } = splitTitle(item.name || 'Product', 2);

    return (
      <View style={styles.itemWrapper}>
        <View style={styles.itemRow}>
          <View style={styles.imageBox}>
            <Image
              source={getImageSource(item.imageUrl)}
              style={styles.image}
              onError={() => {}}
            />
          </View>

          <View style={styles.info}>
            <TouchableOpacity
              style={styles.removeX}
              onPress={() => removeItem(index)}
              hitSlop={8}
            >
              <Ionicons name="close" size={16} color="#666" />
            </TouchableOpacity>

            <Text style={styles.name} numberOfLines={2}>
              <Text style={styles.nameBold}>{boldPart}</Text>
              {normalPart ? (
                <Text style={styles.nameNormal}> {normalPart}</Text>
              ) : null}
            </Text>

            <View style={styles.dropdownRow}>
              <TouchableOpacity
                style={styles.sizePill}
                activeOpacity={0.7}
                onPress={() => {
                  setActiveItemIndex(index);
                  setSizeModalVisible(true);
                }}
              >
                <Text style={styles.sizePillText} numberOfLines={1}>
                  Size: {sizeDisplay}
                </Text>
                <Ionicons name="chevron-down" size={11} color="#333" />
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.qtyPill}
                activeOpacity={0.7}
                onPress={() => {
                  setActiveItemIndex(index);
                  setQtyModalVisible(true);
                }}
              >
                <Text style={styles.qtyPillText} numberOfLines={1}>
                  Qty: {item.quantity}
                </Text>
                <Ionicons name="chevron-down" size={11} color="#333" />
              </TouchableOpacity>
            </View>

            {colorText && colorText !== 'N/A' && colorText !== 'Color' ? (
              <View style={styles.colorRow2}>
                <Text style={styles.colorLabel}>Color:</Text>
                <Text style={styles.colorNameText} numberOfLines={1}>
                  {colorText}
                </Text>
              </View>
            ) : null}

            <View style={styles.priceRow}>
              <Text style={styles.price}>₹{discountedPrice.toFixed(0)}</Text>
              {Number(item.discount) > 0 && (
                <>
                  <Text style={styles.mrp}>₹{item.price}</Text>
                  <Text style={styles.discountBadge}>
                    {item.discount}% Off
                  </Text>
                </>
              )}
            </View>
          </View>
        </View>

        {!isLast && <View style={styles.dashedDivider} />}
      </View>
    );
  };

  /* ================= UI ================= */

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <FlatList
          data={cartItems}
          keyExtractor={(item, index) =>
            item.cartItemId || `${item.productId}-${index}`
          }
          renderItem={renderProductItem}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.flatListContent}
          ListHeaderComponent={
            <View style={styles.sectionCard}>
              <View style={styles.addressRow}>
                <Ionicons name="location-outline" size={16} color="#96252A" />
                <View style={{ flex: 1, marginLeft: 6 }}>
                  <Text style={styles.smallLabel}>Deliver to</Text>
                  <Text style={styles.boldText} numberOfLines={1}>
                    {deliveryAddress
                      ? `${deliveryAddress.street}, ${deliveryAddress.city}`
                      : 'Select delivery address'}
                  </Text>
                </View>
                <TouchableOpacity
                  onPress={() => setAddressModalVisible(true)}
                >
                  <Text style={styles.changeText}>Change</Text>
                </TouchableOpacity>
              </View>
            </View>
          }
          ListFooterComponent={
            <>
              {/* Coupon */}
              <View style={styles.sectionCard}>
                <TouchableOpacity
                  style={styles.couponHeader}
                  onPress={() => setShowCouponInput(!showCouponInput)}
                  activeOpacity={0.7}
                >
                  <View style={styles.couponLeft}>
                    <Ionicons
                      name="pricetag-outline"
                      size={18}
                      color="#96252A"
                    />
                    <View style={styles.couponTextContainer}>
                      <Text style={styles.couponTitle}>
                        Apply Coupon Code
                      </Text>
                      <Text style={styles.couponSubtext}>
                        Get extra discounts on your order
                      </Text>
                    </View>
                  </View>
                  <View style={styles.couponRight}>
                    <Text style={styles.couponApplyText}>Apply</Text>
                    <Ionicons
                      name={showCouponInput ? 'chevron-up' : 'chevron-forward'}
                      size={14}
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
                          style={styles.couponRemoveIconBtn}
                          onPress={handleRemoveCoupon}
                          hitSlop={8}
                        >
                          <Ionicons
                            name="trash-outline"
                            size={18}
                            color="#E53935"
                          />
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
                        <Ionicons
                          name="checkmark-circle"
                          size={13}
                          color="#4CAF50"
                        />
                        <Text style={styles.couponAppliedText}>
                          Coupon applied! You saved ₹
                          {couponDiscount.toFixed(0)}
                        </Text>
                      </View>
                    )}
                  </View>
                )}
              </View>

              {/* Free shipping progress bar */}
              {cartItems.length > 0 && !isFreeShipping && (
                <View style={styles.freeShippingCard}>
                  <View style={styles.shippingRow}>
                    <Ionicons
                      name="bicycle-outline"
                      size={16}
                      color="#4CAF50"
                    />
                    <Text style={styles.shippingText}>
                      Add{' '}
                      <Text style={styles.shippingAmount}>
                        ₹{remainingForFreeShipping.toFixed(0)}
                      </Text>{' '}
                      more to get FREE Shipping!
                    </Text>
                  </View>
                  <View style={styles.progressBarContainer}>
                    <View
                      style={[
                        styles.progressBar,
                        { width: `${progressPercentage}%` },
                      ]}
                    />
                  </View>
                  <View style={styles.progressLabels}>
                    <Text style={styles.progressLabel}>₹0</Text>
                    <Text style={styles.progressLabel}>
                      ₹{FREE_SHIPPING_THRESHOLD}
                    </Text>
                  </View>
                </View>
              )}

              {/* Price Details */}
              <View style={styles.orderDetailsCard}>
                <Text style={styles.sectionTitle}>Price Details</Text>
                <View style={styles.billRow}>
                  <Text style={styles.billLabel}>Bag Total</Text>
                  <Text style={styles.billValue}>₹{bagTotal.toFixed(0)}</Text>
                </View>
                <View style={styles.billRow}>
                  <Text style={styles.billLabel}>Savings</Text>
                  <Text style={styles.savingsValue}>
                    -₹{savings.toFixed(0)}
                  </Text>
                </View>
                {couponApplied && (
                  <View style={styles.billRow}>
                    <Text style={styles.billLabel}>Coupon Discount</Text>
                    <Text style={styles.savingsValue}>
                      -₹{couponDiscount.toFixed(0)}
                    </Text>
                  </View>
                )}
                <View style={styles.billRow}>
                  <Text style={styles.billLabel}>Delivery Fee</Text>
                  <Text
                    style={[
                      styles.billValue,
                      isFreeShipping && styles.freeText,
                    ]}
                  >
                    {isFreeShipping ? 'FREE' : `₹${deliveryFee}`}
                  </Text>
                </View>
                <View style={styles.divider} />
                <View style={styles.billRow}>
                  <Text style={styles.totalLabel}>Amount Payable</Text>
                  <Text style={styles.totalValue}>
                    ₹{amountPayable.toFixed(0)}
                  </Text>
                </View>
              </View>

              {/* You're saving pill */}
              {totalYouSaved > 0 && (
                <View style={styles.savedCard}>
                  <View style={styles.savedPill}>
                    <View style={styles.savedIconCircle}>
                      <Ionicons name="pricetag" size={14} color="#fff" />
                    </View>
                    <Text style={styles.savedText}>
                      You're saving{' '}
                      <Text style={styles.savedAmount}>
                        ₹{totalYouSaved.toFixed(0)}
                      </Text>{' '}
                      on this order
                    </Text>
                  </View>
                </View>
              )}

              {/* Policy */}
              <View style={styles.policyCard}>
                <View style={styles.policyHeader}>
                  <View style={styles.policyIconCircle}>
                    <Ionicons
                      name="shield-checkmark-outline"
                      size={20}
                      color="#96252A"
                    />
                  </View>
                  <View style={styles.policyTextContainer}>
                    <Text style={styles.policyTitle}>
                      Return/Refund policy
                    </Text>
                    <Text style={styles.policyDesc}>
                      In case of return, we ensure quick refunds. Full amount
                      will be refunded excluding convenience fee.
                    </Text>
                  </View>
                  <TouchableOpacity
                    style={styles.policyRight}
                    onPress={() => navigation.navigate('PrivacyPolicy' as any)}
                  >
                    <Text style={styles.readPolicy}>Read policy</Text>
                    <Ionicons
                      name="chevron-forward"
                      size={12}
                      color="#96252A"
                    />
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.footerSpacer} />
            </>
          }
        />

        {/* FOOTER */}
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
                bagTotal,
                savings,
                couponDiscount,
                deliveryFee: finalDeliveryFee,
                isFreeShipping,
                subtotal: subtotalAfterDiscount,
                couponApplied,
              })
            }
          >
            <Text style={styles.checkoutText}>PLACE ORDER</Text>
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
                  <Text style={styles.optionText}>
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

        {/* SIZE MODAL */}
        <Modal visible={sizeModalVisible} transparent animationType="slide">
          <View style={styles.qtyModalOverlay}>
            <View style={styles.qtyModal}>
              <Text style={styles.modalTitle}>Select Size</Text>
              {activeItemIndex >= 0 &&
              cartItems[activeItemIndex]?.availableSizes?.length ? (
                cartItems[activeItemIndex].availableSizes!.map((s: SizeInfo) => {
                  const label = getSizeLabel(s);
                  const isCurrent =
                    getSizeLabel(cartItems[activeItemIndex]?.size) === label;
                  const isOut = s.stock === 0;
                  return (
                    <TouchableOpacity
                      key={s._id || label}
                      style={styles.qtyOption}
                      disabled={isOut}
                      onPress={() => {
                        if (activeItemIndex !== -1) {
                          updateSize(s, activeItemIndex);
                        }
                      }}
                    >
                      <Text
                        style={{
                          fontSize: 13,
                          color: isOut
                            ? '#C0C0C0'
                            : isCurrent
                            ? '#96252A'
                            : '#111',
                          fontWeight: isCurrent ? '700' : '500',
                        }}
                      >
                        {label}
                        {isOut ? '  (Out of stock)' : ''}
                      </Text>
                    </TouchableOpacity>
                  );
                })
              ) : (
                <Text style={styles.noDataText}>No sizes available</Text>
              )}
              <TouchableOpacity
                style={[styles.qtyOption, styles.cancelButton]}
                onPress={() => {
                  setSizeModalVisible(false);
                  setActiveItemIndex(-1);
                }}
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
                  <Text style={styles.optionText}>{q}</Text>
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

/* ================= STYLES ================= */

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
    marginTop: 10,
    borderWidth: 1,
    borderColor: '#EFEFEF',
  },
  addressRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  smallLabel: {
    fontSize: 10,
    color: '#888',
  },
  boldText: {
    fontWeight: '600',
    fontSize: 12,
    color: '#333',
  },
  changeText: {
    color: '#9E0E26',
    fontWeight: '600',
    fontSize: 11,
  },

  /* ── ITEM LIST ── */
  itemWrapper: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
  },
  itemRow: {
    flexDirection: 'row',
    paddingVertical: 14,
    paddingHorizontal: 14,
  },
  imageBox: {
    width: 100,
    height: 130,
    borderRadius: 8,
    backgroundColor: '#F8F8F8',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  image: {
    width: '90%',
    height: '90%',
    resizeMode: 'contain',
  },
  info: {
    flex: 1,
    marginLeft: 12,
    position: 'relative',
  },
  removeX: {
    position: 'absolute',
    top: -4,
    right: 0,
    padding: 4,
    zIndex: 2,
  },
  name: {
    fontSize: 12,
    color: '#111',
    paddingRight: 22,
    marginTop: 2,
    lineHeight: 16,
  },
  nameBold: {
    fontWeight: '700',
    color: '#111',
  },
  nameNormal: {
    fontWeight: '400',
    color: '#333',
  },

  dropdownRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 10,
  },

  sizePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 5,
    backgroundColor: '#fff',
  },
  sizePillText: {
    fontSize: 11,
    color: '#333',
    fontWeight: '500',
  },

  qtyPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 5,
    backgroundColor: '#fff',
  },
  qtyPillText: {
    fontSize: 11,
    color: '#333',
    fontWeight: '500',
  },

  colorRow2: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 8,
  },
  colorLabel: {
    fontSize: 11,
    color: '#333',
    fontWeight: '500',
  },
  colorNameText: {
    fontSize: 11,
    color: '#555',
    fontWeight: '600',
    flexShrink: 1,
  },

  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
    gap: 6,
    flexWrap: 'wrap',
  },
  price: {
    fontSize: 15,
    fontWeight: '800',
    color: '#111',
  },
  mrp: {
    fontSize: 11,
    color: '#999',
    textDecorationLine: 'line-through',
  },
  discountBadge: {
    fontSize: 11,
    color: '#9E0E26',
    fontWeight: '700',
  },

  dashedDivider: {
    borderBottomWidth: 1,
    borderStyle: 'dashed',
    borderBottomColor: '#D0D0D0',
    marginHorizontal: 14,
  },

  /* ── Coupon ── */
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
    fontSize: 12,
    fontWeight: '600',
    color: '#333',
  },
  couponSubtext: {
    fontSize: 9,
    color: '#999',
    marginTop: 1,
  },
  couponRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  couponApplyText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#9E0E26',
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
    fontSize: 12,
    color: '#333',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  couponApplyBtn: {
    backgroundColor: '#9E0E26',
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
    fontSize: 12,
  },
  couponRemoveIconBtn: {
    paddingHorizontal: 10,
    paddingVertical: 8,
    marginLeft: 8,
    minWidth: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  couponAppliedInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  couponAppliedText: {
    fontSize: 11,
    color: '#2E7D32',
    marginLeft: 6,
    fontWeight: '500',
  },

  freeShippingCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
    marginHorizontal: 16,
    borderWidth: 1,
    borderColor: '#E8F5E9',
  },
  shippingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  shippingText: {
    fontSize: 11,
    color: '#333',
    fontWeight: '500',
    marginLeft: 6,
  },
  shippingAmount: {
    fontWeight: '700',
    color: '#9E0E26',
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
    backgroundColor: '#9E0E26',
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

  orderDetailsCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    marginHorizontal: 16,
    borderWidth: 1,
    borderColor: '#EFEFEF',
  },
  sectionTitle: {
    fontSize: 14,
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
    fontSize: 12,
  },
  billValue: {
    fontWeight: '500',
    fontSize: 12,
  },
  savingsValue: {
    color: '#4CAF50',
    fontWeight: '500',
    fontSize: 12,
  },
  freeText: {
    color: '#4CAF50',
    fontWeight: '700',
  },
  divider: {
    height: 1,
    backgroundColor: '#F0F0F0',
    marginVertical: 6,
  },
  totalLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#333',
  },
  totalValue: {
    fontSize: 15,
    fontWeight: '800',
    color: '#9E0E26',
  },

  /* "You saved" pill */
  savedCard: {
    marginHorizontal: 16,
    marginBottom: 10,
  },
  savedPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F5E9',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#A5D6A7',
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  savedIconCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#4CAF50',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  savedText: {
    fontSize: 12,
    color: '#1B5E20',
    fontWeight: '600',
    flex: 1,
  },
  savedAmount: {
    fontWeight: '800',
    color: '#1B5E20',
    textDecorationLine: 'underline',
  },

  footer: {
    position: 'absolute',
    bottom: 40,
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
  },
  subTotal: {
    fontSize: 15,
    fontWeight: '700',
    color: '#9E0E26',
  },
  subLabel: {
    fontSize: 10,
    color: '#666',
    marginTop: 1,
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
    fontSize: 12,
  },

  policyCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    marginHorizontal: 16,
    borderWidth: 1,
    borderColor: '#EFEFEF',
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
    fontSize: 12,
    fontWeight: '700',
    color: '#333',
    marginBottom: 2,
  },
  policyDesc: {
    fontSize: 9,
    color: '#666',
    lineHeight: 14,
  },
  policyRight: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 5,
    paddingTop: 2,
  },
  readPolicy: {
    fontSize: 10,
    fontWeight: '600',
    color: '#9E0E26',
    marginRight: 2,
  },

  footerSpacer: {
    height: 60,
  },

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
    marginTop: 16,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#777',
    marginTop: 6,
    textAlign: 'center',
  },
  shopBtn: {
    marginTop: 20,
    backgroundColor: '#9E0E26',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  shopBtnText: {
    color: '#fff',
    fontWeight: '700',
  },

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
    fontSize: 15,
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
  optionText: {
    fontSize: 13,
    color: '#222',
    textAlign: 'center',
  },
  addressSub: {
    fontSize: 11,
    color: '#888',
    marginTop: 2,
  },
  noDataText: {
    padding: 14,
    textAlign: 'center',
    color: '#999',
    fontSize: 12,
  },
  cancelButton: {
    borderBottomWidth: 0,
  },
  cancelText: {
    color: '#E53935',
    fontWeight: '500',
    fontSize: 13,
  },
});