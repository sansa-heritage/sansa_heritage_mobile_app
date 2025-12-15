import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
} from "react-native";

export const PrivacyPolicyScreen = () => {
  const [showFull, setShowFull] = useState(false);

  return (
    <ScrollView
      showsVerticalScrollIndicator={false}
      contentContainerStyle={styles.page}
    >
      <View style={styles.card}>
        <Text style={styles.title}>Privacy Policy</Text>
        <Text style={styles.muted}>Effective Date: 01 Jan 2025</Text>

        <Text style={styles.section}>Privacy at a Glance</Text>
        <Text style={styles.text}>
          We respect your privacy and are committed to protecting your personal
          information while you use Sansa Heritage Hub.
        </Text>

        <Text style={styles.section}>What We Collect</Text>
        <Text style={styles.text}>
          • Name, email & phone number{"\n"}
          • Shipping and billing address{"\n"}
          • Payment details (securely processed){"\n"}
          • Device & usage analytics
        </Text>

        <Text style={styles.section}>Why We Collect It</Text>
        <Text style={styles.text}>
          • Order processing and delivery{"\n"}
          • Customer support and notifications{"\n"}
          • Fraud prevention{"\n"}
          • Improving app experience
        </Text>

        <Text style={styles.section}>Data Sharing</Text>
        <Text style={styles.text}>
          We share information only with trusted delivery partners and payment
          gateways.{"\n"}
          <Text style={{ fontWeight: "600" }}>
            We never sell your personal data.
          </Text>
        </Text>

        <TouchableOpacity
          style={styles.primaryButton}
          onPress={() => setShowFull(!showFull)}
        >
          <Text style={styles.primaryButtonText}>
            {showFull ? "Hide Full Policy" : "Read Full Policy"}
          </Text>
        </TouchableOpacity>
      </View>

      {showFull && (
        <View style={styles.card}>
          <Text style={styles.section}>Full Privacy Policy</Text>

          <Text style={styles.text}>
            1. Acceptance – By using the app, you agree to this policy.{"\n\n"}
            2. Information Collection – Personal & non-personal data.{"\n\n"}
            3. Usage – Orders, support, personalization.{"\n\n"}
            4. Security – Industry-standard encryption & secure servers.{"\n\n"}
            5. User Rights – Access, update, delete your data.{"\n\n"}
            6. Cookies – Used only for performance & analytics.{"\n\n"}
            7. Children – Not intended for users under 18.{"\n\n"}
            8. Updates – Policy changes will be reflected in-app.
          </Text>
        </View>
      )}
    </ScrollView>
  );
};

/* ================== ABOUT US ================== */

export const AboutUsScreen = () => {
  return (
    <ScrollView
      showsVerticalScrollIndicator={false}
      contentContainerStyle={styles.page}
    >
      <View style={styles.card}>
        <Text style={styles.title}>Sansa Heritage Hub</Text>
        <Text style={styles.tagline}>Where Tradition Meets Style</Text>

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

        <View style={styles.highlightBox}>
          <Text style={styles.highlightText}>
            Fashion that feels good, looks good, and does good.
          </Text>
        </View>
      </View>
    </ScrollView>
  );
};

/* ================== STYLES ================== */

const styles = StyleSheet.create({
  page: {
    padding: 16,
    paddingBottom: 40,
    backgroundColor: "#f6f6f6",
  },

  card: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },

  title: {
    fontSize: 22,
    fontWeight: "700",
    color: "#000",
    marginBottom: 6,
  },

  tagline: {
    fontSize: 15,
    fontWeight: "600",
    color: "#666",
    marginBottom: 12,
  },

  muted: {
    fontSize: 12,
    color: "#888",
    marginBottom: 12,
  },

  section: {
    fontSize: 16,
    fontWeight: "700",
    color: "#000",
    marginTop: 14,
    marginBottom: 6,
  },

  text: {
    fontSize: 14,
    lineHeight: 22,
    color: "#333",
    marginBottom: 8,
  },

  primaryButton: {
    marginTop: 16,
    backgroundColor: "#000",
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
  },

  primaryButtonText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 14,
  },

  highlightBox: {
    marginTop: 16,
    backgroundColor: "#f0f0f0",
    padding: 14,
    borderRadius: 8,
  },

  highlightText: {
    textAlign: "center",
    fontSize: 14,
    fontWeight: "600",
    color: "#000",
  },
});


export default PrivacyPolicyScreen;
