import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  // ActivityIndicator,
  Modal,
  Alert,
  SafeAreaView,
  Dimensions,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import Ionicons from 'react-native-vector-icons/Ionicons';

import config from '../../config/config';
import { addToCart, removeFromCart } from '../../api/cartApi';
import { RootStackParamList } from '../../models/types';
import { Address } from '../../models/address';
import LoadingService from '../../services/LoadingService'; // Import LoadingService


const { height } = Dimensions.get('window');

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
  size: string | SizeInfo;
  color: string | ColorInfo;
  cartItemId?: string;
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

  /* ================= HELPER: Get Size Label ================= */
  const getSizeLabel = (size: string | SizeInfo): string => {
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
  const getColorName = (color: string | ColorInfo): string => {
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
  const getColorHex = (color: string | ColorInfo): string | null => {
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
                sizeLabel: '',
                colorName: getColorName(item.color),
                imageUrl: item.imageUrl || '',
                cartItemId: `${item.productId}-${getColorName(item.color)}-${getSizeLabel(item.size)}-${index}`,
              };
            }

            const productData = await productRes.json();

            let sizeLabel = '';
            if (productData.sizes && Array.isArray(productData.sizes)) {
              const sizeId = typeof item.size === 'object' ? item.size._id : item.size;
              const foundSize = productData.sizes.find(
                (s: any) => s._id === sizeId,
              );
              if (foundSize && foundSize.label) {
                sizeLabel = foundSize.label;
              }
            }

            let colorName = getColorName(item.color);
            if (colorName === 'Color' && productData.colors && Array.isArray(productData.colors)) {
              const colorId = typeof item.color === 'object' ? item.color._id : item.color;
              const foundColor = productData.colors.find(
                (c: any) => c._id === colorId,
              );
              if (foundColor && foundColor.name) {
                colorName = foundColor.name;
              }
            }

            let imageUrl = item.imageUrl;
            if (productData.image && (!imageUrl || imageUrl === '')) {
              imageUrl = productData.image;
            }
            if (productData.images && productData.images.length > 0 && (!imageUrl || imageUrl === '')) {
              imageUrl = productData.images[0];
            }

            return {
              ...item,
              sizeLabel: sizeLabel,
              colorName: colorName,
              imageUrl: imageUrl,
              cartItemId: `${item.productId}-${colorName}-${sizeLabel}`,
            };
          } catch (err) {
            console.log('Error fetching product details:', err);
            return {
              ...item,
              sizeLabel: '',
              colorName: getColorName(item.color),
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
      LoadingService.hide();
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

  const openQtyModal = (productId: string, index: number) => {
    setActiveProductId(productId);
    setActiveItemIndex(index);
    setQtyModalVisible(true);
  };

  /* ================= QTY ================= */

  const updateQuantity = async (newQty: number) => {
    if (activeItemIndex === -1) return;

    const currentItem = cartItems[activeItemIndex];
    if (!currentItem) return;

    const currentQty = Number(currentItem.quantity);
    const diff = newQty - currentQty;

    LoadingService.show();

    try {
      // Safely get color value with null checks
      let colorValue = null;
      if (currentItem.color) {
        if (typeof currentItem.color === 'object') {
          colorValue = currentItem.color._id || currentItem.color.name || null;
        } else {
          colorValue = currentItem.color;
        }
      }

      // Safely get size value with null checks
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

      setCartItems(prev =>
        prev.map((item, index) =>
          index === activeItemIndex ? { ...item, quantity: newQty } : item,
        ),
      );

      setQtyModalVisible(false);
      setActiveItemIndex(-1);
    } catch (e) {
      console.log('Update quantity error:', e);
      Alert.alert('Error', 'Failed to update quantity. Please try again.');
    } finally {
      LoadingService.hide();
    }
  };

  /* ================= REMOVE ITEM ================= */

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
            // Safely get color value with null checks
            let colorValue = null;
            if (item.color) {
              if (typeof item.color === 'object') {
                colorValue = item.color._id || item.color.name || null;
              } else {
                colorValue = item.color;
              }
            }

            // Safely get size value with null checks
            let sizeValue = null;
            if (item.size) {
              if (typeof item.size === 'object') {
                sizeValue = item.size._id || item.size.label || null;
              } else {
                sizeValue = item.size;
              }
            }

            console.log('Removing item:', {
              productId: item.productId,
              quantity: Number(item.quantity),
              color: colorValue,
              size: sizeValue
            });

            await removeFromCart(
              item.productId,
              Number(item.quantity),
              colorValue,
              sizeValue
            );

            setCartItems(prev => prev.filter((_, i) => i !== index));

            // Refresh cart to ensure consistency
            await fetchCart();

          } catch (error) {
            console.error('Remove item error:', error);
            Alert.alert('Error', 'Failed to remove item. Please try again.');
          } finally {
            LoadingService.hide();
          }
        },
      },
    ]);
  };

  /* ================= PRICE ================= */

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
  const amountPayable = bagTotal - savings + deliveryFee;

  /* ================= LOADER ================= */

  // if (loading) {
  //   return (
  //     <View style={styles.loader}>
  //       <ActivityIndicator size="large" color="#151515" />
  //     </View>
  //   );
  // }

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

  if (!cartItems.length) {
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
    const colorHex = getColorHex(item.color);

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
          <View style={styles.titleRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.name} numberOfLines={2}>
                {item.name}
              </Text>
              <View style={styles.variantRow}>
                {colorHex && (
                  <View style={[styles.colorDot, { backgroundColor: colorHex }]} />
                )}
                <Text style={styles.variantText}>
                  Color: {colorDisplay}
                </Text>
              </View>
              {item.size && (
                <Text style={styles.variantText}>Size: {sizeDisplay}</Text>
              )}
            </View>
            <TouchableOpacity onPress={() => removeItem(index)}>
              <Ionicons name="trash-outline" size={18} color="#d32f2f" />
            </TouchableOpacity>
          </View>

          <View style={styles.priceRow}>
            <Text style={styles.price}>
              ₹
              {(
                Number(item.price) -
                (Number(item.price) * Number(item.discount || 0)) / 100
              ).toFixed(0)}
            </Text>
            <Text style={styles.mrp}>₹{item.price}</Text>
          </View>

          <View style={styles.variantContainer}>
            <View style={styles.qtyRow}>
              <Text>Qty: </Text>
              <TouchableOpacity
                style={styles.qtyDropdown}
                onPress={() => openQtyModal(item.productId, index)}
              >
                <Text>{item.quantity}</Text>
                <Ionicons name="chevron-down" size={16} />
              </TouchableOpacity>
            </View>
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
            <View style={styles.sectionCard}>
              <View style={styles.addressRow}>
                <Ionicons name="location-outline" size={18} />
                <View style={{ flex: 1, marginLeft: 8 }}>
                  <Text style={styles.smallLabel}>Deliver to</Text>
                  <Text style={styles.boldText} numberOfLines={2}>
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
          }
          ListFooterComponent={
            <>
              <View style={styles.sectionCard}>
                <Text style={styles.sectionTitle}>Order Details</Text>
                <View style={styles.billRow}>
                  <Text>Bag Total</Text>
                  <Text>₹{bagTotal.toFixed(0)}</Text>
                </View>
                <View style={styles.billRow}>
                  <Text>Savings</Text>
                  <Text style={{ color: 'green' }}>-₹{savings.toFixed(0)}</Text>
                </View>
                <View style={styles.billRow}>
                  <Text>Delivery Fee</Text>
                  <Text>₹{deliveryFee}</Text>
                </View>
                <View style={styles.divider} />
                <View style={styles.billRow}>
                  <Text style={styles.boldText}>Amount Payable</Text>
                  <Text style={styles.boldText}>₹{amountPayable.toFixed(0)}</Text>
                </View>
              </View>
              <View style={styles.policyCard}>
                <Text style={styles.policyTitle}>Return/Refund policy</Text>
                <Text style={styles.policyDesc}>
                  In case of return, we ensure quick refunds. Full amount will be
                  refunded excluding convenience fee.
                </Text>
                <TouchableOpacity>
                  <Text style={styles.readPolicy}>Read policy</Text>
                </TouchableOpacity>
              </View>
              {/* Bottom spacer for footer + tabs */}
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
              })
            }
          >
            <Text style={styles.checkoutText}>PROCEED TO BUY</Text>
          </TouchableOpacity>
        </View>

        {/* ADDRESS MODAL */}
        <Modal visible={addressModalVisible} transparent>
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
        <Modal visible={qtyModalVisible} transparent>
          <View style={styles.qtyModalOverlay}>
            <View style={styles.qtyModal}>
              <Text style={styles.modalTitle}>Select Quantity</Text>
              {[1, 2, 3, 4, 5].map(q => (
                <TouchableOpacity
                  key={q}
                  style={styles.qtyOption}
                  onPress={() => updateQuantity(q)}
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
  loader: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  flatListContent: {
    paddingBottom: 140, // Increased to account for footer + tabs
  },
  sectionCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    marginHorizontal: 16,
  },
  addressRow: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  smallLabel: {
    fontSize: 12,
    color: '#666'
  },
  boldText: {
    fontWeight: '700'
  },
  changeText: {
    color: '#1e88e5',
    fontWeight: '700'
  },
  card: {
    backgroundColor: '#fff',
    flexDirection: 'row',
    padding: 12,
    borderRadius: 12,
    marginBottom: 10,
    marginHorizontal: 16,
  },
  image: {
    width: 90,
    height: 110,
    resizeMode: 'contain',
    borderRadius: 8
  },
  info: {
    flex: 1,
    marginLeft: 12
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  name: {
    fontWeight: '600',
    flex: 1,
    marginRight: 8,
    fontSize: 14
  },
  variantRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2
  },
  colorDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 6,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  variantText: {
    fontSize: 12,
    color: '#666'
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4
  },
  price: {
    fontWeight: '700',
    fontSize: 16
  },
  mrp: {
    textDecorationLine: 'line-through',
    marginLeft: 6,
    color: '#888',
    fontSize: 12,
  },
  variantContainer: {
    marginTop: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sizeText: {
    fontSize: 13,
    color: '#555',
    fontWeight: '500'
  },
  qtyRow: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  qtyDropdown: {
    marginLeft: 6,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderColor: '#ddd',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 8,
  },
  billRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 4,
  },
  divider: {
    height: 1,
    backgroundColor: '#eee',
    marginVertical: 8
  },
  footer: {
    position: 'absolute',
    bottom: 80, // Account for tab bar height (usually 60px)
    left: 0,
    right: 0,
    padding: 14,
    paddingBottom: 16,
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
    fontSize: 18,
    fontWeight: '700'
  },
  subLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 2
  },
  checkoutBtn: {
    backgroundColor: '#000',
    paddingHorizontal: 22,
    paddingVertical: 14,
    borderRadius: 8,
    minWidth: 150,
    alignItems: 'center',
  },
  checkoutText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 14,
  },
  footerSpacer: {
    height: 100, // Space for footer + tabs
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
  policyCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    marginHorizontal: 16,
  },
  policyTitle: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 6
  },
  policyDesc: {
    fontSize: 13,
    color: '#555',
    lineHeight: 18
  },
  readPolicy: {
    marginTop: 6,
    fontSize: 13,
    fontWeight: '600',
    color: '#1e88e5',
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
    backgroundColor: '#000',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  shopBtnText: {
    color: '#fff',
    fontWeight: '700'
  },
});