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

// Base URL for images
const BASE_URL = config.baseURL || 'https://ecappbe-sanasaheritages-projects.vercel.app';

// Banner images - replace with your actual images
const bannerImages = [
  require('../../../assets/images/banner1.jpg'),
  require('../../../assets/images/banner2.jpg'),
  require('../../../assets/images/banner3.jpg'),
];

// Category icons mapping - add your actual icon images
const categoryIcons: { [key: string]: any } = {
  'All': require('../../../assets/icons/all.png'),
  'Sarees': require('../../../assets/icons/saree.png'),
  'Kurtis': require('../../../assets/icons/kurti.png'),
  'Lehengas': require('../../../assets/icons/lehenga.png'),
  'Ethnic Sets': require('../../../assets/icons/ethnic-set.png'),
  'Dupattas': require('../../../assets/icons/dupatta.png'),
};

// ✅ FEATURE ICONS - Add your actual icon images here
const featureIcons = {
  deals: require('../../../assets/icons/deals.png'),
  shipping: require('../../../assets/icons/shipping.png'),
  quality: require('../../../assets/icons/quality.png'),
  heritage: require('../../../assets/icons/heritage.png'),
};

// Helper function to get image source
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
  return categoryIcons[categoryName] || FALLBACK_ICON;
};

export default function Dashboard() {
  const [newArrivals, setNewArrivals] = useState([]);
  const [trendingItems, setTrendingItems] = useState([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [categories, setCategories] = useState<any[]>([]);
  
  // Banner slider state
  const [currentBannerIndex, setCurrentBannerIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);

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

  // ✅ Auto-scroll banner
  useEffect(() => {
    const interval = setInterval(() => {
      const nextIndex = (currentBannerIndex + 1) % bannerImages.length;
      setCurrentBannerIndex(nextIndex);
      flatListRef.current?.scrollToIndex({
        index: nextIndex,
        animated: true,
      });
    }, 3000);
    return () => clearInterval(interval);
  }, [currentBannerIndex]);

  // ✅ Debounce search - wait for user to stop typing
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchText(searchText);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchText]);

  // ✅ Fetch categories from API
  const fetchCategories = async () => {
    try {
      const token = await AsyncStorage.getItem('authToken');
      const response = await fetch(`${config.baseURL}api/master/category`, {
        headers: token ? { 'Authorization': `Bearer ${token}` } : {},
      });
      const data = await response.json();
      const activeCategories = data.filter((cat: any) => cat.isActive === true);
      setCategories([{ _id: '', name: 'All', isActive: true }, ...activeCategories]);
      console.log('📂 Categories loaded:', activeCategories.length);
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

  // ✅ Fetch products with category filter
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

  // ✅ Load categories and products on mount
  useEffect(() => {
    const loadData = async () => {
      LoadingService.show();
      setLoading(true);
      await fetchCategories();
      await Promise.all([
        fetchNewArrivals({ searchText: '', selectedCategory: '', priceRange }),
        fetchTrending({ searchText: '', selectedCategory: '', priceRange }),
      ]);
      setLoading(false);
      LoadingService.hide();
    };
    loadData();
  }, []);

  // ✅ Refetch when filters change
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

  const handleSearchChange = (text: string) => {
    setSearchText(text);
  };

  const assignFilterItem = (categoryId: string) => {
    console.log('🔍 Category selected (ID):', categoryId);
    setSelectedCategory(categoryId);
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

  // ✅ Navigate to CategoryScreen
  const navigateToCategory = (categoryName: string) => {
    navigation.navigate('CategoryScreen', { mainCategory: categoryName });
  };

  const itemsToShowNew = showAllNew ? newArrivals : newArrivals.slice(0, 4);
  const itemsToShowTrending = showAllTrending ? trendingItems : trendingItems.slice(0, 4);

  const renderProductCard = ({ item }: { item: any }) => (
    <TouchableOpacity
      style={styles.productCard}
      onPress={() => redirectToProductDetails(item._id)}
      activeOpacity={0.8}
    >
      <View style={styles.imageWrapper}>
        <Image source={getImageSource(item)} style={styles.productImage} />
        <TouchableOpacity
          style={styles.favoriteBtn}
          onPress={() => addToFavorites(item._id)}
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

  // ✅ Banner Slider Component
  const BannerSlider = () => (
    <View style={styles.bannerWrapper}>
      <FlatList
        ref={flatListRef}
        data={bannerImages}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        renderItem={({ item }) => (
          <Image source={item} style={styles.bannerImage} resizeMode="cover" />
        )}
        keyExtractor={(_, index) => index.toString()}
        onMomentumScrollEnd={(e) => {
          const index = Math.round(e.nativeEvent.contentOffset.x / width);
          setCurrentBannerIndex(index);
        }}
      />
      {/* Dots */}
      <View style={styles.dotsContainer}>
        {bannerImages.map((_, index) => (
          <View
            key={index}
            style={[
              styles.dot,
              currentBannerIndex === index && styles.activeDot,
            ]}
          />
        ))}
      </View>
    </View>
  );

  // ✅ Category Item Component with Icon
  const CategoryItem = ({ item }: { item: any }) => {
    const isActive = selectedCategory === item._id;
    const iconSource = getCategoryIcon(item.name);
    
    return (
      <TouchableOpacity
        onPress={() => {
          // Navigate to CategoryScreen when category is clicked
          navigateToCategory(item.name);
        }}
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

  // ✅ Feature Badges Component with Image Icons
  const FeatureBadges = () => (
    <View style={styles.featuresContainer}>
      {/* 1. Exclusive Deals */}
      <View style={styles.featureItem}>
        <Image source={featureIcons.deals} style={styles.featureIconImage} resizeMode="contain" />
        <View style={styles.featureTextWrapper}>
          <Text style={styles.featureTitle}>Exclusive Deals</Text>
          <Text style={styles.featureSubtext}>Best Prices</Text>
        </View>
      </View>
      
      {/* 2. Free Shipping */}
      <View style={styles.featureItem}>
        <Image source={featureIcons.shipping} style={styles.featureIconImage} resizeMode="contain" />
        <View style={styles.featureTextWrapper}>
          <Text style={styles.featureTitle}>Free Shipping</Text>
          <Text style={styles.featureSubtext}>On orders above 999</Text>
        </View>
      </View>
      
      {/* 3. Quality Assured */}
      <View style={styles.featureItem}>
        <Image source={featureIcons.quality} style={styles.featureIconImage} resizeMode="contain" />
        <View style={styles.featureTextWrapper}>
          <Text style={styles.featureTitle}>Quality Assured</Text>
          <Text style={styles.featureSubtext}>100% Original</Text>
        </View>
      </View>
      
      {/* 4. Handpicked Heritage */}
      <View style={styles.featureItem}>
        <Image source={featureIcons.heritage} style={styles.featureIconImage} resizeMode="contain" />
        <View style={styles.featureTextWrapper}>
          <Text style={styles.featureTitle}>Handpicked Heritage</Text>
          <Text style={styles.featureSubtext}>Styles for you</Text>
        </View>
      </View>
    </View>
  );

  // ✅ Header component with dynamic categories
  const ListHeaderComponent = () => (
    <>
      {/* Banner Slider */}
      <BannerSlider />

      {/* Dynamic Categories with Icons - Navigate on press */}
      <View style={styles.categoryWrapper}>
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={categories}
          keyExtractor={item => item._id || 'all'}
          renderItem={({ item }) => <CategoryItem item={item} />}
          contentContainerStyle={styles.categoryList}
        />
      </View>

      {/* Feature Badges with Image Icons */}
      <FeatureBadges />
    </>
  );

  // Footer component
  const ListFooterComponent = () => (
    <>
      {/* New Arrival Section */}
      <View style={styles.newArrivalSection}>
        <View style={styles.newArrivalHeader}>
          <Text style={styles.newArrivalTitle}>New Arrival</Text>
          <TouchableOpacity onPress={() => {
            // Navigate to CategoryScreen for New Arrival
            navigateToCategory('New Arrival');
          }}>
            <Text style={styles.seeAllText}>
              See All
            </Text>
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
            renderItem={renderProductCard}
            scrollEnabled={false}
          />
        )}
      </View>

      {/* Trending Section */}
      <View style={styles.newArrivalSection}>
        <View style={styles.newArrivalHeader}>
          <Text style={styles.newArrivalTitle}>Trending</Text>
          <TouchableOpacity onPress={() => {
            // Navigate to CategoryScreen for Trending
            navigateToCategory('Trending');
          }}>
            <Text style={styles.seeAllText}>
              See All
            </Text>
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
            renderItem={renderProductCard}
            scrollEnabled={false}
          />
        )}
      </View>
    </>
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={[]}
        keyExtractor={() => 'main-scroll'}
        renderItem={null}
        ListHeaderComponent={ListHeaderComponent}
        ListFooterComponent={ListFooterComponent}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 70 }}
        keyboardShouldPersistTaps="handled"
      />

      {/* ✅ Filter Modal */}
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
  },
  titleSection: {
    marginVertical: 10,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
  },
  subtitle: {
    fontSize: 18,
    color: '#aaa',
  },
  searchSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 10,
    backgroundColor: '#f2f2f2',
    borderRadius: 10,
    paddingLeft: 16,
    paddingRight: 0,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    paddingVertical: 10,
  },
  searchIconWrapper: {
    backgroundColor: '#151515',
    padding: 10,
    borderRadius: 10,
    marginLeft: 10,
  },
  searchInfoContainer: {
    marginVertical: 8,
    paddingHorizontal: 5,
  },
  searchInfoText: {
    fontSize: 14,
    color: '#666',
  },
  searchQueryText: {
    fontWeight: 'bold',
    color: '#000',
  },
  
  // ============================================
  // CATEGORY STYLES - With Icons
  // ============================================
  categoryWrapper: {
    marginVertical: 10,
  },
  categoryList: {
    paddingHorizontal: 2,
  },
  categoryItem: {
    alignItems: 'center',
    marginRight: 20,
    paddingVertical: 6,
  },
  categoryItemActive: {
    // Active state styling
  },
  categoryIconWrapper: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  categoryIconWrapperActive: {
    backgroundColor: '#96252A',
    borderColor: '#96252A',
  },
  categoryIcon: {
    width: 30,
    height: 30,
    tintColor: '#96252A',
  },
  categoryIconActive: {
    tintColor: '#FFFFFF',
  },
  categoryName: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
    textAlign: 'center',
  },
  categoryNameActive: {
    color: '#96252A',
    fontWeight: '600',
  },

  // ============================================
  // FEATURE BADGES - With Image Icons
  // ============================================
  featuresContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#F8F4F0',
    borderRadius: 10,
    paddingVertical: 5,
    paddingHorizontal: 4,
    marginVertical: 3,
    marginHorizontal: 2,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    paddingHorizontal: 1,
  },
  featureIconImage: {
    width: 25,
    height: 25,
    tintColor: '#96252A',
    marginRight: 2,
  },
  featureTextWrapper: {
    flex: 1,
  },
  featureTitle: {
    fontSize: 9,
    color: '#96252A',
    fontWeight: '700',
    lineHeight: 12,
  },
  featureSubtext: {
    fontSize: 7.5,
    color: '#888',
    fontWeight: '400',
    lineHeight: 10,
  },

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
  newArrivalSection: {
    marginTop: 10,
  },
  newArrivalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  newArrivalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
  },
  seeAllText: {
    fontSize: 14,
    color: '#96252A',
    fontWeight: '600',
  },
  noRecordsText: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    marginTop: 20,
  },
  itemImage: {
    width: '100%',
    height: 150,
    borderRadius: 10,
  },
  itemLabel: {
    marginTop: 10,
    fontSize: 16,
  },
  itemPrice: {
    marginTop: 5,
    fontSize: 14,
    color: '#888',
  },
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
  categoryImage: {
    height: 30,
    width: 30,
  },
  sliderSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginVertical: 10,
  },
  slider: {
    flex: 1,
    marginHorizontal: 20,
  },
  sliderLabel: {
    fontSize: 14,
    color: '#888',
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
  button: {
    marginTop: 10,
    alignSelf: 'center',
  },

  // ============================================
  // BANNER SLIDER STYLES
  // ============================================
  bannerWrapper: {
    marginVertical: 10,
    borderRadius: 12,
    overflow: 'hidden',
    position: 'relative',
  },
  bannerImage: {
    width: width - 30,
    height: 180,
    borderRadius: 12,
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
});

// export default Dashboard;