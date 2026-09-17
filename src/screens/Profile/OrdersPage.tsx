import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Image,
  TouchableOpacity,
  Alert,
  StatusBar,
  Dimensions,
  TextInput,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { cancelOrder, getOrders } from '../../api/orderApi';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../../models/types';
import LoadingService from '../../services/LoadingService';
import config from '../../config/config';
import eventBus from '../../services/eventBus';

const { width } = Dimensions.get('window');

/* ================= TYPES ================= */

type OrderProduct = {
  product: string;
  name: string;
  price: number;
  image: string;
  quantity: number;
  color?: string;
  _id: string;
};

type ShippingAddress = {
  street: string;
  city: string;
  state: string;
  country: string;
  zipCode: string;
};

type Order = {
  _id: string;
  user: {
    _id: string;
    email: string;
    isAdmin: boolean;
  };
  products: OrderProduct[];
  shippingAddress: ShippingAddress;
  totalPrice: number;
  status:
    | 'Completed'
    | 'Cancelled'
    | 'Processing'
    | 'Shipped'
    | 'Delivered'
    | 'Pending';
  createdAt: string;
  updatedAt: string;
  __v: number;
};

/* ================= COMPONENT ================= */

const MyOrdersScreen: React.FC = () => {
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();
  const insets = useSafeAreaInsets();

  const [orders, setOrders] = useState<Order[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState('');

  /* ================= FETCH ORDERS ================= */

  const fetchOrders = async () => {
    try {
      setLoading(true);
      LoadingService.show('Loading orders...');

      const response = await getOrders();

      if (!response) {
        throw new Error('Failed to fetch orders');
      }

      let ordersData: Order[] = [];
      if (response?.orders && Array.isArray(response.orders)) {
        ordersData = response.orders;
      } else if (Array.isArray(response)) {
        ordersData = response;
      } else if (response?.data && Array.isArray(response.data)) {
        ordersData = response.data;
      } else {
        ordersData = [];
      }

      ordersData.sort((a, b) => {
        const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return dateB - dateA;
      });

      setOrders(ordersData);
      setFilteredOrders(ordersData);

      eventBus.emit('ORDERS_UPDATED', { count: ordersData.length });
      console.log("My Orders Data---", ordersData)
    } catch (error: any) {
      console.error('Error fetching orders:', error);
      Alert.alert('Error', error.message || 'Failed to fetch orders');
      eventBus.emit('ORDERS_UPDATED', { count: 0 });
    } finally {
      setLoading(false);
      LoadingService.hide();
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  /* ================= SEARCH ================= */

  const handleSearch = (text: string) => {
    setSearchText(text);
    if (text.trim() === '') {
      setFilteredOrders(orders);
    } else {
      const filtered = orders.filter(order => {
        const product = order.products[0] || {};
        const productName = product?.name || '';
        return productName.toLowerCase().includes(text.toLowerCase());
      });
      setFilteredOrders(filtered);
    }
  };

  /* ================= CANCEL ORDER ================= */

  // const handleCancelOrder = async (orderId: string) => {
  //   Alert.alert('Cancel Order', 'Are you sure you want to cancel this order?', [
  //     { text: 'No', style: 'cancel' },
  //     {
  //       text: 'Yes',
  //       onPress: async () => {
  //         try {
  //           LoadingService.show('Cancelling order...');
  //           const result = await cancelOrder(orderId);
  //           if (result) {
  //             await fetchOrders();
  //             Alert.alert('Success', 'Order cancelled successfully');
  //           }
  //         } catch (error) {
  //           Alert.alert('Error', 'Failed to cancel order');
  //         } finally {
  //           LoadingService.hide();
  //         }
  //       },
  //     },
  //   ]);
  // };

  /* ================= HELPERS ================= */

  const getStatusColor = (status: string) => {
    const statusMap: { [key: string]: string } = {
      Delivered: '#4CAF50',
      Shipped: '#2196F3',
      Processing: '#FF9800',
      Cancelled: '#E53935',
      Completed: '#4CAF50',
      Pending: '#FF9800',
    };
    return statusMap[status] || '#666';
  };

  const getStatusIcon = (status: string) => {
    const statusMap: { [key: string]: string } = {
      Delivered: 'checkmark-circle',
      Shipped: 'car-outline',
      Processing: 'time-outline',
      Cancelled: 'close-circle-outline',
      Completed: 'checkmark-circle',
      Pending: 'time-outline',
    };
    return statusMap[status] || 'ellipse-outline';
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    try {
      if (typeof dateString === 'string' && dateString.includes('at')) {
        const parts = dateString.split(' at ');
        if (parts.length === 2) return parts[0];
        const match = dateString.match(/([A-Za-z]+ \d{1,2}, \d{4})/);
        if (match) return match[1];
        return dateString;
      }
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return dateString;
      return date.toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      });
    } catch {
      return dateString;
    }
  };

  const formatTime = (dateString: string) => {
    if (!dateString) return 'N/A';
    try {
      if (typeof dateString === 'string' && dateString.includes('at')) {
        const parts = dateString.split(' at ');
        if (parts.length === 2) return parts[1];
        const match = dateString.match(/at (\d{1,2}:\d{2}:\d{2} (?:AM|PM))/);
        if (match) return match[1];
        return dateString;
      }
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return 'N/A';
      return date.toLocaleTimeString('en-IN', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
      });
    } catch {
      return 'N/A';
    }
  };

  const getStatusText = (order: Order) => {
    const status = order.status || '';
    switch (status) {
      case 'Delivered':
        return `Delivered on ${formatDate(order.createdAt)}`;
      case 'Shipped':
        return `Estimated Delivery: ${formatDate(
          new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        )}`;
      case 'Processing':
        return 'Order is being processed';
      case 'Completed':
        return `Completed on ${formatDate(order.createdAt)}`;
      case 'Cancelled':
        return 'Order cancelled';
      case 'Pending':
        return 'Order is pending confirmation';
      default:
        return status || '';
    }
  };

  const getImageSource = (image: string) => {
    if (!image) return null;
    if (image.startsWith('data:image')) return { uri: image };
    if (image.startsWith('http://') || image.startsWith('https://'))
      return { uri: image };
    const base = config.baseURL.replace(/\/$/, '');
    if (image.startsWith('/')) return { uri: `${base}${image}` };
    return { uri: `${base}/${image}` };
  };

  const navigateToOrderDetails = (orderId: string) => {
    navigation.navigate('OrderDetails' as any, { orderId });
  };

  const splitTitle = (fullName: string, boldWords = 2) => {
    const words = (fullName || '').trim().split(/\s+/);
    if (words.length <= boldWords) {
      return { boldPart: fullName || '', normalPart: '' };
    }
    return {
      boldPart: words.slice(0, boldWords).join(' '),
      normalPart: words.slice(boldWords).join(' '),
    };
  };

  /* ================= RENDER ITEM ================= */

  const renderItem = ({ item }: { item: Order }) => {
    const product = item.products[0] || {};
    const imageSource = getImageSource(product?.image);
    const { boldPart, normalPart } = splitTitle(product?.name || 'Product');
    const statusColor = getStatusColor(item.status);

    return (
      <View style={styles.orderCard}>
        <View style={styles.orderHeader}>
          <View style={styles.orderHeaderLeft}>
            <Text style={styles.orderId}>Order #{item._id.slice(-6)}</Text>
          </View>
          <View style={styles.orderHeaderRight}>
            <TouchableOpacity
              style={styles.orderDetailsBtn}
              onPress={() => navigateToOrderDetails(item._id)}
              hitSlop={8}
            >
              <Ionicons name="chevron-forward" size={18} color="#151515" />
            </TouchableOpacity>
          </View>
        </View>

        <Text style={styles.orderDate}>
          Placed on {formatDate(item.createdAt)} · {formatTime(item.createdAt)}
        </Text>

        <View style={styles.productContainer}>
          {imageSource ? (
            <Image
              source={imageSource}
              style={styles.productImage}
              resizeMode="cover"
            />
          ) : (
            <View style={styles.productImagePlaceholder}>
              <Ionicons name="image-outline" size={26} color="#ccc" />
            </View>
          )}
          <View style={styles.productInfo}>
            <Text style={styles.productName} numberOfLines={2}>
              <Text style={styles.productNameBold}>{boldPart}</Text>
              {normalPart ? (
                <Text style={styles.productNameNormal}> {normalPart}</Text>
              ) : null}
            </Text>
            <Text style={styles.productMeta}>
              Qty: {product?.quantity || 1}
            </Text>
            <Text style={styles.productPrice}>
              ₹{(product?.price || 0).toFixed(2)}
            </Text>
          </View>
        </View>
      </View>
    );
  };

  /* ================= EMPTY ================= */

  const ListEmptyComponent = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="receipt-outline" size={70} color="#ddd" />
      <Text style={styles.emptyTitle}>No Orders Yet</Text>
      <Text style={styles.emptySubtitle}>
        {searchText
          ? `No results for "${searchText}"`
          : 'Start shopping to see your orders here'}
      </Text>
      <TouchableOpacity
        style={styles.shopBtn}
        onPress={() => navigation.navigate('Dashboard' as any)}
      >
        <Text style={styles.shopBtnText}>START SHOPPING</Text>
      </TouchableOpacity>
    </View>
  );

  /* ================= LOADING ================= */

  if (loading && orders.length === 0) {
    return <View style={styles.loadingContainer} />;
  }

  /* ================= UI ================= */

  return (
    // ✅ Plain View — no top inset (Header above already handles it)
    <View style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#f8f8f8" />
      <View style={styles.container}>
        {/* Search bar — sits right below header */}
        <View style={styles.searchSection}>
          <Ionicons name="search-outline" size={18} color="#999" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search orders..."
            placeholderTextColor="#999"
            value={searchText}
            onChangeText={handleSearch}
            returnKeyType="search"
          />
          {searchText.length > 0 && (
            <TouchableOpacity onPress={() => handleSearch('')}>
              <Ionicons name="close-circle" size={18} color="#999" />
            </TouchableOpacity>
          )}
        </View>

        {filteredOrders.length > 0 ? (
          <FlatList
            data={filteredOrders}
            renderItem={renderItem}
            keyExtractor={item => item._id}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={[
              styles.listContent,
              { paddingBottom: 120 + insets.bottom },
            ]}
            onRefresh={fetchOrders}
            refreshing={loading}
          />
        ) : (
          <ListEmptyComponent />
        )}

        {/* Help section auto-adjusts above Android nav bar / iPhone home bar */}
        <View
          style={[
            styles.helpSection,
            { marginBottom: Math.max(insets.bottom, 12) + 8 },
          ]}
        >
          <View style={styles.helpRow}>
            <View style={styles.helpLeft}>
              <View style={styles.helpIconContainer}>
                <Ionicons name="headset" size={24} color="#96252A" />
              </View>
              <View style={styles.helpTextContainer}>
                <Text style={styles.helpTitle}>Need help with your order?</Text>
                <Text style={styles.helpSubtitle}>
                  Our customer care team is here to help you.
                </Text>
              </View>
            </View>
            <TouchableOpacity style={styles.contactBtn}>
              <Text style={styles.contactBtnText}>Contact Us</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </View>
  );
};

export default MyOrdersScreen;

/* ================= STYLES ================= */

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f8f8f8',
  },
  container: {
    flex: 1,
    backgroundColor: '#f8f8f8',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },

  /* ✅ Search — reduced top gap */
  searchSection: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 2,
    marginHorizontal: 14,
    marginTop: 8,          // ← small gap below header
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    paddingVertical: 9,
    paddingHorizontal: 8,
    color: '#151515',
  },
  orderCountText: {
    fontSize: 12,
    color: '#666',
    marginHorizontal: 16,
    marginBottom: 8,
  },
  listContent: {
    paddingHorizontal: 14,
    paddingBottom: 16,
  },

  /* Card */
  orderCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    marginBottom: 14,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 2,
  },
  orderHeaderLeft: {
    flex: 1,
  },
  orderHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  orderId: {
    fontSize: 14,
    fontWeight: '600',
    color: '#151515',
  },
  orderDetailsBtn: {
    padding: 4,
  },
  orderDate: {
    fontSize: 11,
    color: '#888',
    marginBottom: 8,
  },

  /* Status pill (hidden but styles kept) */
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    marginBottom: 10,
    gap: 4,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
  },

  /* Product row */
  productContainer: {
    flexDirection: 'row',
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    padding: 10,
  },
  productImage: {
    width: 64,
    height: 64,
    borderRadius: 8,
    marginRight: 10,
    backgroundColor: '#f0f0f0',
  },
  productImagePlaceholder: {
    width: 64,
    height: 64,
    borderRadius: 8,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  productInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  productName: {
    fontSize: 12,
    color: '#151515',
    marginBottom: 3,
    lineHeight: 16,
  },
  productNameBold: {
    fontWeight: '700',
    color: '#151515',
  },
  productNameNormal: {
    fontWeight: '400',
    color: '#444',
  },
  productMeta: {
    fontSize: 11,
    color: '#888',
    marginBottom: 2,
  },
  productPrice: {
    fontSize: 13,
    fontWeight: '700',
    color: '#151515',
  },

  /* Help section */
  helpSection: {
    backgroundColor: '#fff',
    padding: 14,
    marginHorizontal: 14,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  helpRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  helpLeft: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    flex: 1,
  },
  helpIconContainer: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#F5F0EB',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  helpTextContainer: {
    flex: 1,
  },
  helpTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#151515',
    marginBottom: 2,
  },
  helpSubtitle: {
    fontSize: 10,
    color: '#666',
    lineHeight: 14,
  },
  contactBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: '#96252A',
    backgroundColor: 'transparent',
    marginLeft: 8,
  },
  contactBtnText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#96252A',
  },

  /* Empty */
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
    marginTop: 20,
    marginBottom: 100,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#151515',
    marginTop: 14,
  },
  emptySubtitle: {
    fontSize: 13,
    color: '#888',
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 22,
  },
  shopBtn: {
    backgroundColor: '#96252A',
    paddingHorizontal: 28,
    paddingVertical: 12,
    borderRadius: 8,
  },
  shopBtnText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 13,
    letterSpacing: 0.5,
  },
});