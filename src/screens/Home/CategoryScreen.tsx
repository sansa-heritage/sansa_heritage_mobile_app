import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Image,
  Dimensions,
  SafeAreaView,
  StyleSheet,
  TextInput,
  Modal,
  ScrollView,
  PanResponder,
  Pressable,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import MaterialIcons from "react-native-vector-icons/MaterialIcons";
import Ionicons from "react-native-vector-icons/Ionicons";
import { StackNavigationProp } from "@react-navigation/stack";
import { useNavigation, useRoute } from '@react-navigation/native';
import { addToFavoritesList, removeFromFavoritesList } from "../../api/favoriteApi";
import { addToCart } from "../../api/cartApi";
import { RootStackParamList } from "../../models/types";
import LoadingService from '../../services/LoadingService';
import config from '../../config/config';
import AsyncStorage from '@react-native-async-storage/async-storage';
import eventBus from '../../services/eventBus';
// ✅ FIXED — added snackbar
import { snackbar } from '../../components/common/Snackbar';

const { width } = Dimensions.get("window");
const BASE_URL = config.baseURL || 'https://ecappbe-sanasaheritages-projects.vercel.app';
const BRAND_COLOR = '#9E0E26';
const BOTTOM_NAV_HEIGHT = 60;
const CARD_H_PADDING = 16;
const CARD_GAP = 12;
const CARD_WIDTH = (width - CARD_H_PADDING * 2 - CARD_GAP) / 2;
const CARD_IMG_HEIGHT = Math.round(CARD_WIDTH * 1.25);

/* ================= IMAGE HELPER ================= */
const getImageSource = (item: any) => {
  if (item.images && Array.isArray(item.images) && item.images.length > 0) {
    const image = item.images[0];
    if (image) {
      if (image.startsWith('data:image')) return { uri: image };
      if (image.startsWith('http')) return { uri: image };
      if (image.startsWith('/')) return { uri: `${BASE_URL.replace(/\/$/, '')}${image}` };
      return { uri: `${BASE_URL.replace(/\/$/, '')}/${image}` };
    }
  }
  if (item.image) {
    if (item.image.startsWith('data:image')) return { uri: item.image };
    if (item.image.startsWith('http')) return { uri: item.image };
    if (item.image.startsWith('/')) return { uri: `${BASE_URL.replace(/\/$/, '')}${item.image}` };
    return { uri: `${BASE_URL.replace(/\/$/, '')}/${item.image}` };
  }
  return require("../../../assets/images/logo.png");
};

/* ================= TITLE SPLITTER ================= */
const splitTitle = (fullName: string, boldWords = 2) => {
  const words = (fullName || '').trim().split(/\s+/);
  if (words.length <= boldWords) {
    return { boldPart: fullName || '', normalPart: '' };
  }
  return {
    boldPart: words.slice(0, boldWords).join(' '),
    normalPart: words.slice(boldWords).join(' '),
  };
};

/* ================= FILTER CONSTANTS ================= */
const PRICE_RANGES = [
  { id: 'all', label: 'All Prices', min: 0, max: Infinity },
  { id: 'under1000', label: 'Under ₹1,000', min: 0, max: 1000 },
  { id: '1000-2500', label: '₹1,000 - ₹2,500', min: 1000, max: 2500 },
  { id: '2500-5000', label: '₹2,500 - ₹5,000', min: 2500, max: 5000 },
  { id: 'above5000', label: 'Above ₹5,000', min: 5000, max: Infinity },
];

const RATING_OPTIONS = [
  { id: 'all', label: 'All Ratings', value: 0 },
  { id: '4plus', label: '4★ & Above', value: 4 },
  { id: '3plus', label: '3★ & Above', value: 3 },
  { id: '2plus', label: '2★ & Above', value: 2 },
];

const SORT_OPTIONS = [
  { id: 'default', label: 'Relevance' },
  { id: 'low-high', label: 'Price: Low to High' },
  { id: 'high-low', label: 'Price: High to Low' },
  { id: 'discount', label: 'Discount %' },
  { id: 'rating', label: 'Customer Rating' },
];

const SIZE_OPTIONS = ['XS', 'S', 'M', 'L', 'XL', 'XXL', '3XL'];

const COLOR_OPTIONS = [
  { id: 'all', label: 'All', color: null, multi: true },
  { id: 'red', label: 'Red', color: '#B00020' },
  { id: 'pink', label: 'Pink', color: '#F8BBD0' },
  { id: 'green', label: 'Green', color: '#1B5E20' },
  { id: 'blue', label: 'Blue', color: '#1565C0' },
  { id: 'yellow', label: 'Yellow', color: '#FFD600' },
];

const MIN_PRICE = 0;
const MAX_PRICE = 10000;

export default function CategoryScreen() {
  const route = useRoute();
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();
  const { mainCategory, displayTitle } = route.params as { mainCategory: string; displayTitle?: string };

  const insets = useSafeAreaInsets();

  const [products, setProducts] = useState<any[]>([]);
  const [allProducts, setAllProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [selectedCategory, setSelectedCategory] = useState("");
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState("");
  const [filterModalVisible, setFilterModalVisible] = useState(false);

  const [selectedPriceRange, setSelectedPriceRange] = useState('all');
  const [selectedRating, setSelectedRating] = useState('all');
  const [selectedSort, setSelectedSort] = useState('default');

  const [selectedSizes, setSelectedSizes] = useState<string[]>([]);
  const [selectedColor, setSelectedColor] = useState<string>('all');
  const [priceStart, setPriceStart] = useState<number>(MIN_PRICE);
  const [priceEnd, setPriceEnd] = useState<number>(MAX_PRICE);

  const [openSection, setOpenSection] = useState<{
    category: boolean;
    price: boolean;
    size: boolean;
    color: boolean;
  }>({ category: true, price: true, size: true, color: true });

  const [favorites, setFavorites] = useState<string[]>([]);

  const getDisplayTitle = () => {
    if (displayTitle) return displayTitle;
    if (mainCategory === "New Arrival") return "New Arrivals";
    if (mainCategory === "Trending") return "Trending Now";
    return mainCategory;
  };

  useEffect(() => {
    navigation.setParams({ displayTitle: getDisplayTitle() });
  }, [displayTitle, mainCategory]);

  useEffect(() => {
    loadFavorites();
  }, []);

  const loadFavorites = async () => {
    try {
      const stored = await AsyncStorage.getItem('favorites');
      if (stored) setFavorites(JSON.parse(stored));
    } catch (err) {
      console.error('Error loading favorites:', err);
    }
  };

  // ✅ FIXED — no more Alert; api layer shows the snackbar
  const toggleFavorite = async (id: string) => {
    try {
      const isAlreadyFav = favorites.includes(id);
      if (isAlreadyFav) {
        await removeFromFavoritesList(id);
        const updated = favorites.filter(fav => fav !== id);
        setFavorites(updated);
        await AsyncStorage.setItem('favorites', JSON.stringify(updated));
      } else {
        await addToFavoritesList(id);
        const updated = [...favorites, id];
        setFavorites(updated);
        await AsyncStorage.setItem('favorites', JSON.stringify(updated));
      }
      eventBus.emit('ITEM_REMOVED', { id: 123 });
      eventBus.emit('FAVORITE_UPDATED', {});
    } catch (err) {
      console.error('Error toggling favorite:', err);
      // ✅ api layer already shows the error snackbar
    }
  };

  // ✅ FIXED — Alert.alert → snackbar
  const handleAddToCart = async (item: any) => {
    try {
      const token = await AsyncStorage.getItem('authToken');
      if (!token) {
        snackbar.warning('Please login to add items to cart', 'Login Required');
        return;
      }
      LoadingService.show('Adding to cart...');
      const colorValue = item.colors?.[0]?._id || item.colors?.[0]?.name || null;
      const sizeValue = item.sizes?.[0]?._id || item.sizes?.[0]?.label || null;
      await addToCart(item._id, 1, colorValue, sizeValue);
      // ✅ no snackbar here — api layer already fired "Item added to cart"
      eventBus.emit('CART_UPDATED', {});
      eventBus.emit('ITEM_REMOVED', { id: 123 });
    } catch (error: any) {
      console.error('Add to cart error:', error);
      // ✅ no snackbar here — api layer already fired the error
    } finally {
      LoadingService.hide();
    }
  };

  const redirectToProductDetails = (id: string) => {
    navigation.navigate('ProductDetails', { itemId: id });
  };

  const fetchCategories = async () => {
    try {
      const token = await AsyncStorage.getItem('authToken');
      const response = await fetch(`${config.baseURL}api/master/category`, {
        headers: token ? { 'Authorization': `Bearer ${token}` } : {},
      });
      const data = await response.json();
      const activeCategories = data.filter((cat: any) => cat.isActive === true);
      setCategories([{ _id: '', name: 'All', isActive: true }, ...activeCategories]);
    } catch (error) {
      console.error('Error fetching categories:', error);
      setCategories([
        { _id: '', name: 'All' },
        { _id: '1', name: 'Sarees' },
        { _id: '2', name: 'Kurtis' },
        { _id: '3', name: 'Lehengas' },
        { _id: '4', name: 'Ethnic Sets' },
        { _id: '5', name: 'Dupattas' },
      ]);
    }
  };

  const fetchProducts = async () => {
    try {
      setLoading(true);
      LoadingService.show('Loading products...');
      const token = await AsyncStorage.getItem('authToken');
      const headers: any = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const params: any = {};
      if (mainCategory === "Trending") params.isTrending = true;
      else if (mainCategory === "New Arrival") params.isNewArrival = true;
      else params.category = mainCategory;

      if (searchText && searchText.trim()) params.search = searchText.trim();
      if (selectedCategory && selectedCategory !== 'All' && selectedCategory !== '') {
        params.category = selectedCategory;
      }

      const queryString = Object.keys(params)
        .map(key => `${encodeURIComponent(key)}=${encodeURIComponent(params[key])}`)
        .join("&");

      const url = `${config.baseURL}api/products${queryString ? "?" + queryString : ""}`;
      const res = await fetch(url, { headers });
      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
      const data = await res.json();
      setAllProducts(data || []);
      setProducts(data || []);
    } catch (err) {
      console.error(err);
      setAllProducts([]);
      setProducts([]);
    } finally {
      setLoading(false);
      LoadingService.hide();
    }
  };

  useEffect(() => {
    fetchCategories();
    fetchProducts();
  }, [mainCategory]);

  const handleSearchSubmit = () => fetchProducts();
  const handleClearSearch = () => {
    setSearchText("");
    fetchProducts();
  };

  /* ================= LIVE FILTER COUNT ================= */
  const filteredPreview = (() => {
    let filtered = [...allProducts];

    if (priceStart > MIN_PRICE || priceEnd < MAX_PRICE) {
      filtered = filtered.filter(p => {
        const price = Number(p.price || 0);
        const disc = Number(p.discountPercent || 0);
        const finalPrice = disc > 0 ? price - (price * disc) / 100 : price;
        return finalPrice >= priceStart && finalPrice <= priceEnd;
      });
    } else {
      const priceRange = PRICE_RANGES.find(p => p.id === selectedPriceRange);
      if (priceRange && priceRange.id !== 'all') {
        filtered = filtered.filter(p => {
          const price = Number(p.price || 0);
          const disc = Number(p.discountPercent || 0);
          const finalPrice = disc > 0 ? price - (price * disc) / 100 : price;
          return finalPrice >= priceRange.min && finalPrice <= priceRange.max;
        });
      }
    }

    const ratingOpt = RATING_OPTIONS.find(r => r.id === selectedRating);
    if (ratingOpt && ratingOpt.value > 0) {
      filtered = filtered.filter(p => Number(p.rating || 0) >= ratingOpt.value);
    }

    if (selectedSizes.length > 0) {
      filtered = filtered.filter(p => {
        const sizes = (p.sizes || []).map((s: any) =>
          String(s?.label || s?.name || s).toUpperCase()
        );
        return selectedSizes.some(sz => sizes.includes(sz));
      });
    }

    if (selectedColor !== 'all') {
      filtered = filtered.filter(p => {
        const colors = (p.colors || []).map((c: any) =>
          String(c?.name || c?.label || c).toLowerCase()
        );
        return colors.includes(selectedColor.toLowerCase());
      });
    }

    return filtered;
  })();

  const filterCount = filteredPreview.length;

  const applyClientFilters = () => {
    let filtered = [...filteredPreview];
    switch (selectedSort) {
      case 'low-high':
        filtered.sort((a, b) => Number(a.price || 0) - Number(b.price || 0));
        break;
      case 'high-low':
        filtered.sort((a, b) => Number(b.price || 0) - Number(a.price || 0));
        break;
      case 'discount':
        filtered.sort((a, b) => Number(b.discountPercent || 0) - Number(a.discountPercent || 0));
        break;
      case 'rating':
        filtered.sort((a, b) => Number(b.rating || 0) - Number(a.rating || 0));
        break;
      default:
        break;
    }
    setProducts(filtered);
    setFilterModalVisible(false);
  };

  const resetFilters = () => {
    setSelectedCategory('');
    setSelectedPriceRange('all');
    setSelectedRating('all');
    setSelectedSort('default');
    setSelectedSizes([]);
    setSelectedColor('all');
    setPriceStart(MIN_PRICE);
    setPriceEnd(MAX_PRICE);
    setProducts(allProducts);
  };

  const toggleSize = (size: string) => {
    setSelectedSizes(prev =>
      prev.includes(size) ? prev.filter(s => s !== size) : [...prev, size]
    );
  };

  const toggleSection = (key: 'category' | 'price' | 'size' | 'color') => {
    setOpenSection(prev => ({ ...prev, [key]: !prev[key] }));
  };

  /* ================= PRODUCT CARD ================= */
  const renderProductCard = ({ item }: { item: any }) => {
    const isFav = favorites.includes(item._id);
    const originalPrice = Number(item.price || 0);
    const discountPercent = Number(item.discountPercent || 0);
    const discountedPrice =
      discountPercent > 0
        ? originalPrice - (originalPrice * discountPercent) / 100
        : originalPrice;
    const rating = Number(item.rating || 0);
    const ratingCount = Number(item.reviewCount || item.reviews || 0);
    const outOfStock = item.stock === 0;
    const { boldPart, normalPart } = splitTitle(item.name || 'Product');

    return (
      <TouchableOpacity
        style={styles.productCard}
        onPress={() => redirectToProductDetails(item._id)}
        activeOpacity={0.85}
      >
        {discountPercent >= 20 && (
          <View style={styles.megaDropRow}>
            <View style={styles.megaDropBadge}>
              <Text style={styles.megaDropText}>Mega Price Drop</Text>
            </View>
          </View>
        )}

        <View style={styles.imageWrapper}>
          <Image source={getImageSource(item)} style={styles.productImage} />

          {outOfStock && (
            <>
              <View style={styles.oosOverlay} />
              <View style={styles.oosBadge}>
                <Text style={styles.oosBadgeText}>OUT OF STOCK</Text>
              </View>
            </>
          )}

          <TouchableOpacity
            style={styles.favoriteIcon}
            onPress={() => toggleFavorite(item._id)}
            activeOpacity={0.7}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <MaterialIcons
              name="favorite"
              size={20}
              style={
                isFav
                  ? { color: BRAND_COLOR }
                  : {
                      color: '#FFFFFF',
                      textShadowColor: '#000',
                      textShadowOffset: { width: 0, height: 0 },
                      textShadowRadius: 2,
                    }
              }
            />
          </TouchableOpacity>

          {rating > 0 && (
            <View style={styles.ratingPill}>
              <Text style={styles.ratingPillText}>{rating.toFixed(1)}</Text>
              <MaterialIcons name="star" size={10} color="#1F9E4C" />
              {ratingCount > 0 && (
                <>
                  <View style={styles.ratingDivider} />
                  <Text style={styles.ratingCount}>
                    {ratingCount > 999 ? `${Math.floor(ratingCount / 1000)}k` : ratingCount}
                  </Text>
                </>
              )}
            </View>
          )}

          <TouchableOpacity
            style={styles.addPill}
            activeOpacity={0.85}
            onPress={() => {
              if (outOfStock) redirectToProductDetails(item._id);
              else handleAddToCart(item);
            }}
          >
            <Ionicons
              name={outOfStock ? 'repeat-outline' : 'bag-add-outline'}
              size={14}
              color={BRAND_COLOR}
            />
          </TouchableOpacity>
        </View>

        <View style={styles.productInfo}>
          <Text numberOfLines={2} style={styles.productTitle}>
            <Text style={styles.productTitleBold}>{boldPart}</Text>
            {normalPart ? <Text style={styles.productTitleNormal}> {normalPart}</Text> : null}
          </Text>

          {discountPercent >= 20 && (
            <View style={styles.megaDropInline}>
              <Text style={styles.megaDropInlineText}>Mega Price Drop</Text>
            </View>
          )}

          <View style={styles.priceRow}>
            <Text style={styles.strikePrice}>₹{originalPrice}</Text>
            <Text style={styles.finalPrice}>₹{discountedPrice.toFixed(0)}</Text>
            {discountPercent > 0 && (
              <Text style={styles.discountText}>{discountPercent}% OFF</Text>
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  /* ================= PRICE SLIDER ================= */
  const SLIDER_PADDING = 10;
  const [sliderWidth, setSliderWidth] = useState(0);

  const priceToX = (price: number) => {
    if (sliderWidth === 0) return 0;
    return SLIDER_PADDING +
      ((price - MIN_PRICE) / (MAX_PRICE - MIN_PRICE)) * (sliderWidth - SLIDER_PADDING * 2);
  };

  const xToPrice = (x: number) => {
    const ratio = (x - SLIDER_PADDING) / (sliderWidth - SLIDER_PADDING * 2);
    const clamped = Math.max(0, Math.min(1, ratio));
    return Math.round(MIN_PRICE + clamped * (MAX_PRICE - MIN_PRICE));
  };

  const startPan = React.useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: (_, g) => {
        const p = xToPrice(g.x0);
        const dStart = Math.abs(p - priceStart);
        const dEnd = Math.abs(p - priceEnd);
        (startPan as any)._activeThumb = dStart < dEnd ? 'start' : 'end';
      },
      onPanResponderMove: (_, g) => {
        const p = xToPrice(g.moveX);
        const active = (startPan as any)._activeThumb;
        if (active === 'start') setPriceStart(Math.min(p, priceEnd - 100));
        else setPriceEnd(Math.max(p, priceStart + 100));
      },
    })
  ).current;

  if (loading && products.length === 0) {
    return <View style={styles.loadingContainer} />;
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* SEARCH BAR + FILTER */}
        <View style={styles.searchRow}>
          <View style={styles.searchBarWrap}>
            <Image
              source={require('../../../assets/images/icon.png')}
              style={styles.searchLogo}
              resizeMode="contain"
            />
            <TextInput
              style={styles.searchInput}
              placeholder="Search products..."
              placeholderTextColor="#9CA3AF"
              value={searchText}
              onChangeText={setSearchText}
              returnKeyType="search"
              onSubmitEditing={handleSearchSubmit}
            />
            {searchText.length > 0 && (
              <TouchableOpacity onPress={handleClearSearch} hitSlop={8} style={{ marginRight: 6 }}>
                <MaterialIcons name="close" size={16} color="#888" />
              </TouchableOpacity>
            )}
            <TouchableOpacity onPress={handleSearchSubmit} hitSlop={8}>
              <MaterialIcons name="search" size={18} color="#111" />
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={styles.filterBtn}
            activeOpacity={0.7}
            onPress={() => setFilterModalVisible(true)}
          >
            <MaterialIcons name="tune" size={18} color="#111" />
          </TouchableOpacity>
        </View>

        {products.length > 0 ? (
          <FlatList
            data={products}
            keyExtractor={(item, index) => `${item._id}-${index}`}
            numColumns={2}
            columnWrapperStyle={styles.columnWrapper}
            renderItem={renderProductCard}
            showsVerticalScrollIndicator={true}
            contentContainerStyle={styles.listContent}
            style={styles.flatList}
          />
        ) : (
          <View style={styles.emptyContainer}>
            <Ionicons name="search-outline" size={64} color="#D1D5DB" />
            <Text style={styles.emptyTitle}>No Products Found</Text>
            <Text style={styles.emptySubtitle}>
              {searchText ? `No results for "${searchText}"` : "Try selecting a different filter"}
            </Text>
            <TouchableOpacity
              style={styles.clearFilterBtn}
              onPress={() => {
                resetFilters();
                setSearchText("");
                fetchProducts();
              }}
            >
              <Text style={styles.clearFilterBtnText}>Clear Filters</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* ✅ FILTER MODAL — now closes on tap outside */}
        <Modal
          visible={filterModalVisible}
          transparent
          animationType="slide"
          onRequestClose={() => setFilterModalVisible(false)}
        >
          {/* ✅ FIXED — backdrop Pressable closes the modal on tap outside */}
          <Pressable
            style={styles.modalOverlay}
            onPress={() => setFilterModalVisible(false)}
          >
            {/* Stop propagation when tapping inside the sheet */}
            <Pressable
              style={[styles.modalSheet, { maxHeight: '88%' }]}
              onPress={(e) => e.stopPropagation()}
            >
              {/* Top drag handle */}
              <View style={styles.dragHandleWrap}>
                <View style={styles.dragHandle} />
              </View>

              {/* Header */}
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Filter</Text>
                <TouchableOpacity style={styles.resetRow} onPress={resetFilters} activeOpacity={0.7}>
                  <MaterialIcons name="refresh" size={16} color={BRAND_COLOR} />
                  <Text style={styles.resetText}>Reset All</Text>
                </TouchableOpacity>
              </View>

              <ScrollView
                style={styles.modalScroll}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingBottom: 8 }}
              >
                {/* ── CATEGORY ── */}
                <TouchableOpacity
                  style={styles.sectionHeader}
                  onPress={() => toggleSection('category')}
                  activeOpacity={0.7}
                >
                  <View style={styles.sectionLeft}>
                    <View style={styles.iconCircle}>
                      <Ionicons name="shirt-outline" size={15} color={BRAND_COLOR} />
                    </View>
                    <Text style={styles.sectionTitle}>Category</Text>
                  </View>
                  <MaterialIcons
                    name={openSection.category ? 'keyboard-arrow-up' : 'keyboard-arrow-down'}
                    size={20}
                    color="#111"
                  />
                </TouchableOpacity>

                {openSection.category && (
                  <View style={styles.chipsWrap}>
                    {categories.map(cat => {
                      const isActive =
                        selectedCategory === cat._id ||
                        (cat._id === '' && !selectedCategory);
                      return (
                        <TouchableOpacity
                          key={cat._id || 'all'}
                          style={[styles.chip, isActive && styles.chipActive]}
                          onPress={() => setSelectedCategory(cat._id || '')}
                          activeOpacity={0.7}
                        >
                          <Text style={[styles.chipText, isActive && styles.chipTextActive]}>
                            {cat.name}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                )}

                <View style={styles.divider} />

                {/* ── PRICE RANGE ── */}
                <TouchableOpacity
                  style={styles.sectionHeader}
                  onPress={() => toggleSection('price')}
                  activeOpacity={0.7}
                >
                  <View style={styles.sectionLeft}>
                    <View style={styles.iconCircle}>
                      <Text style={styles.rupeeIcon}>₹</Text>
                    </View>
                    <Text style={styles.sectionTitle}>Price Range</Text>
                  </View>
                  <MaterialIcons
                    name={openSection.price ? 'keyboard-arrow-up' : 'keyboard-arrow-down'}
                    size={20}
                    color="#111"
                  />
                </TouchableOpacity>

                {openSection.price && (
                  <>
                    <View
                      style={styles.sliderWrap}
                      onLayout={e => setSliderWidth(e.nativeEvent.layout.width)}
                    >
                      <View style={styles.sliderTrack} />
                      <View
                        style={[
                          styles.sliderActiveTrack,
                          {
                            left: priceToX(priceStart),
                            width: Math.max(0, priceToX(priceEnd) - priceToX(priceStart)),
                          },
                        ]}
                      />
                      <View
                        style={[styles.sliderThumb, { left: priceToX(priceStart) - 9 }]}
                        {...startPan.panHandlers}
                      />
                      <View
                        style={[styles.sliderThumb, { left: priceToX(priceEnd) - 9 }]}
                        {...startPan.panHandlers}
                      />
                    </View>

                    <View style={styles.priceLabelsRow}>
                      <Text style={styles.priceLabel}>₹ {priceStart.toLocaleString('en-IN')}</Text>
                      <Text style={styles.priceLabel}>₹ {priceEnd.toLocaleString('en-IN')}</Text>
                    </View>

                    <View style={styles.chipsWrap}>
                      {PRICE_RANGES.filter(r => r.id !== 'all').map(range => {
                        const isActive = selectedPriceRange === range.id;
                        return (
                          <TouchableOpacity
                            key={range.id}
                            style={[styles.chipSm, isActive && styles.chipSmActive]}
                            onPress={() => {
                              setSelectedPriceRange(range.id);
                              setPriceStart(range.min);
                              setPriceEnd(range.max === Infinity ? MAX_PRICE : range.max);
                            }}
                            activeOpacity={0.7}
                          >
                            <Text style={[styles.chipSmText, isActive && styles.chipSmTextActive]}>
                              {range.label}
                            </Text>
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  </>
                )}

                <View style={styles.divider} />

                {/* ── SIZE ── */}
                <TouchableOpacity
                  style={styles.sectionHeader}
                  onPress={() => toggleSection('size')}
                  activeOpacity={0.7}
                >
                  <View style={styles.sectionLeft}>
                    <View style={styles.iconCircle}>
                      <MaterialIcons name="straighten" size={15} color={BRAND_COLOR} />
                    </View>
                    <Text style={styles.sectionTitle}>Size</Text>
                  </View>
                  <MaterialIcons
                    name={openSection.size ? 'keyboard-arrow-up' : 'keyboard-arrow-down'}
                    size={20}
                    color="#111"
                  />
                </TouchableOpacity>

                {openSection.size && (
                  <View style={styles.sizeRow}>
                    {SIZE_OPTIONS.map(size => {
                      const isActive = selectedSizes.includes(size);
                      return (
                        <TouchableOpacity
                          key={size}
                          style={[styles.sizeChip, isActive && styles.sizeChipActive]}
                          onPress={() => toggleSize(size)}
                          activeOpacity={0.7}
                        >
                          <Text style={[styles.sizeChipText, isActive && styles.sizeChipTextActive]}>
                            {size}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                )}

                <View style={styles.divider} />

                {/* ── COLOR ── */}
                <TouchableOpacity
                  style={styles.sectionHeader}
                  onPress={() => toggleSection('color')}
                  activeOpacity={0.7}
                >
                  <View style={styles.sectionLeft}>
                    <View style={styles.iconCircle}>
                      <Ionicons name="color-palette-outline" size={15} color={BRAND_COLOR} />
                    </View>
                    <Text style={styles.sectionTitle}>Color</Text>
                  </View>
                  <MaterialIcons
                    name={openSection.color ? 'keyboard-arrow-up' : 'keyboard-arrow-down'}
                    size={20}
                    color="#111"
                  />
                </TouchableOpacity>

                {openSection.color && (
                  <View style={styles.colorRow}>
                    {COLOR_OPTIONS.map(c => {
                      const isActive = selectedColor === c.id;
                      return (
                        <TouchableOpacity
                          key={c.id}
                          style={styles.colorItem}
                          onPress={() => setSelectedColor(c.id)}
                          activeOpacity={0.7}
                        >
                          <View style={[styles.colorCircleOuter, isActive && styles.colorCircleOuterActive]}>
                            {c.multi ? (
                              <View style={styles.colorMulti}>
                                <View style={[styles.colorMultiHalf, { backgroundColor: '#FF0000' }]} />
                                <View style={[styles.colorMultiHalf, { backgroundColor: '#FFD600' }]} />
                                <View style={[styles.colorMultiHalf, { backgroundColor: '#00AA00' }]} />
                                <View style={[styles.colorMultiHalf, { backgroundColor: '#0066FF' }]} />
                              </View>
                            ) : (
                              <View
                                style={[
                                  styles.colorCircle,
                                  { backgroundColor: c.color || '#fff' },
                                  c.id === 'white' && { borderWidth: 1, borderColor: '#DDD' },
                                ]}
                              />
                            )}
                          </View>
                          <Text style={[styles.colorLabel, isActive && styles.colorLabelActive]}>
                            {c.label}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                )}

                <View style={{ height: 4 }} />
              </ScrollView>

              {/* Footer with safe area bottom inset — buttons NEVER hide behind nav bar */}
              <View
                style={[
                  styles.modalFooter,
                  { paddingBottom: Math.max(insets.bottom, 12) + 6 },
                ]}
              >
                <TouchableOpacity style={styles.clearAllBtn} onPress={resetFilters} activeOpacity={0.8}>
                  <Text style={styles.clearAllBtnText}>Clear All</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.applyBtn} onPress={applyClientFilters} activeOpacity={0.85}>
                  <Text style={styles.applyBtnText}>Apply Filters ({filterCount})</Text>
                </TouchableOpacity>
              </View>
            </Pressable>
          </Pressable>
        </Modal>
      </View>
    </SafeAreaView>
  );
}

/* ================= STYLES ================= */
const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#F8F8F8' },
  container: { flex: 1, backgroundColor: '#F8F8F8', paddingHorizontal: CARD_H_PADDING },
  flatList: { flex: 1 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' },

  /* Search */
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 10,
    backgroundColor: '#F8F8F8',
  },
  searchBarWrap: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    height: 42,
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  searchLogo: { width: 20, height: 20, marginRight: 6 },
  searchInput: { flex: 1, fontSize: 13, color: '#111', paddingVertical: 0 },
  filterBtn: {
    width: 42,
    height: 42,
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.2,
    borderColor: '#111',
    justifyContent: 'center',
    alignItems: 'center',
  },

  columnWrapper: { justifyContent: 'space-between' },
  listContent: { paddingTop: 4, paddingBottom: BOTTOM_NAV_HEIGHT + 24 },

  /* Product Card */
  productCard: {
    backgroundColor: '#fff',
    borderRadius: 8,
    marginBottom: 14,
    width: CARD_WIDTH,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },
  megaDropRow: { flexDirection: 'row', marginBottom: 5, paddingHorizontal: 2 },
  megaDropBadge: {
    backgroundColor: BRAND_COLOR,
    borderRadius: 3,
    paddingHorizontal: 7,
    paddingVertical: 2,
  },
  megaDropText: { color: '#fff', fontSize: 10, fontWeight: '700' },
  imageWrapper: { position: 'relative' },
  productImage: {
    width: '100%',
    height: CARD_IMG_HEIGHT,
    backgroundColor: '#F5F5F5',
    resizeMode: 'cover',
  },
  oosOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(255,255,255,0.55)' },
  oosBadge: {
    position: 'absolute',
    top: '46%',
    left: 0,
    right: 0,
    backgroundColor: 'rgba(90,110,120,0.65)',
    paddingVertical: 5,
    alignItems: 'center',
  },
  oosBadgeText: { color: '#fff', fontSize: 11, fontWeight: '800', letterSpacing: 0.6 },
  favoriteIcon: { position: 'absolute', top: 6, right: 6, padding: 2 },
  ratingPill: {
    position: 'absolute',
    bottom: 6,
    left: 6,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.95)',
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 3,
    gap: 2,
  },
  ratingPillText: { color: '#111', fontSize: 10, fontWeight: '700' },
  ratingDivider: { width: 1, height: 9, backgroundColor: '#D0D0D0', marginHorizontal: 2 },
  ratingCount: { color: '#666', fontSize: 10, fontWeight: '500' },
  addPill: {
    position: 'absolute',
    bottom: -12,
    right: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFF0F3',
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 4,
    zIndex: 2,
  },
  productInfo: { paddingTop: 18, paddingHorizontal: 7, paddingBottom: 9 },
  productTitle: { fontSize: 12, color: '#111', marginBottom: 5, lineHeight: 16 },
  productTitleBold: { fontWeight: '700', color: '#111' },
  productTitleNormal: { fontWeight: '400', color: '#333' },
  megaDropInline: {
    alignSelf: 'flex-start',
    backgroundColor: '#FFF0F3',
    borderRadius: 3,
    paddingHorizontal: 5,
    paddingVertical: 2,
    marginBottom: 5,
  },
  megaDropInlineText: { color: BRAND_COLOR, fontSize: 9, fontWeight: '700' },
  priceRow: { flexDirection: 'row', alignItems: 'center', gap: 5, flexWrap: 'wrap' },
  strikePrice: { fontSize: 11, color: '#999', textDecorationLine: 'line-through' },
  finalPrice: { fontSize: 14, fontWeight: '800', color: '#111' },
  discountText: { fontSize: 11, color: '#9E0E26', fontWeight: '700' },

  /* Empty */
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    marginTop: -40,
  },
  emptyTitle: { fontSize: 16, fontWeight: '600', color: '#151515', marginTop: 12 },
  emptySubtitle: { fontSize: 12, color: '#94A3B8', textAlign: 'center', marginTop: 6 },
  clearFilterBtn: {
    marginTop: 16,
    backgroundColor: '#9E0E26',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  clearFilterBtnText: { color: '#fff', fontWeight: '600', fontSize: 12 },

  /* ── Filter Modal ── */
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    overflow: 'hidden',
  },
  dragHandleWrap: { alignItems: 'center', paddingTop: 8, paddingBottom: 2 },
  dragHandle: { width: 36, height: 4, borderRadius: 2, backgroundColor: '#D9D9D9' },

  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 6,
    paddingBottom: 10,
  },
  modalTitle: { fontSize: 12, fontWeight: '800', color: '#111' },
  resetRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  resetText: { fontSize: 12, color: BRAND_COLOR, fontWeight: '700' },

  modalScroll: { paddingHorizontal: 16 },

  /* Section header */
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
  },
  sectionLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  iconCircle: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#FCE9ED',
    justifyContent: 'center',
    alignItems: 'center',
  },
  rupeeIcon: { fontSize: 14, fontWeight: '800', color: BRAND_COLOR },
  sectionTitle: { fontSize: 14, fontWeight: '700', color: '#111' },

  divider: { height: 1, backgroundColor: '#F0F0F0', marginVertical: 2 },

  /* Category chips */
  chipsWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 6 },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#F5F5F5',
    minWidth: 'auto',
    alignItems: 'center',
  },
  chipActive: {
    backgroundColor: '#FCE9ED',
    borderWidth: 1.2,
    borderColor: BRAND_COLOR,
  },
  chipText: { fontSize: 9.5, color: '#333', fontWeight: '600' },
  chipTextActive: { color: BRAND_COLOR, fontWeight: '800' },

  /* Small price chips */
  chipSm: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#F5F5F5',
  },
  chipSmActive: {
    backgroundColor: '#FCE9ED',
    borderWidth: 1.2,
    borderColor: BRAND_COLOR,
  },
  chipSmText: { fontSize: 11.5, color: '#333', fontWeight: '600' },
  chipSmTextActive: { color: BRAND_COLOR, fontWeight: '800' },

  /* Slider */
  sliderWrap: { height: 34, marginTop: 4, justifyContent: 'center', position: 'relative' },
  sliderTrack: {
    position: 'absolute',
    left: 10,
    right: 10,
    height: 3,
    backgroundColor: '#F2C4CE',
    borderRadius: 2,
  },
  sliderActiveTrack: {
    position: 'absolute',
    height: 3,
    backgroundColor: BRAND_COLOR,
    borderRadius: 2,
  },
  sliderThumb: {
    position: 'absolute',
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: BRAND_COLOR,
    borderWidth: 2,
    borderColor: '#fff',
    elevation: 3,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 1 },
  },
  priceLabelsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
    paddingHorizontal: 4,
  },
  priceLabel: { fontSize: 9, color: '#555', fontWeight: '600' },

  /* Size */
  sizeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 6 },
  sizeChip: {
    width: 30,
    height: 30,
    borderRadius: 8,
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sizeChipActive: {
    backgroundColor: '#FCE9ED',
    borderWidth: 1.2,
    borderColor: BRAND_COLOR,
  },
  sizeChipText: { fontSize: 9.5, color: '#333', fontWeight: '700' },
  sizeChipTextActive: { color: BRAND_COLOR, fontWeight: '800' },

  /* Colors */
  colorRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingVertical: 4,
    rowGap: 10,
  },
  colorItem: { alignItems: 'center', width: 50 },
  colorCircleOuter: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  colorCircleOuterActive: { borderColor: BRAND_COLOR },
  colorCircle: { width: 26, height: 26, borderRadius: 13 },
  colorMulti: {
    width: 26,
    height: 26,
    borderRadius: 13,
    overflow: 'hidden',
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  colorMultiHalf: { width: 13, height: 13 },
  colorLabel: { fontSize: 10.5, color: '#333', marginTop: 3, fontWeight: '600' },
  colorLabelActive: { color: BRAND_COLOR, fontWeight: '800' },

  /* Footer */
  modalFooter: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingTop: 12,
    gap: 10,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
    backgroundColor: '#FFFFFF',
  },
  clearAllBtn: {
    flex: 1,
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: BRAND_COLOR,
    backgroundColor: '#FFFFFF',
  },
  clearAllBtnText: { color: BRAND_COLOR, fontSize: 10, fontWeight: '700' },
  applyBtn: {
    flex: 1,
    backgroundColor: BRAND_COLOR,
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  applyBtnText: { color: '#FFFFFF', fontSize: 10, fontWeight: '700' },
});