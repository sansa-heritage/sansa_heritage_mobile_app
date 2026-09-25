import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  FlatList,
  Modal,
  Dimensions,
  TextInput,
  Platform,
  StatusBar,
} from 'react-native';
import {
  SafeAreaView,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import Ionicons from 'react-native-vector-icons/Ionicons';
import Slider from '@react-native-community/slider';
import { StyleSheet } from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useNavigation } from '@react-navigation/native';
import { addToFavoritesList, getFavoriteProducts } from '../../api/favoriteApi';
import { RootStackParamList } from '../../models/types';
import eventBus from '../../services/eventBus';
import AsyncStorage from '@react-native-async-storage/async-storage';
import config from '../../config/config';
import LoadingService from '../../services/LoadingService';
import { getActiveBanners } from '../../api/bannerApi';

const { width } = Dimensions.get('window');

const BASE_URL =
  config.baseURL || 'https://ecappbe-sanasaheritages-projects.vercel.app';

// ============================================
// TITLE SPLITTER — bold first N words, rest normal
// ============================================
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

// ============================================
// TOP TABS — AJIO style
// ============================================
interface TopTabsProps {
  activeTab: 'home' | 'premium';
  onTabChange: (tab: 'home' | 'premium') => void;
}

const TopTabs: React.FC<TopTabsProps> = ({ activeTab, onTabChange }) => {
  return (
    <View style={styles.topTabsBar}>
      <View style={styles.topTabsRow}>
        <TouchableOpacity
          style={[
            styles.topTab,
            styles.topTabLeft,
            activeTab === 'home' && styles.topTabActive,
          ]}
          onPress={() => onTabChange('home')}
          activeOpacity={0.9}
        >
          <View style={styles.topTabInner}>
            <MaterialIcons
              name="storefront"
              size={16}
              color="#9E0E26"
              style={{ marginRight: 6 }}
            />
            <Text
              style={[
                styles.topTabText,
                activeTab === 'home' && styles.topTabTextActive,
              ]}
            >
              SansaHome
            </Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.topTab,
            styles.topTabRight,
            activeTab === 'premium' && styles.topTabActive,
          ]}
          onPress={() => onTabChange('premium')}
          activeOpacity={0.9}
        >
          <View style={styles.topTabInner}>
            <MaterialIcons
              name="stars"
              size={16}
              color="#9E0E26"
              style={{ marginRight: 6 }}
            />
            <Text
              style={[
                styles.topTabText,
                activeTab === 'premium' && styles.topTabTextActive,
              ]}
            >
              Premium
            </Text>
          </View>
        </TouchableOpacity>
      </View>
    </View>
  );
};

// ============================================
// Helper: image source
// ============================================
const getImageSource = (item: any) => {
  if (item.images && Array.isArray(item.images) && item.images.length > 0) {
    const image = item.images[0];
    if (image) {
      if (image.startsWith('data:image')) return { uri: image };
      if (image.startsWith('http')) return { uri: image };
      if (image.startsWith('/'))
        return { uri: `${BASE_URL.replace(/\/$/, '')}${image}` };
      return { uri: `${BASE_URL.replace(/\/$/, '')}/${image}` };
    }
  }
  if (item.image) {
    if (item.image.startsWith('data:image')) return { uri: item.image };
    if (item.image.startsWith('http')) return { uri: item.image };
    if (item.image.startsWith('/'))
      return { uri: `${BASE_URL.replace(/\/$/, '')}${item.image}` };
    return { uri: `${BASE_URL.replace(/\/$/, '')}/${item.image}` };
  }
  return require('../../../assets/images/icon.png');
};

// ============================================
// BANNER SLIDER
// ============================================
interface BannerSliderProps {
  bannerImages: any[];
  currentBannerIndex: number;
  onBannerPress: (banner: any) => void;
  setCurrentBannerIndex: (index: number) => void;
}

const BannerSlider: React.FC<BannerSliderProps> = ({
  bannerImages,
  currentBannerIndex,
  onBannerPress,
  setCurrentBannerIndex,
}) => {
  const flatListRef = useRef<FlatList>(null);
  const bannerWidth = width - 30;

  if (bannerImages.length === 0) return null;

  const handleScrollEnd = (event: any) => {
    const contentOffsetX = event.nativeEvent.contentOffset.x;
    const index = Math.round(contentOffsetX / bannerWidth);
    if (index !== currentBannerIndex && index < bannerImages.length) {
      setCurrentBannerIndex(index);
    }
  };

  useEffect(() => {
    if (flatListRef.current && currentBannerIndex < bannerImages.length) {
      flatListRef.current.scrollToIndex({
        index: currentBannerIndex,
        animated: true,
      });
    }
  }, [currentBannerIndex]);

  return (
    <View style={styles.bannerWrapper}>
      <FlatList
        ref={flatListRef}
        data={bannerImages}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        keyExtractor={(item, index) =>
          item?._id || item?.id || `banner-${index}`
        }
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.bannerItem}
            onPress={() => onBannerPress(item)}
            activeOpacity={0.9}
          >
            <Image
              source={{ uri: item.image || item.uri }}
              style={styles.bannerImage}
              resizeMode="cover"
            />
          </TouchableOpacity>
        )}
        onMomentumScrollEnd={handleScrollEnd}
        getItemLayout={(data, index) => ({
          length: bannerWidth,
          offset: bannerWidth * index,
          index,
        })}
        onScrollToIndexFailed={info => {
          setTimeout(() => {
            flatListRef.current?.scrollToIndex({
              index: info.index,
              animated: true,
            });
          }, 500);
        }}
        removeClippedSubviews
        maxToRenderPerBatch={2}
        windowSize={3}
        initialNumToRender={2}
        scrollEventThrottle={16}
        decelerationRate="fast"
        initialScrollIndex={0}
      />
      {bannerImages.length > 1 && (
        <View style={styles.dotsContainer}>
          {bannerImages.map((_, index) => (
            <View
              key={`dot-${index}`}
              style={[
                styles.dot,
                currentBannerIndex === index && styles.activeDot,
              ]}
            />
          ))}
        </View>
      )}
    </View>
  );
};

// ============================================
// CATEGORY ITEM
// ============================================
interface CategoryItemProps {
  item: any;
  selectedCategory: string;
  onPress: (item: any) => void;
}

const CategoryItem: React.FC<CategoryItemProps> = ({
  item,
  selectedCategory,
  onPress,
}) => {
  const isActive = selectedCategory === item._id;
  return (
    <TouchableOpacity
      onPress={() => onPress(item)}
      style={[styles.categoryItem, isActive && styles.categoryItemActive]}
    >
      <Text style={[styles.categoryName, isActive && styles.categoryNameActive]}>
        {item.name}
      </Text>
    </TouchableOpacity>
  );
};

// ============================================
// FEATURE BADGES
// ============================================
const FeatureBadges: React.FC = () => (
  <View style={styles.featuresContainer}>
    <View style={styles.featureItem}>
      <View style={styles.featureIconWrapper}>
        <MaterialIcons name="local-shipping" size={16} color="#9E0E26" />
      </View>
      <View style={styles.featureTextWrapper}>
        <Text style={styles.featureTitle} numberOfLines={1}>
          Free Shipping
        </Text>
        <Text style={styles.featureSubtext} numberOfLines={1}>
          On Orders Above ₹999
        </Text>
      </View>
    </View>

    <View style={styles.featureDivider} />

    <View style={styles.featureItem}>
      <View style={styles.featureIconWrapper}>
        <MaterialIcons name="verified" size={16} color="#9E0E26" />
      </View>
      <View style={styles.featureTextWrapper}>
        <Text style={styles.featureTitle} numberOfLines={1}>
          Premium Quality
        </Text>
        <Text style={styles.featureSubtext} numberOfLines={1}>
          Finest fabrics & comfort
        </Text>
      </View>
    </View>

    <View style={styles.featureDivider} />

    <View style={styles.featureItem}>
      <View style={styles.featureIconWrapper}>
        <MaterialIcons name="lock" size={16} color="#9E0E26" />
      </View>
      <View style={styles.featureTextWrapper}>
        <Text style={styles.featureTitle} numberOfLines={1}>
          Secure Payment
        </Text>
        <Text style={styles.featureSubtext} numberOfLines={1}>
          100% safe & secure
        </Text>
      </View>
    </View>
  </View>
);

// ============================================
// PRODUCT CARD — bold-prefix title
// ============================================
interface ProductCardProps {
  item: any;
  onPress: (item: any) => void;
  onFavoritePress: (id: string) => void;
  isFavorite?: boolean;
}

const ProductCard: React.FC<ProductCardProps> = ({
  item,
  onPress,
  onFavoritePress,
  isFavorite = false,
}) => {
  const originalPrice = Number(item.price || 0);
  const discountPercent = Number(item.discountPercent || 0);
  const discountedPrice =
    discountPercent > 0
      ? originalPrice - (originalPrice * discountPercent) / 100
      : originalPrice;

  const rating = Number(item.rating || 0);

  const { boldPart, normalPart } = splitTitle(item.name || 'Product', 2);

  return (
    <TouchableOpacity
      style={styles.productCard}
      onPress={() => onPress(item)}
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

        <TouchableOpacity
          style={styles.favoriteBtn}
          onPress={() => onFavoritePress(item._id)}
          activeOpacity={0.7}
          hitSlop={8}
        >
          <MaterialIcons
            name="favorite"
            size={22}
            style={
              isFavorite
                ? { color: '#E9445A' }
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
            <View style={styles.ratingDivider} />
            <MaterialIcons name="star" size={10} color="#1F9E4C" />
          </View>
        )}
      </View>

      <View style={styles.productInfo}>
        <Text numberOfLines={1} style={styles.productTitle}>
          <Text style={styles.productTitleBold}>{boldPart}</Text>
          {normalPart ? (
            <Text style={styles.productTitleNormal}> {normalPart}</Text>
          ) : null}
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

// ============================================
// ✅ FIXED — PREMIUM PRODUCT CARD (matches SansaHome exactly)
// ============================================
interface PremiumCardProps {
  item: any;
  onPress: (item: any) => void;
  onFavoritePress: (id: string) => void;
  isFavorite?: boolean;
}

const PremiumCard: React.FC<PremiumCardProps> = ({
  item,
  onPress,
  onFavoritePress,
  isFavorite = false,
}) => {
  const originalPrice = Number(item.price || 0);
  const discountPercent = Number(item.discountPercent || 0);
  const discountedPrice =
    discountPercent > 0
      ? originalPrice - (originalPrice * discountPercent) / 100
      : originalPrice;

  const rating = Number(item.rating || 0);

  const { boldPart, normalPart } = splitTitle(item.name || 'Product', 2);

  return (
    <TouchableOpacity
      style={styles.productCard}
      onPress={() => onPress(item)}
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

        {/* Premium tag — only visual differentiator */}
        <View style={styles.premiumTag}>
          <Text style={styles.premiumTagText}>{item.tag || 'PREMIUM'}</Text>
        </View>

        <TouchableOpacity
          style={styles.favoriteBtn}
          onPress={() => onFavoritePress(item._id)}
          activeOpacity={0.7}
          hitSlop={8}
        >
          <MaterialIcons
            name="favorite"
            size={22}
            style={
              isFavorite
                ? { color: '#E9445A' }
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
            <View style={styles.ratingDivider} />
            <MaterialIcons name="star" size={10} color="#1F9E4C" />
          </View>
        )}
      </View>

      <View style={styles.productInfo}>
        <Text numberOfLines={1} style={styles.productTitle}>
          <Text style={styles.productTitleBold}>{boldPart}</Text>
          {normalPart ? (
            <Text style={styles.productTitleNormal}> {normalPart}</Text>
          ) : null}
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

// ============================================
// ✅ FIXED — PREMIUM SECTION (FlatList numColumns=2)
// ============================================
const PremiumSection: React.FC<{
  items: any[];
  onProductPress: (item: any) => void;
  onFavoritePress: (id: string) => void;
  favorites: string[];
}> = ({ items, onProductPress, onFavoritePress, favorites }) => {
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();

  if (!items || items.length === 0) {
    return (
      <View
        style={{
          marginTop: 60,
          alignItems: 'center',
          justifyContent: 'center',
          paddingHorizontal: 40,
        }}
      >
        <MaterialIcons name="stars" size={48} color="#E0E0E0" />
        <Text
          style={{
            marginTop: 12,
            color: '#999',
            fontSize: 14,
            textAlign: 'center',
          }}
        >
          No premium products yet
        </Text>
        <Text
          style={{
            marginTop: 4,
            color: '#BBB',
            fontSize: 12,
            textAlign: 'center',
          }}
        >
          Check back soon for exclusive pieces
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.premiumSectionWrapper}>
      <View style={styles.premiumHeader}>
        <View style={styles.premiumHeaderLeft}>
          <View style={styles.premiumHeaderIcon}>
            <MaterialIcons name="stars" size={20} color="#9E0E26" />
          </View>
          <Text style={styles.premiumTitle}>Premium Collection</Text>
        </View>
        <TouchableOpacity
          style={styles.premiumSeeAll}
          onPress={() =>
            navigation.navigate('CategoryScreen' as any, {
              mainCategory: 'Premium',
              displayTitle: 'Premium Collection',
            })
          }
        >
          <Text style={styles.premiumSeeAllText}>See All</Text>
          <MaterialIcons name="arrow-forward" size={14} color="#9E0E26" />
        </TouchableOpacity>
      </View>

      <FlatList
        data={items}
        keyExtractor={(item, index) => `${item._id}-${index}`}
        numColumns={2}
        columnWrapperStyle={styles.columnWrapper}
        renderItem={({ item }) => (
          <PremiumCard
            item={item}
            onPress={onProductPress}
            onFavoritePress={onFavoritePress}
            isFavorite={favorites.includes(item._id)}
          />
        )}
        scrollEnabled={false}
      />
    </View>
  );
};

// ============================================
// MAIN DASHBOARD
// ============================================
export default function Dashboard() {
  const insets = useSafeAreaInsets();
  const [newArrivals, setNewArrivals] = useState([]);
  const [trendingItems, setTrendingItems] = useState([]);
  const [premiumItems, setPremiumItems] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [categories, setCategories] = useState<any[]>([]);

  const [favorites, setFavorites] = useState<string[]>([]);

  const [bannerImages, setBannerImages] = useState<any[]>([]);
  const [currentBannerIndex, setCurrentBannerIndex] = useState(0);
  const [isAutoScrolling, setIsAutoScrolling] = useState(true);

  const [activeTab, setActiveTab] = useState<'home' | 'premium'>('home');

  const [showAllNew] = useState(false);
  const [showAllTrending] = useState(false);

  const [searchText, setSearchText] = useState('');
  const [debouncedSearchText, setDebouncedSearchText] = useState('');
  const [favoriteCount, setFavoriteCount] = useState(0);

  const [selectedCategory, setSelectedCategory] = useState('');
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 10000]);

  const [modalVisible, setModalVisible] = useState(false);

  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();

  useEffect(() => {
    loadFavorites();
  }, []);

  useEffect(() => {
    let mounted = true;

    const fetchCounts = async () => {
      try {
        const favs = await getFavoriteProducts();
        const list = Array.isArray(favs) ? favs : favs?.items || [];
        if (mounted) setFavoriteCount(list.length);
      } catch {
        if (mounted) setFavoriteCount(0);
      }
    };

    fetchCounts();

    const listener = () => fetchCounts();
    eventBus.on('FAVORITE_UPDATED', listener);
    eventBus.on('ITEM_REMOVED', listener);

    return () => {
      mounted = false;
      eventBus.off('FAVORITE_UPDATED', listener);
      eventBus.off('ITEM_REMOVED', listener);
    };
  }, []);

  const loadFavorites = async () => {
    try {
      const stored = await AsyncStorage.getItem('favorites');
      if (stored) setFavorites(JSON.parse(stored));
    } catch (err) {
      console.error('Error loading favorites:', err);
    }
  };

  const toggleFavorite = async (id: string) => {
    try {
      const updated = favorites.includes(id)
        ? favorites.filter(fav => fav !== id)
        : [...favorites, id];

      setFavorites(updated);
      await AsyncStorage.setItem('favorites', JSON.stringify(updated));

      addToFavoritesList(id);
      eventBus.emit('ITEM_REMOVED', { id: 123 });
    } catch (err) {
      console.error('Error toggling favorite:', err);
    }
  };

  const fetchBanners = async () => {
    try {
      const banners = await getActiveBanners();
      if (banners && banners.length > 0) {
        setBannerImages(banners);
        setCurrentBannerIndex(0);
      } else {
        setBannerImages([]);
      }
    } catch (error) {
      console.error('Error fetching banners:', error);
      setBannerImages([]);
    }
  };

  useEffect(() => {
    if (bannerImages.length <= 1 || !isAutoScrolling) return;
    const interval = setInterval(() => {
      const nextIndex = (currentBannerIndex + 1) % bannerImages.length;
      setCurrentBannerIndex(nextIndex);
    }, 4000);
    return () => clearInterval(interval);
  }, [bannerImages.length, currentBannerIndex, isAutoScrolling]);

  const fetchCategories = async () => {
    try {
      const token = await AsyncStorage.getItem('authToken');
      const response = await fetch(`${config.baseURL}api/master/category`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      const data = await response.json();
      const activeCategories = data.filter((cat: any) => cat.isActive === true);
      setCategories(activeCategories);
    } catch (error) {
      setCategories([
        { _id: '1', name: 'Sarees' },
        { _id: '2', name: 'Kurtis' },
        { _id: '3', name: 'Lehengas' },
        { _id: '4', name: 'Ethnic Sets' },
        { _id: '5', name: 'Dupattas' },
      ]);
    }
  };

  const fetchNewArrivals = async ({
    searchText,
    selectedCategory,
    priceRange,
  }: any) => {
    try {
      const params: any = { isNewArrival: true };
      if (searchText) params.search = searchText;
      if (selectedCategory) params.category = selectedCategory;
      if (priceRange?.[0] > 0) params.minPrice = priceRange[0];
      if (priceRange?.[1] < 10000) params.maxPrice = priceRange[1];

      const queryString = Object.keys(params)
        .map(k => `${encodeURIComponent(k)}=${encodeURIComponent(params[k])}`)
        .join('&');

      const url = `${config.baseURL}api/products${
        queryString ? '?' + queryString : ''
      }`;
      const token = await AsyncStorage.getItem('authToken');
      const response = await fetch(url, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      const data = await response.json();
      setNewArrivals(data || []);
    } catch (err) {
      setNewArrivals([]);
    }
  };

  const fetchTrending = async ({
    searchText,
    selectedCategory,
    priceRange,
  }: any) => {
    try {
      const params: any = { isTrending: true };
      if (searchText) params.search = searchText;
      if (selectedCategory) params.category = selectedCategory;
      if (priceRange?.[0] > 0) params.minPrice = priceRange[0];
      if (priceRange?.[1] < 10000) params.maxPrice = priceRange[1];

      const queryString = Object.keys(params)
        .map(k => `${encodeURIComponent(k)}=${encodeURIComponent(params[k])}`)
        .join('&');

      const url = `${config.baseURL}api/products${
        queryString ? '?' + queryString : ''
      }`;
      const token = await AsyncStorage.getItem('authToken');
      const response = await fetch(url, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      const data = await response.json();
      setTrendingItems(data || []);
    } catch (err) {
      setTrendingItems([]);
    }
  };

  const fetchPremium = async () => {
    try {
      const params: any = { isPremium: true };

      const queryString = Object.keys(params)
        .map(k => `${encodeURIComponent(k)}=${encodeURIComponent(params[k])}`)
        .join('&');

      const url = `${config.baseURL}api/products${
        queryString ? '?' + queryString : ''
      }`;
      const token = await AsyncStorage.getItem('authToken');
      const response = await fetch(url, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      const data = await response.json();
      setPremiumItems(data || []);
    } catch (err) {
      console.error('Error fetching premium products:', err);
      setPremiumItems([]);
    }
  };

  useEffect(() => {
    const loadData = async () => {
      LoadingService.show();
      setLoading(true);
      await Promise.all([fetchBanners(), fetchCategories()]);
      await Promise.all([
        fetchNewArrivals({ searchText: '', selectedCategory: '', priceRange }),
        fetchTrending({ searchText: '', selectedCategory: '', priceRange }),
        fetchPremium(),
      ]);
      setLoading(false);
      LoadingService.hide();
    };
    loadData();
  }, []);

  useEffect(() => {
    if (!loading) {
      const loadData = async () => {
        LoadingService.show();
        setLoading(true);
        await Promise.all([
          fetchNewArrivals({
            searchText: debouncedSearchText,
            selectedCategory,
            priceRange,
          }),
          fetchTrending({
            searchText: debouncedSearchText,
            selectedCategory,
            priceRange,
          }),
        ]);
        LoadingService.hide();
        setLoading(false);
      };
      loadData();
    }
  }, [selectedCategory, priceRange]);

  const redirectToProductDetails = (id: string) => {
    navigation.navigate('ProductDetails', { itemId: id });
  };

  const applyFilter = async () => {
    setModalVisible(false);
    LoadingService.show();
    setLoading(true);
    await Promise.all([
      fetchNewArrivals({
        searchText: debouncedSearchText,
        selectedCategory,
        priceRange,
      }),
      fetchTrending({
        searchText: debouncedSearchText,
        selectedCategory,
        priceRange,
      }),
    ]);
    LoadingService.hide();
    setLoading(false);
  };

  const clearFilters = () => {
    setSearchText('');
    setDebouncedSearchText('');
    setSelectedCategory('');
    setPriceRange([0, 10000]);
    setModalVisible(false);
  };

  const handleSearch = async () => {
    const query = searchText.trim();
    setDebouncedSearchText(query);

    LoadingService.show();
    setLoading(true);
    await Promise.all([
      fetchNewArrivals({ searchText: query, selectedCategory, priceRange }),
      fetchTrending({ searchText: query, selectedCategory, priceRange }),
    ]);
    LoadingService.hide();
    setLoading(false);
  };

  const clearSearch = () => {
    setSearchText('');
    setDebouncedSearchText('');
    fetchNewArrivals({ searchText: '', selectedCategory, priceRange });
    fetchTrending({ searchText: '', selectedCategory, priceRange });
  };

  const navigateToCategory = (item: any) => {
    setSelectedCategory(item._id);
    navigation.navigate('CategoryScreen', {
      mainCategory: item.name,
      displayTitle: item.name,
    });
  };

  const handleBannerPress = (banner: any) => {
    if (banner.linkType === 'collection' && banner.link) {
      navigation.navigate('CategoryScreen', { mainCategory: banner.link });
    } else if (banner.linkType === 'product' && banner.linkId) {
      navigation.navigate('ProductDetails', { itemId: banner.linkId });
    }
  };

  const handleBannerScroll = (index: number) => {
    if (index !== currentBannerIndex && index < bannerImages.length) {
      setIsAutoScrolling(false);
      setCurrentBannerIndex(index);
      setTimeout(() => setIsAutoScrolling(true), 5000);
    }
  };

  const itemsToShowNew = showAllNew ? newArrivals : newArrivals.slice(0, 4);
  const itemsToShowTrending = showAllTrending
    ? trendingItems
    : trendingItems.slice(0, 4);

  const HomeContent = () => (
    <>
      <BannerSlider
        bannerImages={bannerImages}
        currentBannerIndex={currentBannerIndex}
        onBannerPress={handleBannerPress}
        setCurrentBannerIndex={handleBannerScroll}
      />

      <View style={styles.categoryWrapper}>
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={categories}
          keyExtractor={item => item._id || 'cat'}
          renderItem={({ item }) => (
            <CategoryItem
              item={item}
              selectedCategory={selectedCategory}
              onPress={navigateToCategory}
            />
          )}
          contentContainerStyle={styles.categoryList}
        />
      </View>

      <FeatureBadges />

      <View style={styles.newArrivalSection}>
        <View style={styles.newArrivalHeader}>
          <Text style={styles.newArrivalTitle}>New Arrival</Text>
          <TouchableOpacity
            onPress={() =>
              navigation.navigate('CategoryScreen', {
                mainCategory: 'New Arrival',
                displayTitle: 'New Arrivals',
              })
            }
          >
            <Text style={styles.seeAllText}>See All</Text>
          </TouchableOpacity>
        </View>
        {itemsToShowNew.length === 0 ? (
          <Text style={styles.noRecordsText}>No Records found</Text>
        ) : (
          <FlatList
            data={itemsToShowNew}
            keyExtractor={(item, index) => `${item._id}-${index}`}
            numColumns={2}
            columnWrapperStyle={styles.columnWrapper}
            renderItem={({ item }) => (
              <ProductCard
                item={item}
                onPress={product => redirectToProductDetails(product._id)}
                onFavoritePress={toggleFavorite}
                isFavorite={favorites.includes(item._id)}
              />
            )}
            scrollEnabled={false}
          />
        )}
      </View>

      <View style={styles.newArrivalSection}>
        <View style={styles.newArrivalHeader}>
          <Text style={styles.newArrivalTitle}>Trending</Text>
          <TouchableOpacity
            onPress={() =>
              navigation.navigate('CategoryScreen', {
                mainCategory: 'Trending',
                displayTitle: 'Trending Now',
              })
            }
          >
            <Text style={styles.seeAllText}>See All</Text>
          </TouchableOpacity>
        </View>
        {itemsToShowTrending.length === 0 ? (
          <Text style={styles.noRecordsText}>No Records found</Text>
        ) : (
          <FlatList
            data={itemsToShowTrending}
            keyExtractor={(item, index) => `${item._id}-${index}`}
            numColumns={2}
            columnWrapperStyle={styles.columnWrapper}
            renderItem={({ item }) => (
              <ProductCard
                item={item}
                onPress={product => redirectToProductDetails(product._id)}
                onFavoritePress={toggleFavorite}
                isFavorite={favorites.includes(item._id)}
              />
            )}
            scrollEnabled={false}
          />
        )}
      </View>
    </>
  );

  const PremiumContent = () => (
    <PremiumSection
      items={premiumItems}
      onProductPress={product => redirectToProductDetails(product._id)}
      onFavoritePress={toggleFavorite}
      favorites={favorites}
    />
  );

  return (
    <View style={styles.container}>
      <StatusBar
        barStyle="dark-content"
        backgroundColor="#FFF0F3"
        translucent={false}
      />

      <SafeAreaView edges={['top']} style={styles.topTabsSafe}>
        <TopTabs activeTab={activeTab} onTabChange={setActiveTab} />
      </SafeAreaView>

      <View style={styles.searchRow}>
        <View style={styles.searchBarWrap}>
          <Image
            source={require('../../../assets/images/icon.png')}
            style={styles.searchLogo}
            resizeMode="contain"
          />
          <TextInput
            style={styles.searchInput}
            placeholder="Search for Sarees..."
            placeholderTextColor="#9CA3AF"
            value={searchText}
            onChangeText={setSearchText}
            returnKeyType="search"
            onSubmitEditing={handleSearch}
          />
          {searchText.length > 0 && (
            <TouchableOpacity
              onPress={clearSearch}
              hitSlop={6}
              style={{ marginRight: 6 }}
            >
              <MaterialIcons name="close" size={18} color="#888" />
            </TouchableOpacity>
          )}
          <TouchableOpacity onPress={handleSearch} hitSlop={6}>
            <MaterialIcons name="search" size={22} color="#111" />
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={styles.topIconBtn}
          onPress={() => navigation.navigate('FavoritesPage')}
          hitSlop={6}
        >
          <View style={{ position: 'relative' }}>
            <Ionicons name="heart-outline" size={26} color="#111" />
            {favoriteCount > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{favoriteCount}</Text>
              </View>
            )}
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.topIconBtn}
          onPress={() => navigation.navigate('NotificationScreen' as any)}
          hitSlop={6}
        >
          <Ionicons name="notifications-outline" size={26} color="#111" />
        </TouchableOpacity>
      </View>

      <FlatList
        data={[]}
        keyExtractor={() => 'main-scroll'}
        renderItem={null}
        ListHeaderComponent={
          activeTab === 'home' ? HomeContent : PremiumContent
        }
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.mainScrollContent,
          { paddingBottom: 70 + insets.bottom },
        ]}
        keyboardShouldPersistTaps="handled"
      />

      <Modal
        animationType="slide"
        transparent
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View
            style={[
              styles.modalContent,
              { paddingBottom: Math.max(insets.bottom, 20) + 10 },
            ]}
          >
            <View style={styles.modalHeader}>
              <TouchableOpacity onPress={clearFilters}>
                <Text style={styles.clearText}>Clear</Text>
              </TouchableOpacity>
              <Text style={styles.modalTitle}>Filters</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <MaterialIcons name="close" size={24} color="black" />
              </TouchableOpacity>
            </View>

            <Text style={styles.filterSectionTitle}>Category</Text>
            <View style={styles.categoryFilter}>
              {categories.map(cat => (
                <TouchableOpacity
                  key={cat._id || 'cat'}
                  style={[
                    styles.categoryFilterButton,
                    selectedCategory === cat._id &&
                      styles.categoryFilterButtonActive,
                  ]}
                  onPress={() => {
                    setSelectedCategory(cat._id);
                    setModalVisible(false);
                    applyFilter();
                  }}
                >
                  <Text
                    style={[
                      styles.categoryFilterText,
                      selectedCategory === cat._id &&
                        styles.categoryFilterTextActive,
                    ]}
                  >
                    {cat.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.filterSectionTitle}>Price Range</Text>

            <View style={styles.priceHeader}>
              <Text style={styles.priceText}>Min: ₹{priceRange[0]}</Text>
              <Text style={styles.priceText}>Max: ₹{priceRange[1]}</Text>
            </View>

            <Text style={styles.sliderTitle}>Minimum Price</Text>
            <Slider
              style={styles.slider}
              minimumValue={50}
              maximumValue={10000}
              value={priceRange[0]}
              onValueChange={value =>
                setPriceRange([Math.round(value), priceRange[1]])
              }
            />

            <Text style={styles.sliderTitle}>Maximum Price</Text>
            <Slider
              style={styles.slider}
              minimumValue={50}
              maximumValue={10000}
              value={priceRange[1]}
              onValueChange={value =>
                setPriceRange([priceRange[0], Math.round(value)])
              }
            />

            <TouchableOpacity style={styles.applyButton} onPress={applyFilter}>
              <Text style={styles.applyButtonText}>Apply Filter</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

// ============================================
// STYLES
// ============================================
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },

  mainScrollContent: {
    paddingHorizontal: 15,
  },

  columnWrapper: {
    justifyContent: 'space-between',
    marginBottom: 15,
  },

  // TOP TABS
  topTabsSafe: {
    backgroundColor: '#FFFF',
  },
  topTabsBar: {
    backgroundColor: '#FFFF',
    paddingTop: 0,
    paddingBottom: 0,
  },
  topTabsRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 0,
    gap: 0,
  },
  topTab: {
    flex: 1,
    height: 44,
    backgroundColor: '#FFF0F3',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 8,
  },
  topTabLeft: {
    borderTopLeftRadius: 14,
    borderTopRightRadius: 0,
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
    borderLeftWidth: 1,
    borderTopWidth: 1,
    borderBottomWidth: 0,
    borderRightWidth: 1,
    borderColor: '#F2D5DC',
  },
  topTabRight: {
    borderTopLeftRadius: 0,
    borderTopRightRadius: 14,
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
    borderLeftWidth: 0,
    borderTopWidth: 1,
    borderBottomWidth: 0,
    borderRightWidth: 1,
    borderColor: '#F2D5DC',
  },
  topTabActive: {
    backgroundColor: '#FFFFFF',
    borderColor: '#F2D5DC',
    borderBottomWidth: 0,
  },
  topTabInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  topTabText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#9E0E26',
    letterSpacing: 0.3,
  },
  topTabTextActive: {
    fontWeight: '700',
    color: '#9E0E26',
  },

  // SEARCH BAR ROW
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingVertical: 10,
    backgroundColor: '#FFFFFF',
    gap: 10,
  },
  searchBarWrap: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    height: 44,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  searchLogo: {
    width: 24,
    height: 24,
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: '#111',
    paddingVertical: 0,
  },
  topIconBtn: {
    padding: 2,
  },
  badge: {
    position: 'absolute',
    top: -5,
    right: -10,
    backgroundColor: '#0C0C0C',
    borderRadius: 20,
    minWidth: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
    paddingHorizontal: 4,
  },
  badgeText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
  },

  // Category
  categoryWrapper: { marginVertical: 8 },
  categoryList: { paddingHorizontal: 0, gap: 3 },
  categoryItem: {
    backgroundColor: '#1a1a1a',
    paddingHorizontal: 5,
    paddingVertical: 5,
    borderRadius: 10,
    marginRight: 5,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 60,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  categoryItemActive: { backgroundColor: '#9E0E26', borderColor: '#9E0E26' },
  categoryName: {
    fontSize: 10,
    fontWeight: '500',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  categoryNameActive: { color: '#FFFFFF', fontWeight: '600' },

  // FEATURE BADGES
  featuresContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    paddingVertical: 4,
    paddingHorizontal: 0,
    marginVertical: 4,
    marginHorizontal: 0,
    minHeight: 44,
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },
  featureItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 0,
  },
  featureIconWrapper: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#FCEBED',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 2,
  },
  featureDivider: {
    width: 1,
    height: 22,
    backgroundColor: '#D0D0D0',
    alignSelf: 'center',
    marginHorizontal: 0,
  },
  featureTextWrapper: {
    flexShrink: 1,
    justifyContent: 'center',
  },
  featureTitle: {
    fontSize: 9,
    color: '#9E0E26',
    fontWeight: '700',
    lineHeight: 11,
  },
  featureSubtext: {
    fontSize: 6,
    color: '#888',
    fontWeight: '400',
    lineHeight: 9,
  },

  // PRODUCT CARD
  productCard: {
    width: '48%',
    backgroundColor: '#fff',
    borderRadius: 8,
    marginBottom: 18,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },
  megaDropRow: {
    flexDirection: 'row',
    marginBottom: 6,
  },
  megaDropBadge: {
    backgroundColor: '#E9445A',
    borderRadius: 3,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  megaDropText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '700',
  },
  imageWrapper: { position: 'relative' },
  productImage: {
    width: '100%',
    height: 200,
    borderRadius: 8,
    backgroundColor: '#F5F5F5',
  },
  favoriteBtn: {
    position: 'absolute',
    top: 8,
    right: 8,
    padding: 2,
  },
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
  },
  ratingPillText: {
    color: '#111',
    fontSize: 11,
    fontWeight: '700',
  },
  ratingDivider: {
    width: 1,
    height: 10,
    backgroundColor: '#D0D0D0',
    marginHorizontal: 2,
  },
  productInfo: {
    paddingTop: 8,
    paddingHorizontal: 2,
    paddingBottom: 10,
  },
  productTitle: {
    fontSize: 13,
    color: '#111',
    marginBottom: 6,
  },
  productTitleBold: {
    fontWeight: '700',
    color: '#111',
  },
  productTitleNormal: {
    fontWeight: '400',
    color: '#333',
  },

  megaDropInline: {
    alignSelf: 'flex-start',
    backgroundColor: '#FCEBED',
    borderRadius: 3,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginBottom: 6,
  },
  megaDropInlineText: {
    color: '#E9445A',
    fontSize: 10,
    fontWeight: '700',
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexWrap: 'wrap',
  },
  strikePrice: {
    fontSize: 12,
    color: '#999',
    textDecorationLine: 'line-through',
  },
  finalPrice: {
    fontSize: 15,
    fontWeight: '800',
    color: '#111',
  },
  discountText: {
    fontSize: 13,
    color: '#9E0E26',
    fontWeight: '700',
  },

  // ✅ FIXED — Premium styles now consistent with SansaHome
  premiumSectionWrapper: { marginTop: 8, marginBottom: 10 },
  premiumHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 0,
    marginBottom: 12,
  },
  premiumHeaderLeft: { flexDirection: 'row', alignItems: 'center' },
  premiumHeaderIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#FCEBED',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  premiumTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1a1a1a',
    letterSpacing: 0.3,
  },
  premiumSeeAll: { flexDirection: 'row', alignItems: 'center' },
  premiumSeeAllText: {
    fontSize: 13,
    color: '#9E0E26',
    fontWeight: '600',
    marginRight: 2,
  },

  // ✅ Premium tag — the only visual differentiator from SansaHome cards
  premiumTag: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: '#9E0E26',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 3,
    zIndex: 2,
  },
  premiumTagText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },

  // Sections
  newArrivalSection: { marginTop: 8 },
  newArrivalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  newArrivalTitle: { fontSize: 12, fontWeight: 'bold' },
  seeAllText: { fontSize: 13, color: '#9E0E26', fontWeight: '600' },
  noRecordsText: {
    fontSize: 12,
    color: '#999',
    textAlign: 'center',
    marginTop: 20,
  },

  // Modal
  modalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: '#fff',
    padding: 20,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '85%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  clearText: { fontSize: 16, color: '#151515' },
  modalTitle: { fontSize: 18, fontWeight: 'bold' },
  filterSectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#000',
    marginVertical: 10,
  },
  priceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  priceText: { fontSize: 16, fontWeight: '600' },
  sliderTitle: { fontSize: 14, marginTop: 10, marginBottom: 5, color: '#555' },
  categoryFilter: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-start',
    marginBottom: 20,
    gap: 10,
  },
  categoryFilterButton: {
    backgroundColor: '#f2f2f2',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 25,
    marginVertical: 4,
    marginRight: 8,
    minWidth: 80,
    alignItems: 'center',
  },
  categoryFilterButtonActive: { backgroundColor: '#9E0E26' },
  categoryFilterText: { color: '#333', fontSize: 14, fontWeight: '500' },
  categoryFilterTextActive: { color: '#fff' },
  slider: { flex: 1, marginHorizontal: 20 },
  applyButton: {
    backgroundColor: '#9E0E26',
    borderRadius: 35,
    paddingVertical: 15,
    alignItems: 'center',
    marginTop: 10,
  },
  applyButtonText: { color: '#fff', fontSize: 16, fontWeight: '600' },

  // Banner
  bannerWrapper: {
    marginVertical: 8,
    borderRadius: 12,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: '#f5f5f5',
  },
  bannerItem: {
    width: width - 30,
    height: 200,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#f5f5f5',
  },
  bannerImage: { width: '100%', height: '100%', borderRadius: 12 },
  dotsContainer: {
    position: 'absolute',
    bottom: 10,
    flexDirection: 'row',
    alignSelf: 'center',
    gap: 6,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.5)',
  },
  activeDot: { backgroundColor: '#9E0E26', width: 20 },
});