import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { getFavoriteProducts, removeFromFavoritesList } from '../../api/favoriteApi';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../../models/types';
import eventBus from '../../services/eventBus';
import config from '../../config/config';
import AsyncStorage from '@react-native-async-storage/async-storage';

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
  };
  selectedColor?: any;
  selectedSize?: any;
}

// Extended product interface with full details
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
}

const FavoriteScreen = () => {
  const [favoriteData, setFavoriteData] = useState<FavoriteItem[]>([]);
  const [fullProductData, setFullProductData] = useState<Map<string, FullProductDetails>>(new Map());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();

  const redirectToProductDetails = (id: string) => {
    console.log('🔍 Navigating to product details:', id);
    navigation.navigate('ProductDetails' as any, { itemId: id });
  };

  const handleRemoveFavorite = async (productId: string) => {
    console.log('🗑️ Removing favorite:', productId);
    try {
      await removeFromFavoritesList(productId);
      setFavoriteData(prev => prev.filter((f: any) => f.productId._id !== productId));
      setFullProductData(prev => {
        const newMap = new Map(prev);
        newMap.delete(productId);
        return newMap;
      });
      eventBus.emit("ITEM_REMOVED", { id: 123 });
      console.log('✅ Favorite removed successfully');
    } catch (err) {
      console.log('❌ Error removing favorite:', err);
    }
  };

  // Fetch full product details for a single product
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
        console.log(`❌ Failed to fetch product ${productId}: ${response.status}`);
        return null;
      }

      const data = await response.json();
      console.log(`📦 Full product data for ${productId}:`, {
        id: data._id,
        name: data.name,
        image: data.image,
        images: data.images,
        brand: data.brand,
        colors: data.colors?.length || 0,
        sizes: data.sizes?.length || 0,
      });

      return data;
    } catch (error) {
      console.error(`❌ Error fetching product ${productId}:`, error);
      return null;
    }
  };

  const getFavorites = async () => {
    console.log('📥 Fetching favorites...');
    setLoading(true);
    try {
      setError('');
      const data = await getFavoriteProducts();
      console.log('📦 Favorites data received:', data?.length || 0, 'items');
      
      if (data && data.length > 0) {
        data.forEach((item: FavoriteItem, index: number) => {
          console.log(`📊 Product ${index + 1}:`, {
            id: item.productId._id,
            name: item.productId.name,
            image: item.productId.image,
            images: item.productId.images,
            hasImage: !!item.productId.image,
            hasImages: !!(item.productId.images && item.productId.images.length > 0),
            brand: item.productId.brand,
            colors: item.productId.colors,
            sizes: item.productId.sizes,
            selectedColor: item.selectedColor,
            selectedSize: item.selectedSize,
          });
        });

        // Fetch full product details for each product
        console.log('🔄 Fetching full product details for all favorites...');
        const fullDataMap = new Map<string, FullProductDetails>();
        
        for (const item of data) {
          const productId = item.productId._id;
          const fullDetails = await fetchProductDetails(productId);
          if (fullDetails) {
            fullDataMap.set(productId, fullDetails);
          }
        }
        
        setFullProductData(fullDataMap);
        console.log(`✅ Fetched details for ${fullDataMap.size} products`);
      }
      
      setFavoriteData(data || []);
    } catch (err) {
      console.error('❌ Error fetching favorites:', err);
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
    console.log('🔄 Refreshing favorites...');
    setRefreshing(true);
    getFavorites();
  };

  // Helper function to get the best available image URL
  const getImageUrl = (product: any): string => {
    console.log('🔍 Getting image for product:', product?.name || 'Unknown');
    
    if (!product) {
      console.log('⚠️ Product is null or undefined');
      return '';
    }

    const fullData = fullProductData.get(product._id);
    if (fullData) {
      console.log(`📦 Using full data for ${product.name}`);
      
      if (fullData.images && Array.isArray(fullData.images) && fullData.images.length > 0) {
        console.log('✅ Using images array:', fullData.images[0]);
        return fullData.images[0];
      }

      if (fullData.image && typeof fullData.image === 'string' && fullData.image.trim() !== '') {
        console.log('✅ Using single image from full data:', fullData.image);
        return fullData.image;
      }
    }

    if (product.images && Array.isArray(product.images) && product.images.length > 0) {
      console.log('✅ Using images array from original:', product.images[0]);
      return product.images[0];
    }

    if (product.image && typeof product.image === 'string' && product.image.trim() !== '') {
      console.log('✅ Using single image from original:', product.image);
      return product.image;
    }

    if (product.image && product.image.startsWith('data:image')) {
      console.log('✅ Using data URL image');
      return product.image;
    }

    console.log('⚠️ No valid image found for product:', product?.name);
    return '';
  };

  // Helper function to get brand name
  const getBrandName = (product: any): string => {
    const fullData = fullProductData.get(product._id);
    const brandData = fullData?.brand || product.brand;
    
    if (!brandData) return 'Brand';
    
    if (typeof brandData === 'object') {
      return brandData.name || 'Brand';
    }
    
    return brandData || 'Brand';
  };

  // Helper function to get color name
  const getColorName = (color: any): string => {
    if (!color) return '';
    
    if (typeof color === 'object' && color.name) {
      return color.name;
    }
    
    if (typeof color === 'string') {
      return color;
    }
    
    return '';
  };

  // Helper function to get size label
  const getSizeLabel = (size: any): string => {
    if (!size) return '';
    
    if (typeof size === 'object' && size.label) {
      return size.label.toUpperCase();
    }
    
    if (typeof size === 'string') {
      return size.toUpperCase();
    }
    
    return '';
  };

  // Get color hex code
  const getColorHex = (color: any): string | null => {
    if (!color) return null;
    
    if (typeof color === 'object' && color.hexCode) {
      return color.hexCode;
    }
    
    return null;
  };

  const renderItem = ({ item }: { item: FavoriteItem }) => {
    console.log('🎨 Rendering item:', item.productId.name);
    
    const productId = item.productId._id;
    const productData = fullProductData.get(productId) || item.productId;
    
    const imageUrl = getImageUrl(productData);
    const discount = item.productId.discount || item.productId.discountPercent || 0;
    const discountedPrice = discount > 0 
      ? item.productId.price - (item.productId.price * discount / 100)
      : item.productId.price;

    // Get brand, color, and size information
    const brandName = getBrandName(productData);
    
    // Get selected color from favorite item or from product data
    const selectedColor = item.selectedColor || productData.colors?.[0] || null;
    const colorName = getColorName(selectedColor);
    const colorHex = getColorHex(selectedColor);
    
    // Get selected size from favorite item or from product data
    const selectedSize = item.selectedSize || productData.sizes?.[0] || null;
    const sizeLabel = getSizeLabel(selectedSize);

    console.log(`📸 Image URL for ${item.productId.name}:`, imageUrl || 'No image');
    console.log(`🏷️ Brand: ${brandName}, Color: ${colorName}, Size: ${sizeLabel}`);

    return (
      <TouchableOpacity
        style={styles.itemContainer}
        onPress={() => redirectToProductDetails(productId)}
        activeOpacity={0.8}
      >
        <TouchableOpacity
          style={styles.removeIconContainer}
          onPress={() => handleRemoveFavorite(productId)}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Text style={styles.removeIcon}>✕</Text>
        </TouchableOpacity>

        {imageUrl ? (
          <Image 
            source={{ uri: imageUrl }} 
            style={styles.itemImage}
            onError={(e) => {
              console.log(`❌ Image load error for ${item.productId.name}:`, e.nativeEvent);
            }}
            onLoad={() => {
              console.log(`✅ Image loaded successfully for ${item.productId.name}`);
            }}
          />
        ) : (
          <View style={[styles.itemImage, styles.placeholderImage]}>
            <Text style={styles.placeholderText}>No Image</Text>
          </View>
        )}
        
        {/* Brand Name */}
        <Text style={styles.brandText} numberOfLines={1}>
          {brandName}
        </Text>
        
        <Text style={styles.itemName} numberOfLines={2}>
          {item.productId.name}
        </Text>
        
        {/* Color and Size Info */}
        <View style={styles.variantsContainer}>
          {colorName && (
            <View style={styles.variantRow}>
              {colorHex && (
                <View style={[styles.colorDot, { backgroundColor: colorHex }]} />
              )}
              <Text style={styles.variantText}>
                Color: {colorName}
              </Text>
            </View>
          )}
          {sizeLabel && (
            <Text style={styles.variantText}>
              Size: {sizeLabel}
            </Text>
          )}
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
        {discount > 0 && (
          <Text style={styles.discountBadge}>{discount}% OFF</Text>
        )}
      </TouchableOpacity>
    );
  };

  const ListHeaderComponent = () => (
    <Text style={styles.header}>Your Favorites</Text>
  );

  const ListEmptyComponent = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyIcon}>❤️</Text>
      <Text style={styles.emptyTitle}>No Favorites Yet</Text>
      <Text style={styles.emptySubtitle}>
        Start adding items you love to your favorites list
      </Text>
      <TouchableOpacity
        style={styles.shopBtn}
        onPress={() => {
          console.log('🛒 Navigating to Dashboard');
          navigation.navigate('Dashboard' as any);
        }}
      >
        <Text style={styles.shopBtnText}>START SHOPPING</Text>
      </TouchableOpacity>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#151515" />
        <Text style={styles.loadingText}>Loading your favorites...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorIcon}>⚠️</Text>
        <Text style={styles.errorMessage}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={getFavorites}>
          <Text style={styles.retryButtonText}>RETRY</Text>
        </TouchableOpacity>
      </View>
    );
  }

  console.log(`📊 Rendering ${favoriteData.length} favorite items`);

  return (
    <View style={styles.screen}>
      <FlatList
        data={favoriteData}
        renderItem={renderItem}
        keyExtractor={(item) => item._id || item.productId._id}
        numColumns={2}
        columnWrapperStyle={styles.row}
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
        onEndReached={() => {
          console.log('📜 Reached end of list');
        }}
        onViewableItemsChanged={({ viewableItems }) => {
          console.log(`👁️ Viewable items: ${viewableItems.length}`);
        }}
      />
    </View>
  );
};

export default FavoriteScreen;

const styles = StyleSheet.create({
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
  header: {
    fontSize: 24,
    fontWeight: '700',
    marginVertical: 16,
    textAlign: 'center',
    color: '#151515',
  },
  row: {
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  itemContainer: {
    width: '48%',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 3,
    position: 'relative',
  },
  itemImage: {
    width: '100%',
    height: 140,
    borderRadius: 8,
    resizeMode: 'contain',
    marginBottom: 8,
    backgroundColor: '#f5f5f5',
  },
  placeholderImage: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
  },
  placeholderText: {
    color: '#999',
    fontSize: 14,
    fontWeight: '500',
  },
  brandText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#D4A017',
    textTransform: 'uppercase',
    marginBottom: 2,
    width: '100%',
    textAlign: 'center',
  },
  itemName: {
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
    marginVertical: 2,
    color: '#151515',
    width: '100%',
  },
  variantsContainer: {
    width: '100%',
    marginVertical: 2,
    alignItems: 'center',
  },
  variantRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  colorDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 4,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  variantText: {
    fontSize: 11,
    color: '#666',
    textAlign: 'center',
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    flexWrap: 'wrap',
    marginTop: 2,
  },
  itemPrice: {
    fontSize: 15,
    color: '#151515',
    fontWeight: '700',
  },
  originalPrice: {
    fontSize: 12,
    color: '#999',
    textDecorationLine: 'line-through',
    marginLeft: 6,
  },
  discountBadge: {
    fontSize: 11,
    color: '#27ae60',
    fontWeight: '600',
    marginTop: 2,
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
  errorIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  errorMessage: {
    color: '#e74c3c',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: '#151515',
    paddingHorizontal: 30,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  removeIconContainer: {
    position: 'absolute',
    top: 8,
    right: 8,
    zIndex: 10,
    backgroundColor: 'rgba(255,255,255,0.95)',
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 2,
    shadowOffset: { width: 0, height: 1 },
    elevation: 2,
  },
  removeIcon: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#151515',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#151515',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#888',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
  },
  shopBtn: {
    backgroundColor: '#151515',
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
});

// export default FavoriteScreen;