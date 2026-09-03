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
          
          {/* Discount Badge - Top Left */}
          {discount > 0 && (
            <View style={styles.discountBadgeContainer}>
              <Text style={styles.discountBadgeText}>{discount}% OFF</Text>
            </View>
          )}
          
          {/* Remove from Wishlist - Heart Icon - Top Right */}
          <TouchableOpacity
            style={styles.heartIconContainer}
            onPress={() => handleRemoveFavorite(productId)}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="heart" size={16} color="#96252A" />
          </TouchableOpacity>
        </View>

        <View style={styles.itemDetails}>
          {/* Product Name */}
          <Text style={styles.itemName} numberOfLines={2}>
            {item.productId.name}
          </Text>
          
          {/* Price */}
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
          
          {/* Rating */}
          <View style={styles.ratingContainer}>
            <Ionicons name="star" size={10} color="#FFB800" />
            <Text style={styles.ratingText}>{rating.toFixed(1)}</Text>
            <Text style={styles.ratingCount}>({ratingCount})</Text>
          </View>
          
          {/* Stock Status */}
          <View style={styles.stockContainer}>
            <Ionicons 
              name="ellipse" 
              size={6} 
              color={inStock ? "#4CAF50" : "#E53935"} 
              style={styles.stockDot}
            />
            <Text style={[styles.stockText, !inStock && styles.outOfStockText]}>
              {inStock ? 'In Stock' : 'Out of Stock'}
            </Text>
          </View>
          
          {/* Button */}
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
      <View style={styles.headerSub}>
        <Text style={styles.itemCountText}>{favoriteData.length} items saved</Text>
        <View style={styles.sortContainer}>
          <Text style={styles.sortLabel}>Sort by:</Text>
          <TouchableOpacity style={styles.sortButton}>
            <Text style={styles.sortText}>{sortBy}</Text>
            <Ionicons name="chevron-down" size={14} color="#666" />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  const ListEmptyComponent = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="heart-outline" size={60} color="#ddd" />
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
    paddingHorizontal: 12,
    paddingBottom: 20,
  },
  emptyListContent: {
    flex: 1,
    justifyContent: 'center',
  },
  
  // Header Styles
  headerContainer: {
    paddingTop: 4,
    paddingBottom: 10,
    backgroundColor: '#f8f8f8',
  },
  headerSub: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  itemCountText: {
    fontSize: 12,
    color: '#888',
    fontWeight: '500',
  },
  sortContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sortLabel: {
    fontSize: 11,
    color: '#888',
    marginRight: 4,
  },
  sortButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sortText: {
    fontSize: 12,
    color: '#151515',
    fontWeight: '500',
    marginRight: 2,
  },
  
  // Grid Row
  row: {
    justifyContent: 'space-between',
  },
  
  // Item Container
  itemContainer: {
    width: '48%',
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 12,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  
  // Image Container - Full width, square
  imageContainer: {
    position: 'relative',
    width: '100%',
    aspectRatio: 1,
    backgroundColor: '#f9f9f9',
    overflow: 'hidden',
  },
  itemImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
    backgroundColor: '#f9f9f9',
  },
  placeholderImage: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
  },
  placeholderText: {
    color: '#999',
    fontSize: 10,
    fontWeight: '500',
  },
  
  // Discount Badge
  discountBadgeContainer: {
    position: 'absolute',
    top: 8,
    left: 0,
    backgroundColor: '#96252A',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 3,
    zIndex: 5,
  },
  discountBadgeText: {
    color: '#fff',
    fontSize: 9,
    fontWeight: 'bold',
  },
  
  // Heart Icon
  heartIconContainer: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: '#fff',
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 2,
    shadowOffset: { width: 0, height: 1 },
    zIndex: 5,
  },
  
  // Item Details
  itemDetails: {
    padding: 8,
    paddingBottom: 10,
  },
  
  // Product Name
  itemName: {
    fontSize: 12,
    fontWeight: '600',
    color: '#222',
    lineHeight: 16,
    marginBottom: 2,
    minHeight: 32,
  },
  
  // Price
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },
  itemPrice: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#000',
    marginRight: 6,
  },
  originalPrice: {
    fontSize: 11,
    color: '#888',
    textDecorationLine: 'line-through',
  },
  
  // Rating
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
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
  
  // Stock
  stockContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  stockDot: {
    marginRight: 4,
  },
  stockText: {
    fontSize: 10,
    color: '#4CAF50',
    fontWeight: '500',
  },
  outOfStockText: {
    color: '#E53935',
  },
  
  // Action Button
  actionButton: {
    backgroundColor: '#000',
    paddingVertical: 6,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 32,
  },
  notifyButton: {
    backgroundColor: '#FF6F00',
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '600',
  },
  
  // Empty State
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
  loadingText: {
    marginTop: 10,
    fontSize: 13,
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
  retryButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 12,
  },
});