import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  Modal,
  Alert,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import Ionicons from 'react-native-vector-icons/Ionicons';

import config from '../../config/config';
import { addToCart, removeFromCart } from '../../api/cartApi';
import { RootStackParamList } from '../../models/types';
import { Address } from '../../models/address';

/* ================= TYPES ================= */

interface SizeInfo {
  _id: string;
  label: string;
  stock?: number;
}

interface CartItem {
  productId: string;
  name: string;
  price: number | string;
  quantity: number | string;
  imageUrl: string;
  discount: number | string;
  size: string | SizeInfo;
  color: string;
  // ✅ Add unique identifier for cart item
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

    return 'Loading...';
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
    setLoading(true);
    setError(null);
    
    try {
      const token = await AsyncStorage.getItem('authToken');
      
      if (!token) {
        setCartItems([]);
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
          setLoading(false);
          return;
        }
        throw new Error(`Server error: ${res.status}`);
      }

      const data = await res.json();
      console.log('Cart data received:', data);

      if (!data || !data.items) {
        setCartItems([]);
        setLoading(false);
        return;
      }

      const items = data.items || [];

      // ✅ Enrich items with product details and create unique IDs
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
                imageUrl: item.imageUrl || '',
                cartItemId: `${item.productId}-${item.color || 'default'}-${item.size || 'default'}-${index}`,
              };
            }
            
            const productData = await productRes.json();

            let sizeLabel = '';
            if (productData.sizes && Array.isArray(productData.sizes)) {
              const foundSize = productData.sizes.find(
                (s: any) => s._id === item.size,
              );
              if (foundSize && foundSize.label) {
                sizeLabel = foundSize.label;
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
              imageUrl: imageUrl,
              // ✅ Create unique ID based on product + color + size
              cartItemId: `${item.productId}-${item.color || 'default'}-${item.size || 'default'}`,
            };
          } catch (err) {
            console.log('Error fetching product details:', err);
            return { 
              ...item, 
              sizeLabel: '', 
              imageUrl: item.imageUrl || '',
              cartItemId: `${item.productId}-${item.color || 'default'}-${item.size || 'default'}`,
            };
          }
        }),
      );

      // ✅ Remove duplicates based on cartItemId (keep the one with highest quantity)
      const uniqueItems = enrichedItems.reduce((acc: CartItem[], current: CartItem) => {
        const existing = acc.find(item => item.cartItemId === current.cartItemId);
        if (existing) {
          // If same item exists, combine quantities
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

  const updateQuantity = async (newQty: number) => {
    if (activeItemIndex === -1) return;
    
    const currentItem = cartItems[activeItemIndex];
    if (!currentItem) return;

    const currentQty = Number(currentItem.quantity);
    const diff = newQty - currentQty;

    try {
      if (diff > 0) {
        await addToCart(currentItem.productId, diff, currentItem.color, currentItem.size as string);
      } else if (diff < 0) {
        await removeFromCart(currentItem.productId, Math.abs(diff), currentItem.color, currentItem.size as string);
      }

      // ✅ Update local state
      setCartItems(prev =>
        prev.map((item, index) =>
          index === activeItemIndex ? { ...item, quantity: newQty } : item,
        ),
      );
      
      setQtyModalVisible(false);
      setActiveItemIndex(-1);
    } catch (e) {
      console.log(e);
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
          try {
            await removeFromCart(item.productId, Number(item.quantity), item.color, item.size as string);
            setCartItems(prev => prev.filter((_, i) => i !== index));
          } catch (error) {
            console.error('Remove item error:', error);
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

  if (loading) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color="#151515" />
      </View>
    );
  }

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

  const renderProductItem = ({ item, index }: { item: any; index: number }) => (
    <View style={styles.card}>
      <Image
        source={getImageSource(item.imageUrl)}
        style={styles.image}
        onError={(e) => {
          console.log('Image load error for:', item.name);
          // e.currentTarget.source = require('../assets/images/logo.png');
        }}
      />

      <View style={styles.info}>
        <View style={styles.titleRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.name} numberOfLines={2}>
              {item.name}
            </Text>
            {/* ✅ Show color and size if available */}
            {item.color && (
              <Text style={styles.variantText}>Color: {item.color}</Text>
            )}
            {item.size && (
              <Text style={styles.variantText}>Size: {item.sizeLabel || 'N/A'}</Text>
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

  return (
    <>
      <FlatList
        data={cartItems}
        keyExtractor={(item, index) => item.cartItemId || `${item.productId}-${index}`}
        renderItem={renderProductItem}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 90 }}
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
              <TouchableOpacity
                // onPress={() => navigation.navigate('ReturnRefundScreen')}
              >
                <Text style={styles.readPolicy}>Read policy</Text>
              </TouchableOpacity>
            </View>
          </>
        }
      />

      <View style={styles.footer}>
        <View>
          <Text style={styles.subTotal}>₹ {amountPayable.toFixed(0)}</Text>
          <Text style={styles.subLabel}>Total amount</Text>
        </View>
        <TouchableOpacity
          style={styles.checkoutBtn}
          onPress={() =>
            navigation.navigate('CheckoutPage', {
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
    </>
  );
};

export default CartScreen;

const styles = StyleSheet.create({
  loader: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  container: { padding: 16, backgroundColor: '#f6f6f6' },
  sectionCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    marginHorizontal: 16,
  },
  addressRow: { flexDirection: 'row', alignItems: 'center' },
  smallLabel: { fontSize: 12, color: '#666' },
  boldText: { fontWeight: '700' },
  changeText: { color: '#1e88e5', fontWeight: '700' },
  card: {
    backgroundColor: '#fff',
    flexDirection: 'row',
    padding: 12,
    borderRadius: 12,
    marginBottom: 10,
    marginHorizontal: 16,
  },
  image: { width: 90, height: 110, resizeMode: 'contain', borderRadius: 8 },
  info: { flex: 1, marginLeft: 12 },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  name: { fontWeight: '600', flex: 1, marginRight: 8, fontSize: 14 },
  variantText: { fontSize: 12, color: '#666', marginTop: 2 },
  priceRow: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
  price: { fontWeight: '700', fontSize: 16 },
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
  sizeText: { fontSize: 13, color: '#555', fontWeight: '500' },
  qtyRow: { flexDirection: 'row', alignItems: 'center' },
  qtyDropdown: {
    marginLeft: 6,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  sectionTitle: { fontSize: 16, fontWeight: '700' },
  billRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 4,
  },
  divider: { height: 1, backgroundColor: '#eee', marginVertical: 8 },
  footer: {
    position: 'absolute',
    bottom: 0,
    width: '100%',
    padding: 14,
    backgroundColor: '#fff',
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderColor: '#eee',
  },
  subTotal: { fontSize: 18, fontWeight: '700' },
  subLabel: { fontSize: 12, color: '#666', marginTop: 2 },
  checkoutBtn: {
    backgroundColor: '#000',
    paddingHorizontal: 22,
    paddingVertical: 14,
    borderRadius: 8,
  },
  checkoutText: { color: '#fff', fontWeight: '700' },
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
  addressSub: { fontSize: 12, color: '#888', marginTop: 2 },
  cancelButton: { borderBottomWidth: 0 },
  cancelText: { color: '#E53935', fontWeight: '500' },
  policyCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    marginHorizontal: 16,
  },
  policyTitle: { fontSize: 14, fontWeight: '700', marginBottom: 6 },
  policyDesc: { fontSize: 13, color: '#555', lineHeight: 18 },
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
  emptyTitle: { fontSize: 18, fontWeight: '700', marginTop: 16 },
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
  shopBtnText: { color: '#fff', fontWeight: '700' },
});
