import React from "react";
import { Text, ScrollView, StyleSheet, Linking  } from "react-native";

const ReturnRefundPolicyScreen = () => {
  return (
    <ScrollView
      showsVerticalScrollIndicator={false}
      contentContainerStyle={styles.container}
    >
      <Text style={styles.section}>Product Inspection</Text>
      <Text style={styles.text}>
        Customers are requested to record a clear unboxing video while opening
        the parcel. This video helps us verify issues and process returns or
        exchanges smoothly.
      </Text>

      <Text style={styles.section}>Eligible Cases</Text>
      <Text style={styles.text}>
        Returns or exchanges are applicable only in the following cases:
        {"\n"}• Wrong product received
        {"\n"}• Damaged or defective product
        {"\n"}• Incorrect color or design
      </Text>

      <Text style={styles.section}>Exchange Policy</Text>
      <Text style={styles.text}>
        • Exchange requests must be raised within 48 hours of delivery.
        {"\n"}• Exchanges are subject to product availability.
      </Text>

      <Text style={styles.section}>Refund Policy</Text>
      <Text style={styles.text}>
        If an exchange is not available, we will offer:
        {"\n"}• A replacement product, OR
        {"\n"}• A refund of the product amount.
        {"\n\n"}Delivery charges are non-refundable and will be excluded from the
        refund amount.
        {"\n\n"}Approved refunds are processed within 7-14 business days to the
        original payment method.
      </Text>

      <Text style={styles.section}>Non-Returnable Cases</Text>
      <Text style={styles.text}>
        Returns and refunds will not be accepted if:
        {"\n"}• No unboxing video is provided
        {"\n"}• The product is damaged due to customer misuse
        {"\n"}• The request is made after the eligible time window
      </Text>

      <Text style={styles.section}>How to Request</Text>
      <Text style={styles.text}>
        To initiate a return or refund request, please contact us with your
        Order ID, unboxing video, and issue details at:
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
    marginTop: 16,
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

export default ReturnRefundPolicyScreen;
