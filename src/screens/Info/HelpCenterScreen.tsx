import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  StatusBar,
  Platform,
  Linking,
} from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../../models/types';
import { snackbar } from '../../components/common/Snackbar';
import LoadingService from '../../services/LoadingService';
import { getOrderById } from '../../api/orderApi';
import config from '../../config/config';

type NavigationProp = StackNavigationProp<RootStackParamList>;

/* ============================================================
   TYPES
   ============================================================ */

type ExpandedKey = 'where' | 'when' | null;

interface OrderProduct {
  name: string;
  subtitle?: string;
  image?: string;
  size?: string;
  color?: string;
}

interface OrderSummary {
  status: string;
  statusDate: string;
  product: OrderProduct;
  customerName: string;
  isPaid: boolean;
  paymentMethod: string;
}

/* ============================================================
   HELPERS
   ============================================================ */

const resolveImage = (raw?: string | null) => {
  if (!raw) return null;
  if (raw.startsWith('data:image')) return { uri: raw };
  if (raw.startsWith('http')) return { uri: raw };
  const base = config.baseURL || '';
  return { uri: `${base}${raw.startsWith('/') ? '' : '/'}${raw}` };
};

const formatDate = (dateString?: string | null) => {
  if (!dateString) return '';
  try {
    if (typeof dateString === 'string' && dateString.includes(' at ')) {
      return dateString.split(' at ')[0].trim();
    }
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return '';
    return date.toLocaleDateString('en-IN', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
    });
  } catch {
    return '';
  }
};

/* ============================================================
   STATUS → ICON + COLOR MAP
   ============================================================ */

const getStatusIcon = (status: string) => {
  switch (status) {
    case 'Delivered':
    case 'Completed':
      return { name: 'check', bg: '#E1F4E7', color: '#1B8B4C' };
    case 'Shipped':
      return { name: 'local-shipping', bg: '#E1ECFB', color: '#2563EB' };
    case 'Cancelled':
      return { name: 'close', bg: '#E5E5E5', color: '#1C1C1E' };
    case 'Pending':
      return { name: 'schedule', bg: '#FBEFD6', color: '#B57724' };
    case 'Confirmed':
      return { name: 'check-circle-outline', bg: '#E1F4F0', color: '#0F766E' };
    default:
      return { name: 'info-outline', bg: '#E5E5E5', color: '#1C1C1E' };
  }
};

const getStatusSubtitle = (order: any) => {
  const status = order?.status;
  const date = formatDate(
    order?.deliveredAt || order?.updatedAt || order?.createdAt,
  );

  switch (status) {
    case 'Delivered':
      return date ? `On ${date}. Thank you for shopping!` : 'Delivered';
    case 'Cancelled':
      return date
        ? `On ${date} as per your request.`
        : 'Cancelled as per your request.';
    case 'Shipped':
      return date ? `Shipped on ${date}.` : 'Shipped';
    case 'Confirmed':
      return date ? `Confirmed on ${date}.` : 'Confirmed';
    case 'Pending':
      return date ? `Placed on ${date}.` : 'Order is being processed';
    case 'Completed':
      return date ? `Completed on ${date}.` : 'Order completed';
    default:
      return date ? `On ${date}` : '';
  }
};

/* ============================================================
   REFUND MESSAGES — based on real payment method
   ============================================================ */

const getRefundMessage = (summary: OrderSummary) => {
  const name = (summary.customerName || 'Customer').toUpperCase();
  const method = (summary.paymentMethod || '').toLowerCase();

  if (!summary.isPaid || method.includes('cod') || method.includes('delivery')) {
    return `${name}, refund is not applicable on this order, as this was a pay on delivery.`;
  }

  if (summary.status === 'Cancelled') {
    return `${name}, your refund for this order is being processed. It will be credited to your original payment method within 5–7 business days.`;
  }

  return `${name}, no refund has been initiated for this order yet. If you need help, please contact support.`;
};

/* ============================================================
   REUSABLE PIECES
   ============================================================ */

const OrderSummaryCard: React.FC<{
  product: OrderProduct;
  onPress?: () => void;
}> = ({ product, onPress }) => {
  const imageSrc = resolveImage(product.image);

  return (
    <TouchableOpacity
      style={styles.orderCard}
      activeOpacity={0.85}
      onPress={onPress}
      disabled={!onPress}
    >
      {imageSrc ? (
        <Image
          source={imageSrc}
          style={styles.orderCardImage}
          resizeMode="cover"
        />
      ) : (
        <View style={[styles.orderCardImage, styles.orderCardImagePlaceholder]}>
          <MaterialIcons name="image" size={26} color="#C0C0C0" />
        </View>
      )}

      <View style={styles.orderCardInfo}>
        <Text style={styles.orderCardName} numberOfLines={1}>
          {product.name}
        </Text>
        {product.subtitle ? (
          <Text style={styles.orderCardSubtitle} numberOfLines={1}>
            {product.subtitle}
          </Text>
        ) : null}
        {product.size ? (
          <Text style={styles.orderCardMeta} numberOfLines={1}>
            Size: {product.size}
          </Text>
        ) : null}
      </View>

      <MaterialIcons name="chevron-right" size={26} color="#8A8A8A" />
    </TouchableOpacity>
  );
};

/* ============================================================
   EXPANDABLE QUERY ROW
   ============================================================ */

const QueryAccordion: React.FC<{
  question: string;
  answer: string;
  expanded: boolean;
  onToggle: () => void;
  onFeedback: (t: 'yes' | 'no') => void;
  feedback: 'yes' | 'no' | null;
  onContactUs: () => void;
}> = ({
  question,
  answer,
  expanded,
  onToggle,
  onFeedback,
  feedback,
  onContactUs,
}) => (
  <View style={styles.queryBlock}>
    <TouchableOpacity
      style={styles.queryRow}
      onPress={onToggle}
      activeOpacity={0.7}
    >
      <Text style={styles.queryRowText}>{question}</Text>
      <MaterialIcons
        name="chevron-right"
        size={24}
        color="#8A8A8A"
        style={{
          transform: [{ rotate: expanded ? '90deg' : '0deg' }],
        }}
      />
    </TouchableOpacity>

    {expanded && (
      <>
        <View style={styles.answerHeader}>
          <Text style={styles.answerTitle}>{question.toUpperCase()}</Text>
        </View>

        <View style={styles.answerBody}>
          <Text style={styles.answerText}>{answer}</Text>
        </View>

        <View style={styles.helpfulRow}>
          <Text style={styles.helpfulLabel}>Was this helpful?</Text>
          <View style={styles.helpfulButtons}>
            <TouchableOpacity
              style={[
                styles.feedbackBtn,
                feedback === 'yes' && styles.feedbackBtnActive,
              ]}
              onPress={() => onFeedback('yes')}
              activeOpacity={0.7}
            >
              <Text style={styles.feedbackEmoji}>👍</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.feedbackBtn,
                feedback === 'no' && styles.feedbackBtnActive,
              ]}
              onPress={() => onFeedback('no')}
              activeOpacity={0.7}
            >
              <Text style={styles.feedbackEmoji}>👎</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.stillHelp}>
          <Text style={styles.stillHelpTitle}>Still need help?</Text>
          <Text style={styles.stillHelpSubtitle}>
            Have queries? please get in touch and we{'\n'}will be happy to help
            you
          </Text>
          <TouchableOpacity onPress={onContactUs} activeOpacity={0.7}>
            <Text style={styles.contactUs}>CONTACT US</Text>
          </TouchableOpacity>
        </View>
      </>
    )}
  </View>
);

/* ============================================================
   MAIN SCREEN
   ============================================================ */

const HelpCenterScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<RouteProp<RootStackParamList, 'HelpCenter'>>();
  const orderId: string | undefined = (route.params as any)?.orderId;

  const [expanded, setExpanded] = useState<ExpandedKey>(null);
  const [feedback, setFeedback] = useState<'yes' | 'no' | null>(null);
  const [summary, setSummary] = useState<OrderSummary | null>(null);
  const [loading, setLoading] = useState(true);

  /* ============================================================
     FETCH ORDER FROM API
     ============================================================ */

  useEffect(() => {
    const load = async () => {
      if (!orderId) {
        snackbar.error('Order ID not found');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        LoadingService.show('Loading help center...');

        const response = await getOrderById(orderId);

        if (!response?.success || !response?.order) {
          throw new Error(response?.message || 'Failed to load order');
        }

        const order = response.order;
        const firstProduct = order.products?.[0] || {};

        const method =
          order?.paymentInfo?.paymentMethod ||
          order?.paymentInfo?.method ||
          '';
        const methodLower = String(method).toLowerCase();
        const isPaid =
          order?.paymentInfo?.paymentStatus === 'success' ||
          order?.isPaid === true ||
          methodLower.includes('razorpay') ||
          methodLower.includes('online') ||
          methodLower.includes('upi') ||
          methodLower.includes('card');

        // Parse "Anouk Embellished Saree" → name: "Anouk", subtitle: "Embellished Saree"
        const fullName = firstProduct.name || 'Product';
        const words = fullName.trim().split(/\s+/);
        const brandName = words[0] || fullName;
        const subtitle = words.slice(1).join(' ') || '';

        setSummary({
          status: order.status || 'Pending',
          statusDate: getStatusSubtitle(order),
          product: {
            name: brandName,
            subtitle: subtitle,
            image: firstProduct.image || '',
            size: firstProduct.size || firstProduct.selectedSize || undefined,
            color:
              firstProduct.color || firstProduct.selectedColor || undefined,
          },
          customerName:
            order?.user?.username || order?.user?.name || 'Customer',
          isPaid,
          paymentMethod: String(method),
        });
      } catch (err: any) {
        console.error('Help center load error:', err);
        snackbar.error(err?.message || 'Failed to load order details');
      } finally {
        setLoading(false);
        LoadingService.hide();
      }
    };

    load();
  }, [orderId]);

  /* ============================================================
     HANDLERS
     ============================================================ */

  const toggleExpand = (key: ExpandedKey) => {
    setExpanded(prev => (prev === key ? null : key));
    setFeedback(null);
  };

  const handleFeedback = (type: 'yes' | 'no') => {
    setFeedback(type);
    snackbar.success(
      type === 'yes' ? 'Thanks! Glad this helped.' : 'Thanks for the feedback.',
    );
  };

  const handleContactUs = () => {
    Linking.openURL(
      'mailto:sansaheritage@gmail.com?subject=Help%20Request',
    ).catch(() => snackbar.info('Reach us at sansaheritage@gmail.com'));
  };

  /* ✅ FIXED — Myntra-style: tapping card takes you back to the order */
  const handleOrderCardPress = () => {
    if (!orderId) {
      snackbar.error('Order not available');
      return;
    }

    if (navigation.canGoBack()) {
      navigation.goBack();
      return;
    }

    // Fallback (e.g. deep-link): navigate to OrderDetails explicitly
    navigation.navigate('OrderDetails' as any, { orderId });
  };

  /* ============================================================
     LOADING
     ============================================================ */

  if (loading || !summary) {
    return <View style={styles.container} />;
  }

  const statusIcon = getStatusIcon(summary.status);
  const refundMessage = getRefundMessage(summary);

  /* ============================================================
     RENDER
     ============================================================ */

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ============ STATUS BLOCK ============ */}
        <View style={styles.statusBlock}>
          <View style={styles.statusRow}>
            <View
              style={[
                styles.statusIconCircle,
                { backgroundColor: statusIcon.bg },
              ]}
            >
              <MaterialIcons
                name={statusIcon.name as any}
                size={22}
                color={statusIcon.color}
              />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.statusTitle}>{summary.status}</Text>
              <Text style={styles.statusSubtitle}>{summary.statusDate}</Text>
            </View>
          </View>

          <OrderSummaryCard
            product={summary.product}
            onPress={handleOrderCardPress}
          />
        </View>

        {/* ============ MORE QUERIES HEADER ============ */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionHeaderText}>
            MORE QUERIES RELATED TO YOUR EXPERIENCE
          </Text>
        </View>

        {/* ============ QUESTION 1 ============ */}
        <QueryAccordion
          question="Where is my refund?"
          answer={refundMessage}
          expanded={expanded === 'where'}
          onToggle={() => toggleExpand('where')}
          onFeedback={handleFeedback}
          feedback={expanded === 'where' ? feedback : null}
          onContactUs={handleContactUs}
        />

        {/* ============ QUESTION 2 ============ */}
        <QueryAccordion
          question="When will I get my refund?"
          answer={refundMessage}
          expanded={expanded === 'when'}
          onToggle={() => toggleExpand('when')}
          onFeedback={handleFeedback}
          feedback={expanded === 'when' ? feedback : null}
          onContactUs={handleContactUs}
        />
      </ScrollView>
    </View>
  );
};

export default HelpCenterScreen;

/* ============================================================
   STYLES
   ============================================================ */

const DARK = '#1C1C1E';
const MUTED = '#7A7A7A';
const BORDER = '#EEEEEE';
const BG = '#FFFFFF';
const SECTION_BG = '#F7F7F7';
const MAROON = '#9E0E26';

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: BG },
  scroll: { flex: 1, backgroundColor: BG },
  scrollContent: { paddingBottom: 40 },

  /* STATUS BLOCK */
  statusBlock: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 14,
    backgroundColor: BG,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  statusIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  statusTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: DARK,
    marginBottom: 3,
  },
  statusSubtitle: {
    fontSize: 14,
    color: MUTED,
    fontWeight: '400',
  },

  /* ORDER CARD */
  orderCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F4F4F4',
    borderRadius: 4,
    padding: 10,
    gap: 12,
  },
  orderCardImage: {
    width: 70,
    height: 92,
    borderRadius: 2,
    backgroundColor: '#E5E5E5',
  },
  orderCardImagePlaceholder: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  orderCardInfo: {
    flex: 1,
    justifyContent: 'center',
    paddingVertical: 2,
  },
  orderCardName: {
    fontSize: 15,
    fontWeight: '700',
    color: DARK,
    marginBottom: 2,
    lineHeight: 20,
  },
  orderCardSubtitle: {
    fontSize: 13,
    color: '#4A4A4A',
    fontWeight: '400',
    lineHeight: 18,
  },
  orderCardMeta: {
    fontSize: 13,
    color: '#4A4A4A',
    fontWeight: '400',
    lineHeight: 18,
    marginTop: 1,
  },

  /* SECTION HEADER */
  sectionHeader: {
    backgroundColor: SECTION_BG,
    paddingHorizontal: 16,
    paddingVertical: 18,
    borderTopWidth: 1,
    borderTopColor: BORDER,
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
  },
  sectionHeaderText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#1C1C1E',
    letterSpacing: 1,
  },

  /* QUERY BLOCK */
  queryBlock: {
    backgroundColor: BG,
  },
  queryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 22,
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
  },
  queryRowText: {
    fontSize: 15,
    color: '#1C1C1E',
    fontWeight: '400',
    flex: 1,
  },

  /* ANSWER */
  answerHeader: {
    backgroundColor: BG,
    paddingHorizontal: 16,
    paddingTop: 22,
    paddingBottom: 16,
  },
  answerTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#1C1C1E',
    letterSpacing: 0.8,
  },
  answerBody: {
    backgroundColor: BG,
    paddingHorizontal: 16,
    paddingTop: 4,
    paddingBottom: 26,
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
  },
  answerText: {
    fontSize: 15,
    color: '#1C1C1E',
    lineHeight: 24,
  },

  /* HELPFUL ROW */
  helpfulRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: BG,
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
  },
  helpfulLabel: {
    fontSize: 15,
    color: '#1C1C1E',
    fontWeight: '400',
  },
  helpfulButtons: { flexDirection: 'row', gap: 12 },
  feedbackBtn: {
    width: 30,
    height: 30,
    borderRadius: 22,
    backgroundColor: '#ffff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  feedbackBtnActive: { backgroundColor: '#E3E3E3' },
  feedbackEmoji: { fontSize: 15 },

  /* STILL NEED HELP */
  stillHelp: {
    backgroundColor: BG,
    paddingHorizontal: 16,
    paddingTop: 22,
    paddingBottom: 30,
  },
  stillHelpTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1C1C1E',
    marginBottom: 8,
  },
  stillHelpSubtitle: {
    fontSize: 15,
    color: '#4A4A4A',
    lineHeight: 22,
    marginBottom: 16,
  },
  contactUs: {
    fontSize: 15,
    fontWeight: '800',
    color: MAROON,
    letterSpacing: 1,
  },
});