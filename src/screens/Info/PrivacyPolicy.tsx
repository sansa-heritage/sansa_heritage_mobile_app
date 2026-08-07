import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';

const PrivacyPolicy = () => {
  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Privacy Policy</Text>

      <Text style={styles.sectionTitle}>1. Introduction</Text>
      <Text style={styles.text}>
        Welcome to our application. Your privacy is important to us. This Privacy Policy explains
        how we collect, use, and protect your information.
      </Text>

      <Text style={styles.sectionTitle}>2. Information We Collect</Text>
      <Text style={styles.text}>
        We may collect personal information such as name, email, and usage data to improve our services.
      </Text>

      <Text style={styles.sectionTitle}>3. How We Use Your Information</Text>
      <Text style={styles.text}>
        We use your information to personalize your experience, improve our app, and provide customer support.
      </Text>

      <Text style={styles.sectionTitle}>4. Contact Us</Text>
      <Text style={styles.text}>
        If you have any questions about this Privacy Policy, please contact us at support@example.com.
      </Text>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 15,
  },
  text: {
    fontSize: 14,
    lineHeight: 20,
    marginTop: 5,
  },
});

export default PrivacyPolicy;
