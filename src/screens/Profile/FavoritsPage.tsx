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
} from 'react-native';
import { getFavoriteProducts, removeFromFavoritesList } from '../../api/favoriteApi';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../../models/types';
import eventBus from '../../services/eventBus';
import config from '../../config/config';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { addToCart } from '../../api/cartApi';
import LoadingService from '../../services/LoadingService';

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - 48) / 2;

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
  const [fullProductData, setFullProductData] = useState<Map<string, FullProductDetails>>(new Map());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [sortBy, setSortBy] = useState('Recently Added');

  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();

  const redirectToProductDetails = (id: string) => {
    navigation.navigate('ProductDetails' as any, { itemId: id });
  };

  const handleRemoveFavorite = async (productId: string) => {
    try {
      await removeFromFavoritesList(productId);
      setFavoriteData(prev => prev.filter((f: any) => f.productId._id !== productId));
      setFullProductData(prev => {
        const newMap = new Map(prev);
        newMap.delete(productId);
        return newMap;
      });
      eventBus.emit("ITEM_REMOVED", { id: 123 });
    } catch (err) {
      console.log('❌ Error removing favorite:', err);
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
      eventBus.emit("CART_UPDATED", {});
    } catch (error) {
      Alert.alert('Error', 'Failed to add item to cart. Please try again.');
    } finally {
      LoadingService.hide();
    }
  };

  const fetchProductDetails = async (productId: string): Promise<FullProductDetails | null> => {
    try {
      const token = await AsyncStorage.getItem('authToken');
      const response = await fetch(`${config.baseURL}api/products/${productId}`, {
        headers: {
          'Authorization': token ? `Bearer ${token}` : '',
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        return null;
      }

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

  const getBrandName = (product: any): string => {
    const fullData = fullProductData.get(product._id);
    const brandData = fullData?.brand || product.brand;
    
    if (!brandData) return '';
    
    if (typeof brandData === 'object') {
      return brandData.name || '';
    }
    
    return brandData || '';
  };

  const getColorName = (color: any): string => {
    if (!color) return 'N/A';
    
    if (typeof color === 'object' && color.name) {
      return color.name;
    }
    
    if (typeof color === 'string') {
      return color;
    }
    
    return 'N/A';
  };

  const getSizeLabel = (size: any): string => {
    if (!size) return 'N/A';
    
    if (typeof size === 'object' && size.label) {
      return size.label.toUpperCase();
    }
    
    if (typeof size === 'string') {
      return size.toUpperCase();
    }
    
    return 'N/A';
  };

  const getColorHex = (color: any): string | null => {
    if (!color) return null;
    
    if (typeof color === 'object' && color.hexCode) {
      return color.hexCode;
    }
    
    return null;
  };

  const isInStock = (product: any): boolean => {
    const fullData = fullProductData.get(product._id);
    const stock = fullData?.stock || product.stock;
    return stock !== undefined && stock > 0;
  };

  const getDiscount = (product: any): number => {
    const fullData = fullProductData.get(product._id);
    const discount = fullData?.discount || fullData?.discountPercent || product.discount || product.discountPercent || 0;
    return Number(discount);
  };

  const renderItem = ({ item }: { item: FavoriteItem }) => {
    const productId = item.productId._id;
    const productData = fullProductData.get(productId) || item.productId;
    
    const imageUrl = getImageUrl(productData);
    const discount = getDiscount(productData);
    const discountedPrice = discount > 0 
      ? item.productId.price - (item.productId.price * discount / 100)
      : item.productId.price;

    const brandName = getBrandName(productData);
    const inStock = isInStock(productData);
    
    const selectedColor = item.selectedColor || productData.colors?.[0] || null;
    const colorName = getColorName(selectedColor);
    const colorHex = getColorHex(selectedColor);
    
    const selectedSize = item.selectedSize || productData.sizes?.[0] || null;
    const sizeLabel = getSizeLabel(selectedSize);

    const rating = productData.rating || (4 + Math.random() * 0.9);
    const ratingCount = Math.floor(Math.random() * 100) + 20;

    return (
      <TouchableOpacity
        style={styles.itemContainer}
        onPress={() => redirectToProductDetails(productId)}
        activeOpacity={0.8}
      >
        <View style={styles.imageContainer}>
          {imageUrl ? (
            <Image 
              source={{ uri: imageUrl }} 
              style={styles.itemImage}
              resizeMode="cover"
            />
          ) : (
            <View style={[styles.itemImage, styles.placeholderImage]}>
              <Text style={styles.placeholderText}>No Image</Text>
            </View>
          )}
          
          {discount > 0 && (
            <View style={styles.discountBadgeContainer}>
              <Text style={styles.discountBadgeText}>{discount}% OFF</Text>
            </View>
          )}
          
          <TouchableOpacity
            style={styles.heartIconContainer}
            onPress={() => handleRemoveFavorite(productId)}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="heart" size={18} color="#96252A" />
          </TouchableOpacity>
        </View>

        <View style={styles.itemDetails}>
          {brandName && (
            <Text style={styles.brandText} numberOfLines={1}>
              {brandName}
            </Text>
          )}
          
          <Text style={styles.itemName} numberOfLines={1}>
            {item.productId.name}
          </Text>
          
          <View style={styles.variantsRow}>
            {colorHex && (
              <View style={[styles.colorDot, { backgroundColor: colorHex }]} />
            )}
            <Text style={styles.variantText} numberOfLines={1}>
              {colorName !== 'N/A' ? `Color: ${colorName}` : ''}
              {sizeLabel !== 'N/A' && colorName !== 'N/A' ? ' | ' : ''}
              {sizeLabel !== 'N/A' ? `Size: ${sizeLabel}` : ''}
            </Text>
          </View>
          
          <View style={styles.priceContainer}>
            <Text style={styles.itemPrice}>
              ₹{discountedPrice.toFixed(0)}
            </Text>
            {discount > 0 && (
              <Text style={styles.originalPrice}>
                ₹{item.productId.price}
              </Text>
            )}
          </View>
          
          <View style={styles.ratingContainer}>
            <Ionicons name="star" size={11} color="#FFB800" />
            <Text style={styles.ratingText}>{rating.toFixed(1)}</Text>
            <Text style={styles.ratingCount}>({ratingCount})</Text>
          </View>
          
          <View style={styles.stockContainer}>
            <Ionicons 
              name={inStock ? "lock-closed-outline" : "lock-open-outline"} 
              size={11} 
              color={inStock ? "#4CAF50" : "#E53935"} 
            />
            <Text style={[styles.stockText, !inStock && styles.outOfStockText]}>
              {inStock ? 'In Stock' : 'Out of Stock'}
            </Text>
          </View>
          
          <TouchableOpacity 
            style={[styles.actionButton, !inStock && styles.notifyButton]}
            onPress={() => {
              if (inStock) {
                handleAddToCart(item);
              } else {
                Alert.alert('Notify Me', 'We will notify you when this item is back in stock.');
              }
            }}
          >
            <Text style={styles.actionButtonText}>
              {inStock ? 'Add to Cart' : 'Notify Me'}
            </Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  };

  const ListHeaderComponent = () => (
    <View style={styles.headerContainer}>
      {/* <Text style={styles.headerTitle}>Wishlist</Text> */}
      <View style={styles.headerSub}>
        <Text style={styles.itemCountText}>{favoriteData.length} items saved</Text>
        <View style={styles.sortContainer}>
          <Text style={styles.sortLabel}>Sort by:</Text>
          <TouchableOpacity style={styles.sortButton}>
            <Text style={styles.sortText}>{sortBy}</Text>
            <Ionicons name="chevron-down" size={16} color="#333" />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  const ListEmptyComponent = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="heart-outline" size={80} color="#ddd" />
      <Text style={styles.emptyTitle}>No Favorites Yet</Text>
      <Text style={styles.emptySubtitle}>
        Start adding items you love to your favorites list
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
        <Text style={styles.loadingText}>Loading your favorites...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="alert-circle-outline" size={80} color="#E53935" />
        <Text style={styles.errorMessage}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={getFavorites}>
          <Text style={styles.retryButtonText}>RETRY</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#f8f8f8" />
      <View style={styles.screen}>
        <FlatList
          data={favoriteData}
          renderItem={renderItem}
          keyExtractor={(item) => item._id || item.productId._id}
          numColumns={2}
          columnWrapperStyle={favoriteData.length > 0 ? styles.row : null}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[
            styles.listContent,
            favoriteData.length === 0 && styles.emptyListContent
          ]}
          ListHeaderComponent={ListHeaderComponent}
          ListEmptyComponent={ListEmptyComponent}
          refreshing={refreshing}
          onRefresh={onRefresh}
          removeClippedSubviews={true}
          maxToRenderPerBatch={10}
          windowSize={10}
          initialNumToRender={6}
        />
      </View>
    </SafeAreaView>
  );
};

export default FavoriteScreen;

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f8f8f8',
  },
  screen: {
    flex: 1,
    backgroundColor: '#f8f8f8',
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  emptyListContent: {
    flex: 1,
    justifyContent: 'center',
  },
  
  headerContainer: {
    paddingTop: 8,
    paddingBottom: 12,
    backgroundColor: '#f8f8f8',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#151515',
    marginBottom: 4,
  },
  headerSub: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  itemCountText: {
    fontSize: 14,
    color: '#666',
  },
  sortContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sortLabel: {
    fontSize: 13,
    color: '#666',
    marginRight: 4,
  },
  sortButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sortText: {
    fontSize: 13,
    color: '#151515',
    fontWeight: '500',
    marginRight: 2,
  },
  
  row: {
    justifyContent: 'space-between',
  },
  
  itemContainer: {
    width: CARD_WIDTH,
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  imageContainer: {
    position: 'relative',
    width: '100%',
    height: 140,
    backgroundColor: '#f9f9f9',
  },
  itemImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  placeholderImage: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
  },
  placeholderText: {
    color: '#999',
    fontSize: 12,
    fontWeight: '500',
  },
  
  discountBadgeContainer: {
    position: 'absolute',
    top: 6,
    left: 6,
    backgroundColor: '#E53935',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  discountBadgeText: {
    color: '#fff',
    fontSize: 9,
    fontWeight: '700',
  },
  
  heartIconContainer: {
    position: 'absolute',
    top: 6,
    right: 6,
    backgroundColor: 'rgba(255,255,255,0.9)',
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 2,
    shadowOffset: { width: 0, height: 1 },
    elevation: 2,
  },
  
  itemDetails: {
    padding: 10,
    paddingTop: 8,
  },
  brandText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#D4A017',
    textTransform: 'uppercase',
    marginBottom: 1,
  },
  itemName: {
    fontSize: 12,
    fontWeight: '600',
    color: '#151515',
    marginBottom: 2,
    lineHeight: 16,
  },
  variantsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },
  colorDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 4,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  variantText: {
    fontSize: 10,
    color: '#888',
    flex: 1,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },
  itemPrice: {
    fontSize: 14,
    fontWeight: '700',
    color: '#151515',
  },
  originalPrice: {
    fontSize: 10,
    color: '#999',
    textDecorationLine: 'line-through',
    marginLeft: 5,
  },
  
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 1,
  },
  ratingText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#151515',
    marginLeft: 2,
  },
  ratingCount: {
    fontSize: 10,
    color: '#888',
    marginLeft: 2,
  },
  
  stockContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  stockText: {
    fontSize: 10,
    color: '#4CAF50',
    fontWeight: '500',
    marginLeft: 2,
  },
  outOfStockText: {
    color: '#E53935',
  },
  
  actionButton: {
    backgroundColor: 'black',
    paddingVertical: 6,
    borderRadius: 6,
    alignItems: 'center',
  },
  notifyButton: {
    backgroundColor: '#FF6F00',
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '600',
  },
  
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
    marginTop: 40,
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
  
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#666',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#fff',
  },
  errorMessage: {
    color: '#E53935',
    fontSize: 16,
    textAlign: 'center',
    marginTop: 16,
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: '#96252A',
    paddingHorizontal: 30,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
});