import React, { useEffect, useState } from "react";
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
} from "react-native";
import FontAwesome from "react-native-vector-icons/FontAwesome";
import Ionicons from "react-native-vector-icons/Ionicons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";

import config from "../config/config";
import { RootStackParamList } from "./models/types";
import { addToFavoritesList, getAddresses } from "./apiHelper/apiService";
import { Address } from "./models/address";
import Rating from "./screens/RatingStars";
import eventBus from "./apiHelper/eventBus";
import { Toast } from "./screens/Toast";

const { width } = Dimensions.get("window");

interface ProductDetails {
  _id: number;
  image?: string;        // current API
  images?: string[];     // future API
  name: string;
  brand: string;
  price: number;
  discount: number;
  availableColors: string[];
  avaialbleSizes: string[];
  details: string[];
  rating: number;
}

type RouteProps = RouteProp<RootStackParamList, "ProductDetails">;

const ProductPage = () => {
  /* -------------------- HOOKS (ALWAYS TOP) -------------------- */
  const navigation = useNavigation<StackNavigationProp<any>>();
  const route = useRoute<RouteProps>();
  const { itemId } = route.params;

  const [productDetails, setProductDetails] =
    useState<ProductDetails | null>(null);
  const [selectedColor, setSelectedColor] = useState<string | null>(null);
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [selectedAddress, setSelectedAddress] = useState<Address | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  // image slider & zoom
  const [activeIndex, setActiveIndex] = useState(0);
  const [zoomVisible, setZoomVisible] = useState(false);
  const [zoomImage, setZoomImage] = useState<string | null>(null);

  /* -------------------- EFFECT -------------------- */
  useEffect(() => {
    const init = async () => {
      try {
        const storedToken = await AsyncStorage.getItem('authToken');
        const storedUserId = await AsyncStorage.getItem('userID');

        if (storedToken) setToken(storedToken);
        if (storedUserId) setUserId(storedUserId);

        const res = await fetch(
          `${config.baseURL}api/products/${itemId}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        const data = await res.json();
        console.log(data);

        setProductDetails(data);

        const addr = await getAddresses();
        setAddresses(addr);
        setSelectedAddress(addr?.[0] ?? null);
      } catch (e) {
        console.log(e);
      } finally {
        setLoading(false);
      }
    };

    init();
  }, [itemId]);

  /* -------------------- SAFE EARLY RETURN -------------------- */
  if (loading || !productDetails) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  /* -------------------- DERIVED VALUES -------------------- */
  const productImages =
    productDetails.images && productDetails.images.length > 0
      ? productDetails.images
      : productDetails.image
        ? [productDetails.image]
        : [];

  const finalPrice =
    productDetails.price -
    (productDetails.price * productDetails.discount) / 100;

  /* -------------------- ACTIONS -------------------- */
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
      Toast.show('success', 'Product added to cart successfully!');
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

  /* -------------------- UI -------------------- */
  return (
    <>
      <ScrollView contentContainerStyle={{ paddingBottom: 120 }}>
        {/* IMAGE SLIDER */}
        <View style={styles.imageWrapper}>
          <FlatList
            data={productImages}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            keyExtractor={(_, i) => i.toString()}
            onScroll={(e) => {
              const index = Math.round(
                e.nativeEvent.contentOffset.x / width
              );
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
          />

          {productImages.length > 1 && (
            <View style={styles.dotContainer}>
              {productImages.map((_, i) => (
                <View
                  key={i}
                  style={[
                    styles.dot,
                    activeIndex === i && styles.activeDot,
                  ]}
                />
              ))}
            </View>
          )}

          <TouchableOpacity
            style={styles.wishlist}
            onPress={() => addToFavoritesList(productDetails._id)}
          >
            <FontAwesome name="heart-o" size={20} />
          </TouchableOpacity>
        </View>

        {/* PRODUCT INFO */}
        <View style={styles.card}>
          <Text style={styles.title}>{productDetails.name}</Text>

          <View style={styles.ratingRow}>
            <Rating value={productDetails.rating} />
            <Text style={styles.ratingText}>{productDetails.rating}</Text>
          </View>

          <View style={styles.priceRow}>
            <Text style={styles.finalPrice}>₹{finalPrice.toFixed(0)}</Text>
            <Text style={styles.mrp}>₹{productDetails.price}</Text>
            <Text style={styles.off}>{productDetails.discount}% OFF</Text>
          </View>

          <Text style={styles.tax}>Inclusive of all taxes</Text>
        </View>

        {/* COLOR */}
        <View style={styles.card}>
          <Text style={styles.section}>Color</Text>
          <View style={styles.colorRow}>
            {productDetails.availableColors.map((c) => (
              <TouchableOpacity
                key={c}
                style={[
                  styles.colorDot,
                  { backgroundColor: c.toLowerCase() },
                  selectedColor === c && styles.colorActive,
                ]}
                onPress={() => setSelectedColor(c)}
              />
            ))}
          </View>
        </View>

        {/* SIZE */}
        <View style={styles.card}>
          <Text style={styles.section}>Select Size</Text>
          <View style={styles.sizeGrid}>
            {productDetails.avaialbleSizes.map((s) => (
              <TouchableOpacity
                key={s}
                style={[
                  styles.sizeBox,
                  selectedSize === s && styles.sizeActive,
                ]}
                onPress={() => setSelectedSize(s)}
              >
                <Text
                  style={[
                    styles.sizeText,
                    selectedSize === s && styles.sizeTextActive,
                  ]}
                >
                  {s}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* DELIVERY */}
        <View style={styles.card}>
          <Text style={styles.section}>Delivery & Return Details</Text>

          <View style={styles.deliveryRow}>
            <Ionicons name="location-outline" size={18} />
            <Text style={styles.deliveryText}>
              Deliver to {selectedAddress?.street}, {selectedAddress?.city}
            </Text>
          </View>

          <View style={styles.infoRow}>
            <Ionicons name="refresh-outline" size={18} />
            <Text style={styles.linkText}>7 Day Return & Exchange Policy</Text>
          </View>

          <View style={styles.infoRow}>
            <Ionicons name="cash-outline" size={18} />
            <Text style={styles.mutedText}>
              Cash on Delivery not available
            </Text>
          </View>
        </View>

        {/* DETAILS */}
        <View style={styles.card}>
          <Text style={styles.section}>Product Details</Text>
          {productDetails?.details?.map((d, i) => (
            <Text key={i} style={styles.detail}>
              • {d}
            </Text>
          ))}
        </View>
        {productDetails?.details?.length == 0 &&
          <Text style={styles.section}>No Details Found</Text>
        }
      </ScrollView>

      {/* FOOTER */}
      <View style={styles.footer}>
        <TouchableOpacity style={styles.buyNow}>
          <Text style={styles.buyText}>BUY NOW</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.cartBtn} onPress={handleAddToCart}>
          <View style={styles.cartContent}>
            <Ionicons name="bag-outline" size={18} color="#fff" />
            <Text style={styles.cartText}>ADD TO CART</Text>
          </View>
        </TouchableOpacity>
      </View>

      {/* IMAGE ZOOM */}
      <Modal visible={zoomVisible} transparent>
        <View style={styles.zoomContainer}>
          <TouchableOpacity
            style={styles.closeBtn}
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
              <Image
                source={{ uri: zoomImage }}
                style={styles.zoomImage}
                resizeMode="contain"
              />
            )}
          </ScrollView>
        </View>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  loader: { flex: 1, justifyContent: "center", alignItems: "center" },

  imageWrapper: { backgroundColor: "#fff" },
  image: { width, height: 380, resizeMode: "contain" },

  wishlist: {
    position: "absolute",
    top: 15,
    right: 15,
    backgroundColor: "#fff",
    padding: 8,
    borderRadius: 20,
  },

  dotContainer: {
    position: "absolute",
    bottom: 10,
    flexDirection: "row",
    alignSelf: "center",
    gap: 6,
  },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: "#ccc" },
  activeDot: { backgroundColor: "#000" },

  card: {
    backgroundColor: "#fff",
    marginTop: 5,
    padding: 16,
    borderRadius: 12,
  },

  title: { fontSize: 18, fontWeight: "600" },
  ratingRow: { flexDirection: "row", alignItems: "center" },
  ratingText: { marginLeft: 6 },

  priceRow: { flexDirection: "row", alignItems: "center", marginTop: 6 },
  finalPrice: { fontSize: 22, fontWeight: "700" },
  mrp: { marginHorizontal: 8, textDecorationLine: "line-through" },
  off: { color: "green", fontWeight: "600" },
  tax: { fontSize: 12, color: "#777", marginTop: 4 },

  section: { fontSize: 15, fontWeight: "700", marginBottom: 10 },

  colorRow: { flexDirection: "row", gap: 12 },
  colorDot: { width: 36, height: 36, borderRadius: 18, borderWidth: 1 },
  colorActive: { borderColor: "#000", borderWidth: 2 },

  sizeGrid: { flexDirection: "row", gap: 12 },
  sizeBox: {
    width: 40,
    height: 40,
    borderWidth: 1.5,
    borderRadius: 4,
    justifyContent: "center",
    alignItems: "center",
  },
  sizeActive: { backgroundColor: "#000" },
  sizeText: { fontWeight: "600" },
  sizeTextActive: { color: "#fff" },

  deliveryRow: { flexDirection: "row", gap: 6, alignItems: "center" },
  deliveryText: { fontSize: 14 },

  infoRow: { flexDirection: "row", gap: 8, marginTop: 8 },
  linkText: { color: "#1e88e5", fontWeight: "600" },
  mutedText: { color: "#666" },

  detail: { marginBottom: 6, color: "#444" },

  footer: {
    position: "absolute",
    bottom: 0,
    width: "100%",
    flexDirection: "row",
    gap: 10,
    padding: 12,
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderColor: "#eee",
  },

  buyNow: {
    flex: 1,
    borderWidth: 1.5,
    borderColor: "#000",
    paddingVertical: 14,
    borderRadius: 8,
  },
  buyText: { textAlign: "center", fontWeight: "700" },

  cartBtn: {
    flex: 1,
    backgroundColor: "#000",
    paddingVertical: 14,
    borderRadius: 8,
  },
  cartContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  cartText: { color: "#fff", fontWeight: "700" },

  zoomContainer: { flex: 1, backgroundColor: "#000" },
  zoomScroll: { flex: 1, justifyContent: "center" },
  zoomImage: { width: "100%", height: "100%" },
  closeBtn: { position: "absolute", top: 40, right: 20, zIndex: 10 },
});

export default ProductPage;
