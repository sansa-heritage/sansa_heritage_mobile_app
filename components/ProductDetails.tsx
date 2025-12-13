import React, { useEffect, useState } from 'react';
import { ScrollView, View, Text, Image, TouchableOpacity, StyleSheet, Alert, ActivityIndicator, Modal, FlatList } from 'react-native';
import FontAwesome from "react-native-vector-icons/FontAwesome";
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import config from '../config/config';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { addToFavoritesList, getAddresses } from './apiHelper/apiService';
import { Dimensions } from 'react-native';
import { RootStackParamList } from './models/types';
import eventBus from './apiHelper/eventBus';
import Ionicons from "react-native-vector-icons/Ionicons";
import { Address } from './models/address';
import Rating from './screens/RatingStars';
import { Toast } from './screens/Toast';
const { width, height } = Dimensions.get('window');
interface ProductDetails {
  image: string;
  name: string;
  description: string;
  price: number;
  discount: number;
  availableColors: string[];
  avaialbleSizes: string[];
  _id: number;
  details: string[];
  brand: string;
  rating: number;
}


const ProductPage = () => {
  const [selectedColor, setSelectedColor] = useState<string | null>(null);
  const [productDetails, setProductDetails] = useState<ProductDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  type ProductDetailsRouteProp = RouteProp<RootStackParamList, 'ProductDetails'>;
  const route = useRoute<ProductDetailsRouteProp>();
  const { itemId } = route.params;
  const navigation = useNavigation<StackNavigationProp<RootStackParamList, 'ProductDetails'>>();
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const normalNavigation = useNavigation();
  const [modalVisible, setModalVisible] = useState(false);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [selectedAddress, setSelectedAddress] = useState<any>({});


  useEffect(() => {
    const fetchToken = async () => {
      try {
        const storedToken = await AsyncStorage.getItem('authToken');
        const storedUserId = await AsyncStorage.getItem('userID');

        if (storedToken) setToken(storedToken);
        if (storedUserId) setUserId(storedUserId);

        if (!storedToken) {
          console.warn('No token found in AsyncStorage');
        }
      } catch (err) {
        console.error('Error fetching token:', err);
      }
    };

    const fetchProductDetails = async () => {
      if (!token) return; // Ensure token is available before making the request
      setLoading(true);
      setError(null);

      try {
        const response = await fetch(`${config.baseURL}api/products/${itemId}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        setProductDetails(data);
      } catch (err) {
        setError('Failed to load product details');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    const initialize = async () => {
      await fetchToken();
      if (token) {
        fetchProductDetails();
      }
    };

    initialize();


    const fetchData = async () => {
      try {
        const result = await getAddresses();
        setAddresses(result);
      } catch (err) {
        console.log(err);
      }
    };

    fetchData();
  }, [itemId, token]);
  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0000ff" />
      </View>
    );
  }
  const handleAddToCart = async () => {
    if (!token || !userId) {
      Alert.alert('Error', 'Token or user ID is missing. Unable to add product to cart.');
      return;
    }

    setLoading(true);
    setError(null);

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
          color: selectedColor,
          size: selectedSize
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      Toast.show('Success', 'Product added to cart successfully!');
      eventBus.emit("ITEM_REMOVED", { id: 123 });
      navigation.navigate('CartPage', { itemId: selectedAddress?._id });
      if (selectedAddress) {
        await AsyncStorage.setItem("selectedAddress", JSON.stringify(selectedAddress));
      }

    } catch (err) {
      setError('Failed to add product to cart. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  function addToFavorites(_id: number | undefined) {
    addToFavoritesList(_id)
    eventBus.emit("ITEM_REMOVED", { id: 123 });
  }



  const openAddressPopup = async () => {
    setModalVisible(true);
    setLoading(true);

    const result = await getAddresses();
    setAddresses(result);
    setLoading(false);
  };
  const renderPrice = (price, discount) => {
    const discountedPrice = price - (price * discount / 100);
    return (
      <View style={styles.priceContainer}>
        <Text style={styles.discountedPrice}>₹{discountedPrice?.toFixed(2)}</Text>
        <Text style={styles.originalPrice}>₹{price?.toFixed(2)}</Text>
        <Text style={styles.discountPercent}>{discount}% off</Text>
      </View>
    );
  };
  return (
    <ScrollView
      contentContainerStyle={styles.scrollContainer}
      keyboardShouldPersistTaps="handled"
    >
      <View style={styles.container}>
        {productDetails ? (
          <>
            {/* Image & Favorite */}
            <View style={styles.imageContainer}>
              <Image source={{ uri: productDetails?.image }} style={styles.image} />
              <View style={styles.header}>
                <TouchableOpacity
                  style={styles.favoriteButton}
                  onPress={() => addToFavorites(productDetails?._id)}
                >
                  <FontAwesome name="heart" size={24} color="red" />
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.BottomContainer}>
              <View style={styles.itemDetailsContainer}>
                <Text style={styles.brandText}>{productDetails?.brand ?? "Brand"}</Text>
              </View>

              <Text style={styles.productName}>{productDetails?.name}</Text>
              <View style={styles.ratingSection}>
              {productDetails.rating !== undefined && <Rating value={productDetails.rating} />}
              </View>
              <View style={styles.priceBlock}>
                <Text style={styles.mainPrice}>₹{(productDetails.price - (productDetails.price * productDetails.discount / 100)).toFixed(0)}</Text>

                <View style={{ flexDirection: "row", alignItems: "center", marginTop: 5 }}>
                  <Text style={styles.mrpText}>MRP </Text>
                  <Text style={styles.mrpStrike}>₹{productDetails.price}</Text>
                  {productDetails.discount > 0 &&
                    <Text style={styles.discountText}> ({productDetails.discount}% OFF)</Text>}
                </View>

                <Text style={styles.taxIncluded}>Price inclusive of all taxes</Text>
              </View>

              {/* <View style={styles.offerBox}>
                <View style={styles.offerLeft}>
                  <Text style={styles.offerLabel}>Use Code</Text>
                  <Text style={styles.offerCode}>GAPNEW15</Text>
                  <Text style={styles.offerLink}>T&C</Text>
                </View>

                <View style={styles.offerRight}>
                  <Text style={styles.offerPrice}>BBSPrice ₹2141</Text>
                  <Text style={styles.offerSubText}>Additional 15% off</Text>
                  <Text style={styles.offerViewMore}>View All Products</Text>
                </View>
              </View> */}

              {/* <Text style={styles.moreOffers}>+3 More</Text> */}

              <Text style={styles.colorTitle}>{selectedColor}</Text>
              <View style={styles.colorRow}>
                {productDetails.availableColors.map((color, index) => {
                  const cleanColor = color?.trim()?.toLowerCase();

                  return (
                    <TouchableOpacity
                      key={index}
                      style={[
                        styles.colorCircle,
                        { backgroundColor: cleanColor },
                        selectedColor === cleanColor && styles.selectedColorCircle
                      ]}
                      onPress={() => setSelectedColor(cleanColor)}
                    />
                  );
                })}

              </View>

              <Text style={styles.sizeTitle}>Select Size ({selectedSize})</Text>
              <View style={styles.sizeRow}>
                {productDetails.avaialbleSizes.map((size, index) => (
                  <TouchableOpacity
                    key={index}
                    style={[
                      styles.sizeChip,
                      selectedSize === size && styles.sizeChipSelected
                    ]}
                    onPress={() => setSelectedSize(size)}
                  >
                    <Text
                      style={[
                        styles.sizeChipText,
                        selectedSize === size && styles.sizeChipTextSelected
                      ]}
                    >
                      {size}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* <Text style={styles.sizeChart}>Check Size Chart</Text> */}
              <View style={styles.policyContainer}>
                <Text style={styles.title}>Delivery & Return Details</Text>
                {addresses.length > 0 &&
                  <View style={styles.locationRow}>
                    <Text style={styles.locationText}>
                      {(selectedAddress && selectedAddress.street)
                        ? `${selectedAddress.street}, ${selectedAddress.city}..., ${selectedAddress.zipCode}`
                        : `${addresses[0]?.street}, ${addresses[0]?.city}..., ${addresses[0]?.zipCode}`}
                    </Text>

                    <TouchableOpacity onPress={openAddressPopup}>
                      <Text style={styles.changeText}>Change</Text>
                    </TouchableOpacity>
                  </View>

                }
                <Modal visible={modalVisible} transparent animationType="slide">
                  <View style={styles.modalContainer}>
                    <View style={styles.modalBox}>
                      <Text style={styles.modalTitle}>Select Address</Text>

                      {loading ? (
                        <ActivityIndicator size="large" color="orange" />
                      ) : addresses.length > 0 ? (
                        <FlatList
                          data={addresses}
                          keyExtractor={(item) => item._id.toString()}
                          renderItem={({ item }) => (
                            <TouchableOpacity
                              style={[
                                styles.addressBox,
                                selectedAddress === item._id && styles.selectedBox,
                              ]}
                              onPress={() => {
                                setSelectedAddress(item);
                                setModalVisible(false)
                              }}
                            >
                              <View style={styles.row}>
                                <View style={styles.radioAndTitle}>
                                  <Ionicons
                                    name={
                                      selectedAddress === item._id
                                        ? "checkmark-circle"
                                        : "ellipse-outline"
                                    }
                                    size={24}
                                    color={
                                      selectedAddress === item._id ? "orange" : "grey"
                                    }
                                  />
                                  <Text style={styles.addressTitle}>{item.street}</Text>
                                </View>
                              </View>

                              <Text style={styles.addressInfo}>{item.city}</Text>
                              <Text style={styles.addressInfo}>{item.state}</Text>
                              <Text style={styles.addressInfo}>{item.country}</Text>
                            </TouchableOpacity>
                          )}
                        />
                      ) : (
                        <Text>No addresses found.</Text>
                      )}

                      <TouchableOpacity
                        style={styles.closeBtn}
                        onPress={() => setModalVisible(false)}
                      >
                        <Text style={styles.closeBtnText}>Close</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </Modal>

                {/* Static UI */}
                <View style={styles.itemRow}>
                  <FontAwesome name="refresh" size={20} color="#4CAF50" />
                  <View style={styles.rowText}>
                    <Text style={styles.boldText}>7 day Return and Exchange</Text>
                    <Text style={styles.linkText}>Return Policies</Text>
                  </View>
                </View>

                <View style={styles.itemRow}>
                  <FontAwesome name="money" size={20} color="#4CAF50" />
                  <Text style={styles.boldText}>
                    {" "}
                    Check COD availability at checkout
                  </Text>
                </View>
              </View>
              <View style={styles.detailsContainer}>
                <Text style={styles.sectionTitle}>Product Details</Text>

                <View style={styles.detailsGrid}>
                  {Array.isArray(productDetails.details)
                    ? productDetails.details.map((detail, index) => (
                      <View key={index} style={styles.detailItem}>
                        <Text style={styles.detailValue}>{detail}</Text>
                      </View>
                    ))
                    : Object.entries(productDetails.details || {}).map(([key, value], index) => (
                      <View
                        key={index}
                        style={[
                          styles.detailItem,
                          !value && styles.detailItemEmpty
                        ]}
                      >
                        <Text style={styles.detailValue}>{key}</Text>
                      </View>
                    ))
                  }
                </View>
              </View>
            </View>


            <TouchableOpacity
              style={styles.addToCartButton}
              onPress={handleAddToCart}
            >
              <Text style={styles.addToCartButtonText}>Add to Cart</Text>
            </TouchableOpacity>
          </>
        ) : (
          <Text style={styles.detailText}>No product data available.</Text>
        )}
      </View>
    </ScrollView>

  );
};

const styles = StyleSheet.create({
  itemDetailsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    paddingLeft: '2%'
  },
  scrollContainer: {
    flexGrow: 1,
    backgroundColor: 'white',
    paddingBottom: 70
  },
  container: {
    flex: 1,
    backgroundColor: '#3335470F',
    padding: 16,
    marginTop: 10
  },
  BottomContainer: {
    backgroundColor: '#fff',
    marginTop: -30,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    width: '100%',
    paddingTop: '10%'
  },
  imageContainer: {
    position: 'relative',
    backgroundColor: 'white',
    borderWidth: 2,
    borderColor: 'gray',
    borderRadius: 8,
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: undefined,
    aspectRatio: 1,
    resizeMode: 'contain',
  },
  header: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.6)',
    borderRadius: 20,
    padding: 5,
  },
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
  favoriteButton: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 8,
    padding: 9,
  },
  description: {
    marginBottom: 16,
    fontSize: 14,
    fontWeight: '400',
    lineHeight: 20,
    textAlign: 'left',
    padding: 9,
  },
  priceSection: {
    marginBottom: 10,
    fontSize: 12,
    fontWeight: '400',
    lineHeight: 20,
    textAlign: 'left',
    padding: 9,
  },
  price: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 16,
    padding: 9,
  },
  colorOptions: {
    marginTop: 5,
    padding: 9,
  },
  colorOption: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 15,
    marginRight: 8,
    padding: 4,
  },
  selectedColorOption: {
    borderWidth: 2,
    borderColor: 'blue',
  },
  addToCartButton: {
    backgroundColor: '#151515',
    borderRadius: 30,
    paddingVertical: 15,
    alignItems: 'center',
    marginTop: 10,
  },
  addToCartButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  sizeContainer: {
    marginTop: 5,
    padding: 9,
  },

  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  detailsContainer: {
    marginTop: 20,
    paddingHorizontal: 10
  },
  detailsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginTop: 10,
  },

  detailItem: {
    width: "48%",             // Two items per row
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#ccc",
    marginBottom: 12,
  },
  detailValue: {
    fontSize: 15,
    color: "#333",
    textAlign: "left",
  },

  detailItemEmpty: {
    borderBottomWidth: 0,
    paddingVertical: 0,
    marginBottom: 0,
  },
  detailCol: {
    width: '48%',
    marginBottom: 15,
  },

  detailLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 4,
  },
  detailText: {
    fontSize: 14,
    color: '#555',
    marginBottom: 5
  },
  sizeOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },

  sizeOption: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 6,
    paddingVertical: 10,
    paddingHorizontal: 16,
    marginRight: 8,
    marginBottom: 8,
    backgroundColor: '#fff',
    elevation: 2, // shadow for Android
  },

  selectedSizeOption: {
    borderColor: '#007AFF',
    backgroundColor: '#E6F0FF',
  },

  sizeText: {
    fontSize: 14,
    color: '#333',
  },

  selectedSizeText: {
    color: '#007AFF',
    fontWeight: '600',
  },
  brandText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#D4A017",
    marginBottom: -5
  },

  productName: {
    fontSize: 18,
    fontWeight: "600",
    color: "#000",
    marginBottom: 6,
    paddingHorizontal: 9
  },

  ratingSection: {
    marginLeft: 5
  },
  priceBlock: {
    paddingHorizontal: 9,
    marginBottom: 10
  },

  mainPrice: {
    fontSize: 24,
    fontWeight: "700",
    color: "#000"
  },

  mrpText: {
    fontSize: 14,
    color: "#555"
  },

  mrpStrike: {
    fontSize: 14,
    textDecorationLine: "line-through",
    marginHorizontal: 4
  },

  discountText: {
    fontSize: 14,
    color: "green",
    fontWeight: "600"
  },

  taxIncluded: {
    fontSize: 13,
    color: "#666",
    marginTop: 4
  },

  offerBox: {
    borderWidth: 1,
    borderColor: "#ccc",
    padding: 10,
    borderRadius: 8,
    backgroundColor: "#fff",
    marginHorizontal: 9,
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 10
  },

  offerLeft: {
    width: "40%"
  },

  offerRight: {
    width: "55%"
  },

  offerLabel: { fontSize: 12, color: "#444" },

  offerCode: { fontSize: 14, fontWeight: "700", marginVertical: 4 },

  offerLink: { fontSize: 12, color: "#007AFF", marginTop: 2 },

  offerPrice: { fontSize: 14, fontWeight: "600", marginBottom: 3 },

  offerSubText: { fontSize: 12, color: "#555" },

  offerViewMore: { fontSize: 12, color: "#007AFF", marginTop: 2 },

  moreOffers: {
    color: "#007AFF",
    fontWeight: "600",
    marginTop: 10,
    marginLeft: 12
  },

  colorTitle: {
    fontSize: 15,
    fontWeight: "600",
    marginTop: 14,
    marginLeft: 12
  },

  colorRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    marginTop: 8
  },

  colorCircle: {
    width: 35,
    height: 35,
    borderRadius: 20,
    marginRight: 10,
    borderWidth: 1,
    borderColor: "#ddd"
  },

  selectedColorCircle: {
    borderWidth: 2,
    borderColor: "#007AFF"
  },

  sizeTitle: {
    fontSize: 15,
    fontWeight: "600",
    marginTop: 18,
    marginLeft: 12
  },

  sizeRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginTop: 10,
    paddingHorizontal: 12,
    gap: 10
  },

  sizeChip: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: "#F4F4F4",
    borderWidth: 1,
    borderColor: "#ccc"
  },

  sizeChipSelected: {
    backgroundColor: "#E6F0FF",
    borderColor: "#007AFF"
  },

  sizeChipText: {
    fontSize: 14,
    color: "#333"
  },

  sizeChipTextSelected: {
    color: "#007AFF",
    fontWeight: "600"
  },

  sizeChart: {
    color: "#007AFF",
    marginTop: 10,
    marginLeft: 12
  },
  policyContainer: {
    backgroundColor: "#fff",
    padding: 15,
    borderRadius: 10,
    elevation: 2,
    marginHorizontal: 15,
    marginTop: 10,
  },
  policyTitle: { fontSize: 16, fontWeight: "700", marginBottom: 12 },

  locationRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    backgroundColor: "#f3f5f7",
    padding: 10,
    borderRadius: 8,
    alignItems: "center",
  },
  locationText: { fontSize: 14 },
  changeText: { color: "#1e88e5", fontWeight: "600" },

  // Modal UI
  modalContainer: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    padding: 20,
  },
  modalBox: {
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 20,
    maxHeight: "80%",
  },
  modalTitle: { fontSize: 18, fontWeight: "700", marginBottom: 10 },

  // Address items
  addressBox: {
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#ccc",
    marginBottom: 10,
  },
  selectedBox: {
    borderColor: "orange",
    backgroundColor: "#fff7eb",
  },
  row: { flexDirection: "row", justifyContent: "space-between" },
  radioAndTitle: { flexDirection: "row", alignItems: "center" },
  addressTitle: { marginLeft: 10, fontSize: 16, fontWeight: "600" },
  addressInfo: { color: "#555", marginTop: 4 },

  closeBtn: {
    marginTop: 10,
    backgroundColor: "black",
    padding: 12,
    borderRadius: 8,
  },
  closeBtnText: { textAlign: "center", color: "#fff" },
  itemRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 15,
  },
  rowText: {
    marginLeft: 10,
  },
  boldText: {
    fontSize: 14,
    color: "#000",
  },
  linkText: {
    fontSize: 13,
    color: "#1e88e5",
    marginTop: 4,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default ProductPage;
