import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  TextInput,
  FlatList,
  Modal,
  Dimensions,
  ActivityIndicator,
  ScrollView,
  Animated,
} from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import Slider from '@react-native-community/slider';
const { width } = Dimensions.get('window');
import { StyleSheet } from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useNavigation } from '@react-navigation/native';
import { addToFavoritesList } from '../../api/favoriteApi';
import Rating from '../../components/common/RatingStars';
import { RootStackParamList } from '../../models/types';
import eventBus from '../../services/eventBus';
import AsyncStorage from '@react-native-async-storage/async-storage';
import config from '../../config/config';
import LoadingService from '../../services/LoadingService';
import { getActiveBanners } from '../../api/bannerApi';

// Base URL for images
const BASE_URL = config.baseURL || 'https://ecappbe-sanasaheritages-projects.vercel.app';

// Category icons mapping
const categoryIcons: { [key: string]: any } = {
  'All': require('../../../assets/icons/all.png'),
  'Sarees': require('../../../assets/icons/saree.png'),
  'Kurtis': require('../../../assets/icons/kurti.png'),
  'Lehengas': require('../../../assets/icons/lehenga.png'),
  'Ethnic Sets': require('../../../assets/icons/ethnic-set.png'),
  'Dupattas': require('../../../assets/icons/dupatta.png'),
};

// Feature Icons
const featureIcons = {
  deals: require('../../../assets/icons/deals.png'),
  shipping: require('../../../assets/icons/shipping.png'),
  quality: require('../../../assets/icons/quality.png'),
  heritage: require('../../../assets/icons/heritage.png'),
};

// Premium static product data
const premiumProducts = [
  {
    _id: 'premium1',
    name: 'Royal Silk Banarasi Saree',
    price: 8999,
    discountPercent: 25,
    rating: 4.8,
    image: 'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?w=400&h=500&fit=crop&crop=center&q=80',
    tag: 'PREMIUM',
    isPremium: true,
  },
  {
    _id: 'premium2',
    name: 'Handwoven Kanjivaram Silk',
    price: 12999,
    discountPercent: 30,
    rating: 4.9,
    image: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=400&h=500&fit=crop&crop=center&q=80',
    tag: 'LUXURY',
    isPremium: true,
  },
  {
    _id: 'premium3',
    name: 'Embroidered Bridal Lehenga',
    price: 24999,
    discountPercent: 20,
    rating: 4.7,
    image: 'https://images.unsplash.com/photo-1602810320072-7cf0a1a39348?w=400&h=500&fit=crop&crop=center&q=80',
    tag: 'EXCLUSIVE',
    isPremium: true,
  },
  {
    _id: 'premium4',
    name: 'Designer Festive Kurti Set',
    price: 5999,
    discountPercent: 15,
    rating: 4.6,
    image: 'https://images.unsplash.com/photo-1627483298308-6749c9d173a6?w=400&h=500&fit=crop&crop=center&q=80',
    tag: 'PREMIUM',
    isPremium: true,
  },
];

// ============================================
// TOP TABS COMPONENT - EXPERIENCE SWITCHER (AJIO STYLE)
// ============================================
interface TopTabsProps {
  activeTab: 'home' | 'premium';
  onTabChange: (tab: 'home' | 'premium') => void;
}

const TopTabs: React.FC<TopTabsProps> = ({ activeTab, onTabChange }) => {
  const translateX = useRef(new Animated.Value(activeTab === 'home' ? 0 : width * 0.5)).current;

  useEffect(() => {
    Animated.spring(translateX, {
      toValue: activeTab === 'home' ? 0 : width * 0.5,
      useNativeDriver: true,
      tension: 300,
      friction: 25,
    }).start();
  }, [activeTab]);

  return (
    <View style={styles.topTabsContainer}>
      <View style={styles.topTabsWrapper}>
        {/* SansaHome Tab - Main Shopping Experience */}
        <TouchableOpacity
          style={styles.tabItem}
          onPress={() => onTabChange('home')}
          activeOpacity={0.7}
        >
          <Text style={[styles.tabText, activeTab === 'home' && styles.tabTextActive]}>
            SansaHome
          </Text>
        </TouchableOpacity>

        {/* Premium Tab - Luxury/High-end Experience */}
        <TouchableOpacity
          style={styles.tabItem}
          onPress={() => onTabChange('premium')}
          activeOpacity={0.7}
        >
          <View style={styles.premiumTabLabel}>
            <Text style={[styles.tabText, activeTab === 'premium' && styles.tabTextActive]}>
              Premium
            </Text>
            <MaterialIcons
              name="stars"
              size={12}
              color={activeTab === 'premium' ? '#96252A' : '#888'}
            />
          </View>
        </TouchableOpacity>

        {/* Sliding Indicator - Bottom underline */}
        <Animated.View
          style={[
            styles.slidingIndicator,
            {
              transform: [{ translateX }],
            },
          ]}
        />
      </View>
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
  return require('../../../assets/images/logo.png');
};

// Helper function to get category icon
const getCategoryIcon = (categoryName: string) => {
  return categoryIcons[categoryName] || categoryIcons['All'];
};

// ============================================
// BANNER SLIDER COMPONENT
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

  if (bannerImages.length === 0) {
    return null;
  }

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
        keyExtractor={(item, index) => item?._id || item?.id || `banner-${index}`}
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
              onError={(e) => {
                console.log('Banner image load error:', e.nativeEvent);
              }}
            />
          </TouchableOpacity>
        )}
        onMomentumScrollEnd={handleScrollEnd}
        getItemLayout={(data, index) => ({
          length: width - 30,
          offset: (width - 30) * index,
          index,
        })}
        onScrollToIndexFailed={(info) => {
          const wait = new Promise(resolve => setTimeout(resolve, 500));
          wait.then(() => {
            flatListRef.current?.scrollToIndex({
              index: info.index,
              animated: true,
            });
          });
        }}
        removeClippedSubviews={true}
        maxToRenderPerBatch={2}
        windowSize={3}
        initialNumToRender={2}
        scrollEventThrottle={16}
        decelerationRate="fast"
        initialScrollIndex={0}
        viewabilityConfig={{
          itemVisiblePercentThreshold: 50,
        }}
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
// CATEGORY ITEM COMPONENT
// ============================================
interface CategoryItemProps {
  item: any;
  selectedCategory: string;
  onPress: (item: any) => void;
}

const CategoryItem: React.FC<CategoryItemProps> = ({ item, selectedCategory, onPress }) => {
  const isActive = selectedCategory === item._id;
  const iconSource = getCategoryIcon(item.name);

  return (
    <TouchableOpacity
      onPress={() => onPress(item.name, item.name)}
      style={[
        styles.categoryItem,
        isActive && styles.categoryItemActive,
      ]}
    >
      <View style={[
        styles.categoryIconWrapper,
        isActive && styles.categoryIconWrapperActive,
      ]}>
        <Image
          source={iconSource}
          style={[
            styles.categoryIcon,
            isActive && styles.categoryIconActive,
          ]}
          resizeMode="contain"
        />
      </View>
      <Text
        style={[
          styles.categoryName,
          isActive && styles.categoryNameActive,
        ]}
      >
        {item.name}
      </Text>
    </TouchableOpacity>
  );
};

// ============================================
// FEATURE BADGES COMPONENT
// ============================================
const FeatureBadges: React.FC = () => (
  <View style={styles.featuresContainer}>
    <View style={styles.featureItem}>
      <Image source={featureIcons.deals} style={styles.featureIconImage} resizeMode="contain" />
      <View style={styles.featureTextWrapper}>
        <Text style={styles.featureTitle}>Exclusive Deals</Text>
        <Text style={styles.featureSubtext}>Best Prices</Text>
      </View>
    </View>

    <View style={styles.featureItem}>
      <Image source={featureIcons.shipping} style={styles.featureIconImage} resizeMode="contain" />
      <View style={styles.featureTextWrapper}>
        <Text style={styles.featureTitle}>Free Shipping</Text>
        <Text style={styles.featureSubtext}>On orders above 999</Text>
      </View>
    </View>

    <View style={styles.featureItem}>
      <Image source={featureIcons.quality} style={styles.featureIconImage} resizeMode="contain" />
      <View style={styles.featureTextWrapper}>
        <Text style={styles.featureTitle}>Quality Assured</Text>
        <Text style={styles.featureSubtext}>100% Original</Text>
      </View>
    </View>

    <View style={styles.featureItem}>
      <Image source={featureIcons.heritage} style={styles.featureIconImage} resizeMode="contain" />
      <View style={styles.featureTextWrapper}>
        <Text style={styles.featureTitle}>Handpicked Heritage</Text>
        <Text style={styles.featureSubtext}>Styles for you</Text>
      </View>
    </View>
  </View>
);

// ============================================
// PRODUCT CARD COMPONENT
// ============================================
interface ProductCardProps {
  item: any;
  onPress: (item: any) => void;
  onFavoritePress: (id: string) => void;
}

const ProductCard: React.FC<ProductCardProps> = ({ item, onPress, onFavoritePress }) => (
  <TouchableOpacity
    style={styles.productCard}
    onPress={() => onPress(item)}
    activeOpacity={0.8}
  >
    <View style={styles.imageWrapper}>
      <Image source={getImageSource(item)} style={styles.productImage} />
      <TouchableOpacity
        style={styles.favoriteBtn}
        onPress={() => onFavoritePress(item._id)}
      >
        <MaterialIcons name="favorite-border" size={20} color="#000" />
      </TouchableOpacity>
      {item.discountPercent > 0 && (
        <View style={styles.discountBadge}>
          <Text style={styles.discountBadgeText}>
            {item.discountPercent}% OFF
          </Text>
        </View>
      )}
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
      {item.rating !== undefined && item.rating > 0 && (
        <Rating value={item.rating} />
      )}
    </View>
  </TouchableOpacity>
);

// ============================================
// PREMIUM PRODUCT CARD - 2 COLUMN
// ============================================
interface PremiumCardProps {
  item: any;
  onPress: (item: any) => void;
  onFavoritePress: (id: string) => void;
}

const PremiumCard: React.FC<PremiumCardProps> = ({ item, onPress, onFavoritePress }) => {
  const discountedPrice = item.price - (item.price * (item.discountPercent || 0)) / 100;
  
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
        
        <TouchableOpacity
          style={styles.premiumFavoriteBtn}
          onPress={() => onFavoritePress(item._id)}
        >
          <MaterialIcons name="favorite-border" size={18} color="#96252A" />
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
        <View style={styles.premiumRatingRow}>
          <Rating value={item.rating || 4.5} />
          <Text style={styles.premiumRatingText}>({item.rating || 4.5})</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
};

// ============================================
// PREMIUM SECTION COMPONENT - 2 COLUMN
// ============================================
const PremiumSection: React.FC<{
  items: any[];
  onProductPress: (item: any) => void;
  onFavoritePress: (id: string) => void;
}> = ({ items, onProductPress, onFavoritePress }) => {
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();

  return (
    <View style={styles.premiumSectionWrapper}>
      <View style={styles.premiumHeader}>
        <View style={styles.premiumHeaderLeft}>
          <View style={styles.premiumHeaderIcon}>
            <MaterialIcons name="stars" size={20} color="#96252A" />
          </View>
          <Text style={styles.premiumTitle}>Premium Collection</Text>
        </View>
        <TouchableOpacity
          style={styles.premiumSeeAll}
          onPress={() => navigation.navigate('CategoryScreen' as any, {
            mainCategory: 'Premium',
            displayTitle: 'Premium Collection'
          })}
        >
          <Text style={styles.premiumSeeAllText}>See All</Text>
          <MaterialIcons name="arrow-forward" size={14} color="#96252A" />
        </TouchableOpacity>
      </View>

      {/* Premium Items - 2 Column Grid */}
      <View style={styles.premiumGrid}>
        {items.map((item) => (
          <PremiumCard
            key={item._id}
            item={item}
            onPress={onProductPress}
            onFavoritePress={onFavoritePress}
          />
        ))}
      </View>
    </View>
  );
};

// ============================================
// MAIN DASHBOARD COMPONENT
// ============================================
export default function Dashboard() {
  const [newArrivals, setNewArrivals] = useState([]);
  const [trendingItems, setTrendingItems] = useState([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [categories, setCategories] = useState<any[]>([]);

  // Banner slider state
  const [bannerImages, setBannerImages] = useState<any[]>([]);
  const [currentBannerIndex, setCurrentBannerIndex] = useState(0);
  const [isAutoScrolling, setIsAutoScrolling] = useState(true);

  // Active tab state for TopTabs
  const [activeTab, setActiveTab] = useState<'home' | 'premium'>('home');

  const [showAllNew, setShowAllNew] = useState(false);
  const [showAllTrending, setShowAllTrending] = useState(false);

  const [searchText, setSearchText] = useState('');
  const [mainCategory, setMainCategory] = useState('');
  const [debouncedSearchText, setDebouncedSearchText] = useState('');

  const [selectedCategory, setSelectedCategory] = useState('');
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 10000]);
  const [distanceRange, setDistanceRange] = useState([500, 2000]);

  const [modalVisible, setModalVisible] = useState(false);
  const [menuVisible, setMenuVisible] = useState(false);

  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();

  // Fetch dynamic banners from API
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

  // Auto-scroll banner
  useEffect(() => {
    if (bannerImages.length <= 1 || !isAutoScrolling) return;

    const interval = setInterval(() => {
      const nextIndex = (currentBannerIndex + 1) % bannerImages.length;
      setCurrentBannerIndex(nextIndex);
    }, 4000);

    return () => clearInterval(interval);
  }, [bannerImages.length, currentBannerIndex, isAutoScrolling]);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchText(searchText);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchText]);

  // Fetch categories
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

  // Fetch products
  const fetchNewArrivals = async ({
    searchText,
    selectedCategory,
    priceRange,
  }: {
    searchText?: string;
    selectedCategory?: string;
    priceRange?: [number, number];
  }) => {
    try {
      const params: any = { isNewArrival: true };
      if (searchText) params.search = searchText;
      if (selectedCategory) params.category = selectedCategory;
      if (priceRange?.[0] !== undefined && priceRange?.[0] > 0) params.minPrice = priceRange[0];
      if (priceRange?.[1] !== undefined && priceRange?.[1] < 10000) params.maxPrice = priceRange[1];

      const queryString = Object.keys(params)
        .map(key => `${encodeURIComponent(key)}=${encodeURIComponent(params[key])}`)
        .join('&');

      const url = `${config.baseURL}api/products${queryString ? '?' + queryString : ''}`;
      const token = await AsyncStorage.getItem('authToken');
      const response = await fetch(url, {
        headers: token ? { 'Authorization': `Bearer ${token}` } : {},
      });
      const data = await response.json();
      setNewArrivals(data || []);
    } catch (err) {
      console.error('Error fetching new arrivals:', err);
      setNewArrivals([]);
    }
  };

  const fetchTrending = async ({
    searchText,
    selectedCategory,
    priceRange,
  }: {
    searchText?: string;
    selectedCategory?: string;
    priceRange?: [number, number];
  }) => {
    try {
      const params: any = { isTrending: true };
      if (searchText) params.search = searchText;
      if (selectedCategory) params.category = selectedCategory;
      if (priceRange?.[0] !== undefined && priceRange?.[0] > 0) params.minPrice = priceRange[0];
      if (priceRange?.[1] !== undefined && priceRange?.[1] < 10000) params.maxPrice = priceRange[1];

      const queryString = Object.keys(params)
        .map(key => `${encodeURIComponent(key)}=${encodeURIComponent(params[key])}`)
        .join('&');

      const url = `${config.baseURL}api/products${queryString ? '?' + queryString : ''}`;
      const token = await AsyncStorage.getItem('authToken');
      const response = await fetch(url, {
        headers: token ? { 'Authorization': `Bearer ${token}` } : {},
      });
      const data = await response.json();
      setTrendingItems(data || []);
    } catch (err) {
      console.error('Error fetching trending:', err);
      setTrendingItems([]);
    }
  };

  // Load all data
  useEffect(() => {
    const loadData = async () => {
      LoadingService.show();
      setLoading(true);
      await Promise.all([
        fetchBanners(),
        fetchCategories(),
      ]);
      await Promise.all([
        fetchNewArrivals({ searchText: '', selectedCategory: '', priceRange }),
        fetchTrending({ searchText: '', selectedCategory: '', priceRange }),
      ]);
      setLoading(false);
      LoadingService.hide();
    };
    loadData();
  }, []);

  // Refetch when filters change
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

  const addToFavorites = (_id: number | undefined) => {
    addToFavoritesList(_id);
    eventBus.emit('ITEM_REMOVED', { id: 123 });
  };

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
    setDistanceRange([500, 2000]);
    setModalVisible(false);
  };

  // Navigate to CategoryScreen
  const navigateToCategory = (categoryName: string, displayTitle?: string) => {
    navigation.navigate('CategoryScreen', {
      mainCategory: categoryName,
      displayTitle: displayTitle || categoryName
    });
  };

  // Handle banner press
  const handleBannerPress = (banner: any) => {
    if (banner.linkType === 'collection' && banner.link) {
      navigation.navigate('CategoryScreen', { mainCategory: banner.link });
    } else if (banner.linkType === 'product' && banner.linkId) {
      navigation.navigate('ProductDetails', { itemId: banner.linkId });
    } else if (banner.link) {
      console.log('Banner pressed:', banner.link);
    }
  };

  // Handle banner scroll
  const handleBannerScroll = (index: number) => {
    if (index !== currentBannerIndex && index < bannerImages.length) {
      setIsAutoScrolling(false);
      setCurrentBannerIndex(index);
      setTimeout(() => {
        setIsAutoScrolling(true);
      }, 5000);
    }
  };

  const itemsToShowNew = showAllNew ? newArrivals : newArrivals.slice(0, 4);
  const itemsToShowTrending = showAllTrending ? trendingItems : trendingItems.slice(0, 4);

  // Home Tab Content
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
              onPress={(categoryName, displayTitle) => navigateToCategory(categoryName, displayTitle)}
            />
          )}
          contentContainerStyle={styles.categoryList}
        />
      </View>
      <FeatureBadges />

      {/* New Arrival Section */}
      <View style={styles.newArrivalSection}>
        <View style={styles.newArrivalHeader}>
          <Text style={styles.newArrivalTitle}>New Arrival</Text>
          <TouchableOpacity onPress={() => navigateToCategory('New Arrival', 'New Arrivals')}>
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
                onPress={(product) => redirectToProductDetails(product._id)}
                onFavoritePress={(id) => addToFavorites(id)}
              />
            )}
            scrollEnabled={false}
          />
        )}
      </View>

      {/* Trending Section */}
      <View style={styles.newArrivalSection}>
        <View style={styles.newArrivalHeader}>
          <Text style={styles.newArrivalTitle}>Trending</Text>
          <TouchableOpacity onPress={() => navigateToCategory('Trending', 'Trending Now')}>
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
                onPress={(product) => redirectToProductDetails(product._id)}
                onFavoritePress={(id) => addToFavorites(id)}
              />
            )}
            scrollEnabled={false}
          />
        )}
      </View>
    </>
  );

  // Premium Tab Content - 2 Column
  const PremiumContent = () => (
    <PremiumSection
      items={premiumProducts}
      onProductPress={(product) => redirectToProductDetails(product._id)}
      onFavoritePress={(id) => addToFavorites(id)}
    />
  );

  return (
    <View style={styles.container}>
      {/* Top Tabs - Experience Switcher (AJIO Style) */}
      <TopTabs activeTab={activeTab} onTabChange={setActiveTab} />

      {/* Content */}
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
              {categories.map((cat) => (
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
                  <Text style={[
                    styles.categoryFilterText,
                    selectedCategory === cat._id && styles.categoryFilterTextActive,
                  ]}>
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
};

// ============================================
// STYLES
// ============================================
const styles = StyleSheet.create({
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
  },
  discountedPrice: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000',
    marginRight: 8,
  },
  originalPrice: {
    fontSize: 16,
    color: '#888',
    textDecorationLine: 'line-through',
    marginRight: 8,
  },
  discountPercent: {
    fontSize: 16,
    fontWeight: '600',
    color: 'green',
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
  },
  menuMaincontainer: {
    flex: 1,
    backgroundColor: '#fff',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  columnWrapper: {
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  container: {
    flex: 1,
    backgroundColor: '#fff',
    paddingHorizontal: 15,
    paddingTop: 0,
  },

  // ============================================
  // TOP TABS STYLES - EXPERIENCE SWITCHER (AJIO STYLE)
  // ============================================
  topTabsContainer: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 0,
    paddingVertical: 0,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
    marginHorizontal: -15,
    paddingHorizontal: 15,
    marginTop: 0,
    marginBottom: 0,
  },
  topTabsWrapper: {
    flexDirection: 'row',
    position: 'relative',
    backgroundColor: 'transparent',
    paddingVertical: 0,
    height: 44,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 0,
    zIndex: 1,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#888',
    letterSpacing: 0.3,
  },
  tabTextActive: {
    color: '#96252A',
    fontWeight: '600',
  },
  slidingIndicator: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    width: '50%',
    height: 2.5,
    backgroundColor: '#96252A',
    zIndex: 0,
    borderRadius: 0,
  },
  premiumTabLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },

  // ============================================
  // CATEGORY STYLES
  // ============================================
  categoryWrapper: {
    marginVertical: 8,
  },
  categoryList: {
    paddingHorizontal: 2,
  },
  categoryItem: {
    alignItems: 'center',
    marginRight: 20,
    paddingVertical: 4,
  },
  categoryItemActive: {},
  categoryIconWrapper: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  categoryIconWrapperActive: {
    backgroundColor: '#96252A',
    borderColor: '#96252A',
  },
  categoryIcon: {
    width: 26,
    height: 26,
    tintColor: '#96252A',
  },
  categoryIconActive: {
    tintColor: '#FFFFFF',
  },
  categoryName: {
    fontSize: 11,
    color: '#666',
    fontWeight: '500',
    textAlign: 'center',
  },
  categoryNameActive: {
    color: '#96252A',
    fontWeight: '600',
  },

  // ============================================
  // FEATURE BADGES
  // ============================================
  featuresContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#F8F4F0',
    borderRadius: 10,
    paddingVertical: 4,
    paddingHorizontal: 4,
    marginVertical: 2,
    marginHorizontal: 2,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    paddingHorizontal: 1,
  },
  featureIconImage: {
    width: 22,
    height: 22,
    tintColor: '#96252A',
    marginRight: 2,
  },
  featureTextWrapper: {
    flex: 1,
  },
  featureTitle: {
    fontSize: 8,
    color: '#96252A',
    fontWeight: '700',
    lineHeight: 11,
  },
  featureSubtext: {
    fontSize: 7,
    color: '#888',
    fontWeight: '400',
    lineHeight: 9,
  },

  // ============================================
  // PRODUCT CARD
  // ============================================
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
  imageWrapper: {
    position: 'relative',
  },
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
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 6,
    elevation: 3,
  },
  discountBadge: {
    position: 'absolute',
    bottom: 10,
    left: 10,
    backgroundColor: '#950C21',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  discountBadgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  productInfo: {
    padding: 10,
  },
  productTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#222',
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
  },
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

  // ============================================
  // PREMIUM SECTION - 2 COLUMN
  // ============================================
  premiumSectionWrapper: {
    marginTop: 8,
    marginBottom: 10,
  },
  premiumHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 2,
    marginBottom: 12,
  },
  premiumHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
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
  premiumSeeAll: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  premiumSeeAllText: {
    fontSize: 12,
    color: '#96252A',
    fontWeight: '600',
    marginRight: 2,
  },
  premiumGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },

  // Premium Card - 2 Column
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
  premiumImageWrapper: {
    position: 'relative',
    height: 180,
  },
  premiumImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  premiumTag: {
    position: 'absolute',
    top: 10,
    left: 10,
    backgroundColor: '#96252A',
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
    backgroundColor: 'rgba(255,255,255,0.9)',
    borderRadius: 20,
    padding: 6,
    borderWidth: 1,
    borderColor: '#FCEBED',
  },
  premiumInfo: {
    padding: 10,
    backgroundColor: '#fff',
  },
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
    color: '#96252A',
    marginRight: 6,
  },
  premiumStrikePrice: {
    fontSize: 12,
    color: '#888',
    textDecorationLine: 'line-through',
  },
  premiumRatingRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  premiumRatingText: {
    fontSize: 11,
    color: '#888',
    marginLeft: 4,
  },

  // ============================================
  // SECTIONS
  // ============================================
  newArrivalSection: {
    marginTop: 8,
  },
  newArrivalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  newArrivalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  seeAllText: {
    fontSize: 13,
    color: '#96252A',
    fontWeight: '600',
  },
  noRecordsText: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    marginTop: 20,
  },

  // ============================================
  // MODAL
  // ============================================
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
  clearText: {
    fontSize: 16,
    color: '#151515',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
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
  priceText: {
    fontSize: 16,
    fontWeight: '600',
  },
  sliderTitle: {
    fontSize: 14,
    marginTop: 10,
    marginBottom: 5,
    color: '#555',
  },
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
  categoryFilterButtonActive: {
    backgroundColor: '#96252A',
  },
  categoryFilterText: {
    color: '#333',
    fontSize: 14,
    fontWeight: '500',
  },
  categoryFilterTextActive: {
    color: '#fff',
  },
  slider: {
    flex: 1,
    marginHorizontal: 20,
  },
  applyButton: {
    backgroundColor: '#96252A',
    borderRadius: 35,
    paddingVertical: 15,
    alignItems: 'center',
    marginTop: 10,
  },
  applyButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },

  // ============================================
  // BANNER SLIDER
  // ============================================
  bannerWrapper: {
    marginVertical: 8,
    borderRadius: 12,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: '#f5f5f5',
  },
  bannerItem: {
    width: width - 30,
    height: 170,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#f5f5f5',
  },
  bannerImage: {
    width: '100%',
    height: '100%',
    borderRadius: 12,
    backgroundColor: '#f5f5f5',
  },
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
  activeDot: {
    backgroundColor: '#96252A',
    width: 20,
  },

  // ============================================
  // LOADING
  // ============================================
  // loadingContainer: {
  //   flex: 1,
  //   justifyContent: 'center',
  //   alignItems: 'center',
  // },
});