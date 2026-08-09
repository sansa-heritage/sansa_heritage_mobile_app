import React, { useEffect, useState } from 'react';
import {
  ScrollView,
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  Modal,
  FlatList,
  Dimensions,
} from 'react-native';
import FontAwesome from "react-native-vector-icons/FontAwesome";
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import config from '../../config/config';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { addToFavoritesList } from '../../api/favoriteApi';
import { getAddresses } from '../../api/profileApi';
import { RootStackParamList } from '../../models/types';
import eventBus from '../../services/eventBus';
import Ionicons from "react-native-vector-icons/Ionicons";
import { Address } from '../../models/address';
import Rating from '../../components/common/RatingStars';
import { Toast } from '../../components/common/Toast';

const { width, height } = Dimensions.get('window');

// Updated interface to handle nested objects
interface ProductDetails {
  _id: string;
  image: string;
  images?: string[];
  name: string;
  description: string;
  price: number;
  discount: number;
  discountPercent?: number;
  availableColors: any[];
  avaialbleSizes: any[];
  details: any[];
  brand: any;
  rating: number;
  colors?: any[];
  sizes?: any[];
}

type ProductDetailsRouteProp = RouteProp<RootStackParamList, 'ProductDetails'>;
type ProductDetailsNavigationProp = StackNavigationProp<RootStackParamList, 'ProductDetails'>;

const ProductPage = () => {
  // State
  const [selectedColor, setSelectedColor] = useState<any>(null);
  const [selectedSize, setSelectedSize] = useState<any>(null);
  const [productDetails, setProductDetails] = useState<ProductDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [selectedAddress, setSelectedAddress] = useState<Address | null>(null);
  const [isAddressLoading, setIsAddressLoading] = useState(false);

  // Navigation & Route with proper typing
  const route = useRoute<ProductDetailsRouteProp>();
  const navigation = useNavigation<ProductDetailsNavigationProp>();
  const { itemId } = route.params;

  // Fetch Product Details
  useEffect(() => {
    const fetchProductDetails = async () => {
      try {
        const storedToken = await AsyncStorage.getItem('authToken');
        const storedUserId = await AsyncStorage.getItem('userID');

        if (storedToken) setToken(storedToken);
        if (storedUserId) setUserId(storedUserId);

        setLoading(true);
        setError(null);

        const response = await fetch(`${config.baseURL}api/products/${itemId}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            Authorization: storedToken ? `Bearer ${storedToken}` : '',
          },
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        console.log('Product Data:', data);

        // Set product details with fallback values
        setProductDetails({
          ...data,
          colors: data.colors || data.availableColors || [],
          sizes: data.sizes || data.avaialbleSizes || [],
          availableColors: data.availableColors || data.colors || [],
          avaialbleSizes: data.avaialbleSizes || data.sizes || [],
          details: data.details || [],
          image: data.image || (data.images && data.images.length > 0 ? data.images[0] : ''),
          images: data.images || [],
          rating: data.rating || 0,
          discount: data.discount || data.discountPercent || 0,
          brand: data.brand || { name: 'Brand' },
        });

        if (storedToken) {
          try {
            const addr = await getAddresses();
            setAddresses(addr || []);
            if (addr && addr.length > 0) {
              setSelectedAddress(addr[0]);
            }
          } catch (addrErr) {
            console.log('Error fetching addresses:', addrErr);
          }
        }

      } catch (err) {
        console.error('Error fetching product:', err);
        setError('Failed to load product details. Please try again.');
        Toast.show('error', 'Failed to load product details');
      } finally {
        setLoading(false);
      }
    };

    fetchProductDetails();
  }, [itemId]);

  // Handle Add to Cart
  const handleAddToCart = async () => {
    if (isAddingToCart) return;

    if (!token || !userId) {
      Alert.alert(
        'Login Required',
        'Please login to add products to cart.',
        [
          { text: 'Cancel', style: 'cancel' },
          { 
            text: 'Login', 
            onPress: () => navigation.navigate('Login' as any)
          }
        ]
      );
      return;
    }

    setIsAddingToCart(true);
    setError(null);

    try {
      const response = await fetch(`${config.baseURL}api/cart/add-to-cart`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          userId,
          productId: itemId,
          color: selectedColor?.name || selectedColor,
          size: selectedSize?.label || selectedSize,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      await response.json();
      Toast.show('success', 'Product added to cart successfully!');
      eventBus.emit('ITEM_REMOVED', { id: 123 });

      setTimeout(() => {
        navigation.navigate('CartPage' as any);
      }, 500);

      if (selectedAddress) {
        await AsyncStorage.setItem('selectedAddress', JSON.stringify(selectedAddress));
      }

    } catch (err: any) {
      console.error('Error adding to cart:', err);
      setError(err.message || 'Failed to add product to cart. Please try again.');
      Toast.show('error', err.message || 'Failed to add to cart');
    } finally {
      setIsAddingToCart(false);
    }
  };

  // Add to Favorites
  const handleAddToFavorites = async () => {
    if (!token) {
      Alert.alert(
        'Login Required',
        'Please login to add products to favorites.',
        [
          { text: 'Cancel', style: 'cancel' },
          { 
            text: 'Login', 
            onPress: () => navigation.navigate('Login' as any)
          }
        ]
      );
      return;
    }

    try {
      await addToFavoritesList(productDetails?._id);
      Toast.show('success', 'Added to favorites!');
      eventBus.emit('ITEM_REMOVED', { id: 123 });
    } catch (err) {
      console.error('Error adding to favorites:', err);
      Toast.show('error', 'Failed to add to favorites');
    }
  };

  // Open Address Popup
  const openAddressPopup = async () => {
    setModalVisible(true);
    setIsAddressLoading(true);

    try {
      const result = await getAddresses();
      setAddresses(result || []);
    } catch (err) {
      console.log('Error fetching addresses:', err);
      Toast.show('error', 'Failed to load addresses');
    } finally {
      setIsAddressLoading(false);
    }
  };

  // Select Address
  const handleSelectAddress = (address: Address) => {
    setSelectedAddress(address);
    setModalVisible(false);
    Toast.show('success', 'Address selected');
  };

  // Render Detail Item
  const renderDetailItem = (detail: any, index: number) => {
    if (typeof detail === 'string') {
      return (
        <View key={index} style={styles.detailItem}>
          <Text style={styles.detailValue}>• {detail}</Text>
        </View>
      );
    }

    if (typeof detail === 'object' && detail !== null) {
      let displayText = '';
      
      if (detail.name) displayText = detail.name;
      else if (detail.title) displayText = detail.title;
      else if (detail.value) displayText = detail.value;
      else if (detail.label) displayText = detail.label;
      else if (detail.description) displayText = detail.description;
      else if (detail.slug) displayText = detail.slug;
      else displayText = `Item ${index + 1}`;

      return (
        <View key={detail._id || index} style={styles.detailItem}>
          <Text style={styles.detailValue}>• {displayText}</Text>
        </View>
      );
    }

    return (
      <View key={index} style={styles.detailItem}>
        <Text style={styles.detailValue}>• {String(detail)}</Text>
      </View>
    );
  };

  // Render Color Item
  const renderColorItem = (color: any, index: number) => {
    const colorName = color?.name || color?.color || 'Color';
    const hexCode = color?.hexCode || color?.hex || '#ccc';
    const isSelected = selectedColor?.name === colorName || selectedColor === colorName;

    return (
      <TouchableOpacity
        key={color._id || index}
        style={[
          styles.colorCircle,
          { backgroundColor: hexCode },
          isSelected && styles.selectedColorCircle
        ]}
        onPress={() => setSelectedColor(color)}
        activeOpacity={0.7}
      />
    );
  };

  // Render Size Item
  const renderSizeItem = (size: any, index: number) => {
    const sizeLabel = size?.label || size?.name || size || 'S';
    const isSelected = selectedSize === size._id || selectedSize === sizeLabel;

    return (
      <TouchableOpacity
        key={size._id || index}
        style={[
          styles.sizeChip,
          isSelected && styles.sizeChipSelected
        ]}
        onPress={() => setSelectedSize(size)}
        activeOpacity={0.7}
      >
        <Text
          style={[
            styles.sizeChipText,
            isSelected && styles.sizeChipTextSelected
          ]}
        >
          {sizeLabel.toUpperCase()}
        </Text>
      </TouchableOpacity>
    );
  };

  // Loading State
  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#151515" />
        <Text style={styles.loadingText}>Loading product...</Text>
      </View>
    );
  }

  // Error State
  if (error || !productDetails) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>{error || 'Product not found'}</Text>
        <TouchableOpacity
          style={styles.retryButton}
          onPress={() => {
            setError(null);
            setLoading(true);
            const refetch = async () => {
              try {
                const storedToken = await AsyncStorage.getItem('authToken');
                const response = await fetch(`${config.baseURL}api/products/${itemId}`, {
                  headers: {
                    'Content-Type': 'application/json',
                    Authorization: storedToken ? `Bearer ${storedToken}` : '',
                  },
                });
                if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
                const data = await response.json();
                setProductDetails({
                  ...data,
                  colors: data.colors || data.availableColors || [],
                  sizes: data.sizes || data.avaialbleSizes || [],
                  availableColors: data.availableColors || data.colors || [],
                  avaialbleSizes: data.avaialbleSizes || data.sizes || [],
                  details: data.details || [],
                  image: data.image || (data.images && data.images.length > 0 ? data.images[0] : ''),
                  images: data.images || [],
                  rating: data.rating || 0,
                  discount: data.discount || data.discountPercent || 0,
                  brand: data.brand || { name: 'Brand' },
                });
              } catch (e) {
                setError('Failed to load product details');
              } finally {
                setLoading(false);
              }
            };
            refetch();
          }}
        >
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Calculate Discounted Price
  const discountPercent = productDetails.discount || productDetails.discountPercent || 0;
  const discountedPrice = productDetails.price - (productDetails.price * discountPercent / 100);

  // Get display values
  const brandName = typeof productDetails.brand === 'object' 
    ? productDetails.brand?.name || 'Brand' 
    : productDetails.brand || 'Brand';

  const colorList = productDetails.colors || productDetails.availableColors || [];
  const sizeList = productDetails.sizes || productDetails.avaialbleSizes || [];

  return (
    <ScrollView
      contentContainerStyle={styles.scrollContainer}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.container}>
        {/* Image & Favorite */}
        <View style={styles.imageContainer}>
          {productDetails.image ? (
            <Image
              source={{ uri: productDetails.image }}
              style={styles.image}
              resizeMode="contain"
            />
          ) : (
            <View style={styles.placeholderImage}>
              <FontAwesome name="image" size={80} color="#ccc" />
            </View>
          )}
          <View style={styles.header}>
            <TouchableOpacity
              style={styles.favoriteButton}
              onPress={handleAddToFavorites}
              activeOpacity={0.7}
            >
              <FontAwesome name="heart-o" size={24} color="#151515" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Product Info */}
        <View style={styles.BottomContainer}>
          <View style={styles.itemDetailsContainer}>
            <Text style={styles.brandText}>{brandName}</Text>
          </View>

          <Text style={styles.productName}>{productDetails?.name}</Text>

          <View style={styles.ratingSection}>
            {productDetails.rating !== undefined && <Rating value={productDetails.rating} />}
          </View>

          <View style={styles.priceBlock}>
            <Text style={styles.mainPrice}>₹{discountedPrice.toFixed(0)}</Text>

            <View style={{ flexDirection: "row", alignItems: "center", marginTop: 5 }}>
              <Text style={styles.mrpText}>MRP </Text>
              <Text style={styles.mrpStrike}>₹{productDetails.price}</Text>
              {discountPercent > 0 &&
                <Text style={styles.discountText}> ({discountPercent}% OFF)</Text>}
            </View>

            <Text style={styles.taxIncluded}>Price inclusive of all taxes</Text>
          </View>

          {/* Colors */}
          <Text style={styles.colorTitle}>
            {selectedColor ? `Selected: ${selectedColor.name || selectedColor}` : 'Select Color'}
          </Text>
          <View style={styles.colorRow}>
            {colorList.length > 0 ? (
              colorList.map((color, index) => renderColorItem(color, index))
            ) : (
              <Text style={styles.noOptionsText}>No colors available</Text>
            )}
          </View>

          {/* Sizes */}
          <Text style={styles.sizeTitle}>
            {selectedSize ? `Selected: ${selectedSize.label || selectedSize}` : 'Select Size'}
          </Text>
          <View style={styles.sizeRow}>
            {sizeList.length > 0 ? (
              sizeList.map((size, index) => renderSizeItem(size, index))
            ) : (
              <Text style={styles.noOptionsText}>No sizes available</Text>
            )}
          </View>

          {/* Delivery & Return Details */}
          <View style={styles.policyContainer}>
            <Text style={styles.policyTitle}>Delivery & Return Details</Text>

            {addresses.length > 0 && (
              <TouchableOpacity
                style={styles.locationRow}
                onPress={openAddressPopup}
                activeOpacity={0.7}
              >
                <Ionicons name="location-outline" size={20} color="#555" />
                <Text style={styles.locationText} numberOfLines={1}>
                  {selectedAddress
                    ? `${selectedAddress.street}, ${selectedAddress.city}, ${selectedAddress.zipCode}`
                    : `${addresses[0]?.street || ''}, ${addresses[0]?.city || ''}, ${addresses[0]?.zipCode || ''}`}
                </Text>
                <Text style={styles.changeText}>Change</Text>
              </TouchableOpacity>
            )}

            <View style={styles.itemRow}>
              <FontAwesome name="refresh" size={20} color="#4CAF50" />
              <View style={styles.rowText}>
                <Text style={styles.boldText}>7 day Return and Exchange</Text>
                <Text style={styles.linkText}>Return Policies</Text>
              </View>
            </View>

            <View style={styles.itemRow}>
              <FontAwesome name="money" size={20} color="#4CAF50" />
              <Text style={styles.boldText}>
                Check COD availability at checkout
              </Text>
            </View>
          </View>

          {/* Product Details */}
          <View style={styles.detailsContainer}>
            <Text style={styles.sectionTitle}>Product Details</Text>
            <View style={styles.detailsGrid}>
              {productDetails.details && productDetails.details.length > 0 ? (
                productDetails.details.map((detail, index) => renderDetailItem(detail, index))
              ) : (
                <Text style={styles.noOptionsText}>No details available</Text>
              )}
            </View>
          </View>
        </View>

        {/* Add to Cart Button */}
        <TouchableOpacity
          style={[
            styles.addToCartButton,
            isAddingToCart && styles.addToCartButtonDisabled
          ]}
          onPress={handleAddToCart}
          disabled={isAddingToCart}
          activeOpacity={0.8}
        >
          <Text style={styles.addToCartButtonText}>
            {isAddingToCart ? 'Adding...' : 'Add to Cart'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Address Modal */}
      <Modal visible={modalVisible} transparent animationType="slide">
        <View style={styles.modalContainer}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>Select Address</Text>

            {isAddressLoading ? (
              <ActivityIndicator size="large" color="#151515" />
            ) : addresses.length > 0 ? (
              <FlatList
                data={addresses}
                keyExtractor={(item) => item._id?.toString() || Math.random().toString()}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={[
                      styles.addressBox,
                      selectedAddress?._id === item._id && styles.selectedBox,
                    ]}
                    onPress={() => handleSelectAddress(item)}
                    activeOpacity={0.7}
                  >
                    <View style={styles.row}>
                      <View style={styles.radioAndTitle}>
                        <Ionicons
                          name={
                            selectedAddress?._id === item._id
                              ? "checkmark-circle"
                              : "ellipse-outline"
                          }
                          size={24}
                          color={
                            selectedAddress?._id === item._id ? "#151515" : "#888"
                          }
                        />
                        <Text style={styles.addressTitle}>{item.street}</Text>
                      </View>
                    </View>

                    <Text style={styles.addressInfo}>{item.city}, {item.state}</Text>
                    <Text style={styles.addressInfo}>{item.country} - {item.zipCode}</Text>
                  </TouchableOpacity>
                )}
              />
            ) : (
              <View style={styles.noAddressContainer}>
                <Text style={styles.noAddressText}>No addresses found</Text>
                <TouchableOpacity
                  style={styles.addAddressButton}
                  onPress={() => {
                    setModalVisible(false);
                    navigation.navigate('AddressFormPage' as any);
                  }}
                >
                  <Text style={styles.addAddressButtonText}>Add New Address</Text>
                </TouchableOpacity>
              </View>
            )}

            <TouchableOpacity
              style={styles.closeBtn}
              onPress={() => setModalVisible(false)}
              activeOpacity={0.7}
            >
              <Text style={styles.closeBtnText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
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
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#fff',
  },
  errorText: {
    fontSize: 16,
    color: '#e74c3c',
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
  scrollContainer: {
    flexGrow: 1,
    backgroundColor: '#f8f8f8',
    paddingBottom: 20,
  },
  container: {
    flex: 1,
    padding: 16,
  },
  imageContainer: {
    position: 'relative',
    backgroundColor: '#fff',
    borderRadius: 12,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  image: {
    width: '100%',
    height: 350,
    resizeMode: 'contain',
  },
  placeholderImage: {
    width: '100%',
    height: 350,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  header: {
    position: 'absolute',
    top: 10,
    right: 10,
  },
  favoriteButton: {
    backgroundColor: 'rgba(255,255,255,0.9)',
    borderRadius: 20,
    padding: 10,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  BottomContainer: {
    backgroundColor: '#fff',
    marginTop: -20,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 20,
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  itemDetailsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  brandText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#D4A017',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  productName: {
    fontSize: 20,
    fontWeight: '600',
    color: '#000',
    marginBottom: 6,
  },
  ratingSection: {
    marginBottom: 8,
  },
  priceBlock: {
    marginBottom: 12,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  mainPrice: {
    fontSize: 26,
    fontWeight: '700',
    color: '#000',
  },
  mrpText: {
    fontSize: 14,
    color: '#666',
  },
  mrpStrike: {
    fontSize: 14,
    color: '#999',
    textDecorationLine: 'line-through',
    marginHorizontal: 4,
  },
  discountText: {
    fontSize: 14,
    color: '#27ae60',
    fontWeight: '600',
  },
  taxIncluded: {
    fontSize: 12,
    color: '#888',
    marginTop: 4,
  },
  colorTitle: {
    fontSize: 15,
    fontWeight: '600',
    marginTop: 12,
    marginBottom: 8,
  },
  colorRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    marginBottom: 8,
  },
  colorCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    marginRight: 12,
    borderWidth: 2,
    borderColor: '#e0e0e0',
  },
  selectedColorCircle: {
    borderColor: '#151515',
    borderWidth: 3,
  },
  sizeTitle: {
    fontSize: 15,
    fontWeight: '600',
    marginTop: 12,
    marginBottom: 8,
  },
  sizeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 12,
  },
  sizeChip: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: '#f5f5f5',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    marginRight: 10,
    marginBottom: 10,
  },
  sizeChipSelected: {
    backgroundColor: '#151515',
    borderColor: '#151515',
  },
  sizeChipText: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
  sizeChipTextSelected: {
    color: '#fff',
  },
  noOptionsText: {
    fontSize: 14,
    color: '#999',
    paddingVertical: 8,
  },
  policyContainer: {
    backgroundColor: '#fff',
    paddingVertical: 12,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#f0f0f0',
    marginVertical: 12,
  },
  policyTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 12,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  locationText: {
    flex: 1,
    fontSize: 14,
    color: '#333',
    marginLeft: 8,
  },
  changeText: {
    color: '#151515',
    fontWeight: '600',
    fontSize: 14,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  rowText: {
    marginLeft: 10,
    flex: 1,
  },
  boldText: {
    fontSize: 14,
    color: '#000',
    fontWeight: '500',
  },
  linkText: {
    fontSize: 13,
    color: '#1e88e5',
    marginTop: 2,
  },
  detailsContainer: {
    marginTop: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 8,
  },
  detailsGrid: {
    flexDirection: 'column',
  },
  detailItem: {
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  detailValue: {
    fontSize: 14,
    color: '#444',
    lineHeight: 20,
  },
  addToCartButton: {
    backgroundColor: '#151515',
    borderRadius: 30,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 16,
  },
  addToCartButtonDisabled: {
    backgroundColor: '#888',
  },
  addToCartButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    padding: 20,
  },
  modalBox: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    maxHeight: '80%',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 16,
    textAlign: 'center',
  },
  addressBox: {
    padding: 14,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    marginBottom: 10,
  },
  selectedBox: {
    borderColor: '#151515',
    backgroundColor: '#f5f5f5',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  radioAndTitle: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  addressTitle: {
    marginLeft: 10,
    fontSize: 15,
    fontWeight: '600',
    color: '#000',
  },
  addressInfo: {
    color: '#666',
    fontSize: 13,
    marginTop: 2,
    marginLeft: 34,
  },
  closeBtn: {
    marginTop: 16,
    backgroundColor: '#151515',
    padding: 14,
    borderRadius: 10,
  },
  closeBtnText: {
    textAlign: 'center',
    color: '#fff',
    fontWeight: '600',
    fontSize: 15,
  },
  noAddressContainer: {
    alignItems: 'center',
    padding: 20,
  },
  noAddressText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
  },
  addAddressButton: {
    backgroundColor: '#151515',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  addAddressButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
});

export default ProductPage;