import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
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

  const getFavorites = async () => {
    setLoading(true);
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
    }
  };

  useEffect(() => {
    getFavorites();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    getFavorites();
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
    const rating = productData.rating || 4.3;

    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() => redirectToProductDetails(productId)}
        activeOpacity={0.85}
      >
        <View style={styles.imageWrap}>
          {imageUrl ? (
            <Image source={{ uri: imageUrl }} style={styles.image} resizeMode="cover" />
          ) : (
            <View style={[styles.image, styles.placeholder]}>
              <Text style={styles.placeholderText}>No Image</Text>
            </View>
          )}

          {/* Out-of-stock overlay */}
          {outOfStock && (
            <>
              <View style={styles.oosOverlay} />
              <View style={styles.oosBadge}>
                <Text style={styles.oosBadgeText}>OUT OF STOCK</Text>
              </View>
            </>
          )}

          {/* Rating pill top-left */}
          {!outOfStock && (
            <View style={styles.ratingPill}>
              <Text style={styles.ratingPillText}>{rating.toFixed(1)}</Text>
              <MaterialIcons name="star" size={9} color="#fff" />
            </View>
          )}

          {/* ✅ Wishlist heart — no white bg, just floating filled heart */}
          <TouchableOpacity
            style={styles.heartBtn}
            onPress={() => handleRemoveFavorite(productId)}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons name="heart" size={22} color="#E9445A" />
          </TouchableOpacity>
        </View>

        <View style={styles.info}>
          <Text style={styles.name} numberOfLines={1}>
            {item.productId.name}
          </Text>

          <View style={styles.priceRow}>
            <Text style={styles.price}>₹{discountedPrice.toFixed(0)}</Text>
            {discount > 0 && (
              <>
                <Text style={styles.mrp}>₹{item.productId.price}</Text>
                <Text style={styles.off}>({discount}% OFF)</Text>
              </>
            )}
          </View>

          <View style={styles.actionRow}>
            <TouchableOpacity
              style={styles.shareBtn}
              onPress={() => handleShare(item)}
              hitSlop={6}
            >
              <Ionicons name="share-social-outline" size={14} color="#666" />
              <Text style={styles.shareText}>Share</Text>
            </TouchableOpacity>

            {/* ✅ Add to Cart — bag icon instead of text */}
            <TouchableOpacity
              style={styles.addBtn}
              onPress={() => {
                if (outOfStock) {
                  Alert.alert(
                    'Out of Stock',
                    'We will notify you when this item is back in stock.',
                  );
                } else {
                  handleAddToCart(item);
                }
              }}
              hitSlop={6}
            >
              <Ionicons
                name={outOfStock ? 'notifications-outline' : 'bag-outline'}
                size={18}
                color="#fff"
              />
            </TouchableOpacity>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

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
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#96252A" />
        <Text style={styles.loadingText}>Loading your wishlist...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="alert-circle-outline" size={60} color="#E53935" />
        <Text style={styles.errorMessage}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={getFavorites}>
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
const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#fff' },
  screen: { flex: 1, backgroundColor: '#fff' },

  listContent: {
    paddingHorizontal: 10,
    paddingTop: 10,
    paddingBottom: 90,
  },
  emptyListContent: {
    flex: 1,
    justifyContent: 'center',
  },

  row: {
    justifyContent: 'space-between',
  },

  // Myntra compact card
  card: {
    width: '48.5%',
    backgroundColor: '#fff',
    borderRadius: 8,
    marginBottom: 8,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },
  imageWrap: {
    position: 'relative',
    width: '100%',
    aspectRatio: 0.78,
    backgroundColor: '#F5F5F5',
    overflow: 'hidden',
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

  // Out-of-stock overlay
  oosOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255,255,255,0.6)',
  },
  oosBadge: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.75)',
    paddingVertical: 4,
    alignItems: 'center',
  },
  oosBadgeText: {
    color: '#fff',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.5,
  },

  // Rating pill
  ratingPill: {
    position: 'absolute',
    top: 6,
    left: 6,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#138E4E',
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 3,
    gap: 2,
  },
  ratingPillText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '700',
  },

  // ✅ Heart — no white bg, floating filled red heart
  heartBtn: {
    position: 'absolute',
    top: 4,
    right: 4,
    padding: 4,
    // removed: width, height, borderRadius, backgroundColor, elevation, shadow
  },

  // Info
  info: {
    paddingHorizontal: 8,
    paddingVertical: 6,
  },
  name: {
    fontSize: 12,
    fontWeight: '600',
    color: '#222',
    marginBottom: 3,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  price: {
    fontSize: 13,
    fontWeight: '700',
    color: '#000',
    marginRight: 5,
  },
  mrp: {
    fontSize: 11,
    color: '#999',
    textDecorationLine: 'line-through',
    marginRight: 4,
  },
  off: {
    fontSize: 10,
    color: '#F5A623',
    fontWeight: '600',
  },

  // Action row
  actionRow: {
    marginTop: 6,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  shareBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 2,
    paddingHorizontal: 4,
    gap: 3,
  },
  shareText: {
    fontSize: 10,
    color: '#666',
    fontWeight: '500',
  },

  // ✅ Add to Cart button — square icon button
  addBtn: {
    backgroundColor: '#111',
    width: 28,
    height: 28,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Empty
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 30,
    marginTop: 20,
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
    backgroundColor: '#96252A',
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
  loadingText: { marginTop: 10, fontSize: 13, color: '#666' },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#fff',
  },
  errorMessage: {
    color: '#96252A',
    fontSize: 14,
    textAlign: 'center',
    marginTop: 12,
    marginBottom: 16,
  },
  retryButton: {
    backgroundColor: '#96252A',
    paddingHorizontal: 28,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryButtonText: { color: '#fff', fontWeight: '600', fontSize: 12 },
});