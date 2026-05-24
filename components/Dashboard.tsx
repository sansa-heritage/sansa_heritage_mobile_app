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
import { addToFavoritesList } from './apiHelper/apiService';
import Rating from './screens/RatingStars';
import { RootStackParamList } from './models/types';
import eventBus from './apiHelper/eventBus';

// Base URL for images
const BASE_URL = 'https://ecappbe-sanasaheritages-projects.vercel.app';

// Helper function to get image source
const getImageSource = (item: any) => {
  // Check images array first
  if (item.images && Array.isArray(item.images) && item.images.length > 0) {
    const image = item.images[0];
    if (image) {
      if (image.startsWith('data:image')) return { uri: image };
      if (image.startsWith('http')) return { uri: image };
      if (image.startsWith('/')) return { uri: `${BASE_URL}${image}` };
      return { uri: `${BASE_URL}/${image}` };
    }
  }
  // Fallback to single image field
  if (item.image) {
    if (item.image.startsWith('data:image')) return { uri: item.image };
    if (item.image.startsWith('http')) return { uri: item.image };
    if (item.image.startsWith('/')) return { uri: `${BASE_URL}${item.image}` };
    return { uri: `${BASE_URL}/${item.image}` };
  }
  // Default placeholder
  return require('../assets/images/logo.png');
};

export default function Dashboard() {
  const [newArrivals, setNewArrivals] = useState([]);
  const [trendingItems, setTrendingItems] = useState([]);
  const [loading, setLoading] = useState<boolean>(true);

  const [showAllNew, setShowAllNew] = useState(false);
  const [showAllTrending, setShowAllTrending] = useState(false);

  const [searchText, setSearchText] = useState('');
  const [mainCategory, setMainCategory] = useState('');

  const [selectedCategory, setSelectedCategory] = useState('');
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 10000]);
  const [distanceRange, setDistanceRange] = useState([500, 2000]);

  const [modalVisible, setModalVisible] = useState(false);
  const [menuVisible, setMenuVisible] = useState(false);
  const isFirstRender = useRef(true);

  // FIXED: Correct category values for API
  const CATEGORIES = [
    { label: 'All', value: '' },
    { label: 'Sarees', value: 'Sarees' },
    { label: 'Dress Materials', value: 'Dress Materials' },
    { label: 'Kurta Sets', value: 'Kurta Sets' },
    { label: 'Dupattas', value: 'Dupattas' },
  ];

  useEffect(() => {
    console.log('🔄 useEffect triggered');
    console.log('📊 Current state - searchText:', searchText);
    console.log('📊 Current state - selectedCategory:', selectedCategory);
    console.log('📊 Current state - priceRange:', priceRange);
    const dynamicFilters: any = {};

    if (searchText) dynamicFilters.searchText = searchText;
    if (selectedCategory) dynamicFilters.selectedCategory = selectedCategory;
    if (priceRange?.[0] !== undefined)
      dynamicFilters.priceRange = [priceRange[0], priceRange[1]];
    console.log('📤 Dynamic filters being sent:', dynamicFilters);

    fetchNewArrivals(dynamicFilters);
    fetchTrending(dynamicFilters);
  }, [searchText, selectedCategory, priceRange, distanceRange]);

  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();

  function addToFavorites(_id: number | undefined) {
    addToFavoritesList(_id);
    eventBus.emit('ITEM_REMOVED', { id: 123 });
  }

  const redirectToProductDetails = id => {
    navigation.navigate('ProductDetails', { itemId: id });
  };

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
      const params: any = {
        isNewArrival: true,
      };

      if (searchText) params.search = searchText;
      if (selectedCategory) params.category = selectedCategory;
      if (priceRange?.[0]) params.minPrice = priceRange[0];
      if (priceRange?.[1]) params.maxPrice = priceRange[1];
      console.log('📦 New Arrivals Params:', params);
      console.log('🔗 selectedCategory value being sent:', selectedCategory);
      const queryString = Object.keys(params)
        .map(
          key =>
            `${encodeURIComponent(key)}=${encodeURIComponent(params[key])}`,
        )
        .join('&');

      const url = `https://ecappbe-sanasaheritages-projects.vercel.app/api/products${
        queryString ? '?' + queryString : ''
      }`;
      console.log('🌐 New Arrivals API URL:', url);

      const res = await fetch(url);
      const data = await res.json();

      console.log('✅ New Arrivals Response count:', data?.length || 0);

      setNewArrivals(data || []);
      setLoading(false);
    } catch (err) {
      console.error(err);
      setLoading(false);
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
      const params: any = {
        isTrending: true,
      };

      if (searchText) params.search = searchText;
      if (selectedCategory) params.category = selectedCategory;
      if (priceRange?.[0]) params.minPrice = priceRange[0];
      if (priceRange?.[1]) params.maxPrice = priceRange[1];

      const queryString = Object.keys(params)
        .map(
          key =>
            `${encodeURIComponent(key)}=${encodeURIComponent(params[key])}`,
        )
        .join('&');

      const url = `https://ecappbe-sanasaheritages-projects.vercel.app/api/products${
        queryString ? '?' + queryString : ''
      }`;

      const res = await fetch(url);
      const data = await res.json();
      setTrendingItems(data || []);
      setLoading(false);
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0000ff" />
      </View>
    );
  }

  const itemsToShowNew = showAllNew ? newArrivals : newArrivals.slice(0, 4);
  const itemsToShowTrending = showAllTrending
    ? trendingItems
    : trendingItems.slice(0, 4);

  const handleSearchChange = (text: string) => setSearchText(text);

  const assignFilterItem = (category: string) => {
    console.log('🔍 Category clicked:', category);
    console.log('🔍 Current selectedCategory before:', selectedCategory);
    setSelectedCategory(category);
    console.log('🔍 selectedCategory set to:', category);
  };

  const applyFilter = async () => {
    setModalVisible(false);
    setLoading(true);

    await Promise.all([
      fetchNewArrivals({ searchText, selectedCategory, priceRange }),
      fetchTrending({ searchText, selectedCategory, priceRange }),
    ]);

    setLoading(false);
  };

  const clearFilters = () => {
    setSearchText('');
    setSelectedCategory('');
    setPriceRange([0, 10000]);
    setDistanceRange([500, 2000]);

    setModalVisible(false);
    fetchNewArrivals({});
    fetchTrending({});
  };

  const navigateToCategory = (category: string) => {
    navigation.navigate('CategoryScreen', { mainCategory: category });
  };

  const renderPrice = (price, discount) => {
    const discountedPrice = price - (price * discount) / 100;
    return (
      <View>
        <View style={styles.priceContainer}>
          <Text style={styles.discountedPrice}>
            ₹{discountedPrice?.toFixed(2)}
          </Text>
          <Text style={styles.originalPrice}>₹{price?.toFixed(2)}</Text>
        </View>
        <Text style={styles.discountPercent}>{discount}% off</Text>
      </View>
    );
  };

  const renderProductCard = ({ item }) => (
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

  // Header component for the main FlatList
  const ListHeaderComponent = () => (
    <>
      <View style={styles.titleSection}>
        <Text style={styles.title}>Explore</Text>
        <Text style={styles.subtitle}>Best outfits for you</Text>
      </View>

      <View style={styles.searchSection}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search items..."
          value={searchText}
          onChangeText={handleSearchChange}
          placeholderTextColor="#888"
        />
        <TouchableOpacity
          style={styles.searchIconWrapper}
          onPress={() => setModalVisible(true)}
        >
          <MaterialIcons name="filter-list" size={24} color="white" />
        </TouchableOpacity>
      </View>

      {searchText ? (
        <View style={styles.searchInfoContainer}>
          <Text style={styles.searchInfoText}>
            Search results for:{' '}
            <Text style={styles.searchQueryText}>{searchText}</Text>
          </Text>
        </View>
      ) : null}

      <View style={styles.categoryWrapper}>
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={CATEGORIES}
          keyExtractor={item => item.label}
          renderItem={({ item }) => {
            const isActive = selectedCategory === item.value;
            return (
              <TouchableOpacity
                onPress={() => assignFilterItem(item.value)}
                style={[
                  styles.categoryPill,
                  isActive && styles.categoryPillActive,
                ]}
              >
                <Text
                  style={[
                    styles.categoryPillText,
                    isActive && styles.categoryPillTextActive,
                  ]}
                >
                  {item.label}
                </Text>
              </TouchableOpacity>
            );
          }}
        />
      </View>
    </>
  );

  // Footer component for the main FlatList
  const ListFooterComponent = () => (
    <>
      {/* New Arrivals Section */}
      <View style={styles.newArrivalSection}>
        <View style={styles.newArrivalHeader}>
          <Text style={styles.newArrivalTitle}>New Arrival</Text>
          <TouchableOpacity
            onPress={() => navigateToCategory('New Arrival')}
            style={styles.button}
          >
            <Text style={styles.seeAllText}>
              {showAllNew ? 'Show Less' : 'See All'}
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
          <TouchableOpacity
            onPress={() => navigateToCategory('Trending')}
            style={styles.button}
          >
            <Text style={styles.seeAllText}>
              {showAllTrending ? 'Show Less' : 'See All'}
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
        data={[]} // Empty array - this FlatList just provides scrolling
        keyExtractor={() => 'main-scroll'}
        renderItem={null}
        ListHeaderComponent={ListHeaderComponent}
        ListFooterComponent={ListFooterComponent}
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

            {/* Category Filter */}
            <Text style={styles.filterSectionTitle}>Category</Text>
            <View style={styles.categoryFilter}>
              <TouchableOpacity
                style={styles.categoryFilterButton}
                onPress={() => navigateToCategory('New Arrival')}
              >
                <Text style={styles.categoryFilterText}>New Arrival</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.categoryFilterButton}
                onPress={() => navigateToCategory('Trending')}
              >
                <Text style={styles.categoryFilterText}>Trending</Text>
              </TouchableOpacity>
            </View>

            {/* Price Filter */}
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

            {/* Distance Filter */}
            <Text style={styles.filterSectionTitle}>Distance</Text>
            <View style={styles.sliderSection}>
              <Text style={styles.sliderLabel}>{distanceRange[0]}m</Text>
              <Slider
                style={styles.slider}
                minimumValue={500}
                maximumValue={2000}
                value={distanceRange[0]}
                onValueChange={value =>
                  setDistanceRange([Math.round(value), distanceRange[1]])
                }
                minimumTrackTintColor="#ff6f61"
              />
              <Text style={styles.sliderLabel}>{distanceRange[1]}m</Text>
            </View>

            <TouchableOpacity style={styles.applyButton} onPress={applyFilter}>
              <Text style={styles.applyButtonText}>Apply Filter</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

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
  categoryWrapper: {
    marginVertical: 15,
  },
  categoryPill: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    backgroundColor: '#f2f2f2',
    borderRadius: 25,
    marginRight: 10,
  },
  categoryPillActive: {
    backgroundColor: '#151515',
  },
  categoryPillText: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
  categoryPillTextActive: {
    color: '#fff',
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
    color: '#151515',
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
    justifyContent: 'space-around',
    marginBottom: 20,
  },
  categoryFilterButton: {
    backgroundColor: '#151515',
    padding: 10,
    borderRadius: 20,
    width: '50%',
  },
  categoryFilterButtonInactive: {
    backgroundColor: '#f2f2f2',
    padding: 10,
    borderRadius: 20,
  },
  categoryFilterText: {
    color: '#fff',
    fontSize: 14,
    textAlign: 'center',
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
    backgroundColor: '#151515',
    borderRadius: 35,
    paddingVertical: 15,
    alignItems: 'center',
    marginTop: 10,
  },
  applyButtonText: {
    color: '#fff',
    fontSize: 16,
  },
  button: {
    marginTop: 10,
    alignSelf: 'center',
  },
});
