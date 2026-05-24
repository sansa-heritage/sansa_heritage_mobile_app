import React from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
} from "react-native";

export const AboutUsScreen = () => {
  return (
    <ScrollView
      showsVerticalScrollIndicator={false}
      contentContainerStyle={styles.page}
    >
      {/* BRAND HEADER */}
      <View style={styles.header}>
        <Text style={styles.brand}>Sansa Heritage Hub</Text>
        <Text style={styles.tagline}>Where Tradition Meets Style</Text>
      </View>

      {/* MAIN CONTENT */}
      <View style={styles.card}>
        <Text style={styles.text}>
          Sansa Heritage Hub brings timeless Indian craftsmanship into modern
          everyday fashion. Each piece is thoughtfully designed by skilled
          artisans using handloom techniques passed down through generations.
        </Text>

        <Text style={styles.text}>
          From daily wear to office elegance and festive occasions, our
          collections combine comfort, quality, and elegance.
        </Text>

        <Text style={styles.text}>
          Every purchase supports artisan communities and helps preserve cultural
          heritage—making fashion ethical, sustainable, and meaningful.
        </Text>
      </View>

      {/* HIGHLIGHT */}
      <View style={styles.highlightBox}>
        <Text style={styles.highlightText}>
          ✨ Fashion that feels good, looks good, and does good ✨.
        </Text>
      </View>

    </ScrollView>
  );
};

const styles = StyleSheet.create({
  page: {
    padding: 16,
    paddingBottom: 40,
    backgroundColor: "#F5F5F5",
  },

  header: {
    alignItems: "center",
    marginBottom: 20,
  },

  brand: {
    fontSize: 26,
    fontWeight: "800",
    color: "#000",
    letterSpacing: 0.5,
  },

  tagline: {
    fontSize: 14,
    fontWeight: "600",
    color: "#777",
    marginTop: 6,
  },

  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    padding: 18,
    elevation: 4,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowOffset: { width: 0, height: 3 },
    shadowRadius: 6,
  },

  text: {
    fontSize: 15,
    lineHeight: 24,
    color: "#333",
    marginBottom: 12,
  },

  highlightBox: {
    marginTop: 18,
    backgroundColor: "#000",
    paddingVertical: 16,
    paddingHorizontal: 14,
    borderRadius: 12,
  },

  highlightText: {
    textAlign: "center",
    fontSize: 14,
    fontWeight: "700",
    color: "#FFF",
    letterSpacing: 0.3,
  },
});
