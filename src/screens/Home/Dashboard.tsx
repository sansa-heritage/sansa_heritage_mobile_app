import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  FlatList,
  Modal,
  Dimensions,
  ScrollView,
} from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import Slider from '@react-native-community/slider';
import { StyleSheet } from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useNavigation } from '@react-navigation/native';
import { addToFavoritesList } from '../../api/favoriteApi';
import { RootStackParamList } from '../../models/types';
import eventBus from '../../services/eventBus';
import AsyncStorage from '@react-native-async-storage/async-storage';
import config from '../../config/config';
import LoadingService from '../../services/LoadingService';
import { getActiveBanners } from '../../api/bannerApi';

const { width } = Dimensions.get('window');

const BASE_URL =
  config.baseURL || 'https://ecappbe-sanasaheritages-projects.vercel.app';

// Premium static product data
const premiumProducts = [
  {
    _id: 'premium1',
    name: 'Royal Silk Banarasi Saree',
    price: 8999,
    discountPercent: 25,
    rating: 4.8,
    image:
      'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?w=400&h=500&fit=crop&crop=center&q=80',
    tag: 'PREMIUM',
    isPremium: true,
  },
  {
    _id: 'premium2',
    name: 'Handwoven Kanjivaram Silk',
    price: 12999,
    discountPercent: 30,
    rating: 4.9,
    image:
      'https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=400&h=500&fit=crop&crop=center&q=80',
    tag: 'LUXURY',
    isPremium: true,
  },
  {
    _id: 'premium3',
    name: 'Embroidered Bridal Lehenga',
    price: 24999,
    discountPercent: 20,
    rating: 4.7,
    image:
      'https://images.unsplash.com/photo-1602810320072-7cf0a1a39348?w=400&h=500&fit=crop&crop=center&q=80',
    tag: 'EXCLUSIVE',
    isPremium: true,
  },
  {
    _id: 'premium4',
    name: 'Designer Festive Kurti Set',
    price: 5999,
    discountPercent: 15,
    rating: 4.6,
    image:
      'https://images.unsplash.com/photo-1627483298308-6749c9d173a6?w=400&h=500&fit=crop&crop=center&q=80',
    tag: 'PREMIUM',
    isPremium: true,
  },
];

// ============================================
// TOP TABS
// ============================================
interface TopTabsProps {
  activeTab: 'home' | 'premium';
  onTabChange: (tab: 'home' | 'premium') => void;
}

const TopTabs: React.FC<TopTabsProps> = ({ activeTab, onTabChange }) => {
  return (
    <View style={styles.topTabsContainer}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.tabsScrollContent}
      >
        <TouchableOpacity
          style={[styles.tabItem, activeTab === 'home' && styles.tabItemActive]}
          onPress={() => onTabChange('home')}
          activeOpacity={0.8}
        >
          <Text style={[styles.tabText, activeTab === 'home' && styles.tabTextActive]}>
            SansaHome
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabItem, activeTab === 'premium' && styles.tabItemActive]}
          onPress={() => onTabChange('premium')}
          activeOpacity={0.8}
        >
          <View style={styles.tabContent}>
            <Text
              style={[styles.tabText, activeTab === 'premium' && styles.tabTextActive]}
            >
              Premium
            </Text>
            <MaterialIcons
              name="stars"
              size={12}
              color={activeTab === 'premium' ? '#9E0E26' : '#888'}
            />
          </View>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
};

// ============================================
// Helper function to get image source
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
  return require('../../../assets/images/logo.png');
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

  if (bannerImages.length === 0) return null;

  const handleScrollEnd = (event: any) => {
    const contentOffsetX = event.nativeEvent.contentOffset.x;
    const index = Math.round(contentOffsetX / (width - 30));
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
          length: width - 30,
          offset: (width - 30) * index,
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
// PRODUCT CARD
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
}) => (
  <TouchableOpacity
    style={styles.productCard}
    onPress={() => onPress(item)}
    activeOpacity={0.8}
  >
    <View style={styles.imageWrapper}>
      <Image source={getImageSource(item)} style={styles.productImage} />

      {/* ⭐ Rating overlay on image (bottom-left) */}
      {item.rating !== undefined && item.rating > 0 && (
        <View style={styles.ratingOverlay}>
          <MaterialIcons name="star" size={11} color="#FFFFFF" />
          <Text style={styles.ratingOverlayText}>
            {Number(item.rating).toFixed(1)}
          </Text>
        </View>
      )}

      {/* ❤️ Wishlist icon */}
      <TouchableOpacity
        style={styles.favoriteBtn}
        onPress={() => onFavoritePress(item._id)}
        activeOpacity={0.7}
      >
        <MaterialIcons
          name="favorite"
          size={20}
          color={isFavorite ? '#9E0E26' : '#FFFFFF'}
        />
      </TouchableOpacity>
    </View>

    <View style={styles.productInfo}>
      <Text numberOfLines={1} style={styles.productTitle}>
        {item.name}
      </Text>

      <View style={styles.priceRow}>
        <Text style={styles.finalPrice}>
          ₹
          {(
            item?.price -
            (item?.price * (item?.discountPercent || 0)) / 100
          )?.toFixed(0)}
        </Text>
        <Text style={styles.strikePrice}>₹{item?.price}</Text>
      </View>
    </View>
  </TouchableOpacity>
);

// ============================================
// PREMIUM PRODUCT CARD
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
  const discountedPrice =
    item.price - (item.price * (item.discountPercent || 0)) / 100;

  return (
    <TouchableOpacity
      style={styles.premiumCard}
      onPress={() => onPress(item)}
      activeOpacity={0.8}
    >
      <View style={styles.premiumImageWrapper}>
        <Image source={getImageSource(item)} style={styles.premiumImage} />

        {/* Premium Tag */}
        <View style={styles.premiumTag}>
          <Text style={styles.premiumTagText}>{item.tag || 'PREMIUM'}</Text>
        </View>

        {/* ⭐ Rating overlay on image (bottom-left) */}
        {item.rating !== undefined && item.rating > 0 && (
          <View style={styles.ratingOverlay}>
            <MaterialIcons name="star" size={11} color="#FFFFFF" />
            <Text style={styles.ratingOverlayText}>
              {Number(item.rating).toFixed(1)}
            </Text>
          </View>
        )}

        {/* ❤️ Wishlist */}
        <TouchableOpacity
          style={styles.premiumFavoriteBtn}
          onPress={() => onFavoritePress(item._id)}
          activeOpacity={0.7}
        >
          <MaterialIcons
            name="favorite"
            size={18}
            color={isFavorite ? '#9E0E26' : '#FFFFFF'}
          />
        </TouchableOpacity>
      </View>

      <View style={styles.premiumInfo}>
        <Text numberOfLines={1} style={styles.premiumName}>
          {item.name}
        </Text>

        <View style={styles.premiumPriceRow}>
          <Text style={styles.premiumPrice}>
            ₹{discountedPrice.toFixed(0)}
          </Text>
          <Text style={styles.premiumStrikePrice}>₹{item.price}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
};

// ============================================
// PREMIUM SECTION
// ============================================
const PremiumSection: React.FC<{
  items: any[];
  onProductPress: (item: any) => void;
  onFavoritePress: (id: string) => void;
  favorites: string[];
}> = ({ items, onProductPress, onFavoritePress, favorites }) => {
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();

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

      <View style={styles.premiumGrid}>
        {items.map(item => (
          <PremiumCard
            key={item._id}
            item={item}
            onPress={onProductPress}
            onFavoritePress={onFavoritePress}
            isFavorite={favorites.includes(item._id)}
          />
        ))}
      </View>
    </View>
  );
};

// ============================================
// MAIN DASHBOARD
// ============================================
export default function Dashboard() {
  const [newArrivals, setNewArrivals] = useState([]);
  const [trendingItems, setTrendingItems] = useState([]);
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

  const [selectedCategory, setSelectedCategory] = useState('');
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 10000]);

  const [modalVisible, setModalVisible] = useState(false);

  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();

  // Favorites
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

  // Fetch banners
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

  // Auto-scroll
  useEffect(() => {
    if (bannerImages.length <= 1 || !isAutoScrolling) return;
    const interval = setInterval(() => {
      const nextIndex = (currentBannerIndex + 1) % bannerImages.length;
      setCurrentBannerIndex(nextIndex);
    }, 4000);
    return () => clearInterval(interval);
  }, [bannerImages.length, currentBannerIndex, isAutoScrolling]);

  // Debounce
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearchText(searchText), 500);
    return () => clearTimeout(timer);
  }, [searchText]);

  // Categories
  const fetchCategories = async () => {
    try {
      const token = await AsyncStorage.getItem('authToken');
      const response = await fetch(`${config.baseURL}api/master/category`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      const data = await response.json();
      const activeCategories = data.filter((cat: any) => cat.isActive === true);
      setCategories([{ _id: '', name: 'All', isActive: true }, ...activeCategories]);
    } catch (error) {
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

  const fetchNewArrivals = async ({ searchText, selectedCategory, priceRange }: any) => {
    try {
      const params: any = { isNewArrival: true };
      if (searchText) params.search = searchText;
      if (selectedCategory) params.category = selectedCategory;
      if (priceRange?.[0] > 0) params.minPrice = priceRange[0];
      if (priceRange?.[1] < 10000) params.maxPrice = priceRange[1];

      const queryString = Object.keys(params)
        .map(k => `${encodeURIComponent(k)}=${encodeURIComponent(params[k])}`)
        .join('&');

      const url = `${config.baseURL}api/products${queryString ? '?' + queryString : ''}`;
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

  const fetchTrending = async ({ searchText, selectedCategory, priceRange }: any) => {
    try {
      const params: any = { isTrending: true };
      if (searchText) params.search = searchText;
      if (selectedCategory) params.category = selectedCategory;
      if (priceRange?.[0] > 0) params.minPrice = priceRange[0];
      if (priceRange?.[1] < 10000) params.maxPrice = priceRange[1];

      const queryString = Object.keys(params)
        .map(k => `${encodeURIComponent(k)}=${encodeURIComponent(params[k])}`)
        .join('&');

      const url = `${config.baseURL}api/products${queryString ? '?' + queryString : ''}`;
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

  useEffect(() => {
    const loadData = async () => {
      LoadingService.show();
      setLoading(true);
      await Promise.all([fetchBanners(), fetchCategories()]);
      await Promise.all([
        fetchNewArrivals({ searchText: '', selectedCategory: '', priceRange }),
        fetchTrending({ searchText: '', selectedCategory: '', priceRange }),
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
          fetchNewArrivals({ searchText: debouncedSearchText, selectedCategory, priceRange }),
          fetchTrending({ searchText: debouncedSearchText, selectedCategory, priceRange }),
        ]);
        LoadingService.hide();
        setLoading(false);
      };
      loadData();
    }
  }, [debouncedSearchText, selectedCategory, priceRange]);

  const redirectToProductDetails = (id: string) => {
    navigation.navigate('ProductDetails', { itemId: id });
  };

  const applyFilter = async () => {
    setModalVisible(false);
    LoadingService.show();
    setLoading(true);
    await Promise.all([
      fetchNewArrivals({ searchText: debouncedSearchText, selectedCategory, priceRange }),
      fetchTrending({ searchText: debouncedSearchText, selectedCategory, priceRange }),
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
  const itemsToShowTrending = showAllTrending ? trendingItems : trendingItems.slice(0, 4);

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
          keyExtractor={item => item._id || 'all'}
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
      items={premiumProducts}
      onProductPress={product => redirectToProductDetails(product._id)}
      onFavoritePress={toggleFavorite}
      favorites={favorites}
    />
  );

  return (
    <View style={styles.container}>
      <TopTabs activeTab={activeTab} onTabChange={setActiveTab} />

      <FlatList
        data={[]}
        keyExtractor={() => 'main-scroll'}
        renderItem={null}
        ListHeaderComponent={activeTab === 'home' ? HomeContent : PremiumContent}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 70 }}
        keyboardShouldPersistTaps="handled"
      />

      {/* Filter Modal */}
      <Modal
        animationType="slide"
        transparent
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
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
                  key={cat._id || 'all'}
                  style={[
                    styles.categoryFilterButton,
                    selectedCategory === cat._id && styles.categoryFilterButtonActive,
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
                      selectedCategory === cat._id && styles.categoryFilterTextActive,
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
              onValueChange={value => setPriceRange([Math.round(value), priceRange[1]])}
            />

            <Text style={styles.sliderTitle}>Maximum Price</Text>
            <Slider
              style={styles.slider}
              minimumValue={50}
              maximumValue={10000}
              value={priceRange[1]}
              onValueChange={value => setPriceRange([priceRange[0], Math.round(value)])}
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
    paddingHorizontal: 15,
  },
  columnWrapper: {
    justifyContent: 'space-between',
    marginBottom: 15,
  },

  // Tabs
  topTabsContainer: {
    backgroundColor: '#F7EBD8',
    marginHorizontal: -15,
    paddingHorizontal: 8,
    paddingVertical: 6,
    height: 48,
  },
  tabsScrollContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    gap: 4,
  },
  tabItem: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    alignItems: 'center',
    justifyContent: 'center',
    height: 34,
    minWidth: 70,
    borderRadius: 8,
  },
  tabItemActive: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    elevation: 1,
  },
  tabContent: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  tabText: { fontSize: 12, fontWeight: '500', color: '#888888' },
  tabTextActive: { color: '#1a1a1a', fontWeight: '600' },

  // Category
  categoryWrapper: { marginVertical: 8 },
  categoryList: { paddingHorizontal: 2, gap: 3 },
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

  // Feature badges
  featuresContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    backgroundColor: '#F8F4F0',
    borderRadius: 6,
    paddingVertical: 4,
    paddingHorizontal: 2,
    marginVertical: 2,
    marginHorizontal: 2,
    minHeight: 38,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    paddingHorizontal: 1,
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
  featureDivider: { width: 1, height: 20, backgroundColor: '#E0D6C8' },
  featureTextWrapper: { flex: 1, justifyContent: 'center' },
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

  // Product card
  productCard: {
    width: '48%',
    backgroundColor: '#fff',
    borderRadius: 14,
    marginBottom: 16,
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
  },
  imageWrapper: { position: 'relative' },
  productImage: {
    width: '100%',
    height: 180,
    borderTopLeftRadius: 14,
    borderTopRightRadius: 14,
  },
  favoriteBtn: {
    position: 'absolute',
    top: 10,
    right: 10,
    borderRadius: 20,
    padding: 6,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },

  // ⭐ Rating overlay
  ratingOverlay: {
    position: 'absolute',
    bottom: 10,
    left: 10,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#138E4E',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 4,
    gap: 2,
  },
  ratingOverlayText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },

  productInfo: { padding: 10 },
  productTitle: { fontSize: 15, fontWeight: '600', color: '#222' },
  priceRow: { flexDirection: 'row', alignItems: 'center', marginTop: 6 },
  finalPrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#000',
    marginRight: 8,
  },
  strikePrice: {
    fontSize: 14,
    color: '#888',
    textDecorationLine: 'line-through',
  },

  // Premium
  premiumSectionWrapper: { marginTop: 8, marginBottom: 10 },
  premiumHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 2,
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
    fontSize: 18,
    fontWeight: '700',
    color: '#1a1a1a',
    letterSpacing: 0.5,
  },
  premiumSeeAll: { flexDirection: 'row', alignItems: 'center' },
  premiumSeeAllText: {
    fontSize: 12,
    color: '#9E0E26',
    fontWeight: '600',
    marginRight: 2,
  },
  premiumGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  premiumCard: {
    width: '48%',
    backgroundColor: '#fff',
    borderRadius: 14,
    marginBottom: 16,
    overflow: 'hidden',
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    borderWidth: 1,
    borderColor: '#FCEBED',
  },
  premiumImageWrapper: { position: 'relative', height: 180 },
  premiumImage: { width: '100%', height: '100%', resizeMode: 'cover' },
  premiumTag: {
    position: 'absolute',
    top: 10,
    left: 10,
    backgroundColor: '#9E0E26',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
  },
  premiumTagText: {
    color: '#fff',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  premiumFavoriteBtn: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 20,
    padding: 6,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.5)',
  },
  premiumInfo: { padding: 10, backgroundColor: '#fff' },
  premiumName: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 2,
  },
  premiumPriceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },
  premiumPrice: {
    fontSize: 16,
    fontWeight: '700',
    color: '#9E0E26',
    marginRight: 6,
  },
  premiumStrikePrice: {
    fontSize: 12,
    color: '#888',
    textDecorationLine: 'line-through',
  },

  // Sections
  newArrivalSection: { marginTop: 8 },
  newArrivalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  newArrivalTitle: { fontSize: 15, fontWeight: 'bold' },
  seeAllText: { fontSize: 13, color: '#9E0E26', fontWeight: '600' },
  noRecordsText: {
    fontSize: 14,
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
    height: 190,
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

// export default Dashboard;