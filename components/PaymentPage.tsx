import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { RootStackParamList } from './(tabs)/types';

const SuccessPage: React.FC = () => {
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();
  const gotToHome = () => {
    navigation.navigate('Dashboard');
  }
  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.successIcon}>
        <Image source={require('../assets/images/giphy.gif')} style={styles.image} />
      </View>
      <Text style={styles.title}>Congratulations!</Text>
      <Text style={styles.message}>
        Payment is the transfer of money services in exchange product or Payments
      </Text>
      <TouchableOpacity style={styles.button} onPress={() => { /* Handle get receipt action */ }}>
        <Text style={styles.buttonText}>Get your receipt</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.backButton} onPress={gotToHome}>
        <Text style={styles.backButtonColor}>Back to Home</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingVertical: 20, // Add some vertical padding
  },
  successIcon: {
    marginBottom: 32,
  },
  image: {
    width: 100, // Adjust width as needed
    height: 100, // Adjust height as needed
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  message: {
    fontSize: 16,
    marginBottom: 32,
    textAlign: 'center',
  },
  button: {
    backgroundColor: '#151515',
    padding: 16,
    borderRadius: 33,
    width: '80%',
    alignItems: 'center',
    marginTop: 5,
  },
  backButton: {
    backgroundColor: '#FFE9E2',
    padding: 16,
    borderRadius: 33,
    width: '80%',
    alignItems: 'center',
    marginTop: 10, // Add some space between buttons
  },
  backButtonColor: {
    color: '#F67952',
  },
  buttonText: {
    color: 'white',
    fontSize: 18,
  },
});

export default SuccessPage;
