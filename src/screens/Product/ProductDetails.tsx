import React, { useEffect, useState, useRef } from "react";
import {
  ScrollView,
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  Modal,
  FlatList,
  Dimensions,
  Share,
} from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
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
// ✅ FIXED — replaced Toast with snackbar
import { snackbar } from "../../components/common/Snackbar";
import LoadingService from "../../services/LoadingService";

const { width, height } = Dimensions.get("window");

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
  const insets = useSafeAreaInsets();
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

  const FOOTER_HEIGHT = 58 + insets.bottom;

  /* ============ VALIDATION ============ */

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

  // ✅ FIXED — Alert.alert → snackbar.warning
  const showSizeGuide = () => {
    if (!productDetails?.sizes || productDetails.sizes.length === 0) {
      snackbar.warning('No size information available.', 'Size Guide');
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

  // ✅ FIXED — Toast.show → snackbar.success
  const selectAddress = async (address: Address) => {
    setSelectedAddress(address);
    await AsyncStorage.setItem("selectedAddress", JSON.stringify(address));
    setAddressModalVisible(false);
    snackbar.success('Address selected');
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
    return <View style={styles.loader} />;
  }

  const productImages =
    productDetails.images?.length > 0
      ? productDetails.images
      : productDetails.image
        ? [productDetails.image]
        : [];

  const finalPrice =
    productDetails.price - (productDetails.price * productDetails.discountPercent) / 100;

  const nameParts = (productDetails.name || '').split(' ');
  const boldPart = nameParts.slice(0, 2).join(' ');
  const normalPart = nameParts.slice(2).join(' ');

  // ✅ FIXED — all Alert.alert → snackbar
  const handleAddToCart = async () => {
    const validation = validateSelections();
    if (!validation.valid) {
      snackbar.warning(validation.errors.join('\n'), 'Selection Required');
      return;
    }
    if (!token || !userId) {
      snackbar.warning('Please login to add items to cart');
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

      // ✅ FIXED — snackbar success
      snackbar.success('Product added to cart successfully!');
      eventBus.emit("ITEM_REMOVED", { id: 123 });
      if (selectedAddress) {
        await AsyncStorage.setItem("selectedAddress", JSON.stringify(selectedAddress));
      }
      navigation.navigate('CartPage');
    } catch (err: any) {
      console.error('Add to cart error:', err);
      // ✅ FIXED — snackbar error
      snackbar.error(err.message || 'Failed to add product to cart.');
    } finally {
      LoadingService.hide();
    }
  };

  // ✅ FIXED — all Alert.alert → snackbar
  const handleBuyNow = () => {
    const validation = validateSelections();
    if (!validation.valid) {
      snackbar.warning(validation.errors.join('\n'), 'Selection Required');
      return;
    }
    if (!selectedAddress) {
      snackbar.warning(
        'Please add a delivery address before proceeding to checkout',
        'Address Required',
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
    <View style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: FOOTER_HEIGHT + 20 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* FULL-WIDTH IMAGE SLIDER */}
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

          <TouchableOpacity
            style={[styles.shareBtn, { top: insets.top + 0 }]}
            onPress={handleShare}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons name="share-social-outline" size={24} color="#000" />
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

        {/* PRODUCT INFO */}
        <View style={styles.card}>
          <Text style={styles.title}>
            <Text style={styles.titleBold}>{boldPart}</Text>
            {normalPart ? ` ${normalPart}` : ''}
          </Text>

          {Number(productDetails.rating || 0) > 0 && (
            <View style={styles.ratingPill}>
              <Text style={styles.ratingPillText}>
                {Number(productDetails.rating || 0).toFixed(1)}
              </Text>
              <View style={styles.ratingPillDivider} />
              <FontAwesome name="star" size={10} color="#1F9E4C" />
            </View>
          )}

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
                    {isSelected && <Ionicons name="checkmark" size={12} color="#fff" />}
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        )}

        {/* SIZE */}
        {requiresSize() && (
          <View style={styles.card}>
            <View style={styles.sizeHeader}>
              <Text style={styles.section}>Select Size</Text>
              <TouchableOpacity style={styles.sizeGuideBtn} onPress={showSizeGuide}>
                <Ionicons name="information-circle-outline" size={16} color="#9E0E26" />
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
                        // ✅ FIXED — Alert → snackbar
                        snackbar.warning('This size is currently out of stock.', 'Out of Stock');
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

        {/* DELIVERY ADDRESS CARD */}
        <View style={styles.card}>
          <View style={styles.myntraDeliveryRow}>
            <Ionicons name="location-outline" size={16} color="#333" />
            <Text style={styles.myntraDeliveryText} numberOfLines={1}>
              Deliver to{' '}
              <Text style={styles.myntraDeliveryBold}>
                {selectedAddress?.zipCode || 'Select address'}
              </Text>
              {selectedAddress?.city ? `, ${selectedAddress.city}` : ''}
            </Text>
            <TouchableOpacity onPress={() => setAddressModalVisible(true)}>
              <Text style={styles.myntraChangeText}>Change</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* RETURNS & DELIVERY INFO */}
        <View style={styles.card}>
          <View style={styles.myntraInfoGrid}>
            <View style={styles.myntraInfoItem}>
              <Ionicons name="bicycle-outline" size={20} color="#333" />
              <Text style={styles.myntraInfoLabel}>Free Delivery</Text>
              <Text style={styles.myntraInfoSub}>Est. by 24 May</Text>
            </View>

            <View style={styles.myntraInfoDivider} />

            <View style={styles.myntraInfoItem}>
              <Ionicons name="refresh-outline" size={20} color="#333" />
              <Text style={styles.myntraInfoLabel}>7 Day Return</Text>
              <Text style={styles.myntraInfoSub}>Easy & Free</Text>
            </View>

            <View style={styles.myntraInfoDivider} />

            <View style={styles.myntraInfoItem}>
              <Ionicons name="cash-outline" size={20} color="#333" />
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
      <View
        style={[
          styles.footer,
          { paddingBottom: Math.max(insets.bottom, 10) },
        ]}
      >
        <TouchableOpacity style={styles.buyNow} onPress={handleBuyNow}>
          <Text style={styles.buyText}>BUY NOW</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.cartBtn} onPress={handleAddToCart}>
          <View style={styles.cartContent}>
            <Ionicons name="bag-outline" size={16} color="#fff" />
            <Text style={styles.cartText}>ADD TO CART</Text>
          </View>
        </TouchableOpacity>
      </View>

      {/* ZOOM MODAL */}
      <Modal visible={zoomVisible} transparent>
        <View style={styles.zoomContainer}>
          <TouchableOpacity
            style={[styles.closeBtn, { top: insets.top + 16 }]}
            onPress={() => setZoomVisible(false)}
          >
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
                <Ionicons name="close" size={22} color="#6B7280" />
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
          <View
            style={[
              styles.addressModalContent,
              { paddingBottom: Math.max(insets.bottom, 20) + 8 },
            ]}
          >
            <View style={styles.addressModalHeader}>
              <Text style={styles.addressModalTitle}>Select Delivery Address</Text>
              <TouchableOpacity
                onPress={() => setAddressModalVisible(false)}
                style={styles.addressModalClose}
              >
                <Ionicons name="close" size={22} color="#6B7280" />
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
                          size={18}
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
                        <Ionicons name="checkmark-circle" size={22} color="#9E0E26" />
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
                  <Ionicons name="location-outline" size={55} color="#D1D5DB" />
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
    </View>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#F5F5F5' },
  scrollContent: { paddingBottom: 20 },
  loader: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: '#F5F5F5',
  },

  /* IMAGE */
  imageWrapper: { backgroundColor: "#fff", position: "relative", width: width },
  image: {
    width: width,
    height: Math.min(width * 1.15, height * 0.55),
    resizeMode: "cover",
  },
  shareBtn: {
    position: "absolute",
    right: 15,
    backgroundColor: "transparent",
    padding: 6,
    borderRadius: 20,
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

  thumbnailContainer: { backgroundColor: "#fff", paddingVertical: 8 },
  thumbnailList: { paddingHorizontal: 12, gap: 8 },
  thumbnailItem: {
    width: 56,
    height: 56,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: "transparent",
    overflow: "hidden",
  },
  thumbnailActive: { borderColor: "#9E0E26" },
  thumbnailImage: { width: "100%", height: "100%", resizeMode: "cover" },

  card: { backgroundColor: "#fff", marginTop: 8, padding: 14 },

  title: { fontSize: 16, color: "#000", lineHeight: 22 },
  titleBold: { fontWeight: "700", color: "#000" },

  ratingPill: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 4,
    marginTop: 8,
    gap: 4,
    borderWidth: 1,
    borderColor: "#E0E0E0",
  },
  ratingPillText: { color: "#111", fontSize: 12, fontWeight: "700" },
  ratingPillDivider: {
    width: 1,
    height: 10,
    backgroundColor: "#D0D0D0",
    marginHorizontal: 2,
  },

  priceRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 10,
    flexWrap: "wrap",
    gap: 6,
  },
  finalPrice: { fontSize: 14, fontWeight: "700", color: "#000" },
  mrp: { fontSize: 12, textDecorationLine: "line-through", color: "#888" },
  offBadge: {
    backgroundColor: "#FEE2E2",
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 4,
  },
  offText: { color: "#DC2626", fontSize: 12, fontWeight: "600" },
  tax: { fontSize: 12, color: "#777", marginTop: 5 },

  section: { fontSize: 14, fontWeight: "600", color: "#000" },

  sizeHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
    flexWrap: "wrap",
    gap: 6,
  },
  sizeGuideBtn: { flexDirection: "row", alignItems: "center", gap: 4 },
  sizeGuideText: { color: "#9E0E26", fontSize: 12, fontWeight: "500" },

  colorRow: { flexDirection: "row", gap: 10, flexWrap: "wrap", marginTop: 8 },
  colorDot: {
    width: 30,
    height: 30,
    borderRadius: 15,
    borderWidth: 2,
    borderColor: "#ddd",
    justifyContent: "center",
    alignItems: "center",
  },
  colorActive: { borderColor: "#9E0E26", borderWidth: 3 },

  sizeGrid: { flexDirection: "row", gap: 8, flexWrap: "wrap", marginTop: 8 },
  sizeBox: {
    minWidth: 44,
    height: 40,
    borderWidth: 1.2,
    borderRadius: 6,
    justifyContent: "center",
    alignItems: "center",
    borderColor: "#D1D5DB",
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 10,
    position: "relative",
  },
  sizeActive: { backgroundColor: "#FFFFFF", borderColor: "#9E0E26", borderWidth: 1.8 },
  sizeOutOfStock: { backgroundColor: "#FFFFFF", borderColor: "#E5E7EB" },
  sizeText: { fontWeight: "600", color: "#333", fontSize: 12 },
  sizeTextActive: { color: "#9E0E26", fontWeight: "700" },
  sizeTextOutOfStock: { color: "#D1D5DB" },
  outOfStockLabel: {
    fontSize: 7,
    color: "#d32f2f",
    fontWeight: "bold",
    position: "absolute",
    top: 1,
    right: 3,
  },

  myntraDeliveryRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  myntraDeliveryText: { fontSize: 13, color: "#555", flex: 1 },
  myntraDeliveryBold: { fontWeight: "700", color: "#000" },
  myntraChangeText: {
    color: "#9E0E26",
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 0.4,
  },

  myntraInfoGrid: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  myntraInfoItem: { flex: 1, alignItems: "center", gap: 4 },
  myntraInfoLabel: {
    fontSize: 11,
    fontWeight: "600",
    color: "#000",
    textAlign: "center",
  },
  myntraInfoSub: { fontSize: 10, color: "#666", textAlign: "center" },
  myntraInfoDivider: { width: 1, height: 40, backgroundColor: "#E5E7EB" },

  detail: {
    fontSize: 13,
    color: "#444",
    marginBottom: 4,
    lineHeight: 19,
    flexShrink: 1,
    marginTop: 6,
  },

  footer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    gap: 8,
    paddingHorizontal: 12,
    paddingTop: 10,
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderColor: "#eee",
  },
  buyNow: {
    flex: 1,
    borderWidth: 1.5,
    borderColor: "#9E0E26",
    paddingVertical: 10,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  buyText: {
    fontWeight: "700",
    fontSize: 13,
    color: "#9E0E26",
    letterSpacing: 0.3,
  },
  cartBtn: {
    flex: 1,
    backgroundColor: "#000000",
    paddingVertical: 10,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  cartContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  cartText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 13,
    letterSpacing: 0.3,
  },

  zoomContainer: { flex: 1, backgroundColor: "#000" },
  zoomScroll: { flex: 1, justifyContent: "center" },
  zoomImage: { width: "100%", height: "100%" },
  closeBtn: { position: "absolute", right: 20, zIndex: 10 },

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
    padding: 18,
    width: '100%',
    maxHeight: '85%',
  },
  sizeGuideHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  sizeGuideTitle: { fontSize: 18, fontWeight: '700', color: '#0F172A' },
  sizeGuideClose: { padding: 4 },
  sizeGuideTable: {
    borderRadius: 8,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    minWidth: 260,
  },
  tableHeader: { flexDirection: 'row', backgroundColor: '#000000' },
  tableHeaderCell: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    minWidth: 58,
    justifyContent: 'center',
    alignItems: 'center',
    borderRightWidth: 1,
    borderRightColor: 'rgba(255,255,255,0.15)',
  },
  tableHeaderCellFirst: { minWidth: 66 },
  tableHeaderText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
    textAlign: 'center',
  },
  tableRow: { flexDirection: 'row' },
  tableRowEven: { backgroundColor: '#F8FAFC' },
  tableRowOdd: { backgroundColor: '#FFFFFF' },
  tableCell: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    minWidth: 58,
    justifyContent: 'center',
    alignItems: 'center',
    borderRightWidth: 1,
    borderRightColor: '#F1F5F9',
  },
  tableCellFirst: { minWidth: 66 },
  tableCellText: {
    color: '#334155',
    fontSize: 13,
    fontWeight: '500',
    textAlign: 'center',
  },
  tableSizeText: {
    color: '#9E0E26',
    fontSize: 13,
    fontWeight: '700',
    textAlign: 'center',
  },
  tableCellEmpty: { color: '#CBD5E1' },
  measurementGuide: {
    marginTop: 14,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  measurementTitle: {
    fontSize: 13,
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
    marginTop: 14,
    alignItems: 'center',
  },
  closeSizeGuideText: { color: '#FFFFFF', fontSize: 15, fontWeight: '600' },

  addressModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  addressModalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 18,
    maxHeight: '85%',
  },
  addressModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  addressModalTitle: { fontSize: 17, fontWeight: '700', color: '#0F172A' },
  addressModalClose: { padding: 4 },
  addressOption: {
    padding: 14,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    marginBottom: 10,
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
    gap: 10,
    flex: 1,
  },
  addressOptionText: { flex: 1 },
  addressOptionStreet: { fontSize: 14, fontWeight: '600', color: '#0F172A' },
  addressOptionDetail: { fontSize: 12, color: '#6B7280', marginTop: 2 },
  addressDefaultBadge: {
    marginTop: 8,
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 9,
    paddingVertical: 3,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  addressDefaultText: { color: '#16A34A', fontSize: 10, fontWeight: '600' },
  noAddressContainer: { alignItems: 'center', paddingVertical: 36 },
  noAddressTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0F172A',
    marginTop: 12,
  },
  noAddressSubtitle: {
    fontSize: 13,
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
    borderWidth: 1.2,
    borderColor: '#9E0E26',
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    marginBottom: 10,
  },
  addNewAddressText: { color: '#9E0E26', fontWeight: '600', fontSize: 14 },
});

export default ProductPage;