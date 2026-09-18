import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  FlatList,
  TouchableOpacity,
  SafeAreaView,
  Dimensions,
  Alert,
  StatusBar,
  Share,
} from 'react-native';
import { getFavoriteProducts, removeFromFavoritesList } from '../../api/favoriteApi';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../../models/types';
import eventBus from '../../services/eventBus';
import config from '../../config/config';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Ionicons from 'react-native-vector-icons/Ionicons';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { addToCart } from '../../api/cartApi';
import LoadingService from '../../services/LoadingService';

const { width } = Dimensions.get('window');

interface FavoriteItem {
  _id: string;
  productId: {
    _id: string;
    name: string;
    price: number;
    image: string;
    images?: string[];
    discount?: number;
    discountPercent?: number;
    brand?: any;
    colors?: any[];
    sizes?: any[];
    availableColors?: any[];
    avaialbleSizes?: any[];
    rating?: number;
    stock?: number;
  };
  selectedColor?: any;
  selectedSize?: any;
}

interface FullProductDetails {
  _id: string;
  name: string;
  price: number;
  image: string;
  images?: string[];
  discount?: number;
  discountPercent?: number;
  brand: any;
  colors: any[];
  sizes: any[];
  availableColors?: any[];
  avaialbleSizes?: any[];
  rating?: number;
  stock?: number;
}

const FavoriteScreen = () => {
  const [favoriteData, setFavoriteData] = useState<FavoriteItem[]>([]);
  const [fullProductData, setFullProductData] = useState<Map<string, FullProductDetails>>(
    new Map(),
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();

  const redirectToProductDetails = (id: string) => {
    navigation.navigate('ProductDetails' as any, { itemId: id });
  };

  const handleRemoveFavorite = async (productId: string) => {
    try {
      await removeFromFavoritesList(productId);
      setFavoriteData(prev =>
        prev.filter((f: any) => f.productId._id !== productId),
      );
      setFullProductData(prev => {
        const newMap = new Map(prev);
        newMap.delete(productId);
        return newMap;
      });

      eventBus.emit('ITEM_REMOVED', { id: 123 });
      eventBus.emit('FAVORITE_UPDATED', {});
    } catch (err) {
      console.log('❌ Error removing favorite:', err);
    }
  };

  const handleShare = async (item: FavoriteItem) => {
    try {
      await Share.share({
        message: `Check out ${item.productId.name} on Sansa Heritage!\nPrice: ₹${item.productId.price}`,
      });
    } catch (err) {
      console.log('Share error:', err);
    }
  };

  const handleAddToCart = async (item: FavoriteItem) => {
    const productId = item.productId._id;
    const productData = fullProductData.get(productId) || item.productId;

    let colorValue = item.selectedColor || productData.colors?.[0] || null;
    let sizeValue = item.selectedSize || productData.sizes?.[0] || null;

    if (colorValue && typeof colorValue === 'object') {
      colorValue = colorValue._id || colorValue.name || null;
    }
    if (sizeValue && typeof sizeValue === 'object') {
      sizeValue = sizeValue._id || sizeValue.label || null;
    }

    try {
      LoadingService.show('Adding to cart...');
      await addToCart(productId, 1, colorValue, sizeValue);
      Alert.alert('Success', 'Item added to cart successfully!');
      eventBus.emit('CART_UPDATED', {});
    } catch (error) {
      Alert.alert('Error', 'Failed to add item to cart. Please try again.');
    } finally {
      LoadingService.hide();
    }
  };

  const fetchProductDetails = async (
    productId: string,
  ): Promise<FullProductDetails | null> => {
    try {
      const token = await AsyncStorage.getItem('authToken');
      const response = await fetch(`${config.baseURL}api/products/${productId}`, {
        headers: {
          Authorization: token ? `Bearer ${token}` : '',
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) return null;

      const data = await response.json();
      return data;
    } catch (error) {
      console.error(`❌ Error fetching product ${productId}:`, error);
      return null;
    }
  };

  const getFavorites = async (showLoader: boolean = true) => {
    setLoading(true);
    if (showLoader) LoadingService.show('Loading wishlist...');
    try {
      setError('');
      const data = await getFavoriteProducts();

      if (data && data.length > 0) {
        const fullDataMap = new Map<string, FullProductDetails>();

        for (const item of data) {
          const productId = item.productId._id;
          const fullDetails = await fetchProductDetails(productId);
          if (fullDetails) {
            fullDataMap.set(productId, fullDetails);
          }
        }

        setFullProductData(fullDataMap);
      }

      setFavoriteData(data || []);
      eventBus.emit('FAVORITE_UPDATED', {});
    } catch (err) {
      setError('Error fetching favorites');
    } finally {
      setLoading(false);
      setRefreshing(false);
      if (showLoader) LoadingService.hide();
    }
  };

  useEffect(() => {
    getFavorites(true);
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    getFavorites(false);
  };

  const getImageUrl = (product: any): string => {
    if (!product) return '';

    const fullData = fullProductData.get(product._id);
    if (fullData) {
      if (fullData.images && Array.isArray(fullData.images) && fullData.images.length > 0) {
        return fullData.images[0];
      }
      if (fullData.image && typeof fullData.image === 'string' && fullData.image.trim() !== '') {
        return fullData.image;
      }
    }

    if (product.images && Array.isArray(product.images) && product.images.length > 0) {
      return product.images[0];
    }

    if (product.image && typeof product.image === 'string' && product.image.trim() !== '') {
      return product.image;
    }

    return '';
  };

  const isOutOfStock = (product: any): boolean => {
    const fullData = fullProductData.get(product._id);
    const stock = fullData?.stock ?? product.stock;
    return stock === 0;
  };

  const getDiscount = (product: any): number => {
    const fullData = fullProductData.get(product._id);
    const discount =
      fullData?.discount ||
      fullData?.discountPercent ||
      product.discount ||
      product.discountPercent ||
      0;
    return Number(discount);
  };

  // ============================================================
  // PRODUCT CARD
  // ============================================================
  const renderItem = ({ item }: { item: FavoriteItem }) => {
    const productId = item.productId._id;
    const productData = fullProductData.get(productId) || item.productId;

    const imageUrl = getImageUrl(productData);
    const discount = getDiscount(productData);
    const discountedPrice =
      discount > 0
        ? item.productId.price - (item.productId.price * discount) / 100
        : item.productId.price;

    const outOfStock = isOutOfStock(productData);
    const rating = Number(productData.rating || 0);

    const nameParts = (item.productId.name || '').split(' ');
    const boldPart = nameParts.slice(0, 2).join(' ');
    const normalPart = nameParts.slice(2).join(' ');

    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() => redirectToProductDetails(productId)}
        activeOpacity={0.9}
      >
        {/* ====== IMAGE ====== */}
        <View style={styles.imageWrap}>
          {imageUrl ? (
            <Image source={{ uri: imageUrl }} style={styles.image} resizeMode="cover" />
          ) : (
            <View style={[styles.image, styles.placeholder]}>
              <Text style={styles.placeholderText}>No Image</Text>
            </View>
          )}

          {outOfStock && (
            <>
              <View style={styles.oosOverlay} />
              <View style={styles.oosBadge}>
                <Text style={styles.oosBadgeText}>OUT OF STOCK</Text>
              </View>
            </>
          )}

          {!outOfStock && rating > 0 && (
            <View style={styles.ratingPill}>
              <Text style={styles.ratingPillText}>{rating.toFixed(1)}</Text>
              <View style={styles.ratingPillDivider} />
              <MaterialIcons name="star" size={10} color="#1F9E4C" />
            </View>
          )}

          <TouchableOpacity
            style={styles.shareIcon}
            onPress={() => handleShare(item)}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons name="share-social-outline" size={22} color="#FFFFFF" />
          </TouchableOpacity>

          {/* ✅ Add / Similar pill — icon only (no text), soft pink bg */}
          <TouchableOpacity
            style={styles.addPill}
            activeOpacity={0.85}
            onPress={() => {
              if (outOfStock) {
                redirectToProductDetails(productId);
              } else {
                handleAddToCart(item);
              }
            }}
          >
            <Ionicons
              name={outOfStock ? 'repeat-outline' : 'bag-add-outline'}
              size={12}
              color="#9E0E26"
            />
          </TouchableOpacity>
        </View>

        {/* ====== INFO ====== */}
        <View style={styles.info}>
          <Text style={styles.name} numberOfLines={2}>
            <Text style={styles.nameBold}>{boldPart}</Text>
            {normalPart ? ` ${normalPart}` : ''}
          </Text>

          <View style={styles.priceRow}>
            <Text style={styles.price}>₹{discountedPrice.toFixed(0)}</Text>
            {discount > 0 && (
              <>
                <Text style={styles.mrp}>Rs. {item.productId.price}</Text>
                <Text style={styles.off}>{discount}% OFF</Text>
              </>
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const ListHeader = () => null;

  const ListFooter = () => (
    <View style={styles.footer}>
      <Text style={styles.footerQuote}>
        "Life is too short to wear boring clothes."
      </Text>
      <Text style={styles.footerBrand}>Cushnie et Ochs</Text>
    </View>
  );

  const ListEmptyComponent = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="heart-outline" size={60} color="#ddd" />
      <Text style={styles.emptyTitle}>Your Wishlist is Empty</Text>
      <Text style={styles.emptySubtitle}>
        Start adding items you love to your wishlist
      </Text>
      <TouchableOpacity
        style={styles.shopBtn}
        onPress={() => navigation.navigate('Dashboard' as any)}
      >
        <Text style={styles.shopBtnText}>START SHOPPING</Text>
      </TouchableOpacity>
    </View>
  );

  if (loading) {
    return <View style={styles.loadingContainer} />;
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="alert-circle-outline" size={60} color="#9E0E26" />
        <Text style={styles.errorMessage}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={() => getFavorites(true)}>
          <Text style={styles.retryButtonText}>RETRY</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      <View style={styles.screen}>
        <FlatList
          data={favoriteData}
          renderItem={renderItem}
          keyExtractor={item => item._id || item.productId._id}
          numColumns={2}
          ListHeaderComponent={ListHeader}
          ListFooterComponent={favoriteData.length > 0 ? ListFooter : null}
          columnWrapperStyle={favoriteData.length > 0 ? styles.row : undefined}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[
            styles.listContent,
            favoriteData.length === 0 && styles.emptyListContent,
          ]}
          ListEmptyComponent={ListEmptyComponent}
          refreshing={refreshing}
          onRefresh={onRefresh}
          removeClippedSubviews
          maxToRenderPerBatch={10}
          windowSize={10}
          initialNumToRender={6}
        />
      </View>
    </SafeAreaView>
  );
};

export default FavoriteScreen;

/* ================= STYLES ================= */
const CARD_GAP = 10;
const H_PADDING = 12;

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#fff' },
  screen: { flex: 1, backgroundColor: '#fff' },

  listContent: {
    paddingHorizontal: H_PADDING,
    paddingTop: 8,
    paddingBottom: 90,
  },
  emptyListContent: {
    flexGrow: 1,
  },
  row: {
    justifyContent: 'space-between',
  },

  // ============================================================
  // PRODUCT CARD
  // ============================================================
  card: {
    width: (width - H_PADDING * 2 - CARD_GAP) / 2,
    backgroundColor: '#fff',
    borderRadius: 6,
    marginBottom: 14,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },
  imageWrap: {
    position: 'relative',
    width: '100%',
    aspectRatio: 0.75,
    backgroundColor: '#F5F5F5',
  },
  image: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  placeholder: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
  },
  placeholderText: { color: '#999', fontSize: 10, fontWeight: '500' },

  // Out-of-stock
  oosOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255,255,255,0.55)',
  },
  oosBadge: {
    position: 'absolute',
    top: '46%',
    left: 0,
    right: 0,
    backgroundColor: 'rgba(90,110,120,0.65)',
    paddingVertical: 6,
    alignItems: 'center',
  },
  oosBadgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.8,
  },

  // Rating pill
  ratingPill: {
    position: 'absolute',
    bottom: 8,
    left: 8,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.95)',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 3,
    gap: 3,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 1 },
    elevation: 1,
  },
  ratingPillText: {
    color: '#111',
    fontSize: 11,
    fontWeight: '700',
  },
  ratingPillDivider: {
    width: 1,
    height: 10,
    backgroundColor: '#D0D0D0',
    marginHorizontal: 2,
  },

  // Share — top-right
  shareIcon: {
    position: 'absolute',
    top: 6,
    right: 6,
    padding: 4,
  },

  // ✅ Add / Similar pill — ONLY bg color changed. Same shape, same padding, same icon.
 addPill: {
  position: 'absolute',
  bottom: -12,             // slightly tighter to the card edge
  right: 8,
  alignItems: 'center',
  justifyContent: 'center',
  backgroundColor: '#FFF0F3',   // soft pink, no border
  borderRadius: 6,              // smaller radius
  paddingHorizontal: 6,         // tighter horizontal padding
  paddingVertical: 4,           // tighter vertical padding
  zIndex: 2,
},

  // Info section
  info: {
    paddingHorizontal: 10,
    paddingTop: 20,
    paddingBottom: 10,
  },
  name: {
    fontSize: 13,
    fontWeight: '400',
    color: '#111',
    marginBottom: 6,
  },
  nameBold: {
    fontWeight: '800',
    color: '#111',
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 5,
  },
  price: {
    fontSize: 14,
    fontWeight: '800',
    color: '#111',
  },
  mrp: {
    fontSize: 11,
    color: '#999',
    textDecorationLine: 'line-through',
  },
  off: {
    fontSize: 11,
    color: '#9E0E26',
    fontWeight: '700',
  },

  // Footer quote
  footer: {
    alignItems: 'center',
    paddingTop: 20,
    paddingBottom: 30,
  },
  footerQuote: {
    fontSize: 13,
    fontStyle: 'italic',
    color: '#555',
    textAlign: 'center',
    paddingHorizontal: 30,
  },
  footerBrand: {
    fontSize: 12,
    fontStyle: 'italic',
    color: '#999',
    marginTop: 8,
  },

  // Empty
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 30,
    marginTop: 40,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#151515',
    marginTop: 12,
  },
  emptySubtitle: {
    fontSize: 13,
    color: '#888',
    textAlign: 'center',
    marginTop: 6,
    marginBottom: 20,
  },
  shopBtn: {
    backgroundColor: '#9E0E26',
    paddingHorizontal: 28,
    paddingVertical: 12,
    borderRadius: 8,
  },
  shopBtnText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 12,
    letterSpacing: 0.5,
  },

  // Loading & Error
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#fff',
  },
  errorMessage: {
    color: '#9E0E26',
    fontSize: 14,
    textAlign: 'center',
    marginTop: 12,
    marginBottom: 16,
  },
  retryButton: {
    backgroundColor: '#9E0E26',
    paddingHorizontal: 28,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryButtonText: { color: '#fff', fontWeight: '600', fontSize: 12 },
});