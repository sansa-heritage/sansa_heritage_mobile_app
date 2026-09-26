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
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useNavigation, useRoute } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import ReactNativeBlobUtil from 'react-native-blob-util';
import { getOrderById } from '../../api/orderApi';
import LoadingService from '../../services/LoadingService';
import config from '../../config/config';
import { snackbar } from '../../components/common/Snackbar';

const { width } = Dimensions.get('window');

const scale = (size: number) => {
  const baseWidth = 375;
  return Math.round((width / baseWidth) * size);
};

const safe = (value: any, fallback: string = 'N/A') => {
  if (value === null || value === undefined) return fallback;
  const str = String(value).trim();
  return str === '' ? fallback : str;
};

const formatDate = (dateString?: string | null) => {
  if (!dateString) return 'N/A';
  try {
    if (typeof dateString === 'string' && dateString.includes(' at ')) {
      const parts = dateString.split(' at ');
      if (parts.length === 2) return parts[0].trim();
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
    if (typeof dateString === 'string' && dateString.includes(' at ')) {
      const parts = dateString.split(' at ');
      if (parts.length === 2) return parts[1].trim();
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

const resolveImage = (raw: string | undefined | null) => {
  if (!raw) return null;
  if (raw.startsWith('data:image')) return { uri: raw };
  if (raw.startsWith('http')) return { uri: raw };
  const base = config.baseURL || '';
  return { uri: `${base}${raw.startsWith('/') ? '' : '/'}${raw}` };
};

const splitTitle = (fullName: string, boldWords = 2) => {
  const words = (fullName || 'Product').trim().split(/\s+/);

  if (words.length <= boldWords) {
    return { boldPart: fullName || 'Product', normalPart: '' };
  }

  return {
    boldPart: words.slice(0, boldWords).join(' '),
    normalPart: words.slice(boldWords).join(' '),
  };
};

const OrderDetailsScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const insets = useSafeAreaInsets();
  const { orderId } = route.params || {};

  const [orderData, setOrderData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [deliveryRating, setDeliveryRating] = useState(0);
  const [productRating, setProductRating] = useState(0);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    if (orderId) fetchOrderDetails();
    else {
      setOrderData(null);
      setLoading(false);
    }
  }, [orderId]);

  const fetchOrderDetails = async () => {
    try {
      setLoading(true);
      LoadingService.show('Loading order details...');

      const response = await getOrderById(orderId);
      if (!response || !response.success)
        throw new Error('Failed to fetch order details');

      const order = response.order;
      const products = Array.isArray(order.products) ? order.products : [];

      const totalMrp = products.reduce((sum: number, p: any) => {
        const price = Number(p.price) || 0;
        const qty = Number(p.quantity) || 1;
        const mrp = Number(p.mrp) || price;
        return sum + mrp * qty;
      }, 0);

      const totalPrice =
        Number(order.totalPrice) ||
        products.reduce(
          (sum: number, p: any) =>
            sum + (Number(p.price) || 0) * (Number(p.quantity) || 1),
          0,
        );

      const totalSavings = Math.max(0, totalMrp - totalPrice);

      const normalizedProducts = products.map((p: any) => {
        const price = Number(p.price) || 0;
        const qty = Number(p.quantity) || 1;
        const mrp = Number(p.mrp) || price;
        const discountPercent =
          Number(p.discount) ||
          (mrp > price ? Math.round(((mrp - price) / mrp) * 100) : 0);

        return {
          _id: p._id || p.product || String(Math.random()),
          name: safe(p.name, 'Product'),
          image: p.image || '',
          size: p.size || p.selectedSize || null,
          color: p.color || p.selectedColor || null,
          quantity: qty,
          price,
          mrp,
          discountPercent,
        };
      });

      setOrderData({
        _id: order?._id || '',
        orderId: order?._id ? `#${order._id.slice(-18)}` : 'N/A',
        status: safe(order?.status, 'Processing'),
        placedDate: formatDate(order?.createdAt),
        placedTime: formatTime(order?.createdAt),
        deliveryDate: formatDate(order?.deliveredAt || order?.updatedAt),
        deliveryTime: formatTime(order?.deliveredAt || order?.updatedAt),
        products: normalizedProducts,
        totalPrice,
        totalMrp,
        totalSavings,
        address: {
          name: safe(
            order?.shippingAddress?.name ||
              order?.user?.username ||
              order?.user?.name,
            'Customer',
          ),
          street: safe(order?.shippingAddress?.street, ''),
          area: safe(order?.shippingAddress?.area, ''),
          city: safe(order?.shippingAddress?.city, ''),
          state: safe(order?.shippingAddress?.state, ''),
          zipCode: safe(order?.shippingAddress?.zipCode, ''),
          country: safe(order?.shippingAddress?.country, 'India'),
          phone: safe(
            order?.shippingAddress?.phone || order?.user?.phone,
            'N/A',
          ),
          email: safe(order?.user?.email, 'N/A'),
        },
        paymentMethod: safe(
          order?.paymentInfo?.paymentMethod || order?.paymentInfo?.method,
          'Razorpay',
        ),
        paymentStatus: safe(
          order?.paymentInfo?.status || order?.paymentInfo?.paymentStatus,
          order?.isPaid ? 'Paid Online' : 'Pending',
        ),
      });
    } catch (error: any) {
      console.error('Error fetching order details:', error);
      snackbar.error(error.message || 'Failed to load order details');
      setOrderData(null);
    } finally {
      setLoading(false);
      LoadingService.hide();
    }
  };

  // ✅ FIXED — Android path fix + uses generateInvoicePDF on backend (logo included)
  const handleDownloadInvoice = async () => {
    if (!orderId) {
      snackbar.error('Order ID not available');
      return;
    }
    if (downloading) return;

    try {
      setDownloading(true);
      LoadingService.show('Downloading invoice...');

      const token = await AsyncStorage.getItem('authToken');
      if (!token) {
        snackbar.warning('Please login to download invoice.', 'Login Required');
        return;
      }

      const baseURL = config.baseURL || '';

      const linkRes = await fetch(
        `${baseURL}api/order/${orderId}/invoice-link`,
        {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: 'application/json',
          },
        },
      );

      if (!linkRes.ok)
        throw new Error(`Could not create invoice link (${linkRes.status})`);

      const linkJson = await linkRes.json();
      if (!linkJson?.success || !linkJson?.url) {
        throw new Error(linkJson?.message || 'Invalid invoice link response');
      }

      const signedUrl = `${baseURL}${linkJson.url}`;
      console.log('📥 Signed invoice URL:', signedUrl);

      const { dirs } = ReactNativeBlobUtil.fs;
      const fileName = `Invoice-${orderId}.pdf`;
      const iosFilePath = `${dirs.DocumentDir}/${fileName}`;
      const androidFilePath = `${dirs.DownloadDir}/${fileName}`;

      const res = await ReactNativeBlobUtil.config({
        addAndroidDownloads: {
          useDownloadManager: true,
          notification: true,
          title: fileName,
          description: 'Order Invoice',
          mime: 'application/pdf',
          mediaScannable: true,
          path: androidFilePath,
        },
        ...(Platform.OS === 'ios' && {
          fileCache: true,
          path: iosFilePath,
        }),
      }).fetch('GET', signedUrl, {
        Accept: 'application/pdf',
      });

      // ✅ FIXED — Android DownloadManager doesn't return status in info()
      let ok = false;

      if (Platform.OS === 'android') {
        try {
          ok = await ReactNativeBlobUtil.fs.exists(androidFilePath);
        } catch {
          ok = false;
        }
      } else {
        const status = res.info().status;
        ok = status === 200;
        if (!ok) {
          const body = await res.text();
          console.error('❌ Server error body:', body);
        }
      }

      console.log('📥 Invoice download ok:', ok);

      if (!ok) throw new Error('Invoice download failed');

      if (Platform.OS === 'ios') {
        const finalPath = res.path();
        ReactNativeBlobUtil.ios.previewDocument(finalPath);
      }

      snackbar.success(
        Platform.OS === 'ios'
          ? 'Invoice downloaded. You can share or save it from the preview.'
          : 'Invoice downloaded to your Downloads folder.',
      );
    } catch (err: any) {
      console.error('Invoice download error:', err);
      snackbar.error(
        err?.message || 'Could not download the invoice. Please try again.',
      );
    } finally {
      setDownloading(false);
      LoadingService.hide();
    }
  };

  if (loading) return <View style={styles.loadingContainer} />;

  if (!orderData || !orderData.products?.length) {
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

  const addressLine = [
    orderData.address.street,
    orderData.address.area,
    orderData.address.city,
    orderData.address.state,
    orderData.address.zipCode,
  ]
    .filter(v => v && v !== 'N/A' && v !== '')
    .join(', ');

  const firstProduct = orderData.products[0];
  const heroSplit = splitTitle(firstProduct.name);

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

          {resolveImage(firstProduct.image) ? (
            <Image
              source={resolveImage(firstProduct.image)!}
              style={styles.heroImage}
              resizeMode="cover"
            />
          ) : (
            <View style={[styles.heroImage, styles.heroImagePlaceholder]}>
              <Ionicons name="image-outline" size={40} color="#ccc" />
            </View>
          )}
        </View>

        <View style={styles.infoBlock}>
          <Text style={styles.productName}>
            {orderData.products.length > 1 ? (
              `${orderData.products.length} items in this order`
            ) : (
              <>
                <Text style={styles.productNameBold}>{heroSplit.boldPart}</Text>
                {heroSplit.normalPart ? (
                  <Text style={styles.productNameNormal}>
                    {' '}
                    {heroSplit.normalPart}
                  </Text>
                ) : null}
              </>
            )}
          </Text>
          <Text style={styles.productSub}>Total: ₹{orderData.totalPrice}</Text>
          <Text style={styles.orderIdLine}>Order ID: {orderData.orderId}</Text>
        </View>

        {isDelivered && (
          <View style={styles.deliveredBanner}>
            <View style={{ flex: 1 }}>
              <Text style={styles.deliveredLabel}>
                Order got delivered on
              </Text>
              <Text style={styles.deliveredDate}>
                {orderData.deliveryDate}
              </Text>
              <Text style={styles.deliveredTime}>
                {orderData.deliveryTime}
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
              const color =
                num === 5 ? '#16A34A' : num === 4 ? '#F59E0B' : '#F97316';
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

        {orderData.products.map((product: any, idx: number) => {
          const imgSrc = resolveImage(product.image);
          const saving = Math.max(0, product.mrp - product.price);
          const split = splitTitle(product.name);

          return (
            <View key={product._id || idx} style={styles.card}>
              <View style={styles.rateHeader}>
                {imgSrc ? (
                  <Image source={imgSrc} style={styles.rateProductImg} />
                ) : (
                  <View
                    style={[
                      styles.rateProductImg,
                      { backgroundColor: '#F5F5F5' },
                    ]}
                  />
                )}
                <View style={{ flex: 1 }}>
                  <Text style={styles.rateTitle} numberOfLines={2}>
                    <Text style={styles.rateTitleBold}>
                      {split.boldPart}
                    </Text>
                    {split.normalPart ? (
                      <Text style={styles.rateTitleNormal}>
                        {' '}
                        {split.normalPart}
                      </Text>
                    ) : null}
                  </Text>
                  <Text style={styles.rateSubtitle} numberOfLines={1}>
                    {product.size ? `Size: ${product.size} · ` : ''}
                    {product.color ? `Color: ${product.color} · ` : ''}
                    Qty: {product.quantity}
                  </Text>
                </View>
              </View>

              <View style={styles.priceRow}>
                <Text style={styles.itemPrice}>₹{product.price}</Text>
                {product.mrp > product.price && (
                  <Text style={styles.itemMrp}>₹{product.mrp}</Text>
                )}
                {product.discountPercent > 0 && (
                  <Text style={styles.itemOff}>
                    {product.discountPercent}% Off
                  </Text>
                )}
              </View>

              <View style={styles.productRateRow}>
                <Text style={styles.productRateLabel}>
                  Rate this product:
                </Text>
                <View style={{ flexDirection: 'row' }}>
                  {[1, 2, 3, 4, 5].map(n => (
                    <TouchableOpacity
                      key={n}
                      style={styles.starBtn}
                      onPress={() => setProductRating(n)}
                    >
                      <Ionicons
                        name={n <= productRating ? 'star' : 'star-outline'}
                        size={scale(20)}
                        color="#F59E0B"
                      />
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {saving > 0 && (
                <View style={styles.savingsBanner}>
                  <Ionicons
                    name="pricetag"
                    size={scale(20)}
                    color="#16A34A"
                  />
                  <Text style={styles.savingsText}>
                    You saved{' '}
                    <Text style={styles.savingsAmount}>₹{saving}</Text> on this
                    item
                  </Text>
                </View>
              )}
            </View>
          );
        })}

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
                {orderData.address.name}
              </Text>
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.infoRow}>
            <Ionicons name="call-outline" size={scale(18)} color="#444" />
            <View style={{ flex: 1, marginLeft: 10 }}>
              <Text style={styles.infoLabel}>Contact Details</Text>
              <Text style={styles.infoValue}>{orderData.address.phone}</Text>
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
              <Text style={styles.infoValue}>{addressLine || 'N/A'}</Text>
            </View>
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Payment Status</Text>
          <View style={styles.paymentStatusRow}>
            <Ionicons
              name="checkmark-circle"
              size={scale(18)}
              color="#16A34A"
            />
            <Text style={styles.paymentStatusText}>
              {orderData.paymentStatus}
            </Text>
          </View>

          <View style={styles.divider} />

          <Text style={styles.cardTitle}>Payment Method</Text>
          <View style={styles.paymentMethodRow}>
            <View style={styles.upiBadge}>
              <Text style={styles.upiText}>{orderData.paymentMethod}</Text>
            </View>
          </View>

          <TouchableOpacity
            style={[
              styles.downloadInvoiceBtn,
              downloading && { opacity: 0.6 },
            ]}
            onPress={handleDownloadInvoice}
            disabled={downloading}
            activeOpacity={0.7}
          >
            <Ionicons
              name={downloading ? 'hourglass-outline' : 'download-outline'}
              size={scale(18)}
              color="#151515"
            />
            <Text style={styles.downloadInvoiceText}>
              {downloading ? 'Downloading...' : 'Download Invoice'}
            </Text>
          </TouchableOpacity>
        </View>

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
              <Text style={styles.infoValue}>{orderData.address.phone}</Text>
            </View>
            <View style={{ flex: 1.4 }}>
              <Text style={styles.infoLabel}>Email</Text>
              <Text style={styles.infoValue} numberOfLines={1}>
                {orderData.address.email}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.card}>
          <View style={styles.sectionHeader}>
            <View
              style={[styles.sectionIconWrap, { backgroundColor: '#F5F0EB' }]}
            >
              <Ionicons
                name="cube-outline"
                size={scale(20)}
                color="#9E0E26"
              />
            </View>
            <Text style={styles.sectionTitle}>Order details</Text>
          </View>

          <View style={styles.twoColRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.infoLabel}>Ordered On</Text>
              <Text style={styles.infoValue}>{orderData.placedDate}</Text>
            </View>
            <View style={{ flex: 1.4 }}>
              <Text style={styles.infoLabel}>Order ID</Text>
              <Text style={styles.infoValue} numberOfLines={1}>
                {orderData.orderId}
              </Text>
            </View>
          </View>

          <View style={[styles.twoColRow, { marginTop: 12 }]}>
            <View style={{ flex: 1 }}>
              <Text style={styles.infoLabel}>Items</Text>
              <Text style={styles.infoValue}>
                {orderData.products.length}
              </Text>
            </View>
            <View style={{ flex: 1.4 }}>
              <Text style={styles.infoLabel}>Total Paid</Text>
              <Text style={styles.infoValue}>₹{orderData.totalPrice}</Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

export default OrderDetailsScreen;

/* ===== STYLES (unchanged) ===== */
const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#F5F5F5' },
  scrollContent: { paddingTop: 8 },
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
    backgroundColor: '#9E0E26',
    paddingHorizontal: 30,
    paddingVertical: 12,
    borderRadius: 8,
  },
  goBackBtnText: { color: '#fff', fontWeight: '600', fontSize: 14 },
  heroCard: {
    backgroundColor: '#FFFFFF',
    paddingVertical: scale(24),
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  bgIcon: { position: 'absolute' },
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
  productName: {
    fontSize: scale(14),
    fontWeight: '500',
    color: '#151515',
    textAlign: 'center',
    marginBottom: 6,
    lineHeight: scale(20),
  },
  productNameBold: {
    fontWeight: '800',
    color: '#151515',
  },
  productNameNormal: {
    fontWeight: '400',
    color: '#4A4A4A',
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
  deliveredTime: { fontSize: scale(12), color: '#151515' },
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
  rateTitleBold: {
    fontWeight: '800',
    color: '#151515',
  },
  rateTitleNormal: {
    fontWeight: '400',
    color: '#4A4A4A',
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
    width: scale(30),
    height: scale(30),
    borderRadius: scale(25),
    borderWidth: 1.5,
    justifyContent: 'center',
    alignItems: 'center',
  },
  ratingNum: { fontSize: scale(10), fontWeight: '700' },
  ratingLabelsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  ratingLabelBad: {
    fontSize: scale(10),
    color: '#F97316',
    fontWeight: '700',
  },
  ratingLabelGreat: {
    fontSize: scale(10),
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
  starBtn: { padding: 2 },
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
  productRateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
    marginBottom: 4,
  },
  productRateLabel: {
    fontSize: scale(8),
    color: '#555',
    fontWeight: '500',
  },
  savingsBanner: {
    marginTop: 8,
    backgroundColor: '#EAF7EE',
    borderRadius: scale(8),
    paddingVertical: 8,
    paddingHorizontal: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  savingsText: { flex: 1, fontSize: scale(12), color: '#151515' },
  savingsAmount: { fontWeight: '800', color: '#16A34A' },
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
  divider: { height: 1, backgroundColor: '#EFEFEF', marginVertical: 10 },
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
  paymentStatusText: { fontSize: scale(13), color: '#333' },
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
  twoColRow: { flexDirection: 'row', marginTop: 4, gap: 12 },
});