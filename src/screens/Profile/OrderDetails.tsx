import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  Dimensions,
  Image,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
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

/* ================= SAFE VALUE HELPER ================= */
// Returns fallback ('N/A') if value is null/undefined/empty string
const safe = (value: any, fallback: string = 'N/A') => {
  if (value === null || value === undefined) return fallback;
  const str = String(value).trim();
  return str === '' ? fallback : str;
};

/* ================= DATE / TIME HELPERS ================= */

const formatDate = (dateString?: string | null) => {
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
    if (isNaN(date.getTime())) return 'N/A';
    return date.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return 'N/A';
  }
};

const formatTime = (dateString?: string | null) => {
  if (!dateString) return 'N/A';
  try {
    if (typeof dateString === 'string' && dateString.includes('at')) {
      const parts = dateString.split(' at ');
      if (parts.length === 2) {
        const timePart = parts[1];
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

const getStatusColor = (status: string) => {
  switch (status) {
    case 'Delivered':
      return '#16A34A';
    case 'Shipped':
      return '#2196F3';
    case 'Processing':
      return '#F59E0B';
    case 'Cancelled':
      return '#E53935';
    case 'Completed':
      return '#16A34A';
    default:
      return '#666';
  }
};

/* ================= COMPONENT ================= */

const OrderDetailsScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const insets = useSafeAreaInsets();
  const { orderId } = route.params || {};

  const [orderData, setOrderData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [deliveryRating, setDeliveryRating] = useState(0);
  const [productRating, setProductRating] = useState(0);

  useEffect(() => {
    if (orderId) {
      fetchOrderDetails();
    } else {
      // Demo fallback when opening without ID
      setOrderData({
        orderId: '#1340152 85527753057801',
        brand: 'DYMORA',
        status: 'Delivered',
        deliveryDate: '6th Sep 2026',
        deliveryTime: '11:13 AM',
        placedDate: '01 Sep 2026',
        placedTime: '10:30 AM',
        productName: 'Men Classic Multi Stripes Striped Casual Shirt',
        productSubtitle: '1 Piece of Shirt',
        productImage:
          'https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=400&h=400&fit=crop',
        size: '40',
        quantity: 1,
        price: 766,
        mrp: 1999,
        discountPercent: 62,
        soldBy: 'CASUAL STITCH',
        address: {
          name: 'Annapurna Rout',
          street: 'Flat no- B05, Sri vari Apartment',
          area: 'garudachar palya near manjunath temple 5th cross mahadevpu',
          city: 'Garudachar palya',
          state: 'Bangalore',
          zipCode: '560048',
          country: 'India',
          phone: '7064005018',
          email: 'supriyamahalik937@gmail.com',
        },
        paymentMethod: 'UPI',
        paymentStatus: 'Paid Online',
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
      const product = order.products?.[0] || {};

      // ✅ Every value safely resolved with fallback
      const price = Number(product?.price) || 0;
      const mrp = Number(product?.mrp) || price;
      const discountPercent = Number(product?.discount) || 0;
      const quantity = Number(product?.quantity) || 1;

      setOrderData({
        orderId: safe(order?._id ? `#${order._id.slice(-18)}` : null),
        brand: safe(product?.brand, 'Brand'),
        status: safe(order?.status, 'Processing'),

        // Delivery banner (fallback to updatedAt if deliveredAt missing)
        deliveryDate: formatDate(order?.deliveredAt || order?.updatedAt),
        deliveryTime: formatTime(order?.deliveredAt || order?.updatedAt),

        // Placed info
        placedDate: formatDate(order?.createdAt),
        placedTime: formatTime(order?.createdAt),

        // Product
        productName: safe(product?.name, 'Product'),
        productSubtitle: safe(product?.description ? '1 Piece' : '1 Piece'),
        productImage: product?.image || '',
        size: safe(product?.size),
        quantity,

        // Pricing
        price,
        mrp,
        discountPercent,

        // Sold by
        soldBy: safe(product?.seller || product?.brand, 'Seller'),

        // Address (each field with fallback)
        address: {
          name: safe(order?.shippingAddress?.name || order?.user?.name, 'Customer'),
          street: safe(order?.shippingAddress?.street),
          area: safe(order?.shippingAddress?.area, ''),
          city: safe(order?.shippingAddress?.city),
          state: safe(order?.shippingAddress?.state),
          zipCode: safe(order?.shippingAddress?.zipCode),
          country: safe(order?.shippingAddress?.country, 'India'),
          phone: safe(
            order?.shippingAddress?.phone || order?.user?.phone,
            'N/A',
          ),
          email: safe(order?.user?.email, 'N/A'),
        },

        // Payment
        paymentMethod: safe(order?.paymentInfo?.paymentMethod, 'N/A'),
        paymentStatus: safe(
          order?.paymentInfo?.status || order?.isPaid ? 'Paid Online' : null,
          'N/A',
        ),
      });
    } catch (error: any) {
      console.error('Error fetching order details:', error);
      Alert.alert('Error', error.message || 'Failed to load order details');
      setOrderData(null);
    } finally {
      setLoading(false);
      LoadingService.hide();
    }
  };

  /* ================= LOADING / EMPTY ================= */

  if (loading) return <View style={styles.loadingContainer} />;

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

  const isDelivered = orderData.status === 'Delivered';
  const savingAmount = orderData.mrp - orderData.price;

  // Full address string
  const addressLine = [
    orderData.address.street,
    orderData.address.area,
    orderData.address.city,
    orderData.address.state,
    orderData.address.zipCode,
  ]
    .filter(v => v && v !== 'N/A' && v !== '')
    .join(', ');

  /* ================= UI ================= */

  return (
    <View style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#F5F5F5" />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: 40 + insets.bottom },
        ]}
      >
        {/* ============ 1. PRODUCT HERO ============ */}
        <View style={styles.heroCard}>
          <Ionicons
            name="shirt-outline"
            size={40}
            color="#EFEFEF"
            style={[styles.bgIcon, { top: 20, left: 20 }]}
          />
          <Ionicons
            name="gift-outline"
            size={36}
            color="#EFEFEF"
            style={[styles.bgIcon, { top: 100, left: 10 }]}
          />
          <Ionicons
            name="shirt-outline"
            size={40}
            color="#EFEFEF"
            style={[styles.bgIcon, { top: 20, right: 20 }]}
          />
          <Ionicons
            name="bag-handle-outline"
            size={36}
            color="#EFEFEF"
            style={[styles.bgIcon, { top: 100, right: 10 }]}
          />

          {orderData.productImage ? (
            <Image
              source={{ uri: orderData.productImage }}
              style={styles.heroImage}
              resizeMode="cover"
            />
          ) : (
            <View style={[styles.heroImage, styles.heroImagePlaceholder]}>
              <Ionicons name="image-outline" size={40} color="#ccc" />
            </View>
          )}
        </View>

        {/* ============ 2. BRAND + PRODUCT INFO ============ */}
        <View style={styles.infoBlock}>
          {/* <Text style={styles.brandName}>
            {safe(orderData.brand).toUpperCase()}
          </Text> */}
          <Text style={styles.productName}>
            {safe(orderData.productName)}
          </Text>
          <Text style={styles.productSub}>
            {safe(orderData.productSubtitle)}
          </Text>
          <Text style={styles.productSub}>
            Size: {safe(orderData.size)} · Quantity: {orderData.quantity}
          </Text>
          <Text style={styles.orderIdLine}>
            Order ID: {safe(orderData.orderId)}
          </Text>
        </View>

        {/* ============ 3. DELIVERED BANNER ============ */}
        {isDelivered && (
          <View style={styles.deliveredBanner}>
            <View style={{ flex: 1 }}>
              <Text style={styles.deliveredLabel}>
                Order got delivered on
              </Text>
              <Text style={styles.deliveredDate}>
                {safe(orderData.deliveryDate)}
              </Text>
              <Text style={styles.deliveredTime}>
                {safe(orderData.deliveryTime)}
              </Text>
            </View>
            <View style={styles.deliveredIconWrap}>
              <Ionicons
                name="checkmark-circle"
                size={scale(48)}
                color="#16A34A"
              />
              <Ionicons
                name="cube-outline"
                size={scale(30)}
                color="#F97316"
                style={{ position: 'absolute', bottom: -6, right: -4 }}
              />
            </View>
          </View>
        )}

        {/* ============ 4. RATE DELIVERY ============ */}
        <View style={styles.card}>
          <View style={styles.rateHeader}>
            <View style={styles.rateIconWrap}>
              <Ionicons
                name="happy-outline"
                size={scale(26)}
                color="#7C3AED"
              />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.rateTitle}>
                Rate your delivery experience
              </Text>
              <Text style={styles.rateSubtitle}>
                How do you rate your experience for this order?
              </Text>
            </View>
          </View>

          <View style={styles.ratingRow}>
            {[1, 2, 3, 4, 5].map(num => {
              const isSelected = deliveryRating === num;
              const isGreen = num === 5;
              const isYellow = num === 4;
              const color = isGreen
                ? '#16A34A'
                : isYellow
                ? '#F59E0B'
                : '#F97316';
              return (
                <TouchableOpacity
                  key={num}
                  style={[
                    styles.ratingCircle,
                    { borderColor: color },
                    isSelected && { backgroundColor: `${color}15` },
                  ]}
                  onPress={() => setDeliveryRating(num)}
                  activeOpacity={0.8}
                >
                  <Text
                    style={[
                      styles.ratingNum,
                      { color: isSelected ? color : '#333' },
                    ]}
                  >
                    {num}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <View style={styles.ratingLabelsRow}>
            <Text style={styles.ratingLabelBad}>Very Bad</Text>
            <Text style={styles.ratingLabelGreat}>Great</Text>
          </View>
        </View>

        {/* ============ 5. RATE THIS PRODUCT ============ */}
        <View style={styles.card}>
          <View style={styles.rateHeader}>
            {orderData.productImage ? (
              <Image
                source={{ uri: orderData.productImage }}
                style={styles.rateProductImg}
              />
            ) : (
              <View
                style={[
                  styles.rateProductImg,
                  { backgroundColor: '#F5F5F5' },
                ]}
              />
            )}
            <View style={{ flex: 1 }}>
              <Text style={styles.rateTitle}>Rate this product</Text>
              <Text style={styles.rateSubtitle} numberOfLines={1}>
                {safe(orderData.productName)}
              </Text>
            </View>
          </View>
          <View style={styles.ratingRow}>
            {[1, 2, 3, 4, 5].map(num => (
              <TouchableOpacity
                key={num}
                style={styles.starBtn}
                activeOpacity={0.7}
                onPress={() => setProductRating(num)}
              >
                <Ionicons
                  name={num <= productRating ? 'star' : 'star-outline'}
                  size={scale(28)}
                  color="#F59E0B"
                />
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* ============ 6. ITEM PRICE ============ */}
        <View style={styles.card}>
          <View style={styles.rowBetween}>
            <Text style={styles.itemPriceLabel}>Item Price</Text>
            <TouchableOpacity>
              <Text style={styles.viewBreakup}>View Breakup</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.priceRow}>
            <Text style={styles.itemPrice}>
              ₹{orderData.price || 0}
            </Text>
            {orderData.mrp > orderData.price && (
              <Text style={styles.itemMrp}>₹{orderData.mrp}</Text>
            )}
            {orderData.discountPercent > 0 && (
              <Text style={styles.itemOff}>
                {orderData.discountPercent}% Off
              </Text>
            )}
          </View>
          <Text style={styles.soldBy}>
            Sold by: {safe(orderData.soldBy).toUpperCase()}
          </Text>

          {savingAmount > 0 && (
            <View style={styles.savingsBanner}>
              <Ionicons name="pricetag" size={scale(28)} color="#16A34A" />
              <Text style={styles.savingsText}>
                You're saving{' '}
                <Text style={styles.savingsAmount}>
                  ₹{savingAmount}
                </Text>{' '}
                on this item.
              </Text>
            </View>
          )}
        </View>

        {/* ============ 7. DELIVERY TO ============ */}
        <View style={styles.card}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionIconWrap}>
              <Ionicons
                name="person-outline"
                size={scale(20)}
                color="#7C3AED"
              />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.sectionTitle}>Delivery To</Text>
              <Text style={styles.sectionSubtitle}>
                {safe(orderData.address.name)}
              </Text>
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.infoRow}>
            <Ionicons name="call-outline" size={scale(18)} color="#444" />
            <View style={{ flex: 1, marginLeft: 10 }}>
              <Text style={styles.infoLabel}>Contact Details</Text>
              <Text style={styles.infoValue}>
                {safe(orderData.address.phone)}
              </Text>
            </View>
          </View>

          <View style={styles.infoRow}>
            <Ionicons
              name="location-outline"
              size={scale(18)}
              color="#444"
            />
            <View style={{ flex: 1, marginLeft: 10 }}>
              <Text style={styles.infoLabel}>Delivery Address</Text>
              <Text style={styles.infoValue}>
                {addressLine || 'N/A'}
              </Text>
            </View>
          </View>
        </View>

        {/* ============ 8. PAYMENT STATUS ============ */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Payment Status</Text>
          <View style={styles.paymentStatusRow}>
            <Ionicons
              name="checkmark-circle"
              size={scale(18)}
              color="#16A34A"
            />
            <Text style={styles.paymentStatusText}>
              {safe(orderData.paymentStatus)}
            </Text>
          </View>

          <View style={styles.divider} />

          <Text style={styles.cardTitle}>Payment Method</Text>
          <View style={styles.paymentMethodRow}>
            <View style={styles.upiBadge}>
              <Text style={styles.upiText}>
                {safe(orderData.paymentMethod)}
              </Text>
            </View>
            <Text style={styles.paymentMethodText}>
              {safe(orderData.paymentMethod)}
            </Text>
          </View>

          <TouchableOpacity style={styles.downloadInvoiceBtn}>
            <Ionicons
              name="download-outline"
              size={scale(18)}
              color="#151515"
            />
            <Text style={styles.downloadInvoiceText}>
              Download Invoice
            </Text>
          </TouchableOpacity>
        </View>

        {/* ============ 9. UPDATES SENT TO ============ */}
        <View style={styles.card}>
          <View style={styles.sectionHeader}>
            <View
              style={[styles.sectionIconWrap, { backgroundColor: '#EDE9FE' }]}
            >
              <Ionicons
                name="notifications-outline"
                size={scale(20)}
                color="#7C3AED"
              />
            </View>
            <Text style={styles.sectionTitle}>Updates sent to</Text>
          </View>

          <View style={styles.twoColRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.infoLabel}>Call</Text>
              <Text style={styles.infoValue}>
                {safe(orderData.address.phone)}
              </Text>
            </View>
            <View style={{ flex: 1.4 }}>
              <Text style={styles.infoLabel}>Email</Text>
              <Text style={styles.infoValue} numberOfLines={1}>
                {safe(orderData.address.email)}
              </Text>
            </View>
          </View>
        </View>

        {/* ============ 10. ORDER DETAILS ============ */}
        <View style={styles.card}>
          <View style={styles.sectionHeader}>
            <View
              style={[styles.sectionIconWrap, { backgroundColor: '#F5F0EB' }]}
            >
              <Ionicons
                name="cube-outline"
                size={scale(20)}
                color="#96252A"
              />
            </View>
            <Text style={styles.sectionTitle}>Order details</Text>
          </View>

          <View style={styles.twoColRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.infoLabel}>Ordered On</Text>
              <Text style={styles.infoValue}>
                {safe(orderData.placedDate)}
              </Text>
            </View>
            <View style={{ flex: 1.4 }}>
              <Text style={styles.infoLabel}>Order ID</Text>
              <Text style={styles.infoValue} numberOfLines={1}>
                {safe(orderData.orderId)}
              </Text>
            </View>
          </View>
        </View>

        {/* ============ 11. HELP BANNER ============ */}
        {/* <View style={styles.helpCard}>
          <View style={styles.helpIconWrap}>
            <Ionicons name="headset" size={scale(20)} color="#96252A" />
          </View>
          <View style={{ flex: 1, marginLeft: 10 }}>
            <Text style={styles.helpTitle}>Need Help?</Text>
            <Text style={styles.helpSubtitle}>
              We are here to help you with your order
            </Text>
          </View>
          <TouchableOpacity style={styles.contactSupportBtn}>
            <Text style={styles.contactSupportText}>Contact</Text>
            <Ionicons
              name="chevron-forward"
              size={scale(14)}
              color="#96252A"
            />
          </TouchableOpacity>
        </View> */}
      </ScrollView>
    </View>
  );
};

export default OrderDetailsScreen;

/* ================= STYLES ================= */

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  scrollContent: {
    paddingTop: 8,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
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

  heroCard: {
    backgroundColor: '#FFFFFF',
    paddingVertical: scale(24),
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  bgIcon: {
    position: 'absolute',
  },
  heroImage: {
    width: scale(160),
    height: scale(200),
    borderRadius: scale(10),
    backgroundColor: '#F5F5F5',
  },
  heroImagePlaceholder: {
    justifyContent: 'center',
    alignItems: 'center',
  },

  infoBlock: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: scale(20),
    paddingBottom: scale(20),
    alignItems: 'center',
  },
  brandName: {
    fontSize: scale(13),
    fontWeight: '800',
    color: '#151515',
    letterSpacing: 1.5,
    marginBottom: 6,
  },
  productName: {
    fontSize: scale(14),
    fontWeight: '500',
    color: '#151515',
    textAlign: 'center',
    marginBottom: 6,
    lineHeight: scale(20),
  },
  productSub: {
    fontSize: scale(12),
    color: '#666',
    textAlign: 'center',
    marginBottom: 4,
  },
  orderIdLine: {
    fontSize: scale(12),
    color: '#666',
    textAlign: 'center',
    marginTop: 4,
  },

  deliveredBanner: {
    backgroundColor: '#E7F8EC',
    marginHorizontal: scale(14),
    marginTop: scale(10),
    borderRadius: scale(12),
    padding: scale(16),
    flexDirection: 'row',
    alignItems: 'center',
  },
  deliveredLabel: {
    fontSize: scale(12),
    color: '#151515',
    marginBottom: 2,
  },
  deliveredDate: {
    fontSize: scale(18),
    fontWeight: '800',
    color: '#16A34A',
    marginBottom: 2,
  },
  deliveredTime: {
    fontSize: scale(12),
    color: '#151515',
  },
  deliveredIconWrap: {
    width: scale(70),
    height: scale(70),
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 10,
  },

  card: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: scale(14),
    marginTop: scale(10),
    borderRadius: scale(12),
    padding: scale(14),
  },
  cardTitle: {
    fontSize: scale(14),
    fontWeight: '700',
    color: '#151515',
    marginBottom: 8,
  },

  rateHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  rateIconWrap: {
    width: scale(44),
    height: scale(44),
    borderRadius: scale(10),
    backgroundColor: '#EDE9FE',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  rateTitle: {
    fontSize: scale(14),
    fontWeight: '700',
    color: '#151515',
    marginBottom: 2,
  },
  rateSubtitle: {
    fontSize: scale(11),
    color: '#777',
    lineHeight: scale(15),
  },
  ratingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  ratingCircle: {
    width: scale(50),
    height: scale(50),
    borderRadius: scale(25),
    borderWidth: 1.5,
    justifyContent: 'center',
    alignItems: 'center',
  },
  ratingNum: {
    fontSize: scale(15),
    fontWeight: '700',
  },
  ratingLabelsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  ratingLabelBad: {
    fontSize: scale(12),
    color: '#F97316',
    fontWeight: '700',
  },
  ratingLabelGreat: {
    fontSize: scale(12),
    color: '#16A34A',
    fontWeight: '700',
  },
  rateProductImg: {
    width: scale(44),
    height: scale(44),
    borderRadius: scale(8),
    marginRight: 10,
    backgroundColor: '#F5F5F5',
  },
  starBtn: {
    padding: 4,
  },

  rowBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  itemPriceLabel: {
    fontSize: scale(13),
    color: '#151515',
  },
  viewBreakup: {
    fontSize: scale(13),
    color: '#151515',
    textDecorationLine: 'underline',
    fontWeight: '500',
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
    flexWrap: 'wrap',
  },
  itemPrice: {
    fontSize: scale(18),
    fontWeight: '800',
    color: '#151515',
  },
  itemMrp: {
    fontSize: scale(13),
    color: '#999',
    textDecorationLine: 'line-through',
  },
  itemOff: {
    fontSize: scale(13),
    color: '#F97316',
    fontWeight: '700',
  },
  soldBy: {
    fontSize: scale(12),
    color: '#777',
    marginTop: 2,
  },
  savingsBanner: {
    marginTop: 12,
    backgroundColor: '#EAF7EE',
    borderRadius: scale(8),
    paddingVertical: 10,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  savingsText: {
    flex: 1,
    fontSize: scale(12),
    color: '#151515',
  },
  savingsAmount: {
    fontWeight: '800',
    color: '#16A34A',
  },

  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  sectionIconWrap: {
    width: scale(38),
    height: scale(38),
    borderRadius: scale(10),
    backgroundColor: '#EDE9FE',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  sectionTitle: {
    fontSize: scale(14),
    fontWeight: '700',
    color: '#151515',
  },
  sectionSubtitle: {
    fontSize: scale(12),
    color: '#666',
    marginTop: 1,
  },
  divider: {
    height: 1,
    backgroundColor: '#EFEFEF',
    marginVertical: 10,
  },

  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  infoLabel: {
    fontSize: scale(12),
    color: '#777',
    marginBottom: 2,
  },
  infoValue: {
    fontSize: scale(13),
    color: '#151515',
    fontWeight: '500',
    lineHeight: scale(18),
  },

  paymentStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  paymentStatusText: {
    fontSize: scale(13),
    color: '#333',
  },
  paymentMethodRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 14,
  },
  upiBadge: {
    backgroundColor: '#F0F0F0',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
  },
  upiText: {
    fontSize: scale(11),
    fontWeight: '700',
    color: '#151515',
  },
  paymentMethodText: {
    fontSize: scale(13),
    color: '#333',
  },
  downloadInvoiceBtn: {
    borderWidth: 1,
    borderColor: '#D5D5D5',
    borderRadius: scale(10),
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 4,
  },
  downloadInvoiceText: {
    fontSize: scale(13),
    fontWeight: '600',
    color: '#151515',
  },

  twoColRow: {
    flexDirection: 'row',
    marginTop: 4,
    gap: 12,
  },

  helpCard: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: scale(14),
    marginTop: scale(10),
    borderRadius: scale(12),
    padding: scale(14),
    flexDirection: 'row',
    alignItems: 'center',
  },
  helpIconWrap: {
    width: scale(38),
    height: scale(38),
    borderRadius: scale(19),
    backgroundColor: '#F5F0EB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  helpTitle: {
    fontSize: scale(13),
    fontWeight: '700',
    color: '#151515',
  },
  helpSubtitle: {
    fontSize: scale(11),
    color: '#777',
    marginTop: 1,
  },
  contactSupportBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1.2,
    borderColor: '#96252A',
  },
  contactSupportText: {
    fontSize: scale(11),
    fontWeight: '700',
    color: '#96252A',
  },
});