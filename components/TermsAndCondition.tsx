import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';

const TermsScreen = () => {
  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Terms & Conditions</Text>
      <Text style={styles.content}>
        Welcome to our e-commerce app. By using our platform, you agree to the following terms:
        {"\n\n"}1. Users must provide accurate information during registration.
        {"\n"}2. All purchases are subject to product availability.
        {"\n"}3. We reserve the right to update prices, promotions, and content at any time.
        {"\n\n"}Return & Refund Policy:
        {"\n"}- Returns are accepted within 7 days of delivery for damaged or incorrect items.
        {"\n"}- Refunds will be processed within 5-7 business days after receiving the returned item.
        {"\n"}- Certain items like gift cards or final sale products are non-refundable.
        {"\n\n"}For further assistance, please contact our customer support.
      </Text>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', padding: 20 },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 15, color: '#000' },
  content: { fontSize: 16, color: '#333', lineHeight: 24 },
});

export default TermsScreen;
