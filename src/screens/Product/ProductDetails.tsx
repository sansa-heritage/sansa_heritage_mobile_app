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
  const [token, setToken] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [quantity, setQuantity] = useState<number>(1);

  const [activeIndex, setActiveIndex] = useState(0);
  const [zoomVisible, setZoomVisible] = useState(false);
  const [zoomImage, setZoomImage] = useState<string | null>(null);
  const flatListRef = useRef<FlatList>(null);

  const [addressModalVisible, setAddressModalVisible] = useState(false);
  const [sizeGuideVisible, setSizeGuideVisible] = useState(false);
  const [sizeGuideData, setSizeGuideData] = useState<any[]>([]);
  const [activeColumns, setActiveColumns] = useState<string[]>([]);

  // Validation
  const validateColorSelection = () => {
    if (!productDetails?.colors || productDetails.colors.length === 0)
      return { valid: true, message: '' };
    if (!selectedColor) return { valid: false, message: 'Please select a color' };
    return { valid: true, message: '' };
  };

  const validateSizeSelection = () => {
    if (!productDetails?.sizes || productDetails.sizes.length === 0)
      return { valid: true, message: '' };
    if (!selectedSize) return { valid: false, message: 'Please select a size' };
    return { valid: true, message: '' };
  };

  const validateQuantity = () => {
    if (quantity < 1) return { valid: false, message: 'Minimum quantity is 1' };
    let maxStock = productDetails?.stock || 10;
    if (selectedSize && typeof selectedSize === 'object' && selectedSize.stock) {
      maxStock = selectedSize.stock;
    }
    if (quantity > maxStock)
      return { valid: false, message: `Only ${maxStock} items available in stock` };
    return { valid: true, message: '' };
  };

  const validateSelections = () => {
    const errors: string[] = [];
    const c = validateColorSelection();
    if (!c.valid) errors.push(c.message);
    const s = validateSizeSelection();
    if (!s.valid) errors.push(s.message);
    const q = validateQuantity();
    if (!q.valid) errors.push(q.message);
    return { valid: errors.length === 0, errors };
  };

  const requiresColor = () => productDetails?.colors && productDetails.colors.length > 0;
  const requiresSize = () => productDetails?.sizes && productDetails.sizes.length > 0;

  const getSelectedColorId = (): string | null => {
    if (!selectedColor) return null;
    if (typeof selectedColor === 'object') return selectedColor._id || selectedColor.name || null;
    return selectedColor;
  };

  const getSelectedSizeId = (): string | null => {
    if (!selectedSize) return null;
    if (typeof selectedSize === 'object') return selectedSize._id || selectedSize.label || null;
    return selectedSize;
  };

  const handleShare = async () => {
    try {
      await Share.share({
        message: `Check out ${productDetails?.name} on Sansa Heritage!`,
      });
    } catch (error) {
      console.error('Share error:', error);
    }
  };

  const showSizeGuide = () => {
    if (!productDetails?.sizes || productDetails.sizes.length === 0) {
      Alert.alert('Size Guide', 'No size information available.', [{ text: 'OK' }]);
      return;
    }

    const data = productDetails.sizes.map((s: any) => ({
      size: s.label ? s.label.toUpperCase() : s.name?.toUpperCase() || 'N/A',
      chest: s.chest || productDetails.chest || null,
      shoulder: s.shoulder || productDetails.shoulder || null,
      waist: s.waist || productDetails.waist || null,
      length: s.length || productDetails.length || null,
    }));

    const columns: string[] = ['Size'];
    if (data.some((d: any) => d.chest)) columns.push('Chest');
    if (data.some((d: any) => d.shoulder)) columns.push('Shoulder');
    if (data.some((d: any) => d.waist)) columns.push('Waist');
    if (data.some((d: any) => d.length)) columns.push('Length');

    setActiveColumns(columns);
    setSizeGuideData(data);
    setSizeGuideVisible(true);
  };

  const selectAddress = async (address: Address) => {
    setSelectedAddress(address);
    await AsyncStorage.setItem("selectedAddress", JSON.stringify(address));
    setAddressModalVisible(false);
    Toast.show('success', 'Address selected');
  };

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

        const res = await fetch(`${config.baseURL}api/products/${itemId}`, {
          headers: { Authorization: `Bearer ${storedToken}` },
        });
        const data = await res.json();
        setProductDetails(data);

        if (data.colors?.length > 0) setSelectedColor(data.colors[0]);
        if (data.sizes?.length > 0) setSelectedSize(data.sizes[0]);

        const addr = await getAddresses();
        setAddresses(addr);

        const saved = await AsyncStorage.getItem('selectedAddress');
        if (saved) {
          setSelectedAddress(JSON.parse(saved));
        } else if (addr?.length > 0) {
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

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', async () => {
      try {
        const addr = await getAddresses();
        setAddresses(addr);
        if (addr?.length > 0) {
          const saved = await AsyncStorage.getItem('selectedAddress');
          if (saved) {
            setSelectedAddress(JSON.parse(saved));
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
        {/* <ActivityIndicator size="large" color="#9E0E26" /> */}
      </View>
    );
  }

  const productImages =
    productDetails.images?.length > 0
      ? productDetails.images
      : productDetails.image
      ? [productDetails.image]
      : [];

  const finalPrice =
    productDetails.price - (productDetails.price * productDetails.discountPercent) / 100;

  // ✅ Split title into bold prefix + normal rest
  const nameParts = (productDetails.name || '').split(' ');
  const boldPart = nameParts.slice(0, 2).join(' ');
  const normalPart = nameParts.slice(2).join(' ');

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
      const response = await fetch(`${config.baseURL}api/cart/add-to-cart`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          userId,
          productId: itemId,
          quantity,
          color: getSelectedColorId(),
          size: getSelectedSizeId(),
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
      quantity,
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
    flatListRef.current?.scrollToIndex({ index, animated: true });
  };

  const renderThumbnail = ({ item, index }: { item: string; index: number }) => (
    <TouchableOpacity
      style={[styles.thumbnailItem, activeIndex === index && styles.thumbnailActive]}
      onPress={() => scrollToIndex(index)}
    >
      <Image source={{ uri: item }} style={styles.thumbnailImage} />
    </TouchableOpacity>
  );

  const getColorName = (color: any): string => {
    if (!color) return '';
    if (typeof color === 'object') return color.name || color.label || '';
    return String(color);
  };

  const getColorHex = (color: any): string => {
    if (!color) return '#ccc';
    if (typeof color === 'object')
      return color.hexCode || color.hex || color.colorCode || '#ccc';
    return '#ccc';
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* ✅ FULL-WIDTH IMAGE SLIDER */}
        <View style={styles.imageWrapper}>
          <FlatList
            ref={flatListRef}
            data={productImages}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            keyExtractor={(_, i) => i.toString()}
            onScroll={e => {
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

          <TouchableOpacity style={styles.shareBtn} onPress={handleShare}>
            <Ionicons name="share-social-outline" size={22} color="#000" />
          </TouchableOpacity>
        </View>

        {/* Thumbnails */}
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

        {/* ✅ PRODUCT INFO - Bold prefix title + Myntra star pill */}
        <View style={styles.card}>
          <Text style={styles.title}>
            <Text style={styles.titleBold}>{boldPart}</Text>
            {normalPart ? ` ${normalPart}` : ''}
          </Text>

          {/* ✅ Myntra-style rating pill */}
          <View style={styles.ratingPill}>
            <Text style={styles.ratingPillText}>
              {Number(productDetails.rating || 0).toFixed(1)}
            </Text>
            <FontAwesome name="star" size={11} color="#FFFFFF" />
            <View style={styles.ratingPillDivider} />
            <Text style={styles.ratingPillReviews}>
              {productDetails.reviews || 0}
            </Text>
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

        {/* COLOR */}
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
                    accessibilityLabel={`Select ${colorName}`}
                  >
                    {isSelected && <Ionicons name="checkmark" size={14} color="#fff" />}
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        )}

        {/* ✅ SIZE - White background, smaller font */}
        {requiresSize() && (
          <View style={styles.card}>
            <View style={styles.sizeHeader}>
              <Text style={styles.section}>Select Size</Text>
              <TouchableOpacity style={styles.sizeGuideBtn} onPress={showSizeGuide}>
                <Ionicons name="information-circle-outline" size={18} color="#9E0E26" />
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
                    {isOutOfStock && <Text style={styles.outOfStockLabel}>OUT</Text>}
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        )}

        {/* ✅ DELIVERY ADDRESS CARD (Myntra style) */}
        <View style={styles.card}>
          <View style={styles.myntraDeliveryRow}>
            <Ionicons name="location-outline" size={18} color="#333" />
            <Text style={styles.myntraDeliveryText}>
              Deliver to{' '}
              <Text style={styles.myntraDeliveryBold}>
                {selectedAddress?.zipCode || 'Select address'}
              </Text>
              {selectedAddress?.city ? `, ${selectedAddress.city}` : ''}
            </Text>
            <TouchableOpacity onPress={() => setAddressModalVisible(true)}>
              <Text style={styles.myntraChangeText}>CHANGE</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* ✅ RETURNS & DELIVERY INFO - Myntra style horizontal cards */}
        <View style={styles.card}>
          <View style={styles.myntraInfoGrid}>
            <View style={styles.myntraInfoItem}>
              <Ionicons name="bicycle-outline" size={22} color="#333" />
              <Text style={styles.myntraInfoLabel}>Free Delivery</Text>
              <Text style={styles.myntraInfoSub}>Est. by 24 May</Text>
            </View>

            <View style={styles.myntraInfoDivider} />

            <View style={styles.myntraInfoItem}>
              <Ionicons name="refresh-outline" size={22} color="#333" />
              <Text style={styles.myntraInfoLabel}>7 Day Return</Text>
              <Text style={styles.myntraInfoSub}>Easy & Free</Text>
            </View>

            <View style={styles.myntraInfoDivider} />

            <View style={styles.myntraInfoItem}>
              <Ionicons name="cash-outline" size={22} color="#333" />
              <Text style={styles.myntraInfoLabel}>Cash on Delivery</Text>
              <Text style={styles.myntraInfoSub}>Not Available</Text>
            </View>
          </View>
        </View>

        {/* PRODUCT DETAILS */}
        <View style={styles.card}>
          <Text style={styles.section}>Product Details</Text>
          {productDetails?.description ? (
            <Text style={styles.detail}>{productDetails.description}</Text>
          ) : productDetails?.details?.length > 0 ? (
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

      {/* ZOOM MODAL */}
      <Modal visible={zoomVisible} transparent>
        <View style={styles.zoomContainer}>
          <TouchableOpacity style={styles.closeBtn} onPress={() => setZoomVisible(false)}>
            <Ionicons name="close" size={28} color="#fff" />
          </TouchableOpacity>
          <ScrollView
            maximumZoomScale={3}
            minimumZoomScale={1}
            centerContent
            contentContainerStyle={styles.zoomScroll}
          >
            {zoomImage && (
              <Image source={{ uri: zoomImage }} style={styles.zoomImage} resizeMode="contain" />
            )}
          </ScrollView>
        </View>
      </Modal>

      {/* SIZE GUIDE MODAL */}
      <Modal
        visible={sizeGuideVisible}
        animationType="slide"
        transparent
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
              <View style={styles.sizeGuideTable}>
                <View style={styles.tableHeader}>
                  {activeColumns.map((col, idx) => (
                    <View
                      key={idx}
                      style={[styles.tableHeaderCell, idx === 0 && styles.tableHeaderCellFirst]}
                    >
                      <Text style={styles.tableHeaderText}>{col}</Text>
                    </View>
                  ))}
                </View>

                {sizeGuideData.map((item, rowIndex) => (
                  <View
                    key={rowIndex}
                    style={[
                      styles.tableRow,
                      rowIndex % 2 === 0 ? styles.tableRowEven : styles.tableRowOdd,
                    ]}
                  >
                    {activeColumns.map((col, colIndex) => {
                      let displayValue = '-';
                      const isSizeColumn = col === 'Size';

                      if (isSizeColumn) {
                        displayValue = item.size;
                      } else {
                        const val = item[col.toLowerCase()];
                        if (val) displayValue = `${val}"`;
                      }

                      return (
                        <View
                          key={colIndex}
                          style={[styles.tableCell, colIndex === 0 && styles.tableCellFirst]}
                        >
                          <Text
                            style={[
                              isSizeColumn ? styles.tableSizeText : styles.tableCellText,
                              displayValue === '-' && styles.tableCellEmpty,
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
            </ScrollView>

            <View style={styles.measurementGuide}>
              <Text style={styles.measurementTitle}>How to Measure</Text>
              {activeColumns.includes('Chest') && (
                <View style={styles.measurementItem}>
                  <View style={styles.measurementDot} />
                  <Text style={styles.measurementText}>
                    Chest: Measure around the fullest part of your chest
                  </Text>
                </View>
              )}
              {activeColumns.includes('Shoulder') && (
                <View style={styles.measurementItem}>
                  <View style={styles.measurementDot} />
                  <Text style={styles.measurementText}>
                    Shoulder: Measure across the back from shoulder to shoulder
                  </Text>
                </View>
              )}
              {activeColumns.includes('Waist') && (
                <View style={styles.measurementItem}>
                  <View style={styles.measurementDot} />
                  <Text style={styles.measurementText}>
                    Waist: Measure around your natural waistline
                  </Text>
                </View>
              )}
              {activeColumns.includes('Length') && (
                <View style={styles.measurementItem}>
                  <View style={styles.measurementDot} />
                  <Text style={styles.measurementText}>
                    Length: Measure from highest point of shoulder to hem
                  </Text>
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

      {/* ADDRESS MODAL */}
      <Modal
        visible={addressModalVisible}
        animationType="slide"
        transparent
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
                          color={selectedAddress?._id === addr._id ? "#9E0E26" : "#666"}
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
                            <Text style={styles.addressOptionDetail}>📞 {addr.phone}</Text>
                          )}
                        </View>
                      </View>
                      {selectedAddress?._id === addr._id && (
                        <Ionicons name="checkmark-circle" size={24} color="#9E0E26" />
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

              <TouchableOpacity
                style={styles.addNewAddressBtn}
                onPress={navigateToAddressScreen}
              >
                <Ionicons name="add-circle-outline" size={20} color="#9E0E26" />
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

  // ✅ Full-width image
  imageWrapper: {
    backgroundColor: "#fff",
    position: "relative",
    width: width,
    marginHorizontal: 0,
    paddingHorizontal: 0,
  },
  image: {
    width: width,
    height: width * 1.2, // proper aspect ratio
    resizeMode: "cover",
  },

  shareBtn: {
    position: "absolute",
    top: 15,
    right: 15,
    backgroundColor: "#fff",
    padding: 10,
    borderRadius: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },

  dotContainer: {
    position: "absolute",
    bottom: 12,
    flexDirection: "row",
    alignSelf: "center",
    gap: 6,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "rgba(255,255,255,0.6)",
  },
  activeDot: {
    backgroundColor: "#9E0E26",
    width: 8,
    height: 8,
    borderRadius: 4,
  },

  thumbnailContainer: {
    backgroundColor: "#fff",
    paddingVertical: 8,
  },
  thumbnailList: {
    paddingHorizontal: 12,
    gap: 8,
  },
  thumbnailItem: {
    width: 56,
    height: 56,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: "transparent",
    overflow: "hidden",
  },
  thumbnailActive: {
    borderColor: "#9E0E26",
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
  },

  // ✅ Title - bold prefix
  title: {
    fontSize: 17,
    color: "#000",
    lineHeight: 24,
  },
  titleBold: {
    fontWeight: "700",
    color: "#000",
  },

  // ✅ Myntra-style rating pill
  ratingPill: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    backgroundColor: "#138E4E",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
    marginTop: 8,
    gap: 3,
  },
  ratingPillText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "700",
  },
  ratingPillDivider: {
    width: 1,
    height: 10,
    backgroundColor: "rgba(255,255,255,0.5)",
    marginHorizontal: 4,
  },
  ratingPillReviews: {
    color: "#FFFFFF",
    fontSize: 11,
    fontWeight: "500",
  },

  priceRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 10,
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
    color: "#9E0E26",
    fontSize: 13,
    fontWeight: "500",
  },

  colorRow: {
    flexDirection: "row",
    gap: 12,
    flexWrap: "wrap",
    marginTop: 8,
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
    borderColor: "#9E0E26",
    borderWidth: 3,
  },

  // ✅ Size boxes - WHITE background, smaller font
  sizeGrid: {
    flexDirection: "row",
    gap: 8,
    flexWrap: "wrap",
    marginTop: 8,
  },
  sizeBox: {
    minWidth: 42,
    height: 40,
    borderWidth: 1.2,
    borderRadius: 6,
    justifyContent: "center",
    alignItems: "center",
    borderColor: "#D1D5DB",
    backgroundColor: "#FFFFFF", // ✅ White
    paddingHorizontal: 10,
    position: "relative",
  },
  sizeActive: {
    backgroundColor: "#FFFFFF",
    borderColor: "#9E0E26",
    borderWidth: 1.8,
  },
  sizeOutOfStock: {
    backgroundColor: "#FFFFFF",
    borderColor: "#E5E7EB",
  },
  sizeText: {
    fontWeight: "500",
    color: "#333",
    fontSize: 11, // ✅ Reduced font size
  },
  sizeTextActive: {
    color: "#9E0E26",
    fontWeight: "700",
  },
  sizeTextOutOfStock: {
    color: "#D1D5DB",
  },
  outOfStockLabel: {
    fontSize: 7,
    color: "#d32f2f",
    fontWeight: "bold",
    position: "absolute",
    top: 1,
    right: 3,
  },

  // ✅ Myntra-style delivery row
  myntraDeliveryRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  myntraDeliveryText: {
    fontSize: 14,
    color: "#555",
    flex: 1,
  },
  myntraDeliveryBold: {
    fontWeight: "700",
    color: "#000",
  },
  myntraChangeText: {
    color: "#9E0E26",
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 0.5,
  },

  // ✅ Myntra-style info grid
  myntraInfoGrid: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  myntraInfoItem: {
    flex: 1,
    alignItems: "center",
    gap: 4,
  },
  myntraInfoLabel: {
    fontSize: 11,
    fontWeight: "600",
    color: "#000",
    textAlign: "center",
  },
  myntraInfoSub: {
    fontSize: 10,
    color: "#666",
    textAlign: "center",
  },
  myntraInfoDivider: {
    width: 1,
    height: 40,
    backgroundColor: "#E5E7EB",
  },

  detail: {
    fontSize: 14,
    color: "#444",
    marginBottom: 4,
    lineHeight: 20,
    flexShrink: 1,
    marginTop: 6,
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
  },
  buyNow: {
    flex: 1,
    borderWidth: 1.5,
    borderColor: "#9E0E26",
    paddingVertical: 14,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  buyText: {
    fontWeight: "700",
    fontSize: 14,
    color: "#9E0E26",
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

  // Size Guide Modal
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
    color: '#9E0E26',
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
    backgroundColor: '#9E0E26',
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
    backgroundColor: '#9E0E26',
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

  // Address Modal
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
    borderColor: '#9E0E26',
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
    borderColor: '#9E0E26',
    borderRadius: 12,
    marginTop: 0,
    marginBottom: 20,
    backgroundColor: '#FFFFFF',
  },
  addNewAddressText: {
    color: '#9E0E26',
    fontWeight: '600',
    fontSize: 14,
  },
});

export default ProductPage;