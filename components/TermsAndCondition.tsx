import React from 'react';
import { Text, StyleSheet, ScrollView, Linking } from 'react-native';

const TermsScreen = () => {
  return (
    <ScrollView style={styles.container}>
      <Text style={styles.content}>
        Welcome to Sansa Heritage Hub. By accessing or using this application, you
        agree to comply with and be bound by the following Terms & Conditions.

        {"\n\n"}1. Eligibility
        {"\n"}You must be at least 18 years of age to use this application.

        {"\n\n"}2. User Information
        {"\n"}You agree to provide accurate, current, and complete information while
        creating an account or placing an order.

        {"\n\n"}3. Products & Orders
        {"\n"}• All products are subject to availability.
        {"\n"}• Product images are for reference only; slight color variations may occur.
        {"\n"}• We reserve the right to cancel or refuse any order at our discretion.

        {"\n\n"}4. Pricing & Payments
        {"\n"}• All prices are listed in Indian Rupees (INR).
        {"\n"}• Prices and offers may change without prior notice.
        {"\n"}• Payment must be completed before order confirmation.

        {"\n\n"}5. Shipping & Delivery
        {"\n"}Delivery timelines are estimates and may vary due to logistics or external
        factors beyond our control.

        {"\n\n"}6. Return & Refund Policy
        {"\n"}• Returns or exchanges are accepted only for damaged, defective, wrong,
        or incorrect color products.
        {"\n"}• An unboxing video is mandatory to raise a return or exchange request.
        {"\n"}• Exchange is subject to product availability.
        {"\n"}• If exchange is not available, a refund or replacement will be provided.
        {"\n"}• Delivery charges are non-refundable.
        {"\n"}• Refunds are processed within 5–7 business days after approval.

        {"\n\n"}7. User Conduct
        {"\n"}You agree not to misuse the app, provide false information, or engage in
        any unlawful activity.

        {"\n\n"}8. Intellectual Property
        {"\n"}All content, images, logos, and designs in the app belong to Sansa Heritage
        Hub and may not be used without permission.

        {"\n\n"}9. Limitation of Liability
        {"\n"}Sansa Heritage Hub shall not be liable for indirect, incidental, or
        consequential damages arising from the use of the app.

        {"\n\n"}10. Modifications
        {"\n"}We reserve the right to update these Terms & Conditions at any time.
        Continued use of the app implies acceptance of the updated terms.

        {"\n\n"}11. Governing Law
        {"\n"}These terms are governed by the laws of India.

        {"\n\n"}12. Contact Us
        {"\n"}For any questions or support, please contact us at:
      </Text>

      {"\n"}
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
  container: { flex: 1, backgroundColor: '#fff', padding: 20 },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 15, color: '#000' },
  content: { fontSize: 16, color: '#333', lineHeight: 24 },
  link: {
    color: '#1E88E5',
  },
});

export default TermsScreen;
