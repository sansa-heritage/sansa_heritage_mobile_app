import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Image,
} from "react-native";
import Ionicons from "react-native-vector-icons/Ionicons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";

import { RootStackParamList } from "./models/types";

/* ================= TYPES ================= */

type OrderConfirmRouteProp = RouteProp<
  RootStackParamList,
  "CheckoutPage"
>;

/* ================= COMPONENT ================= */

const OrderConfirmationScreen: React.FC = () => {
  /* ✅ ALL HOOKS AT TOP — DO NOT MOVE */
  const navigation =
    useNavigation<StackNavigationProp<RootStackParamList>>();
  const route = useRoute<OrderConfirmRouteProp>();

  const [address, setAddress] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);

  /* ================= SAFE PARAM ================= */

  const amountPayable: number = Number(
    route.params?.billingDetails ?? 0
  );

  /* ================= LOAD ADDRESS ================= */

  useEffect(() => {
    const loadSelectedAddress = async () => {
      try {
        const stored = await AsyncStorage.getItem("selectedAddress");
        if (stored) {
          setAddress(JSON.parse(stored));
        }
      } catch (e) {
        console.log("Address load error", e);
      } finally {
        setLoading(false);
      }
    };

    loadSelectedAddress();
  }, []);

  /* ================= ACTION ================= */

  const proceedToPayment = () => {
    // navigation.navigate("PaymentPage", {
    //   amount: amountPayable,
    // });
  };

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
    // <>
    //   <ScrollView contentContainerStyle={{ paddingBottom: 140 }}>
    //     <View style={styles.container}>
    //       <Text style={styles.title}>Order Confirmation</Text>

    //       {/* DELIVERY ADDRESS (READ ONLY) */}
    //       <View style={styles.card}>
    //         <Text style={styles.cardTitle}>Delivery Address</Text>

    //         {address ? (
    //           <View style={styles.addressRow}>
    //             <Ionicons name="location-outline" size={18} />
    //             <View style={{ marginLeft: 10 }}>
    //               <Text style={styles.addressText}>
    //                 {address.street}, {address.city}
    //               </Text>
    //               <Text style={styles.addressSub}>
    //                 {address.state}, {address.country}
    //               </Text>
    //             </View>
    //           </View>
    //         ) : (
    //           <Text style={styles.addressSub}>
    //             No delivery address selected
    //           </Text>
    //         )}
    //       </View>

    //       {/* AMOUNT PAYABLE */}
    //       <View style={styles.card}>
    //         <Text style={styles.cardTitle}>Amount Payable</Text>

    //         <View style={styles.amountRow}>
    //           <Text style={styles.amountLabel}>Total</Text>
    //           <Text style={styles.amountValue}>
    //             ₹{amountPayable.toFixed(0)}
    //           </Text>
    //         </View>
    //       </View>

    //       {/* PAYMENT OPTIONS */}
    //       <View style={styles.card}>
    //         <Text style={styles.cardTitle}>Payment Options</Text>

    //         <View style={styles.paymentIcons}>
    //           <Image
    //             source={require("../assets/images/visa-logo.png")}
    //             style={styles.paymentIcon}
    //           />
    //           <Image
    //             source={require("../assets/images/Mastercard.png")}
    //             style={styles.paymentIcon}
    //           />
    //           <Image
    //             source={require("../assets/images/PayPal.png")}
    //             style={styles.paymentIcon}
    //           />
    //         </View>

    //         <Text style={styles.paymentNote}>
    //           You’ll choose the payment method on the next screen
    //         </Text>
    //       </View>
    //     </View>
    //   </ScrollView>

    //   {/* FOOTER */}
    //   <View style={styles.footer}>
    //     <TouchableOpacity
    //       style={styles.payBtn}
    //       onPress={proceedToPayment}
    //     >
    //       <Text style={styles.payText}>PROCEED TO PAYMENT</Text>
    //     </TouchableOpacity>
    //   </View>
    // </>


    <View style={styles.devContainer}>
      <Ionicons name="construct-outline" size={80} color="#999" />

      <Text style={styles.devTitle}>Under Development</Text>

      <Text style={styles.devSub}>
        This feature is currently being worked on.
        Please check back later.
      </Text>
    </View>
  );
};

export default OrderConfirmationScreen;

/* ================= STYLES ================= */

const styles = StyleSheet.create({
  loader: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },

  container: {
    flex: 1,
    padding: 16,
    backgroundColor: "#f6f6f6",
  },

  title: {
    fontSize: 24,
    fontWeight: "700",
    marginBottom: 16,
  },

  card: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 14,
    elevation: 2,
  },

  cardTitle: {
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 12,
  },

  addressRow: {
    flexDirection: "row",
    alignItems: "center",
  },

  addressText: {
    fontSize: 15,
    fontWeight: "600",
  },

  addressSub: {
    fontSize: 13,
    color: "#666",
    marginTop: 2,
  },

  amountRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  amountLabel: {
    fontSize: 15,
    color: "#555",
  },

  amountValue: {
    fontSize: 20,
    fontWeight: "700",
  },

  paymentIcons: {
    flexDirection: "row",
    marginVertical: 10,
  },

  paymentIcon: {
    width: 50,
    height: 30,
    resizeMode: "contain",
    marginRight: 14,
  },

  paymentNote: {
    fontSize: 13,
    color: "#777",
  },

  footer: {
    position: "absolute",
    bottom: 0,
    width: "100%",
    backgroundColor: "#fff",
    padding: 14,
    borderTopWidth: 1,
    borderColor: "#eee",
  },

  payBtn: {
    backgroundColor: "#000",
    paddingVertical: 15,
    borderRadius: 10,
    alignItems: "center",
  },

  payText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },

  devContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f6f6f6",
    padding: 20,
  },

  devTitle: {
    fontSize: 20,
    fontWeight: "700",
    marginTop: 16,
  },

  devSub: {
    fontSize: 14,
    color: "#777",
    marginTop: 8,
    textAlign: "center",
  },

});
