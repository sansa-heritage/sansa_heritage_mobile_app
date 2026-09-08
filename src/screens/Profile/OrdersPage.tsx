import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Image,
  TouchableOpacity,
  Alert,
  SafeAreaView,
  StatusBar,
  Dimensions,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { cancelOrder, getOrders } from '../../api/orderApi';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../../models/types';
import LoadingService from '../../services/LoadingService';
import config from '../../config/config';

const { width } = Dimensions.get('window');

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
  status: 'Completed' | 'Cancelled' | 'Processing' | 'Shipped' | 'Delivered' | 'Pending';
  createdAt: string;
  updatedAt: string;
  __v: number;
};

const MyOrdersScreen: React.FC = () => {
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();
  const [orders, setOrders] = useState<Order[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState('');

  const fetchOrders = async () => {
    try {
      setLoading(true);
      LoadingService.show('Loading orders...');

      const response = await getOrders();

      if (!response) {
        throw new Error('Failed to fetch orders');
      }

      let ordersData = [];
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
    } catch (error: any) {
      console.error('Error fetching orders:', error);
      Alert.alert('Error', error.message || 'Failed to fetch orders');
    } finally {
      setLoading(false);
      LoadingService.hide();
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

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

  const handleCancelOrder = async (orderId: string) => {
    Alert.alert(
      'Cancel Order',
      'Are you sure you want to cancel this order?',
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Yes',
          onPress: async () => {
            try {
              LoadingService.show('Cancelling order...');
              const result = await cancelOrder(orderId);
              if (result) {
                await fetchOrders();
                Alert.alert('Success', 'Order cancelled successfully');
              }
            } catch (error) {
              Alert.alert('Error', 'Failed to cancel order');
            } finally {
              LoadingService.hide();
            }
          }
        },
      ]
    );
  };

  const getStatusColor = (status: string) => {
    const statusMap: { [key: string]: string } = {
      'Delivered': '#4CAF50',
      'Shipped': '#2196F3',
      'Processing': '#FF9800',
      'Cancelled': '#E53935',
      'Completed': '#4CAF50',
      'Pending': '#FF9800',
    };
    return statusMap[status] || '#666';
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    try {
      if (typeof dateString === 'string' && dateString.includes('at')) {
        const parts = dateString.split(' at ');
        if (parts.length === 2) {
          return parts[0];
        }
        const match = dateString.match(/([A-Za-z]+ \d{1,2}, \d{4})/);
        if (match) {
          return match[1];
        }
        return dateString;
      }
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        return dateString;
      }
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
        if (parts.length === 2) {
          return parts[1];
        }
        const match = dateString.match(/at (\d{1,2}:\d{2}:\d{2} (?:AM|PM))/);
        if (match) {
          return match[1];
        }
        return dateString;
      }
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        return 'N/A';
      }
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
        return `Estimated Delivery: ${formatDate(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString())}`;
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
    if (image.startsWith('http')) return { uri: image };
    if (image.startsWith('/')) return { uri: `${config.baseURL.replace(/\/$/, '')}${image}` };
    return { uri: `${config.baseURL.replace(/\/$/, '')}/${image}` };
  };

  const navigateToOrderDetails = (orderId: string) => {
    navigation.navigate('OrderDetails' as any, { orderId });
  };

  const renderItem = ({ item }: { item: Order }) => {
    const product = item.products[0] || {};
    const statusColor = getStatusColor(item.status);
    const imageSource = getImageSource(product?.image);

    return (
      <TouchableOpacity 
        style={styles.orderCard}
        onPress={() => navigateToOrderDetails(item._id)}
        activeOpacity={0.7}
      >
        {/* Status Badge - Top */}
        <View style={[styles.statusBadge, { backgroundColor: statusColor + '15' }]}>
          <Text style={[styles.statusText, { color: statusColor }]}>
            {item.status || 'Processing'}
          </Text>
        </View>

        {/* Date */}
        <Text style={styles.orderDate}>
          on {formatDate(item.createdAt)}, {formatTime(item.createdAt)} As per your request
        </Text>

        {/* Divider */}
        <View style={styles.divider} />

        {/* Product Info */}
        <View style={styles.productContainer}>
          {imageSource ? (
            <Image
              source={imageSource}
              style={styles.productImage}
              resizeMode="cover"
            />
          ) : (
            <View style={styles.productImagePlaceholder}>
              <Ionicons name="image-outline" size={30} color="#ccc" />
            </View>
          )}
          <View style={styles.productInfo}>
            <Text style={styles.productBrand}>Sansa Heritage</Text>
            <Text style={styles.productName} numberOfLines={2}>
              {product?.name || 'Product Name'}
            </Text>
            <Text style={styles.productMeta}>
              Size: {product?.size || 'M'} • Qty: {product?.quantity || 1}
            </Text>
          </View>
        </View>

        {/* Add Profile Button */}
        <TouchableOpacity style={styles.addProfileBtn}>
          <Text style={styles.addProfileText}>Who is this purchased for?</Text>
          <Text style={styles.addProfileLink}>Add Profile</Text>
        </TouchableOpacity>

        {/* Action Buttons */}
        <View style={styles.actionContainer}>
          <TouchableOpacity style={styles.buyAgainBtn}>
            <Text style={styles.buyAgainText}>BUY AGAIN</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.cancelOrderBtn}
            onPress={() => handleCancelOrder(item._id)}
          >
            <Text style={styles.cancelOrderText}>CANCEL ORDER</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  };

  const ListEmptyComponent = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="receipt-outline" size={80} color="#ddd" />
      <Text style={styles.emptyTitle}>No Orders Yet</Text>
      <Text style={styles.emptySubtitle}>
        {searchText ? `No results for "${searchText}"` : 'Start shopping to see your orders here'}
      </Text>
      <TouchableOpacity
        style={styles.shopBtn}
        onPress={() => navigation.navigate('Dashboard' as any)}
      >
        <Text style={styles.shopBtnText}>START SHOPPING</Text>
      </TouchableOpacity>
    </View>
  );

  if (loading && orders.length === 0) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#96252A" />
        <Text style={styles.loadingText}>Loading orders...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#f8f8f8" />
      <View style={styles.container}>
        {/* Search Bar */}
        <View style={styles.searchSection}>
          <Ionicons name="search-outline" size={20} color="#999" />
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
              <Ionicons name="close-circle" size={20} color="#999" />
            </TouchableOpacity>
          )}
        </View>

        {/* Orders Count */}
        <Text style={styles.orderCountText}>
          {filteredOrders.length} {filteredOrders.length === 1 ? 'order' : 'orders'} found
        </Text>

        {/* Orders List */}
        {filteredOrders.length > 0 ? (
          <FlatList
            data={filteredOrders}
            renderItem={renderItem}
            keyExtractor={(item) => item._id}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.listContent}
            onRefresh={fetchOrders}
            refreshing={loading}
          />
        ) : (
          <ListEmptyComponent />
        )}

        {/* End of Orders */}
        {filteredOrders.length > 0 && (
          <View style={styles.endContainer}>
            <Text style={styles.endText}>You have reached the end of your orders</Text>
          </View>
        )}

        <View style={styles.bottomSpacer} />
      </View>
    </SafeAreaView>
  );
};

export default MyOrdersScreen;

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
  loadingText: {
    marginTop: 10,
    fontSize: 14,
    color: '#666',
  },
  searchSection: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 4,
    marginHorizontal: 16,
    marginTop: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    paddingVertical: 10,
    paddingHorizontal: 8,
    color: '#151515',
  },
  orderCountText: {
    fontSize: 13,
    color: '#666',
    marginHorizontal: 16,
    marginBottom: 8,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  orderCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  statusBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 4,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  orderDate: {
    fontSize: 12,
    color: '#888',
    marginBottom: 8,
  },
  divider: {
    height: 1,
    backgroundColor: '#F0F0F0',
    marginVertical: 8,
  },
  productContainer: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  productImage: {
    width: 70,
    height: 70,
    borderRadius: 8,
    marginRight: 12,
    backgroundColor: '#f0f0f0',
  },
  productImagePlaceholder: {
    width: 70,
    height: 70,
    borderRadius: 8,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  productInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  productBrand: {
    fontSize: 12,
    color: '#96252A',
    fontWeight: '600',
    marginBottom: 2,
  },
  productName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#151515',
    marginBottom: 2,
  },
  productMeta: {
    fontSize: 12,
    color: '#888',
  },
  addProfileBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
    paddingHorizontal: 4,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
    marginBottom: 8,
  },
  addProfileText: {
    fontSize: 12,
    color: '#666',
  },
  addProfileLink: {
    fontSize: 12,
    color: '#96252A',
    fontWeight: '600',
  },
  actionContainer: {
    flexDirection: 'row',
    gap: 10,
  },
  buyAgainBtn: {
    flex: 1,
    backgroundColor: '#96252A',
    paddingVertical: 10,
    borderRadius: 6,
    alignItems: 'center',
  },
  buyAgainText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  cancelOrderBtn: {
    flex: 1,
    backgroundColor: '#fff',
    paddingVertical: 10,
    borderRadius: 6,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E53935',
  },
  cancelOrderText: {
    color: '#E53935',
    fontSize: 12,
    fontWeight: '600',
  },
  endContainer: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  endText: {
    fontSize: 12,
    color: '#888',
  },
  helpSection: {
    backgroundColor: '#fff',
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 80,
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
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F5F0EB',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
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
    lineHeight: 18,
  },
  contactBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: '#96252A',
    backgroundColor: 'transparent',
    marginLeft: 10,
  },
  contactBtnText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#96252A',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
    marginTop: 20,
    marginBottom: 100,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#151515',
    marginTop: 16,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#888',
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 24,
  },
  shopBtn: {
    backgroundColor: '#96252A',
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 8,
  },
  shopBtnText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
    letterSpacing: 0.5,
  },
  bottomSpacer: {
    height: 20,
  },
});