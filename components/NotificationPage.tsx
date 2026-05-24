import React from "react";
import { View, Text, StyleSheet } from "react-native";
import Ionicons from "react-native-vector-icons/Ionicons";

export default function NotificationScreen() {
  return (
    <View style={styles.container}>
      <Ionicons
        name="construct-outline"
        size={80}
        color="#bbb"
        style={{ marginBottom: 16 }}
      />

      <Text style={styles.title}>Under Development</Text>

      <Text style={styles.subText}>
        Notifications feature is currently being worked on.
        Please check back later.
      </Text>
    </View>
  );


}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 20,
  },

  title: {
    fontSize: 20,
    fontWeight: "700",
    color: "#333",
  },

  subText: {
    fontSize: 14,
    color: "#777",
    marginTop: 8,
    textAlign: "center",
    lineHeight: 20,
  },
});

