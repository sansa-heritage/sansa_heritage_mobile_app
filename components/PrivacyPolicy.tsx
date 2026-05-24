import React from "react";
import { View, Text, ScrollView, StyleSheet, Linking } from "react-native";

const PrivacyPolicyScreen = () => {
  return (
    <ScrollView
      showsVerticalScrollIndicator={false}
      contentContainerStyle={styles.container}
    >
      {/* <Text style={styles.muted}>Effective Date: 01 Jan 2025</Text> */}

      <Text style={styles.section}>Introduction</Text>
      <Text style={styles.text}>
        Sansa Heritage Hub respects your privacy and is committed to protecting
        your personal information when you use our application.
      </Text>

      <Text style={styles.section}>Information We Collect</Text>
      <Text style={styles.text}>
        • Name, email address, and phone number{"\n"}
        • Shipping and billing address{"\n"}
        • Payment information (processed securely by third-party gateways){"\n"}
        • Device and usage analytics
      </Text>

      <Text style={styles.section}>How We Use Your Information</Text>
      <Text style={styles.text}>
        • To process and deliver orders{"\n"}
        • To provide customer support and notifications{"\n"}
        • To prevent fraud and misuse{"\n"}
        • To improve app performance and user experience
      </Text>

      <Text style={styles.section}>Data Sharing</Text>
      <Text style={styles.text}>
        We share your information only with trusted payment gateways, delivery
        partners, and service providers. We do not sell your personal data.
      </Text>

      <Text style={styles.section}>Data Security</Text>
      <Text style={styles.text}>
        We use industry-standard security measures to protect your data.
        However, no method of transmission over the internet is completely
        secure.
      </Text>

      <Text style={styles.section}>User Rights</Text>
      <Text style={styles.text}>
        You have the right to access, update, or request deletion of your
        personal data by contacting us.
      </Text>

      <Text style={styles.section}>Children’s Privacy</Text>
      <Text style={styles.text}>
        This app is not intended for users under the age of 18.
      </Text>

      <Text style={styles.section}>Policy Updates</Text>
      <Text style={styles.text}>
        We may update this Privacy Policy from time to time. Changes will be
        reflected within the app.
      </Text>

      <Text style={styles.section}>Contact Us</Text>
      <Text style={styles.text}>
        If you have any questions regarding this Privacy Policy, please contact
        us at:
        {"\n"}
        <Text
          style={styles.link}
          onPress={() => Linking.openURL('mailto:sansaheritage@gmail.com')}
        >
          sansaheritage@gmail.com
        </Text>
      </Text>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    paddingBottom: 40,
    backgroundColor: "#ffffff",
  },
  title: {
    fontSize: 22,
    fontWeight: "700",
    color: "#000",
    marginBottom: 6,
  },
  muted: {
    fontSize: 12,
    color: "#777",
    marginBottom: 16,
  },
  section: {
    fontSize: 16,
    fontWeight: "700",
    color: "#000",
    marginTop: 4,
    marginBottom: 6,
  },
  text: {
    fontSize: 14,
    lineHeight: 22,
    color: "#333",
  },
   link: {
    color: '#1E88E5',
  },
});

export default PrivacyPolicyScreen;
