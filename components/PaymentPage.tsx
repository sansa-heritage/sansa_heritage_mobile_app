import { useNavigation, useRoute } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import React, { useState } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  Share,
  ActivityIndicator,
} from 'react-native';
import { RootStackParamList } from './(tabs)/types';
import Ionicons from 'react-native-vector-icons/Ionicons';

// Types for route params
type SuccessPageParams = {
  amount?: number;
  orderId?: string;
  paymentId?: string;
  paymentStatus?: 'success' | 'failed' | 'pending';
  paymentMethod?: 'razorpay' | 'cod';
};

const SuccessPage: React.FC = () => {
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();
  const route = useRoute();
  const [loading, setLoading] = useState(false);

  // Get payment details from route params
  const {
    amount = 0,
    orderId = `ORD${Date.now()}`,
    paymentId = `PAY${Date.now()}`,
    paymentStatus = 'success',
    paymentMethod = 'razorpay',
  } = (route.params as SuccessPageParams) || {};

  const isSuccess = paymentStatus === 'success';
  const displayAmount = amount || 0;

  const gotToHome = () => {
    navigation.navigate('Dashboard');
  };

  const handleShareReceipt = async () => {
    const receiptMessage = `
      🧡 Sansa Heritage Hub - Payment Receipt
      ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
      Order ID: ${orderId}
      Payment ID: ${paymentId}
      Amount: ₹${displayAmount}
      Date: ${new Date().toLocaleString()}
      Status: ${isSuccess ? '✅ Success' : '❌ Failed'}
      Payment Method: ${
        paymentMethod === 'razorpay' ? 'Razorpay' : 'Cash on Delivery'
      }
      ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
      Thank you for shopping with us! 🎉
    `;

    try {
      await Share.share({
        message: receiptMessage,
        title: 'Payment Receipt - Sansa Heritage Hub',
      });
    } catch (error) {
      Alert.alert('Error', 'Could not share receipt');
    }
  };

  const handleDownloadReceipt = () => {
    // Create receipt content for display
    const receiptContent = `
      Sansa Heritage Hub - Payment Receipt
      ----------------------------------------
      Order ID: ${orderId}
      Payment ID: ${paymentId}
      Amount: ₹${displayAmount}
      Date: ${new Date().toLocaleString()}
      Status: ${isSuccess ? 'Success' : 'Failed'}
      Payment Method: ${
        paymentMethod === 'razorpay' ? 'Razorpay' : 'Cash on Delivery'
      }
      ----------------------------------------
      Thank you for shopping with us!
    `;

    Alert.alert('Receipt Details', receiptContent, [
      { text: 'Copy', onPress: () => console.log('Receipt copied') },
      { text: 'Share', onPress: handleShareReceipt },
      { text: 'Close', style: 'cancel' },
    ]);
  };

  const handleRetryPayment = () => {
    setLoading(true);
    // Navigate back to checkout for retry
    navigation.navigate('CheckoutPage', { billingDetails: displayAmount });
    setLoading(false);
  };

  const handleContactSupport = () => {
    Alert.alert('Contact Support', 'How would you like to contact us?', [
      { text: 'Email', onPress: () => console.log('Email support') },
      { text: 'WhatsApp', onPress: () => console.log('WhatsApp support') },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  // If payment failed
  if (!isSuccess) {
    return (
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.failedIcon}>
          <Ionicons name="close-circle-outline" size={80} color="#E53935" />
        </View>
        <Text style={styles.failedTitle}>Payment Failed!</Text>
        <Text style={styles.message}>
          Your payment of ₹{displayAmount} could not be processed. Please try
          again or contact support.
        </Text>

        <TouchableOpacity
          style={styles.button}
          onPress={handleRetryPayment}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Retry Payment</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.supportButton}
          onPress={handleContactSupport}
        >
          <Ionicons name="headset-outline" size={20} color="#151515" />
          <Text style={styles.supportButtonText}>Contact Support</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.backButton} onPress={gotToHome}>
          <Text style={styles.backButtonColor}>Back to Home</Text>
        </TouchableOpacity>
      </ScrollView>
    );
  }

  // Payment success UI
  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.successIcon}>
        <Image
          source={require('../assets/images/giphy.gif')}
          style={styles.image}
        />
      </View>
      <Text style={styles.title}>Congratulations! 🎉</Text>
      <Text style={styles.message}>
        Your payment of ₹{displayAmount} has been successfully processed!
      </Text>

      {/* Order Details Section */}
      <View style={styles.detailsCard}>
        <Text style={styles.detailsTitle}>Order Details</Text>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Order ID:</Text>
          <Text style={styles.detailValue}>{orderId}</Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Payment ID:</Text>
          <Text style={styles.detailValue}>{paymentId}</Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Amount Paid:</Text>
          <Text style={styles.detailValue}>₹{displayAmount}</Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Payment Method:</Text>
          <Text style={styles.detailValue}>
            {paymentMethod === 'razorpay' ? 'Razorpay' : 'Cash on Delivery'}
          </Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Date:</Text>
          <Text style={styles.detailValue}>{new Date().toLocaleString()}</Text>
        </View>
      </View>

      {/* Action Buttons */}
      <TouchableOpacity style={styles.button} onPress={handleDownloadReceipt}>
        <Ionicons name="document-text-outline" size={20} color="#fff" />
        <Text style={styles.buttonText}>Get Receipt</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.shareButton} onPress={handleShareReceipt}>
        <Ionicons name="share-social-outline" size={20} color="#151515" />
        <Text style={styles.shareButtonText}>Share Receipt</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.backButton} onPress={gotToHome}>
        <Text style={styles.backButtonColor}>Continue Shopping</Text>
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
    paddingVertical: 20,
  },
  successIcon: {
    marginBottom: 32,
  },
  failedIcon: {
    marginBottom: 32,
    alignItems: 'center',
  },
  image: {
    width: 100,
    height: 100,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#000',
  },
  failedTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#E53935',
  },
  message: {
    fontSize: 16,
    marginBottom: 32,
    textAlign: 'center',
    paddingHorizontal: 40,
    color: '#666',
  },
  detailsCard: {
    backgroundColor: '#f8f8f8',
    borderRadius: 12,
    padding: 16,
    width: '85%',
    marginBottom: 24,
  },
  detailsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#000',
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  detailLabel: {
    fontSize: 14,
    color: '#666',
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#000',
  },
  button: {
    backgroundColor: '#151515',
    padding: 16,
    borderRadius: 33,
    width: '80%',
    alignItems: 'center',
    marginTop: 5,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  shareButton: {
    backgroundColor: '#f0f0f0',
    padding: 16,
    borderRadius: 33,
    width: '80%',
    alignItems: 'center',
    marginTop: 10,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  shareButtonText: {
    color: '#151515',
    fontSize: 16,
    fontWeight: '500',
  },
  supportButton: {
    backgroundColor: '#f0f0f0',
    padding: 16,
    borderRadius: 33,
    width: '80%',
    alignItems: 'center',
    marginTop: 10,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  supportButtonText: {
    color: '#151515',
    fontSize: 16,
    fontWeight: '500',
  },
  backButton: {
    backgroundColor: '#FFE9E2',
    padding: 16,
    borderRadius: 33,
    width: '80%',
    alignItems: 'center',
    marginTop: 10,
  },
  backButtonColor: {
    color: '#F67952',
    fontSize: 16,
    fontWeight: '500',
  },
  buttonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '500',
  },
});

export default SuccessPage;
