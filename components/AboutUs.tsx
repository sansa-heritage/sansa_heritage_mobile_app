import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';

const AboutUs = () => {
  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>About Excom</Text>

      <Text style={styles.sectionTitle}>Who We Are</Text>
      <Text style={styles.text}>
        Excom is a leading technology company committed to providing innovative solutions that enhance productivity and efficiency. 
        We specialize in delivering high-quality software applications tailored to meet our customers' needs.
      </Text>

      <Text style={styles.sectionTitle}>Our Mission</Text>
      <Text style={styles.text}>
        Our mission is to empower businesses and individuals with cutting-edge digital tools. We strive to make technology accessible, 
        user-friendly, and impactful for our users worldwide.
      </Text>

      <Text style={styles.sectionTitle}>Our Vision</Text>
      <Text style={styles.text}>
        We envision a future where technology seamlessly integrates with daily life, making it easier, more efficient, and more secure.
      </Text>

      <Text style={styles.sectionTitle}>Contact Us</Text>
      <Text style={styles.text}>
        📍 Address: 123 Excom Street, Tech City, TX 75001
      </Text>
      <Text style={styles.text}>
        📧 Email: support@excomapp.com
      </Text>
      <Text style={styles.text}>
        📞 Phone: +1 234 567 8901
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
    color: '#333',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 15,
    color: '#555',
  },
  text: {
    fontSize: 14,
    lineHeight: 20,
    marginTop: 5,
    color: '#666',
  },
});

export default AboutUs;
