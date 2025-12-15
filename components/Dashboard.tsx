import React, { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  TextInput,
  FlatList,
  Modal,
  SafeAreaView,
  Dimensions,
  ActivityIndicator,
} from "react-native";
import MaterialIcons from "react-native-vector-icons/MaterialIcons";
import Slider from "@react-native-community/slider";
const { width } = Dimensions.get("window");
import { StyleSheet } from "react-native";
import { StackNavigationProp } from "@react-navigation/stack";
import { useNavigation } from '@react-navigation/native';
import { addToFavoritesList } from "./apiHelper/apiService";
import Rating from "./screens/RatingStars";
import { RootStackParamList } from "./models/types";
import eventBus from "./apiHelper/eventBus";
interface Params {
  mainCategory?: string;
  category?: string;
  search?: string;
  minPrice?: number;
  maxPrice?: number;
}

export default function Dashboard() {
  const [newArrivals, setNewArrivals] = useState([]);
  const [trendingItems, setTrendingItems] = useState([]);
  const [loading, setLoading] = useState<boolean>(true);

  const [showAllNew, setShowAllNew] = useState(false);
  const [showAllTrending, setShowAllTrending] = useState(false);

  const [searchText, setSearchText] = useState("");
  const [mainCategory, setMainCategory] = useState("");

  const [selectedCategory, setSelectedCategory] = useState("");
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 0]);
  const [distanceRange, setDistanceRange] = useState([500, 2000]);

  const [modalVisible, setModalVisible] = useState(false);
  const [menuVisible, setMenuVisible] = useState(false);
  const isFirstRender = useRef(true);

  const CATEGORIES = [
    { label: "All", value: "" },
    { label: "Sarees", value: "Saree" },
    { label: "Dress Materials", value: "dress" },
    { label: "Kurta Sets", value: "kurta" },
    { label: "Dupattas", value: "dupatta" },
  ];
  useEffect(() => {
    // Determine the mainCategory for each section
    const newArrivalCategory = mainCategory || "New Arrival";
    const trendingCategory = mainCategory || "Trending";
    console.log(mainCategory);

    // Build dynamic filters for both sections
    const dynamicFilters: any = {};
    if (searchText) dynamicFilters.searchText = searchText;
    if (selectedCategory) dynamicFilters.selectedCategory = selectedCategory;
    if (priceRange?.[0] || priceRange?.[1]) dynamicFilters.priceRange = priceRange;

    // Fetch sections
    fetchNewArrivals({
      mainCategory: newArrivalCategory,
      ...dynamicFilters
    });

    fetchTrending({
      mainCategory: trendingCategory,
      ...dynamicFilters
    });
  }, [mainCategory, searchText, selectedCategory, priceRange, distanceRange]);

  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();
  function addToFavorites(_id: number | undefined) {
    addToFavoritesList(_id);
    eventBus.emit("ITEM_REMOVED", { id: 123 });
  }
  const redirectToProductDetails = (id) => {
    navigation.navigate('ProductDetails', { itemId: id });
  };

  const fetchNewArrivals = async ({
    mainCategory,
    searchText,
    selectedCategory,
    priceRange
  }: {
    mainCategory?: string;
    searchText?: string;
    selectedCategory?: string;
    priceRange?: [number, number];
  }) => {
    try {
      const params: any = {};
      if (mainCategory) params.mainCategory = mainCategory;
      if (searchText) params.search = searchText;
      if (selectedCategory) params.category = selectedCategory;
      if (priceRange?.[0]) params.minPrice = priceRange[0];
      if (priceRange?.[1]) params.maxPrice = priceRange[1];
      console.log(params);

      const queryString = Object.keys(params)
        .map(key => `${encodeURIComponent(key)}=${encodeURIComponent(params[key])}`)
        .join("&");

      const url = `https://ecappbe-sanasaheritages-projects.vercel.app/api/products${queryString ? "?" + queryString : ""}`;

      const res = await fetch(url);
      const data = await res.json();
      setLoading(false);

      setNewArrivals(data || []);
    } catch (err) {
      console.error(err);
      setLoading(false);

    }
  };


  const fetchTrending = async ({
    mainCategory,
    searchText,
    selectedCategory,
    priceRange
  }: {
    mainCategory?: string;
    searchText?: string;
    selectedCategory?: string;
    priceRange?: [number, number];
  }) => {
    try {
      setLoading(true);

      const params: any = {}; // mainCategory fixed
      if (searchText) params.mainCategory = mainCategory;
      if (searchText) params.search = searchText;
      if (selectedCategory) params.category = selectedCategory;
      if (priceRange?.[0]) params.minPrice = priceRange[0];
      if (priceRange?.[1]) params.maxPrice = priceRange[1];

      const queryString = Object.keys(params)
        .map(key => `${encodeURIComponent(key)}=${encodeURIComponent(params[key])}`)
        .join("&");

      const url = `https://ecappbe-sanasaheritages-projects.vercel.app/api/products${queryString ? "?" + queryString : ""}`;

      const res = await fetch(url);
      const data = await res.json();

      setTrendingItems(data || []);
      setLoading(false);

    } catch (err) {
      setLoading(false);
      console.error(err);
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
  const itemsToShowTrending = showAllTrending ? trendingItems : trendingItems.slice(0, 4);

  const handleSearchChange = (text: string) => setSearchText(text);
  const assignFilterItem = (category: string) => {
    setSelectedCategory(category);
    setMainCategory("");
  }

  const applyFilter = () => {
    setModalVisible(false);

    fetchNewArrivals({
      mainCategory,
      searchText,
      selectedCategory,
      priceRange
    });

    fetchTrending({
      mainCategory,
      searchText,
      selectedCategory,
      priceRange
    });
  };


  const navigateToCategory = (category: string) => {
    navigation.navigate("CategoryScreen", { mainCategory: category });
  };
  const renderPrice = (price, discount) => {
    const discountedPrice = price - (price * discount / 100);
    return (
      <View>
        <View style={styles.priceContainer}>
          <Text style={styles.discountedPrice}>₹{discountedPrice?.toFixed(2)}</Text>
          <Text style={styles.originalPrice}>₹{price?.toFixed(2)}</Text>
        </View>
        <Text style={styles.discountPercent}>{discount}% off</Text>
      </View>
    );
  };

  const renderProductCard = (item) => (
    <TouchableOpacity
      style={styles.productCard}
      onPress={() => redirectToProductDetails(item._id)}
      activeOpacity={0.8}
    >
      <View style={styles.imageWrapper}>
        <Image
          source={
            item.image
              ? { uri: item.image }
              : require("../assets/images/logo.png")
          }
          style={styles.productImage}
        />

        <TouchableOpacity
          style={styles.favoriteBtn}
          onPress={() => addToFavorites(item._id)}
        >
          <MaterialIcons name="favorite-border" size={20} color="#000" />
        </TouchableOpacity>

        {item.discount > 0 && (
          <View style={styles.discountBadge}>
            <Text style={styles.discountBadgeText}>
              {item.discount}% OFF
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
            ₹{(item.price - (item.price * item.discount) / 100).toFixed(0)}
          </Text>
          <Text style={styles.strikePrice}>₹{item.price}</Text>
        </View>

        {item.rating !== undefined && (
          <Rating value={item.rating} />
        )}
      </View>
    </TouchableOpacity>
  );


  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={{ paddingBottom: 70 }}>
        <View style={styles.titleSection}>
          <Text style={styles.title}>Explore</Text>
          <Text style={styles.subtitle}>best Outfits for you</Text>
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
          <View>
            <Text>{"Recent searches"}</Text>
            <Text>{"Search results showing for "}{searchText}</Text>
          </View>
        ) : null}

        <View style={styles.categoryWrapper}>
          <FlatList
            horizontal
            showsHorizontalScrollIndicator={false}
            data={CATEGORIES}
            keyExtractor={(item) => item.label}
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


        <View style={styles.newArrivalSection}>
          <View style={styles.newArrivalHeader}>
            <Text style={styles.newArrivalTitle}>New Arrival</Text>
            <TouchableOpacity onPress={(e) => navigateToCategory('New Arrival')} style={styles.button}>
              <Text style={styles.seeAllText}>{showAllNew ? "Show Less" : "See All"}</Text>
            </TouchableOpacity>
          </View>
          {itemsToShowNew.length === 0 ? (
            <Text style={styles.seeAllText}>No Records found</Text>
          ) : (
            <FlatList
              nestedScrollEnabled
              data={itemsToShowNew}
              keyExtractor={(item, index) => index.toString()}
              numColumns={2}
              columnWrapperStyle={styles.columnWrapper}
              renderItem={({ item }) => renderProductCard(item)}
            />
          )}
        </View>

        <View style={styles.newArrivalSection}>
          <View style={styles.newArrivalHeader}>
            <Text style={styles.newArrivalTitle}>Trending</Text>
            <TouchableOpacity onPress={(e) => navigateToCategory('Trending')} style={styles.button}>
              <Text style={styles.seeAllText}>{showAllTrending ? "Show Less" : "See All"}</Text>
            </TouchableOpacity>
          </View>
          {itemsToShowTrending.length === 0 ? (
            <Text style={styles.seeAllText}>No Records found</Text>
          ) : (
            <FlatList
              nestedScrollEnabled
              data={itemsToShowTrending}
              keyExtractor={(item, index) => index.toString()}
              numColumns={2}
              columnWrapperStyle={styles.columnWrapper}
              renderItem={({ item }) => renderProductCard(item)}
            />
          )}
        </View>
      </ScrollView>

      <Modal
        animationType="slide"
        transparent
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Text style={styles.clearText}>Clear</Text>
              </TouchableOpacity>
              <Text style={styles.modalTitle}>Filters</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <MaterialIcons name="menu" size={24} color="black" />
              </TouchableOpacity>
            </View>

            {/* Category Filter */}
            <Text style={styles.filterSectionTitle}>Category</Text>
            <View style={styles.categoryFilter}>
              <TouchableOpacity style={styles.categoryFilterButton} onPress={(e) => navigateToCategory('New Arrival')}>
                <Text style={styles.categoryFilterText}>New Arrival</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.categoryFilterButton} onPress={(e) => navigateToCategory('Trending')} >
                <Text style={styles.categoryFilterText}>Trending</Text>
              </TouchableOpacity>
              {/* <TouchableOpacity style={styles.categoryFilterButton}>
                <Text style={styles.categoryFilterText}>Featured Products</Text>
              </TouchableOpacity> */}
            </View>

            {/* Price Filter */}
            <Text style={styles.filterSectionTitle}>Pricing</Text>
            <View style={styles.sliderSection}>
              <Text style={styles.sliderLabel}>₹{priceRange[0]}</Text>
              <Slider
                style={styles.slider}
                minimumValue={50}
                maximumValue={10000}
                value={priceRange[0]}
                onValueChange={(value) => setPriceRange([Math.round(value), priceRange[1]])}
                minimumTrackTintColor="#ff6f61"
              />
              <Text style={styles.sliderLabel}>₹{priceRange[1]}</Text>
            </View>

            {/* Distance Filter */}
            <Text style={styles.filterSectionTitle}>Distance</Text>
            <View style={styles.sliderSection}>
              <Text style={styles.sliderLabel}>{distanceRange[0]}m</Text>
              <Slider
                style={styles.slider}
                minimumValue={500}
                maximumValue={2000}
                value={distanceRange[0]}
                onValueChange={(value) => setDistanceRange([Math.round(value), distanceRange[1]])}
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

  categoryWrapper: {
    marginVertical: 15,
  },

  categoryPill: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    backgroundColor: "#f2f2f2",
    borderRadius: 25,
    marginRight: 10,
  },

  categoryPillActive: {
    backgroundColor: "#151515",
  },

  categoryPillText: {
    fontSize: 14,
    color: "#333",
    fontWeight: "500",
  },

  categoryPillTextActive: {
    color: "#fff",
  },



  productCard: {
    width: "48%",
    backgroundColor: "#fff",
    borderRadius: 14,
    marginBottom: 16,
    elevation: 4,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
  },

  imageWrapper: {
    position: "relative",
  },

  productImage: {
    width: "100%",
    height: 180,
    borderTopLeftRadius: 14,
    borderTopRightRadius: 14,
  },

  favoriteBtn: {
    position: "absolute",
    top: 10,
    right: 10,
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 6,
    elevation: 3,
  },

  discountBadge: {
    position: "absolute",
    bottom: 10,
    left: 10,
    backgroundColor: "#950C21",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },

  discountBadgeText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "bold",
  },

  productInfo: {
    padding: 10,
  },

  productTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: "#222",
  },

  priceRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 6,
  },

  finalPrice: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#000",
    marginRight: 8,
  },

  strikePrice: {
    fontSize: 14,
    color: "#888",
    textDecorationLine: "line-through",
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
    textAlign: "center",
  },
  categoryImage: {
    height: 30,
    width: 30
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
    alignSelf: "center",
  },
});