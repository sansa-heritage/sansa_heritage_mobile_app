import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  Dimensions,
  Image,
  ActivityIndicator,
  Alert,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { getOrderById } from '../../api/orderApi';
import LoadingService from '../../services/LoadingService';
import config from '../../config/config';

const { width } = Dimensions.get('window');

const scale = (size: number) => {
  const baseWidth = 375;
  return Math.round((width / baseWidth) * size);
};

// ✅ FIXED: Format date from API response
const formatDate = (dateString: string) => {
  if (!dateString) return 'N/A';
  try {
    // If date is already formatted (contains "at" or is a string)
    if (typeof dateString === 'string' && dateString.includes('at')) {
      const parts = dateString.split(' at ');
      if (parts.length === 2) {
        return parts[0];
      }
      // Try to extract date from string like "November 30, 2025 at 06:41:24 PM"
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

// ✅ FIXED: Format time from API response
const formatTime = (dateString: string) => {
  if (!dateString) return 'N/A';
  try {
    if (typeof dateString === 'string' && dateString.includes('at')) {
      const parts = dateString.split(' at ');
      if (parts.length === 2) {
        const timePart = parts[1];
        // Remove seconds if present
        const match = timePart.match(/(\d{1,2}:\d{2})(?::\d{2})?\s?(AM|PM)?/);
        if (match) {
          const hour = parseInt(match[1].split(':')[0]);
          const minute = match[1].split(':')[1];
          const ampm = match[2] || (hour >= 12 ? 'PM' : 'AM');
          const hour12 = hour % 12 || 12;
          return `${hour12}:${minute} ${ampm}`;
        }
        return timePart;
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

const OrderDetailsScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { orderId } = route.params || {};
  const [orderData, setOrderData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (orderId) {
      fetchOrderDetails();
    } else {
      setOrderData({
        orderId: '#SHH24578',
        status: 'Delivered',
        deliveryDate: '22 May, 2025',
        deliveryTime: '02:40 PM',
        placedDate: '18 May, 2025',
        placedTime: '10:30 AM',
        productName: 'Maroon Embroidered Anarkali Set',
        productImage: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=200&h=200&fit=crop&crop=center&q=80',
        size: 'M',
        quantity: 1,
        price: 2699,
        itemTotal: 2699,
        shipping: 200,
        discount: 499,
        totalAmount: 2499,
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
        paidOn: '18 May, 2025',
        paidAmount: 2499,
      });
      setLoading(false);
    }
  }, [orderId]);

  const fetchOrderDetails = async () => {
    try {
      setLoading(true);
      LoadingService.show('Loading order details...');

      const response = await getOrderById(orderId);

      if (!response || !response.success) {
        throw new Error('Failed to fetch order details');
      }

      const order = response.order;

      const product = order.products[0] || {};
      const itemTotal = (product?.price || 0) * (product?.quantity || 1);
      const totalAmount = order.totalPrice || 0;
      const discount = itemTotal - totalAmount;

      // ✅ Format dates using the helper functions
      const placedDate = formatDate(order.createdAt);
      const placedTime = formatTime(order.createdAt);
      const deliveryDate = formatDate(order.createdAt);
      const deliveryTime = formatTime(order.createdAt);

      const formattedData = {
        orderId: `#${order._id.slice(-6)}`,
        status: order.status || 'Processing',
        deliveryDate: deliveryDate,
        deliveryTime: deliveryTime,
        placedDate: placedDate,
        placedTime: placedTime,
        productName: product?.name || 'Product Name',
        productImage: product?.image || '',
        size: 'M',
        quantity: product?.quantity || 1,
        price: product?.price || 0,
        itemTotal: itemTotal,
        shipping: 0,
        discount: discount > 0 ? discount : 0,
        totalAmount: totalAmount,
        address: {
          name: 'Customer',
          street: order.shippingAddress?.street || '',
          city: order.shippingAddress?.city || '',
          state: order.shippingAddress?.state || '',
          zipCode: order.shippingAddress?.zipCode || '',
          country: order.shippingAddress?.country || '',
          phone: '0000000000'
        },
        paymentMethod: order.paymentInfo?.paymentMethod || 'N/A',
        paidOn: deliveryDate,
        paidAmount: totalAmount,
      };

      setOrderData(formattedData);
    } catch (error: any) {
      console.error('Error fetching order details:', error);
      Alert.alert('Error', error.message || 'Failed to load order details');
    } finally {
      setLoading(false);
      LoadingService.hide();
    }
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
        return 'checkmark-circle';
      case 'Shipped':
        return 'car-outline';
      case 'Processing':
        return 'time-outline';
      case 'Cancelled':
        return 'close-circle-outline';
      case 'Completed':
        return 'checkmark-circle';
      default:
        return 'ellipse-outline';
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#96252A" />
        <Text style={styles.loadingText}>Loading order details...</Text>
      </View>
    );
  }

  if (!orderData) {
    return (
      <View style={styles.emptyContainer}>
        <Ionicons name="alert-circle-outline" size={80} color="#E53935" />
        <Text style={styles.emptyTitle}>Order Not Found</Text>
        <TouchableOpacity
          style={styles.goBackBtn}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.goBackBtnText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#f8f8f8" />
      <View style={styles.container}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {/* Card 1: Order ID and Status */}
          <View style={styles.orderCard}>
            <View style={styles.orderCardInner}>
              <View style={styles.orderLeftSection}>
                <Text style={styles.orderIdLabel}>Order ID</Text>
                <Text style={styles.orderId}>{orderData.orderId}</Text>
                <Text style={styles.placedDate}>
                  Placed on {orderData.placedDate} • {orderData.placedTime}
                </Text>
              </View>

              <View style={styles.orderRightSection}>
                <View style={[styles.statusBadge, { backgroundColor: getStatusColor(orderData.status) + '15' }]}>
                  <Ionicons name={getStatusIcon(orderData.status)} size={scale(12)} color={getStatusColor(orderData.status)} />
                  <Text style={[styles.statusText, { color: getStatusColor(orderData.status) }]}>
                    {orderData.status}
                  </Text>
                </View>
                <Text style={styles.deliveryText}>
                  on {orderData.deliveryDate} • {orderData.deliveryTime}
                </Text>
                <TouchableOpacity style={styles.downloadBtn}>
                  <Ionicons name="download-outline" size={scale(12)} color="#96252A" />
                  <Text style={styles.downloadBtnText}>Download Invoice</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>

          <View style={styles.separator} />

          {/* Card 2: Order Items */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Order Items ({orderData.quantity})</Text>
            <View style={styles.productContainer}>
              {orderData.productImage ? (
                <Image
                  source={{ uri: orderData.productImage }}
                  style={styles.productImage}
                  resizeMode="cover"
                />
              ) : (
                <View style={styles.productImagePlaceholder}>
                  <Ionicons name="image-outline" size={30} color="#ccc" />
                </View>
              )}
              <View style={styles.productInfo}>
                <Text style={styles.productName}>{orderData.productName}</Text>
                <Text style={styles.productMeta}>
                  Size: {orderData.size} • Qty: {orderData.quantity}
                </Text>
                <Text style={styles.productPrice}>₹{orderData.price}</Text>
              </View>
            </View>

            <View style={styles.divider} />

            <View style={styles.billRow}>
              <Text style={styles.billLabel}>Item Total</Text>
              <Text style={styles.billValue}>₹{orderData.itemTotal}</Text>
            </View>
            <View style={styles.billRow}>
              <Text style={styles.billLabel}>Shipping</Text>
              <Text style={styles.billValue}>₹{orderData.shipping}</Text>
            </View>
            <View style={styles.billRow}>
              <Text style={styles.billLabel}>Discount</Text>
              <Text style={[styles.billValue, styles.discountValue]}>-₹{orderData.discount}</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Total Amount</Text>
              <Text style={styles.totalValue}>₹{orderData.totalAmount}</Text>
            </View>
          </View>

          <View style={styles.separator} />

          {/* Card 3: Delivery Address */}
          <View style={styles.card}>
            <View style={styles.addressHeader}>
              <View style={styles.addressIconContainer}>
                <Ionicons name="location-outline" size={scale(20)} color="#96252A" />
              </View>
              <Text style={styles.sectionTitle}>Delivery Address</Text>
            </View>
            <View style={styles.addressContent}>
              <Text style={styles.addressName}>{orderData.address?.name || 'Customer'}</Text>
              <Text style={styles.addressText}>{orderData.address?.street || ''}</Text>
              <Text style={styles.addressText}>
                {orderData.address?.city || ''}, {orderData.address?.state || ''} - {orderData.address?.zipCode || ''}
              </Text>
              <Text style={styles.addressText}>
                {orderData.address?.country || 'India'} • {orderData.address?.phone || ''}
              </Text>
            </View>
          </View>

          <View style={styles.separator} />

          {/* Card 4: Payment Details */}
          <View style={styles.card}>
            <View style={styles.paymentHeader}>
              <View style={styles.paymentIconContainer}>
                <Ionicons name="card-outline" size={scale(20)} color="#96252A" />
              </View>
              <Text style={styles.sectionTitle}>Payment Details</Text>
            </View>
            <View style={styles.paymentContent}>
              <View style={styles.paymentRow}>
                <Text style={styles.paymentLabel}>Payment Method</Text>
                <Text style={styles.paymentValue}>{orderData.paymentMethod || 'N/A'}</Text>
              </View>
              <View style={styles.paymentRow}>
                <Text style={styles.paymentLabel}>Paid on</Text>
                <Text style={styles.paymentValue}>{orderData.paidOn || 'N/A'}</Text>
              </View>
              <View style={styles.paymentRow}>
                <Text style={styles.paymentLabel}>Amount</Text>
                <Text style={styles.paymentValue}>₹{orderData.paidAmount || 0}</Text>
              </View>
            </View>
          </View>

          <View style={styles.separator} />

          {/* Card 5: Need Help */}
          <View style={styles.helpCard}>
            <View style={styles.helpLeft}>
              <View style={styles.helpIconContainer}>
                <Ionicons name="headset" size={scale(22)} color="#96252A" />
              </View>
              <View style={styles.helpTextContainer}>
                <Text style={styles.helpTitle}>Need Help?</Text>
                <Text style={styles.helpSubtitle}>We are here to help you with your order</Text>
              </View>
            </View>
            <TouchableOpacity style={styles.contactSupportBtn}>
              <Text style={styles.contactSupportText}>Contact Support</Text>
              <Ionicons name="chevron-forward" size={scale(14)} color="#96252A" />
            </TouchableOpacity>
          </View>

          <View style={styles.separator} />

          {/* Card 6: Action Buttons */}
          <View style={styles.actionButtonsContainer}>
            <TouchableOpacity style={[styles.actionBtn, styles.buyAgainBtn]}>
              <Text style={styles.buyAgainText}>Buy Again</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.actionBtn, styles.trackOrderBtn]}>
              <Text style={styles.trackOrderText}>Track Order</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.bottomSpacer} />
        </ScrollView>
      </View>
    </SafeAreaView>
  );
};

export default OrderDetailsScreen;

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f8f8f8',
  },
  container: {
    flex: 1,
    backgroundColor: '#f8f8f8',
  },
  scrollContent: {
    paddingHorizontal: scale(14),
    paddingBottom: 20,
    paddingTop: 12,
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
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#fff',
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginTop: 16,
    color: '#151515',
  },
  goBackBtn: {
    marginTop: 20,
    backgroundColor: '#96252A',
    paddingHorizontal: 30,
    paddingVertical: 12,
    borderRadius: 8,
  },
  goBackBtnText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },

  orderCard: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: scale(12),
    paddingVertical: scale(14),
    marginBottom: 0,
    shadowColor: 'transparent',
    shadowOpacity: 0,
    shadowRadius: 0,
    shadowOffset: { width: 0, height: 0 },
    elevation: 0,
  },
  orderCardInner: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  orderLeftSection: {
    flex: 1,
    justifyContent: 'flex-start',
  },
  orderRightSection: {
    flex: 1,
    alignItems: 'flex-end',
    justifyContent: 'flex-start',
  },

  separator: {
    height: 8,
    backgroundColor: '#F0F0F0',
    marginHorizontal: scale(-14),
  },

  card: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: scale(12),
    paddingVertical: scale(14),
    marginBottom: 0,
    shadowColor: 'transparent',
    shadowOpacity: 0,
    shadowRadius: 0,
    shadowOffset: { width: 0, height: 0 },
    elevation: 0,
  },

  orderIdLabel: {
    fontSize: scale(10),
    color: '#888',
    marginBottom: 2,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  orderId: {
    fontSize: scale(16),
    fontWeight: '700',
    color: '#151515',
    marginBottom: 4,
  },
  placedDate: {
    fontSize: scale(12),
    color: '#666',
    marginTop: 2,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: scale(8),
    paddingVertical: scale(3),
    borderRadius: 12,
    gap: 3,
    marginBottom: 4,
  },
  statusText: {
    fontSize: scale(10),
    fontWeight: '600',
  },
  deliveryText: {
    fontSize: scale(12),
    color: '#333',
    fontWeight: '500',
    marginBottom: 4,
    textAlign: 'right',
  },
  downloadBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  downloadBtnText: {
    fontSize: scale(11),
    color: '#96252A',
    fontWeight: '600',
  },

  cardTitle: {
    fontSize: scale(14),
    fontWeight: '700',
    color: '#151515',
    marginBottom: 10,
  },

  productContainer: {
    flexDirection: 'row',
    backgroundColor: '#F8F8F8',
    borderRadius: 8,
    padding: scale(10),
    marginBottom: 10,
  },
  productImage: {
    width: scale(50),
    height: scale(50),
    borderRadius: 8,
    marginRight: 10,
    backgroundColor: '#f0f0f0',
  },
  productImagePlaceholder: {
    width: scale(50),
    height: scale(50),
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
    fontSize: scale(12),
    fontWeight: '600',
    color: '#151515',
    marginBottom: 2,
  },
  productMeta: {
    fontSize: scale(10),
    color: '#888',
    marginBottom: 2,
  },
  productPrice: {
    fontSize: scale(12),
    fontWeight: '700',
    color: '#151515',
  },
  divider: {
    height: 1,
    backgroundColor: '#E8E8E8',
    marginVertical: 6,
  },
  billRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 2,
  },
  billLabel: {
    fontSize: scale(12),
    color: '#666',
  },
  billValue: {
    fontSize: scale(12),
    color: '#333',
    fontWeight: '500',
  },
  discountValue: {
    color: '#E53935',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 2,
  },
  totalLabel: {
    fontSize: scale(14),
    fontWeight: '700',
    color: '#151515',
  },
  totalValue: {
    fontSize: scale(16),
    fontWeight: '800',
    color: '#96252A',
  },

  // Delivery Address
  addressHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  addressIconContainer: {
    width: scale(32),
    height: scale(32),
    borderRadius: 16,
    backgroundColor: '#FCEBED',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  sectionTitle: {
    fontSize: scale(14),
    fontWeight: '700',
    color: '#151515',
  },
  addressContent: {
    paddingLeft: scale(42),
  },
  addressName: {
    fontSize: scale(13),
    fontWeight: '600',
    color: '#151515',
    marginBottom: 3,
  },
  addressText: {
    fontSize: scale(12),
    color: '#555',
    lineHeight: 18,
    marginBottom: 1,
  },

  // Payment Details
  paymentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  paymentIconContainer: {
    width: scale(32),
    height: scale(32),
    borderRadius: 16,
    backgroundColor: '#FCEBED',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  paymentContent: {
    paddingLeft: scale(42),
  },
  paymentRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 3,
  },
  paymentLabel: {
    fontSize: scale(12),
    color: '#888',
    flex: 1,
  },
  paymentValue: {
    fontSize: scale(13),
    color: '#333',
    fontWeight: '500',
    flex: 1,
    textAlign: 'right',
  },

  // Need Help
  helpCard: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: scale(12),
    paddingVertical: scale(14),
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: 'transparent',
    shadowOpacity: 0,
    shadowRadius: 0,
    shadowOffset: { width: 0, height: 0 },
    elevation: 0,
    marginBottom: 0,
  },
  helpLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  helpIconContainer: {
    width: scale(32),
    height: scale(32),
    borderRadius: 16,
    backgroundColor: '#F5F0EB',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  helpTextContainer: {
    flex: 1,
  },
  helpTitle: {
    fontSize: scale(12),
    fontWeight: '600',
    color: '#151515',
  },
  helpSubtitle: {
    fontSize: scale(10),
    color: '#666',
  },
  contactSupportBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: 'black',
    backgroundColor: 'transparent',
    marginLeft: 10,
  },
  contactSupportText: {
    fontSize: scale(11),
    fontWeight: '600',
    color: 'black',
    marginRight: 0,
    marginLeft: 5,
  },

  actionButtonsContainer: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 10,
    marginBottom: 70,
  },
  actionBtn: {
    flex: 1,
    paddingVertical: scale(10),
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buyAgainBtn: {
    backgroundColor: '#151515',
  },
  buyAgainText: {
    color: '#FFFFFF',
    fontSize: scale(12),
    fontWeight: '600',
  },
  trackOrderBtn: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#96252A',
  },
  trackOrderText: {
    color: '#96252A',
    fontSize: scale(12),
    fontWeight: '600',
  },

  bottomSpacer: {
    height: 20,
  },
});