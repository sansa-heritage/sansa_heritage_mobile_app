import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  Modal,
  Alert,
  ScrollView,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useNavigation } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";
import Ionicons from "react-native-vector-icons/Ionicons";

import config from "../config/config";
import { addToCart, removeFromCart } from "./apiHelper/apiService";
import { RootStackParamList } from "./models/types";
import { Address } from "./models/address";

/* ================= TYPES ================= */

interface CartItem {
  productId: string;
  name: string;
  price: number | string;
  quantity: number | string;
  imageUrl: string;
  discount: number | string;
  size: string;
  color: string;
}

/* ================= COMPONENT ================= */

const CartScreen: React.FC = () => {
  const navigation =
    useNavigation<StackNavigationProp<RootStackParamList>>();

  /* ---------------- STATES ---------------- */
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [deliveryAddress, setDeliveryAddress] = useState<Address | null>(null);

  const [loading, setLoading] = useState(true);
  const [addressModalVisible, setAddressModalVisible] = useState(false);

  const [qtyModalVisible, setQtyModalVisible] = useState(false);
  const [activeProductId, setActiveProductId] = useState<string | null>(null);

  /* ================= FETCH CART ================= */

  useEffect(() => {
    const fetchCart = async () => {
      try {
        const token = await AsyncStorage.getItem("authToken");
        const res = await fetch(`${config.baseURL}api/cart/cartitems`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        setCartItems(data.items || []);
      } catch (e) {
        console.log(e);
      } finally {
        setLoading(false);
      }
    };

    fetchCart();
  }, []);

  /* ================= FETCH ADDRESS ================= */

  useEffect(() => {
    const loadAddress = async () => {
      const token = await AsyncStorage.getItem("authToken");

      const res = await fetch(`${config.baseURL}api/auth/addresses`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const json = await res.json();
      setAddresses(json.addresses || []);

      const saved = await AsyncStorage.getItem("selectedAddress");
      if (saved) setDeliveryAddress(JSON.parse(saved));
    };

    loadAddress();
  }, []);

  /* ================= ADDRESS SELECT ================= */

  const selectAddress = async (address: Address) => {
    setDeliveryAddress(address);
    await AsyncStorage.setItem(
      "selectedAddress",
      JSON.stringify(address)
    );
    setAddressModalVisible(false);
  };

  /* ================= QTY ================= */

  const openQtyModal = (id: string) => {
    setActiveProductId(id);
    setQtyModalVisible(true);
  };

  const updateQuantity = async (id: string, qty: number) => {
    const item = cartItems.find((i) => i.productId === id);
    if (!item) return;

    const diff = qty - Number(item.quantity || 0);

    setCartItems((prev) =>
      prev.map((i) =>
        i.productId === id ? { ...i, quantity: qty } : i
      )
    );

    if (diff > 0) await addToCart(id, diff);
    if (diff < 0) await removeFromCart(id, Math.abs(diff));
  };

  /* ================= PRICE ================= */

  const bagTotal = cartItems.reduce(
    (s, i) => s + Number(i.price || 0) * Number(i.quantity || 0),
    0
  );

  const savings = cartItems.reduce(
    (s, i) =>
      s +
      (Number(i.price || 0) *
        Number(i.discount || 0) *
        Number(i.quantity || 0)) /
      100,
    0
  );

  const deliveryFee = cartItems.length ? 50 : 0;
  const amountPayable = bagTotal - savings + deliveryFee;

  /* ================= LOADER ================= */

  if (loading) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  /* ================= UI ================= */

  return (
    <>
      <ScrollView contentContainerStyle={{ paddingBottom: 80 }}>
        <View style={styles.container}>
          {/* DELIVERY ADDRESS */}
          <View style={styles.sectionCard}>
            <View style={styles.addressRow}>
              <Ionicons name="location-outline" size={18} />
              <View style={{ flex: 1, marginLeft: 8 }}>
                <Text style={styles.smallLabel}>Deliver to</Text>
                <Text style={styles.boldText} numberOfLines={2}>
                  {deliveryAddress
                    ? `${deliveryAddress.street}, ${deliveryAddress.city}`
                    : "Select delivery address"}
                </Text>
              </View>

              <TouchableOpacity
                onPress={() => setAddressModalVisible(true)}
              >
                <Text style={styles.changeText}>Change</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* PRODUCTS */}
          <FlatList
            data={cartItems}
            keyExtractor={(i) => i.productId}
            renderItem={({ item }) => (
              <View style={styles.card}>
                <Image
                  source={{ uri: item.imageUrl }}
                  style={styles.image}
                />

                <View style={styles.info}>
                  <Text style={styles.name} numberOfLines={2}>
                    {item.name}
                  </Text>

                  <View style={styles.priceRow}>
                    <Text style={styles.price}>
                      ₹
                      {(
                        Number(item.price) -
                        (Number(item.price) *
                          Number(item.discount || 0)) /
                        100
                      ).toFixed(0)}
                    </Text>
                    <Text style={styles.mrp}>₹{item.price}</Text>
                  </View>

                  <View style={styles.qtyRow}>
                    <Text>Qty</Text>
                    <TouchableOpacity
                      style={styles.qtyDropdown}
                      onPress={() =>
                        openQtyModal(item.productId)
                      }
                    >
                      <Text>{item.quantity}</Text>
                      <Text>▼</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            )}
            scrollEnabled={false}
          />

          {/* ORDER DETAILS */}
          <View style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>Order Details</Text>

            <View style={styles.billRow}>
              <Text>Bag Total</Text>
              <Text>₹{bagTotal.toFixed(0)}</Text>
            </View>

            <View style={styles.billRow}>
              <Text>Savings</Text>
              <Text style={{ color: "green" }}>
                -₹{savings.toFixed(0)}
              </Text>
            </View>

            <View style={styles.billRow}>
              <Text>Delivery Fee</Text>
              <Text>₹{deliveryFee}</Text>
            </View>

            <View style={styles.divider} />

            <View style={styles.billRow}>
              <Text style={styles.boldText}>Amount Payable</Text>
              <Text style={styles.boldText}>
                ₹{amountPayable.toFixed(0)}
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* FOOTER */}
      <View style={styles.footer}>
        <Text style={styles.subTotal}>
          ₹{amountPayable.toFixed(0)}
        </Text>

        <TouchableOpacity
          style={styles.checkoutBtn}
          onPress={() =>
            navigation.navigate("CheckoutPage", {
              billingDetails: amountPayable,
            })
          }
        >
          <Text style={styles.checkoutText}>
            PROCEED TO BUY
          </Text>
        </TouchableOpacity>
      </View>

      {/* ADDRESS BOTTOM SHEET */}
      <Modal
        visible={addressModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setAddressModalVisible(false)}
      >
        <View style={styles.sheetOverlay}>
          {/* BACKDROP */}
          <TouchableOpacity
            style={StyleSheet.absoluteFill}
            activeOpacity={1}
            onPress={() => setAddressModalVisible(false)}
          />

          {/* SHEET */}
          <View style={styles.sheet}>
            <View style={styles.dragHandle} />

            <Text style={styles.sheetTitle}>
              Select Delivery Address
            </Text>

            <FlatList
              data={addresses}
              keyExtractor={(i) => i._id}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.addressCard,
                    deliveryAddress?._id === item._id &&
                    styles.activeAddress,
                  ]}
                  onPress={() => selectAddress(item)}
                >
                  <Text style={styles.addressTitle}>
                    {item.street}
                  </Text>
                  <Text style={styles.addressText}>
                    {item.city}, {item.state}
                  </Text>
                </TouchableOpacity>
              )}
            />
          </View>
        </View>
      </Modal>


      {/* QTY MODAL */}
      <Modal visible={qtyModalVisible} transparent>
        <View style={styles.qtyModalOverlay}>
          <View style={styles.qtyModal}>
            {[1, 2, 3, 4, 5].map((q) => (
              <TouchableOpacity
                key={q}
                style={styles.qtyOption}
                onPress={() => {
                  updateQuantity(activeProductId!, q);
                  setQtyModalVisible(false);
                }}
              >
                <Text>{q}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </Modal>
    </>
  );
};

export default CartScreen;

/* ================= STYLES ================= */

const styles = StyleSheet.create({
  loader: { flex: 1, justifyContent: "center", alignItems: "center" },
  container: { padding: 16, backgroundColor: "#f6f6f6" },

  sectionCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
  },

  addressRow: { flexDirection: "row", alignItems: "center" },

  smallLabel: { fontSize: 12, color: "#666" },
  boldText: { fontWeight: "700" },
  changeText: { color: "#1e88e5", fontWeight: "700" },

  card: {
    backgroundColor: "#fff",
    flexDirection: "row",
    padding: 12,
    borderRadius: 12,
    marginBottom: 10,
  },

  image: { width: 90, height: 110, resizeMode: "contain" },
  info: { flex: 1, marginLeft: 12 },

  name: { fontWeight: "600" },

  priceRow: { flexDirection: "row", alignItems: "center" },
  price: { fontWeight: "700" },
  mrp: {
    textDecorationLine: "line-through",
    marginLeft: 6,
    color: "#888",
  },

  qtyRow: { flexDirection: "row", alignItems: "center", marginTop: 10 },

  qtyDropdown: {
    marginLeft: 10,
    borderWidth: 1,
    paddingHorizontal: 10,
    borderRadius: 6,
  },

  sectionTitle: { fontSize: 16, fontWeight: "700" },

  billRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginVertical: 4,
  },

  divider: {
    height: 1,
    backgroundColor: "#eee",
    marginVertical: 8,
  },

  footer: {
    position: "absolute",
    bottom: 0,
    width: "100%",
    padding: 14,
    backgroundColor: "#fff",
    flexDirection: "row",
    justifyContent: "space-between",
    borderTopWidth: 1,
    borderColor: "#eee",
  },

  subTotal: { fontSize: 18, fontWeight: "700" },

  checkoutBtn: {
    backgroundColor: "#000",
    paddingHorizontal: 22,
    paddingVertical: 14,
    borderRadius: 8,
  },

  checkoutText: { color: "#fff", fontWeight: "700" },

  /* ADDRESS SHEET */
  sheetOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "flex-end",
  },

  sheet: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 16,
    maxHeight: "70%",
  },

  dragHandle: {
    width: 40,
    height: 4,
    backgroundColor: "#ccc",
    borderRadius: 2,
    alignSelf: "center",
    marginBottom: 8,
  },

  sheetTitle: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 10,
  },

  addressCard: {
    padding: 14,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#eee",
    marginBottom: 10,
  },

  activeAddress: {
    borderColor: "#000",
    backgroundColor: "rgba(0,0,0,0.04)",
  },

  addressTitle: { fontWeight: "700" },
  addressText: { color: "#555" },

  /* QTY */
  qtyModalOverlay: {
    flex: 1,
    justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.4)",
  },

  qtyModal: {
    backgroundColor: "#fff",
    marginHorizontal: 40,
    borderRadius: 10,
  },

  qtyOption: {
    padding: 14,
    alignItems: "center",
    borderBottomWidth: 1,
    borderColor: "#eee",
  },
});
