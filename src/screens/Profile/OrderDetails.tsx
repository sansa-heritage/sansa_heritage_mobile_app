import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  Dimensions,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useNavigation, useRoute } from '@react-navigation/native';

const { width } = Dimensions.get('window');

const OrderDetailsScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const orderData = route.params?.orderData || {
    orderId: '#SHH24578',
    status: 'Delivered',
    deliveryDate: '22 May, 2025',
    deliveryTime: '02:40 PM',
    placedDate: '18 May, 2025',
    placedTime: '10:30 AM',
    productName: 'Maroon Embroidered Anarkali Set',
    size: 'M',
    quantity: 1,
    price: 2699,
    itemTotal: 2699,
    shipping: 200,
    discount: 200,
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
    tracking: [
      { status: 'Order Placed', date: '18 May, 10:30 AM', completed: true },
      { status: 'Confirmed', date: '18 May, 11:02 AM', completed: true },
      { status: 'Shipped', date: '19 May, 06:45 PM', completed: true },
      { status: 'Out for Delivery', date: '22 May, 09:15 AM', completed: true },
      { status: 'Delivered', date: '22 May, 02:40 PM', completed: true },
    ]
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
      default:
        return 'ellipse-outline';
    }
  };

  const renderTrackingItem = (item: any, index: number) => {
    const isLast = index === orderData.tracking.length - 1;
    const isCompleted = item.completed;

    return (
      <View key={index} style={styles.trackingItem}>
        <View style={styles.trackingLeft}>
          <View style={[styles.trackingDot, isCompleted && styles.trackingDotCompleted]} />
          {!isLast && <View style={[styles.trackingLine, isCompleted && styles.trackingLineCompleted]} />}
        </View>
        <View style={styles.trackingRight}>
          <Text style={[styles.trackingStatus, isCompleted && styles.trackingStatusCompleted]}>
            {item.status}
          </Text>
          <Text style={[styles.trackingDate, isCompleted && styles.trackingDateCompleted]}>
            {item.date}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#f8f8f8" />
      <View style={styles.container}>
        <ScrollView 
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {/* Card 1: Order ID and Status */}
          <View style={styles.card}>
            <View style={styles.orderHeaderRow}>
              <View>
                <Text style={styles.orderIdLabel}>Order ID</Text>
                <Text style={styles.orderId}>{orderData.orderId}</Text>
              </View>
              <View style={[styles.statusBadge, { backgroundColor: getStatusColor(orderData.status) + '20' }]}>
                <Ionicons name={getStatusIcon(orderData.status)} size={16} color={getStatusColor(orderData.status)} />
                <Text style={[styles.statusText, { color: getStatusColor(orderData.status) }]}>
                  {orderData.status}
                </Text>
              </View>
            </View>

            <View style={styles.deliveryRow}>
              <Text style={styles.deliveryText}>
                on {orderData.deliveryDate} • {orderData.deliveryTime}
              </Text>
              <TouchableOpacity style={styles.downloadBtn}>
                <Ionicons name="download-outline" size={16} color="#96252A" />
                <Text style={styles.downloadBtnText}>Download Invoice</Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.placedDate}>
              Placed on {orderData.placedDate} • {orderData.placedTime}
            </Text>
          </View>

          {/* Card 2: Order Tracking */}
          {/* <View style={styles.card}>
            <Text style={styles.cardTitle}>Order Tracking</Text>
            <View style={styles.trackingContainer}>
              {orderData.tracking.map((item, index) => renderTrackingItem(item, index))}
            </View>
          </View> */}

          {/* Card 3: Order Items */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Order Items ({orderData.quantity})</Text>
            <View style={styles.productContainer}>
              <View style={styles.productImagePlaceholder}>
                <Ionicons name="image-outline" size={30} color="#ccc" />
              </View>
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
              <Text style={styles.billValue}>-₹{orderData.discount}</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Total Amount</Text>
              <Text style={styles.totalValue}>₹{orderData.totalAmount}</Text>
            </View>
          </View>

          {/* Card 4: Delivery Address */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Delivery Address</Text>
            <Text style={styles.addressName}>{orderData.address.name}</Text>
            <Text style={styles.addressText}>{orderData.address.street}</Text>
            <Text style={styles.addressText}>
              {orderData.address.city}, {orderData.address.state} - {orderData.address.zipCode}
            </Text>
            <Text style={styles.addressText}>
              {orderData.address.country} • {orderData.address.phone}
            </Text>
          </View>

          {/* Card 5: Payment Details */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Payment Details</Text>
            <View style={styles.paymentRow}>
              <Text style={styles.paymentLabel}>Payment Method</Text>
              <Text style={styles.paymentValue}>{orderData.paymentMethod}</Text>
            </View>
            <View style={styles.paymentRow}>
              <Text style={styles.paymentLabel}>Paid on</Text>
              <Text style={styles.paymentValue}>{orderData.paidOn}</Text>
            </View>
            <View style={styles.paymentRow}>
              <Text style={styles.paymentLabel}>Amount</Text>
              <Text style={styles.paymentValue}>₹{orderData.paidAmount}</Text>
            </View>
          </View>

          {/* Card 6: Need Help */}
          <View style={styles.helpCard}>
            <View style={styles.helpLeft}>
              <View style={styles.helpIconContainer}>
                <Ionicons name="headset" size={28} color="#96252A" />
              </View>
              <View style={styles.helpTextContainer}>
                <Text style={styles.helpTitle}>Need Help?</Text>
                <Text style={styles.helpSubtitle}>We are here to help you with your order</Text>
              </View>
            </View>
            <TouchableOpacity style={styles.contactSupportBtn}>
              <Text style={styles.contactSupportText}>Contact Support</Text>
              <Ionicons name="chevron-forward" size={16} color="#96252A" />
            </TouchableOpacity>
          </View>

          {/* Card 7: Two Action Buttons */}
          <View style={styles.actionButtonsContainer}>
            <TouchableOpacity style={styles.buyAgainBtn}>
              <Text style={styles.buyAgainText}>Buy Again</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.trackOrderBtn}>
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
    paddingHorizontal: 16,
    paddingBottom: 20,
    paddingTop: 12,
  },

  // Card
  card: {
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

  // Card 1: Order ID and Status
  orderHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  orderIdLabel: {
    fontSize: 12,
    color: '#888',
    marginBottom: 2,
  },
  orderId: {
    fontSize: 18,
    fontWeight: '700',
    color: '#151515',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    gap: 4,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  deliveryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  deliveryText: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
  downloadBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  downloadBtnText: {
    fontSize: 13,
    color: '#96252A',
    fontWeight: '600',
  },
  placedDate: {
    fontSize: 13,
    color: '#888',
  },

  // Card 2: Order Tracking
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#151515',
    marginBottom: 12,
  },
  trackingContainer: {
    paddingLeft: 4,
  },
  trackingItem: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  trackingLeft: {
    width: 24,
    alignItems: 'center',
    position: 'relative',
  },
  trackingDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#E0E0E0',
    borderWidth: 2,
    borderColor: '#E0E0E0',
    marginTop: 4,
  },
  trackingDotCompleted: {
    backgroundColor: '#4CAF50',
    borderColor: '#4CAF50',
  },
  trackingLine: {
    width: 2,
    flex: 1,
    backgroundColor: '#E0E0E0',
    marginVertical: 2,
  },
  trackingLineCompleted: {
    backgroundColor: '#4CAF50',
  },
  trackingRight: {
    flex: 1,
    paddingLeft: 12,
    paddingBottom: 8,
  },
  trackingStatus: {
    fontSize: 14,
    fontWeight: '500',
    color: '#888',
  },
  trackingStatusCompleted: {
    color: '#333',
  },
  trackingDate: {
    fontSize: 12,
    color: '#aaa',
    marginTop: 2,
  },
  trackingDateCompleted: {
    color: '#888',
  },

  // Card 3: Order Items
  productContainer: {
    flexDirection: 'row',
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
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
  productPrice: {
    fontSize: 14,
    fontWeight: '700',
    color: '#151515',
  },
  divider: {
    height: 1,
    backgroundColor: '#F0F0F0',
    marginVertical: 8,
  },
  billRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 4,
  },
  billLabel: {
    fontSize: 14,
    color: '#666',
  },
  billValue: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: '#151515',
  },
  totalValue: {
    fontSize: 18,
    fontWeight: '800',
    color: '#96252A',
  },

  // Card 4: Delivery Address
  addressName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#151515',
    marginBottom: 4,
  },
  addressText: {
    fontSize: 13,
    color: '#555',
    lineHeight: 20,
    marginBottom: 1,
  },

  // Card 5: Payment Details
  paymentRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 2,
  },
  paymentLabel: {
    fontSize: 13,
    color: '#888',
  },
  paymentValue: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },

  // Card 6: Need Help
  helpCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  helpLeft: {
    flexDirection: 'row',
    alignItems: 'center',
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
  },
  helpSubtitle: {
    fontSize: 12,
    color: '#666',
  },
  contactSupportBtn: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  contactSupportText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#96252A',
    marginRight: 2,
  },

  // Card 7: Two Action Buttons
  actionButtonsContainer: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 60,
  },
  buyAgainBtn: {
    flex: 1,
    backgroundColor: 'black',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    width:60,
  },
  buyAgainText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  trackOrderBtn: {
    flex: 1,
    backgroundColor: '#fff',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#96252A',
  },
  trackOrderText: {
    color: '#96252A',
    fontSize: 14,
    fontWeight: '600',
  },

  bottomSpacer: {
    height: 20,
  },
});