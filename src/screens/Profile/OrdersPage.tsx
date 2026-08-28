// import React, { useEffect, useState } from 'react';
// import { View, Text, StyleSheet, FlatList, Image, TouchableOpacity, Alert, Platform, ScrollView } from 'react-native';
// import { cancelOrder, getOrders } from '../../api/orderApi';


// type Order = {
//   _id: string;
//   userEmail?: string;
//   products: {
//     productId: string;
//     name: string;
//     price: number;
//     image: string;
//     _id: string;
//   }[];
//   createdAt: string;
//   status: 'Completed' | 'Cancelled';
// };

// const MyOrdersScreen: React.FC = () => {
//   const [orders, setOrders] = useState<Order[]>([]);
//   const [activeTab, setActiveTab] = useState<'Completed' | 'Cancelled'>('Completed');
//   const [refreshKey, setRefreshKey] = useState(0); // State to force re-render

//   useEffect(() => {
//     fetchOrders();
//   }, [refreshKey]); // Re-fetch orders when refreshKey changes

//   const handleCancelOrder = async (orderId: string) => {
//     console.log("Cancel clicked", orderId);

//     const confirmCancel = Platform.OS === 'web'
//     // ? window.confirm('Are you sure you want to cancel this order?')
//     await new Promise((resolve) => {
//       Alert.alert(
//         'Cancel Order',
//         'Are you sure you want to cancel this order?',
//         [
//           { text: 'No', style: 'cancel', onPress: () => resolve(false) },
//           { text: 'Yes', onPress: () => resolve(true) },
//         ]
//       );
//     });

//     if (confirmCancel) {
//       const res = await cancelOrder(orderId);
//       if (res) {
//         setRefreshKey(prev => prev + 1); // Trigger re-render to refresh list
//       }
//     }
//   };

//   const fetchOrders = async () => {
//     try {
//       const response = await getOrders();
//       if (!response || !response.orders) throw new Error('Failed to fetch orders');
//       setOrders(response.orders);
//     } catch (error: any) {
//       Alert.alert('Error', error.message || 'Failed to fetch orders');
//     }
//   };

//   // Filter orders based on the selected tab
//   const filteredOrders = orders.filter(order => order.status === activeTab);

//   const renderItem = ({ item }: { item: Order }) => (
//     <ScrollView contentContainerStyle={{ paddingBottom: 70 }}>
//       <View style={styles.orderCard}>
//         {item.products.map((product, index) => (
//           <View key={index} style={styles.productContainer}>
//             {/* Image Section */}
//             {product?.image && <Image source={{ uri: product.image }} style={styles.image} />}

//             {/* Product Details */}
//             <View style={styles.infoContainer}>
//               <View style={styles.row}>
//                 <Text style={styles.orderName}>{product?.name || 'N/A'}</Text>
//                 <Text style={styles.price}>₹{product?.price?.toFixed(2) || '0.00'}</Text>
//               </View>
//               <Text style={styles.date}>{item.createdAt}</Text>
//             </View>
//           </View>
//         ))}
//         {activeTab === 'Completed' && (
//           <TouchableOpacity style={styles.cancelButton} onPress={() => handleCancelOrder(item._id)}>
//             <Text style={styles.cancelButtonText}>Cancel</Text>
//           </TouchableOpacity>
//         )}
//       </View>
//     </ScrollView>
//   );

//   return (
//     <View style={styles.container}>
//       <Text style={styles.header}>My Orders</Text>

//       {/* Tab Navigation */}
//       <View style={styles.tabContainer}>
//         {['Completed', 'Cancelled'].map(tab => (
//           <TouchableOpacity
//             key={tab}
//             style={[styles.tabButton, activeTab === tab ? styles.activeTab : {}]}
//             onPress={() => setActiveTab(tab as 'Completed' | 'Cancelled')}
//           >
//             <Text style={styles.tabText}>{tab}</Text>
//           </TouchableOpacity>
//         ))}
//       </View>
//       {filteredOrders.length === 0 && (
//         <Text style={{ textAlign: 'center', marginTop: 20, color: '#888', fontSize: 16 }}>
//           Your orders will appear here shortly.
//         </Text>
//       )}
//       {/* Order List */}
//       <FlatList
//         data={filteredOrders}
//         renderItem={renderItem}
//         keyExtractor={(item) => item._id}
//         contentContainerStyle={styles.orderList}
//       />
//       {!orders && <Text>No Orders founds</Text>}
//     </View>
//   );
// };

// export default MyOrdersScreen;

// const styles = StyleSheet.create({
//   container: { flex: 1, backgroundColor: '#fff', padding: 16 },
//   header: { fontSize: 24, fontWeight: 'bold', textAlign: 'center', marginVertical: 20 },
//   refreshButton: {
//     alignSelf: 'center',
//     backgroundColor: '#007bff',
//     paddingVertical: 8,
//     paddingHorizontal: 20,
//     borderRadius: 5,
//     marginBottom: 10,
//   },
//   refreshText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
//   tabContainer: { flexDirection: 'row', justifyContent: 'center', marginBottom: 10 },
//   tabButton: { marginHorizontal: 16, paddingVertical: 8, borderBottomWidth: 4, borderBottomColor: 'transparent' },
//   activeTab: { borderBottomColor: '#ff0000' },
//   tabText: { fontSize: 16, color: '#000' },
//   orderList: { paddingTop: 10 },
//   orderCard: {
//     backgroundColor: '#F5F5F5',
//     padding: 12,
//     marginBottom: 10,
//     borderRadius: 10,
//     shadowColor: '#000',
//     shadowOffset: { width: 0, height: 2 },
//     shadowOpacity: 0.1,
//     shadowRadius: 2,
//   },
//   productContainer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
//   image: { width: 60, height: 60, borderRadius: 10, marginRight: 12 },
//   infoContainer: { flex: 1 },
//   row: { flexDirection: 'row', justifyContent: 'space-between' },
//   orderName: { fontSize: 16, fontWeight: '600', flexShrink: 1 },
//   price: { fontSize: 16, fontWeight: 'bold', color: '#000' },
//   date: { fontSize: 14, color: '#9E9E9E', marginTop: 4 },
//   cancelButton: { backgroundColor: '#ff4d4d', paddingVertical: 6, paddingHorizontal: 12, borderRadius: 6 },
//   cancelButtonText: { color: '#fff', fontSize: 14, fontWeight: 'bold' },
// });
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Image,
  TouchableOpacity,
  Alert,
  Platform,
  ScrollView,
  SafeAreaView,
  StatusBar,
  Dimensions,
  TextInput,
} from 'react-native';
import { cancelOrder, getOrders } from '../../api/orderApi';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../../models/types';

const { width } = Dimensions.get('window');

type Order = {
  _id: string;
  userEmail?: string;
  products: {
    productId: string;
    name: string;
    price: number;
    image: string;
    _id: string;
  }[];
  createdAt: string;
  status: 'Completed' | 'Cancelled' | 'Processing' | 'Shipped' | 'Delivered';
};

// HD Clothing Images - All Working URLs
const hdProductImages = {
  anarkali: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=400&h=400&fit=crop&crop=center&q=80',
  saree: 'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?w=400&h=400&fit=crop&crop=center&q=80',
  kurti: 'https://images.unsplash.com/photo-1627483298308-6749c9d173a6?w=400&h=400&fit=crop&crop=center&q=80',
  kurta: 'https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=400&h=400&fit=crop&crop=center&q=80',
  lehenga: 'https://images.unsplash.com/photo-1602810320072-7cf0a1a39348?w=400&h=400&fit=crop&crop=center&q=80',
  ethnic: 'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?w=400&h=400&fit=crop&crop=center&q=80',
};

// Static Order Data with HD Images
const staticOrders: Order[] = [
  {
    _id: '1',
    products: [{
      productId: 'p1',
      name: 'Maroon Embroidered Anarkali Set',
      price: 2699,
      image: hdProductImages.anarkali,
      _id: 'p1'
    }],
    createdAt: '2025-05-18T10:30:00.000Z',
    status: 'Delivered',
  },
  {
    _id: '2',
    products: [{
      productId: 'p2',
      name: 'Green Banarasi Silk Saree',
      price: 3299,
      image: hdProductImages.saree,
      _id: 'p2'
    }],
    createdAt: '2025-05-15T19:45:00.000Z',
    status: 'Shipped',
  },
  {
    _id: '3',
    products: [{
      productId: 'p3',
      name: 'Pink Floral Printed Kurti',
      price: 899,
      image: hdProductImages.kurti,
      _id: 'p3'
    }],
    createdAt: '2025-05-13T11:15:00.000Z',
    status: 'Processing',
  },
  {
    _id: '4',
    products: [{
      productId: 'p4',
      name: 'Black Embroidered Kurta Set',
      price: 1699,
      image: hdProductImages.lehenga,
      _id: 'p4'
    }],
    createdAt: '2025-05-10T14:30:00.000Z',
    status: 'Cancelled',
  },
];

const MyOrdersScreen: React.FC = () => {
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();
  const [orders, setOrders] = useState<Order[]>(staticOrders);
  const [filteredOrders, setFilteredOrders] = useState<Order[]>(staticOrders);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState('');

  useEffect(() => {
    // Using static data, no API call
  }, []);

  // Handle search
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
    console.log("Cancel clicked", orderId);

    if (Platform.OS === 'web') {
      const confirmCancel = window.confirm('Are you sure you want to cancel this order?');
      if (confirmCancel) {
        setOrders(prev => prev.filter(order => order._id !== orderId));
        setFilteredOrders(prev => prev.filter(order => order._id !== orderId));
      }
    } else {
      Alert.alert(
        'Cancel Order',
        'Are you sure you want to cancel this order?',
        [
          { text: 'No', style: 'cancel' },
          {
            text: 'Yes',
            onPress: () => {
              setOrders(prev => prev.filter(order => order._id !== orderId));
              setFilteredOrders(prev => prev.filter(order => order._id !== orderId));
            }
          },
        ]
      );
    }
  };

  const fetchOrders = async () => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
    }, 500);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Delivered':
        return '#4CAF50';
      case 'Shipped':
        return '#2196F3';
      case 'Processing':
        return '#FF9800';
      case 'Cancelled':
        return '#E53935';
      case 'Completed':
        return '#4CAF50';
      default:
        return '#666';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Delivered':
        return 'checkmark-circle-outline';
      case 'Shipped':
        return 'car-outline';
      case 'Processing':
        return 'time-outline';
      case 'Cancelled':
        return 'close-circle-outline';
      case 'Completed':
        return 'checkmark-circle-outline';
      default:
        return 'ellipse-outline';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusText = (order: Order) => {
    switch (order.status) {
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
      default:
        return '';
    }
  };

  const navigateToOrderDetails = (item: Order) => {
    const product = item.products[0] || {};
    
    const orderData = {
      orderId: `#${item._id.padStart(6, '0')}`,
      status: item.status,
      deliveryDate: formatDate(item.createdAt),
      deliveryTime: formatTime(item.createdAt),
      placedDate: formatDate(item.createdAt),
      placedTime: formatTime(item.createdAt),
      productName: product?.name || 'Product Name',
      size: 'M',
      quantity: 1,
      price: product?.price || 0,
      itemTotal: product?.price || 0,
      shipping: 200,
      discount: 0,
      totalAmount: (product?.price || 0) + 200,
      address: {
        name: 'Neha Sharma',
        street: '12, Lotus Residency, MG Road',
        city: 'Indore',
        state: 'Madhya Pradesh',
        zipCode: '452001',
        country: 'India',
        phone: '9876543210'
      },
      paymentMethod: 'UPI',
      paidOn: formatDate(item.createdAt),
      paidAmount: (product?.price || 0) + 200,
      tracking: [
        { status: 'Order Placed', date: `${formatDate(item.createdAt)}, ${formatTime(item.createdAt)}`, completed: true },
        { status: 'Confirmed', date: formatDate(new Date(new Date(item.createdAt).getTime() + 30 * 60000).toISOString()), completed: true },
        { status: 'Shipped', date: formatDate(new Date(new Date(item.createdAt).getTime() + 24 * 60 * 60000).toISOString()), completed: item.status === 'Shipped' || item.status === 'Delivered' },
        { status: 'Out for Delivery', date: formatDate(new Date(new Date(item.createdAt).getTime() + 72 * 60 * 60000).toISOString()), completed: item.status === 'Delivered' },
        { status: 'Delivered', date: formatDate(new Date(new Date(item.createdAt).getTime() + 96 * 60 * 60000).toISOString()), completed: item.status === 'Delivered' },
      ]
    };

    navigation.navigate('OrderDetails' as any, { orderData });
  };

  const renderItem = ({ item }: { item: Order }) => {
    const product = item.products[0] || {};
    const statusColor = getStatusColor(item.status);
    const statusIcon = getStatusIcon(item.status);
    const statusText = getStatusText(item);

    return (
      <View style={styles.orderCard}>
        {/* Order Header */}
        <View style={styles.orderHeader}>
          <Text style={styles.orderId}>Order ID #{item._id.padStart(6, '0')}</Text>
          <View style={[styles.statusBadge, { backgroundColor: statusColor + '20' }]}>
            <Ionicons name={statusIcon} size={14} color={statusColor} />
            <Text style={[styles.statusText, { color: statusColor }]}>
              {item.status}
            </Text>
          </View>
        </View>

        <Text style={styles.orderDate}>
          Placed on {formatDate(item.createdAt)} · {formatTime(item.createdAt)}
        </Text>

        {/* Product Details - With HD Image */}
        <View style={styles.productContainer}>
          {product?.image ? (
            <Image 
              source={{ uri: product.image }} 
              style={styles.productImage}
              resizeMode="cover"
              onError={(e) => console.log('Image load error:', e.nativeEvent)}
            />
          ) : (
            <View style={styles.productImagePlaceholder}>
              <Ionicons name="image-outline" size={30} color="#ccc" />
            </View>
          )}
          <View style={styles.productInfo}>
            <Text style={styles.productName} numberOfLines={2}>
              {product?.name || 'Product Name'}
            </Text>
            <Text style={styles.productMeta}>
              Size: M · Qty: 1
            </Text>
          </View>
        </View>

        {/* Status Text */}
        <Text style={[styles.statusInfoText, { color: statusColor }]}>
          {statusText}
        </Text>

        {/* Action Buttons */}
        <View style={styles.actionContainer}>
          {(item.status === 'Delivered' || item.status === 'Completed') && (
            <TouchableOpacity 
              style={styles.orderDetailsBtn}
              onPress={() => navigateToOrderDetails(item)}
            >
              <Text style={styles.orderDetailsText}>Order Details</Text>
              <Ionicons name="chevron-forward" size={16} color="#96252A" />
            </TouchableOpacity>
          )}
          {item.status === 'Shipped' && (
            <View style={styles.actionRow}>
              <TouchableOpacity style={[styles.actionBtn, styles.trackBtn]}>
                <Text style={styles.trackBtnText}>Track Order</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.orderDetailsBtn}
                onPress={() => navigateToOrderDetails(item)}
              >
                <Text style={styles.orderDetailsText}>Order Details</Text>
                <Ionicons name="chevron-forward" size={16} color="#96252A" />
              </TouchableOpacity>
            </View>
          )}
          {item.status === 'Processing' && (
            <View style={styles.actionRow}>
              <TouchableOpacity
                style={[styles.actionBtn, styles.cancelBtn]}
                onPress={() => handleCancelOrder(item._id)}
              >
                <Text style={styles.cancelBtnText}>Cancel Order</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.orderDetailsBtn}
                onPress={() => navigateToOrderDetails(item)}
              >
                <Text style={styles.orderDetailsText}>Order Details</Text>
                <Ionicons name="chevron-forward" size={16} color="#96252A" />
              </TouchableOpacity>
            </View>
          )}
          {item.status === 'Cancelled' && (
            <TouchableOpacity 
              style={styles.orderDetailsBtn}
              onPress={() => navigateToOrderDetails(item)}
            >
              <Text style={styles.orderDetailsText}>Order Details</Text>
              <Ionicons name="chevron-forward" size={16} color="#96252A" />
            </TouchableOpacity>
          )}
        </View>
      </View>
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

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#f8f8f8" />
      <View style={styles.container}>
        {/* Header */}
        
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

        {/* Help Section */}
        <View style={styles.helpSection}>
          <View style={styles.helpRow}>
            <View style={styles.helpLeft}>
              <View style={styles.helpIconContainer}>
                <Ionicons name="headset" size={28} color="#96252A" />
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
              <Ionicons name="chevron-forward" size={18} color="#96252A" />
            </TouchableOpacity>
          </View>
        </View>

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

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#f8f8f8',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#151515',
  },

  // Search Bar
  searchSection: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 4,
    marginHorizontal: 16,
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

  // Order Count
  orderCountText: {
    fontSize: 13,
    color: '#666',
    marginHorizontal: 16,
    marginBottom: 8,
  },

  // List Content
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },

  // Order Card
  orderCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
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
    marginBottom: 4,
  },
  orderId: {
    fontSize: 15,
    fontWeight: '600',
    color: '#151515',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  orderDate: {
    fontSize: 12,
    color: '#888',
    marginBottom: 12,
  },

  // Product
  productContainer: {
    flexDirection: 'row',
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  productImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
    marginRight: 12,
    backgroundColor: '#f0f0f0',
  },
  productImagePlaceholder: {
    width: 60,
    height: 60,
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
  productName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#151515',
    marginBottom: 2,
  },
  productMeta: {
    fontSize: 12,
    color: '#888',
    marginBottom: 2,
  },

  // Status Info
  statusInfoText: {
    fontSize: 13,
    fontWeight: '500',
    marginBottom: 12,
  },

  // Action Buttons
  actionContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 8,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  actionBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  orderDetailsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  orderDetailsText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#96252A',
    marginRight: 2,
  },
  trackBtn: {
    backgroundColor: '#96252A',
  },
  trackBtnText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#fff',
  },
  cancelBtn: {
    backgroundColor: '#E53935',
  },
  cancelBtnText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#fff',
  },

  // Help Section
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
    fontSize: 14,
    fontWeight: '600',
    color: '#151515',
    marginBottom: 2,
  },
  helpSubtitle: {
    fontSize: 13,
    color: '#666',
    lineHeight: 18,
  },
  contactBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: '#96252A',
    backgroundColor: 'transparent',
    marginLeft: 10,
  },
  contactBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#96252A',
    marginRight: 2,
  },

  // Empty State
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