import React, { useEffect, useState, useRef } from "react";
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
  SafeAreaView,
  Share,
} from "react-native";
import FontAwesome from "react-native-vector-icons/FontAwesome";
import Ionicons from "react-native-vector-icons/Ionicons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";

import config from "../../config/config";
import { RootStackParamList } from "../../models/types";
import { addToFavoritesList } from "../../api/favoriteApi";
import { getAddresses } from "../../api/profileApi";
import { Address } from "../../models/address";
import Rating from "../../components/common/RatingStars";
import eventBus from "../../services/eventBus";
import { Toast } from "../../components/common/Toast";
import LoadingService from "../../services/LoadingService";

const { width } = Dimensions.get("window");

interface ProductDetails {
  _id: number;
  image?: string;
  images?: string[];
  name: string;
  brand: string;
  price: number;
  discountPercent: number;
  colors: any[];
  sizes: any[];
  details: string[];
  description?: string;
  rating: number;
  reviews?: number;
  sizeGuide?: string[];
  chest?: number;
  shoulder?: number;
  waist?: number;
  length?: number;
  stock?: number;
}

type RouteProps = RouteProp<RootStackParamList, "ProductDetails">;

const ProductPage = () => {
  const navigation = useNavigation<StackNavigationProp<any>>();
  const route = useRoute<RouteProps>();
  const { itemId } = route.params;

  const [productDetails, setProductDetails] = useState<ProductDetails | null>(null);
  const [selectedColor, setSelectedColor] = useState<any | null>(null);
  const [selectedSize, setSelectedSize] = useState<any | null>(null);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [selectedAddress, setSelectedAddress] = useState<Address | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [quantity, setQuantity] = useState<number>(1);

  const [activeIndex, setActiveIndex] = useState(0);
  const [zoomVisible, setZoomVisible] = useState(false);
  const [zoomImage, setZoomImage] = useState<string | null>(null);
  const flatListRef = useRef<FlatList>(null);

  // ✅ Address Modal State
  const [addressModalVisible, setAddressModalVisible] = useState(false);
  
  // ✅ Size Guide Modal State
  const [sizeGuideVisible, setSizeGuideVisible] = useState(false);
  const [sizeGuideData, setSizeGuideData] = useState<any[]>([]);
  // ✅ Track which columns have data
  const [activeColumns, setActiveColumns] = useState<string[]>([]);

  // Validation functions
  const validateColorSelection = (): { valid: boolean; message: string } => {
    if (!productDetails?.colors || productDetails.colors.length === 0) {
      return { valid: true, message: '' };
    }
    if (!selectedColor) {
      return { valid: false, message: 'Please select a color' };
    }
    return { valid: true, message: '' };
  };

  const validateSizeSelection = (): { valid: boolean; message: string } => {
    if (!productDetails?.sizes || productDetails.sizes.length === 0) {
      return { valid: true, message: '' };
    }
    if (!selectedSize) {
      return { valid: false, message: 'Please select a size' };
    }
    return { valid: true, message: '' };
  };

  const validateQuantity = (): { valid: boolean; message: string } => {
    if (quantity < 1) {
      return { valid: false, message: 'Minimum quantity is 1' };
    }
    let maxStock = productDetails?.stock || 10;
    if (selectedSize && typeof selectedSize === 'object' && selectedSize.stock) {
      maxStock = selectedSize.stock;
    }
    if (quantity > maxStock) {
      return { valid: false, message: `Only ${maxStock} items available in stock` };
    }
    return { valid: true, message: '' };
  };

  const validateSelections = (): { valid: boolean; errors: string[] } => {
    const errors: string[] = [];
    const colorValidation = validateColorSelection();
    if (!colorValidation.valid) errors.push(colorValidation.message);
    const sizeValidation = validateSizeSelection();
    if (!sizeValidation.valid) errors.push(sizeValidation.message);
    const quantityValidation = validateQuantity();
    if (!quantityValidation.valid) errors.push(quantityValidation.message);
    return { valid: errors.length === 0, errors };
  };

  const requiresColor = (): boolean => {
    return productDetails?.colors && productDetails.colors.length > 0;
  };

  const requiresSize = (): boolean => {
    return productDetails?.sizes && productDetails.sizes.length > 0;
  };

  const getSelectedColorId = (): string | null => {
    if (!selectedColor) return null;
    if (typeof selectedColor === 'object') {
      return selectedColor._id || selectedColor.name || null;
    }
    return selectedColor;
  };

  const getSelectedSizeId = (): string | null => {
    if (!selectedSize) return null;
    if (typeof selectedSize === 'object') {
      return selectedSize._id || selectedSize.label || null;
    }
    return selectedSize;
  };

  const getAvailableStock = (): number => {
    if (selectedSize && typeof selectedSize === 'object' && selectedSize.stock) {
      return selectedSize.stock;
    }
    return productDetails?.stock || 10;
  };

  // Share function
  const handleShare = async () => {
    try {
      const shareOptions = {
        message: `Check out ${productDetails?.name} on Sansa Heritage!`,
        url: productImages[0] || '',
      };
      const result = await Share.share(shareOptions);
      if (result.action === Share.sharedAction) {
        console.log('Shared successfully');
      }
    } catch (error) {
      console.error('Share error:', error);
    }
  };

  // ✅ Size Guide function - Shows modal with table
  const showSizeGuide = () => {
    if (!productDetails?.sizes || productDetails.sizes.length === 0) {
      Alert.alert('Size Guide', 'No size information available.', [{ text: 'OK' }]);
      return;
    }

    // Prepare size guide data with measurements
    const data = productDetails.sizes.map((s: any) => {
      // Get measurements from size object or product level
      const chest = s.chest || productDetails.chest || null;
      const shoulder = s.shoulder || productDetails.shoulder || null;
      const waist = s.waist || productDetails.waist || null;
      const length = s.length || productDetails.length || null;

      return {
        size: s.label ? s.label.toUpperCase() : s.name?.toUpperCase() || 'N/A',
        chest: chest,
        shoulder: shoulder,
        waist: waist,
        length: length,
      };
    });

    // Determine which columns have data
    const columns: string[] = ['Size'];
    if (data.some((d: any) => d.chest !== null && d.chest !== undefined && d.chest !== '-')) {
      columns.push('Chest');
    }
    if (data.some((d: any) => d.shoulder !== null && d.shoulder !== undefined && d.shoulder !== '-')) {
      columns.push('Shoulder');
    }
    if (data.some((d: any) => d.waist !== null && d.waist !== undefined && d.waist !== '-')) {
      columns.push('Waist');
    }
    if (data.some((d: any) => d.length !== null && d.length !== undefined && d.length !== '-')) {
      columns.push('Length');
    }

    setActiveColumns(columns);
    setSizeGuideData(data);
    setSizeGuideVisible(true);
  };

  // ✅ Select address from modal
  const selectAddress = async (address: Address) => {
    setSelectedAddress(address);
    await AsyncStorage.setItem("selectedAddress", JSON.stringify(address));
    setAddressModalVisible(false);
    Toast.show('success', 'Address selected');
  };

  // ✅ Navigate to Address Screen
  const navigateToAddressScreen = () => {
    setAddressModalVisible(false);
    navigation.navigate('AddressScreen');
  };

  useEffect(() => {
    const init = async () => {
      try {
        LoadingService.show();
        const storedToken = await AsyncStorage.getItem('authToken');
        const storedUserId = await AsyncStorage.getItem('userID');
        if (storedToken) setToken(storedToken);
        if (storedUserId) setUserId(storedUserId);

        const res = await fetch(
          `${config.baseURL}api/products/${itemId}`,
          { headers: { Authorization: `Bearer ${storedToken}` } }
        );
        const data = await res.json();
        setProductDetails(data);
        console.log("Data-----", data)

        if (data.colors && data.colors.length > 0) {
          setSelectedColor(data.colors[0]);
        }
        if (data.sizes && data.sizes.length > 0) {
          setSelectedSize(data.sizes[0]);
        }

        const addr = await getAddresses();
        setAddresses(addr);
        
        const saved = await AsyncStorage.getItem('selectedAddress');
        if (saved) {
          const parsed = JSON.parse(saved);
          setSelectedAddress(parsed);
        } else if (addr && addr.length > 0) {
          const defaultAddr = addr.find((a: Address) => a.isDefault) || addr[0];
          setSelectedAddress(defaultAddr);
          await AsyncStorage.setItem("selectedAddress", JSON.stringify(defaultAddr));
        }
      } catch (e) {
        console.log(e);
      } finally {
        LoadingService.hide();
        setLoading(false);
      }
    };
    init();
  }, [itemId]);

  // ✅ Refresh addresses when coming back from AddressScreen
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', async () => {
      try {
        const addr = await getAddresses();
        setAddresses(addr);
        if (addr && addr.length > 0) {
          const saved = await AsyncStorage.getItem('selectedAddress');
          if (saved) {
            const parsed = JSON.parse(saved);
            setSelectedAddress(parsed);
          } else {
            const defaultAddr = addr.find((a: Address) => a.isDefault) || addr[0];
            setSelectedAddress(defaultAddr);
            await AsyncStorage.setItem("selectedAddress", JSON.stringify(defaultAddr));
          }
        }
      } catch (e) {
        console.log('Error refreshing addresses:', e);
      }
    });
    return unsubscribe;
  }, [navigation]);

  if (loading || !productDetails) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color="#96252A" />
      </View>
    );
  }

  const productImages =
    productDetails.images && productDetails.images.length > 0
      ? productDetails.images
      : productDetails.image
      ? [productDetails.image]
      : [];

  const finalPrice =
    productDetails.price -
    (productDetails.price * productDetails.discountPercent) / 100;

  const handleAddToCart = async () => {
    const validation = validateSelections();
    if (!validation.valid) {
      Alert.alert('Selection Required', validation.errors.join('\n\n'), [{ text: 'OK' }]);
      return;
    }
    if (!token || !userId) {
      Alert.alert('Error', 'Please login to add items to cart');
      return;
    }

    LoadingService.show();
    try {
      const colorId = getSelectedColorId();
      const sizeId = getSelectedSizeId();

      const response = await fetch(`${config.baseURL}api/cart/add-to-cart`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          userId,
          productId: itemId,
          quantity: quantity,
          color: colorId,
          size: sizeId,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      Toast.show('success', 'Product added to cart successfully!');
      eventBus.emit("ITEM_REMOVED", { id: 123 });
      if (selectedAddress) {
        await AsyncStorage.setItem("selectedAddress", JSON.stringify(selectedAddress));
      }
      navigation.navigate('CartPage');
    } catch (err: any) {
      console.error('Add to cart error:', err);
      Alert.alert('Error', err.message || 'Failed to add product to cart.');
    } finally {
      LoadingService.hide();
    }
  };

  const handleBuyNow = () => {
    const validation = validateSelections();
    if (!validation.valid) {
      Alert.alert('Selection Required', validation.errors.join('\n\n'), [{ text: 'OK' }]);
      return;
    }
    if (!selectedAddress) {
      Alert.alert(
        'Address Required',
        'Please add a delivery address before proceeding to checkout',
        [
          { text: 'OK' },
          { text: 'Add Address', onPress: () => navigateToAddressScreen() },
        ]
      );
      return;
    }

    const checkoutData = {
      productId: itemId,
      productName: productDetails.name,
      price: finalPrice,
      quantity: quantity,
      color: getSelectedColorId(),
      size: getSelectedSizeId(),
      colorName: selectedColor?.name || 'N/A',
      sizeLabel: selectedSize?.label || 'N/A',
      image: productImages[0] || '',
      deliveryAddress: selectedAddress,
      totalAmount: finalPrice * quantity,
    };

    navigation.navigate("CheckoutPage", {
      billingDetails: checkoutData,
      fromProductPage: true,
    });
  };

  const scrollToIndex = (index: number) => {
    if (flatListRef.current) {
      flatListRef.current.scrollToIndex({ index, animated: true });
    }
  };

  const renderThumbnail = ({ item, index }: { item: string; index: number }) => (
    <TouchableOpacity
      style={[styles.thumbnailItem, activeIndex === index && styles.thumbnailActive]}
      onPress={() => scrollToIndex(index)}
    >
      <Image source={{ uri: item }} style={styles.thumbnailImage} />
    </TouchableOpacity>
  );

  // Get color name - dynamic
  const getColorName = (color: any): string => {
    if (!color) return '';
    if (typeof color === 'object') {
      return color.name || color.label || '';
    }
    return String(color);
  };

  // Get color hex - dynamic
  const getColorHex = (color: any): string => {
    if (!color) return '#ccc';
    if (typeof color === 'object') {
      return color.hexCode || color.hex || color.colorCode || '#ccc';
    }
    return '#ccc';
  };

  // ✅ Render table cell based on column
  const renderTableCell = (item: any, column: string) => {
    if (column === 'Size') {
      return <Text style={styles.tableSizeText}>{item.size}</Text>;
    }
    const value = item[column.toLowerCase()];
    if (value !== null && value !== undefined && value !== '-') {
      return <Text style={styles.tableCellText}>{value}"</Text>;
    }
    return <Text style={styles.tableCellText}>-</Text>;
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* IMAGE SLIDER */}
        <View style={styles.imageWrapper}>
          <FlatList
            ref={flatListRef}
            data={productImages}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            keyExtractor={(_, i) => i.toString()}
            onScroll={(e) => {
              const index = Math.round(e.nativeEvent.contentOffset.x / width);
              setActiveIndex(index);
            }}
            renderItem={({ item }) => (
              <TouchableOpacity
                activeOpacity={0.9}
                onPress={() => {
                  setZoomImage(item);
                  setZoomVisible(true);
                }}
              >
                <Image source={{ uri: item }} style={styles.image} />
              </TouchableOpacity>
            )}
            getItemLayout={(data, index) => ({
              length: width,
              offset: width * index,
              index,
            })}
          />

          {productImages.length > 1 && (
            <View style={styles.dotContainer}>
              {productImages.map((_, i) => (
                <View key={i} style={[styles.dot, activeIndex === i && styles.activeDot]} />
              ))}
            </View>
          )}

          {/* Share Button */}
          <TouchableOpacity style={styles.shareBtn} onPress={handleShare}>
            <Ionicons name="share-social-outline" size={22} color="#000" />
          </TouchableOpacity>

          {/* Discount Badge - Dynamic */}
         
        </View>

        {/* Thumbnail Images */}
        {productImages.length > 1 && (
          <View style={styles.thumbnailContainer}>
            <FlatList
              data={productImages}
              horizontal
              showsHorizontalScrollIndicator={false}
              keyExtractor={(_, i) => i.toString()}
              renderItem={renderThumbnail}
              contentContainerStyle={styles.thumbnailList}
            />
          </View>
        )}

        {/* PRODUCT INFO - All Dynamic */}
        <View style={styles.card}>
          <Text style={styles.title}>{productDetails.name}</Text>

          <View style={styles.ratingRow}>
            <Rating value={productDetails.rating || 0} />
            <Text style={styles.ratingText}>{productDetails.rating || 0}</Text>
            <Text style={styles.reviewText}>({productDetails.reviews || 0} reviews)</Text>
          </View>

          <View style={styles.priceRow}>
            <Text style={styles.finalPrice}>₹{finalPrice.toFixed(0)}</Text>
            <Text style={styles.mrp}>₹{productDetails.price}</Text>
            <View style={styles.offBadge}>
              <Text style={styles.offText}>{productDetails.discountPercent}% OFF</Text>
            </View>
          </View>

          <Text style={styles.tax}>Inclusive of all taxes</Text>
        </View>

        {/* COLOR - Dynamic */}
        {requiresColor() && (
          <View style={styles.card}>
            <Text style={styles.section}>Color</Text>
            <View style={styles.colorRow}>
              {productDetails.colors.map((c: any) => {
                const isSelected = selectedColor?._id === c?._id;
                const colorHex = getColorHex(c);
                const colorName = getColorName(c);
                
                return (
                  <TouchableOpacity
                    key={c?._id || c}
                    style={[
                      styles.colorDot,
                      { backgroundColor: colorHex },
                      isSelected && styles.colorActive,
                    ]}
                    onPress={() => setSelectedColor(c)}
                    accessibilityLabel={`Select ${colorName} color`}
                  >
                    {isSelected && (
                      <Ionicons name="checkmark" size={14} color="#fff" />
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        )}

        {/* SIZE - Dynamic */}
        {requiresSize() && (
          <View style={styles.card}>
            <View style={styles.sizeHeader}>
              <Text style={styles.section}>Select Size</Text>
              <TouchableOpacity style={styles.sizeGuideBtn} onPress={showSizeGuide}>
                <Ionicons name="information-circle-outline" size={18} color="#96252A" />
                <Text style={styles.sizeGuideText}>Size Guide</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.sizeGrid}>
              {productDetails?.sizes?.map((s: any) => {
                const isSelected = selectedSize?._id === s._id;
                const isOutOfStock = s.stock === 0;

                return (
                  <TouchableOpacity
                    key={s._id}
                    style={[
                      styles.sizeBox,
                      isSelected && styles.sizeActive,
                      isOutOfStock && styles.sizeOutOfStock,
                    ]}
                    onPress={() => {
                      if (isOutOfStock) {
                        Alert.alert('Out of Stock', 'This size is currently out of stock.');
                      } else {
                        setSelectedSize(s);
                      }
                    }}
                    disabled={isOutOfStock}
                  >
                    <Text
                      style={[
                        styles.sizeText,
                        isSelected && styles.sizeTextActive,
                        isOutOfStock && styles.sizeTextOutOfStock,
                      ]}
                    >
                      {s.label.toUpperCase()}
                    </Text>
                    {s.stock !== undefined && s.stock > 0 && s.stock < 5 && (
                      <Text style={styles.stockText}>Only {s.stock} left</Text>
                    )}
                    {isOutOfStock && (
                      <Text style={styles.outOfStockLabel}>OUT</Text>
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        )}

        {/* DELIVERY & RETURNS - Dynamic with Address Modal */}
        <View style={styles.card}>
          <Text style={styles.section}>Delivery & Returns</Text>

          <TouchableOpacity
            style={styles.deliveryRow}
            onPress={() => setAddressModalVisible(true)}
          >
            <View style={styles.deliveryLeft}>
              <Ionicons name="location-outline" size={18} color="#666" />
              <Text style={styles.deliveryText}>
                Deliver to {selectedAddress?.zipCode || 'Select address'}, {selectedAddress?.city || ''}, {selectedAddress?.state || ''}
              </Text>
            </View>
            <Text style={styles.changeText}>Change</Text>
          </TouchableOpacity>

          <View style={styles.deliveryInfoRow}>
            <Ionicons name="bicycle-outline" size={18} color="#22C55E" />
            <View>
              <Text style={styles.deliveryInfoTitle}>Free Delivery</Text>
              <Text style={styles.deliveryInfoSub}>Estimated delivery by 24 May</Text>
            </View>
          </View>

          <View style={styles.deliveryInfoRow}>
            <Ionicons name="refresh-outline" size={18} color="#22C55E" />
            <View>
              <Text style={styles.deliveryInfoTitle}>7 Day Return & Exchange</Text>
              <Text style={styles.deliveryInfoSub}>Easy returns within 7 days of delivery</Text>
            </View>
          </View>

          <View style={styles.deliveryInfoRow}>
            <Ionicons name="cash-outline" size={18} color="#22C55E" />
            <View>
              <Text style={styles.deliveryInfoTitle}>Cash on Delivery</Text>
              <Text style={styles.deliveryInfoSub}>Available</Text>
            </View>
          </View>
        </View>

        {/* PRODUCT DETAILS - Using description */}
        <View style={styles.card}>
          <Text style={styles.section}>Product Details</Text>
          {productDetails?.description ? (
            <Text style={styles.detail}>{productDetails.description}</Text>
          ) : productDetails?.details && productDetails.details.length > 0 ? (
            productDetails.details.map((d, i) => (
              <Text key={i} style={styles.detail}>• {d}</Text>
            ))
          ) : (
            <Text style={styles.detail}>No details available</Text>
          )}
        </View>
      </ScrollView>

      {/* FOOTER */}
      <View style={styles.footer}>
        <TouchableOpacity style={styles.buyNow} onPress={handleBuyNow}>
          <Text style={styles.buyText}>BUY NOW</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.cartBtn} onPress={handleAddToCart}>
          <View style={styles.cartContent}>
            <Ionicons name="bag-outline" size={18} color="#fff" />
            <Text style={styles.cartText}>ADD TO CART</Text>
          </View>
        </TouchableOpacity>
      </View>

      {/* IMAGE ZOOM */}
      <Modal visible={zoomVisible} transparent>
        <View style={styles.zoomContainer}>
          <TouchableOpacity style={styles.closeBtn} onPress={() => setZoomVisible(false)}>
            <Ionicons name="close" size={28} color="#fff" />
          </TouchableOpacity>
          <ScrollView maximumZoomScale={3} minimumZoomScale={1} centerContent contentContainerStyle={styles.zoomScroll}>
            {zoomImage && (
              <Image source={{ uri: zoomImage }} style={styles.zoomImage} resizeMode="contain" />
            )}
          </ScrollView>
        </View>
      </Modal>

      {/* ✅ SIZE GUIDE MODAL WITH TABLE - FIXED LAYOUT */}
      <Modal
        visible={sizeGuideVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setSizeGuideVisible(false)}
      >
        <View style={styles.sizeGuideOverlay}>
          <View style={styles.sizeGuideContent}>
            <View style={styles.sizeGuideHeader}>
              <Text style={styles.sizeGuideTitle}>Size Guide</Text>
              <TouchableOpacity
                onPress={() => setSizeGuideVisible(false)}
                style={styles.sizeGuideClose}
              >
                <Ionicons name="close" size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>

            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={styles.sizeGuideTableContainer}>
                {/* Table */}
                <View style={styles.sizeGuideTable}>
                  {/* Table Header */}
                  <View style={styles.tableHeader}>
                    {activeColumns.map((col, idx) => (
                      <View 
                        key={idx} 
                        style={[
                          styles.tableHeaderCell,
                          idx === 0 && styles.tableHeaderCellFirst
                        ]}
                      >
                        <Text style={styles.tableHeaderText}>{col}</Text>
                      </View>
                    ))}
                  </View>

                  {/* Table Body */}
                  {sizeGuideData.map((item, rowIndex) => (
                    <View 
                      key={rowIndex} 
                      style={[
                        styles.tableRow,
                        rowIndex % 2 === 0 ? styles.tableRowEven : styles.tableRowOdd
                      ]}
                    >
                      {activeColumns.map((col, colIndex) => {
                        let displayValue = '-';
                        let isSizeColumn = col === 'Size';
                        
                        if (isSizeColumn) {
                          displayValue = item.size;
                        } else {
                          const val = item[col.toLowerCase()];
                          if (val !== null && val !== undefined && val !== '-') {
                            displayValue = `${val}"`;
                          }
                        }

                        return (
                          <View 
                            key={colIndex} 
                            style={[
                              styles.tableCell,
                              colIndex === 0 && styles.tableCellFirst
                            ]}
                          >
                            <Text 
                              style={[
                                isSizeColumn ? styles.tableSizeText : styles.tableCellText,
                                displayValue === '-' && styles.tableCellEmpty
                              ]}
                              numberOfLines={1}
                            >
                              {displayValue}
                            </Text>
                          </View>
                        );
                      })}
                    </View>
                  ))}
                </View>
              </View>
            </ScrollView>

            {/* Measurement Guide */}
            <View style={styles.measurementGuide}>
              <Text style={styles.measurementTitle}>How to Measure</Text>
              {activeColumns.includes('Chest') && (
                <View style={styles.measurementItem}>
                  <View style={styles.measurementDot} />
                  <Text style={styles.measurementText}>Chest: Measure around the fullest part of your chest</Text>
                </View>
              )}
              {activeColumns.includes('Shoulder') && (
                <View style={styles.measurementItem}>
                  <View style={styles.measurementDot} />
                  <Text style={styles.measurementText}>Shoulder: Measure across the back from shoulder to shoulder</Text>
                </View>
              )}
              {activeColumns.includes('Waist') && (
                <View style={styles.measurementItem}>
                  <View style={styles.measurementDot} />
                  <Text style={styles.measurementText}>Waist: Measure around your natural waistline</Text>
                </View>
              )}
              {activeColumns.includes('Length') && (
                <View style={styles.measurementItem}>
                  <View style={styles.measurementDot} />
                  <Text style={styles.measurementText}>Length: Measure from highest point of shoulder to hem</Text>
                </View>
              )}
            </View>

            <TouchableOpacity
              style={styles.closeSizeGuideBtn}
              onPress={() => setSizeGuideVisible(false)}
            >
              <Text style={styles.closeSizeGuideText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* ✅ ADDRESS SELECTION MODAL */}
      <Modal
        visible={addressModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setAddressModalVisible(false)}
      >
        <View style={styles.addressModalOverlay}>
          <View style={styles.addressModalContent}>
            <View style={styles.addressModalHeader}>
              <Text style={styles.addressModalTitle}>Select Delivery Address</Text>
              <TouchableOpacity
                onPress={() => setAddressModalVisible(false)}
                style={styles.addressModalClose}
              >
                <Ionicons name="close" size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {addresses.length > 0 ? (
                addresses.map((addr, idx) => (
                  <TouchableOpacity
                    key={idx}
                    style={[
                      styles.addressOption,
                      selectedAddress?._id === addr._id && styles.addressOptionSelected,
                    ]}
                    onPress={() => selectAddress(addr)}
                  >
                    <View style={styles.addressOptionContent}>
                      <View style={styles.addressOptionLeft}>
                        <Ionicons 
                          name="location-outline" 
                          size={20} 
                          color={selectedAddress?._id === addr._id ? "#96252A" : "#666"} 
                        />
                        <View style={styles.addressOptionText}>
                          <Text style={styles.addressOptionStreet}>{addr.street}</Text>
                          <Text style={styles.addressOptionDetail}>
                            {addr.city}, {addr.state}
                          </Text>
                          <Text style={styles.addressOptionDetail}>
                            {addr.country} - {addr.zipCode}
                          </Text>
                          {addr.phone && (
                            <Text style={styles.addressOptionDetail}>
                              📞 {addr.phone}
                            </Text>
                          )}
                        </View>
                      </View>
                      {selectedAddress?._id === addr._id && (
                        <Ionicons name="checkmark-circle" size={24} color="#96252A" />
                      )}
                    </View>
                    {addr.isDefault && (
                      <View style={styles.addressDefaultBadge}>
                        <Text style={styles.addressDefaultText}>Default</Text>
                      </View>
                    )}
                  </TouchableOpacity>
                ))
              ) : (
                <View style={styles.noAddressContainer}>
                  <Ionicons name="location-outline" size={60} color="#D1D5DB" />
                  <Text style={styles.noAddressTitle}>No Addresses Saved</Text>
                  <Text style={styles.noAddressSubtitle}>
                    Add your first address to make checkout faster
                  </Text>
                </View>
              )}

              {/* Add New Address Button */}
              <TouchableOpacity
                style={styles.addNewAddressBtn}
                onPress={navigateToAddressScreen}
              >
                <Ionicons name="add-circle-outline" size={20} color="#96252A" />
                <Text style={styles.addNewAddressText}>Add New Address</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  scrollContent: {
    paddingBottom: 100,
  },
  loader: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: '#F5F5F5',
  },

  imageWrapper: {
    backgroundColor: "#fff",
    position: "relative",
  },
  image: {
    width,
    height: 380,
    resizeMode: "contain",
  },

  shareBtn: {
    position: "absolute",
    top: 15,
    right: 25,
    backgroundColor: "#fff",
    padding: 10,
    borderRadius: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },

  discountBadge: {
    position: "absolute",
    top: 15,
    left: 15,
    backgroundColor: "#96252A",
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 4,
  },
  discountBadgeText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "700",
  },

  dotContainer: {
    position: "absolute",
    bottom: 10,
    flexDirection: "row",
    alignSelf: "center",
    gap: 6,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#ccc",
  },
  activeDot: {
    backgroundColor: "#96252A",
    width: 8,
    height: 8,
    borderRadius: 4,
  },

  thumbnailContainer: {
    backgroundColor: "#fff",
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  thumbnailList: {
    paddingHorizontal: 8,
    gap: 8,
  },
  thumbnailItem: {
    width: 56,
    height: 56,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: "transparent",
    marginHorizontal: 4,
    overflow: "hidden",
  },
  thumbnailActive: {
    borderColor: "#96252A",
  },
  thumbnailImage: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },

  card: {
    backgroundColor: "#fff",
    marginTop: 8,
    padding: 16,
    marginHorizontal: 0,
  },

  title: {
    fontSize: 18,
    fontWeight: "600",
    color: "#000",
  },

  ratingRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 4,
  },
  ratingText: {
    fontSize: 14,
    color: "#666",
    marginLeft: 4,
  },
  reviewText: {
    fontSize: 14,
    color: "#666",
    marginLeft: 4,
  },

  priceRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 6,
  },
  finalPrice: {
    fontSize: 24,
    fontWeight: "700",
    color: "#000",
  },
  mrp: {
    fontSize: 16,
    marginLeft: 8,
    textDecorationLine: "line-through",
    color: "#888",
  },
  offBadge: {
    backgroundColor: "#FEE2E2",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    marginLeft: 8,
  },
  offText: {
    color: "#DC2626",
    fontSize: 12,
    fontWeight: "600",
  },
  tax: {
    fontSize: 12,
    color: "#777",
    marginTop: 4,
  },

  section: {
    fontSize: 15,
    fontWeight: "600",
    color: "#000",
  },

  sizeHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  sizeGuideBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  sizeGuideText: {
    color: "#96252A",
    fontSize: 13,
    fontWeight: "500",
  },

  colorRow: {
    flexDirection: "row",
    gap: 12,
    flexWrap: "wrap",
  },
  colorDot: {
    width: 30,
    height: 30,
    borderRadius: 15,
    borderWidth: 2,
    borderColor: "#ddd",
    justifyContent: "center",
    alignItems: "center",
  },
  colorActive: {
    borderColor: "#96252A",
    borderWidth: 3,
  },

  sizeGrid: {
    flexDirection: "row",
    gap: 10,
    flexWrap: "wrap",
  },
  sizeBox: {
    minWidth: 44,
    height: 44,
    borderWidth: 1.5,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    borderColor: "#ddd",
    paddingHorizontal: 12,
    position: "relative",
  },
  sizeActive: {
    backgroundColor: "#f5f5f5",
    borderColor: "#96252A",
  },
  sizeOutOfStock: {
    backgroundColor: "#f5f5f5",
    borderColor: "#eee",
  },
  sizeText: {
    fontWeight: "600",
    color: "#333",
    fontSize: 13,
  },
  sizeTextActive: {
    color: "#333",
  },
  sizeTextOutOfStock: {
    color: "#ccc",
  },
  stockText: {
    fontSize: 9,
    color: "#e67e22",
    marginTop: 2,
  },
  outOfStockLabel: {
    fontSize: 8,
    color: "#d32f2f",
    fontWeight: "bold",
    position: "absolute",
    top: 2,
    right: 4,
  },

  deliveryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
    marginBottom: 12,
  },
  deliveryLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flex: 1,
  },
  deliveryText: {
    fontSize: 14,
    color: "#333",
    flex: 1,
  },
  changeText: {
    color: "#96252A",
    fontSize: 14,
    fontWeight: "600",
  },

  deliveryInfoRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    marginTop: 12,
  },
  deliveryInfoTitle: {
    fontSize: 14,
    fontWeight: "500",
    color: "#000",
  },
  deliveryInfoSub: {
    fontSize: 12,
    color: "#666",
    marginTop: 1,
  },

  detail: {
    fontSize: 14,
    color: "#444",
    marginBottom: 4,
    lineHeight: 20,
    flexShrink: 1,
  },

  footer: {
    position: "absolute",
    bottom: 28,
    width: "100%",
    flexDirection: "row",
    gap: 10,
    padding: 12,
    paddingBottom: 16,
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderColor: "#eee",
    elevation: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
  },

  buyNow: {
    flex: 1,
    borderWidth: 1.5,
    borderColor: "#96252A",
    paddingVertical: 14,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  buyText: {
    fontWeight: "700",
    fontSize: 14,
    color: "#96252A",
  },

  cartBtn: {
    flex: 1,
    backgroundColor: "black",
    paddingVertical: 14,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  cartContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  cartText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 14,
  },

  zoomContainer: {
    flex: 1,
    backgroundColor: "#000",
  },
  zoomScroll: {
    flex: 1,
    justifyContent: "center",
  },
  zoomImage: {
    width: "100%",
    height: "100%",
  },
  closeBtn: {
    position: "absolute",
    top: 40,
    right: 20,
    zIndex: 10,
  },

  // ✅ Size Guide Modal Styles - FIXED
  sizeGuideOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  sizeGuideContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    width: '100%',
    maxHeight: '85%',
  },
  sizeGuideHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sizeGuideTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#0F172A',
  },
  sizeGuideClose: {
    padding: 4,
  },
  sizeGuideTableContainer: {
    paddingVertical: 4,
  },
  sizeGuideTable: {
    borderRadius: 8,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    minWidth: 280,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: 'black',
  },
  tableHeaderCell: {
    paddingVertical: 12,
    paddingHorizontal: 12,
    minWidth: 60,
    justifyContent: 'center',
    alignItems: 'center',
    borderRightWidth: 1,
    borderRightColor: 'rgba(255,255,255,0.15)',
  },
  tableHeaderCellFirst: {
    minWidth: 70,
  },
  tableHeaderText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
    textAlign: 'center',
  },
  tableRow: {
    flexDirection: 'row',
  },
  tableRowEven: {
    backgroundColor: '#F8FAFC',
  },
  tableRowOdd: {
    backgroundColor: '#FFFFFF',
  },
  tableCell: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    minWidth: 60,
    justifyContent: 'center',
    alignItems: 'center',
    borderRightWidth: 1,
    borderRightColor: '#F1F5F9',
  },
  tableCellFirst: {
    minWidth: 70,
  },
  tableCellText: {
    color: '#334155',
    fontSize: 13,
    fontWeight: '500',
    textAlign: 'center',
  },
  tableSizeText: {
    color: '#96252A',
    fontSize: 14,
    fontWeight: '700',
    textAlign: 'center',
  },
  tableCellEmpty: {
    color: '#CBD5E1',
  },
  measurementGuide: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  measurementTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0F172A',
    marginBottom: 8,
  },
  measurementItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 4,
  },
  measurementDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#96252A',
    marginTop: 6,
    marginRight: 8,
  },
  measurementText: {
    fontSize: 12,
    color: '#64748B',
    flex: 1,
    lineHeight: 18,
  },
  closeSizeGuideBtn: {
    backgroundColor: '#96252A',
    paddingVertical: 12,
    borderRadius: 10,
    marginTop: 16,
    alignItems: 'center',
  },
  closeSizeGuideText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },

  // ✅ Address Modal Styles
  addressModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  addressModalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    paddingBottom: 30,
    maxHeight: '100%',
  },
  addressModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  addressModalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0F172A',
  },
  addressModalClose: {
    padding: 4,
  },
  addressOption: {
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    marginBottom: 12,
    backgroundColor: '#F8FAFC',
  },
  addressOptionSelected: {
    borderColor: '#96252A',
    backgroundColor: '#FEF2F2',
  },
  addressOptionContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  addressOptionLeft: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    flex: 1,
  },
  addressOptionText: {
    flex: 1,
  },
  addressOptionStreet: {
    fontSize: 15,
    fontWeight: '600',
    color: '#0F172A',
  },
  addressOptionDetail: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 2,
  },
  addressDefaultBadge: {
    marginTop: 8,
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  addressDefaultText: {
    color: '#16A34A',
    fontSize: 10,
    fontWeight: '600',
  },
  noAddressContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  noAddressTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#0F172A',
    marginTop: 12,
  },
  noAddressSubtitle: {
    fontSize: 14,
    color: '#94A3B8',
    textAlign: 'center',
    marginTop: 10,
    marginBottom: 10,
  },
  addNewAddressBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 14,
    borderWidth: 1,
    borderColor: '#96252A',
    borderRadius: 12,
    marginTop: 0,
    marginBottom: 20,
    backgroundColor: '#FFFFFF',
  },
  addNewAddressText: {
    color: '#96252A',
    fontWeight: '600',
    fontSize: 14,
  },
});

export default ProductPage;