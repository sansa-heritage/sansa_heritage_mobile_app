import React from "react";
import { View, Text, StyleSheet } from "react-native";

export default function CardsScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>No Cards Found</Text>
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
  text: {
    fontSize: 20,
    fontWeight: "600",
    color: "#888",
  },
});
