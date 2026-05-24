import React from 'react';
import { Text, StyleSheet, ScrollView, Linking, View } from 'react-native';

const TermsScreen = () => {
  return (
    <ScrollView style={styles.container}>
      <Text style={styles.content}>
        Welcome to Sansa Heritage Hub. By accessing or using this application, you
        agree to comply with and be bound by the following Terms & Conditions.
      </Text>

      <Text style={styles.sectionTitle}>1. Eligibility</Text>
      <Text style={styles.content}>
        You must be at least 18 years of age to use this application.
      </Text>

      <Text style={styles.sectionTitle}>2. User Information</Text>
      <Text style={styles.content}>
        You agree to provide accurate, current, and complete information while
        creating an account or placing an order.
      </Text>

      <Text style={styles.sectionTitle}>3. Products & Orders</Text>
      <Text style={styles.content}>
        • All products are subject to availability.{'\n'}
        • Product images are for reference only; slight color variations may occur.{'\n'}
        • We reserve the right to cancel or refuse any order at our discretion.
      </Text>

      <Text style={styles.sectionTitle}>4. Pricing & Payments</Text>
      <Text style={styles.content}>
        • All prices are listed in Indian Rupees (INR).{'\n'}
        • Prices and offers may change without prior notice.{'\n'}
        • Payment must be completed before order confirmation.
      </Text>

      <Text style={styles.sectionTitle}>5. Shipping & Delivery</Text>
      <Text style={styles.content}>
        Delivery timelines are estimates and may vary due to logistics or external
        factors beyond our control.
      </Text>

      <Text style={styles.sectionTitle}>6. Return & Refund Policy</Text>
      <Text style={styles.content}>
        • Returns or exchanges are accepted only for damaged, defective, wrong,
        or incorrect color products.{'\n'}
        • An unboxing video is mandatory to raise a return or exchange request.{'\n'}
        • Exchange is subject to product availability.{'\n'}
        • If exchange is not available, a refund or replacement will be provided.{'\n'}
        • Delivery charges are non-refundable.{'\n'}
        • Refunds are processed within 5–7 business days after approval.
      </Text>

      <Text style={styles.sectionTitle}>7. User Conduct</Text>
      <Text style={styles.content}>
        You agree not to misuse the app, provide false information, or engage in
        any unlawful activity.
      </Text>

      <Text style={styles.sectionTitle}>8. Intellectual Property</Text>
      <Text style={styles.content}>
        All content, images, logos, and designs in the app belong to Sansa Heritage
        Hub and may not be used without permission.
      </Text>

      <Text style={styles.sectionTitle}>9. Limitation of Liability</Text>
      <Text style={styles.content}>
        Sansa Heritage Hub shall not be liable for indirect, incidental, or
        consequential damages arising from the use of the app.
      </Text>

      <Text style={styles.sectionTitle}>10. Modifications</Text>
      <Text style={styles.content}>
        We reserve the right to update these Terms & Conditions at any time.
        Continued use of the app implies acceptance of the updated terms.
      </Text>

      <Text style={styles.sectionTitle}>11. Governing Law</Text>
      <Text style={styles.content}>
        These terms are governed by the laws of India.
      </Text>

      <Text style={styles.sectionTitle}>12. Contact Us</Text>
      <Text style={styles.content}>
        For any questions or support, please contact us at:
      </Text>

      <Text
        style={styles.link}
        onPress={() => Linking.openURL('mailto:sansaheritage@gmail.com')}
      >
        sansaheritage@gmail.com
      </Text>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#fff', 
    padding: 20 
  },
  sectionTitle: { 
    fontSize: 18, 
    fontWeight: 'bold', 
    marginTop: 15, 
    marginBottom: 8, 
    color: '#000' 
  },
  content: { 
    fontSize: 14, 
    color: '#333', 
    lineHeight: 22 
  },
  link: {
    color: '#1E88E5',
    fontSize: 14,
    marginTop: 5,
    textDecorationLine: 'underline',
  },
});

export default TermsScreen;