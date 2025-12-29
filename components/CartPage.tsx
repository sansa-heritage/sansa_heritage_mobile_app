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

  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [deliveryAddress, setDeliveryAddress] = useState<Address | null>(null);
  const [loading, setLoading] = useState(true);
  const [addressModalVisible, setAddressModalVisible] = useState(false);
  const [qtyModalVisible, setQtyModalVisible] = useState(false);
  const [activeProductId, setActiveProductId] = useState<string | null>(null);

  /* ================= FETCH CART ================= */

  const fetchCart = async () => {
    try {
      const token = await AsyncStorage.getItem("authToken");
      const res = await fetch(`${config.baseURL}api/cart/cartitems`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      console.log(data);
      
      setCartItems(data.items || []);
    } catch (e) {
      console.log(e);
    }
  };

  useEffect(() => {
    fetchCart().finally(() => setLoading(false));
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

  /* ================= ADDRESS ================= */

  const selectAddress = async (address: Address) => {
    setDeliveryAddress(address);
    await AsyncStorage.setItem("selectedAddress", JSON.stringify(address));
    setAddressModalVisible(false);
  };

  /* ================= QTY ================= */

  const openQtyModal = (id: string) => {
    setActiveProductId(id);
    setQtyModalVisible(true);
  };

const updateQuantity = async (id: string, newQty: number) => {
  const currentItem = cartItems.find(i => i.productId === id);
  if (!currentItem) return;

  const currentQty = Number(currentItem.quantity);
  const diff = newQty - currentQty;

  try {
    if (diff > 0) {
      await addToCart(id, diff);        // increase
    } else if (diff < 0) {
      await removeFromCart(id, Math.abs(diff)); // decrease
    }

    // Update UI immediately
    setCartItems(prev =>
      prev.map(item =>
        item.productId === id
          ? { ...item, quantity: newQty }
          : item
      )
    );
  } catch (e) {
    console.log(e);
  }
};


  /* ================= REMOVE ITEM ================= */

  const removeItem = async (id: string, qty: number) => {
    Alert.alert("Remove Item", "Remove this item from cart?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Remove",
        style: "destructive",
        onPress: async () => {
          await removeFromCart(id, qty);
          setCartItems((prev) =>
            prev.filter((i) => i.productId !== id)
          );
        },
      },
    ]);
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

  if (!cartItems.length) {
    return (
      <View style={styles.emptyContainer}>
        <Ionicons name="cart-outline" size={80} color="#bbb" />

        <Text style={styles.emptyTitle}>Your cart is empty</Text>

        <Text style={styles.emptySubtitle}>
          Looks like you haven’t added anything yet
        </Text>

        <TouchableOpacity
          style={styles.shopBtn}
          onPress={() => navigation.navigate("Dashboard")}
        >
          <Text style={styles.shopBtnText}>CONTINUE SHOPPING</Text>
        </TouchableOpacity>
      </View>
    );
  }

  /* ================= UI ================= */

  return (
    <>
      <ScrollView contentContainerStyle={{ paddingBottom: 90 }}>
        <View style={styles.container}>
          {/* ADDRESS */}
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
              <TouchableOpacity onPress={() => setAddressModalVisible(true)}>
                <Text style={styles.changeText}>Change</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* PRODUCTS */}
          <FlatList
            data={cartItems}
            keyExtractor={(i) => i.productId}
            scrollEnabled={false}
            renderItem={({ item }) => (
              <View style={styles.card}>
                <Image source={{ uri: item.imageUrl }} style={styles.image} />

                <View style={styles.info}>
                  {/* NAME + TRASH */}
                  <View style={styles.titleRow}>
                    <Text style={styles.name} numberOfLines={2}>
                      {item.name}
                    </Text>

                    <TouchableOpacity
                      onPress={() =>
                        removeItem(item.productId, Number(item.quantity))
                      }
                    >
                      <Ionicons
                        name="trash-outline"
                        size={18}
                        color="#d32f2f"
                      />
                    </TouchableOpacity>
                  </View>

                  <View style={styles.priceRow}>
                    <Text style={styles.price}>
                      ₹
                      {(
                        Number(item.price) -
                        (Number(item.price) * Number(item.discount || 0)) / 100
                      ).toFixed(0)}
                    </Text>
                    <Text style={styles.mrp}>₹{item.price}</Text>
                  </View>

                  {/* SIZE + QTY */}
                  <View style={styles.variantContainer}>
                    <Text style={styles.sizeText}>
                      Size: {item.size}
                    </Text>

                    <View style={styles.qtyRow}>
                      <Text>Qty</Text>
                      <TouchableOpacity
                        style={styles.qtyDropdown}
                        onPress={() => openQtyModal(item.productId)}
                      >
                        <Text>{item.quantity}</Text>
                        <Ionicons name="chevron-down" size={16} />
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              </View>
            )}
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
              <Text style={{ color: "green" }}>-₹{savings.toFixed(0)}</Text>
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

          {/* RETURN / REFUND POLICY */}
          <View style={styles.policyCard}>
            <Text style={styles.policyTitle}>Return/Refund policy</Text>

            <Text style={styles.policyDesc}>
              In case of return, we ensure quick refunds. Full amount will be refunded
              excluding convenience fee.
            </Text>

            <TouchableOpacity
              onPress={() => navigation.navigate('ReturnRefundScreen')}
            >
              <Text style={styles.readPolicy}>Read policy</Text>
            </TouchableOpacity>
          </View>

        </View>
      </ScrollView>

      {/* FOOTER */}
      <View style={styles.footer}>
        <View>
          <Text style={styles.subTotal}>₹ {amountPayable.toFixed(0)}</Text>
          <Text style={styles.subLabel}>Sub total</Text>
        </View>

        <TouchableOpacity
          style={styles.checkoutBtn}
          onPress={() =>
            navigation.navigate("CheckoutPage", {
              billingDetails: amountPayable,
            })
          }
        >
          <Text style={styles.checkoutText}>PROCEED TO BUY</Text>
        </TouchableOpacity>
      </View>


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

  titleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },

  name: {
    fontWeight: "600",
    flex: 1,
    marginRight: 8,
  },

  priceRow: { flexDirection: "row", alignItems: "center" },
  price: { fontWeight: "700" },
  mrp: {
    textDecorationLine: "line-through",
    marginLeft: 6,
    color: "#888",
  },

  variantContainer: { marginTop: 4 },

  sizeText: {
    fontSize: 13,
    color: "#555",
    fontWeight: "500",
  },

  qtyRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 6,
  },

  qtyDropdown: {
    marginLeft: 6,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
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

  subTotal: { fontSize: 16, fontWeight: "700" },

  checkoutBtn: {
    backgroundColor: "#000",
    paddingHorizontal: 22,
    paddingVertical: 14,
    borderRadius: 8,
  },

  checkoutText: { color: "#fff", fontWeight: "700" },

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

  policyCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
  },

  policyTitle: {
    fontSize: 14,
    fontWeight: "700",
    marginBottom: 6,
  },

  policyDesc: {
    fontSize: 13,
    color: "#555",
    lineHeight: 18,
  },

  readPolicy: {
    marginTop: 6,
    fontSize: 13,
    fontWeight: "600",
    color: "#1e88e5",
  },

  subLabel: {
    fontSize: 12,
    color: "#666",
    marginTop: 2,
  },

  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
    backgroundColor: "#f6f6f6",
  },

  emptyTitle: {
    fontSize: 18,
    fontWeight: "700",
    marginTop: 16,
  },

  emptySubtitle: {
    fontSize: 14,
    color: "#777",
    marginTop: 6,
    textAlign: "center",
  },

  shopBtn: {
    marginTop: 20,
    backgroundColor: "#000",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },

  shopBtnText: {
    color: "#fff",
    fontWeight: "700",
  },

});
